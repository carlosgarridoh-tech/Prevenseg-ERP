import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { supabase } from '../../config/supabase.js';
import { carpetaPlantillas } from './upload.config.js';
import { llenarDocx, llenarXlsx, convertirAPdf, datosAlumnoParaPlantilla } from './generador.js';

const REQUIERE_PDF = ['certificado', 'alumno_regular', 'cotizacion']; // Documentos C, D, E (RF: exportar obligatoriamente en PDF)
const NOMBRES_TIPO = {
  spd: 'Inicio-Termino-SPD',
  os10: 'Inicio-Termino-OS10',
  certificado: 'Certificado-Aprobacion',
  alumno_regular: 'Certificado-Alumno-Regular',
  cotizacion: 'Cotizacion'
};
const TIPOS_MIME = {
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pdf: 'application/pdf'
};

// GET /api/documentos/recursos?curso_id=  -> listado para el staff (con filtro opcional)
export async function listarRecursos(req, res) {
  let query = supabase.from('recursos_curso').select('*, cursos(nombre_curso)').order('created_at', { ascending: false });
  if (req.query.curso_id) query = query.eq('curso_id', req.query.curso_id);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

// POST /api/documentos/recursos  (multipart: archivo + curso_id opcional + categoria)
export async function subirRecurso(req, res) {
  if (!req.file) return res.status(400).json({ error: 'Debes adjuntar un archivo' });
  const { curso_id, categoria } = req.body;

  const { data, error } = await supabase
    .from('recursos_curso')
    .insert({ curso_id: curso_id || null, nombre_original: req.file.originalname, ruta_archivo: req.file.path, categoria: categoria || 'Otro' })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
}

// DELETE /api/documentos/recursos/:id
export async function eliminarRecurso(req, res) {
  const { error } = await supabase.from('recursos_curso').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ ok: true });
}
// GET /api/documentos/plantillas
export async function listarPlantillas(req, res) {
  const { data, error } = await supabase.from('plantillas').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

// POST /api/documentos/plantillas  (multipart: archivo + tipo)  -- solo administrador
export async function subirPlantilla(req, res) {
  const { tipo } = req.body;
  if (!req.file) return res.status(400).json({ error: 'Debes adjuntar un archivo' });

  const formato = req.file.originalname.endsWith('.xlsx') ? 'xlsx' : 'docx';

  const { data: existente } = await supabase.from('plantillas').select('ruta_archivo').eq('tipo', tipo).single();
  if (existente) fs.existsSync(existente.ruta_archivo) && fs.unlinkSync(existente.ruta_archivo);

  const { data, error } = await supabase
    .from('plantillas')
    .upsert({ tipo, nombre_original: req.file.originalname, ruta_archivo: req.file.path, formato }, { onConflict: 'tipo' })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
}

// Trabajos de generación en curso, guardados en memoria mientras dura el proceso
const trabajos = {};

function limpiarTrabajoLuego(jobId) {
  setTimeout(() => delete trabajos[jobId], 10 * 60 * 1000); // se olvida solo tras 10 min
}

// POST /api/documentos/generar  { tipo, curso_id, alumno_ids: [] }
// Responde de inmediato con un jobId y genera los documentos en segundo plano,
// para que la persona pueda seguir usando el sistema mientras se generan.
export async function generar(req, res) {
  const { tipo, alumno_ids } = req.body;

  const { data: plantilla } = await supabase.from('plantillas').select('*').eq('tipo', tipo).single();
  if (!plantilla) return res.status(404).json({ error: 'Aún no se ha cargado una plantilla para este tipo de documento' });

  const { data: alumnos, error } = await supabase
    .from('alumnos')
    .select('*, cursos(nombre_curso, fecha_inicio, fecha_termino)')
    .in('id', alumno_ids);
  if (error) return res.status(500).json({ error: error.message });

  const jobId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  trabajos[jobId] = { estado: 'procesando', hechos: 0, total: alumnos.length, tipo, error: null, archivos: null };
  res.status(202).json({ jobId, total: alumnos.length });

  // A partir de aquí corre en segundo plano; la respuesta HTTP ya se envió arriba.
  (async () => {
    const archivosGenerados = [];
    try {
      for (const alumno of alumnos) {
        const datos = datosAlumnoParaPlantilla(alumno);
        let buffer;
        let extension = plantilla.formato;
        let fallaConversion = false;

        if (plantilla.formato === 'docx') {
          buffer = llenarDocx(plantilla.ruta_archivo, datos);
        } else {
          buffer = await llenarXlsx(plantilla.ruta_archivo, datos);
        }

        if (REQUIERE_PDF.includes(tipo)) {
          try {
            buffer = await convertirAPdf(buffer, extension);
            extension = 'pdf';
          } catch (e) {
            console.error('No se pudo convertir a PDF (¿LibreOffice instalado?):', e.message);
            fallaConversion = true;
          }
        }

        const nombreArchivo = `${NOMBRES_TIPO[tipo]}-${alumno.rut}.${extension}`;
        archivosGenerados.push({ nombre: nombreArchivo, buffer, fallaConversion });
        trabajos[jobId].hechos++;
      }

      trabajos[jobId].estado = 'listo';
      trabajos[jobId].archivos = archivosGenerados;
    } catch (e) {
      const detalle = e.properties?.errors?.[0]?.properties?.explanation || e.message;
      trabajos[jobId].estado = 'error';
      trabajos[jobId].error = `Error en la plantilla: ${detalle}`;
    }
    limpiarTrabajoLuego(jobId);
  })();
}

// GET /api/documentos/generar/:jobId/estado
export function estadoGenerar(req, res) {
  const trabajo = trabajos[req.params.jobId];
  if (!trabajo) return res.status(404).json({ error: 'Ese trabajo ya no existe (puede que haya expirado)' });
  res.json({ estado: trabajo.estado, hechos: trabajo.hechos, total: trabajo.total, error: trabajo.error });
}

// GET /api/documentos/generar/:jobId/descargar
export function descargarGenerar(req, res) {
  const trabajo = trabajos[req.params.jobId];
  if (!trabajo || trabajo.estado !== 'listo') return res.status(404).json({ error: 'El documento aún no está listo' });

  const { archivos } = trabajo;

  if (archivos.length === 1) {
    const [archivo] = archivos;
    const extension = archivo.nombre.split('.').pop();
    res.setHeader('Content-Type', TIPOS_MIME[extension] || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${archivo.nombre}"`);
    res.setHeader('X-Pdf-Fallo', archivo.fallaConversion ? '1' : '0');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, X-Pdf-Fallo');
    return res.end(archivo.buffer);
  }

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${NOMBRES_TIPO[trabajo.tipo]}.zip"`);
  const zip = archiver('zip');
  zip.pipe(res);
  archivos.forEach((a) => zip.append(a.buffer, { name: a.nombre }));
  zip.finalize();
}

import { supabase } from '../../config/supabase.js';
import { llenarDocx, convertirAPdf, datosAlumnoParaPlantilla } from '../documentos/generador.js';

async function obtenerMiRegistro(req) {
  if (!req.user.alumno_id) throw new Error('Esta cuenta no está vinculada a un alumno');
  const { data, error } = await supabase
    .from('alumnos')
    .select('*, cursos(id, nombre_curso, tipo_curso, fecha_inicio, fecha_termino, valor), pagos(monto, anulado)')
    .eq('id', req.user.alumno_id)
    .single();
  if (error) throw new Error('No se encontró tu ficha de alumno');
  return data;
}

function conEstadoFinanciero(alumno) {
  const valorCurso = alumno.cursos?.valor || 0;
  const pagado = (alumno.pagos || []).filter((p) => !p.anulado).reduce((acc, p) => acc + Number(p.monto), 0);
  let estadoFinanciero = null;
  if (alumno.curso_id && valorCurso) {
    estadoFinanciero = pagado >= valorCurso ? 'Al día' : pagado > 0 ? 'Pago pendiente' : 'Moroso';
  }
  return { ...alumno, totalPagado: pagado, saldoPendiente: valorCurso - pagado, estadoFinanciero };
}

export async function misDatos(req, res) {
  try {
    const alumno = await obtenerMiRegistro(req);
    res.json(conEstadoFinanciero(alumno));
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
}

export async function miHorario(req, res) {
  try {
    const alumno = await obtenerMiRegistro(req);
    if (!alumno.curso_id) return res.json([]);
    const { data, error } = await supabase
      .from('horario_bloques')
      .select('*, relatores(nombre)')
      .eq('curso_id', alumno.curso_id)
      .order('fecha')
      .order('hora_inicio');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
}

export async function listarComentarios(req, res) {
  try {
    const alumno = await obtenerMiRegistro(req);
    const { data, error } = await supabase
      .from('comentarios_curso')
      .select('*, alumnos(nombres, apellido_paterno)')
      .eq('curso_id', alumno.curso_id)
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
}

export async function crearComentario(req, res) {
  try {
    const alumno = await obtenerMiRegistro(req);
    if (!req.body.mensaje) return res.status(400).json({ error: 'El comentario no puede estar vacío' });
    const { data, error } = await supabase
      .from('comentarios_curso')
      .insert({ alumno_id: alumno.id, curso_id: alumno.curso_id, mensaje: req.body.mensaje })
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
}

export async function miCertificado(req, res) {
  try {
    const alumno = await obtenerMiRegistro(req);
    const tipo = req.query.tipo || 'alumno_regular';

    const { data: plantilla } = await supabase.from('plantillas').select('*').eq('tipo', tipo).single();
    if (!plantilla) return res.status(404).json({ error: 'Este documento aún no está disponible' });

    const datos = datosAlumnoParaPlantilla(alumno);
    let buffer = llenarDocx(plantilla.ruta_archivo, datos);
    let extension = 'docx';

    try {
      buffer = await convertirAPdf(buffer, 'docx');
      extension = 'pdf';
    } catch (e) {
      console.error('No se pudo convertir a PDF:', e.message);
    }

    res.setHeader('Content-Disposition', `attachment; filename="${tipo}-${alumno.rut}.${extension}"`);
    res.end(buffer);
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
}

// GET /api/portal/avisos -> avisos que el administrador le envió a este alumno
export async function misAvisos(req, res) {
  try {
    const alumno = await obtenerMiRegistro(req);
    const { data, error } = await supabase
      .from('avisos_alumno')
      .select('*')
      .eq('alumno_id', alumno.id)
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
}

// GET /api/portal/recursos -> documentos generales cargados por el administrador (de su curso o globales)
export async function misRecursos(req, res) {
  try {
    const alumno = await obtenerMiRegistro(req);
    const { data, error } = await supabase
      .from('recursos_curso')
      .select('*')
      .or(`curso_id.eq.${alumno.curso_id || 0},curso_id.is.null`)
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
}

// GET /api/portal/recursos/:id/descargar
export async function descargarRecurso(req, res) {
  const { data: recurso, error } = await supabase.from('recursos_curso').select('*').eq('id', req.params.id).single();
  if (error || !recurso) return res.status(404).json({ error: 'Documento no encontrado' });
  res.download(recurso.ruta_archivo, recurso.nombre_original);
}

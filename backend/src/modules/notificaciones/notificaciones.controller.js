import { supabase } from '../../config/supabase.js';
import { enviarCorreo } from './email.service.js';
import { obtenerEstadoWhatsapp, enviarWhatsapp, reiniciarConexionWhatsapp } from './whatsapp.service.js';

// GET /api/notificaciones/whatsapp/estado
export function estadoWhatsapp(req, res) {
  res.json(obtenerEstadoWhatsapp());
}

// POST /api/notificaciones/whatsapp/reiniciar
export async function reiniciarWhatsapp(req, res) {
  const resultado = await reiniciarConexionWhatsapp();
  res.json(resultado);
}

// POST /api/notificaciones/enviar  { medio, alumno_ids, mensaje, asunto }
export async function enviar(req, res) {
  const { medio, alumno_ids, mensaje, asunto } = req.body;
  if (!mensaje || !alumno_ids?.length) return res.status(400).json({ error: 'Falta el mensaje o los destinatarios' });

  const { data: alumnos, error } = await supabase.from('alumnos').select('*').in('id', alumno_ids);
  if (error) return res.status(500).json({ error: error.message });

  const resultados = [];

  for (const alumno of alumnos) {
    try {
      if (medio === 'correo') {
        if (!alumno.correo) throw new Error('Sin correo registrado');
        await enviarCorreo({ para: alumno.correo, asunto: asunto || 'Prevenseg Capacitación', mensaje });
      } else {
        if (!alumno.telefono) throw new Error('Sin teléfono registrado');
        await enviarWhatsapp({ telefono: alumno.telefono, mensaje });
      }
      resultados.push({ alumno: `${alumno.nombres} ${alumno.apellido_paterno}`, ok: true });
    } catch (e) {
      resultados.push({ alumno: `${alumno.nombres} ${alumno.apellido_paterno}`, ok: false, error: e.message });
    }
  }

  res.json({ resultados });
}

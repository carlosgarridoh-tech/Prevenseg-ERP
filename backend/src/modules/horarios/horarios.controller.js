import { supabase } from '../../config/supabase.js';

function seSuperponen(aIni, aFin, bIni, bFin) {
  return aIni < bFin && aFin > bIni;
}

// Evita que dos bloques del MISMO curso se crucen el mismo día (estructura del horario)
async function haySolapeEnCurso({ curso_id, fecha, hora_inicio, hora_fin, excluirId }) {
  let query = supabase.from('horario_bloques').select('id, hora_inicio, hora_fin').eq('curso_id', curso_id).eq('fecha', fecha);
  if (excluirId) query = query.neq('id', excluirId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data.some((b) => seSuperponen(hora_inicio, hora_fin, b.hora_inicio, b.hora_fin));
}

// Evita que un mismo relator quede asignado a dos clases al mismo tiempo (en cualquier curso). RF-PLA-03.
async function hayTraslapeRelator({ relator_id, fecha, hora_inicio, hora_fin, excluirId }) {
  if (!relator_id) return false;

  let query = supabase.from('horario_bloques').select('id, hora_inicio, hora_fin').eq('relator_id', relator_id).eq('fecha', fecha);
  if (excluirId) query = query.neq('id', excluirId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return data.some((b) => seSuperponen(hora_inicio, hora_fin, b.hora_inicio, b.hora_fin));
}

// GET /api/horarios/curso/:cursoId
export async function porCurso(req, res) {
  const { data, error } = await supabase
    .from('horario_bloques')
    .select('*, relatores(nombre)')
    .eq('curso_id', req.params.cursoId)
    .order('fecha')
    .order('hora_inicio');

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

// POST /api/horarios
export async function crear(req, res) {
  try {
    if (await haySolapeEnCurso(req.body)) {
      return res.status(409).json({ error: 'Ese horario se cruza con otro bloque ya creado en este curso' });
    }
    if (await hayTraslapeRelator(req.body)) {
      return res.status(409).json({ error: 'El relator ya tiene otra clase asignada en ese horario' });
    }
    const { data, error } = await supabase.from('horario_bloques').insert(req.body).select().single();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// PUT /api/horarios/:id
export async function actualizar(req, res) {
  try {
    const datos = { ...req.body, excluirId: req.params.id };
    if (await haySolapeEnCurso(datos)) {
      return res.status(409).json({ error: 'Ese horario se cruza con otro bloque ya creado en este curso' });
    }
    if (await hayTraslapeRelator(datos)) {
      return res.status(409).json({ error: 'El relator ya tiene otra clase asignada en ese horario' });
    }
    const { id, relatores, ...datosLimpios } = req.body;
    const { data, error } = await supabase.from('horario_bloques').update(datosLimpios).eq('id', req.params.id).select().single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// DELETE /api/horarios/:id
export async function eliminar(req, res) {
  const { error } = await supabase.from('horario_bloques').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ ok: true });
}

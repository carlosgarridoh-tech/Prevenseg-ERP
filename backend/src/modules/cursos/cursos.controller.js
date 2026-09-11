import { supabase } from '../../config/supabase.js';

// Recalcula el estado del curso según las fechas (activo / iniciado / terminado)
function calcularEstado(fecha_inicio, fecha_termino) {
  const hoy = new Date();
  const inicio = new Date(fecha_inicio);
  const termino = new Date(fecha_termino);
  if (hoy < inicio) return 'activo';
  if (hoy >= inicio && hoy <= termino) return 'iniciado';
  return 'terminado';
}

// GET /api/cursos  -> panel general con alumnos inscritos incluidos
export async function listar(req, res) {
  const { data, error } = await supabase
    .from('cursos')
    .select('*, alumnos(id, nombres, apellido_paterno, apellido_materno, rut, estado)')
    .order('fecha_inicio', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  // Actualiza el estado calculado sin necesidad de intervención manual
  const conEstado = data.map((c) => ({ ...c, estado: calcularEstado(c.fecha_inicio, c.fecha_termino) }));
  res.json(conEstado);
}

export async function obtener(req, res) {
  const { data, error } = await supabase.from('cursos').select('*, alumnos(*)').eq('id', req.params.id).single();
  if (error) return res.status(404).json({ error: 'Curso no encontrado' });
  res.json(data);
}

export async function crear(req, res) {
  const { data, error } = await supabase.from('cursos').insert(req.body).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
}

export async function actualizar(req, res) {
  const { id, alumnos, ...datos } = req.body;
  const { data, error } = await supabase.from('cursos').update(datos).eq('id', req.params.id).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

export async function eliminar(req, res) {
  const { error } = await supabase.from('cursos').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ ok: true });
}

import { supabase } from '../../config/supabase.js';

// GET /api/relatores  -> lista con sus cursos asignados y total a pagar
export async function listar(req, res) {
  const { data, error } = await supabase
    .from('relatores')
    .select('*, relator_curso(id, horas_asignadas, cursos(id, nombre_curso))')
    .order('nombre');

  if (error) return res.status(500).json({ error: error.message });

  const conTotales = data.map((r) => ({
    ...r,
    total_horas: r.relator_curso.reduce((acc, rc) => acc + Number(rc.horas_asignadas), 0),
    total_a_pagar: r.relator_curso.reduce((acc, rc) => acc + Number(rc.horas_asignadas) * Number(r.valor_hora), 0)
  }));

  res.json(conTotales);
}

export async function crear(req, res) {
  const { data, error } = await supabase.from('relatores').insert(req.body).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
}

export async function actualizar(req, res) {
  const { id, relator_curso, total_horas, total_a_pagar, ...datos } = req.body;
  const { data, error } = await supabase.from('relatores').update(datos).eq('id', req.params.id).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

export async function eliminar(req, res) {
  const { error } = await supabase.from('relatores').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ ok: true });
}

// POST /api/relatores/:id/asignar  { curso_id, horas_asignadas }
export async function asignar(req, res) {
  const { curso_id, horas_asignadas } = req.body;
  const { data, error } = await supabase
    .from('relator_curso')
    .upsert({ relator_id: req.params.id, curso_id, horas_asignadas }, { onConflict: 'relator_id,curso_id' })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
}

// DELETE /api/relatores/:id/asignar/:cursoId  -> quitar asignación
export async function quitarAsignacion(req, res) {
  const { error } = await supabase
    .from('relator_curso')
    .delete()
    .eq('relator_id', req.params.id)
    .eq('curso_id', req.params.cursoId);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ ok: true });
}

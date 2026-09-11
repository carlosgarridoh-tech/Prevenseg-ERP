import { supabase } from '../../config/supabase.js';

// GET /api/pagos-relatores/relator/:relatorId -> ficha de pago del relator
export async function porRelator(req, res) {
  const { relatorId } = req.params;

  const { data: relator, error: errRelator } = await supabase
    .from('relatores')
    .select('*, relator_curso(horas_asignadas, cursos(id, nombre_curso))')
    .eq('id', relatorId)
    .single();
  if (errRelator) return res.status(404).json({ error: 'Relator no encontrado' });

  const { data: pagos, error } = await supabase
    .from('pagos_relatores')
    .select('*, cursos(nombre_curso)')
    .eq('relator_id', relatorId)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });

  const totalAPagar = (relator.relator_curso || []).reduce((acc, rc) => acc + Number(rc.horas_asignadas) * Number(relator.valor_hora), 0);
  const totalPagado = pagos.reduce((acc, p) => acc + Number(p.monto), 0);

  res.json({ relator, pagos, totalAPagar, totalPagado, saldoPendiente: totalAPagar - totalPagado });
}

// POST /api/pagos-relatores  { relator_id, curso_id, monto, medio_pago, observacion }
export async function registrar(req, res) {
  const { data, error } = await supabase.from('pagos_relatores').insert(req.body).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
}

// DELETE /api/pagos-relatores/:id  (solo administrador, corrige errores de registro)
export async function eliminar(req, res) {
  const { error } = await supabase.from('pagos_relatores').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ ok: true });
}

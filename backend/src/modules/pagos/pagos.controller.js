import { supabase } from '../../config/supabase.js';
import { correlativoEnCurso } from '../alumnos/alumnos.controller.js';

// GET /api/pagos/alumno/:alumnoId  -> historial de pagos + saldo pendiente
export async function porAlumno(req, res) {
  const { alumnoId } = req.params;

  const { data: alumno, error: errAlumno } = await supabase
    .from('alumnos')
    .select('*, cursos(id, nombre_curso, valor)')
    .eq('id', alumnoId)
    .single();
  if (errAlumno) return res.status(404).json({ error: 'Alumno no encontrado' });

  const { data: pagos, error } = await supabase
    .from('pagos')
    .select('*')
    .eq('alumno_id', alumnoId)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });

  const totalPagado = pagos.filter((p) => !p.anulado).reduce((acc, p) => acc + Number(p.monto), 0);
  const valorCurso = alumno.cursos?.valor || 0;
  const saldoPendiente = valorCurso - totalPagado;
  const correlativo = await correlativoEnCurso(alumno);

  res.json({ alumno: { ...alumno, correlativo }, pagos, valorCurso, totalPagado, saldoPendiente });
}

// POST /api/pagos  -> registrar un pago o abono
// GET /api/pagos/curso/:cursoId  -> todos los alumnos del curso con su estado de pago
export async function porCurso(req, res) {
  const { data: alumnos, error } = await supabase
    .from('alumnos')
    .select('*, cursos(nombre_curso, valor), pagos(monto, anulado)')
    .eq('curso_id', req.params.cursoId);

  if (error) return res.status(500).json({ error: error.message });

  const resultado = alumnos.map((a) => {
    const valorCurso = a.cursos?.valor || 0;
    const pagado = (a.pagos || []).filter((p) => !p.anulado).reduce((acc, p) => acc + Number(p.monto), 0);
    const saldo = valorCurso - pagado;
    let estado = 'Moroso';
    if (pagado >= valorCurso && valorCurso > 0) estado = 'Al día';
    else if (pagado > 0) estado = 'Pago pendiente';
    return { ...a, valorCurso, pagado, saldo, estadoFinanciero: estado };
  });

  res.json(resultado);
}

export async function registrar(req, res) {
  const { data, error } = await supabase.from('pagos').insert(req.body).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
}

// PUT /api/pagos/:id/anular  -> solo administrador (soft delete, RF-FIN-03)
export async function anular(req, res) {
  const { motivo } = req.body;
  if (!motivo) return res.status(400).json({ error: 'Debes indicar el motivo de la anulación' });

  const { data, error } = await supabase
    .from('pagos')
    .update({ anulado: true, motivo_anulacion: motivo })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

// GET /api/pagos/config/texto-comprobante
export async function obtenerTextoComprobante(req, res) {
  const { data } = await supabase.from('configuraciones').select('valor').eq('clave', 'texto_comprobante_pago').single();
  res.json({ texto: data?.valor || '' });
}

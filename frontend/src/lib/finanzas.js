// Calcula Al día / Pago pendiente / Moroso a partir de los pagos reales del alumno.
// Devuelve null si el alumno no tiene curso asignado (no aplica).
export function estadoFinancieroAlumno(alumno) {
  const valorCurso = alumno.cursos?.valor || 0;
  if (!alumno.curso_id || !valorCurso) return null;
  const pagado = (alumno.pagos || []).filter((p) => !p.anulado).reduce((acc, p) => acc + Number(p.monto), 0);
  if (pagado >= valorCurso) return 'Al día';
  if (pagado > 0) return 'Pago pendiente';
  return 'Moroso';
}

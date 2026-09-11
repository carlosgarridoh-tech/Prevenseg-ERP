// Convierte una fecha "2026-08-10" (como la guarda la base de datos) a "10/08/2026"
export function formatearFecha(fechaStr) {
  if (!fechaStr) return '';
  const [anio, mes, dia] = fechaStr.split('-');
  if (!dia) return fechaStr;
  return `${dia}/${mes}/${anio}`;
}

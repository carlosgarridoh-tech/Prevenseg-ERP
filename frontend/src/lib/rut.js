// Valida un RUT chileno (con o sin puntos, con guión), calculando el dígito verificador
export function validarRut(rutCompleto) {
  if (!rutCompleto) return false;
  const limpio = rutCompleto.replace(/\./g, '').replace(/-/g, '').trim();
  if (limpio.length < 2) return false;

  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1).toUpperCase();
  if (!/^\d+$/.test(cuerpo)) return false;

  let suma = 0;
  let multiplo = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * multiplo;
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }
  const resto = 11 - (suma % 11);
  const dvEsperado = resto === 11 ? '0' : resto === 10 ? 'K' : String(resto);

  return dv === dvEsperado;
}

// Si el texto parece un RUT completo (solo dígitos + dígito verificador), lo formatea
// igual que se guarda en la base de datos, para que la búsqueda lo encuentre.
export function normalizarSiEsRut(texto) {
  const limpio = texto.replace(/\./g, '').replace(/-/g, '').trim();
  if (/^[0-9]{7,8}[0-9kK]$/.test(limpio)) {
    return formatearRut(limpio);
  }
  return texto;
}
export function formatearRut(rutCompleto) {
  const limpio = rutCompleto.replace(/\./g, '').replace(/-/g, '').trim();
  if (limpio.length < 2) return rutCompleto;
  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1).toUpperCase();
  const cuerpoFormateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${cuerpoFormateado}-${dv}`;
}

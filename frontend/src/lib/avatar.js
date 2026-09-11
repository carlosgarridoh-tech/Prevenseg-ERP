const PALETA = [
  { bg: 'bg-red-100', text: 'text-red-700' },
  { bg: 'bg-blue-100', text: 'text-blue-700' },
  { bg: 'bg-green-100', text: 'text-green-700' },
  { bg: 'bg-amber-100', text: 'text-amber-700' },
  { bg: 'bg-purple-100', text: 'text-purple-700' },
  { bg: 'bg-teal-100', text: 'text-teal-700' }
];

export function iniciales(nombreCompleto) {
  const partes = (nombreCompleto || '').trim().split(/\s+/);
  const primera = partes[0]?.[0] || '';
  const segunda = partes[1]?.[0] || '';
  return (primera + segunda).toUpperCase();
}

// Siempre devuelve el mismo color para el mismo nombre (no aleatorio en cada render)
export function colorAvatar(nombreCompleto) {
  const texto = nombreCompleto || '';
  let hash = 0;
  for (let i = 0; i < texto.length; i++) hash = texto.charCodeAt(i) + ((hash << 5) - hash);
  return PALETA[Math.abs(hash) % PALETA.length];
}

// Clases de color para badges de estado, agrupando por significado (positivo/alerta/neutro)
const ESTADOS_POSITIVOS = ['activo', 'al día', 'aprobado', 'egresado', 'pagada', 'vigente', 'certificado emitido'];
const ESTADOS_ALERTA = ['moroso', 'pago pendiente', 'vencida', 'cancelada', 'suspendido', 'anulado'];

export function claseBadgeEstado(estado) {
  const valor = (estado || '').toLowerCase();
  if (ESTADOS_POSITIVOS.some((e) => valor.includes(e))) return 'bg-green-100 text-green-700';
  if (ESTADOS_ALERTA.some((e) => valor.includes(e))) return 'bg-red-100 text-red-700';
  return 'bg-amber-100 text-amber-700';
}

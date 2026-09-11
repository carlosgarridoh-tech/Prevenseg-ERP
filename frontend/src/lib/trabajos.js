import { reactive } from 'vue';
import api from './api.js';

// Estado compartido por toda la app: si hay un documento generándose, esta barra
// de progreso sigue visible aunque la persona cambie de pantalla mientras espera.
export const trabajoActivo = reactive({
  visible: false,
  jobId: null,
  etiqueta: '',
  hechos: 0,
  total: 0,
  estado: '', // procesando | listo | error
  error: '',
  segundos: 0
});

let temporizador = null;
let sondeo = null;

export function iniciarTrabajo(jobId, etiqueta, total) {
  trabajoActivo.visible = true;
  trabajoActivo.jobId = jobId;
  trabajoActivo.etiqueta = etiqueta;
  trabajoActivo.hechos = 0;
  trabajoActivo.total = total;
  trabajoActivo.estado = 'procesando';
  trabajoActivo.error = '';
  trabajoActivo.segundos = 0;

  clearInterval(temporizador);
  temporizador = setInterval(() => trabajoActivo.segundos++, 1000);

  clearInterval(sondeo);
  sondeo = setInterval(async () => {
    try {
      const { data } = await api.get(`/documentos/generar/${jobId}/estado`);
      trabajoActivo.hechos = data.hechos;
      trabajoActivo.total = data.total;
      trabajoActivo.estado = data.estado;
      trabajoActivo.error = data.error || '';

      if (data.estado === 'listo') {
        clearInterval(sondeo);
        clearInterval(temporizador);
        await descargarResultado(jobId);
      } else if (data.estado === 'error') {
        clearInterval(sondeo);
        clearInterval(temporizador);
      }
    } catch (e) {
      clearInterval(sondeo);
      clearInterval(temporizador);
      trabajoActivo.estado = 'error';
      trabajoActivo.error = 'Se perdió la conexión con el servidor';
    }
  }, 1500);
}

async function descargarResultado(jobId) {
  const respuesta = await api.get(`/documentos/generar/${jobId}/descargar`, { responseType: 'blob' });
  const nombre = respuesta.headers['content-disposition']?.match(/filename="(.+)"/)?.[1] || 'documento';
  const url = URL.createObjectURL(respuesta.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.click();
}

export function cerrarTrabajo() {
  trabajoActivo.visible = false;
  clearInterval(temporizador);
  clearInterval(sondeo);
}

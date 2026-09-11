import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

let client = null;
let ultimoQr = null;
let estado = 'desconectado'; // desconectado | conectando | esperando_qr | conectado | error
let ultimoError = '';
let yaIntentado = false;

const RUTA_SESION = path.resolve('uploads/whatsapp-sesion');

function borrarCarpetaSesion() {
  try {
    if (fs.existsSync(RUTA_SESION)) fs.rmSync(RUTA_SESION, { recursive: true, force: true });
  } catch (e) {
    console.error('No se pudo borrar la carpeta de sesión de WhatsApp:', e.message);
  }
}

function iniciarCliente() {
  if (client || yaIntentado) return;
  yaIntentado = true;
  estado = 'conectando';

  const opcionesPuppeteer = { args: ['--no-sandbox', '--disable-setuid-sandbox'] };
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    opcionesPuppeteer.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  client = new Client({
    authStrategy: new LocalAuth({ dataPath: RUTA_SESION }),
    puppeteer: opcionesPuppeteer
  });

  client.on('qr', async (qr) => {
    estado = 'esperando_qr';
    ultimoQr = await QRCode.toDataURL(qr);
  });

  client.on('ready', () => {
    estado = 'conectado';
    ultimoQr = null;
    console.log('WhatsApp vinculado y listo');
  });

  client.on('disconnected', () => {
    estado = 'desconectado';
    client = null;
    yaIntentado = false;
  });

  client.initialize().catch((e) => {
    console.error('No se pudo iniciar WhatsApp:', e.message);
    ultimoError = e.message;
    client = null;
    estado = 'error';
  });
}

async function cerrarOrdenadamente() {
  if (client) {
    try {
      await client.destroy();
    } catch (e) {
      // Ignoramos errores al cerrar
    }
  }
  process.exit(0);
}
['SIGINT', 'SIGTERM', 'SIGUSR2'].forEach((señal) => process.once(señal, cerrarOrdenadamente));

export function obtenerEstadoWhatsapp() {
  iniciarCliente();
  return { estado, qr: ultimoQr, error: estado === 'error' ? ultimoError : null };
}

export async function reiniciarConexionWhatsapp() {
  if (client) {
    try {
      await client.destroy();
    } catch (e) {
      // Ignoramos
    }
  }
  client = null;
  yaIntentado = false;
  estado = 'desconectado';
  ultimoQr = null;
  ultimoError = '';
  borrarCarpetaSesion();
  iniciarCliente();
  return { estado, qr: ultimoQr };
}

export async function enviarWhatsapp({ telefono, mensaje }) {
  if (estado !== 'conectado') throw new Error('WhatsApp no está vinculado todavía. Escanea el código QR primero.');
  const limpio = telefono.replace(/[^0-9]/g, '');
  const numero = limpio.startsWith('56') ? limpio : `56${limpio.replace(/^0/, '')}`;
  return client.sendMessage(`${numero}@c.us`, mensaje);
}

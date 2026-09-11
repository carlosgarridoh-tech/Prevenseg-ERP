import nodemailer from 'nodemailer';
import { supabase } from '../../config/supabase.js';
import 'dotenv/config';

async function obtenerConfig() {
  const { data } = await supabase
    .from('configuraciones')
    .select('clave, valor')
    .in('clave', ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_from']);

  const mapa = {};
  (data || []).forEach((d) => (mapa[d.clave] = d.valor));

  return {
    host: mapa.smtp_host || process.env.SMTP_HOST,
    port: Number(mapa.smtp_port || process.env.SMTP_PORT || 587),
    user: mapa.smtp_user || process.env.SMTP_USER,
    pass: mapa.smtp_pass || process.env.SMTP_PASS,
    from: mapa.smtp_from || process.env.SMTP_FROM || mapa.smtp_user || process.env.SMTP_USER
  };
}

export async function enviarCorreo({ para, asunto, mensaje }) {
  const cfg = await obtenerConfig();
  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.port === 465,
    auth: { user: cfg.user, pass: cfg.pass }
  });

  return transporter.sendMail({ from: cfg.from, to: para, subject: asunto, text: mensaje });
}

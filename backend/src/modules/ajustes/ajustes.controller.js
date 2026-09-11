import archiver from 'archiver';
import { supabase } from '../../config/supabase.js';
import { carpetaPlantillas } from '../documentos/upload.config.js';

export async function listarUsuarios(req, res) {
  const { data: authUsers, error } = await supabase.auth.admin.listUsers();
  if (error) return res.status(500).json({ error: error.message });

  const { data: perfiles } = await supabase.from('profiles').select('*');

  const usuarios = authUsers.users.map((u) => {
    const perfil = perfiles?.find((p) => p.id === u.id);
    return { id: u.id, email: u.email, nombre: perfil?.nombre || '', rol: perfil?.rol || 'ventas' };
  });

  res.json(usuarios);
}

export async function crearUsuario(req, res) {
  const { email, password, nombre, rol } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Correo y contraseña son obligatorios' });

  const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) return res.status(400).json({ error: error.message });

  const { error: errorPerfil } = await supabase.from('profiles').insert({ id: data.user.id, nombre, rol });
  if (errorPerfil) return res.status(400).json({ error: errorPerfil.message });

  res.status(201).json({ id: data.user.id, email, nombre, rol });
}

// DELETE /api/ajustes/usuarios/:id
export async function eliminarUsuario(req, res) {
  const { error } = await supabase.auth.admin.deleteUser(req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ ok: true });
}

// POST /api/ajustes/usuarios/eliminar-varios  { ids: [...] }
export async function eliminarVariosUsuarios(req, res) {
  const { ids } = req.body;
  if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ error: 'No se indicaron usuarios a eliminar' });

  const resultados = [];
  for (const id of ids) {
    const { error } = await supabase.auth.admin.deleteUser(id);
    resultados.push({ id, ok: !error, error: error?.message });
  }
  res.json({ resultados });
}

export async function actualizarUsuario(req, res) {
  const { rol, nombre } = req.body;
  const { error } = await supabase.from('profiles').update({ rol, nombre }).eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ ok: true });
}

// PUT /api/ajustes/usuarios/:id/password  { password }
export async function cambiarPassword(req, res) {
  const { password } = req.body;
  if (!password || password.length < 6) return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  const { error } = await supabase.auth.admin.updateUserById(req.params.id, { password });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ ok: true });
}

export async function obtenerTexto(req, res) {
  const { data } = await supabase.from('configuraciones').select('valor').eq('clave', req.params.clave).single();
  res.json({ valor: data?.valor || '' });
}

export async function actualizarTexto(req, res) {
  const { error } = await supabase
    .from('configuraciones')
    .upsert({ clave: req.params.clave, valor: req.body.valor }, { onConflict: 'clave' });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ ok: true });
}

const CLAVES_SMTP = ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_from'];

export async function obtenerConfigApis(req, res) {
  const { data } = await supabase.from('configuraciones').select('clave, valor').in('clave', CLAVES_SMTP);
  const mapa = {};
  (data || []).forEach((d) => (mapa[d.clave] = d.clave === 'smtp_pass' ? '' : d.valor));
  res.json(mapa);
}

export async function actualizarConfigApis(req, res) {
  const filas = Object.entries(req.body)
    .filter(([clave, valor]) => CLAVES_SMTP.includes(clave) && valor !== '')
    .map(([clave, valor]) => ({ clave, valor: String(valor) }));

  if (!filas.length) return res.json({ ok: true });

  const { error } = await supabase.from('configuraciones').upsert(filas, { onConflict: 'clave' });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ ok: true });
}

export async function respaldoBaseDatos(req, res) {
  const tablas = ['alumnos', 'cursos', 'pagos', 'relatores', 'relator_curso', 'horario_bloques', 'plantillas', 'configuraciones'];
  const respaldo = {};

  for (const tabla of tablas) {
    const { data } = await supabase.from(tabla).select('*');
    respaldo[tabla] = data || [];
  }

  const nombre = `respaldo-bd-${new Date().toISOString().slice(0, 10)}.json`;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${nombre}"`);
  res.send(JSON.stringify(respaldo, null, 2));
}

export function respaldoArchivos(req, res) {
  const nombre = `respaldo-archivos-${new Date().toISOString().slice(0, 10)}.zip`;
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${nombre}"`);
  const zip = archiver('zip');
  zip.pipe(res);
  zip.directory(carpetaPlantillas, 'plantillas');
  zip.finalize();
}

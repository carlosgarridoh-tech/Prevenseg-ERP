import { Router } from 'express';
import { supabase } from '../../config/supabase.js';
import { requireAuth } from '../../middleware/auth.js';

const router = Router();

// POST /api/auth/login  { email, password }
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Usuario y contraseña son obligatorios' });

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });

  const { data: profile, error: errorPerfil } = await supabase
    .from('profiles')
    .select('rol, nombre')
    .eq('id', data.user.id)
    .single();

  if (errorPerfil || !profile) {
    return res.status(403).json({ error: 'Tu cuenta no tiene un perfil asignado. Contacta al administrador.' });
  }

  res.json({
    token: data.session.access_token,
    refreshToken: data.session.refresh_token,
    usuario: { email: data.user.email, rol: profile.rol, nombre: profile.nombre }
  });
});

// POST /api/auth/refresh  { refreshToken }  -> renueva la sesión sin pedir clave de nuevo
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'Falta el refreshToken' });

  const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
  if (error || !data.session) return res.status(401).json({ error: 'Sesión vencida, vuelve a iniciar sesión' });

  res.json({ token: data.session.access_token, refreshToken: data.session.refresh_token });
});

// GET /api/auth/me  -> devuelve el usuario actual a partir del token
router.get('/me', requireAuth, (req, res) => {
  res.json(req.user);
});

export default router;

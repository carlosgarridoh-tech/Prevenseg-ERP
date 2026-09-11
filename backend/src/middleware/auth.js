import { supabase } from '../config/supabase.js';

// Verifica el token enviado por el frontend (header Authorization: Bearer <token>)
// y adjunta el usuario + su rol a req.user
export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No autenticado' });

    const { data: userData, error } = await supabase.auth.getUser(token);
    if (error || !userData?.user) return res.status(401).json({ error: 'Token inválido' });

    const { data: profile } = await supabase
      .from('profiles')
      .select('rol, nombre, alumno_id')
      .eq('id', userData.user.id)
      .single();

    req.user = {
      id: userData.user.id,
      email: userData.user.email,
      rol: profile?.rol || 'ventas',
      nombre: profile?.nombre || '',
      alumno_id: profile?.alumno_id || null
    };
    next();
  } catch (err) {
    res.status(500).json({ error: 'Error validando sesión' });
  }
}

// Restringe una ruta a ciertos roles. Uso: requireRole('administrador')
export function requireRole(...rolesPermitidos) {
  return (req, res, next) => {
    if (!rolesPermitidos.includes(req.user?.rol)) {
      return res.status(403).json({ error: 'No tienes permisos para esta acción' });
    }
    next();
  };
}

// El rol "alumno" solo puede usar el Portal del Alumno, nunca el resto del sistema
export function bloquearAlumnos(req, res, next) {
  if (req.user?.rol === 'alumno') {
    return res.status(403).json({ error: 'No autorizado' });
  }
  next();
}

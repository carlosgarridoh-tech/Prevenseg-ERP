import { supabase } from '../../config/supabase.js';

// GET /api/alumnos?buscar=texto
export async function listar(req, res) {
  const { buscar } = req.query;
  let query = supabase
    .from('alumnos')
    .select('*, cursos(nombre_curso, valor), pagos(monto, anulado)')
    .order('created_at', { ascending: false });

  if (buscar) {
    query = query.or(`nombres.ilike.%${buscar}%,apellido_paterno.ilike.%${buscar}%,rut.ilike.%${buscar}%`);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

// GET /api/alumnos/:id  (ficha del alumno)
export async function verFicha(req, res) {
  const { data, error } = await supabase
    .from('alumnos')
    .select('*, cursos(nombre_curso, tipo_curso, valor)')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: 'Alumno no encontrado' });
  res.json({ ...data, correlativo: await correlativoEnCurso(data) });
}

// Posición del alumno según el orden de inscripción dentro de SU curso (no su ID interno)
export async function correlativoEnCurso(alumno) {
  if (!alumno.curso_id) return null;
  const { data: companeros } = await supabase
    .from('alumnos')
    .select('id, fecha_inscripcion, created_at')
    .eq('curso_id', alumno.curso_id)
    .order('fecha_inscripcion', { ascending: true })
    .order('created_at', { ascending: true });
  const posicion = (companeros || []).findIndex((a) => a.id === alumno.id);
  return posicion >= 0 ? posicion + 1 : null;
}

// POST /api/alumnos  (guardar)
export async function crear(req, res) {
  const { data, error } = await supabase.from('alumnos').insert(req.body).select().single();
  if (error) return res.status(400).json({ error: error.message });

  // Crea automáticamente su acceso al Portal del Alumno (usuario: su correo, clave: su RUT sin puntos ni guión)
  let cuentaCreada = false;
  if (data.correo) {
    try {
      const claveInicial = data.rut.replace(/[^0-9kK]/g, '');
      const { data: userData, error: errAuth } = await supabase.auth.admin.createUser({
        email: data.correo,
        password: claveInicial,
        email_confirm: true
      });
      if (!errAuth) {
        const { error: errorPerfil } = await supabase
          .from('profiles')
          .insert({ id: userData.user.id, nombre: `${data.nombres} ${data.apellido_paterno}`, rol: 'alumno', alumno_id: data.id });

        if (errorPerfil) {
          console.error('No se pudo crear el perfil del portal:', errorPerfil.message);
          // Evita dejar una cuenta de acceso "a medias" sin perfil (riesgo de seguridad)
          await supabase.auth.admin.deleteUser(userData.user.id);
        } else {
          cuentaCreada = true;
        }
      } else {
        console.error('No se pudo crear la cuenta del portal:', errAuth.message);
      }
    } catch (e) {
      console.error('No se pudo crear la cuenta del portal:', e.message);
    }
  }

  res.status(201).json({ ...data, cuentaPortalCreada: cuentaCreada });
}

// DELETE /api/alumnos/:id/acceso  -> quita el acceso al Portal del Alumno (ej. al terminar el curso)
export async function eliminarAcceso(req, res) {
  const { data: perfil } = await supabase.from('profiles').select('id').eq('alumno_id', req.params.id).single();
  if (!perfil) return res.status(404).json({ error: 'Este alumno no tiene una cuenta de portal activa' });

  const { error } = await supabase.auth.admin.deleteUser(perfil.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ ok: true });
}

// POST /api/alumnos/:id/avisos  { mensaje, nivel }  -> el administrador le avisa algo al alumno (ej: "Debe pagar")
export async function enviarAviso(req, res) {
  const { mensaje, nivel } = req.body;
  if (!mensaje) return res.status(400).json({ error: 'El mensaje no puede estar vacío' });
  const { data, error } = await supabase
    .from('avisos_alumno')
    .insert({ alumno_id: req.params.id, mensaje, nivel: nivel || 'info' })
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
}

// PUT /api/alumnos/:id  (modificar/actualizar)
export async function actualizar(req, res) {
  const { id, cursos, pagos, ...datos } = req.body;
  const { data, error } = await supabase
    .from('alumnos')
    .update(datos)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

// DELETE /api/alumnos/:id
export async function eliminar(req, res) {
  const { error } = await supabase.from('alumnos').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ ok: true });
}

-- ====================================================================
-- PREVENSEG ERP - Esquema de Base de Datos
-- Ejecutar completo en Supabase > SQL Editor > New Query > Run
-- ====================================================================

-- Perfiles de usuario (extiende la tabla de auth de Supabase)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text,
  rol text not null default 'ventas' check (rol in ('administrador','ventas','finanzas')),
  created_at timestamptz default now()
);

-- Cursos
create table if not exists cursos (
  id bigint generated always as identity primary key,
  tipo_curso text not null,
  nombre_curso text not null,
  valor numeric(12,0) not null default 0,
  horas_totales integer,
  fecha_inicio date not null,
  fecha_termino date not null,
  cupos integer not null default 0,
  estado text not null default 'activo' check (estado in ('activo','iniciado','terminado')),
  created_at timestamptz default now()
);

-- Alumnos
create table if not exists alumnos (
  id bigint generated always as identity primary key,
  nombres text not null,
  apellido_paterno text not null,
  apellido_materno text,
  rut text not null unique,
  telefono text,
  correo text,
  direccion text,
  comuna text,
  tipo_empresa text check (tipo_empresa in ('Particular','Sence','No sence')),
  nombre_empresa text,
  curso_id bigint references cursos(id),
  estado text not null default 'CONSULTA',
  created_at timestamptz default now()
);

-- Habilitar seguridad a nivel de fila (RLS)
alter table profiles enable row level security;
alter table cursos enable row level security;
alter table alumnos enable row level security;

-- Políticas simples: cualquier usuario autenticado puede leer/escribir
-- (el backend ya filtra por rol; esto se puede endurecer más adelante)
create policy "auth_read_profiles" on profiles for select using (auth.uid() = id);
create policy "auth_all_cursos" on cursos for all using (auth.role() = 'authenticated');
create policy "auth_all_alumnos" on alumnos for all using (auth.role() = 'authenticated');

-- ====================================================================
-- Después de correr esto:
-- 1. Ve a Authentication > Users en Supabase y crea tu primer usuario
--    (email + contraseña).
-- 2. Copia el UUID de ese usuario y ejecuta:
--    insert into profiles (id, nombre, rol) values ('PEGA-EL-UUID-AQUI', 'Admin Prevenseg', 'administrador');
-- ====================================================================

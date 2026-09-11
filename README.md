# Prevenseg ERP — Base del proyecto (Login + Alumnos + Cursos)

## 1. Base de datos (Supabase)
1. Entra a tu proyecto en supabase.com
2. Ve a **SQL Editor > New query**
3. Copia y pega todo el contenido del archivo `database.sql` de esta carpeta → **Run**
4. Ve a **Authentication > Users > Add user** y crea tu primer usuario (email + contraseña)
5. Copia el UUID de ese usuario (aparece en la lista de usuarios)
6. Vuelve al SQL Editor y ejecuta (reemplazando el UUID):
   ```sql
   insert into profiles (id, nombre, rol) values ('PEGA-EL-UUID-AQUI', 'Admin Prevenseg', 'administrador');
   ```
7. Ve a **Project Settings > API** y copia 3 datos que usarás más abajo:
   - Project URL
   - anon public key
   - service_role key

## 2. Backend
```bash
cd backend
cp .env.example .env
```
Abre `.env` y pega tu `Project URL` en `SUPABASE_URL` y tu `service_role key` en `SUPABASE_SERVICE_ROLE_KEY`.

```bash
npm install
npm run dev
```
Debe decir: `✅ Backend Prevenseg corriendo en http://localhost:4000`

## 3. Frontend
En otra terminal:
```bash
cd frontend
cp .env.example .env
```
Abre `.env` y pega tu `Project URL` en `VITE_SUPABASE_URL` y tu `anon public key` en `VITE_SUPABASE_ANON_KEY`.

```bash
npm install
npm run dev
```
Abre la URL que muestra en pantalla (normalmente http://localhost:5173) e ingresa con el usuario que creaste en el paso 1.

## Qué incluye esta base
- **Login** con roles (administrador / ventas / finanzas)
- **Módulo Alumnos**: crear, buscar, modificar, eliminar, ver ficha e imprimir
- **Módulo Cursos**: crear, modificar, panel general con alumnos inscritos y estado automático (activo/iniciado/terminado)
- Estructura modular: cada módulo (alumnos, cursos, auth) vive en su propia carpeta en el backend — modificar uno no afecta a los demás

## Próximos módulos (orden sugerido)
1. Pagos + Horarios + Relatores
2. Documentos + Notificaciones
3. Reportes + Ajustes + Procedimientos

Cuando quieras seguir con el siguiente módulo, solo dime "sigamos con Pagos" (o el que corresponda) y lo construyo sobre esta misma base, sin tocar lo que ya funciona.
"# Prevenseg-ERP" 
"# Prevenseg-ERP" 
"# Prevenseg-ERP" 
"# Prevenseg-ERP" 
"# Prevenseg-ERP" 
"# Prevenseg-ERP" 
"# Prevenseg-ERP" 
"# Prevenseg-ERP" 

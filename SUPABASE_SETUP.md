# 🚀 Configuración Supabase - nekescu

**Project ID**: `sqeizxrsbbjrctxputtj`
**URL**: https://supabase.com/dashboard/project/sqeizxrsbbjrctxputtj

---

## ✅ CHECKLIST DE CONFIGURACIÓN

### [ ] 1. Ejecutar Migración SQL (REQUERIDO)

1. Ve a: https://supabase.com/dashboard/project/sqeizxrsbbjrctxputtj/editor
2. Click en **SQL Editor** (menú izquierdo)
3. Click en **New Query**
4. Copia el contenido de `supabase/migrations/20260101000000_initial_schema.sql`
5. Pégalo en el editor
6. Click en **Run** (o Ctrl/Cmd + Enter)

**✅ Resultado esperado**: 
```
Success. No rows returned
```

**Esto crea**:
- 8 tablas relacionales
- Índices optimizados
- Row Level Security (RLS) habilitado
- Políticas de seguridad multi-tenant
- Triggers para updated_at

---

### [ ] 2. Ejecutar Seed Data (OPCIONAL pero recomendado)

1. En **SQL Editor**, abre otra **New Query**
2. Copia el contenido de `supabase/seed.sql`
3. Pégalo y **Run**

**✅ Resultado esperado**:
```
Success. 1 rows affected (companies)
Success. 3 rows affected (contacts)
Success. 3 rows affected (properties)
```

**Esto crea**:
- 1 empresa de ejemplo: "Mi Sociedad Patrimonial S.L." (B12345678)
- 3 contactos: Juan Pérez (inquilino), Electricidad Norte (proveedor), María López (cliente)
- 3 propiedades en Bilbao

---

### [ ] 3. Crear Storage Bucket "invoices"

1. Ve a: https://supabase.com/dashboard/project/sqeizxrsbbjrctxputtj/storage/buckets
2. Click en **New bucket**
3. Configuración:
   - **Name**: `invoices`
   - **Public bucket**: ✅ **SÍ** (necesario para QR codes y PDFs)
   - **File size limit**: 50 MB
   - **Allowed MIME types**: `application/pdf`, `image/png`, `application/xml`
4. Click **Create bucket**

**Estructura del bucket**:
```
invoices/
├── received/           # Facturas recibidas (PDFs subidos por email)
├── issued/             # Facturas emitidas (PDFs generados)
└── ticketbai/          # Archivos TicketBAI
    └── {record_id}/
        ├── qr.png      # QR code
        └── signed.xml  # XML firmado
```

---

### [ ] 4. Crear Usuario Administrador

#### Opción A: Desde Dashboard (Recomendado)

1. Ve a: https://supabase.com/dashboard/project/sqeizxrsbbjrctxputtj/auth/users
2. Click en **Add user** → **Create new user**
3. Configuración:
   - **Email**: `admin@nekescu.com` (o el que prefieras)
   - **Password**: Elige una contraseña segura
   - **Auto Confirm User**: ✅ **SÍ**
4. Click **Create user**
5. **Importante**: Click en el usuario recién creado
6. Scroll hasta **Raw user meta data**
7. Click en **Edit**
8. Pega este JSON:
```json
{
  "company_id": "00000000-0000-0000-0000-000000000001"
}
```
9. Click **Save**

#### Opción B: Desde SQL

```sql
-- Insertar usuario con auth.users (requiere service_role)
-- NOTA: Cambiar 'tu_email@example.com' y 'tu_password_seguro'

-- 1. Crear usuario de auth
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@nekescu.com',
  crypt('TU_PASSWORD_AQUI', gen_salt('bf')),
  NOW(),
  '{"company_id": "00000000-0000-0000-0000-000000000001"}'::jsonb,
  NOW(),
  NOW()
);
```

---

### [ ] 5. Verificar RLS (Row Level Security)

Ejecuta esta query para verificar que RLS está habilitado:

```sql
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'companies',
    'properties', 
    'contacts',
    'invoices',
    'ticketbai_records',
    'bank_accounts',
    'bank_transactions',
    'reconciliations'
  );
```

**✅ Resultado esperado**: Todas las tablas deben tener `rowsecurity = true`

---

### [ ] 6. (Opcional) Configurar Database Password

Si aún no tienes la contraseña de la base de datos:

1. Ve a: https://supabase.com/dashboard/project/sqeizxrsbbjrctxputtj/settings/database
2. Busca **Database password**
3. Si no la recuerdas, click en **Reset database password**
4. Copia la nueva contraseña
5. Actualiza `.env.local`:
```bash
DATABASE_URL=postgresql://postgres.sqeizxrsbbjrctxputtj:[TU_PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

---

## 🧪 VERIFICAR INSTALACIÓN

### Test 1: Tablas Creadas

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

**✅ Debe mostrar**:
- bank_accounts
- bank_transactions
- companies
- contacts
- invoices
- properties
- reconciliations
- ticketbai_records

---

### Test 2: Datos de Seed

```sql
SELECT name, nif, city FROM companies;
```

**✅ Debe mostrar**:
```
Mi Sociedad Patrimonial S.L. | B12345678 | Bilbao
```

---

### Test 3: Storage Bucket

Ve a: https://supabase.com/dashboard/project/sqeizxrsbbjrctxputtj/storage/buckets

**✅ Debe aparecer**: Bucket `invoices` con icono público

---

### Test 4: Usuario con Metadata

```sql
SELECT 
  email,
  raw_user_meta_data->>'company_id' as company_id,
  created_at
FROM auth.users;
```

**✅ Debe mostrar**: Tu email con `company_id = 00000000-0000-0000-0000-000000000001`

---

## 🚀 ARRANCAR APLICACIÓN

Una vez completados todos los pasos:

```bash
cd /Users/alberdi/Desktop/proyectos/nekescu
npm run dev
```

Visita: http://localhost:3000/login

**Credenciales**:
- Email: `admin@nekescu.com` (o el que creaste)
- Password: La que configuraste

---

## 🔧 TROUBLESHOOTING

### Error: "relation does not exist"
➜ No ejecutaste la migración SQL. Ve al paso 1.

### Error: "Invalid login credentials"
➜ El usuario no existe o la contraseña es incorrecta. Ve al paso 4.

### Dashboard muestra métricas en 0
➜ Normal si es primera vez. Los datos aparecerán al crear inmuebles/facturas.

### Error: "company_id is null"
➜ El usuario no tiene metadata. Ve al paso 4, punto 6-8.

### No puedo subir archivos a Storage
➜ El bucket "invoices" no existe o no es público. Ve al paso 3.

---

## 📚 RECURSOS

- **Dashboard Supabase**: https://supabase.com/dashboard/project/sqeizxrsbbjrctxputtj
- **Documentación Supabase**: https://supabase.com/docs
- **Auth Supabase**: https://supabase.com/docs/guides/auth
- **Storage Supabase**: https://supabase.com/docs/guides/storage

---

✅ **Una vez completados todos los pasos, tu ERP estará 100% funcional.**

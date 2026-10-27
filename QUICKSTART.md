# Quickstart - nekescu ERP Patrimonial

## Prerequisitos

- Node.js 18+ y npm
- Cuenta Supabase (gratis en supabase.com)
- Git

---

## Setup en 5 Minutos

### 1. Instalar dependencias

```bash
cd /Users/alberdi/Desktop/proyectos/nekescu
npm install
```

### 2. Configurar Supabase

1. Crear proyecto en https://supabase.com/dashboard
2. Copiar variables en `.env.local`:

```bash
cp .env.example .env.local
```

Editar `.env.local` con tus credenciales:
- `NEXT_PUBLIC_SUPABASE_URL`: Project Settings → API → Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Project Settings → API → anon public
- `SUPABASE_SERVICE_ROLE_KEY`: Project Settings → API → service_role (mantener secreto)
- `DATABASE_URL`: Project Settings → Database → Connection string (Direct connection)

### 3. Crear schema de base de datos

```bash
# Generar migración Drizzle
npm run db:generate

# Aplicar migración a Supabase
npm run db:push
```

**Alternativa manual** (si db:push falla):
1. Ve a Supabase Dashboard → SQL Editor
2. Copia el contenido de `supabase/migrations/20260101000000_initial_schema.sql` (del ARCHITECTURE.md)
3. Ejecuta el SQL

### 4. Crear primer usuario

En Supabase Dashboard → Authentication → Users → Add user:
- Email: `admin@nekescu.com`
- Password: `admin123`
- User Metadata (JSON):
```json
{
  "company_id": "00000000-0000-0000-0000-000000000001"
}
```

### 5. Insertar empresa inicial

En Supabase Dashboard → SQL Editor:

```sql
INSERT INTO companies (id, name, nif, city, ticketbai_enabled)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Mi Sociedad Patrimonial S.L.',
  'B12345678',
  'Bilbao',
  false
);
```

### 6. Arrancar servidor de desarrollo

```bash
npm run dev
```

Visita http://localhost:3000/login

---

## Siguientes Pasos

### A. Crear primera estructura de rutas

```bash
mkdir -p src/app/\(auth\)/login
mkdir -p src/app/\(dashboard\)/{inmuebles,facturacion/{emitidas,recibidas},tesoreria,configuracion}
mkdir -p src/lib/{supabase,db,services/{ticketbai,banking,invoices},utils}
mkdir -p src/components/{ui,dashboard,invoices,banking,company}
```

### B. Setup shadcn/ui

```bash
npx shadcn@latest init

# Instalar componentes básicos
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add card
npx shadcn@latest add form
npx shadcn@latest add select
npx shadcn@latest add table
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
```

### C. Crear clientes Supabase

```typescript
// src/lib/supabase/server.ts
import { createServerClient as createClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createServerClient() {
  const cookieStore = await cookies();
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options) {
          cookieStore.delete({ name, ...options });
        },
      },
    }
  );
}
```

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient as createClient } from '@supabase/ssr';

export function createBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

```typescript
// src/lib/db/index.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
```

### D. Crear Drizzle schema

Copia el schema completo desde `ARCHITECTURE.md` sección 2 a:
- `src/lib/db/schema.ts`

### E. Configurar middleware auth

```typescript
// src/middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options) {
          response.cookies.delete({ name, ...options });
        },
      },
    }
  );
  
  const { data: { session } } = await supabase.auth.getSession();
  
  // Redirect a login si no autenticado
  if (!session && !request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Redirect a dashboard si ya autenticado en login
  if (session && request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

---

## Verificación del Setup

✅ Checklist:

1. [ ] `npm run dev` arranca sin errores
2. [ ] http://localhost:3000/login muestra página de login
3. [ ] Login con `admin@nekescu.com` / `admin123` funciona
4. [ ] Supabase Dashboard muestra tablas creadas
5. [ ] `npm run db:studio` abre Drizzle Studio en http://localhost:4983

---

## Comandos útiles

```bash
# Desarrollo
npm run dev              # Servidor Next.js
npm run db:studio        # GUI de base de datos

# Base de datos
npm run db:generate      # Generar migración desde schema
npm run db:push          # Aplicar schema a Supabase

# Build
npm run build            # Build producción
npm run start            # Servidor producción
```

---

## Estructura de carpetas inicial

```
nekescu/
├── src/
│   ├── app/
│   │   ├── (auth)/login/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── inmuebles/
│   │   │   ├── facturacion/{emitidas,recibidas}/
│   │   │   ├── tesoreria/
│   │   │   └── configuracion/
│   │   └── api/webhooks/
│   ├── lib/
│   │   ├── supabase/{server,client}.ts
│   │   ├── db/{index,schema}.ts
│   │   └── services/ticketbai/
│   └── components/ui/
├── workers/
│   ├── email-processor/
│   └── bank-sync/
├── supabase/migrations/
├── .env.local
└── package.json
```

---

## Troubleshooting

### Error: "relation does not exist"
- Verifica que las migraciones se aplicaron: `npm run db:push`
- O ejecuta el SQL manual en Supabase Dashboard

### Error: "Invalid credentials"
- Verifica `.env.local` tiene las keys correctas
- Verifica que el usuario existe en Supabase Auth

### Error: "company_id not found"
- Verifica que el usuario tiene `user_metadata.company_id`
- Edita en Supabase Dashboard → Auth → Users → User → Raw user meta data

### Port 3000 ocupado
```bash
npm run dev -- -p 3001  # Usar puerto alternativo
```

---

## Recursos

- **Documentación completa**: Ver `ARCHITECTURE.md`
- **Supabase Docs**: https://supabase.com/docs
- **Drizzle ORM**: https://orm.drizzle.team
- **shadcn/ui**: https://ui.shadcn.com

---

🚀 **Listo para empezar a picar código.**

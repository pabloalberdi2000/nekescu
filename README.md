# 🏢 NEKESCU - ERP Patrimonial

Sistema de gestión integral para sociedades patrimoniales, especializado en la gestión de inmuebles, facturación con TicketBAI y tesorería con Open Banking.

## 🚀 Stack Tecnológico

- **Framework**: Next.js 15 (App Router)
- **Base de datos**: Supabase (PostgreSQL)
- **ORM**: Drizzle ORM
- **Autenticación**: Supabase Auth (SSR)
- **Estilos**: Tailwind CSS
- **Lenguaje**: TypeScript
- **Validación**: Zod + React Hook Form

## 📋 Características

### ✅ Implementado

- **Dashboard**: Panel de control con métricas en tiempo real
- **Inmuebles**: CRUD completo de propiedades inmobiliarias
- **Autenticación**: Login/Logout con Supabase Auth
- **Multi-tenant**: Row Level Security (RLS) por empresa
- **Diseño**: Interfaz moderna y responsive

### 🚧 En desarrollo

- **Facturación**: Emisión de facturas con integración TicketBAI
- **Tesorería**: Gestión de cuentas bancarias con Open Banking (GoCardless)
- **Conciliación**: Matching automático de movimientos con facturas
- **Workers**: Procesamiento de emails y sincronización bancaria

## 🛠️ Instalación

### 1. Clonar repositorio

```bash
git clone <repo-url>
cd nekescu
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia `.env.example` a `.env.local` y configura tus credenciales:

```bash
cp .env.example .env.local
```

Edita `.env.local` con tus credenciales de Supabase.

### 4. Configurar Supabase

Sigue las instrucciones detalladas en [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

Pasos principales:
1. Ejecutar migración SQL
2. Crear bucket de Storage
3. Crear usuario administrador

### 5. Ejecutar en desarrollo

```bash
npm run dev
```

Visita: http://localhost:3000

## 📁 Estructura del Proyecto

```
nekescu/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Rutas públicas (login)
│   │   ├── dashboard/         # Rutas privadas
│   │   ├── actions/           # Server Actions
│   │   └── api/               # API Routes
│   ├── components/            # Componentes React
│   ├── lib/
│   │   ├── db/               # Drizzle ORM + Schema
│   │   ├── supabase/         # Cliente Supabase
│   │   ├── services/         # Lógica de negocio
│   │   └── utils/            # Utilidades
│   └── middleware.ts         # Auth middleware
├── supabase/
│   ├── migrations/           # Migraciones SQL
│   └── seed.sql             # Datos de ejemplo
└── workers/                  # Workers (separados del monorepo)
    ├── email-processor/
    └── bank-sync/
```

## 🔐 Seguridad

- **RLS (Row Level Security)**: Todas las tablas tienen políticas RLS activas
- **Multi-tenant**: Aislamiento por `company_id`
- **Auth SSR**: Autenticación server-side con Supabase
- **Env vars**: Credenciales en `.env.local` (nunca en el repo)

## 🧪 Testing

```bash
# Unit tests
npm run test

# Build production
npm run build
```

## 📚 Módulos

### 1. Inmuebles
- CRUD completo de propiedades
- Referencia catastral
- Valoración y rentas
- Historial de modificaciones

### 2. Facturación
- Facturas emitidas/recibidas
- Integración TicketBAI (Bizkaia)
- Generación de PDFs
- Firma digital

### 3. Tesorería
- Cuentas bancarias
- Movimientos sincronizados (Open Banking)
- Conciliación automática
- Reporting financiero

### 4. Configuración
- Datos de empresa
- Certificados TicketBAI
- Conexión bancaria
- Usuarios y permisos

## 🔗 Integraciones

- **TicketBAI**: Kubibai (Facturación País Vasco)
- **Open Banking**: GoCardless (Sincronización bancaria)
- **Storage**: Supabase Storage (PDFs, XMLs)
- **Email**: IMAP (Procesamiento facturas recibidas)

## 📄 Licencia

Privado - NEKESCU SL

## 👥 Autor

Desarrollado para NEKESCU SL

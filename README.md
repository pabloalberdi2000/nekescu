# nekescu - ERP Patrimonial

Sistema integral de gestión para sociedades patrimoniales en España con TicketBAI, Open Banking y automatización de facturas.

## 🚀 Stack Tecnológico

- **Frontend**: Next.js 15 + React 19 + TypeScript
- **UI**: Tailwind CSS + Lucide Icons
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **ORM**: Drizzle ORM
- **Workers**: Node.js (Email + Bank Sync)
- **TicketBAI**: Arquitectura desacoplada (KubiBAI)
- **Open Banking**: GoCardless

## 📋 Características

- ✅ Gestión de inmuebles y activos
- ✅ Facturación (emitidas/recibidas) con IVA e IRPF
- ✅ TicketBAI integrado (firma digital + QR)
- ✅ Sincronización bancaria automática (GoCardless)
- ✅ Conciliación bancaria inteligente
- ✅ Procesamiento automático de facturas por email
- ✅ Multi-tenant con Row Level Security (RLS)
- ✅ Dashboard con métricas en tiempo real

## 🏗️ Arquitectura

```
nekescu/
├── src/                          # Next.js App
│   ├── app/                      # App Router (rutas)
│   ├── lib/                      # Lógica de negocio
│   │   ├── db/                   # Drizzle ORM schema
│   │   ├── supabase/             # Clientes SSR
│   │   ├── services/             # Servicios (TicketBAI, Banking)
│   │   └── utils/                # Utilidades (currency, tax)
│   └── components/               # Componentes React
├── workers/                      # Background workers
│   ├── email-processor/          # Procesa facturas de email
│   └── bank-sync/                # Sincroniza cuentas bancarias
└── supabase/                     # Migraciones SQL
    └── migrations/
```

## 📦 Instalación

Ver **[QUICKSTART.md](./QUICKSTART.md)** para guía paso a paso.

### Quick Setup

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales Supabase

# 3. Aplicar migración de base de datos
npm run db:push

# 4. Arrancar servidor
npm run dev
```

## 🗄️ Base de Datos

8 tablas relacionales optimizadas:
- `companies` - Datos de empresas
- `properties` - Inmuebles y activos
- `contacts` - Inquilinos, proveedores, clientes
- `invoices` - Facturas emitidas y recibidas
- `ticketbai_records` - Firma digital TicketBAI
- `bank_accounts` - Cuentas bancarias
- `bank_transactions` - Movimientos bancarios
- `reconciliations` - Conciliación facturas-banco

Ver schema completo en `src/lib/db/schema.ts`

## 🔧 Comandos Disponibles

```bash
npm run dev          # Servidor desarrollo (http://localhost:3000)
npm run build        # Build producción
npm run start        # Servidor producción
npm run db:generate  # Generar migración Drizzle
npm run db:push      # Aplicar schema a Supabase
npm run db:studio    # GUI base de datos
```

## 📚 Documentación

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Arquitectura técnica completa
- **[QUICKSTART.md](./QUICKSTART.md)** - Guía de instalación paso a paso

## 🔐 Seguridad

- Row Level Security (RLS) multi-tenant
- Auth con Supabase SSR
- Variables de entorno para secrets
- Certificados digitales para TicketBAI

## 🛠️ Workers Background

### Email Processor
```bash
cd workers/email-processor
npm install
npm run dev
```

### Bank Sync
```bash
cd workers/bank-sync
npm install
npm run dev
```

## 📄 Licencia

Privado - Uso exclusivo interno

---

Desarrollado con ❤️ para gestión patrimonial profesional
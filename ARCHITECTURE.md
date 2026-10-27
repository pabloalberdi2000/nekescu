# Arquitectura ERP Patrimonial - nekescu

## 1. ESTRUCTURA DE REPOSITORIO - MONOLITO MODULAR

**Decisión:** Monolito modular Next.js con workers separados (no Turborepo).

**Justificación para 1 desarrollador:**
- Menos overhead de configuración (no nx/turborepo)
- Despliegue unificado en Vercel/Railway
- Compartición natural de tipos TypeScript
- Workers separados solo cuando el workload lo requiera (cron jobs pesados)

```
nekescu/
├── .env.example
├── .env.local
├── package.json
├── tsconfig.json
├── next.config.mjs
├── drizzle.config.ts
├── tailwind.config.ts
├── components.json              # shadcn/ui config
│
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx       # Auth wrapper + sidebar
│   │   │   ├── page.tsx         # Dashboard principal
│   │   │   ├── inmuebles/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   ├── facturacion/
│   │   │   │   ├── emitidas/
│   │   │   │   └── recibidas/
│   │   │   ├── tesoreria/
│   │   │   │   ├── cuentas/
│   │   │   │   ├── movimientos/
│   │   │   │   └── conciliacion/
│   │   │   └── configuracion/
│   │   └── api/
│   │       ├── webhooks/
│   │       │   └── gocardless/route.ts
│   │       └── invoices/
│   │           └── ticketbai/route.ts
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts        # Browser client
│   │   │   ├── server.ts        # Server Component client
│   │   │   └── middleware.ts    # Auth middleware
│   │   ├── db/
│   │   │   ├── index.ts         # Drizzle instance
│   │   │   ├── schema.ts        # Drizzle schema
│   │   │   └── migrations/
│   │   ├── services/
│   │   │   ├── ticketbai/
│   │   │   │   ├── types.ts
│   │   │   │   ├── provider.ts  # Interface
│   │   │   │   └── kubibai.ts   # Implementación KubiBAI
│   │   │   ├── banking/
│   │   │   │   └── gocardless.ts
│   │   │   └── invoices/
│   │   │       ├── parser.ts    # OCR/AI invoice extraction
│   │   │       └── validator.ts
│   │   └── utils/
│   │       ├── currency.ts
│   │       └── tax.ts           # Cálculos IVA/IRPF
│   │
│   └── components/
│       ├── ui/                  # shadcn/ui components
│       ├── dashboard/
│       │   ├── sidebar.tsx
│       │   └── header.tsx
│       ├── invoices/
│       │   ├── invoice-form.tsx
│       │   └── invoice-list.tsx
│       └── banking/
│           └── transaction-list.tsx
│
├── workers/                     # Servicios background desacoplados
│   ├── email-processor/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts         # Cron job IMAP
│   │       └── parsers/
│   │           └── invoice-extractor.ts
│   └── bank-sync/
│       └── src/
│           └── index.ts         # Sincronización periódica GoCardless
│
└── supabase/
    ├── config.toml
    ├── seed.sql
    └── migrations/
        └── 20260101000000_initial_schema.sql
```

---

## 2. ESQUEMA DE BASE DE DATOS (Drizzle ORM)

**Elección: Drizzle ORM**
- TypeScript-native (mejor inferencia que Prisma)
- SQL-like syntax (control total)
- Migrations explícitas
- Sin overhead de Prisma Client generation

### Schema TypeScript (Drizzle)

```typescript
// src/lib/db/schema.ts
import { pgTable, uuid, text, timestamp, numeric, boolean, jsonb, pgEnum } from 'drizzle-orm/pg-core';

// ============ ENUMS ============
export const invoiceTypeEnum = pgEnum('invoice_type', ['issued', 'received']);
export const invoiceStatusEnum = pgEnum('invoice_status', ['draft', 'pending', 'sent', 'paid', 'overdue', 'cancelled']);
export const ticketbaiStatusEnum = pgEnum('ticketbai_status', ['pending', 'signed', 'sent', 'validated', 'error']);
export const transactionTypeEnum = pgEnum('transaction_type', ['debit', 'credit']);

// ============ COMPANIES ============
export const companies = pgTable('companies', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  nif: text('nif').notNull().unique(),
  address: text('address'),
  postalCode: text('postal_code'),
  city: text('city'),
  province: text('province'),
  email: text('email'),
  phone: text('phone'),
  
  // TicketBAI Config
  ticketbaiEnabled: boolean('ticketbai_enabled').default(false),
  ticketbaiNifEmisor: text('ticketbai_nif_emisor'), // NIF del software emisor
  ticketbaiSerialNumber: text('ticketbai_serial_number'), // Serie actual
  ticketbaiLastHash: text('ticketbai_last_hash'), // Hash encadenamiento
  ticketbaiCertificatePath: text('ticketbai_certificate_path'), // Path en Supabase Storage
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============ PROPERTIES / ASSETS ============
export const properties = pgTable('properties', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id).notNull(),
  name: text('name').notNull(),
  address: text('address').notNull(),
  cadastralReference: text('cadastral_reference'),
  purchaseDate: timestamp('purchase_date'),
  purchasePrice: numeric('purchase_price', { precision: 12, scale: 2 }),
  currentValue: numeric('current_value', { precision: 12, scale: 2 }),
  monthlyRent: numeric('monthly_rent', { precision: 10, scale: 2 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============ CONTACTS (Inquilinos, Proveedores, Clientes) ============
export const contacts = pgTable('contacts', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id).notNull(),
  type: text('type').notNull(), // 'tenant', 'supplier', 'customer'
  name: text('name').notNull(),
  nif: text('nif'),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  iban: text('iban'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============ INVOICES (Emitidas y Recibidas) ============
export const invoices = pgTable('invoices', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id).notNull(),
  type: invoiceTypeEnum('type').notNull(),
  status: invoiceStatusEnum('status').default('draft'),
  
  // Referencia
  invoiceNumber: text('invoice_number'),
  series: text('series'),
  issueDate: timestamp('issue_date').notNull(),
  dueDate: timestamp('due_date'),
  
  // Emisor/Receptor
  contactId: uuid('contact_id').references(() => contacts.id),
  propertyId: uuid('property_id').references(() => properties.id),
  
  // Importes
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
  taxBase: numeric('tax_base', { precision: 10, scale: 2 }).notNull(),
  vatRate: numeric('vat_rate', { precision: 5, scale: 2 }).default('21.00'),
  vatAmount: numeric('vat_amount', { precision: 10, scale: 2 }).notNull(),
  irpfRate: numeric('irpf_rate', { precision: 5, scale: 2 }).default('0.00'),
  irpfAmount: numeric('irpf_amount', { precision: 10, scale: 2 }).default('0.00'),
  total: numeric('total', { precision: 10, scale: 2 }).notNull(),
  
  // Metadatos
  description: text('description'),
  concept: text('concept'),
  pdfPath: text('pdf_path'), // Supabase Storage path
  
  // TicketBAI (solo para emitidas)
  ticketbaiId: uuid('ticketbai_id'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============ TICKETBAI RECORDS ============
export const ticketbaiRecords = pgTable('ticketbai_records', {
  id: uuid('id').defaultRandom().primaryKey(),
  invoiceId: uuid('invoice_id').references(() => invoices.id).notNull().unique(),
  
  // Datos fiscales obligatorios Hacienda Foral
  series: text('series').notNull(),
  invoiceNumber: text('invoice_number').notNull(),
  issueDate: timestamp('issue_date').notNull(),
  
  // Encadenamiento
  previousHash: text('previous_hash'), // Hash de la factura anterior
  currentHash: text('current_hash').notNull(), // Hash SHA-256 de esta factura
  
  // Firma digital
  signatureValue: text('signature_value').notNull(),
  certificateSerial: text('certificate_serial').notNull(),
  
  // QR Code
  qrCodeData: text('qr_code_data').notNull(), // Datos del QR (URL + params)
  qrCodeImagePath: text('qr_code_image_path'), // Path imagen QR en Storage
  
  // Estado validación
  status: ticketbaiStatusEnum('status').default('pending'),
  haciendaResponse: jsonb('hacienda_response'), // Respuesta de validación
  sentAt: timestamp('sent_at'),
  validatedAt: timestamp('validated_at'),
  errorMessage: text('error_message'),
  
  // TBAI XML
  xmlPath: text('xml_path'), // Supabase Storage path del XML firmado
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============ BANK ACCOUNTS ============
export const bankAccounts = pgTable('bank_accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id).notNull(),
  name: text('name').notNull(),
  iban: text('iban').notNull().unique(),
  bankName: text('bank_name'),
  
  // GoCardless requisition ID
  requisitionId: text('requisition_id').unique(),
  accountId: text('account_id'), // ID de GoCardless
  
  lastSyncAt: timestamp('last_sync_at'),
  balance: numeric('balance', { precision: 12, scale: 2 }),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============ BANK TRANSACTIONS ============
export const bankTransactions = pgTable('bank_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  accountId: uuid('account_id').references(() => bankAccounts.id).notNull(),
  
  // Datos del banco
  externalId: text('external_id').unique(), // ID del banco/GoCardless
  transactionDate: timestamp('transaction_date').notNull(),
  valueDate: timestamp('value_date'),
  
  type: transactionTypeEnum('type').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  currency: text('currency').default('EUR'),
  
  description: text('description'),
  counterpartyName: text('counterparty_name'),
  counterpartyIban: text('counterparty_iban'),
  reference: text('reference'),
  
  // Conciliación
  reconciled: boolean('reconciled').default(false),
  reconciledAt: timestamp('reconciled_at'),
  
  // Raw data del banco
  rawData: jsonb('raw_data'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============ RECONCILIATIONS (Conciliación bancaria) ============
export const reconciliations = pgTable('reconciliations', {
  id: uuid('id').defaultRandom().primaryKey(),
  transactionId: uuid('transaction_id').references(() => bankTransactions.id).notNull(),
  invoiceId: uuid('invoice_id').references(() => invoices.id),
  
  // Matching automático o manual
  matchType: text('match_type').notNull(), // 'auto', 'manual', 'suggested'
  matchConfidence: numeric('match_confidence', { precision: 3, scale: 2 }), // 0.00 - 1.00
  
  notes: text('notes'),
  createdBy: uuid('created_by'), // User ID (Supabase Auth)
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

### SQL Migration (Supabase)

```sql
-- supabase/migrations/20260101000000_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUMS
CREATE TYPE invoice_type AS ENUM ('issued', 'received');
CREATE TYPE invoice_status AS ENUM ('draft', 'pending', 'sent', 'paid', 'overdue', 'cancelled');
CREATE TYPE ticketbai_status AS ENUM ('pending', 'signed', 'sent', 'validated', 'error');
CREATE TYPE transaction_type AS ENUM ('debit', 'credit');

-- Companies
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  nif TEXT NOT NULL UNIQUE,
  address TEXT,
  postal_code TEXT,
  city TEXT,
  province TEXT,
  email TEXT,
  phone TEXT,
  ticketbai_enabled BOOLEAN DEFAULT false,
  ticketbai_nif_emisor TEXT,
  ticketbai_serial_number TEXT,
  ticketbai_last_hash TEXT,
  ticketbai_certificate_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Properties
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  cadastral_reference TEXT,
  purchase_date TIMESTAMPTZ,
  purchase_price NUMERIC(12, 2),
  current_value NUMERIC(12, 2),
  monthly_rent NUMERIC(10, 2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contacts
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('tenant', 'supplier', 'customer')),
  name TEXT NOT NULL,
  nif TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  iban TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  type invoice_type NOT NULL,
  status invoice_status DEFAULT 'draft',
  invoice_number TEXT,
  series TEXT,
  issue_date TIMESTAMPTZ NOT NULL,
  due_date TIMESTAMPTZ,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  subtotal NUMERIC(10, 2) NOT NULL,
  tax_base NUMERIC(10, 2) NOT NULL,
  vat_rate NUMERIC(5, 2) DEFAULT 21.00,
  vat_amount NUMERIC(10, 2) NOT NULL,
  irpf_rate NUMERIC(5, 2) DEFAULT 0.00,
  irpf_amount NUMERIC(10, 2) DEFAULT 0.00,
  total NUMERIC(10, 2) NOT NULL,
  description TEXT,
  concept TEXT,
  pdf_path TEXT,
  ticketbai_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TicketBAI Records
CREATE TABLE ticketbai_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL UNIQUE,
  series TEXT NOT NULL,
  invoice_number TEXT NOT NULL,
  issue_date TIMESTAMPTZ NOT NULL,
  previous_hash TEXT,
  current_hash TEXT NOT NULL,
  signature_value TEXT NOT NULL,
  certificate_serial TEXT NOT NULL,
  qr_code_data TEXT NOT NULL,
  qr_code_image_path TEXT,
  status ticketbai_status DEFAULT 'pending',
  hacienda_response JSONB,
  sent_at TIMESTAMPTZ,
  validated_at TIMESTAMPTZ,
  error_message TEXT,
  xml_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bank Accounts
CREATE TABLE bank_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  iban TEXT NOT NULL UNIQUE,
  bank_name TEXT,
  requisition_id TEXT UNIQUE,
  account_id TEXT,
  last_sync_at TIMESTAMPTZ,
  balance NUMERIC(12, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bank Transactions
CREATE TABLE bank_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES bank_accounts(id) ON DELETE CASCADE NOT NULL,
  external_id TEXT UNIQUE,
  transaction_date TIMESTAMPTZ NOT NULL,
  value_date TIMESTAMPTZ,
  type transaction_type NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  description TEXT,
  counterparty_name TEXT,
  counterparty_iban TEXT,
  reference TEXT,
  reconciled BOOLEAN DEFAULT false,
  reconciled_at TIMESTAMPTZ,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reconciliations
CREATE TABLE reconciliations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID REFERENCES bank_transactions(id) ON DELETE CASCADE NOT NULL,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  match_type TEXT NOT NULL CHECK (match_type IN ('auto', 'manual', 'suggested')),
  match_confidence NUMERIC(3, 2),
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_properties_company ON properties(company_id);
CREATE INDEX idx_contacts_company ON contacts(company_id);
CREATE INDEX idx_invoices_company ON invoices(company_id);
CREATE INDEX idx_invoices_contact ON invoices(contact_id);
CREATE INDEX idx_invoices_property ON invoices(property_id);
CREATE INDEX idx_invoices_date ON invoices(issue_date DESC);
CREATE INDEX idx_ticketbai_invoice ON ticketbai_records(invoice_id);
CREATE INDEX idx_bank_transactions_account ON bank_transactions(account_id);
CREATE INDEX idx_bank_transactions_date ON bank_transactions(transaction_date DESC);
CREATE INDEX idx_reconciliations_transaction ON reconciliations(transaction_id);
CREATE INDEX idx_reconciliations_invoice ON reconciliations(invoice_id);

-- RLS (Row Level Security) - Básico para multi-tenant
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticketbai_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see data from their company
-- (Asume que auth.users tiene metadata con company_id o existe tabla user_companies)
CREATE POLICY "Users access own company data" ON companies
  FOR ALL USING (
    id IN (
      SELECT (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid
    )
  );

CREATE POLICY "Users access own company properties" ON properties
  FOR ALL USING (
    company_id IN (
      SELECT (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid
    )
  );

CREATE POLICY "Users access own company contacts" ON contacts
  FOR ALL USING (
    company_id IN (
      SELECT (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid
    )
  );

CREATE POLICY "Users access own company invoices" ON invoices
  FOR ALL USING (
    company_id IN (
      SELECT (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid
    )
  );

CREATE POLICY "Users access own company ticketbai" ON ticketbai_records
  FOR ALL USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE company_id IN (
        SELECT (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid
      )
    )
  );

CREATE POLICY "Users access own company bank_accounts" ON bank_accounts
  FOR ALL USING (
    company_id IN (
      SELECT (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid
    )
  );

CREATE POLICY "Users access own company transactions" ON bank_transactions
  FOR ALL USING (
    account_id IN (
      SELECT id FROM bank_accounts WHERE company_id IN (
        SELECT (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid
      )
    )
  );

CREATE POLICY "Users access own company reconciliations" ON reconciliations
  FOR ALL USING (
    transaction_id IN (
      SELECT id FROM bank_transactions WHERE account_id IN (
        SELECT id FROM bank_accounts WHERE company_id IN (
          SELECT (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid
        )
      )
    )
  );

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ticketbai_records_updated_at BEFORE UPDATE ON ticketbai_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bank_accounts_updated_at BEFORE UPDATE ON bank_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bank_transactions_updated_at BEFORE UPDATE ON bank_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reconciliations_updated_at BEFORE UPDATE ON reconciliations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 3. PATRÓN ARQUITECTURA FRONTEND (Next.js App Router)

### Estructura de Rutas

```typescript
// src/app/(dashboard)/layout.tsx - Server Component con Auth
import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerClient();
  
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/login');
  }
  
  // Obtener datos de la empresa del usuario
  const companyId = session.user.user_metadata?.company_id;
  
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar companyId={companyId} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={session.user} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

```typescript
// src/app/(dashboard)/page.tsx - Dashboard Principal (Server Component)
import { createServerClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { invoices, bankTransactions, properties } from '@/lib/db/schema';
import { eq, sql, and, gte } from 'drizzle-orm';
import { MetricCard } from '@/components/dashboard/metric-card';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { InvoiceStatusChart } from '@/components/dashboard/invoice-status-chart';

export default async function DashboardPage() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  const companyId = session?.user.user_metadata?.company_id;
  
  // Server-side data fetching
  const [
    totalProperties,
    pendingInvoices,
    monthlyRevenue,
    recentTransactions
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` })
      .from(properties)
      .where(eq(properties.companyId, companyId)),
    
    db.select({ count: sql<number>`count(*)` })
      .from(invoices)
      .where(and(
        eq(invoices.companyId, companyId),
        eq(invoices.status, 'pending')
      )),
    
    db.select({ sum: sql<number>`sum(total)` })
      .from(invoices)
      .where(and(
        eq(invoices.companyId, companyId),
        eq(invoices.type, 'issued'),
        gte(invoices.issueDate, new Date(new Date().getFullYear(), new Date().getMonth(), 1))
      )),
    
    db.select()
      .from(bankTransactions)
      .orderBy(sql`${bankTransactions.transactionDate} DESC`)
      .limit(10)
  ]);
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard 
          title="Inmuebles" 
          value={totalProperties[0].count} 
          icon="building"
        />
        <MetricCard 
          title="Facturas Pendientes" 
          value={pendingInvoices[0].count} 
          icon="file-text"
          variant="warning"
        />
        <MetricCard 
          title="Ingresos del Mes" 
          value={`${monthlyRevenue[0].sum?.toFixed(2) || 0}€`}
          icon="euro"
          variant="success"
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InvoiceStatusChart companyId={companyId} />
        <RecentTransactions transactions={recentTransactions} />
      </div>
    </div>
  );
}
```

```typescript
// src/app/(dashboard)/facturacion/emitidas/page.tsx - Server Component
import { createServerClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { invoices } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { InvoiceList } from '@/components/invoices/invoice-list';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function IssuedInvoicesPage() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  const companyId = session?.user.user_metadata?.company_id;
  
  const issuedInvoices = await db
    .select()
    .from(invoices)
    .where(and(
      eq(invoices.companyId, companyId),
      eq(invoices.type, 'issued')
    ))
    .orderBy(desc(invoices.issueDate));
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Facturas Emitidas</h1>
        <Button asChild>
          <Link href="/facturacion/emitidas/nueva">
            Nueva Factura
          </Link>
        </Button>
      </div>
      
      {/* Client Component para interactividad */}
      <InvoiceList invoices={issuedInvoices} type="issued" />
    </div>
  );
}
```

```typescript
// src/components/invoices/invoice-form.tsx - Client Component
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { createBrowserClient } from '@/lib/supabase/client';
import { db } from '@/lib/db';
import { invoices } from '@/lib/db/schema';

const invoiceSchema = z.object({
  contactId: z.string().uuid(),
  propertyId: z.string().uuid().optional(),
  issueDate: z.date(),
  concept: z.string().min(1),
  taxBase: z.number().positive(),
  vatRate: z.number().min(0).max(100),
  irpfRate: z.number().min(0).max(100),
});

export function InvoiceForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const form = useForm<z.infer<typeof invoiceSchema>>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      vatRate: 21,
      irpfRate: 0,
    },
  });
  
  async function onSubmit(values: z.infer<typeof invoiceSchema>) {
    setLoading(true);
    
    const vatAmount = (values.taxBase * values.vatRate) / 100;
    const irpfAmount = (values.taxBase * values.irpfRate) / 100;
    const total = values.taxBase + vatAmount - irpfAmount;
    
    try {
      const supabase = createBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      await db.insert(invoices).values({
        companyId: session?.user.user_metadata?.company_id,
        type: 'issued',
        contactId: values.contactId,
        propertyId: values.propertyId,
        issueDate: values.issueDate,
        concept: values.concept,
        subtotal: values.taxBase,
        taxBase: values.taxBase,
        vatRate: values.vatRate,
        vatAmount,
        irpfRate: values.irpfRate,
        irpfAmount,
        total,
        status: 'draft',
      });
      
      router.push('/facturacion/emitidas');
      router.refresh();
    } catch (error) {
      console.error('Error creating invoice:', error);
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Form fields... */}
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : 'Crear Factura'}
        </Button>
      </form>
    </Form>
  );
}
```

### Estrategia Server vs Client Components

**Server Components (por defecto):**
- Layouts con auth checks
- Páginas de listado con fetch de datos
- Dashboard con métricas
- Páginas estáticas

**Client Components (cuando necesites):**
- Formularios con validación
- Componentes con `useState`, `useEffect`
- Interactividad (modals, dropdowns, filtros dinámicos)
- Librerías que requieren `window` o browser APIs

### Supabase Auth SSR

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
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options) {
          response.cookies.delete({
            name,
            ...options,
          });
        },
      },
    }
  );
  
  await supabase.auth.getSession();
  
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

---

## 4. ARQUITECTURA DE INTEGRACIÓN Y WORKERS

### Flujo "Agente de Entrada" - Email Invoice Processor

```
┌─────────────────────────────────────────────────────────────┐
│                      EMAIL PROCESSOR WORKER                  │
│                    (Node.js Cron Job - workers/)             │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ 1. IMAP Poll (cada 15 min)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Gmail/IMAP → Descarga PDFs adjuntos con "factura" keyword  │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ 2. Upload a Supabase Storage
                              ▼
┌─────────────────────────────────────────────────────────────┐
│         Supabase Storage: /invoices/received/{uuid}.pdf      │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ 3. Insertar invoice (status: pending)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  DB: invoices (type: received, status: pending, pdf_path)   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ 4. Trigger webhook (opcional)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│      Next.js API Route: /api/webhooks/invoice-received       │
│         → Procesa con OCR/AI (Anthropic Claude Vision)       │
│         → Extrae: NIF, total, fecha, concepto                │
│         → Update invoice con datos extraídos                 │
└─────────────────────────────────────────────────────────────┘
```

### Implementación Worker Email Processor

```typescript
// workers/email-processor/src/index.ts
import Imap from 'imap';
import { simpleParser } from 'mailparser';
import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role para bypass RLS
);

interface EmailConfig {
  user: string;
  password: string;
  host: string;
  port: number;
  tls: boolean;
}

async function processInvoiceEmails() {
  const config: EmailConfig = {
    user: process.env.EMAIL_USER!,
    password: process.env.EMAIL_PASSWORD!,
    host: process.env.EMAIL_HOST!,
    port: Number(process.env.EMAIL_PORT) || 993,
    tls: true,
  };
  
  const imap = new Imap(config);
  
  imap.once('ready', () => {
    imap.openBox('INBOX', false, (err, box) => {
      if (err) throw err;
      
      // Buscar emails no leídos con "factura" en asunto o cuerpo
      imap.search(['UNSEEN', ['OR', ['SUBJECT', 'factura'], ['BODY', 'factura']]], (err, results) => {
        if (err) throw err;
        if (!results || results.length === 0) {
          console.log('No new invoices found');
          imap.end();
          return;
        }
        
        const fetch = imap.fetch(results, { bodies: '', markSeen: true });
        
        fetch.on('message', (msg, seqno) => {
          msg.on('body', (stream) => {
            simpleParser(stream, async (err, parsed) => {
              if (err) throw err;
              
              // Procesar adjuntos PDF
              const pdfAttachments = parsed.attachments.filter(
                (att) => att.contentType === 'application/pdf'
              );
              
              for (const attachment of pdfAttachments) {
                await processInvoicePDF(attachment.content, attachment.filename);
              }
            });
          });
        });
        
        fetch.once('end', () => {
          imap.end();
        });
      });
    });
  });
  
  imap.once('error', (err: Error) => {
    console.error('IMAP Error:', err);
  });
  
  imap.connect();
}

async function processInvoicePDF(pdfBuffer: Buffer, filename: string) {
  try {
    const fileId = nanoid();
    const storagePath = `invoices/received/${fileId}.pdf`;
    
    // 1. Upload a Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('invoices')
      .upload(storagePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      });
    
    if (uploadError) throw uploadError;
    
    // 2. Crear invoice pending en DB
    const { data: invoice, error: dbError } = await supabase
      .from('invoices')
      .insert({
        company_id: process.env.DEFAULT_COMPANY_ID!, // O detectar de metadata
        type: 'received',
        status: 'pending',
        pdf_path: storagePath,
        issue_date: new Date(), // Temporal, se actualizará con OCR
        tax_base: 0,
        vat_amount: 0,
        total: 0,
      })
      .select()
      .single();
    
    if (dbError) throw dbError;
    
    console.log(`Invoice created: ${invoice.id} from ${filename}`);
    
    // 3. Trigger OCR processing (webhook o job queue)
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/invoice-ocr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoiceId: invoice.id }),
    });
    
  } catch (error) {
    console.error('Error processing invoice PDF:', error);
  }
}

// Cron job: ejecutar cada 15 minutos
setInterval(processInvoiceEmails, 15 * 60 * 1000);

// Primera ejecución inmediata
processInvoiceEmails();
```

### GoCardless Bank Sync Worker

```typescript
// workers/bank-sync/src/index.ts
import NordigenClient from 'nordigen-node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const nordigen = new NordigenClient({
  secretId: process.env.GOCARDLESS_SECRET_ID!,
  secretKey: process.env.GOCARDLESS_SECRET_KEY!,
});

async function syncBankAccounts() {
  try {
    // 1. Obtener cuentas registradas en DB
    const { data: accounts, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .not('account_id', 'is', null);
    
    if (error) throw error;
    
    for (const account of accounts) {
      await syncAccountTransactions(account);
    }
    
    console.log('Bank sync completed');
  } catch (error) {
    console.error('Bank sync error:', error);
  }
}

async function syncAccountTransactions(account: any) {
  try {
    const accountClient = nordigen.account(account.account_id);
    
    // Obtener transacciones de últimos 90 días
    const { transactions } = await accountClient.getTransactions();
    
    for (const tx of transactions.booked) {
      // Verificar si ya existe (por external_id)
      const { data: existing } = await supabase
        .from('bank_transactions')
        .select('id')
        .eq('external_id', tx.transactionId)
        .single();
      
      if (existing) continue; // Skip si ya existe
      
      // Insertar nueva transacción
      await supabase.from('bank_transactions').insert({
        account_id: account.id,
        external_id: tx.transactionId,
        transaction_date: tx.bookingDate,
        value_date: tx.valueDate,
        type: tx.transactionAmount.amount > 0 ? 'credit' : 'debit',
        amount: Math.abs(parseFloat(tx.transactionAmount.amount)),
        currency: tx.transactionAmount.currency,
        description: tx.remittanceInformationUnstructured,
        counterparty_name: tx.debtorName || tx.creditorName,
        counterparty_iban: tx.debtorAccount?.iban || tx.creditorAccount?.iban,
        reference: tx.bankTransactionCode,
        raw_data: tx,
      });
    }
    
    // Actualizar last_sync_at
    await supabase
      .from('bank_accounts')
      .update({ last_sync_at: new Date() })
      .eq('id', account.id);
    
    console.log(`Synced ${transactions.booked.length} transactions for account ${account.name}`);
  } catch (error) {
    console.error(`Error syncing account ${account.id}:`, error);
  }
}

// Cron: cada hora
setInterval(syncBankAccounts, 60 * 60 * 1000);
syncBankAccounts(); // Primera ejecución
```

### Interfaz TicketBAI Provider (Desacoplado)

```typescript
// src/lib/services/ticketbai/types.ts
export interface TicketBaiInvoiceData {
  series: string;
  invoiceNumber: string;
  issueDate: Date;
  
  issuer: {
    nif: string;
    name: string;
    address: string;
  };
  
  recipient: {
    nif: string;
    name: string;
    address?: string;
  };
  
  lines: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  
  taxBase: number;
  vatRate: number;
  vatAmount: number;
  irpfRate: number;
  irpfAmount: number;
  total: number;
  
  previousHash?: string; // Para encadenamiento
}

export interface TicketBaiSignedInvoice {
  currentHash: string;
  signatureValue: string;
  certificateSerial: string;
  qrCodeData: string;
  qrCodeImageBase64: string;
  xmlSignedBase64: string;
}

export interface TicketBaiProvider {
  /**
   * Firma una factura y genera el QR TicketBAI
   */
  signInvoice(data: TicketBaiInvoiceData): Promise<TicketBaiSignedInvoice>;
  
  /**
   * Envía factura firmada a Hacienda Foral
   */
  submitToHacienda(xmlSigned: string): Promise<{
    success: boolean;
    responseData?: any;
    error?: string;
  }>;
  
  /**
   * Valida certificado digital
   */
  validateCertificate(certificatePath: string, password: string): Promise<boolean>;
}
```

```typescript
// src/lib/services/ticketbai/kubibai.ts - Implementación con API externa
import axios from 'axios';
import type { TicketBaiProvider, TicketBaiInvoiceData, TicketBaiSignedInvoice } from './types';

export class KubiBAIProvider implements TicketBaiProvider {
  private apiUrl: string;
  private apiKey: string;
  
  constructor(apiUrl: string, apiKey: string) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
  }
  
  async signInvoice(data: TicketBaiInvoiceData): Promise<TicketBaiSignedInvoice> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/ticketbai/sign`,
        {
          invoice: data,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      return {
        currentHash: response.data.hash,
        signatureValue: response.data.signature,
        certificateSerial: response.data.certificateSerial,
        qrCodeData: response.data.qrData,
        qrCodeImageBase64: response.data.qrImage,
        xmlSignedBase64: response.data.xmlSigned,
      };
    } catch (error) {
      throw new Error(`KubiBAI signing failed: ${error}`);
    }
  }
  
  async submitToHacienda(xmlSigned: string): Promise<{ success: boolean; responseData?: any; error?: string }> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/ticketbai/submit`,
        { xmlSigned },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      return {
        success: response.data.success,
        responseData: response.data.haciendaResponse,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
  
  async validateCertificate(certificatePath: string, password: string): Promise<boolean> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/certificate/validate`,
        { certificatePath, password },
        {
          headers: { 'Authorization': `Bearer ${this.apiKey}` },
        }
      );
      
      return response.data.valid;
    } catch {
      return false;
    }
  }
}
```

```typescript
// src/lib/services/ticketbai/provider.ts - Factory Pattern
import { KubiBAIProvider } from './kubibai';
import type { TicketBaiProvider } from './types';

export function createTicketBaiProvider(): TicketBaiProvider {
  const providerType = process.env.TICKETBAI_PROVIDER || 'kubibai';
  
  switch (providerType) {
    case 'kubibai':
      return new KubiBAIProvider(
        process.env.KUBIBAI_API_URL!,
        process.env.KUBIBAI_API_KEY!
      );
    
    // Futuro: implementación propia
    // case 'native':
    //   return new NativeTicketBaiProvider();
    
    default:
      throw new Error(`Unknown TicketBAI provider: ${providerType}`);
  }
}
```

```typescript
// src/app/api/invoices/ticketbai/route.ts - Endpoint firma TicketBAI
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { invoices, ticketbaiRecords, companies } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createTicketBaiProvider } from '@/lib/services/ticketbai/provider';
import { createHash } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { invoiceId } = await request.json();
    
    const supabase = await createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // 1. Obtener factura
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId));
    
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    
    // 2. Obtener config empresa
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, invoice.companyId));
    
    if (!company.ticketbaiEnabled) {
      return NextResponse.json({ error: 'TicketBAI not enabled' }, { status: 400 });
    }
    
    // 3. Preparar datos para TicketBAI
    const ticketbaiData = {
      series: invoice.series || 'A',
      invoiceNumber: invoice.invoiceNumber || `${Date.now()}`,
      issueDate: invoice.issueDate,
      issuer: {
        nif: company.nif,
        name: company.name,
        address: company.address || '',
      },
      recipient: {
        nif: 'B12345678', // TODO: Obtener de contact
        name: 'Cliente',
      },
      lines: [{
        description: invoice.concept || 'Servicio',
        quantity: 1,
        unitPrice: Number(invoice.taxBase),
        total: Number(invoice.taxBase),
      }],
      taxBase: Number(invoice.taxBase),
      vatRate: Number(invoice.vatRate),
      vatAmount: Number(invoice.vatAmount),
      irpfRate: Number(invoice.irpfRate),
      irpfAmount: Number(invoice.irpfAmount),
      total: Number(invoice.total),
      previousHash: company.ticketbaiLastHash,
    };
    
    // 4. Firmar con provider
    const provider = createTicketBaiProvider();
    const signed = await provider.signInvoice(ticketbaiData);
    
    // 5. Guardar en DB
    const [tbaiRecord] = await db
      .insert(ticketbaiRecords)
      .values({
        invoiceId: invoice.id,
        series: ticketbaiData.series,
        invoiceNumber: ticketbaiData.invoiceNumber,
        issueDate: ticketbaiData.issueDate,
        previousHash: ticketbaiData.previousHash,
        currentHash: signed.currentHash,
        signatureValue: signed.signatureValue,
        certificateSerial: signed.certificateSerial,
        qrCodeData: signed.qrCodeData,
        status: 'signed',
      })
      .returning();
    
    // 6. Actualizar last_hash empresa
    await db
      .update(companies)
      .set({ ticketbaiLastHash: signed.currentHash })
      .where(eq(companies.id, company.id));
    
    // 7. Upload QR y XML a Storage
    const qrBuffer = Buffer.from(signed.qrCodeImageBase64, 'base64');
    await supabase.storage
      .from('invoices')
      .upload(`ticketbai/${tbaiRecord.id}/qr.png`, qrBuffer, {
        contentType: 'image/png',
      });
    
    const xmlBuffer = Buffer.from(signed.xmlSignedBase64, 'base64');
    await supabase.storage
      .from('invoices')
      .upload(`ticketbai/${tbaiRecord.id}/signed.xml`, xmlBuffer, {
        contentType: 'application/xml',
      });
    
    return NextResponse.json({
      success: true,
      ticketbaiId: tbaiRecord.id,
      qrCodeData: signed.qrCodeData,
    });
    
  } catch (error: any) {
    console.error('TicketBAI error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

---

## 5. GUÍA DE ARRANQUE

### Paso 1: Inicialización del Proyecto

```bash
# Crear proyecto Next.js
npx create-next-app@latest nekescu --typescript --tailwind --app --src-dir --import-alias "@/*"

cd nekescu

# Instalar dependencias core
npm install @supabase/supabase-js @supabase/ssr
npm install drizzle-orm drizzle-kit postgres
npm install zod react-hook-form @hookform/resolvers/zod
npm install lucide-react class-variance-authority clsx tailwind-merge

# shadcn/ui
npx shadcn@latest init

# Dev dependencies
npm install -D @types/node tsx dotenv-cli
```

### Paso 2: Configurar Variables de Entorno

```bash
# .env.example (copiar a .env.local)
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres

# TicketBAI Provider
TICKETBAI_PROVIDER=kubibai
KUBIBAI_API_URL=https://api.kubibai.com
KUBIBAI_API_KEY=your-kubibai-key

# GoCardless (Open Banking)
GOCARDLESS_SECRET_ID=your-secret-id
GOCARDLESS_SECRET_KEY=your-secret-key

# Email Processor
EMAIL_USER=facturas@tuempresa.com
EMAIL_PASSWORD=your-email-password
EMAIL_HOST=imap.gmail.com
EMAIL_PORT=993

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
DEFAULT_COMPANY_ID=uuid-de-tu-empresa
```

### Paso 3: Setup Drizzle + Supabase

```typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/lib/db/schema.ts',
  out: './supabase/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
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

```bash
# Generar migración inicial
npx drizzle-kit generate

# Aplicar migración en Supabase
npx supabase db push
```

### Siguientes 3 Pasos Inmediatos

#### 1. **Crear primera ruta protegida con auth**

```bash
# Instalar shadcn components básicos
npx shadcn@latest add button
npx shadcn@latest add form
npx shadcn@latest add input
npx shadcn@latest add card
```

```typescript
// src/app/(auth)/login/page.tsx
'use client';

import { useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const supabase = createBrowserClient();
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (!error) {
      router.push('/');
      router.refresh();
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md p-8">
        <h1 className="text-2xl font-bold mb-6">nekescu ERP</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" className="w-full">
            Entrar
          </Button>
        </form>
      </Card>
    </div>
  );
}
```

#### 2. **Crear primera entidad: Companies CRUD**

```bash
# Crear componentes de formulario
npx shadcn@latest add select
npx shadcn@latest add textarea
```

```typescript
// src/app/(dashboard)/configuracion/page.tsx
import { createServerClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { companies } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { CompanyForm } from '@/components/company/company-form';

export default async function ConfigPage() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  const companyId = session?.user.user_metadata?.company_id;
  
  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.id, companyId));
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Configuración de Empresa</h1>
      <CompanyForm company={company} />
    </div>
  );
}
```

#### 3. **Setup worker email processor (básico)**

```bash
cd workers/email-processor
npm init -y
npm install imap mailparser @supabase/supabase-js nanoid
npm install -D typescript @types/node tsx

# package.json script
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

Ejecutar worker en desarrollo:
```bash
cd workers/email-processor
npm run dev
```

---

## RESUMEN TÉCNICO

**Monolito modular Next.js** con workers desacoplados para jobs pesados (email, banking).

**Base de datos** optimizada para patrimoniales: propiedades, contactos, facturas con IVA/IRPF, TicketBAI con encadenamiento hash, cuentas bancarias con conciliación.

**Frontend** con Server Components por defecto (performance), Client Components solo donde necesites interactividad.

**Backend workers** con cron jobs para ingesta de emails y sincronización bancaria GoCardless.

**TicketBAI** desacoplado mediante interfaz `TicketBaiProvider` para cambiar implementación sin romper código.

**Próximos pasos**: OCR facturas con Anthropic Claude Vision API, matching inteligente para conciliación bancaria, generación PDF facturas con QR TicketBAI.

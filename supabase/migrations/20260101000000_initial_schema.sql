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

-- RLS (Row Level Security)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticketbai_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users access own company data" ON companies
  FOR ALL USING (
    id::text = (auth.jwt() -> 'user_metadata' ->> 'company_id')
  );

CREATE POLICY "Users access own company properties" ON properties
  FOR ALL USING (
    company_id::text = (auth.jwt() -> 'user_metadata' ->> 'company_id')
  );

CREATE POLICY "Users access own company contacts" ON contacts
  FOR ALL USING (
    company_id::text = (auth.jwt() -> 'user_metadata' ->> 'company_id')
  );

CREATE POLICY "Users access own company invoices" ON invoices
  FOR ALL USING (
    company_id::text = (auth.jwt() -> 'user_metadata' ->> 'company_id')
  );

CREATE POLICY "Users access own company ticketbai" ON ticketbai_records
  FOR ALL USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE company_id::text = (auth.jwt() -> 'user_metadata' ->> 'company_id')
    )
  );

CREATE POLICY "Users access own company bank_accounts" ON bank_accounts
  FOR ALL USING (
    company_id::text = (auth.jwt() -> 'user_metadata' ->> 'company_id')
  );

CREATE POLICY "Users access own company transactions" ON bank_transactions
  FOR ALL USING (
    account_id IN (
      SELECT id FROM bank_accounts WHERE company_id::text = (auth.jwt() -> 'user_metadata' ->> 'company_id')
    )
  );

CREATE POLICY "Users access own company reconciliations" ON reconciliations
  FOR ALL USING (
    transaction_id IN (
      SELECT id FROM bank_transactions WHERE account_id IN (
        SELECT id FROM bank_accounts WHERE company_id::text = (auth.jwt() -> 'user_metadata' ->> 'company_id')
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

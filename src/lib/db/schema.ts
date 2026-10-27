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
  ticketbaiNifEmisor: text('ticketbai_nif_emisor'),
  ticketbaiSerialNumber: text('ticketbai_serial_number'),
  ticketbaiLastHash: text('ticketbai_last_hash'),
  ticketbaiCertificatePath: text('ticketbai_certificate_path'),

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
  pdfPath: text('pdf_path'),

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
  previousHash: text('previous_hash'),
  currentHash: text('current_hash').notNull(),

  // Firma digital
  signatureValue: text('signature_value').notNull(),
  certificateSerial: text('certificate_serial').notNull(),

  // QR Code
  qrCodeData: text('qr_code_data').notNull(),
  qrCodeImagePath: text('qr_code_image_path'),

  // Estado validación
  status: ticketbaiStatusEnum('status').default('pending'),
  haciendaResponse: jsonb('hacienda_response'),
  sentAt: timestamp('sent_at'),
  validatedAt: timestamp('validated_at'),
  errorMessage: text('error_message'),

  // TBAI XML
  xmlPath: text('xml_path'),

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
  accountId: text('account_id'),

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
  externalId: text('external_id').unique(),
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
  matchConfidence: numeric('match_confidence', { precision: 3, scale: 2 }),

  notes: text('notes'),
  createdBy: uuid('created_by'),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============ TYPES ============
export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;

export type Property = typeof properties.$inferSelect;
export type NewProperty = typeof properties.$inferInsert;

export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;

export type TicketbaiRecord = typeof ticketbaiRecords.$inferSelect;
export type NewTicketbaiRecord = typeof ticketbaiRecords.$inferInsert;

export type BankAccount = typeof bankAccounts.$inferSelect;
export type NewBankAccount = typeof bankAccounts.$inferInsert;

export type BankTransaction = typeof bankTransactions.$inferSelect;
export type NewBankTransaction = typeof bankTransactions.$inferInsert;

export type Reconciliation = typeof reconciliations.$inferSelect;
export type NewReconciliation = typeof reconciliations.$inferInsert;

-- Seed data para desarrollo y testing

-- Insertar empresa de ejemplo
INSERT INTO companies (id, name, nif, address, postal_code, city, province, email, phone, ticketbai_enabled)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Mi Sociedad Patrimonial S.L.',
  'B12345678',
  'Calle Gran Vía, 123',
  '48001',
  'Bilbao',
  'Bizkaia',
  'info@misociedad.com',
  '+34944000000',
  false
) ON CONFLICT (id) DO NOTHING;

-- Insertar contactos de ejemplo
INSERT INTO contacts (company_id, type, name, nif, email, phone, address, iban)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'tenant',
    'Juan Pérez García',
    '12345678A',
    'juan.perez@example.com',
    '+34600111222',
    'Calle Menor, 45, 3º B',
    'ES9121000418450200051332'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'supplier',
    'Electricidad Norte S.L.',
    'B87654321',
    'facturacion@electricidadnorte.com',
    '+34944555666',
    'Polígono Industrial, Nave 12',
    NULL
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'customer',
    'María López Fernández',
    '87654321B',
    'maria.lopez@example.com',
    '+34600333444',
    'Avenida Principal, 78, 1º A',
    'ES7921000813610123456789'
  )
ON CONFLICT DO NOTHING;

-- Insertar propiedades de ejemplo
INSERT INTO properties (company_id, name, address, cadastral_reference, purchase_date, purchase_price, current_value, monthly_rent)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'Local Comercial Gran Vía',
    'Gran Vía, 123, Bilbao',
    '48001A001000010001AB',
    '2020-01-15',
    250000.00,
    280000.00,
    1500.00
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Piso Calle Licenciado Poza',
    'Calle Licenciado Poza, 45, 3º B, Bilbao',
    '48001A002000020002CD',
    '2019-06-20',
    180000.00,
    200000.00,
    900.00
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Oficina Ensanche',
    'Alameda Urquijo, 88, 5º, Bilbao',
    '48001A003000030003EF',
    '2021-03-10',
    120000.00,
    130000.00,
    700.00
  )
ON CONFLICT DO NOTHING;

-- Nota: No insertamos facturas de ejemplo porque requieren contactos y propiedades con IDs reales
-- El usuario puede crearlas desde la interfaz una vez que la aplicación esté funcionando

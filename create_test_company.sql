-- Insertar empresa de prueba para el sistema
INSERT INTO empresas (
  nombre,
  razon_social,
  nit,
  direccion,
  telefono,
  email,
  representante_legal,
  cargo_representante,
  estado,
  created_at,
  updated_at
) VALUES (
  'Empresa de Prueba',
  'Empresa de Prueba S.A.S.',
  '900123456-7',
  'Calle 123 #45-67',
  '3001234567',
  'contacto@empresaprueba.com',
  'Juan Pérez',
  'Gerente General',
  'activo',
  NOW(),
  NOW()
) ON CONFLICT (nit) DO NOTHING;

-- Verificar que la empresa se insertó correctamente
SELECT * FROM empresas WHERE nit = '900123456-7'; 
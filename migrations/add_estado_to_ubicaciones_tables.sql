-- Migración para agregar campo estado a las tablas de ubicaciones
-- Ejecutar en orden para mantener la integridad referencial

-- 1. Agregar campo estado a la tabla paises
ALTER TABLE paises 
ADD COLUMN IF NOT EXISTS estado BOOLEAN DEFAULT TRUE;

-- Actualizar registros existentes que no tengan estado
UPDATE paises 
SET estado = TRUE 
WHERE estado IS NULL;

-- 2. Agregar campo estado a la tabla departamentos
ALTER TABLE departamentos 
ADD COLUMN IF NOT EXISTS estado BOOLEAN DEFAULT TRUE;

-- Actualizar registros existentes que no tengan estado
UPDATE departamentos 
SET estado = TRUE 
WHERE estado IS NULL;

-- 3. Agregar campo estado a la tabla ciudades
ALTER TABLE ciudades 
ADD COLUMN IF NOT EXISTS estado BOOLEAN DEFAULT TRUE;

-- Actualizar registros existentes que no tengan estado
UPDATE ciudades 
SET estado = TRUE 
WHERE estado IS NULL;

-- 4. Crear índices para mejorar el rendimiento de consultas por estado
CREATE INDEX IF NOT EXISTS idx_paises_estado ON paises(estado);
CREATE INDEX IF NOT EXISTS idx_departamentos_estado ON departamentos(estado);
CREATE INDEX IF NOT EXISTS idx_ciudades_estado ON ciudades(estado);

-- 5. Agregar comentarios a las columnas
COMMENT ON COLUMN paises.estado IS 'Estado del país: TRUE = Activo, FALSE = Inactivo';
COMMENT ON COLUMN departamentos.estado IS 'Estado del departamento: TRUE = Activo, FALSE = Inactivo';
COMMENT ON COLUMN ciudades.estado IS 'Estado de la ciudad: TRUE = Activo, FALSE = Inactivo';

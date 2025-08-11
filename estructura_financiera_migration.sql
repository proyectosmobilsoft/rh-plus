-- Migración para crear las tablas de estructura financiera
-- Ejecutar en Supabase SQL Editor

-- 1. Crear tabla regionales
CREATE TABLE IF NOT EXISTS regionales (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(10) NOT NULL UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear tabla sucursales
CREATE TABLE IF NOT EXISTS sucursales (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    regional_id INTEGER REFERENCES regionales(id) ON DELETE CASCADE,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Crear tabla proyectos
CREATE TABLE IF NOT EXISTS proyectos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    regional_id INTEGER REFERENCES regionales(id) ON DELETE CASCADE,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Crear tabla centros_costo
CREATE TABLE IF NOT EXISTS centros_costo (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    proyecto_id INTEGER REFERENCES proyectos(id) ON DELETE CASCADE,
    area_negocio VARCHAR(100) NOT NULL,
    porcentaje_estructura DECIMAL(5,2) DEFAULT 0.00,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_sucursales_regional ON sucursales(regional_id);
CREATE INDEX IF NOT EXISTS idx_proyectos_regional ON proyectos(regional_id);
CREATE INDEX IF NOT EXISTS idx_centros_costo_proyecto ON centros_costo(proyecto_id);

-- 6. Habilitar RLS (Row Level Security)
ALTER TABLE regionales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sucursales ENABLE ROW LEVEL SECURITY;
ALTER TABLE proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE centros_costo ENABLE ROW LEVEL SECURITY;

-- 7. Crear políticas RLS para usuarios autenticados
-- Regionales
CREATE POLICY "Enable all for authenticated users" ON regionales
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for service_role" ON regionales
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Sucursales
CREATE POLICY "Enable all for authenticated users" ON sucursales
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for service_role" ON sucursales
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Proyectos
CREATE POLICY "Enable all for authenticated users" ON proyectos
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for service_role" ON proyectos
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Centros de Costo
CREATE POLICY "Enable all for authenticated users" ON centros_costo
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for service_role" ON centros_costo
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 8. Insertar datos de ejemplo basados en el Excel
-- Regionales
INSERT INTO regionales (codigo, nombre) VALUES
('REG-001', 'REGIONAL NORTE'),
('REG-002', 'REGIONAL CENTRO'),
('REG-003', 'REGIONAL NOROCCIDENTE'),
('REG-004', 'REGIONAL SUROCCIDENTE'),
('REG-005', 'REGIONAL ESCATLERO')
ON CONFLICT (codigo) DO NOTHING;

-- Sucursales (ejemplos basados en el Excel)
INSERT INTO sucursales (codigo, nombre, regional_id) VALUES
('11010001', 'Suc Cali Av Cañasgordas', (SELECT id FROM regionales WHERE codigo = 'REG-002')),
('11010002', 'Suc Cali Av Estacion', (SELECT id FROM regionales WHERE codigo = 'REG-002')),
('11010003', 'Suc Cali Av Pasoancho', (SELECT id FROM regionales WHERE codigo = 'REG-002')),
('11010004', 'Suc Cali Av Roosevelt', (SELECT id FROM regionales WHERE codigo = 'REG-002')),
('11010005', 'Suc Cali Centro', (SELECT id FROM regionales WHERE codigo = 'REG-002'))
ON CONFLICT (codigo) DO NOTHING;

-- Proyectos (ejemplos basados en el Excel)
INSERT INTO proyectos (codigo, nombre, regional_id) VALUES
('110001', 'Consulta Médica Especializada', (SELECT id FROM regionales WHERE codigo = 'REG-002')),
('110002', 'Medicina Preventiva', (SELECT id FROM regionales WHERE codigo = 'REG-002')),
('110003', 'Consulta Médica Especializada', (SELECT id FROM regionales WHERE codigo = 'REG-001')),
('110004', 'Exámenes Médicos Ocupacionales', (SELECT id FROM regionales WHERE codigo = 'REG-001'))
ON CONFLICT (codigo) DO NOTHING;

-- Centros de Costo (ejemplos basados en el Excel)
INSERT INTO centros_costo (codigo, nombre, proyecto_id, area_negocio, porcentaje_estructura) VALUES
('110001', 'Consulta Médica Especializada', (SELECT id FROM proyectos WHERE codigo = '110001'), 'Administrativo', 100.00),
('110002', 'Medicina Preventiva', (SELECT id FROM proyectos WHERE codigo = '110002'), 'Administrativo', 100.00),
('110003', 'Consulta Médica Especializada', (SELECT id FROM proyectos WHERE codigo = '110003'), 'Administrativo', 100.00),
('110004', 'Exámenes Médicos Ocupacionales', (SELECT id FROM proyectos WHERE codigo = '110004'), 'Administrativo', 100.00)
ON CONFLICT (codigo) DO NOTHING;

-- 9. Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Crear triggers para actualizar updated_at
CREATE TRIGGER update_regionales_updated_at BEFORE UPDATE ON regionales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sucursales_updated_at BEFORE UPDATE ON sucursales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proyectos_updated_at BEFORE UPDATE ON proyectos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_centros_costo_updated_at BEFORE UPDATE ON centros_costo
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verificar que las tablas se crearon correctamente
SELECT 'regionales' as tabla, COUNT(*) as registros FROM regionales
UNION ALL
SELECT 'sucursales' as tabla, COUNT(*) as registros FROM sucursales
UNION ALL
SELECT 'proyectos' as tabla, COUNT(*) as registros FROM proyectos
UNION ALL
SELECT 'centros_costo' as tabla, COUNT(*) as registros FROM centros_costo;

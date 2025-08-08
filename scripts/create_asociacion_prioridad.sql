-- Script para crear la tabla asociacion_prioridad
-- Este script debe ejecutarse en la base de datos de Supabase

-- Crear tabla asociacion_prioridad que relaciona usuarios (analistas) con empresas y sus niveles de prioridad
CREATE TABLE IF NOT EXISTS asociacion_prioridad (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES gen_usuarios(id) ON DELETE CASCADE,
    empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nivel_prioridad_1 BOOLEAN DEFAULT FALSE,
    nivel_prioridad_2 BOOLEAN DEFAULT FALSE,
    nivel_prioridad_3 BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(usuario_id, empresa_id)
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_asociacion_prioridad_usuario ON asociacion_prioridad(usuario_id);
CREATE INDEX IF NOT EXISTS idx_asociacion_prioridad_empresa ON asociacion_prioridad(empresa_id);
CREATE INDEX IF NOT EXISTS idx_asociacion_prioridad_niveles ON asociacion_prioridad(nivel_prioridad_1, nivel_prioridad_2, nivel_prioridad_3);

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para actualizar updated_at
DROP TRIGGER IF EXISTS update_asociacion_prioridad_updated_at ON asociacion_prioridad;
CREATE TRIGGER update_asociacion_prioridad_updated_at
    BEFORE UPDATE ON asociacion_prioridad
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comentarios para documentar la tabla
COMMENT ON TABLE asociacion_prioridad IS 'Tabla que relaciona analistas (gen_usuarios) con empresas y define sus niveles de prioridad';
COMMENT ON COLUMN asociacion_prioridad.usuario_id IS 'ID del analista (referencia a gen_usuarios con rol_id = 4)';
COMMENT ON COLUMN asociacion_prioridad.empresa_id IS 'ID de la empresa (referencia a empresas)';
COMMENT ON COLUMN asociacion_prioridad.nivel_prioridad_1 IS 'Indica si el analista tiene prioridad nivel 1 para esta empresa';
COMMENT ON COLUMN asociacion_prioridad.nivel_prioridad_2 IS 'Indica si el analista tiene prioridad nivel 2 para esta empresa';
COMMENT ON COLUMN asociacion_prioridad.nivel_prioridad_3 IS 'Indica si el analista tiene prioridad nivel 3 para esta empresa';

-- Insertar algunos datos de ejemplo (opcional)
-- INSERT INTO asociacion_prioridad (usuario_id, empresa_id, nivel_prioridad_1, nivel_prioridad_2, nivel_prioridad_3) 
-- VALUES 
-- (1, 1, true, false, false),
-- (1, 2, false, true, false),
-- (2, 1, false, false, true);

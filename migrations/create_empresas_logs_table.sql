-- Migración: Crear tabla para logs de acciones en empresas
-- Fecha: 2024-12-19
-- Descripción: Crear tabla para registrar todas las acciones realizadas en empresas del sistema

-- Crear tabla para logs de empresas
CREATE TABLE IF NOT EXISTS gen_empresas_logs (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,
    accion VARCHAR(100) NOT NULL,
    detalles TEXT,
    fecha_accion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Índices para mejor rendimiento en consultas
    CONSTRAINT idx_empresas_logs_empresa_id FOREIGN KEY (empresa_id) REFERENCES gen_empresas(id) ON DELETE CASCADE,
    CONSTRAINT idx_empresas_logs_usuario_id FOREIGN KEY (usuario_id) REFERENCES gen_usuarios(id) ON DELETE CASCADE
);

-- Crear índices adicionales para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_empresas_logs_fecha_accion ON gen_empresas_logs(fecha_accion);
CREATE INDEX IF NOT EXISTS idx_empresas_logs_accion ON gen_empresas_logs(accion);
CREATE INDEX IF NOT EXISTS idx_empresas_logs_empresa_id ON gen_empresas_logs(empresa_id);

-- Agregar comentarios a la tabla y columnas
COMMENT ON TABLE gen_empresas_logs IS 'Registro de todas las acciones realizadas en empresas del sistema';
COMMENT ON COLUMN gen_empresas_logs.empresa_id IS 'ID de la empresa sobre la que se realizó la acción';
COMMENT ON COLUMN gen_empresas_logs.usuario_id IS 'ID del usuario que realizó la acción';
COMMENT ON COLUMN gen_empresas_logs.accion IS 'Tipo de acción realizada (CREAR, EDITAR, ELIMINAR, etc.)';
COMMENT ON COLUMN gen_empresas_logs.detalles IS 'Detalles adicionales de la acción realizada';
COMMENT ON COLUMN gen_empresas_logs.fecha_accion IS 'Fecha y hora en que se realizó la acción';

-- Verificar que la tabla se creó correctamente
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'gen_empresas_logs' 
ORDER BY ordinal_position;

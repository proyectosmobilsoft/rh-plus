-- Migración: Crear tabla para logs de acciones en usuarios
-- Fecha: 2024-12-19
-- Descripción: Crear tabla para registrar todas las acciones realizadas en usuarios del sistema

-- Crear tabla para logs de usuarios
CREATE TABLE IF NOT EXISTS gen_usuarios_logs (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    accion VARCHAR(100) NOT NULL,
    detalles TEXT,
    fecha_accion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Índices para mejor rendimiento en consultas
    CONSTRAINT idx_usuarios_logs_usuario_id FOREIGN KEY (usuario_id) REFERENCES gen_usuarios(id) ON DELETE CASCADE
);

-- Crear índices adicionales para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_usuarios_logs_fecha_accion ON gen_usuarios_logs(fecha_accion);
CREATE INDEX IF NOT EXISTS idx_usuarios_logs_accion ON gen_usuarios_logs(accion);

-- Agregar comentarios a la tabla y columnas
COMMENT ON TABLE gen_usuarios_logs IS 'Registro de todas las acciones realizadas en usuarios del sistema';
COMMENT ON COLUMN gen_usuarios_logs.usuario_id IS 'ID del usuario sobre el que se realizó la acción';
COMMENT ON COLUMN gen_usuarios_logs.accion IS 'Tipo de acción realizada (CREAR, EDITAR, ELIMINAR, etc.)';
COMMENT ON COLUMN gen_usuarios_logs.detalles IS 'Detalles adicionales de la acción realizada';
COMMENT ON COLUMN gen_usuarios_logs.fecha_accion IS 'Fecha y hora en que se realizó la acción';

-- Verificar que la tabla se creó correctamente
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'gen_usuarios_logs' 
ORDER BY ordinal_position;

-- Crear tabla para logs de acciones en solicitudes
CREATE TABLE IF NOT EXISTS hum_solicitudes_logs (
    id SERIAL PRIMARY KEY,
    solicitud_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,
    accion VARCHAR(100) NOT NULL,
    estado_anterior VARCHAR(50),
    estado_nuevo VARCHAR(50),
    observacion TEXT,
    fecha_accion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Índices para mejor rendimiento en consultas
    CONSTRAINT idx_solicitudes_logs_solicitud_id FOREIGN KEY (solicitud_id) REFERENCES hum_solicitudes(id) ON DELETE CASCADE,
    CONSTRAINT idx_solicitudes_logs_usuario_id FOREIGN KEY (usuario_id) REFERENCES gen_usuarios(id) ON DELETE CASCADE
);

-- Crear índices para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_solicitudes_logs_solicitud_id ON hum_solicitudes_logs(solicitud_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_logs_usuario_id ON hum_solicitudes_logs(usuario_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_logs_fecha_accion ON hum_solicitudes_logs(fecha_accion);
CREATE INDEX IF NOT EXISTS idx_solicitudes_logs_accion ON hum_solicitudes_logs(accion);

-- Comentarios de la tabla
COMMENT ON TABLE hum_solicitudes_logs IS 'Tabla para almacenar logs de todas las acciones realizadas en solicitudes';
COMMENT ON COLUMN hum_solicitudes_logs.id IS 'Identificador único del log';
COMMENT ON COLUMN hum_solicitudes_logs.solicitud_id IS 'ID de la solicitud sobre la que se realizó la acción';
COMMENT ON COLUMN hum_solicitudes_logs.usuario_id IS 'ID del usuario que realizó la acción';
COMMENT ON COLUMN hum_solicitudes_logs.accion IS 'Tipo de acción realizada (CREAR, CAMBIAR_ESTADO, ASIGNAR_ANALISTA, etc.)';
COMMENT ON COLUMN hum_solicitudes_logs.estado_anterior IS 'Estado anterior de la solicitud (si aplica)';
COMMENT ON COLUMN hum_solicitudes_logs.estado_nuevo IS 'Nuevo estado de la solicitud (si aplica)';
COMMENT ON COLUMN hum_solicitudes_logs.observacion IS 'Descripción detallada de la acción realizada';
COMMENT ON COLUMN hum_solicitudes_logs.fecha_accion IS 'Fecha y hora exacta cuando se realizó la acción';

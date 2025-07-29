-- Script para crear la tabla de códigos de verificación
-- Ejecutar este script en Supabase SQL Editor

-- Tabla para códigos de verificación de recuperación de contraseña
CREATE TABLE IF NOT EXISTS codigos_verificacion (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    codigo VARCHAR(6) NOT NULL,
    tipo VARCHAR(20) NOT NULL DEFAULT 'recuperacion',
    usado BOOLEAN DEFAULT FALSE,
    fecha_expiracion TIMESTAMP WITH TIME ZONE NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_codigos_verificacion_email ON codigos_verificacion(email);
CREATE INDEX IF NOT EXISTS idx_codigos_verificacion_codigo ON codigos_verificacion(codigo);
CREATE INDEX IF NOT EXISTS idx_codigos_verificacion_fecha_expiracion ON codigos_verificacion(fecha_expiracion);

-- Política RLS (Row Level Security) - opcional
-- ALTER TABLE codigos_verificacion ENABLE ROW LEVEL SECURITY;

-- Comentarios sobre la tabla
COMMENT ON TABLE codigos_verificacion IS 'Tabla para almacenar códigos de verificación para recuperación de contraseñas';
COMMENT ON COLUMN codigos_verificacion.email IS 'Email del usuario que solicita la recuperación';
COMMENT ON COLUMN codigos_verificacion.codigo IS 'Código de 6 dígitos para verificación';
COMMENT ON COLUMN codigos_verificacion.tipo IS 'Tipo de verificación (recuperacion, verificacion, etc.)';
COMMENT ON COLUMN codigos_verificacion.usado IS 'Indica si el código ya fue utilizado';
COMMENT ON COLUMN codigos_verificacion.fecha_expiracion IS 'Fecha y hora de expiración del código';
COMMENT ON COLUMN codigos_verificacion.fecha_creacion IS 'Fecha y hora de creación del código'; 
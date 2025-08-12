-- Script para aplicar la migración de previous_state
-- Ejecutar este script en la base de datos de Supabase

-- Agregar columna previous_state a hum_solicitudes
ALTER TABLE hum_solicitudes 
ADD COLUMN IF NOT EXISTS previous_state VARCHAR(50);

-- Agregar comentario a la columna
COMMENT ON COLUMN hum_solicitudes.previous_state IS 'Estado anterior de la solicitud antes de ponerla en Stand By';

-- Crear índice para mejorar el rendimiento de consultas
CREATE INDEX IF NOT EXISTS idx_hum_solicitudes_previous_state ON hum_solicitudes(previous_state);

-- Verificar que la columna se creó correctamente
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'hum_solicitudes' 
AND column_name = 'previous_state';

-- Mostrar la estructura actualizada de la tabla
\d hum_solicitudes

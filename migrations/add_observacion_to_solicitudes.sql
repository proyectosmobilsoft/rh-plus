-- Migración: Agregar campo observaciones a la tabla hum_solicitudes
-- Fecha: 2024-12-19
-- Descripción: Agregar campo para almacenar observaciones sobre el estado de la solicitud

-- Agregar la columna observaciones (permitir NULL para solicitudes sin observaciones)
ALTER TABLE hum_solicitudes 
ADD COLUMN observaciones TEXT NULL;

-- Agregar comentario a la columna
COMMENT ON COLUMN hum_solicitudes.observaciones IS 'Observaciones sobre el estado actual de la solicitud';

-- Verificar que la columna se agregó correctamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'hum_solicitudes' 
AND column_name = 'observaciones';

-- Mostrar el estado actual de la tabla
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'hum_solicitudes' 
ORDER BY ordinal_position;

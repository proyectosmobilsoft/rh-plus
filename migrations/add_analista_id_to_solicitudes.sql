-- Migración: Agregar campo analista_id a la tabla hum_solicitudes
-- Fecha: 2024-12-19
-- Descripción: Agregar campo para almacenar el ID del analista asignado a cada solicitud
-- NOTA: No se agregan foreign key constraints para permitir solicitudes sin analista asignado

-- Agregar la columna analista_id (permitir NULL para solicitudes sin asignar)
ALTER TABLE hum_solicitudes 
ADD COLUMN analista_id INTEGER NULL;

-- Agregar comentario a la columna
COMMENT ON COLUMN hum_solicitudes.analista_id IS 'ID del analista asignado a la solicitud (NULL si no hay analista asignado)';

-- Agregar índice para mejorar el rendimiento de consultas
CREATE INDEX idx_hum_solicitudes_analista_id ON hum_solicitudes(analista_id);

-- Agregar índice compuesto para consultas por empresa y analista
CREATE INDEX idx_hum_solicitudes_empresa_analista ON hum_solicitudes(empresa_id, analista_id);

-- Verificar que la columna se agregó correctamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'hum_solicitudes' 
AND column_name = 'analista_id';

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

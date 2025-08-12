-- Script para verificar la estructura actual de la tabla hum_solicitudes
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar la estructura actual de la tabla
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'hum_solicitudes' 
ORDER BY ordinal_position;

-- 2. Verificar si existe la columna observaciones
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'hum_solicitudes' 
AND column_name = 'observaciones';

-- 3. Mostrar algunos datos de ejemplo
SELECT 
    id,
    estado,
    observaciones,
    created_at,
    updated_at,
    empresa_id,
    analista_id
FROM hum_solicitudes 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. Verificar si la tabla de logs existe
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'hum_solicitudes_logs';

-- 5. Si la columna observaciones no existe, ejecutar la migración
-- (Descomentar las siguientes líneas si la columna no existe)

-- ALTER TABLE hum_solicitudes 
-- ADD COLUMN observaciones TEXT NULL;

-- COMMENT ON COLUMN hum_solicitudes.observaciones IS 'Observaciones sobre el estado actual de la solicitud';

-- 6. Verificar el resultado después de la migración
-- SELECT 
--     column_name,
--     data_type,
--     is_nullable
-- FROM information_schema.columns 
-- WHERE table_name = 'hum_solicitudes' 
-- AND column_name = 'observaciones';

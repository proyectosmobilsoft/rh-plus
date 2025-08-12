-- Script simple para verificar si la columna observaciones ya existe
-- Ejecutar en Supabase SQL Editor

-- Verificar si existe la columna observaciones
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'hum_solicitudes' 
AND column_name = 'observaciones';

-- Si no devuelve resultados, la columna no existe
-- Si devuelve resultados, la columna ya existe y no necesitas la migración

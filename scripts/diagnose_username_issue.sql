-- Script para diagnosticar el problema de username duplicado
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar la estructura de la tabla gen_usuarios
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'gen_usuarios'
ORDER BY ordinal_position;

-- 2. Verificar restricciones únicas en la tabla
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name,
    tc.constraint_type
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'UNIQUE' 
  AND tc.table_name = 'gen_usuarios';

-- 3. Buscar usuarios con username 'ana.garcia'
SELECT 
    id,
    username,
    email,
    primer_nombre,
    primer_apellido,
    activo,
    created_at
FROM gen_usuarios
WHERE username = 'ana.garcia'
ORDER BY created_at;

-- 4. Buscar usuarios con email 'ana.garcia@empresa.com'
SELECT 
    id,
    username,
    email,
    primer_nombre,
    primer_apellido,
    activo,
    created_at
FROM gen_usuarios
WHERE email = 'ana.garcia@empresa.com'
ORDER BY created_at;

-- 5. Contar total de usuarios con username similar
SELECT 
    username,
    COUNT(*) as cantidad
FROM gen_usuarios
WHERE username LIKE '%ana%garcia%'
GROUP BY username
HAVING COUNT(*) > 1;

-- 6. Verificar si hay índices únicos
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'gen_usuarios'
  AND indexdef LIKE '%UNIQUE%';

-- 7. Verificar todos los usuarios activos
SELECT 
    id,
    username,
    email,
    primer_nombre || ' ' || primer_apellido as nombre_completo,
    activo
FROM gen_usuarios
WHERE activo = true
ORDER BY username;

-- 8. Si necesitas eliminar duplicados (¡CUIDADO! Solo ejecutar si hay duplicados confirmados)
-- COMENTADO POR SEGURIDAD - Descomenta solo si es necesario
/*
-- Encontrar duplicados por username
WITH duplicates AS (
    SELECT username, MIN(id) as keep_id
    FROM gen_usuarios
    WHERE username = 'ana.garcia'
    GROUP BY username
    HAVING COUNT(*) > 1
)
SELECT 
    gu.id,
    gu.username,
    gu.email,
    CASE WHEN gu.id = d.keep_id THEN 'MANTENER' ELSE 'ELIMINAR' END as accion
FROM gen_usuarios gu
JOIN duplicates d ON gu.username = d.username
WHERE gu.username = 'ana.garcia'
ORDER BY gu.id;
*/

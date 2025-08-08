-- Script para diagnosticar el problema específico de username duplicado al editar
-- Ejecutar en Supabase SQL Editor cuando ocurra el error

-- 1. Ver todos los usuarios con usernames similares al que está causando problemas
-- Reemplaza 'username_problema' con el username que está causando el error
SELECT 
    id,
    username,
    email,
    primer_nombre,
    primer_apellido,
    activo,
    created_at,
    updated_at
FROM gen_usuarios
WHERE username ILIKE '%username_problema%'  -- Reemplazar 'username_problema'
ORDER BY created_at;

-- 2. Buscar duplicados exactos de username
SELECT 
    username,
    COUNT(*) as cantidad,
    array_agg(id ORDER BY created_at) as ids,
    array_agg(primer_nombre || ' ' || primer_apellido ORDER BY created_at) as nombres
FROM gen_usuarios
GROUP BY username
HAVING COUNT(*) > 1
ORDER BY cantidad DESC;

-- 3. Buscar duplicados exactos de email
SELECT 
    email,
    COUNT(*) as cantidad,
    array_agg(id ORDER BY created_at) as ids,
    array_agg(primer_nombre || ' ' || primer_apellido ORDER BY created_at) as nombres
FROM gen_usuarios
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY cantidad DESC;

-- 4. Ver el último usuario que se intentó actualizar (si conoces el ID)
-- Reemplaza 'USER_ID' con el ID del usuario que estás editando
SELECT 
    id,
    username,
    email,
    primer_nombre,
    primer_apellido,
    activo,
    created_at,
    updated_at
FROM gen_usuarios
WHERE id = USER_ID;  -- Reemplazar USER_ID

-- 5. Verificar si hay restricciones únicas en la tabla
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'gen_usuarios'::regclass
AND contype = 'u';  -- Unique constraints

-- 6. Ver índices únicos
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'gen_usuarios'
AND indexdef LIKE '%UNIQUE%';

-- 7. Función para limpiar duplicados (¡USAR CON CUIDADO!)
-- SOLO ejecutar si confirmas que hay duplicados y sabes cuál mantener
/*
-- Ejemplo para eliminar duplicados de username, manteniendo el más reciente
WITH duplicates AS (
    SELECT 
        username,
        id,
        ROW_NUMBER() OVER (PARTITION BY username ORDER BY created_at DESC) as rn
    FROM gen_usuarios
    WHERE username = 'username_problema'  -- Reemplazar con el username problemático
)
DELETE FROM gen_usuarios 
WHERE id IN (
    SELECT id 
    FROM duplicates 
    WHERE rn > 1
);
*/

-- 8. Verificar la integridad después de limpiar duplicados
SELECT 
    'Username duplicados' as tipo,
    COUNT(*) as total
FROM (
    SELECT username
    FROM gen_usuarios
    GROUP BY username
    HAVING COUNT(*) > 1
) as duplicated_usernames

UNION ALL

SELECT 
    'Email duplicados' as tipo,
    COUNT(*) as total
FROM (
    SELECT email
    FROM gen_usuarios
    GROUP BY email
    HAVING COUNT(*) > 1
) as duplicated_emails;

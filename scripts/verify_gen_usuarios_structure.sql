-- Script para verificar la estructura de gen_usuarios y crear datos de prueba
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

-- 2. Verificar si existen datos en la tabla
SELECT COUNT(*) as total_usuarios FROM gen_usuarios;

-- 3. Verificar si existe un usuario con ID 1
SELECT 
    id, 
    username, 
    email, 
    primer_nombre, 
    primer_apellido, 
    activo, 
    rol_id
FROM gen_usuarios 
WHERE id = 1;

-- 4. Si no existe usuario con ID 1, crear uno de prueba
INSERT INTO gen_usuarios (
    id, 
    username, 
    email, 
    primer_nombre, 
    primer_apellido, 
    activo, 
    rol_id,
    created_at,
    updated_at
) VALUES (
    1, 
    'admin_test', 
    'admin@test.com', 
    'Administrador', 
    'Prueba', 
    true, 
    1,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- 5. Verificar si existe una solicitud con ID 1 en hum_solicitudes
SELECT COUNT(*) as total_solicitudes FROM hum_solicitudes WHERE id = 1;

-- 6. Si no existe solicitud con ID 1, crear una de prueba
INSERT INTO hum_solicitudes (
    id, 
    estado, 
    created_at, 
    updated_at
) VALUES (
    1, 
    'PENDIENTE', 
    NOW(), 
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- 7. Verificar que la tabla de logs existe
SELECT COUNT(*) as total_logs FROM hum_solicitudes_logs;

-- 8. Mostrar la estructura final de gen_usuarios
SELECT 
    id, 
    username, 
    email, 
    primer_nombre, 
    primer_apellido, 
    activo, 
    rol_id
FROM gen_usuarios 
ORDER BY id 
LIMIT 5;

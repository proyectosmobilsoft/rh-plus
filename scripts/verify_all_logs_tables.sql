-- Script para verificar todas las tablas de logs del sistema
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar tabla de logs de solicitudes
SELECT 
    'hum_solicitudes_logs' as tabla,
    COUNT(*) as total_logs,
    MAX(fecha_accion) as ultimo_log
FROM hum_solicitudes_logs;

-- 2. Verificar tabla de logs de usuarios
SELECT 
    'gen_usuarios_logs' as tabla,
    COUNT(*) as total_logs,
    MAX(fecha_accion) as ultimo_log
FROM gen_usuarios_logs;

-- 3. Verificar tabla de logs de empresas
SELECT 
    'gen_empresas_logs' as tabla,
    COUNT(*) as total_logs,
    MAX(fecha_accion) as ultimo_log
FROM gen_empresas_logs;

-- 4. Verificar estructura de todas las tablas de logs
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('hum_solicitudes_logs', 'gen_usuarios_logs', 'gen_empresas_logs')
ORDER BY table_name, ordinal_position;

-- 5. Verificar índices de todas las tablas de logs
SELECT 
    t.table_name,
    i.indexname,
    i.indexdef
FROM pg_indexes i
JOIN information_schema.tables t ON i.tablename = t.table_name
WHERE t.table_name IN ('hum_solicitudes_logs', 'gen_usuarios_logs', 'gen_empresas_logs')
ORDER BY t.table_name, i.indexname;

-- 6. Mostrar algunos logs de ejemplo de cada tabla
-- Logs de solicitudes (últimos 5)
SELECT 
    'Solicitudes' as tipo,
    id,
    solicitud_id,
    usuario_id,
    accion,
    estado_anterior,
    estado_nuevo,
    observacion,
    fecha_accion
FROM hum_solicitudes_logs 
ORDER BY fecha_accion DESC 
LIMIT 5;

-- Logs de usuarios (últimos 5)
SELECT 
    'Usuarios' as tipo,
    id,
    usuario_id,
    accion,
    detalles,
    fecha_accion
FROM gen_usuarios_logs 
ORDER BY fecha_accion DESC 
LIMIT 5;

-- Logs de empresas (últimos 5)
SELECT 
    'Empresas' as tipo,
    id,
    empresa_id,
    usuario_id,
    accion,
    detalles,
    fecha_accion
FROM gen_empresas_logs 
ORDER BY fecha_accion DESC 
LIMIT 5;

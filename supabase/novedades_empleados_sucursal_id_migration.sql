-- ============================================================
-- MIGRACIÓN: Cambio sucursal → sucursal_id en novedades_empleados
-- Fecha: 2026-05-13
-- Descripción: Reemplaza el campo de texto libre sucursal por
--              una FK hacia gen_sucursales
-- ============================================================

-- 1. Agregar columna sucursal_id
ALTER TABLE novedades_empleados
  ADD COLUMN IF NOT EXISTS sucursal_id INTEGER REFERENCES gen_sucursales(id);

-- 2. Migrar datos existentes haciendo match por nombre
UPDATE novedades_empleados ne
SET sucursal_id = gs.id
FROM gen_sucursales gs
WHERE gs.nombre = ne.sucursal
  AND ne.sucursal IS NOT NULL
  AND ne.sucursal_id IS NULL;

-- 3. Eliminar columna antigua
ALTER TABLE novedades_empleados DROP COLUMN IF EXISTS sucursal;

-- 4. Índice para FK
CREATE INDEX IF NOT EXISTS idx_novedades_empleados_sucursal ON novedades_empleados(sucursal_id);

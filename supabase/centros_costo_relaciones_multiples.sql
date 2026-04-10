-- ============================================================
-- MIGRACION: Relaciones multiples para centros de costo
-- Fecha: 2026-04-10
-- ============================================================

CREATE TABLE IF NOT EXISTS centros_costo_sucursales (
  id BIGSERIAL PRIMARY KEY,
  centro_costo_id INTEGER NOT NULL REFERENCES centros_costo(id) ON DELETE CASCADE,
  sucursal_id INTEGER NOT NULL REFERENCES gen_sucursales(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (centro_costo_id, sucursal_id)
);

CREATE TABLE IF NOT EXISTS centros_costo_areas_negocios (
  id BIGSERIAL PRIMARY KEY,
  centro_costo_id INTEGER NOT NULL REFERENCES centros_costo(id) ON DELETE CASCADE,
  area_negocio_id INTEGER NOT NULL REFERENCES gen_areas_negocios(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (centro_costo_id, area_negocio_id)
);

CREATE TABLE IF NOT EXISTS centros_costo_proyectos (
  id BIGSERIAL PRIMARY KEY,
  centro_costo_id INTEGER NOT NULL REFERENCES centros_costo(id) ON DELETE CASCADE,
  proyecto_id INTEGER NOT NULL REFERENCES proyectos(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (centro_costo_id, proyecto_id)
);

CREATE INDEX IF NOT EXISTS idx_cc_sucursales_cc ON centros_costo_sucursales(centro_costo_id);
CREATE INDEX IF NOT EXISTS idx_cc_areas_cc ON centros_costo_areas_negocios(centro_costo_id);
CREATE INDEX IF NOT EXISTS idx_cc_proyectos_cc ON centros_costo_proyectos(centro_costo_id);

-- Backfill desde esquema antiguo (1 a 1) para no perder datos previos
INSERT INTO centros_costo_sucursales (centro_costo_id, sucursal_id)
SELECT id, sucursal_id
FROM centros_costo
WHERE sucursal_id IS NOT NULL
ON CONFLICT (centro_costo_id, sucursal_id) DO NOTHING;

INSERT INTO centros_costo_proyectos (centro_costo_id, proyecto_id)
SELECT id, proyecto_id
FROM centros_costo
WHERE proyecto_id IS NOT NULL
ON CONFLICT (centro_costo_id, proyecto_id) DO NOTHING;

INSERT INTO centros_costo_areas_negocios (centro_costo_id, area_negocio_id)
SELECT cc.id, an.id
FROM centros_costo cc
JOIN gen_areas_negocios an ON LOWER(TRIM(an.nombre)) = LOWER(TRIM(cc.area_negocio))
WHERE cc.area_negocio IS NOT NULL AND TRIM(cc.area_negocio) <> ''
ON CONFLICT (centro_costo_id, area_negocio_id) DO NOTHING;

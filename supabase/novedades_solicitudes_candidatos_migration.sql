-- ============================================================
-- MIGRACIÓN: Candidatos por Solicitud de Novedades (Selección)
-- Fecha: 2026-05-25
-- Descripción: Crea tabla para almacenar candidatos asociados
-- a una solicitud de novedad en el módulo de selección
-- ============================================================

CREATE TABLE IF NOT EXISTS novedades_solicitudes_candidatos (
  id SERIAL PRIMARY KEY,
  solicitud_id INTEGER NOT NULL REFERENCES novedades_solicitudes(id) ON DELETE CASCADE,
  identificacion VARCHAR(50) NOT NULL,
  nombre_completo VARCHAR(255) NOT NULL,
  celular VARCHAR(50),
  correo VARCHAR(255),
  estado VARCHAR(50) DEFAULT 'activo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_novedades_solicitudes_candidatos_solicitud
  ON novedades_solicitudes_candidatos(solicitud_id);

CREATE OR REPLACE FUNCTION update_novedades_solicitudes_candidatos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_novedades_solicitudes_candidatos_updated_at
  BEFORE UPDATE ON novedades_solicitudes_candidatos
  FOR EACH ROW EXECUTE FUNCTION update_novedades_solicitudes_candidatos_updated_at();

-- Permisos PostgREST / Supabase (evita error 42501)
GRANT SELECT, INSERT, UPDATE, DELETE ON novedades_solicitudes_candidatos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON novedades_solicitudes_candidatos TO anon;
GRANT USAGE, SELECT ON SEQUENCE novedades_solicitudes_candidatos_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE novedades_solicitudes_candidatos_id_seq TO anon;

ALTER TABLE novedades_solicitudes_candidatos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "novedades_solicitudes_candidatos_select_authenticated" ON novedades_solicitudes_candidatos;
DROP POLICY IF EXISTS "novedades_solicitudes_candidatos_insert_authenticated" ON novedades_solicitudes_candidatos;
DROP POLICY IF EXISTS "novedades_solicitudes_candidatos_update_authenticated" ON novedades_solicitudes_candidatos;
DROP POLICY IF EXISTS "novedades_solicitudes_candidatos_delete_authenticated" ON novedades_solicitudes_candidatos;
DROP POLICY IF EXISTS "novedades_solicitudes_candidatos_select_anon" ON novedades_solicitudes_candidatos;

CREATE POLICY "novedades_solicitudes_candidatos_select_authenticated"
  ON novedades_solicitudes_candidatos FOR SELECT TO authenticated USING (true);

CREATE POLICY "novedades_solicitudes_candidatos_insert_authenticated"
  ON novedades_solicitudes_candidatos FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "novedades_solicitudes_candidatos_update_authenticated"
  ON novedades_solicitudes_candidatos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "novedades_solicitudes_candidatos_delete_authenticated"
  ON novedades_solicitudes_candidatos FOR DELETE TO authenticated USING (true);

CREATE POLICY "novedades_solicitudes_candidatos_select_anon"
  ON novedades_solicitudes_candidatos FOR SELECT TO anon USING (true);

CREATE POLICY "novedades_solicitudes_candidatos_insert_anon"
  ON novedades_solicitudes_candidatos FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "novedades_solicitudes_candidatos_update_anon"
  ON novedades_solicitudes_candidatos FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "novedades_solicitudes_candidatos_delete_anon"
  ON novedades_solicitudes_candidatos FOR DELETE TO anon USING (true);

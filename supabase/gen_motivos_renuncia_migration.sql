-- ============================================================
-- MIGRACIÓN: Maestro de Motivos de Renuncia
-- Descripción: Catálogo dinámico para el campo motivo_renuncia
-- ============================================================

CREATE TABLE IF NOT EXISTS gen_motivos_renuncia (
  id          SERIAL PRIMARY KEY,
  codigo      VARCHAR(50)  NOT NULL UNIQUE,
  nombre      VARCHAR(255) NOT NULL,
  descripcion TEXT,
  activo      BOOLEAN      NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gen_motivos_renuncia_activo ON gen_motivos_renuncia(activo);

INSERT INTO gen_motivos_renuncia (codigo, nombre, activo) VALUES
  ('VOLUNTARIA',         'Renuncia voluntaria',           true),
  ('MEJOR_OFERTA',       'Mejor oferta laboral',          true),
  ('MOTIVOS_PERSONALES', 'Motivos personales',            true),
  ('SALUD',              'Razones de salud',              true),
  ('ESTUDIOS',           'Continuación de estudios',      true),
  ('REUBICACION',        'Reubicación geográfica',        true),
  ('CLIMA_LABORAL',      'Clima laboral',                 true),
  ('TERMINO_CONTRATO',   'Término de contrato',           true)
ON CONFLICT (codigo) DO NOTHING;

-- ============================================================
-- Permisos PostgREST / Supabase (evita error 42501)
-- ============================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON gen_motivos_renuncia TO authenticated;
GRANT SELECT ON gen_motivos_renuncia TO anon;
GRANT USAGE, SELECT ON SEQUENCE gen_motivos_renuncia_id_seq TO authenticated;

ALTER TABLE gen_motivos_renuncia ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gen_motivos_renuncia_select_authenticated" ON gen_motivos_renuncia;
DROP POLICY IF EXISTS "gen_motivos_renuncia_insert_authenticated" ON gen_motivos_renuncia;
DROP POLICY IF EXISTS "gen_motivos_renuncia_update_authenticated" ON gen_motivos_renuncia;
DROP POLICY IF EXISTS "gen_motivos_renuncia_delete_authenticated" ON gen_motivos_renuncia;
DROP POLICY IF EXISTS "gen_motivos_renuncia_select_anon" ON gen_motivos_renuncia;

CREATE POLICY "gen_motivos_renuncia_select_authenticated"
  ON gen_motivos_renuncia FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "gen_motivos_renuncia_insert_authenticated"
  ON gen_motivos_renuncia FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "gen_motivos_renuncia_update_authenticated"
  ON gen_motivos_renuncia FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "gen_motivos_renuncia_delete_authenticated"
  ON gen_motivos_renuncia FOR DELETE
  TO authenticated
  USING (true);

-- Lectura para el select en novedades (rol anon con JWT de sesión)
CREATE POLICY "gen_motivos_renuncia_select_anon"
  ON gen_motivos_renuncia FOR SELECT
  TO anon
  USING (true);

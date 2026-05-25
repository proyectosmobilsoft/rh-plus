-- Ejecutar en Supabase SQL Editor si ya creaste la tabla y ves:
-- permission denied for table gen_motivos_renuncia (42501)

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
  ON gen_motivos_renuncia FOR SELECT TO authenticated USING (true);

CREATE POLICY "gen_motivos_renuncia_insert_authenticated"
  ON gen_motivos_renuncia FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "gen_motivos_renuncia_update_authenticated"
  ON gen_motivos_renuncia FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "gen_motivos_renuncia_delete_authenticated"
  ON gen_motivos_renuncia FOR DELETE TO authenticated USING (true);

CREATE POLICY "gen_motivos_renuncia_select_anon"
  ON gen_motivos_renuncia FOR SELECT TO anon USING (true);

-- Permisos PostgREST / Supabase para novedades_solicitudes_candidatos (error 42501)

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

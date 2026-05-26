-- Alinear permisos con novedades_solicitudes (la app usa rol anon con apikey)

GRANT INSERT, UPDATE, DELETE ON novedades_solicitudes_candidatos TO anon;
GRANT USAGE, SELECT ON SEQUENCE novedades_solicitudes_candidatos_id_seq TO anon;

DROP POLICY IF EXISTS "novedades_solicitudes_candidatos_insert_anon" ON novedades_solicitudes_candidatos;
DROP POLICY IF EXISTS "novedades_solicitudes_candidatos_update_anon" ON novedades_solicitudes_candidatos;
DROP POLICY IF EXISTS "novedades_solicitudes_candidatos_delete_anon" ON novedades_solicitudes_candidatos;

CREATE POLICY "novedades_solicitudes_candidatos_insert_anon"
  ON novedades_solicitudes_candidatos FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "novedades_solicitudes_candidatos_update_anon"
  ON novedades_solicitudes_candidatos FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "novedades_solicitudes_candidatos_delete_anon"
  ON novedades_solicitudes_candidatos FOR DELETE TO anon USING (true);

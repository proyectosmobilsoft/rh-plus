-- Agregar columna ciudad a la tabla educacion_candidato
ALTER TABLE educacion_candidato 
ADD COLUMN ciudad VARCHAR(100);

-- Agregar comentario a la columna
COMMENT ON COLUMN educacion_candidato.ciudad IS 'Ciudad donde se realizó la educación';

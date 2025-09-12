-- Agregar columna nivel_educativo a la tabla educacion_candidato
ALTER TABLE educacion_candidato
ADD COLUMN nivel_educativo VARCHAR(50);

COMMENT ON COLUMN educacion_candidato.nivel_educativo IS 'Nivel educativo del programa o título obtenido';

-- Agregar columna motivo_retiro a la tabla experiencia_laboral
ALTER TABLE experiencia_laboral 
ADD COLUMN motivo_retiro VARCHAR(255);

-- Agregar comentario a la columna
COMMENT ON COLUMN experiencia_laboral.motivo_retiro IS 'Motivo por el cual el candidato dejó el trabajo';

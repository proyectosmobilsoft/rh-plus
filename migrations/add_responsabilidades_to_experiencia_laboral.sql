-- Agregar columna responsabilidades a la tabla experiencia_laboral
ALTER TABLE experiencia_laboral
ADD COLUMN responsabilidades TEXT;

COMMENT ON COLUMN experiencia_laboral.responsabilidades IS 'Descripción de las responsabilidades del puesto de trabajo';

-- Agregar columna tipo_candidato_id a la tabla hum_solicitudes
ALTER TABLE hum_solicitudes 
ADD COLUMN tipo_candidato_id INTEGER;

-- Crear la relación con la tabla tipos_candidatos
ALTER TABLE hum_solicitudes 
ADD CONSTRAINT fk_hum_solicitudes_tipo_candidato 
FOREIGN KEY (tipo_candidato_id) 
REFERENCES tipos_candidatos(id) 
ON DELETE SET NULL 
ON UPDATE CASCADE;

-- Crear índice para mejorar el rendimiento de las consultas
CREATE INDEX idx_hum_solicitudes_tipo_candidato_id 
ON hum_solicitudes(tipo_candidato_id);

-- Comentario para documentar la relación
COMMENT ON COLUMN hum_solicitudes.tipo_candidato_id IS 'Relación con la tabla tipos_candidatos para identificar el tipo de candidato de la solicitud';

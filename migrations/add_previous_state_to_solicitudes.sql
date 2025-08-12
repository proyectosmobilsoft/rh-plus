-- Agregar columna previous_state a hum_solicitudes
-- Esta columna almacenará el estado anterior cuando se ponga una solicitud en Stand By

ALTER TABLE hum_solicitudes 
ADD COLUMN previous_state VARCHAR(50);

-- Agregar comentario a la columna
COMMENT ON COLUMN hum_solicitudes.previous_state IS 'Estado anterior de la solicitud antes de ponerla en Stand By';

-- Crear índice para mejorar el rendimiento de consultas
CREATE INDEX idx_hum_solicitudes_previous_state ON hum_solicitudes(previous_state);

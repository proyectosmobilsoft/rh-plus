-- Agregar campo id_empresa a la tabla plantillas_solicitudes
ALTER TABLE plantillas_solicitudes 
ADD COLUMN id_empresa INTEGER;

-- Agregar comentario al campo
COMMENT ON COLUMN plantillas_solicitudes.id_empresa IS 'ID de la empresa propietaria de la plantilla';

-- Crear índice para mejorar el rendimiento de las consultas por empresa
CREATE INDEX idx_plantillas_solicitudes_id_empresa ON plantillas_solicitudes(id_empresa);

-- Agregar foreign key constraint si existe la tabla empresas
-- (Comentado por si no existe la tabla empresas)
-- ALTER TABLE plantillas_solicitudes 
-- ADD CONSTRAINT fk_plantillas_solicitudes_empresa 
-- FOREIGN KEY (id_empresa) REFERENCES empresas(id);

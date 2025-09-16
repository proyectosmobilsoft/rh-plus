-- Eliminar campos de información del candidato de la tabla certificados_medicos
-- y mantener solo candidato_id para referenciar la información

-- Eliminar las columnas que ahora se obtendrán de la relación con candidatos
ALTER TABLE certificados_medicos 
DROP COLUMN IF EXISTS nombres_apellidos,
DROP COLUMN IF EXISTS identificacion,
DROP COLUMN IF EXISTS cargo,
DROP COLUMN IF EXISTS area,
DROP COLUMN IF EXISTS eps,
DROP COLUMN IF EXISTS arl;

-- Agregar la columna candidato_id si no existe
ALTER TABLE certificados_medicos 
ADD COLUMN IF NOT EXISTS candidato_id INTEGER REFERENCES candidatos(id);

-- Crear índice para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_certificados_medicos_candidato_id ON certificados_medicos(candidato_id);

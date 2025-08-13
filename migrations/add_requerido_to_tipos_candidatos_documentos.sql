-- Migración para agregar el campo 'requerido' a la tabla tipos_candidatos_documentos
-- Fecha: 2024-12-01

-- Agregar el campo 'requerido' a la tabla tipos_candidatos_documentos
ALTER TABLE tipos_candidatos_documentos 
ADD COLUMN IF NOT EXISTS requerido BOOLEAN DEFAULT FALSE;

-- Comentario: El campo 'requerido' indica si un documento es obligatorio para un tipo de cargo específico
-- El campo 'obligatorio' ahora solo indica si el documento está seleccionado para ese tipo de cargo
-- Esto permite tener documentos seleccionados pero no obligatorios

-- Actualizar registros existentes para mantener compatibilidad
-- Si obligatorio = true, entonces requerido = true también
UPDATE tipos_candidatos_documentos 
SET requerido = obligatorio 
WHERE requerido IS NULL;

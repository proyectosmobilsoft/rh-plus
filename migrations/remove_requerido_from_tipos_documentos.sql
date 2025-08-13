-- Migración para quitar el campo 'requerido' de la tabla tipos_documentos
-- Fecha: 2024-12-01

-- Eliminar el campo 'requerido' de la tabla tipos_documentos
ALTER TABLE tipos_documentos DROP COLUMN IF EXISTS requerido;

-- Comentario: El campo 'requerido' ahora se maneja a través de la tabla de relación
-- tipos_candidatos_documentos donde se puede especificar si un documento es
-- obligatorio para un tipo de candidato específico.

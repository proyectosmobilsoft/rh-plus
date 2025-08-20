-- Crear tabla gen_modulos si no existe
CREATE TABLE IF NOT EXISTS gen_modulos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL UNIQUE,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla gen_modulo_permisos si no existe
CREATE TABLE IF NOT EXISTS gen_modulo_permisos (
    id SERIAL PRIMARY KEY,
    modulo_id INTEGER NOT NULL REFERENCES gen_modulos(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    code VARCHAR(255) NOT NULL UNIQUE,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_gen_modulos_activo ON gen_modulos(activo);
CREATE INDEX IF NOT EXISTS idx_gen_modulo_permisos_modulo_id ON gen_modulo_permisos(modulo_id);
CREATE INDEX IF NOT EXISTS idx_gen_modulo_permisos_activo ON gen_modulo_permisos(activo);
CREATE INDEX IF NOT EXISTS idx_gen_modulo_permisos_code ON gen_modulo_permisos(code);

-- Habilitar RLS (Row Level Security)
ALTER TABLE gen_modulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE gen_modulo_permisos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para gen_modulos
CREATE POLICY IF NOT EXISTS "gen_modulos_select_policy" ON gen_modulos
    FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "gen_modulos_insert_policy" ON gen_modulos
    FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "gen_modulos_update_policy" ON gen_modulos
    FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "gen_modulos_delete_policy" ON gen_modulos
    FOR DELETE USING (activo = false);

-- Políticas RLS para gen_modulo_permisos
CREATE POLICY IF NOT EXISTS "gen_modulo_permisos_select_policy" ON gen_modulo_permisos
    FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "gen_modulo_permisos_insert_policy" ON gen_modulo_permisos
    FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "gen_modulo_permisos_update_policy" ON gen_modulo_permisos
    FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "gen_modulo_permisos_delete_policy" ON gen_modulo_permisos
    FOR DELETE USING (true);

-- Insertar algunos módulos de ejemplo si la tabla está vacía
INSERT INTO gen_modulos (nombre, descripcion, activo) VALUES
    ('Usuarios', 'Gestión de usuarios del sistema', true),
    ('Perfiles', 'Gestión de perfiles y roles', true),
    ('Candidatos', 'Gestión de candidatos y aspirantes', true),
    ('Empresas', 'Gestión de empresas afiliadas', true),
    ('Prestadores', 'Gestión de prestadores de servicios', true),
    ('Solicitudes', 'Gestión de solicitudes de empleo', true),
    ('Órdenes', 'Gestión de órdenes de servicio', true),
    ('Certificados', 'Gestión de certificados laborales', true),
    ('Reportes', 'Generación y visualización de reportes', true),
    ('Maestro', 'Datos maestros del sistema', true)
ON CONFLICT (nombre) DO NOTHING;

-- Insertar algunos permisos de ejemplo para el módulo Usuarios
INSERT INTO gen_modulo_permisos (modulo_id, nombre, descripcion, code, activo) VALUES
    ((SELECT id FROM gen_modulos WHERE nombre = 'Usuarios'), 'Ver Usuarios', 'Permite visualizar la lista de usuarios', 'usuarios_view', true),
    ((SELECT id FROM gen_modulos WHERE nombre = 'Usuarios'), 'Crear Usuarios', 'Permite crear nuevos usuarios', 'usuarios_create', true),
    ((SELECT id FROM gen_modulos WHERE nombre = 'Usuarios'), 'Editar Usuarios', 'Permite modificar usuarios existentes', 'usuarios_edit', true),
    ((SELECT id FROM gen_modulos WHERE nombre = 'Usuarios'), 'Eliminar Usuarios', 'Permite eliminar usuarios', 'usuarios_delete', true),
    ((SELECT id FROM gen_modulos WHERE nombre = 'Usuarios'), 'Activar/Desactivar Usuarios', 'Permite cambiar el estado de usuarios', 'usuarios_activate', true)
ON CONFLICT (code) DO NOTHING;

-- Insertar algunos permisos de ejemplo para el módulo Perfiles
INSERT INTO gen_modulo_permisos (modulo_id, nombre, descripcion, code, activo) VALUES
    ((SELECT id FROM gen_modulos WHERE nombre = 'Perfiles'), 'Ver Perfiles', 'Permite visualizar la lista de perfiles', 'perfiles_view', true),
    ((SELECT id FROM gen_modulos WHERE nombre = 'Perfiles'), 'Crear Perfiles', 'Permite crear nuevos perfiles', 'perfiles_create', true),
    ((SELECT id FROM gen_modulos WHERE nombre = 'Perfiles'), 'Editar Perfiles', 'Permite modificar perfiles existentes', 'perfiles_edit', true),
    ((SELECT id FROM gen_modulos WHERE nombre = 'Perfiles'), 'Eliminar Perfiles', 'Permite eliminar perfiles', 'perfiles_delete', true)
ON CONFLICT (code) DO NOTHING;

-- Insertar algunos permisos de ejemplo para el módulo Candidatos
INSERT INTO gen_modulo_permisos (modulo_id, nombre, descripcion, code, activo) VALUES
    ((SELECT id FROM gen_modulos WHERE nombre = 'Candidatos'), 'Ver Candidatos', 'Permite visualizar la lista de candidatos', 'candidatos_view', true),
    ((SELECT id FROM gen_modulos WHERE nombre = 'Candidatos'), 'Crear Candidatos', 'Permite crear nuevos candidatos', 'candidatos_create', true),
    ((SELECT id FROM gen_modulos WHERE nombre = 'Candidatos'), 'Editar Candidatos', 'Permite modificar candidatos existentes', 'candidatos_edit', true),
    ((SELECT id FROM gen_modulos WHERE nombre = 'Candidatos'), 'Eliminar Candidatos', 'Permite eliminar candidatos', 'candidatos_delete', true),
    ((SELECT id FROM gen_modulos WHERE nombre = 'Candidatos'), 'Aprobar Candidatos', 'Permite aprobar candidatos', 'candidatos_approve', true)
ON CONFLICT (code) DO NOTHING;

-- Insertar algunos permisos de ejemplo para el módulo Empresas
INSERT INTO gen_modulo_permisos (modulo_id, nombre, descripcion, code, activo) VALUES
    ((SELECT id FROM gen_modulos WHERE nombre = 'Empresas'), 'Ver Empresas', 'Permite visualizar la lista de empresas', 'empresas_view', true),
    ((SELECT id FROM gen_modulos WHERE nombre = 'Empresas'), 'Crear Empresas', 'Permite crear nuevas empresas', 'empresas_create', true),
    ((SELECT id FROM gen_modulos WHERE nombre = 'Empresas'), 'Editar Empresas', 'Permite modificar empresas existentes', 'empresas_edit', true),
    ((SELECT id FROM gen_modulos WHERE nombre = 'Empresas'), 'Eliminar Empresas', 'Permite eliminar empresas', 'empresas_delete', true)
ON CONFLICT (code) DO NOTHING;

-- Insertar algunos permisos de ejemplo para el módulo Maestro
INSERT INTO gen_modulo_permisos (modulo_id, nombre, descripcion, code, activo) VALUES
    ((SELECT id FROM gen_modulos WHERE nombre = 'Maestro'), 'Ver Maestros', 'Permite visualizar datos maestros', 'maestro_view', true),
    ((SELECT id FROM gen_modulos WHERE nombre = 'Maestro'), 'Gestionar Maestros', 'Permite gestionar datos maestros', 'maestro_manage', true)
ON CONFLICT (code) DO NOTHING;

-- Insertar algunos permisos de ejemplo para el módulo Reportes
INSERT INTO gen_modulo_permisos (modulo_id, nombre, descripcion, code, activo) VALUES
    ((SELECT id FROM gen_modulos WHERE nombre = 'Reportes'), 'Ver Reportes', 'Permite visualizar reportes', 'reportes_view', true),
    ((SELECT id FROM gen_modulos WHERE nombre = 'Reportes'), 'Generar Reportes', 'Permite generar nuevos reportes', 'reportes_generate', true),
    ((SELECT id FROM gen_modulos WHERE nombre = 'Reportes'), 'Exportar Reportes', 'Permite exportar reportes', 'reportes_export', true)
ON CONFLICT (code) DO NOTHING;

-- Comentarios para documentar las tablas
COMMENT ON TABLE gen_modulos IS 'Tabla para almacenar los módulos del sistema';
COMMENT ON TABLE gen_modulo_permisos IS 'Tabla para almacenar los permisos de cada módulo';

COMMENT ON COLUMN gen_modulos.id IS 'Identificador único del módulo';
COMMENT ON COLUMN gen_modulos.nombre IS 'Nombre del módulo';
COMMENT ON COLUMN gen_modulos.descripcion IS 'Descripción del módulo';
COMMENT ON COLUMN gen_modulos.activo IS 'Indica si el módulo está activo';

COMMENT ON COLUMN gen_modulo_permisos.id IS 'Identificador único del permiso';
COMMENT ON COLUMN gen_modulo_permisos.modulo_id IS 'Referencia al módulo al que pertenece el permiso';
COMMENT ON COLUMN gen_modulo_permisos.nombre IS 'Nombre del permiso';
COMMENT ON COLUMN gen_modulo_permisos.descripcion IS 'Descripción del permiso';
COMMENT ON COLUMN gen_modulo_permisos.code IS 'Código único del permiso para uso programático';
COMMENT ON COLUMN gen_modulo_permisos.activo IS 'Indica si el permiso está activo';

-- Migración para corregir las tablas de módulos y permisos
-- Asegurar que todas las columnas necesarias estén presentes

-- Verificar y agregar columna activo a gen_modulos si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'gen_modulos' 
        AND column_name = 'activo'
    ) THEN
        ALTER TABLE gen_modulos ADD COLUMN activo BOOLEAN DEFAULT TRUE;
        UPDATE gen_modulos SET activo = TRUE WHERE activo IS NULL;
    END IF;
END $$;

-- Verificar y agregar columna activo a gen_modulo_permisos si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'gen_modulo_permisos' 
        AND column_name = 'activo'
    ) THEN
        ALTER TABLE gen_modulo_permisos ADD COLUMN activo BOOLEAN DEFAULT TRUE;
        UPDATE gen_modulo_permisos SET activo = TRUE WHERE activo IS NULL;
    END IF;
END $$;

-- Verificar y agregar columna created_at a gen_modulos si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'gen_modulos' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE gen_modulos ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Verificar y agregar columna updated_at a gen_modulos si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'gen_modulos' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE gen_modulos ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Verificar y agregar columna created_at a gen_modulo_permisos si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'gen_modulo_permisos' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE gen_modulo_permisos ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Verificar y agregar columna updated_at a gen_modulo_permisos si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'gen_modulo_permisos' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE gen_modulo_permisos ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Crear índices si no existen
CREATE INDEX IF NOT EXISTS idx_gen_modulos_activo ON gen_modulos(activo);
CREATE INDEX IF NOT EXISTS idx_gen_modulo_permisos_modulo_id ON gen_modulo_permisos(modulo_id);
CREATE INDEX IF NOT EXISTS idx_gen_modulo_permisos_activo ON gen_modulo_permisos(activo);
CREATE INDEX IF NOT EXISTS idx_gen_modulo_permisos_code ON gen_modulo_permisos(code);

-- Habilitar RLS si no está habilitado
ALTER TABLE gen_modulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE gen_modulo_permisos ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS si no existen
DO $$ 
BEGIN
    -- Políticas para gen_modulos
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'gen_modulos' 
        AND policyname = 'gen_modulos_select_policy'
    ) THEN
        CREATE POLICY "gen_modulos_select_policy" ON gen_modulos
            FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'gen_modulos' 
        AND policyname = 'gen_modulos_insert_policy'
    ) THEN
        CREATE POLICY "gen_modulos_insert_policy" ON gen_modulos
            FOR INSERT WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'gen_modulos' 
        AND policyname = 'gen_modulos_update_policy'
    ) THEN
        CREATE POLICY "gen_modulos_update_policy" ON gen_modulos
            FOR UPDATE USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'gen_modulos' 
        AND policyname = 'gen_modulos_delete_policy'
    ) THEN
        CREATE POLICY "gen_modulos_delete_policy" ON gen_modulos
            FOR DELETE USING (activo = false);
    END IF;

    -- Políticas para gen_modulo_permisos
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'gen_modulo_permisos' 
        AND policyname = 'gen_modulo_permisos_select_policy'
    ) THEN
        CREATE POLICY "gen_modulo_permisos_select_policy" ON gen_modulo_permisos
            FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'gen_modulo_permisos' 
        AND policyname = 'gen_modulo_permisos_insert_policy'
    ) THEN
        CREATE POLICY "gen_modulo_permisos_insert_policy" ON gen_modulo_permisos
            FOR INSERT WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'gen_modulo_permisos' 
        AND policyname = 'gen_modulo_permisos_update_policy'
    ) THEN
        CREATE POLICY "gen_modulo_permisos_update_policy" ON gen_modulo_permisos
            FOR UPDATE USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'gen_modulo_permisos' 
        AND policyname = 'gen_modulo_permisos_delete_policy'
    ) THEN
        CREATE POLICY "gen_modulo_permisos_delete_policy" ON gen_modulo_permisos
            FOR DELETE USING (true);
    END IF;
END $$;

-- Insertar módulos de ejemplo si la tabla está vacía
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

-- Insertar permisos de ejemplo si no existen
DO $$
DECLARE
    usuarios_id INTEGER;
    perfiles_id INTEGER;
    candidatos_id INTEGER;
    empresas_id INTEGER;
    maestro_id INTEGER;
    reportes_id INTEGER;
BEGIN
    -- Obtener IDs de módulos
    SELECT id INTO usuarios_id FROM gen_modulos WHERE nombre = 'Usuarios';
    SELECT id INTO perfiles_id FROM gen_modulos WHERE nombre = 'Perfiles';
    SELECT id INTO candidatos_id FROM gen_modulos WHERE nombre = 'Candidatos';
    SELECT id INTO empresas_id FROM gen_modulos WHERE nombre = 'Empresas';
    SELECT id INTO maestro_id FROM gen_modulos WHERE nombre = 'Maestro';
    SELECT id INTO reportes_id FROM gen_modulos WHERE nombre = 'Reportes';

    -- Insertar permisos para Usuarios
    IF usuarios_id IS NOT NULL THEN
        INSERT INTO gen_modulo_permisos (modulo_id, nombre, descripcion, code, activo) VALUES
            (usuarios_id, 'Ver Usuarios', 'Permite visualizar la lista de usuarios', 'usuarios_view', true),
            (usuarios_id, 'Crear Usuarios', 'Permite crear nuevos usuarios', 'usuarios_create', true),
            (usuarios_id, 'Editar Usuarios', 'Permite modificar usuarios existentes', 'usuarios_edit', true),
            (usuarios_id, 'Eliminar Usuarios', 'Permite eliminar usuarios', 'usuarios_delete', true),
            (usuarios_id, 'Activar/Desactivar Usuarios', 'Permite cambiar el estado de usuarios', 'usuarios_activate', true)
        ON CONFLICT (code) DO NOTHING;
    END IF;

    -- Insertar permisos para Perfiles
    IF perfiles_id IS NOT NULL THEN
        INSERT INTO gen_modulo_permisos (modulo_id, nombre, descripcion, code, activo) VALUES
            (perfiles_id, 'Ver Perfiles', 'Permite visualizar la lista de perfiles', 'perfiles_view', true),
            (perfiles_id, 'Crear Perfiles', 'Permite crear nuevos perfiles', 'perfiles_create', true),
            (perfiles_id, 'Editar Perfiles', 'Permite modificar perfiles existentes', 'perfiles_edit', true),
            (perfiles_id, 'Eliminar Perfiles', 'Permite eliminar perfiles', 'perfiles_delete', true)
        ON CONFLICT (code) DO NOTHING;
    END IF;

    -- Insertar permisos para Candidatos
    IF candidatos_id IS NOT NULL THEN
        INSERT INTO gen_modulo_permisos (modulo_id, nombre, descripcion, code, activo) VALUES
            (candidatos_id, 'Ver Candidatos', 'Permite visualizar la lista de candidatos', 'candidatos_view', true),
            (candidatos_id, 'Crear Candidatos', 'Permite crear nuevos candidatos', 'candidatos_create', true),
            (candidatos_id, 'Editar Candidatos', 'Permite modificar candidatos existentes', 'candidatos_edit', true),
            (candidatos_id, 'Eliminar Candidatos', 'Permite eliminar candidatos', 'candidatos_delete', true),
            (candidatos_id, 'Aprobar Candidatos', 'Permite aprobar candidatos', 'candidatos_approve', true)
        ON CONFLICT (code) DO NOTHING;
    END IF;

    -- Insertar permisos para Empresas
    IF empresas_id IS NOT NULL THEN
        INSERT INTO gen_modulo_permisos (modulo_id, nombre, descripcion, code, activo) VALUES
            (empresas_id, 'Ver Empresas', 'Permite visualizar la lista de empresas', 'empresas_view', true),
            (empresas_id, 'Crear Empresas', 'Permite crear nuevas empresas', 'empresas_create', true),
            (empresas_id, 'Editar Empresas', 'Permite modificar empresas existentes', 'empresas_edit', true),
            (empresas_id, 'Eliminar Empresas', 'Permite eliminar empresas', 'empresas_delete', true)
        ON CONFLICT (code) DO NOTHING;
    END IF;

    -- Insertar permisos para Maestro
    IF maestro_id IS NOT NULL THEN
        INSERT INTO gen_modulo_permisos (modulo_id, nombre, descripcion, code, activo) VALUES
            (maestro_id, 'Ver Maestros', 'Permite visualizar datos maestros', 'maestro_view', true),
            (maestro_id, 'Gestionar Maestros', 'Permite gestionar datos maestros', 'maestro_manage', true)
        ON CONFLICT (code) DO NOTHING;
    END IF;

    -- Insertar permisos para Reportes
    IF reportes_id IS NOT NULL THEN
        INSERT INTO gen_modulo_permisos (modulo_id, nombre, descripcion, code, activo) VALUES
            (reportes_id, 'Ver Reportes', 'Permite visualizar reportes', 'reportes_view', true),
            (reportes_id, 'Generar Reportes', 'Permite generar nuevos reportes', 'reportes_generate', true),
            (reportes_id, 'Exportar Reportes', 'Permite exportar reportes', 'reportes_export', true)
        ON CONFLICT (code) DO NOTHING;
    END IF;
END $$;

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

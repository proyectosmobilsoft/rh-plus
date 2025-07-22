# Script de Base de Datos - Sistema de Gestión de Contratación

## Descripción
Este script crea todas las tablas necesarias para el sistema de gestión de contratación, incluyendo usuarios, empresas, candidatos, plantillas de formularios, y más.

## Tablas Base

```sql
-- Roles del sistema
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Permisos del sistema
CREATE TABLE permisos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    modulo VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Relación roles-permisos
CREATE TABLE roles_permisos (
    rol_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    permiso_id INTEGER REFERENCES permisos(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (rol_id, permiso_id)
);

-- Usuarios del sistema
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    primer_nombre VARCHAR(50),
    segundo_nombre VARCHAR(50),
    primer_apellido VARCHAR(50),
    segundo_apellido VARCHAR(50),
    rol_id INTEGER REFERENCES roles(id),
    activo BOOLEAN DEFAULT true,
    ultimo_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Empresas (tanto afiliadas como prestadoras)
CREATE TABLE empresas (
    id SERIAL PRIMARY KEY,
    razon_social VARCHAR(255) NOT NULL,
    nit VARCHAR(20) NOT NULL UNIQUE,
    tipo_documento VARCHAR(20) DEFAULT 'nit',
    regimen_tributario VARCHAR(50),
    direccion TEXT,
    ciudad VARCHAR(100),
    telefono VARCHAR(20),
    email VARCHAR(255),
    representante_legal VARCHAR(255),
    actividad_economica VARCHAR(100),
    numero_empleados INTEGER DEFAULT 1,
    tipo_empresa VARCHAR(20) NOT NULL CHECK (tipo_empresa IN ('afiliada', 'prestador')),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Configuración de campos visibles por empresa
CREATE TABLE empresas_campos_visibles (
    empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
    campo VARCHAR(50) NOT NULL,
    visible BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (empresa_id, campo)
);

-- Documentos de empresas
CREATE TABLE documentos_empresa (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    url_archivo TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Plantillas de formularios
CREATE TABLE plantillas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    created_by INTEGER REFERENCES usuarios(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Campos de las plantillas
CREATE TABLE campos_plantilla (
    id SERIAL PRIMARY KEY,
    plantilla_id INTEGER REFERENCES plantillas(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL,
    label VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    required BOOLEAN DEFAULT false,
    orden INTEGER NOT NULL,
    dimension INTEGER DEFAULT 12,
    opciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Relación empresas-plantillas
CREATE TABLE empresas_plantillas (
    empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
    plantilla_id INTEGER REFERENCES plantillas(id) ON DELETE CASCADE,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (empresa_id, plantilla_id)
);

-- Candidatos
CREATE TABLE candidatos (
    id SERIAL PRIMARY KEY,
    tipo_documento VARCHAR(20) NOT NULL,
    numero_documento VARCHAR(20) NOT NULL UNIQUE,
    primer_nombre VARCHAR(50) NOT NULL,
    segundo_nombre VARCHAR(50),
    primer_apellido VARCHAR(50) NOT NULL,
    segundo_apellido VARCHAR(50),
    email VARCHAR(255) NOT NULL UNIQUE,
    telefono VARCHAR(20),
    direccion TEXT,
    ciudad VARCHAR(100),
    fecha_nacimiento DATE,
    genero VARCHAR(20),
    estado_civil VARCHAR(20),
    empresa_id INTEGER REFERENCES empresas(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Educación de candidatos
CREATE TABLE educacion_candidato (
    id SERIAL PRIMARY KEY,
    candidato_id INTEGER REFERENCES candidatos(id) ON DELETE CASCADE,
    nivel VARCHAR(50) NOT NULL,
    institucion VARCHAR(255) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    estado VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Experiencia laboral de candidatos
CREATE TABLE experiencia_laboral (
    id SERIAL PRIMARY KEY,
    candidato_id INTEGER REFERENCES candidatos(id) ON DELETE CASCADE,
    empresa VARCHAR(255) NOT NULL,
    cargo VARCHAR(255) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    funciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Documentos de candidatos
CREATE TABLE documentos_candidato (
    id SERIAL PRIMARY KEY,
    candidato_id INTEGER REFERENCES candidatos(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    url_archivo TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Órdenes de servicio
CREATE TABLE ordenes_servicio (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER REFERENCES empresas(id),
    candidato_id INTEGER REFERENCES candidatos(id),
    plantilla_id INTEGER REFERENCES plantillas(id),
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    fecha_solicitud TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_programada DATE,
    created_by INTEGER REFERENCES usuarios(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Respuestas de formularios
CREATE TABLE respuestas_formulario (
    id SERIAL PRIMARY KEY,
    orden_id INTEGER REFERENCES ordenes_servicio(id) ON DELETE CASCADE,
    campo_id INTEGER REFERENCES campos_plantilla(id),
    valor TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Historial de cambios de estado de órdenes
CREATE TABLE historial_ordenes (
    id SERIAL PRIMARY KEY,
    orden_id INTEGER REFERENCES ordenes_servicio(id) ON DELETE CASCADE,
    estado_anterior VARCHAR(20) NOT NULL,
    estado_nuevo VARCHAR(20) NOT NULL,
    comentario TEXT,
    created_by INTEGER REFERENCES usuarios(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Certificados generados
CREATE TABLE certificados (
    id SERIAL PRIMARY KEY,
    orden_id INTEGER REFERENCES ordenes_servicio(id),
    tipo VARCHAR(50) NOT NULL,
    url_archivo TEXT NOT NULL,
    fecha_expedicion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_vencimiento DATE,
    created_by INTEGER REFERENCES usuarios(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Agenda médica
CREATE TABLE agenda_medica (
    id SERIAL PRIMARY KEY,
    orden_id INTEGER REFERENCES ordenes_servicio(id),
    especialidad VARCHAR(100) NOT NULL,
    medico_id INTEGER REFERENCES usuarios(id),
    consultorio VARCHAR(50),
    fecha_hora TIMESTAMP WITH TIME ZONE NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'programada',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Historia clínica
CREATE TABLE historia_clinica (
    id SERIAL PRIMARY KEY,
    candidato_id INTEGER REFERENCES candidatos(id),
    tipo_registro VARCHAR(50) NOT NULL,
    descripcion TEXT NOT NULL,
    medico_id INTEGER REFERENCES usuarios(id),
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Índices Recomendados

```sql
-- Índices para búsquedas frecuentes
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_username ON usuarios(username);
CREATE INDEX idx_empresas_nit ON empresas(nit);
CREATE INDEX idx_candidatos_documento ON candidatos(numero_documento);
CREATE INDEX idx_ordenes_empresa ON ordenes_servicio(empresa_id);
CREATE INDEX idx_ordenes_candidato ON ordenes_servicio(candidato_id);
CREATE INDEX idx_ordenes_estado ON ordenes_servicio(estado);
CREATE INDEX idx_agenda_fecha ON agenda_medica(fecha_hora);
CREATE INDEX idx_agenda_medico ON agenda_medica(medico_id);
CREATE INDEX idx_historia_candidato ON historia_clinica(candidato_id);
```

## Datos Iniciales

```sql
-- Insertar roles básicos
INSERT INTO roles (nombre, descripcion) VALUES
('admin', 'Administrador del sistema'),
('empresa', 'Usuario de empresa afiliada'),
('medico', 'Médico especialista'),
('analista', 'Analista de procesos'),
('coordinador', 'Coordinador de área');

-- Insertar permisos básicos
INSERT INTO permisos (nombre, descripcion, modulo) VALUES
('ver_dashboard', 'Ver dashboard principal', 'dashboard'),
('gestionar_usuarios', 'Gestionar usuarios del sistema', 'seguridad'),
('gestionar_empresas', 'Gestionar empresas afiliadas', 'empresas'),
('gestionar_candidatos', 'Gestionar candidatos', 'candidatos'),
('gestionar_ordenes', 'Gestionar órdenes de servicio', 'ordenes'),
('gestionar_agenda', 'Gestionar agenda médica', 'agenda'),
('ver_reportes', 'Ver reportes del sistema', 'reportes');

-- Asignar permisos al rol admin
INSERT INTO roles_permisos (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r, permisos p
WHERE r.nombre = 'admin';

-- Crear usuario admin por defecto
INSERT INTO usuarios (username, email, password_hash, primer_nombre, primer_apellido, rol_id) VALUES
('admin', 'admin@sistema.com', '$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'Admin', 'Sistema', 1);
```

## Notas de Implementación

1. Todos los timestamps se manejan con zona horaria
2. Se usa soft delete (campo activo) para registros importantes
3. Las contraseñas deben hashearse antes de almacenarse
4. Los campos de documentos almacenan URLs, los archivos físicos deben manejarse en almacenamiento externo
5. Las plantillas son flexibles y pueden tener múltiples campos
6. Se mantiene historial de cambios en órdenes de servicio
7. La agenda médica está integrada con las órdenes de servicio

## Mantenimiento

```sql
-- Crear función para actualizar timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger a todas las tablas con updated_at
CREATE TRIGGER update_empresas_updated_at
    BEFORE UPDATE ON empresas
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- (Repetir para cada tabla que tenga updated_at)
```

## Respaldo

```sql
-- Ejemplo de comando para backup
pg_dump -U usuario -d nombre_base > backup.sql

-- Ejemplo de comando para restaurar
psql -U usuario -d nombre_base < backup.sql
``` 
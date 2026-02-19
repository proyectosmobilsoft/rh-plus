-- ============================================================
-- MIGRACIÓN: Módulo de Solicitud de Novedades
-- Fecha: 2026-02-19
-- Descripción: Crea tablas para el módulo de novedades de RRHH
-- ============================================================

-- ============================================================
-- 1. TABLA: novedades_empleados
-- Empleados activos gestionados por líderes
-- ============================================================
CREATE TABLE IF NOT EXISTS novedades_empleados (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  apellido VARCHAR(200),
  numero_documento VARCHAR(50),
  tipo_documento VARCHAR(20),
  cargo VARCHAR(200),
  empresa_id INTEGER REFERENCES empresas(id),
  sucursal VARCHAR(200),
  centro_costo_id INTEGER,
  fecha_ingreso DATE,
  lider_id INTEGER REFERENCES gen_usuarios(id),
  estado VARCHAR(50) DEFAULT 'activo',
  horas_laborales NUMERIC,
  jornada VARCHAR(100),
  nivel_riesgo VARCHAR(50),
  salario NUMERIC(15,2),
  auxilio_no_prestacional NUMERIC(15,2),
  duracion_contrato VARCHAR(100),
  area VARCHAR(200),
  negocio VARCHAR(200),
  ciudad VARCHAR(200),
  proyecto VARCHAR(200),
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_novedades_empleados_lider ON novedades_empleados(lider_id);
CREATE INDEX IF NOT EXISTS idx_novedades_empleados_empresa ON novedades_empleados(empresa_id);
CREATE INDEX IF NOT EXISTS idx_novedades_empleados_estado ON novedades_empleados(estado);

-- ============================================================
-- 2. TABLA: novedades_motivos
-- Catálogo de tipos de novedades
-- ============================================================
CREATE TABLE IF NOT EXISTS novedades_motivos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  codigo VARCHAR(50) UNIQUE NOT NULL,
  descripcion TEXT,
  requiere_comite BOOLEAN DEFAULT FALSE,
  requiere_reemplazo_check BOOLEAN DEFAULT FALSE,
  permite_adjuntos BOOLEAN DEFAULT FALSE,
  permite_seleccion_multiple BOOLEAN DEFAULT FALSE,
  activo BOOLEAN DEFAULT TRUE,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar los 8 motivos de novedades
INSERT INTO novedades_motivos (nombre, codigo, descripcion, requiere_comite, requiere_reemplazo_check, permite_adjuntos, permite_seleccion_multiple, orden) VALUES
  ('Incapacidades', 'incapacidades', 'Gestión de incapacidades médicas', FALSE, FALSE, FALSE, FALSE, 1),
  ('Retiros', 'retiros', 'Gestión de retiros de personal', TRUE, TRUE, TRUE, FALSE, 2),
  ('Aumento de Plaza', 'aumento_plaza', 'Gestión de nuevas vacantes', FALSE, FALSE, FALSE, FALSE, 3),
  ('Cambio de Centro de Costo', 'cambio_centro_costo', 'Cambio de centro de costo de empleado', FALSE, FALSE, FALSE, FALSE, 4),
  ('Vacaciones', 'vacaciones', 'Gestión de vacaciones de empleados', FALSE, FALSE, FALSE, TRUE, 5),
  ('Licencias', 'licencias', 'Gestión de licencias de personal', FALSE, FALSE, FALSE, FALSE, 6),
  ('Renuncias', 'renuncias', 'Gestión de renuncias voluntarias', TRUE, TRUE, TRUE, FALSE, 7),
  ('Postulaciones Internas', 'postulaciones_internas', 'Postulaciones internas de colaboradores', FALSE, TRUE, TRUE, FALSE, 8)
ON CONFLICT (codigo) DO NOTHING;

-- ============================================================
-- 3. TABLA: novedades_solicitudes
-- Solicitudes de novedades creadas por líderes
-- ============================================================
CREATE TABLE IF NOT EXISTS novedades_solicitudes (
  id SERIAL PRIMARY KEY,
  -- Relaciones
  empleado_id INTEGER REFERENCES novedades_empleados(id),
  motivo_id INTEGER REFERENCES novedades_motivos(id) NOT NULL,
  empresa_id INTEGER REFERENCES empresas(id),
  -- Datos del formulario (almacenados como JSONB para flexibilidad)
  datos_formulario JSONB DEFAULT '{}',
  -- Estado de la solicitud
  estado VARCHAR(50) DEFAULT 'solicitada' CHECK (estado IN (
    'solicitada',
    'aprobado_comite',
    'en_proceso',
    'en_reclutamiento',
    'entrevista_cliente',
    'seleccionado',
    'rechazada',
    'congelada',
    'ejecutada',
    'cancelada'
  )),
  estado_anterior VARCHAR(50),
  -- Campos adicionales
  sucursal VARCHAR(200),
  requiere_reemplazo BOOLEAN DEFAULT FALSE,
  observaciones TEXT,
  -- Documentos adjuntos (URLs de Storage)
  documentos_soporte JSONB DEFAULT '[]',
  -- Datos de reemplazo (cuando aplica)
  datos_reemplazo JSONB,
  -- Control
  created_by INTEGER REFERENCES gen_usuarios(id),
  updated_by INTEGER REFERENCES gen_usuarios(id),
  aprobado_por INTEGER REFERENCES gen_usuarios(id),
  fecha_aprobacion TIMESTAMP WITH TIME ZONE,
  -- Selección múltiple de empleados (para vacaciones)
  empleados_ids JSONB DEFAULT '[]',
  -- Auditoría
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_novedades_solicitudes_estado ON novedades_solicitudes(estado);
CREATE INDEX IF NOT EXISTS idx_novedades_solicitudes_motivo ON novedades_solicitudes(motivo_id);
CREATE INDEX IF NOT EXISTS idx_novedades_solicitudes_empresa ON novedades_solicitudes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_novedades_solicitudes_empleado ON novedades_solicitudes(empleado_id);
CREATE INDEX IF NOT EXISTS idx_novedades_solicitudes_created_by ON novedades_solicitudes(created_by);
CREATE INDEX IF NOT EXISTS idx_novedades_solicitudes_created_at ON novedades_solicitudes(created_at DESC);

-- ============================================================
-- 4. TABLA: novedades_logs
-- Timeline / bitácora de cada solicitud
-- ============================================================
CREATE TABLE IF NOT EXISTS novedades_logs (
  id SERIAL PRIMARY KEY,
  solicitud_id INTEGER REFERENCES novedades_solicitudes(id) ON DELETE CASCADE NOT NULL,
  usuario_id INTEGER REFERENCES gen_usuarios(id),
  accion VARCHAR(100) NOT NULL,
  estado_anterior VARCHAR(50),
  estado_nuevo VARCHAR(50),
  observacion TEXT,
  metadata JSONB DEFAULT '{}',
  fecha_accion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_novedades_logs_solicitud ON novedades_logs(solicitud_id);
CREATE INDEX IF NOT EXISTS idx_novedades_logs_fecha ON novedades_logs(fecha_accion DESC);

-- ============================================================
-- 5. PERMISOS: Vista y acciones en acciones_sistema
-- ============================================================

-- Primero, obtener el próximo vista_id disponible
-- Basado en la captura, los vista_id existentes van del 2 al 11+
-- Usaremos vista_id = 13 para Novedades (ajustar si ya existe)

-- Crear la vista en vistas_sistema (requerido por FK)
INSERT INTO vistas_sistema (id, nombre, descripcion, activo)
VALUES (13, 'Novedades', 'Módulo de Solicitud de Novedades de Recurso Humano', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Insertar la acción principal de vista
INSERT INTO acciones_sistema (nombre, descripcion, codigo, vista_id, activo)
VALUES
  ('Ver Novedades', 'Permite acceder al tablero de novedades', 'vista-novedades', 13, TRUE);

-- Insertar acciones granulares del módulo de novedades
INSERT INTO acciones_sistema (nombre, descripcion, codigo, vista_id, activo)
VALUES
  ('Crear Novedad', 'Permite crear nuevas solicitudes de novedades', 'accion-crear-novedad', 13, TRUE),
  ('Editar Novedad', 'Permite editar solicitudes de novedades', 'accion-editar-novedad', 13, TRUE),
  ('Cancelar Novedad', 'Permite cancelar solicitudes de novedades', 'accion-cancelar-novedad', 13, TRUE),
  ('Aprobar Novedad', 'Permite aprobar solicitudes en comité', 'accion-aprobar-novedad', 13, TRUE),
  ('Rechazar Novedad', 'Permite rechazar solicitudes en comité', 'accion-rechazar-novedad', 13, TRUE),
  ('Exportar Novedades', 'Permite exportar datos de novedades a Excel', 'accion-exportar-novedades', 13, TRUE),
  ('Ver Timeline Novedad', 'Permite ver el timeline de gestión de una novedad', 'accion-ver-timeline-novedad', 13, TRUE),
  ('Gestionar Reemplazo', 'Permite gestionar el formulario de reemplazo', 'accion-gestionar-reemplazo', 13, TRUE),
  ('Congelar Novedad', 'Permite congelar/pausar solicitudes de novedades', 'accion-congelar-novedad', 13, TRUE);

-- ============================================================
-- 6. TRIGGER: Auto-actualizar updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_novedades_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_novedades_empleados_updated_at
  BEFORE UPDATE ON novedades_empleados
  FOR EACH ROW EXECUTE FUNCTION update_novedades_updated_at();

CREATE TRIGGER trigger_novedades_solicitudes_updated_at
  BEFORE UPDATE ON novedades_solicitudes
  FOR EACH ROW EXECUTE FUNCTION update_novedades_updated_at();

-- ============================================================
-- 7. RLS (Row Level Security) - Opcional
-- Descomentear si necesitas RLS en las tablas
-- ============================================================
-- ALTER TABLE novedades_empleados ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE novedades_solicitudes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE novedades_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE novedades_motivos ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 8. DATOS DE PRUEBA (OPCIONAL - Descomentear para testing)
-- ============================================================

-- Insertar empleados de ejemplo
-- INSERT INTO novedades_empleados (nombre, apellido, numero_documento, cargo, empresa_id, sucursal, fecha_ingreso, lider_id, estado) VALUES
--   ('Juan', 'Pérez García', '1234567890', 'Analista de Sistemas', 1, 'Bogotá', '2024-01-15', 1, 'activo'),
--   ('María', 'López Rodríguez', '0987654321', 'Diseñadora UX', 1, 'Medellín', '2023-06-01', 1, 'activo'),
--   ('Carlos', 'Martínez Gómez', '1122334455', 'Desarrollador Backend', 1, 'Bogotá', '2024-03-20', 1, 'activo');

-- ============================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================

-- Crear tabla hum_solicitudes
CREATE TABLE IF NOT EXISTS hum_solicitudes (
    id SERIAL PRIMARY KEY,

    -- Información del trabajador
    nombres VARCHAR(255) NOT NULL,
    apellidos VARCHAR(255) NOT NULL,
    tipo_documento VARCHAR(10) NOT NULL DEFAULT 'CC',
    numero_documento VARCHAR(20) NOT NULL,
    lugar_expedicion VARCHAR(100),
    celular VARCHAR(20),
    direccion TEXT,

    -- Información de la empresa usuaria
    empresa_usuaria VARCHAR(255),
    ciudad_prestacion_servicio VARCHAR(100),
    departamento_prestacion_servicio VARCHAR(100),

    -- Información del trabajo
    cargo VARCHAR(255) NOT NULL,
    salario VARCHAR(100),
    ciudad VARCHAR(100) NOT NULL,
    fecha_ingreso DATE,
    tipo_contrato VARCHAR(100),

    -- Especificaciones para el ingreso
    salario_basico VARCHAR(100),
    auxilio_transporte VARCHAR(100),
    viaje_rotativo BOOLEAN DEFAULT FALSE,

    -- Vehículo de transporte y alimentación
    vehiculo_transporte VARCHAR(100),
    vehiculo_alimentacion VARCHAR(100),

    -- Salario mensual
    salario_mensual VARCHAR(100),

    -- Jornada laboral
    jornada_laboral TEXT,

    -- Pagos adicionales
    pagos_auxilios VARCHAR(100),

    -- Especificaciones adicionales
    especificaciones_adicionales TEXT,

    -- Estado y seguimiento
    estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    prioridad VARCHAR(20) DEFAULT 'media',

    -- Fechas de seguimiento
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_asignacion TIMESTAMP WITH TIME ZONE,
    fecha_inicio_examenes TIMESTAMP WITH TIME ZONE,
    fecha_finalizacion TIMESTAMP WITH TIME ZONE,
    fecha_vencimiento TIMESTAMP WITH TIME ZONE,

    -- Metadatos
    observaciones TEXT,
    notas_internas TEXT,
    lead_time INTEGER,

    -- Campos adicionales para el examen médico
    centro_trabajo VARCHAR(255),
    area_funcional VARCHAR(255),
    tipo_examen VARCHAR(255),
    examen_medico_realizar TEXT,

    -- Información adicional de ubicación
    departamento VARCHAR(255),

    -- Campos de cumplimiento
    cumple_horario BOOLEAN DEFAULT FALSE,
    especifique TEXT,

    -- Campos de auditoría
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_hum_solicitudes_estado ON hum_solicitudes(estado);
CREATE INDEX IF NOT EXISTS idx_hum_solicitudes_prioridad ON hum_solicitudes(prioridad);
CREATE INDEX IF NOT EXISTS idx_hum_solicitudes_empresa_usuaria ON hum_solicitudes(empresa_usuaria);
CREATE INDEX IF NOT EXISTS idx_hum_solicitudes_fecha_creacion ON hum_solicitudes(fecha_creacion);
CREATE INDEX IF NOT EXISTS idx_hum_solicitudes_nombres_apellidos ON hum_solicitudes(nombres, apellidos);

-- Crear trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_hum_solicitudes_updated_at 
    BEFORE UPDATE ON hum_solicitudes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security (RLS)
ALTER TABLE hum_solicitudes ENABLE ROW LEVEL SECURITY;

-- Crear políticas de RLS para usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden ver todas las solicitudes" ON hum_solicitudes
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden insertar solicitudes" ON hum_solicitudes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden actualizar solicitudes" ON hum_solicitudes
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden eliminar solicitudes" ON hum_solicitudes
    FOR DELETE USING (auth.role() = 'authenticated');

-- Comentarios para documentar la tabla
COMMENT ON TABLE hum_solicitudes IS 'Tabla para almacenar las solicitudes de servicios médicos ocupacionales';
COMMENT ON COLUMN hum_solicitudes.nombres IS 'Nombres del trabajador';
COMMENT ON COLUMN hum_solicitudes.apellidos IS 'Apellidos del trabajador';
COMMENT ON COLUMN hum_solicitudes.tipo_documento IS 'Tipo de documento de identidad (CC, CE, TI, etc.)';
COMMENT ON COLUMN hum_solicitudes.numero_documento IS 'Número de documento de identidad';
COMMENT ON COLUMN hum_solicitudes.empresa_usuaria IS 'Empresa que solicita el servicio';
COMMENT ON COLUMN hum_solicitudes.cargo IS 'Cargo que desempeña el trabajador';
COMMENT ON COLUMN hum_solicitudes.estado IS 'Estado de la solicitud (PENDIENTE, APROBADA, RECHAZADA)';
COMMENT ON COLUMN hum_solicitudes.prioridad IS 'Prioridad de la solicitud (baja, media, alta)'; 
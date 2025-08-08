# Instrucciones para Implementar Asociación de Prioridad de Analistas

## 1. Crear la tabla en la base de datos

Ejecuta el siguiente script SQL en tu base de datos de Supabase:

```sql
-- Script para crear la tabla asociacion_prioridad
-- Este script debe ejecutarse en la base de datos de Supabase

-- Crear tabla asociacion_prioridad que relaciona usuarios (analistas) con empresas y sus niveles de prioridad
CREATE TABLE IF NOT EXISTS asociacion_prioridad (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES gen_usuarios(id) ON DELETE CASCADE,
    empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nivel_prioridad_1 BOOLEAN DEFAULT FALSE,
    nivel_prioridad_2 BOOLEAN DEFAULT FALSE,
    nivel_prioridad_3 BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(usuario_id, empresa_id)
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_asociacion_prioridad_usuario ON asociacion_prioridad(usuario_id);
CREATE INDEX IF NOT EXISTS idx_asociacion_prioridad_empresa ON asociacion_prioridad(empresa_id);
CREATE INDEX IF NOT EXISTS idx_asociacion_prioridad_niveles ON asociacion_prioridad(nivel_prioridad_1, nivel_prioridad_2, nivel_prioridad_3);

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para actualizar updated_at
DROP TRIGGER IF EXISTS update_asociacion_prioridad_updated_at ON asociacion_prioridad;
CREATE TRIGGER update_asociacion_prioridad_updated_at
    BEFORE UPDATE ON asociacion_prioridad
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comentarios para documentar la tabla
COMMENT ON TABLE asociacion_prioridad IS 'Tabla que relaciona analistas (gen_usuarios) con empresas y define sus niveles de prioridad';
COMMENT ON COLUMN asociacion_prioridad.usuario_id IS 'ID del analista (referencia a gen_usuarios con rol_id = 4)';
COMMENT ON COLUMN asociacion_prioridad.empresa_id IS 'ID de la empresa (referencia a empresas)';
COMMENT ON COLUMN asociacion_prioridad.nivel_prioridad_1 IS 'Indica si el analista tiene prioridad nivel 1 para esta empresa';
COMMENT ON COLUMN asociacion_prioridad.nivel_prioridad_2 IS 'Indica si el analista tiene prioridad nivel 2 para esta empresa';
COMMENT ON COLUMN asociacion_prioridad.nivel_prioridad_3 IS 'Indica si el analista tiene prioridad nivel 3 para esta empresa';
```

## 2. Pasos para ejecutar el script

### Opción 1: Desde el Dashboard de Supabase
1. Ve al Dashboard de Supabase (https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a la sección "SQL Editor" en el menú lateral
4. Crea una nueva query
5. Copia y pega el script SQL completo
6. Ejecuta el script

### Opción 2: Desde la línea de comandos (si tienes acceso directo a PostgreSQL)
```bash
# Conecta a tu base de datos PostgreSQL
psql -h tu-host -U tu-usuario -d tu-base-de-datos

# Ejecuta el archivo SQL
\i scripts/create_asociacion_prioridad.sql
```

## 3. Verificar la creación

Después de ejecutar el script, verifica que la tabla se creó correctamente:

```sql
-- Verificar que la tabla existe
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'asociacion_prioridad'
ORDER BY ordinal_position;

-- Verificar los índices
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'asociacion_prioridad';

-- Verificar las foreign keys
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='asociacion_prioridad';
```

## 4. Funcionalidades implementadas

### Listado de Analistas Mejorado
- **Niveles de Prioridad**: Ahora muestra 3 columnas para los niveles de prioridad (1, 2, 3) con badges de colores:
  - Nivel 1: Badge rojo (alta prioridad)
  - Nivel 2: Badge amarillo (prioridad media)  
  - Nivel 3: Badge verde (prioridad baja)

- **Información de Empresa**: 
  - Nombre de la empresa asignada
  - NIT de la empresa
  - Sucursal (dirección de la empresa)

- **Cantidad de Solicitudes**: 
  - Contador de solicitudes asociadas al analista por empresa
  - Badge azul con el número de solicitudes

### Filtros Actualizados
- **Por Empresa**: Filtrar analistas por empresa asignada
- **Por Nivel de Prioridad**: Filtrar por nivel 1, 2 o 3
- **Búsqueda mejorada**: Buscar por nombre del analista, email, nombre de empresa o NIT

### Exportación a Excel
- El archivo Excel ahora incluye todas las nuevas columnas
- Formato limpio y profesional
- Columnas: Analista, Email, Empresa, NIT, Sucursal, Nivel 1, Nivel 2, Nivel 3, Solicitudes

## 5. Servicios creados

### `asociacionPrioridadService.ts`
Nuevo servicio que maneja:
- Obtener analistas con sus prioridades y empresas asociadas
- Crear/actualizar asociaciones de prioridad
- Eliminar asociaciones
- Contar solicitudes por analista y empresa

## 6. Estructura de la tabla

```sql
asociacion_prioridad (
    id: SERIAL PRIMARY KEY,
    usuario_id: INTEGER -> gen_usuarios.id,
    empresa_id: INTEGER -> empresas.id,
    nivel_prioridad_1: BOOLEAN,
    nivel_prioridad_2: BOOLEAN,
    nivel_prioridad_3: BOOLEAN,
    created_at: TIMESTAMP,
    updated_at: TIMESTAMP
)
```

## 7. Datos de ejemplo (opcional)

Si deseas insertar algunos datos de prueba:

```sql
-- Insertar datos de ejemplo (ajusta los IDs según tu base de datos)
INSERT INTO asociacion_prioridad (usuario_id, empresa_id, nivel_prioridad_1, nivel_prioridad_2, nivel_prioridad_3) 
VALUES 
(1, 1, true, false, false),   -- Analista 1, Empresa 1, Nivel 1
(1, 2, false, true, false),   -- Analista 1, Empresa 2, Nivel 2  
(2, 1, false, false, true),   -- Analista 2, Empresa 1, Nivel 3
(2, 3, true, false, false);   -- Analista 2, Empresa 3, Nivel 1
```

## 8. Notas importantes

- La tabla usa una clave única compuesta (usuario_id, empresa_id) para evitar duplicados
- Los triggers actualizan automáticamente el campo `updated_at`
- Las foreign keys garantizan la integridad referencial
- Los índices mejoran el rendimiento de las consultas

¡La implementación está completa y lista para usar!

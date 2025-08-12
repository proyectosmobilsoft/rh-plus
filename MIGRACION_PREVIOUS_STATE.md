# Migración: Columna `previous_state` en `hum_solicitudes`

## 📋 **Descripción**

Se ha implementado una mejora en el sistema de gestión de solicitudes para hacer más robusto el proceso de reactivación de solicitudes que están en Stand By.

## 🔧 **Cambios Implementados**

### 1. **Nueva Columna en Base de Datos**
- **Tabla**: `hum_solicitudes`
- **Columna**: `previous_state` (VARCHAR(50))
- **Propósito**: Almacenar el estado anterior de una solicitud antes de ponerla en Stand By

### 2. **Funcionalidad Mejorada**
- **Antes**: El estado anterior se almacenaba en memoria (Map) del componente
- **Ahora**: El estado anterior se almacena en la base de datos
- **Ventaja**: Más robusto, persistente y no se pierde al recargar la página

## 🚀 **Cómo Aplicar la Migración**

### **Opción 1: Usando Supabase Dashboard**
1. Ir a Supabase Dashboard → SQL Editor
2. Ejecutar el script: `scripts/apply_previous_state_migration.sql`

### **Opción 2: Usando Supabase CLI**
```bash
# Desde la raíz del proyecto
supabase db push
```

### **Opción 3: Ejecutar Manualmente**
```sql
-- Agregar columna
ALTER TABLE hum_solicitudes 
ADD COLUMN IF NOT EXISTS previous_state VARCHAR(50);

-- Agregar comentario
COMMENT ON COLUMN hum_solicitudes.previous_state IS 'Estado anterior de la solicitud antes de ponerla en Stand By';

-- Crear índice
CREATE INDEX IF NOT EXISTS idx_hum_solicitudes_previous_state ON hum_solicitudes(previous_state);
```

## 📝 **Cambios en el Código**

### **Servicio de Solicitudes (`solicitudesService.ts`)**
- **Función `putStandBy`**: Ahora guarda el estado anterior en `previous_state`
- **Función `reactivate`**: Ahora lee el estado anterior desde `previous_state`

### **Componente SolicitudesList (`SolicitudesList.tsx`)**
- Simplificado para no depender del estado en memoria
- Usa la nueva lógica de la base de datos

### **Página ExpedicionOrden (`ExpedicionOrdenPage.tsx`)**
- Actualizada para usar la nueva función `reactivate` sin parámetros

## ✅ **Beneficios de la Nueva Implementación**

1. **Persistencia**: El estado anterior se mantiene aunque se recargue la página
2. **Robustez**: No depende del estado en memoria del componente
3. **Trazabilidad**: Se puede consultar el historial de estados desde la base de datos
4. **Escalabilidad**: Funciona correctamente en múltiples pestañas/ventanas
5. **Auditoría**: Mejor seguimiento de cambios de estado

## 🔍 **Verificación**

Después de aplicar la migración, verificar:

1. **Columna creada**:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'hum_solicitudes' 
AND column_name = 'previous_state';
```

2. **Índice creado**:
```sql
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename = 'hum_solicitudes' 
AND indexname LIKE '%previous_state%';
```

3. **Funcionalidad**:
   - Poner una solicitud en Stand By
   - Verificar que se guarde en `previous_state`
   - Reactivar la solicitud
   - Verificar que se restaure al estado anterior

## ⚠️ **Notas Importantes**

- La migración es **no destructiva** (no elimina datos existentes)
- Las solicitudes existentes en Stand By tendrán `previous_state = NULL`
- Se recomienda probar en un entorno de desarrollo antes de producción
- Hacer backup de la base de datos antes de aplicar cambios en producción

## 🐛 **Solución de Problemas**

### **Error: "column does not exist"**
- Verificar que la migración se ejecutó correctamente
- Revisar logs de Supabase

### **Error: "permission denied"**
- Verificar permisos del usuario de la base de datos
- Usar un usuario con permisos de DDL

### **Funcionalidad no funciona**
- Verificar que el código se haya desplegado correctamente
- Revisar logs del navegador para errores JavaScript
- Verificar que la columna `previous_state` existe y tiene datos

# Selección de Sucursales en Gestión de Analistas

## Descripción

Esta funcionalidad permite seleccionar sucursales de la tabla `gen_sucursales` al configurar las prioridades de los analistas en el sistema de gestión de recursos humanos.

## Características Implementadas

### 1. Servicio de Sucursales

Se creó un nuevo servicio (`sucursalesService.ts`) que proporciona:

- **Obtener sucursales activas**: `getAll()` - Solo sucursales con `activo = true`
- **Obtener todas las sucursales**: `getAllIncludingInactive()` - Incluyendo inactivas
- **Obtener sucursal por ID**: `getById(id)` - Sucursal específica
- **Crear sucursal**: `create(sucursal)` - Nueva sucursal
- **Actualizar sucursal**: `update(id, updates)` - Modificar existente
- **Eliminar sucursal**: `delete(id)` - Soft delete (activo = false)
- **Activar sucursal**: `activate(id)` - Reactivar sucursal
- **Obtener con información de ciudad**: `getWithCityInfo()` - Incluye datos de ciudad

### 2. Integración en Configuración de Prioridades

El componente `AnalistaForm` ahora:

- **Carga sucursales dinámicamente** desde la base de datos
- **Muestra indicadores de carga** mientras se cargan las sucursales
- **Maneja estados de error** cuando no hay sucursales disponibles
- **Valida selecciones** antes de guardar

### 3. Selectores de Sucursal

Se implementaron selectores mejorados para las tres prioridades:

#### Características de los Selectores
- **Carga asíncrona**: Se cargan desde la base de datos
- **Indicadores de estado**: Muestran "Cargando..." durante la carga
- **Manejo de errores**: Muestran mensaje cuando no hay sucursales
- **Deshabilitación**: Se deshabilitan durante la carga
- **Validación**: Requieren selección cuando se elige prioridad "sucursal"

#### Estados del Selector
1. **Cargando**: `disabled={true}`, placeholder="Cargando sucursales..."
2. **Sin datos**: Muestra "No hay sucursales disponibles"
3. **Con datos**: Lista todas las sucursales activas
4. **Error**: Maneja errores de carga gracefully

## Archivos Modificados

### 1. `client/src/services/sucursalesService.ts` (NUEVO)
Servicio completo para manejo de sucursales con todas las operaciones CRUD.

### 2. `client/src/components/analistas/AnalistaForm.tsx`
- Agregado import del servicio de sucursales
- Reemplazado array hardcodeado por consulta a base de datos
- Implementados selectores con indicadores de carga
- Agregado manejo de estados de error

## Uso

### Configuración de Prioridades

1. **Acceder a Gestión de Analistas**
   - Ir a la página de analistas
   - Hacer clic en "Configurar prioridades" para un analista

2. **Seleccionar Prioridad "Sucursal"**
   - En cualquiera de las tres prioridades disponibles
   - Seleccionar "Sucursal" del dropdown

3. **Elegir Sucursal**
   - Se mostrará un selector con las sucursales disponibles
   - Las sucursales se cargan automáticamente desde la base de datos
   - Seleccionar la sucursal deseada

4. **Guardar Configuración**
   - Hacer clic en "Guardar"
   - La configuración se guardará con la sucursal seleccionada

### Estados de Carga

```typescript
// Durante la carga
<Select disabled={true}>
  <SelectValue placeholder="Cargando sucursales..." />
</Select>

// Sin sucursales disponibles
<SelectItem value="" disabled>No hay sucursales disponibles</SelectItem>

// Con sucursales disponibles
{sucursales.map((sucursal) => (
  <SelectItem key={sucursal.id} value={sucursal.id.toString()}>
    {sucursal.nombre}
  </SelectItem>
))}
```

## Estructura de Datos

### Sucursal Interface
```typescript
interface Sucursal {
  id: number;
  nombre: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  activo: boolean;
  codigo?: string;
  ciudad_id?: number;
  created_at?: string;
  updated_at?: string;
}
```

### Configuración de Prioridades
```typescript
// Prioridad 1
prioridad_1: 'sucursal'
sucursal_1: '1' // ID de la sucursal seleccionada

// Prioridad 2
prioridad_2: 'sucursal'
sucursal_2: '2' // ID de la sucursal seleccionada

// Prioridad 3
prioridad_3: 'sucursal'
sucursal_3: '3' // ID de la sucursal seleccionada
```

## Beneficios

1. **Datos Actualizados**: Las sucursales se cargan desde la base de datos en tiempo real
2. **Flexibilidad**: Se pueden agregar/editar sucursales sin modificar código
3. **Experiencia de Usuario**: Indicadores de carga y manejo de errores
4. **Validación**: Requiere selección de sucursal cuando se elige prioridad "sucursal"
5. **Mantenibilidad**: Código limpio y reutilizable

## Casos de Uso

### Caso 1: Configuración Normal
- Usuario selecciona prioridad "Sucursal"
- Se cargan las sucursales disponibles
- Usuario selecciona una sucursal
- Se guarda la configuración

### Caso 2: Sin Sucursales
- Usuario selecciona prioridad "Sucursal"
- No hay sucursales en la base de datos
- Se muestra mensaje "No hay sucursales disponibles"
- Usuario debe elegir otra prioridad

### Caso 3: Error de Carga
- Usuario selecciona prioridad "Sucursal"
- Error al cargar sucursales
- Se maneja el error gracefully
- Se muestra mensaje de error apropiado

## Configuración

### Variables de Entorno
No se requieren variables de entorno adicionales. Utiliza la configuración existente de Supabase.

### Base de Datos
Requiere la tabla `gen_sucursales` con la siguiente estructura:
- `id`: Identificador único
- `nombre`: Nombre de la sucursal
- `activo`: Estado de la sucursal (boolean)
- `direccion`: Dirección (opcional)
- `telefono`: Teléfono (opcional)
- `email`: Email (opcional)
- `codigo`: Código de la sucursal (opcional)
- `ciudad_id`: ID de la ciudad (opcional)

## Mantenimiento

### Agregar Nueva Sucursal
1. Ir a la base de datos
2. Insertar nueva fila en `gen_sucursales`
3. Establecer `activo = true`
4. La sucursal aparecerá automáticamente en los selectores

### Desactivar Sucursal
1. Actualizar `activo = false` en la base de datos
2. La sucursal ya no aparecerá en los selectores
3. Las configuraciones existentes se mantienen

### Modificar Sucursal
1. Actualizar los campos necesarios en `gen_sucursales`
2. Los cambios se reflejarán automáticamente en los selectores
3. Las configuraciones existentes se actualizarán

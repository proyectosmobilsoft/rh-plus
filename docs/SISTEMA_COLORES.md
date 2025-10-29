# Sistema de Configuración de Colores

## Descripción General

El sistema de configuración de colores permite personalizar dinámicamente todos los colores utilizados en la interfaz del sistema, incluyendo estados, acciones, botones, texto, formularios y más.

## Estructura de la Base de Datos

### Tabla: `gen_colores`

```sql
CREATE TABLE gen_colores (
  id SERIAL PRIMARY KEY,
  categoria VARCHAR(100) NOT NULL,
  elemento VARCHAR(100) NOT NULL,
  color_hex VARCHAR(7) NOT NULL,
  color_tailwind VARCHAR(100),
  descripcion TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by INTEGER,
  empresa_id INTEGER,
  
  CONSTRAINT unique_categoria_elemento UNIQUE(categoria, elemento)
);
```

### Categorías Disponibles

1. **estados** - Colores para estados de solicitudes
2. **filas** - Colores de fondo para filas de tablas
3. **acciones** - Colores para iconos de acciones
4. **botones** - Colores para botones de confirmación
5. **texto** - Colores para diferentes tipos de texto
6. **formularios** - Colores para elementos de formularios
7. **plantillas** - Colores para secciones de plantillas
8. **sistema** - Colores principales del sistema
9. **navegacion** - Colores para elementos de navegación
10. **tablas** - Colores para elementos de tablas

## Componentes del Sistema

### 1. Servicio de Colores (`coloresService`)

```typescript
import { coloresService } from '@/services/coloresService';

// Obtener todos los colores
const colores = await coloresService.getAll();

// Obtener colores por categoría
const coloresEstados = await coloresService.getByCategory('estados');

// Obtener color específico
const color = await coloresService.getByElement('estados', 'PENDIENTE');

// Actualizar color
await coloresService.update(id, { color_hex: '#FF0000' });

// Crear nuevo color
await coloresService.create({
  categoria: 'estados',
  elemento: 'NUEVO_ESTADO',
  color_hex: '#00FF00',
  color_tailwind: 'bg-green-500 text-white',
  descripcion: 'Nuevo estado del sistema'
});
```

### 2. Contexto de Colores (`ColorsContext`)

```typescript
import { useColors } from '@/contexts/ColorsContext';

const { getColor, getColorHex, getColorTailwind } = useColors();

// Obtener color por categoría y elemento
const color = getColor('estados', 'PENDIENTE');
const hexColor = getColorHex('estados', 'PENDIENTE');
const tailwindClasses = getColorTailwind('estados', 'PENDIENTE');
```

### 3. Hook de Colores del Sistema (`useSystemColors`)

```typescript
import useSystemColors from '@/hooks/useSystemColors';

const {
  getEstadoColor,
  getFilaBackgroundColor,
  getEstadoBadgeClasses,
  getAccionColor,
  getBotonColor,
  getTextoColor
} = useSystemColors();

// Obtener clases completas para badge de estado
const badgeClasses = getEstadoBadgeClasses('PENDIENTE');

// Obtener color de fondo para fila
const rowBackground = getFilaBackgroundColor('APROBADA');

// Obtener color para acción
const actionColor = getAccionColor('EDITAR');
```

## Uso en Componentes

### Ejemplo: Badge de Estado

```typescript
import useSystemColors from '@/hooks/useSystemColors';

const SolicitudesList = () => {
  const { getEstadoBadgeClasses } = useSystemColors();

  const getStatusBadge = (estado: string) => {
    const badgeClasses = getEstadoBadgeClasses(estado);
    
    return (
      <Badge className={badgeClasses}>
        {estado.charAt(0).toUpperCase() + estado.slice(1).toLowerCase()}
      </Badge>
    );
  };

  return (
    <div>
      {getStatusBadge('PENDIENTE')}
      {getStatusBadge('APROBADA')}
    </div>
  );
};
```

### Ejemplo: Colores de Fondo de Filas

```typescript
const SolicitudesList = () => {
  const { getFilaBackgroundColor } = useSystemColors();

  return (
    <TableRow className={getFilaBackgroundColor(solicitud.estado)}>
      {/* Contenido de la fila */}
    </TableRow>
  );
};
```

### Ejemplo: Colores de Acciones

```typescript
const SolicitudesList = () => {
  const { getAccionColor } = useSystemColors();

  return (
    <Button className={getAccionColor('EDITAR')}>
      <Edit className="w-4 h-4" />
      Editar
    </Button>
  );
};
```

## Configuración de Colores

### 1. Acceder a la Configuración

1. Ir a **Configuración Global**
2. Seleccionar el tab **"Configuración de Colores"**
3. Los colores están organizados por categorías en tabs

### 2. Editar un Color Existente

1. Hacer clic en el botón **Editar** del color deseado
2. Modificar el color hexadecimal usando el selector de color
3. Ajustar las clases de Tailwind CSS
4. Actualizar la descripción si es necesario
5. Hacer clic en **Guardar**

### 3. Crear un Nuevo Color

1. En la sección **"Agregar Nuevo Color"**
2. Seleccionar la categoría
3. Ingresar el nombre del elemento
4. Elegir el color hexadecimal
5. Agregar clases de Tailwind CSS
6. Escribir una descripción
7. Hacer clic en **Agregar Color**

### 4. Eliminar un Color

1. Hacer clic en el botón **Eliminar** del color
2. El color se desactiva (soft delete)
3. Para restaurarlo, usar la función de restauración

## Colores por Defecto

El sistema incluye una configuración completa de colores por defecto:

### Estados
- **PENDIENTE**: Amarillo (#FCD34D)
- **ASIGNADO**: Azul (#93C5FD)
- **APROBADA**: Verde (#86EFAC)
- **RECHAZADA**: Rojo (#FCA5A5)
- **STAND BY**: Gris (#D1D5DB)

### Acciones
- **EDITAR**: Púrpura (#9333EA)
- **VISUALIZAR**: Azul (#2563EB)
- **APROBAR**: Verde (#16A34A)
- **CANCELAR**: Rojo (#DC2626)

### Sistema
- **PRIMARY**: Cian (#0891B2)
- **SUCCESS**: Verde (#16A34A)
- **WARNING**: Amarillo (#D97706)
- **ERROR**: Rojo (#DC2626)
- **INFO**: Azul (#2563EB)

## Validaciones y Seguridad

### Validación de Colores Hexadecimales

```typescript
// El sistema valida automáticamente los colores hexadecimales
if (!coloresService.validateHexColor(colorHex)) {
  toast.error('Color hexadecimal inválido');
  return;
}
```

### Cálculo de Contraste

```typescript
// El sistema calcula automáticamente el contraste para texto
const contrastColor = getContrastColor(backgroundColor);
```

### Fallbacks de Seguridad

```typescript
// Si no se encuentra un color, se usan valores por defecto
const color = getColor('estados', 'PENDIENTE') || {
  color_hex: '#FCD34D',
  color_tailwind: 'bg-yellow-300 text-yellow-900'
};
```

## Migración de Componentes Existentes

### Antes (Colores Hardcodeados)

```typescript
// ❌ No hacer esto
<Badge className="bg-yellow-300 hover:bg-yellow-400 text-yellow-900 border-yellow-500">
  Pendiente
</Badge>
```

### Después (Colores Dinámicos)

```typescript
// ✅ Hacer esto
const { getEstadoBadgeClasses } = useSystemColors();

const getStatusBadge = (estado: string) => {
  const badgeClasses = getEstadoBadgeClasses(estado);
  return <Badge className={badgeClasses}>{estado}</Badge>;
};
```

## Mejores Prácticas

1. **Siempre usar el hook** `useSystemColors` en lugar de colores hardcodeados
2. **Probar el contraste** antes de aplicar colores personalizados
3. **Mantener consistencia** en la nomenclatura de elementos
4. **Documentar cambios** en la configuración de colores
5. **Usar fallbacks** para casos donde no se encuentren colores

## Troubleshooting

### Problema: Los colores no se actualizan

**Solución**: Verificar que el componente esté envuelto en `ColorsProvider`

```typescript
// En el App.tsx o componente raíz
import { ColorsProvider } from '@/contexts/ColorsContext';

function App() {
  return (
    <ColorsProvider>
      {/* Resto de la aplicación */}
    </ColorsProvider>
  );
}
```

### Problema: Error al cargar colores

**Solución**: Verificar la conexión a la base de datos y la tabla `gen_colores`

### Problema: Colores no se aplican correctamente

**Solución**: Verificar que las clases de Tailwind CSS sean válidas

## Extensibilidad

El sistema está diseñado para ser fácilmente extensible:

1. **Nuevas categorías**: Agregar en la tabla y en el hook
2. **Nuevos elementos**: Crear en la interfaz de configuración
3. **Validaciones personalizadas**: Extender el servicio de colores
4. **Temas**: Implementar múltiples temas usando la misma estructura

## Soporte

Para soporte técnico o preguntas sobre el sistema de colores:

1. Revisar esta documentación
2. Verificar los logs de la consola
3. Contactar al equipo de desarrollo
4. Revisar la configuración en la base de datos

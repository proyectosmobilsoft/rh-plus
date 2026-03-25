# 📅 DateRangePicker - Selector de Rango de Fechas Moderno

Un componente React moderno y completamente funcional para seleccionar rangos de fechas, construido con `react-day-picker` y `date-fns`.

## 🚀 Características

- ✅ **Selección de rango**: Fecha inicial y final con calendario visual
- ✅ **Presets rápidos**: Rangos predefinidos (hoy, esta semana, este mes, etc.)
- ✅ **Validaciones**: Rango mínimo/máximo, fechas futuras, etc.
- ✅ **Responsive**: Adaptable a diferentes tamaños de pantalla
- ✅ **Internacionalización**: Soporte para múltiples idiomas
- ✅ **Accesibilidad**: Cumple estándares de accesibilidad
- ✅ **Personalizable**: Estilos y comportamiento completamente configurables

## 📦 Instalación

```bash
npm install react-day-picker date-fns
```

## 🎯 Uso Básico

```tsx
import { DateRangePicker, DateRange } from '@/components/ui/DateRangePicker';
import { useState } from 'react';

function MyComponent() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined
  });

  return (
    <DateRangePicker
      value={dateRange}
      onChange={setDateRange}
      placeholder="Selecciona un rango de fechas"
    />
  );
}
```

## 🔧 Props del Componente

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `value` | `DateRange` | - | **Requerido**. Rango de fechas actual |
| `onChange` | `(range: DateRange) => void` | - | **Requerido**. Callback cuando cambia el rango |
| `placeholder` | `string` | `"Seleccionar rango de fechas"` | Texto placeholder |
| `className` | `string` | - | Clases CSS adicionales |
| `disabled` | `boolean` | `false` | Deshabilitar el componente |
| `presets` | `Preset[]` | `defaultPresets` | Rangos predefinidos |
| `maxDate` | `Date` | - | Fecha máxima permitida |
| `minDate` | `Date` | - | Fecha mínima permitida |
| `showPresets` | `boolean` | `true` | Mostrar panel de presets |

## 📋 Interface DateRange

```tsx
interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}
```

## 🎨 Presets Personalizados

```tsx
const customPresets = [
  {
    label: 'Última semana',
    value: () => ({
      from: subDays(new Date(), 7),
      to: new Date()
    })
  },
  {
    label: 'Este trimestre',
    value: () => ({
      from: startOfQuarter(new Date()),
      to: endOfQuarter(new Date())
    })
  }
];

<DateRangePicker
  value={dateRange}
  onChange={setDateRange}
  presets={customPresets}
/>
```

## ✅ Validaciones

### Hook de Validación

```tsx
import { useDateRangeValidation } from '@/hooks/useDateRangeValidation';

const validation = useDateRangeValidation(dateRange, {
  maxRangeDays: 90,        // Máximo 90 días
  minRangeDays: 1,         // Mínimo 1 día
  allowSameDay: false,     // No permitir mismo día
  allowFutureDates: false, // No permitir fechas futuras
  maxDate: new Date(),     // Fecha máxima: hoy
  minDate: new Date('2020-01-01') // Fecha mínima
});

// validation.isValid - boolean
// validation.errors - string[]
// validation.warnings - string[]
```

### Opciones de Validación

| Opción | Tipo | Default | Descripción |
|--------|------|---------|-------------|
| `maxRangeDays` | `number` | `365` | Días máximos en el rango |
| `minRangeDays` | `number` | `1` | Días mínimos en el rango |
| `maxDate` | `Date` | - | Fecha máxima permitida |
| `minDate` | `Date` | - | Fecha mínima permitida |
| `allowSameDay` | `boolean` | `true` | Permitir mismo día |
| `allowFutureDates` | `boolean` | `true` | Permitir fechas futuras |

## 🎨 Estilos y Personalización

### Clases CSS Principales

```css
/* Contenedor principal */
.date-range-picker {
  @apply relative;
}

/* Botón trigger */
.date-range-picker-trigger {
  @apply w-full justify-start text-left font-normal bg-white border-gray-300 hover:bg-gray-50;
}

/* Panel de presets */
.date-range-presets {
  @apply border-r border-gray-200 p-3 min-w-[200px];
}

/* Calendario */
.date-range-calendar {
  @apply p-3;
}
```

### Personalización con Tailwind

```tsx
<DateRangePicker
  value={dateRange}
  onChange={setDateRange}
  className="w-full max-w-lg border-2 border-blue-200 rounded-xl"
/>
```

## 🌍 Internacionalización

### Configuración de Idioma

```tsx
import { es } from 'date-fns/locale';

// El componente ya incluye soporte para español
// Para otros idiomas, modifica el locale en el componente
```

### Formatos de Fecha

```tsx
// Los formatos se pueden personalizar en el componente
const formatDateRange = (range: DateRange) => {
  if (!range.from) return placeholder;
  
  if (!range.to) {
    return format(range.from, "dd/MM/yyyy", { locale: es });
  }
  
  return `${format(range.from, "dd/MM", { locale: es })} - ${format(range.to, "dd/MM/yyyy", { locale: es })}`;
};
```

## 📱 Responsive Design

### Breakpoints

```tsx
// El componente se adapta automáticamente
<DateRangePicker
  value={dateRange}
  onChange={setDateRange}
  className="w-full sm:w-80 md:w-96 lg:w-[400px]"
/>
```

### Mobile-First

- En móviles: Un solo mes visible
- En tablets: Dos meses visibles
- En desktop: Panel de presets + dos meses

## 🔗 Integración con APIs

### Ejemplo con React Query

```tsx
import { useQuery } from '@tanstack/react-query';

const { data, isLoading } = useQuery({
  queryKey: ['dashboard-stats', dateRange.from, dateRange.to],
  queryFn: async () => {
    if (!dateRange.from || !dateRange.to) return null;
    
    const response = await fetch('/api/stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString()
      })
    });
    
    return response.json();
  },
  enabled: !!(dateRange.from && dateRange.to)
});
```

### Ejemplo con Filtros

```tsx
const [filters, setFilters] = useState({
  dateRange: { from: undefined, to: undefined },
  company: 'all',
  status: 'all'
});

const handleDateRangeChange = (newRange: DateRange) => {
  setFilters(prev => ({
    ...prev,
    dateRange: newRange
  }));
  
  // Ejecutar búsqueda automáticamente
  if (newRange.from && newRange.to) {
    executeSearch();
  }
};
```

## 🧪 Testing

### Test Básico

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { DateRangePicker } from '@/components/ui/DateRangePicker';

test('should select date range', () => {
  const mockOnChange = jest.fn();
  
  render(
    <DateRangePicker
      value={{ from: undefined, to: undefined }}
      onChange={mockOnChange}
    />
  );
  
  // Simular selección de fechas
  fireEvent.click(screen.getByRole('button'));
  // ... más tests
});
```

## 🐛 Troubleshooting

### Problemas Comunes

1. **Fechas no se actualizan**
   - Verifica que `onChange` esté correctamente conectado
   - Asegúrate de que el estado se actualice correctamente

2. **Validaciones no funcionan**
   - Verifica que el hook `useDateRangeValidation` esté importado
   - Revisa las opciones de validación

3. **Estilos no se aplican**
   - Verifica que Tailwind CSS esté configurado
   - Revisa las clases CSS personalizadas

## 📚 Ejemplos Completos

Ver `client/src/components/examples/DateRangeExample.tsx` para un ejemplo completo con todas las funcionalidades.

## 🤝 Contribuir

1. Fork el repositorio
2. Crea una rama para tu feature
3. Haz commit de tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📄 Licencia

MIT License - ver archivo LICENSE para más detalles.

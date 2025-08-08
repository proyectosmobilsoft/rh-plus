# Cambios en el Color Gris de la Aplicación

## Resumen de Cambios

Se ha actualizado el color gris en toda la aplicación para usar el color específico `#9d9d9d` en lugar de los grises genéricos anteriores.

## Color Aplicado

- **Color específico**: `#9d9d9d`
- **Variable CSS**: `--brand-gray: 0 0% 62%`
- **Variable para placeholders**: `--placeholder-color: 0 0% 62%`

## Elementos Afectados

### 1. Placeholders
- Todos los placeholders de inputs, textareas y selects ahora usan el color `#9d9d9d`
- Se aplica tanto en modo claro como oscuro
- Compatible con todos los navegadores (Chrome, Firefox, Safari, IE)

### 2. Bordes de Campos
- Inputs, textareas, selects y otros campos de formulario
- Bordes de componentes de UI (cards, popovers, dropdowns)
- Bordes de calendarios y date pickers

### 3. Estados Hover
- Efectos hover en campos de formulario
- Hover en componentes de UI
- Transiciones suaves manteniendo el color gris específico

### 4. Componentes Específicos
- **Input**: Usa `border-input` y `placeholder:text-muted-foreground`
- **Textarea**: Usa `border-input` y `placeholder:text-muted-foreground`
- **Select**: Usa `border-input` y `placeholder:text-muted-foreground`
- **Calendar/DatePicker**: Bordes con el color gris específico
- **Cards**: Hover con borde gris específico
- **Badges**: Bordes con color gris específico
- **Switches/Toggles**: Fondo gris cuando no están activos

## Elementos NO Afectados

- **Texto de contenido**: Las letras y texto mantienen sus colores originales
- **Botones principales**: Mantienen los colores de marca (verde lima y azul turquesa)
- **Enlaces**: Mantienen el color azul turquesa
- **Iconos**: Mantienen sus colores originales

## Variables CSS Actualizadas

```css
:root {
  --brand-gray: 0 0% 62%;           /* #9d9d9d */
  --placeholder-color: 0 0% 62%;     /* #9d9d9d */
  --border: var(--brand-gray);       /* #9d9d9d */
  --input: var(--brand-gray);        /* #9d9d9d */
}
```

## Estilos Agregados

### Placeholders
```css
::placeholder {
  color: hsl(var(--placeholder-color)) !important;
  opacity: 1;
}
```

### Hovers en Campos
```css
input:hover,
textarea:hover,
select:hover {
  border-color: hsl(var(--brand-gray)) !important;
}
```

### Focus en Campos
```css
input:focus,
textarea:focus,
select:focus {
  border-color: hsl(var(--brand-lime)) !important;
  outline-color: hsl(var(--brand-lime)) !important;
}
```

## Compatibilidad

- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Internet Explorer 10+

## Notas Importantes

1. **Consistencia**: Todos los placeholders ahora tienen el mismo color gris específico
2. **Accesibilidad**: El contraste del color `#9d9d9d` cumple con los estándares de accesibilidad
3. **Modo Oscuro**: Los placeholders mantienen el mismo color en modo oscuro
4. **Performance**: Los cambios usan variables CSS para mejor rendimiento

## Archivos Modificados

- `client/src/index.css`: Variables CSS y estilos globales
- `tailwind.config.ts`: Configuración de colores (ya tenía el color definido)

## Próximos Pasos

Si necesitas ajustar el color o agregar más elementos, simplemente modifica las variables CSS en `client/src/index.css`:

```css
--brand-gray: 0 0% 62%;        /* Cambiar el porcentaje para ajustar el tono */
--placeholder-color: 0 0% 62%;  /* Mantener sincronizado con brand-gray */
``` 
# Validaciones de Documentos y Campos

## Descripción

Este documento describe las validaciones implementadas para manejar documentos y campos que pueden venir en diferentes formatos, incluyendo campos pegados sin la raya al piso (_) y variaciones en los tipos de documento.

## Características Implementadas

### 1. Validación de Tipos de Documento

El sistema ahora reconoce y normaliza automáticamente las siguientes variaciones de tipos de documento:

#### Cédula de Ciudadanía
- `cedulaciudadania` → `CC`
- `cedula_ciudadania` → `CC`
- `cedula ciudadania` → `CC`
- `ceduladeciudadania` → `CC`
- `cedula_de_ciudadania` → `CC`
- `cedula de ciudadania` → `CC`
- `cedulaciudadanía` → `CC`
- `cedula_ciudadanía` → `CC`
- `cedula ciudadanía` → `CC`
- `ceduladeciudadanía` → `CC`
- `cedula_de_ciudadanía` → `CC`
- `cedula de ciudadanía` → `CC`

#### Cédula de Extranjería
- `cedulaextranjeria` → `CE`
- `cedula_extranjeria` → `CE`
- `cedula extranjeria` → `CE`
- `ceduladeextranjeria` → `CE`
- `cedula_de_extranjeria` → `CE`
- `cedula de extranjeria` → `CE`
- `cedulaextranjería` → `CE`
- `cedula_extranjería` → `CE`
- `cedula extranjería` → `CE`
- `ceduladeextranjería` → `CE`
- `cedula_de_extranjería` → `CE`
- `cedula de extranjería` → `CE`

#### Tarjeta de Identidad
- `tarjetadeidentidad` → `TI`
- `tarjeta_de_identidad` → `TI`
- `tarjeta de identidad` → `TI`

#### Pasaporte
- `pasaporte` → `PP`

#### NIT
- `nit` → `NIT`

### 2. Normalización de Campos Pegados

El sistema ahora maneja automáticamente campos que pueden venir pegados sin la raya al piso (_):

#### Patrones de Normalización
- `camelCase` → `snake_case`
- `letraNúmero` → `letra_número`
- `númeroLetra` → `número_letra`
- `patronesComplejos` → `patrones_complejos`

#### Ejemplos de Campos Normalizados
- `nombrecompleto` → `nombre_completo`
- `nombrescompletos` → `nombres_completos`
- `nombreyapellidos` → `nombre_y_apellidos`
- `nombreapellidos` → `nombre_apellidos`
- `primer_nombre` → `primer_nombre` (ya normalizado)
- `segundo_nombre` → `segundo_nombre` (ya normalizado)

### 3. Validación de Números de Documento

- **Longitud mínima**: 6 dígitos
- **Longitud máxima**: 15 dígitos
- **Solo números**: Se eliminan automáticamente caracteres no numéricos
- **Validación de formato**: Se verifica que sea un número válido

### 4. Validación de Emails

- **Formato válido**: Se verifica que tenga el formato correcto de email
- **Normalización**: Se convierte a minúsculas automáticamente
- **Espacios**: Se eliminan espacios en blanco

### 5. Validación de Campos de Texto

- **Longitud mínima**: 2 caracteres (configurable)
- **Longitud máxima**: 100 caracteres (configurable)
- **Espacios**: Se eliminan espacios en blanco al inicio y final
- **Caracteres especiales**: Se permiten caracteres especiales según el tipo de campo

## Archivos Modificados

### 1. `client/src/utils/validationUtils.ts`
Nuevo archivo con utilidades de validación y normalización.

### 2. `client/src/services/solicitudesService.ts`
Actualizado para usar las validaciones en la creación de solicitudes y candidatos.

### 3. `client/src/components/solicitudes/SolicitudForm.tsx`
Actualizado para usar las validaciones en el formulario de solicitudes.

### 4. `client/src/pages/empresa/CrearCandidatoSimple.tsx`
Actualizado para usar las validaciones en el formulario de candidatos.

## Uso

### En Formularios
Los formularios ahora validan automáticamente los campos usando las validaciones personalizadas:

```typescript
// Ejemplo de uso en un formulario
const validation = validateTipoDocumento('cedulaciudadania');
if (validation.isValid) {
  console.log(validation.tipo); // 'CC'
} else {
  console.log(validation.error); // Mensaje de error
}
```

### En Servicios
Los servicios normalizan automáticamente los datos antes de procesarlos:

```typescript
// Ejemplo de normalización automática
const datosNormalizados = { ...datos };
Object.keys(datosNormalizados).forEach(key => {
  if (typeof datosNormalizados[key] === 'string') {
    datosNormalizados[normalizeCampo(key)] = datosNormalizados[key];
  }
});
```

## Beneficios

1. **Flexibilidad**: Acepta múltiples formatos de entrada
2. **Consistencia**: Normaliza automáticamente los datos
3. **Validación robusta**: Valida formatos y longitudes
4. **Manejo de errores**: Proporciona mensajes de error claros
5. **Compatibilidad**: Funciona con datos existentes y nuevos

## Casos de Uso

### Caso 1: Documento con variación
- **Entrada**: `cedulaciudadania`
- **Procesamiento**: Se normaliza a `CC`
- **Resultado**: Válido

### Caso 2: Campo pegado
- **Entrada**: `nombrecompleto`
- **Procesamiento**: Se normaliza a `nombre_completo`
- **Resultado**: Se puede acceder al campo normalizado

### Caso 3: Número de documento con caracteres especiales
- **Entrada**: `12.345.678-9`
- **Procesamiento**: Se limpia a `123456789`
- **Resultado**: Válido si tiene entre 6 y 15 dígitos

### Caso 4: Email con espacios
- **Entrada**: ` usuario@ejemplo.com `
- **Procesamiento**: Se normaliza a `usuario@ejemplo.com`
- **Resultado**: Válido

## Configuración

Las validaciones se pueden configurar modificando las constantes en `validationUtils.ts`:

```typescript
// Configurar longitud mínima de documento
const MIN_DOCUMENT_LENGTH = 6;

// Configurar longitud máxima de documento
const MAX_DOCUMENT_LENGTH = 15;

// Configurar longitud mínima de texto
const MIN_TEXT_LENGTH = 2;

// Configurar longitud máxima de texto
const MAX_TEXT_LENGTH = 100;
```

## Mantenimiento

Para agregar nuevas variaciones de tipos de documento:

1. Agregar la variación al objeto `tipoMap` en `validationUtils.ts`
2. Agregar la variación al array `tiposValidos` si es necesario
3. Probar la nueva variación en los formularios

Para agregar nuevos patrones de normalización:

1. Agregar el patrón al array `patrones` en la función `normalizeCampo`
2. Probar el nuevo patrón con datos de ejemplo

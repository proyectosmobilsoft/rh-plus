# Validación de Empresa para Creación de Solicitudes

## Descripción

Esta funcionalidad valida que el usuario autenticado tenga una empresa asociada antes de permitir la creación de solicitudes. Si el usuario no tiene empresa asociada, se muestra un modal de advertencia explicando el problema y las posibles soluciones.

## Características Implementadas

### 1. Modal de Advertencia (`ModalSinEmpresa.tsx`)

Componente modal que se muestra cuando un usuario intenta crear una solicitud sin tener empresa asociada.

#### Características del Modal
- **Diseño atractivo** con iconos y colores apropiados
- **Explicación clara** del problema y por qué es necesario tener empresa
- **Opciones de acción** para el usuario
- **Botón de contacto** con administrador
- **Responsive** y accesible

#### Contenido del Modal
- **Título**: "No se puede crear la solicitud"
- **Descripción**: Explica que se necesita una empresa asociada
- **Sección informativa**: Explica por qué es necesario tener empresa
- **Lista de acciones**: Qué puede hacer el usuario
- **Botones**: "Entendido" y "Contactar Administrador"

### 2. Utilidades de Validación (`empresaValidation.ts`)

Funciones utilitarias para validar la asociación de empresa del usuario.

#### Funciones Disponibles

##### `hasEmpresaAsociada(user: User | null): boolean`
- Valida si el usuario tiene empresa asociada
- Verifica tanto el array de empresas del usuario como localStorage
- Retorna `true` si tiene empresa, `false` si no

##### `getEmpresaSeleccionada(): number | null`
- Obtiene el ID de la empresa seleccionada del localStorage
- Retorna el ID o `null` si no hay empresa seleccionada

##### `getEmpresaInfo(): { id: number; razon_social: string } | null`
- Obtiene información completa de la empresa seleccionada
- Retorna objeto con ID y razón social o `null`

##### `canCreateSolicitud(user: User | null): { canCreate: boolean; errorMessage?: string; empresaId?: number }`
- Función principal de validación
- Retorna objeto con resultado de validación y detalles
- Incluye mensaje de error si no puede crear solicitud
- Incluye ID de empresa si puede crear

### 3. Integración en PlantillasSelector

El componente `PlantillasSelector` ahora incluye:

#### Validación Previa
- **Verificación automática** antes de crear solicitud
- **Uso de `canCreateSolicitud()`** para validar usuario
- **Prevención de creación** si no tiene empresa

#### Manejo de Estados
- **Estado del modal** (`showModalSinEmpresa`)
- **Funciones de manejo** para abrir/cerrar modal
- **Callback de contacto** con administrador

#### Flujo de Validación
```typescript
// En handleFormSave
const validation = canCreateSolicitud(user);
if (!validation.canCreate) {
  console.warn('❌ Usuario no puede crear solicitud:', validation.errorMessage);
  setShowModalSinEmpresa(true);
  return;
}
```

## Archivos Modificados

### 1. `client/src/components/solicitudes/ModalSinEmpresa.tsx` (NUEVO)
Modal de advertencia para usuarios sin empresa asociada.

### 2. `client/src/utils/empresaValidation.ts` (NUEVO)
Utilidades para validar asociación de empresa del usuario.

### 3. `client/src/components/solicitudes/PlantillasSelector.tsx`
- Agregado import de validaciones y modal
- Integrada validación en `handleFormSave`
- Agregado estado y funciones para manejo del modal
- Incluido modal en el render del componente

## Flujo de Validación

### 1. Usuario Intenta Crear Solicitud
- Usuario llena formulario y hace clic en "Guardar"
- Se ejecuta `handleFormSave`

### 2. Validación de Empresa
- Se llama a `canCreateSolicitud(user)`
- Se verifica si el usuario tiene empresa asociada
- Se verifica si hay empresa seleccionada en localStorage

### 3. Casos de Resultado

#### ✅ Usuario Tiene Empresa
- Validación pasa
- Se procede con la creación de solicitud
- Se usa el ID de empresa del usuario

#### ❌ Usuario No Tiene Empresa
- Validación falla
- Se muestra modal de advertencia
- Se previene la creación de solicitud
- Se explica el problema y soluciones

### 4. Acciones del Usuario

#### Botón "Entendido"
- Cierra el modal
- Usuario puede intentar resolver el problema

#### Botón "Contactar Administrador"
- Muestra mensaje de funcionalidad en desarrollo
- Cierra el modal
- Futuro: implementar contacto real con admin

## Casos de Uso

### Caso 1: Usuario Normal con Empresa
- Usuario tiene empresa asociada
- Validación pasa
- Solicitud se crea normalmente

### Caso 2: Usuario Sin Empresa
- Usuario no tiene empresa asociada
- Se muestra modal de advertencia
- Se previene creación de solicitud
- Usuario debe contactar administrador

### Caso 3: Usuario con Empresa No Seleccionada
- Usuario tiene empresa pero no está seleccionada
- Se muestra modal de advertencia
- Usuario debe seleccionar empresa

### Caso 4: Usuario No Autenticado
- No hay usuario autenticado
- Se muestra modal de advertencia
- Usuario debe autenticarse

## Beneficios

1. **Prevención de Errores**: Evita crear solicitudes sin empresa
2. **Experiencia de Usuario**: Explicación clara del problema
3. **Orientación**: Guía al usuario sobre qué hacer
4. **Robustez**: Manejo de todos los casos edge
5. **Mantenibilidad**: Código modular y reutilizable

## Configuración

### Variables de Entorno
No se requieren variables de entorno adicionales.

### Dependencias
- `@/contexts/AuthContext` - Para obtener usuario autenticado
- `@/components/ui/dialog` - Para el modal
- `lucide-react` - Para iconos

### Base de Datos
Requiere las siguientes tablas:
- `gen_usuarios` - Usuarios del sistema
- `gen_usuario_empresas` - Asociación usuario-empresa
- `empresas` - Información de empresas

## Mantenimiento

### Agregar Nueva Validación
1. Modificar `canCreateSolicitud()` en `empresaValidation.ts`
2. Agregar nueva condición de validación
3. Actualizar mensaje de error si es necesario

### Personalizar Modal
1. Modificar `ModalSinEmpresa.tsx`
2. Cambiar contenido, estilos o botones
3. Agregar nuevas funcionalidades

### Integrar en Otros Componentes
1. Importar `canCreateSolicitud` y `ModalSinEmpresa`
2. Agregar validación antes de crear solicitud
3. Manejar estado del modal

## Futuras Mejoras

### 1. Contacto con Administrador
- Implementar funcionalidad real de contacto
- Modal de formulario de contacto
- Envío de email automático

### 2. Asistencia Automática
- Detectar problemas comunes
- Sugerir soluciones específicas
- Guía paso a paso

### 3. Validaciones Adicionales
- Verificar permisos específicos
- Validar estado de la empresa
- Verificar límites de solicitudes

### 4. Mejoras de UX
- Animaciones en el modal
- Sonidos de notificación
- Temas personalizables

## Testing

### Casos de Prueba
1. **Usuario con empresa**: Debe crear solicitud normalmente
2. **Usuario sin empresa**: Debe mostrar modal
3. **Usuario no autenticado**: Debe mostrar modal
4. **Empresa no seleccionada**: Debe mostrar modal
5. **Modal cerrado**: Debe permitir reintento

### Pruebas Manuales
1. Crear usuario sin empresa
2. Intentar crear solicitud
3. Verificar que se muestra modal
4. Probar botones del modal
5. Verificar que no se crea solicitud

## Troubleshooting

### Problema: Modal no se muestra
- Verificar que `showModalSinEmpresa` esté en `true`
- Verificar que `ModalSinEmpresa` esté renderizado
- Verificar que `canCreateSolicitud` retorne `false`

### Problema: Validación no funciona
- Verificar que `user` esté disponible en contexto
- Verificar que `localStorage` tenga datos de empresa
- Verificar que `empresaValidation.ts` esté importado

### Problema: Modal se muestra incorrectamente
- Verificar props del modal
- Verificar funciones de manejo
- Verificar estado del componente

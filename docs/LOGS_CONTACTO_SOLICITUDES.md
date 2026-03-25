# Sistema de Logs - Acción de Contacto en Solicitudes

## Descripción

Este documento detalla la funcionalidad implementada para registrar automáticamente un log en la tabla `hum_solicitudes_logs` cuando se marca una solicitud como "Contactado" desde el módulo de Gestión de Solicitudes.

## Flujo del Proceso

### 1. Interacción del Usuario
- El usuario visualiza el listado de solicitudes en **Gestión de Solicitudes**
- Hace clic en el botón **"Contactado"** (icono de teléfono 📞)
- Se muestra un modal de confirmación solicitando una observación
- El usuario ingresa la observación y confirma la acción

### 2. Proceso Backend

#### 2.1 Función `handleContact` (ExpedicionOrdenPage.tsx)
```typescript
const handleContact = async (id: number, observacion: string) => {
  setIsLoading(true);
  try {
    const success = await solicitudesService.contact(id, observacion);
    if (success) {
      toast.success('Solicitud marcada como contactada');
      fetchSolicitudes(); // Recargar la lista
    } else {
      toast.error('Error al marcar como contactada');
    }
  } catch (error) {
    console.error('Error al contactar solicitud:', error);
    toast.error('Error al contactar la solicitud');
  } finally {
    setIsLoading(false);
  }
};
```

#### 2.2 Servicio `contact` (solicitudesService.ts)
El servicio realiza los siguientes pasos:

1. **Obtener el estado anterior**: Consulta la solicitud para capturar su estado actual antes de modificarlo
2. **Actualizar el estado**: Cambia el estado de la solicitud a `"pendiente documentos"`
3. **Crear el log**: Guarda un registro en `hum_solicitudes_logs` con todos los datos relevantes

```typescript
async contact(id: number, observacion?: string): Promise<boolean> {
  // 1. Obtener estado anterior
  const { data: solicitudAnterior } = await supabase
    .from("hum_solicitudes")
    .select("estado")
    .eq("id", id)
    .single();

  const estadoAnterior = solicitudAnterior?.estado || "desconocido";
  
  // 2. Actualizar estado
  const success = await this.updateStatus(
    id,
    "pendiente documentos",
    observacion
  );
  
  // 3. Crear log específico
  if (success) {
    await solicitudesLogsService.crearLog({
      solicitud_id: id,
      usuario_id: getUsuarioId(),
      accion: ACCIONES_SISTEMA.CONTACTAR,
      estado_anterior: estadoAnterior,
      estado_nuevo: "pendiente documentos",
      observacion: observacion || "Solicitud contactada",
    });
  }
}
```

### 3. Estructura del Log Guardado

El registro guardado en `hum_solicitudes_logs` contiene:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | integer | ID autoincremental del log |
| `solicitud_id` | integer | ID de la solicitud contactada |
| `usuario_id` | integer | ID del usuario que realizó la acción |
| `accion` | string | Siempre será `"CONTACTAR"` |
| `estado_anterior` | string | Estado previo de la solicitud (ej: "creada", "aprobada") |
| `estado_nuevo` | string | Estado nuevo: `"pendiente documentos"` |
| `observacion` | string | Observación ingresada por el usuario |
| `fecha_accion` | timestamp | Fecha y hora exacta de la acción |

### 4. Ejemplo de Registro

```json
{
  "id": 123,
  "solicitud_id": 456,
  "usuario_id": 10,
  "accion": "CONTACTAR",
  "estado_anterior": "aprobada",
  "estado_nuevo": "pendiente documentos",
  "observacion": "Candidato contactado vía telefónica. Disponible para iniciar proceso.",
  "fecha_accion": "2025-10-07T14:30:00Z"
}
```

## Visualización de Logs

Los logs pueden visualizarse en:

1. **Modal de Vista de Solicitud**: Al hacer clic en el ícono de ojo 👁️ en el listado, se muestra un timeline con todas las acciones realizadas sobre la solicitud
2. **Página de Logs del Sistema**: Vista consolidada de todos los logs del sistema

## Beneficios

1. ✅ **Trazabilidad completa**: Cada acción de contacto queda registrada
2. ✅ **Auditoría**: Se sabe quién, cuándo y por qué se contactó una solicitud
3. ✅ **Historial**: Timeline completo de la solicitud
4. ✅ **Estado anterior capturado**: Se preserva el estado previo al contacto
5. ✅ **Observaciones**: Contexto adicional sobre el contacto realizado

## Constantes Utilizadas

```typescript
export const ACCIONES_SISTEMA = {
  CONTACTAR: 'CONTACTAR',
  // ... otras acciones
};

export const ACCIONES_SOLICITUDES = {
  CONTACTAR: 'CONTACTAR',
  // ... otras acciones
};
```

## Notas Técnicas

- El log se crea **después** de actualizar el estado exitosamente
- Si falla la creación del log, se muestra una advertencia en consola pero no se revierte la operación
- El usuario se obtiene del localStorage mediante `getUsuarioId()`
- Si no hay usuario, se intenta obtener uno por defecto del sistema
- La acción se registra en minúsculas en la base de datos pero se define en mayúsculas en las constantes

## Código Relacionado

- **Servicio**: `client/src/services/solicitudesService.ts` (método `contact`)
- **Servicio de Logs**: `client/src/services/solicitudesLogsService.ts`
- **Componente**: `client/src/components/solicitudes/SolicitudesList.tsx`
- **Página**: `client/src/pages/ordenes/ExpedicionOrdenPage.tsx`
- **Hook**: `client/src/hooks/useSolicitudesLogs.ts`

## Mejoras Implementadas (Octubre 2025)

- ✅ Captura del estado anterior antes de actualizar
- ✅ Log detallado con consola para debugging
- ✅ Manejo robusto de errores
- ✅ Observaciones opcionales pero recomendadas
- ✅ Compatibilidad con sistema de logs existente


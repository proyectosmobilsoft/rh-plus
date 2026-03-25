# Diagrama de Flujo - Contacto de Solicitud

## Flujo Visual del Proceso

```
┌─────────────────────────────────────────────────────────────────────┐
│                    INICIO: Usuario en Listado                       │
│                      de Solicitudes                                 │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Usuario hace clic en botón "Contactado" (📞)                      │
│  en la fila de la solicitud                                         │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Se abre Modal de Confirmación                                      │
│  - Título: "Confirmar contacto"                                     │
│  - Campo: Observación (textarea)                                    │
│  - Botones: [Cancelar] [Confirmar]                                  │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Usuario ingresa observación y confirma                             │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  handleContactConfirm() en SolicitudesList                          │
│  - Activa loading global                                            │
│  - Llama onContact(solicitudId, observacion)                        │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  handleContact() en ExpedicionOrdenPage                             │
│  - setIsLoading(true)                                               │
│  - Llama solicitudesService.contact(id, observacion)                │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  solicitudesService.contact() [SERVICIO]                            │
│                                                                     │
│  PASO 1: Obtener estado anterior                                    │
│  ┌────────────────────────────────────────────┐                    │
│  │ SELECT estado FROM hum_solicitudes         │                    │
│  │ WHERE id = solicitudId                     │                    │
│  └────────────────────────────────────────────┘                    │
│         ▼                                                           │
│  estadoAnterior = "aprobada" (por ejemplo)                          │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  PASO 2: Actualizar estado (updateStatus)                          │
│  ┌────────────────────────────────────────────┐                    │
│  │ UPDATE hum_solicitudes                     │                    │
│  │ SET estado = 'pendiente documentos',       │                    │
│  │     observaciones = 'texto ingresado',     │                    │
│  │     updated_at = NOW()                     │                    │
│  │ WHERE id = solicitudId                     │                    │
│  └────────────────────────────────────────────┘                    │
│         ▼                                                           │
│  Estado cambia: "aprobada" → "pendiente documentos"                │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  PASO 3: Crear log automático (updateStatus)                       │
│  ┌────────────────────────────────────────────┐                    │
│  │ INSERT INTO hum_solicitudes_logs           │                    │
│  │ (solicitud_id, usuario_id, accion,         │                    │
│  │  estado_anterior, estado_nuevo,            │                    │
│  │  observacion, fecha_accion)                │                    │
│  │ VALUES (456, 10, 'CAMBIAR_ESTADO',         │                    │
│  │  'aprobada', 'pendiente documentos',       │                    │
│  │  'texto ingresado', NOW())                 │                    │
│  └────────────────────────────────────────────┘                    │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  PASO 4: Crear log específico de CONTACTO                          │
│  ┌────────────────────────────────────────────┐                    │
│  │ INSERT INTO hum_solicitudes_logs           │                    │
│  │ (solicitud_id, usuario_id, accion,         │                    │
│  │  estado_anterior, estado_nuevo,            │                    │
│  │  observacion, fecha_accion)                │                    │
│  │ VALUES (456, 10, 'CONTACTAR',              │                    │
│  │  'aprobada', 'pendiente documentos',       │                    │
│  │  'Candidato contactado vía...', NOW())     │                    │
│  └────────────────────────────────────────────┘                    │
│                                                                     │
│  ⚠️ NOTA: Este log es ADICIONAL al anterior                        │
│  Se crean DOS logs: uno genérico y uno específico                  │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Respuesta exitosa al frontend                                      │
│  success = true                                                     │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  handleContact() - Continuación                                     │
│  - toast.success('Solicitud marcada como contactada')              │
│  - fetchSolicitudes() // Recargar lista                            │
│  - setIsLoading(false)                                              │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  UI se actualiza                                                    │
│  - Lista se recarga con datos frescos                               │
│  - Badge de estado muestra "Pendiente Documentos"                   │
│  - Loading se desactiva                                             │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    FIN: Proceso completado                          │
│                                                                     │
│  RESULTADO EN BASE DE DATOS:                                        │
│  ✅ Estado actualizado en hum_solicitudes                           │
│  ✅ DOS logs creados en hum_solicitudes_logs:                       │
│     1. Log de cambio de estado (CAMBIAR_ESTADO)                    │
│     2. Log específico de contacto (CONTACTAR)                       │
└─────────────────────────────────────────────────────────────────────┘
```

## Datos Guardados en hum_solicitudes_logs

### Log 1: Cambio de Estado (Genérico)
```json
{
  "id": 1001,
  "solicitud_id": 456,
  "usuario_id": 10,
  "accion": "CAMBIAR_ESTADO",
  "estado_anterior": "aprobada",
  "estado_nuevo": "pendiente documentos",
  "observacion": "Candidato contactado vía telefónica",
  "fecha_accion": "2025-10-07T14:30:00Z"
}
```

### Log 2: Acción de Contacto (Específico)
```json
{
  "id": 1002,
  "solicitud_id": 456,
  "usuario_id": 10,
  "accion": "CONTACTAR",
  "estado_anterior": "aprobada",
  "estado_nuevo": "pendiente documentos",
  "observacion": "Candidato contactado vía telefónica",
  "fecha_accion": "2025-10-07T14:30:01Z"
}
```

## Componentes Involucrados

1. **SolicitudesList.tsx** → Interfaz y botón
2. **ExpedicionOrdenPage.tsx** → Controlador de página
3. **solicitudesService.ts** → Lógica de negocio
4. **solicitudesLogsService.ts** → Servicio de logs
5. **supabaseClient.ts** → Cliente de base de datos

## Tablas de Base de Datos

1. **hum_solicitudes** → Información de solicitudes
2. **hum_solicitudes_logs** → Historial de acciones
3. **gen_usuarios** → Información de usuarios (relación)

## Ventajas de esta Implementación

✅ **Doble registro**: Se guarda tanto el cambio de estado como la acción específica de contacto
✅ **Trazabilidad completa**: Estado anterior capturado correctamente
✅ **Auditoría robusta**: Información completa del quién, qué, cuándo y por qué
✅ **Timeline visual**: Los logs aparecen en el modal de vista de solicitud
✅ **Manejo de errores**: Si falla el log específico, no se revierte la operación principal


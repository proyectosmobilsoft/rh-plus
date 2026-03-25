# 🩺 Acción "Citar a Exámenes" en Gestión de Solicitudes

## Descripción

Nueva funcionalidad que permite citar directamente a un candidato a exámenes médicos desde el listado de solicitudes, sin necesidad de que los documentos estén validados previamente.

## 🎯 Objetivo

Permitir a los usuarios con el permiso adecuado citar a exámenes médicos a candidatos que están en estados tempranos del proceso (Asignado o Pendiente Documentos), agilizando el flujo cuando sea necesario.

## 🔐 Permiso Requerido

- **Permiso**: `accion-citar-examenes-solicitud`
- **Descripción**: Permite citar a exámenes médicos desde el listado de solicitudes

## 📍 Ubicación

**Módulo**: Gestión de Solicitudes → Listado de Solicitudes

**Ruta**: `/ordenes/expedicion`

## 🔄 Estados Válidos

El botón "Citar a Exámenes" solo es visible cuando la solicitud está en:
- ✅ **Asignado**
- ✅ **Pendiente Documentos**

## 📝 Proceso Completo

### 1. Usuario hace clic en "Citar a Exámenes"
- Ubicación: Menú de acciones (tres puntos) en cada fila del listado
- Icono: 🩺 Stethoscope (color púrpura)

### 2. Se abre Modal de Confirmación
- **Título**: "¿Citar a exámenes médicos?"
- **Descripción**: Información sobre lo que hará la acción
- **Campo requerido**: Observación (textarea)
- **Botones**: 
  - Cancelar (gris)
  - Citar a Exámenes (púrpura)

### 3. Al Confirmar, se ejecuta `citarAExamenesYEnviarEmail()`

#### Paso 3.1: Obtener información del candidato
```typescript
const candidato = await getCandidatoInfo(solicitudId);
```

#### Paso 3.2: Determinar ciudad del candidato
```typescript
// Usa la ciudad del candidato o una ciudad alternativa si se especifica
let ciudadIdParaBuscar = ciudadId || candidato.ciudad_id;
```

#### Paso 3.3: Buscar prestadores médicos en esa ciudad
```typescript
const prestadores = await getPrestadoresByCiudad(ciudadIdParaBuscar);
```

**Si no hay prestadores:**
- ❌ Retorna error
- 📋 Muestra modal para seleccionar ciudad alternativa

#### Paso 3.4: Enviar email al candidato
```typescript
await enviarEmailPrestadores(candidato, prestadores, observacion, esCiudadAlternativa);
```

**Email incluye:**
- 📧 Saludo personalizado
- 📍 Lista de prestadores médicos disponibles
- 🏥 Dirección de cada laboratorio
- 📞 Teléfono de contacto
- 🕐 Horarios de atención
- 📝 Observaciones adicionales

#### Paso 3.5: Actualizar estado de la solicitud
```typescript
UPDATE hum_solicitudes
SET estado = 'citado examenes',
    updated_at = NOW()
WHERE id = solicitudId;
```

#### Paso 3.6: Crear log en hum_solicitudes_logs
```typescript
INSERT INTO hum_solicitudes_logs
(solicitud_id, accion, observacion, usuario_id, estado_nuevo)
VALUES (solicitudId, 'citar_examenes', observacion, userId, 'citado examenes');
```

### 4. Resultado Final
- ✅ Estado cambia a: **"Citado Exámenes"**
- ✅ Email enviado al candidato
- ✅ Log registrado en el sistema
- ✅ Toast de éxito mostrado
- ✅ Listado se recarga automáticamente

## 🆚 Diferencia con "Validar Documentos"

| Característica | Validar Documentos | Citar a Exámenes |
|----------------|-------------------|------------------|
| **Estado requerido** | Documentos Entregados | Asignado / Pendiente Documentos |
| **Valida documentos** | ✅ Sí | ❌ No |
| **Envía email** | ✅ Sí | ✅ Sí |
| **Estado final** | Citado Exámenes | Citado Exámenes |
| **Permiso** | `accion-validar-documentos-solicitud` | `accion-citar-examenes-solicitud` |
| **Color del botón** | 🟠 Naranja | 🟣 Púrpura |
| **Uso típico** | Flujo estándar | Cita anticipada / Casos especiales |

## 📊 Logs Generados

### Log en hum_solicitudes_logs
```json
{
  "solicitud_id": 123,
  "accion": "citar_examenes",
  "observacion": "Candidato citado anticipadamente por solicitud urgente de la empresa",
  "usuario_id": 45,
  "estado_nuevo": "citado examenes",
  "fecha_accion": "2025-10-07T15:30:00Z"
}
```

## 🎨 Interfaz de Usuario

### Botón en Dropdown Menu
```
┌─────────────────────────────────┐
│ ⋮ Acciones                      │
├─────────────────────────────────┤
│ 👁️  Visualizar                  │
│ ✏️  Editar                       │
│ ✅  Aprobar                      │
│ 📞  Contactado                   │
│ 🩺  Citar a Exámenes      ⬅️ NUEVO│
│ ⏸️  Stand By                     │
│ ...                             │
└─────────────────────────────────┘
```

### Modal de Confirmación
```
┌──────────────────────────────────────────┐
│ ¿Citar a exámenes médicos?              │
├──────────────────────────────────────────┤
│                                          │
│ ¿Estás seguro de que deseas citar a     │
│ exámenes médicos a este candidato?       │
│                                          │
│ Esta acción cambiará el estado de la    │
│ solicitud a "Citado Exámenes" y se      │
│ enviará un correo al candidato con la   │
│ información de los prestadores médicos.  │
│                                          │
│ ┌────────────────────────────────────┐  │
│ │ Observación (requerida)            │  │
│ │ ┌────────────────────────────────┐ │  │
│ │ │ Ingrese observaciones...       │ │  │
│ │ │                                │ │  │
│ │ └────────────────────────────────┘ │  │
│ └────────────────────────────────────┘  │
│                                          │
│  [Cancelar]  [Citar a Exámenes]         │
│                                          │
└──────────────────────────────────────────┘
```

## 🔧 Archivos Modificados

1. **`client/src/services/validacionDocumentosService.ts`**
   - Nuevo método: `citarAExamenesYEnviarEmail()`

2. **`client/src/pages/ordenes/ExpedicionOrdenPage.tsx`**
   - Nuevo handler: `handleCiteExams()`
   - Prop agregada: `onCiteExams={handleCiteExams}`

3. **`client/src/components/solicitudes/SolicitudesList.tsx`**
   - Nueva prop en interfaz: `onCiteExams`
   - Nuevos estados: `confirmCiteExamsOpen`, `citingExamsSolicitudId`, `citeExamsObservacion`
   - Nuevos handlers: `handleCiteExamsClick()`, `handleCiteExamsConfirm()`
   - Nuevo botón en dropdown menu
   - Nuevo modal de confirmación

## 💡 Casos de Uso

### Caso 1: Cita Anticipada
**Escenario**: La empresa necesita urgentemente que el candidato se realice los exámenes médicos antes de entregar todos los documentos.

**Flujo**:
1. Solicitud en estado "Asignado"
2. Usuario hace clic en "Citar a Exámenes"
3. Ingresa observación: "Cita anticipada por solicitud urgente de la empresa"
4. Confirma
5. Candidato recibe email con prestadores
6. Estado cambia a "Citado Exámenes"

### Caso 2: Documentos Pendientes pero Exámenes Urgentes
**Escenario**: El candidato puede hacer los exámenes mientras completa documentación.

**Flujo**:
1. Solicitud en estado "Pendiente Documentos"
2. Usuario cita a exámenes
3. Candidato puede hacer exámenes en paralelo
4. Proceso se agiliza

## ⚠️ Consideraciones

1. **Observación obligatoria**: Se debe explicar por qué se cita anticipadamente
2. **Email automático**: Se envía inmediatamente al confirmar
3. **Prestadores requeridos**: Debe haber prestadores en la ciudad del candidato
4. **Log automático**: Toda acción queda registrada
5. **Irreversible**: Una vez citado, no se puede revertir automáticamente

## 🚀 Beneficios

- ✅ Mayor flexibilidad en el proceso
- ✅ Agiliza casos urgentes
- ✅ Mantiene trazabilidad completa
- ✅ Usa la misma infraestructura probada de "Validar Documentos"
- ✅ Control de permisos granular

## 📈 Métricas

Esta acción se registra en los logs y puede ser monitoreada en:
- Dashboard de reportes
- Timeline de la solicitud
- Logs del sistema

**Acción**: `citar_examenes`
**Estado resultante**: `citado examenes`

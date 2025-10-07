# Plan de Pruebas - Funcionalidad de Contacto de Solicitud

## Objetivo
Verificar que la funcionalidad de contacto de solicitud registre correctamente los logs en la tabla `hum_solicitudes_logs` con todos los datos correspondientes.

## Prerequisitos

1. Usuario autenticado en el sistema
2. Al menos una solicitud en estado "aprobada" o "creada"
3. Acceso al módulo de Gestión de Solicitudes
4. Permisos para contactar solicitudes

## Casos de Prueba

### ✅ Caso 1: Contacto Exitoso con Observación

**Pasos:**
1. Navegar a "Gestión de Solicitudes"
2. Identificar una solicitud en estado "Aprobada"
3. Hacer clic en el botón "Contactado" (📞)
4. En el modal, ingresar: "Candidato contactado vía telefónica. Disponible para iniciar proceso."
5. Hacer clic en "Confirmar"

**Resultado Esperado:**
- ✅ Mensaje de éxito: "Solicitud marcada como contactada"
- ✅ Estado de la solicitud cambia a "Pendiente Documentos"
- ✅ Badge de estado se actualiza visualmente
- ✅ Se crean 2 logs en `hum_solicitudes_logs`:
  - Log de cambio de estado (CAMBIAR_ESTADO)
  - Log específico de contacto (CONTACTAR)

**Validación en Base de Datos:**
```sql
-- Ver los logs creados
SELECT 
  id,
  solicitud_id,
  accion,
  estado_anterior,
  estado_nuevo,
  observacion,
  fecha_accion,
  usuario_id
FROM hum_solicitudes_logs
WHERE solicitud_id = [ID_SOLICITUD]
ORDER BY fecha_accion DESC
LIMIT 2;
```

**Datos Esperados:**
| accion | estado_anterior | estado_nuevo | observacion |
|--------|-----------------|--------------|-------------|
| CONTACTAR | aprobada | pendiente documentos | Candidato contactado vía telefónica... |
| CAMBIAR_ESTADO | aprobada | pendiente documentos | Candidato contactado vía telefónica... |

---

### ✅ Caso 2: Contacto sin Observación

**Pasos:**
1. Navegar a "Gestión de Solicitudes"
2. Identificar una solicitud
3. Hacer clic en "Contactado"
4. Dejar el campo de observación vacío
5. Hacer clic en "Confirmar"

**Resultado Esperado:**
- ✅ Mensaje de éxito mostrado
- ✅ Estado actualizado
- ✅ Observación por defecto: "Solicitud contactada"

---

### ✅ Caso 3: Verificar Estado Anterior Correcto

**Pasos:**
1. Crear una solicitud en estado "Creada"
2. Contactar la solicitud
3. Verificar logs

**Resultado Esperado:**
- ✅ `estado_anterior` = "creada"
- ✅ `estado_nuevo` = "pendiente documentos"

---

### ✅ Caso 4: Verificar Usuario en Log

**Pasos:**
1. Iniciar sesión con un usuario específico
2. Contactar una solicitud
3. Verificar que el log tenga el `usuario_id` correcto

**Validación:**
```sql
SELECT 
  l.*,
  u.username,
  u.primer_nombre,
  u.primer_apellido
FROM hum_solicitudes_logs l
INNER JOIN gen_usuarios u ON l.usuario_id = u.id
WHERE l.solicitud_id = [ID_SOLICITUD]
  AND l.accion = 'CONTACTAR';
```

---

### ✅ Caso 5: Visualización en Timeline

**Pasos:**
1. Contactar una solicitud
2. Hacer clic en el icono de "Ver" (👁️) en el listado
3. Revisar la sección de Timeline/Historial

**Resultado Esperado:**
- ✅ Aparece un item en el timeline con:
  - Icono de teléfono
  - Texto: "Marcado como contactado"
  - Usuario que realizó la acción
  - Fecha y hora
  - Observación ingresada

---

### ✅ Caso 6: Múltiples Contactos

**Pasos:**
1. Contactar una solicitud (observación: "Primer contacto")
2. Cambiar estado manualmente a "Aprobada"
3. Contactar nuevamente (observación: "Segundo contacto")
4. Verificar logs

**Resultado Esperado:**
- ✅ Existen múltiples logs de tipo CONTACTAR
- ✅ Cada uno con su respectiva observación
- ✅ Estados anteriores diferentes

---

### ❌ Caso 7: Error de Conexión

**Pasos:**
1. Desconectar red (simular error)
2. Intentar contactar solicitud

**Resultado Esperado:**
- ❌ Mensaje de error: "Error al contactar la solicitud"
- ❌ Estado no se actualiza
- ❌ No se crea log

---

### ✅ Caso 8: Verificar Logs en Consola

**Pasos:**
1. Abrir DevTools → Console
2. Contactar una solicitud
3. Observar logs en consola

**Logs Esperados:**
```
📞 Iniciando proceso de contacto para solicitud: 456
📞 Estado anterior de la solicitud: aprobada
🔍 updateStatus llamado con: 456 pendiente documentos Candidato contactado...
📞 Estado actualizado exitosamente, creando log específico de contacto...
✅ Log de contacto creado exitosamente
```

---

## Checklist de Validación

### Funcionalidad
- [ ] Botón "Contactado" visible en listado
- [ ] Modal se abre correctamente
- [ ] Campo de observación funcional
- [ ] Estado se actualiza en base de datos
- [ ] UI se actualiza sin necesidad de recargar página

### Logs en Base de Datos
- [ ] Se crea log de CAMBIAR_ESTADO
- [ ] Se crea log de CONTACTAR
- [ ] `estado_anterior` capturado correctamente
- [ ] `estado_nuevo` = "pendiente documentos"
- [ ] `usuario_id` corresponde al usuario actual
- [ ] `observacion` guardada correctamente
- [ ] `fecha_accion` tiene timestamp correcto

### Manejo de Errores
- [ ] Error en red se maneja correctamente
- [ ] Error al guardar log no revierte operación principal
- [ ] Mensajes de error son claros

### Performance
- [ ] Operación tarda menos de 2 segundos
- [ ] Loading spinner se muestra durante la operación
- [ ] No hay múltiples llamadas duplicadas

---

## Consultas SQL Útiles para Validación

### Ver todos los logs de contacto de hoy
```sql
SELECT 
  l.*,
  u.username,
  s.estado
FROM hum_solicitudes_logs l
LEFT JOIN gen_usuarios u ON l.usuario_id = u.id
LEFT JOIN hum_solicitudes s ON l.solicitud_id = s.id
WHERE l.accion = 'CONTACTAR'
  AND DATE(l.fecha_accion) = CURRENT_DATE
ORDER BY l.fecha_accion DESC;
```

### Contar logs de una solicitud específica
```sql
SELECT 
  accion,
  COUNT(*) as cantidad
FROM hum_solicitudes_logs
WHERE solicitud_id = [ID_SOLICITUD]
GROUP BY accion;
```

### Ver timeline completo de una solicitud
```sql
SELECT 
  l.accion,
  l.estado_anterior,
  l.estado_nuevo,
  l.observacion,
  l.fecha_accion,
  u.primer_nombre || ' ' || u.primer_apellido as usuario
FROM hum_solicitudes_logs l
LEFT JOIN gen_usuarios u ON l.usuario_id = u.id
WHERE l.solicitud_id = [ID_SOLICITUD]
ORDER BY l.fecha_accion ASC;
```

---

## Reporte de Bugs

Si encuentras algún problema, documenta:

1. **Descripción del bug**
2. **Pasos para reproducir**
3. **Comportamiento esperado**
4. **Comportamiento actual**
5. **Screenshots** (si aplica)
6. **Logs de consola**
7. **Datos en base de datos**

---

## Resultados Esperados Finales

✅ **100% de casos exitosos** → Funcionalidad lista para producción
⚠️ **1-2 casos fallidos** → Requiere ajustes menores
❌ **3+ casos fallidos** → Requiere revisión completa

---

## Notas Adicionales

- Los logs son inmutables, no se pueden editar después de creados
- Cada acción de contacto genera 2 logs (esto es intencional)
- El estado anterior siempre se captura antes de la actualización
- Si no hay usuario válido, se intenta obtener uno por defecto del sistema


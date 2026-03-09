# Estado de Requerimientos — RH Plus

> Actualizado: 2026-03-09
> Rama activa: `emmanuel`

---

## Resumen ejecutivo

| Módulo | Estado | Completitud |
|--------|--------|-------------|
| Autenticación & Seguridad | ✅ Completo | ~95% |
| Dashboard | ✅ Completo | ~90% |
| Novedades | ✅ Funcional | ~80% |
| Comité de Aprobación | ✅ Funcional | ~85% |
| Selección | ⚠️ Parcial | ~65% |
| Entrevistas | ✅ Funcional | ~80% |
| Registros (Empresas, Candidatos) | ✅ Completo | ~90% |
| Maestro (datos base) | ✅ Completo | ~90% |
| Clínica / Salud Ocupacional | ⚠️ Parcial | ~50% |
| Certificados / Órdenes | ⚠️ Parcial | ~50% |
| Portal Empresa (self-service) | ✅ Funcional | ~75% |
| Portal Candidato (self-service) | ✅ Funcional | ~80% |

---

## Req 1 — Autenticación & Seguridad

### ✅ Ya implementado
- Login unificado (`/login`) con validación de usuario y contraseña hasheada (bcrypt)
- Recuperación de contraseña con código de verificación por email
- Selección de empresa post-login (usuarios multi-empresa)
- Redirección a cambio de contraseña si la clave es igual a la identificación
- Gestión de usuarios: crear, editar, desactivar, asignar roles y empresas
- Roles y perfiles: Admin, Coordinador, Analista, Usuario
- Permisos por módulo y acción (`gen_modulos`, `gen_roles_modulos`)
- Permisos de navegación por perfil (`permisos_vista_perfil`, `vistas_sistema`)
- Logs de sistema (`gen_usuarios_logs`)
- Hashing de contraseñas al crear/editar usuarios (RPC `update_user_password_by_id`)
- Usuario de prueba `testuser` / `test@example.com` con password `test123` o `testuser`

### ❌ Pendiente
- Autenticación de dos factores (2FA) real
- Expiración de sesión configurable
- Bloqueo de cuenta por intentos fallidos

---

## Req 2 — Dashboard principal

### ✅ Ya implementado
- 4 métricas clave: Total solicitudes, En proceso, Contratados, Descartados
- Indicador de tiempo promedio hasta contratación
- Gráfica de barras: solicitudes por mes (últimos 6 meses)
- Distribución de solicitudes por estado (badges)
- Filtros: rango de fechas, empresa, analista
- Clic en tarjeta → modal con listado de solicitudes del estado correspondiente
- Auto-filtrado si el usuario es analista o tiene empresa asignada

### ❌ Pendiente
- Métricas de selección (vacantes abiertas, candidatos en proceso, días promedio por etapa)
- Alertas de solicitudes fuera de tiempo de política (>15 días empresa, >35 días senior)

---

## Req 3 — Módulo Novedades

### ✅ Ya implementado
- Tablero de novedades (`/novedades`) con vistas por motivo
- Motivos soportados: Incapacidad, Retiro, Renuncia, Vacaciones, Cambio de Centro de Costo, Postulación Interna, Licencia, Aumento de Plaza
- Formularios dinámicos por motivo con campos específicos
- Cambio de estados con historial (logs)
- Asignación manual de analistas
- Vista Novedades: solicitudes de retiro (pendiente comité), cambios de centro de costo, postulaciones internas
- Filtros por estado, motivo, empresa, fecha

### ⚠️ Parcialmente implementado
- Carga masiva de solicitudes por Excel (estructura visible en SeleccionPage, falta validación robusta)
- Asignación automática de novedades (`analistaAsignacionService` existe, integración incompleta)

### ❌ Pendiente
- Regla de aprobación los viernes (Renuncias, Retiros, Aumento de Plaza)
- Notificación automática al coordinador cuando una novedad supera el límite de días

---

## Req 4 — Módulo Novedades Selección _(plan.md Req 4)_

### ✅ Ya implementado
- Página separada Selección (`/seleccion`) para analistas de selección
- Vista Selección filtra: vacaciones, renuncias, retiros (aprobados en comité), licencias, aumento de plaza
- Etapas del proceso: **En Reclutamiento → Entrevista Cliente Interno → En Contratación → Contratado**
- Estados finales: Congelada, En Espera, En Proceso, Contratado (Externo/Interno)
- Categorías: Ordinario, Aumento de Plaza, Equipos Extramurales, Otros
- Cálculo de días hábiles desde la creación
- Política de tiempo visible por solicitud:
  - Empresa: 1-15 días (Satisfactorio) · 16-30 (Regular) · 31+ (Insatisfactorio)
  - Senior: 1-35 días (Satisfactorio) · 36-60 (Regular) · 61+ (Insatisfactorio)
- EtapaStepper visual por solicitud
- Cambio de estado con diálogo y motivo
- Descarga de Excel con solicitudes filtradas
- Subida masiva de solicitudes por Excel
- Comité de Aprobación (`/comite_aprob`): aprobación/rechazo con observaciones y email al analista
- Menú lateral actualizado con Novedades, Selección, Comité, Entrevistas

### ⚠️ Parcialmente implementado
- Asociación de candidatos a vacante (UI presente, integración con BD real pendiente)
- Adjuntar documentos al proceso (hojas de vida, pruebas, antecedentes) — servicio existe (`candidatosDocumentosService`), UI no integrada en SeleccionPage
- Solicitud de entrevista con selección de fecha por el líder — framework en EntrevistasPage, email al líder no implementado
- Botón "Solicitud de Ingreso" cuando candidato está seleccionado — UI parcial, flujo hacia analista junior no completo

### ❌ Pendiente
- Restricción/asignación de analistas parametrizable por nivel: Cliente, Sucursal, Proyecto
- Carga Excel para "Nuevo Proyecto" con campos específicos (Cargo, Cantidad, Sucursal, Salario, Horas, Jornada, Aux no Prestacional)
- Homologación de categoría por cargo
- Campo "Otros" editable en categorías
- Política específica de **8 días hábiles para Retiros**
- Correo automático al líder cuando vacante entra en estado "Entrevista Cliente Interno"
- Integración con módulo de Programación de Entrevistas (líder selecciona fecha)

---

## Req 5 — Registros

### ✅ Ya implementado
- Empresas: CRUD completo, actividades económicas, ciudades
- Candidatos: CRUD completo, historial, documentos, perfil
- Aspirantes: listado y gestión
- Prestadores (proveedores de salud): CRUD

### ❌ Pendiente
- Importación masiva de candidatos por Excel
- Validación de duplicados por número de documento

---

## Req 6 — Maestro (datos base)

### ✅ Ya implementado
- Tipos de candidatos / cargos
- Tipos de documentos
- Actividades económicas
- Áreas de negocios
- Centros de costo
- Ubicaciones / sucursales
- Motivos de novedad
- Proyectos
- Plantillas de mensajes y documentos
- Email masivo

### ❌ Pendiente
- Configuración de jornadas laborales
- Configuración de días no hábiles por empresa

---

## Req 7 — Clínica / Salud Ocupacional

### ✅ Ya implementado
- Agenda médica
- Citas programadas
- Consultorios y especialistas
- Especialidades médicas
- Historia médica y laboral

### ❌ Pendiente
- Integración de resultados médicos con el flujo de selección
- Cita automática al aprobarse en comité
- Visualizador de certificados médicos integrado en el proceso

---

## Req 8 — Órdenes de Ingreso / Certificados

### ✅ Ya implementado
- Expedición de órdenes
- Certificados médicos
- Expedición de certificados
- Plantillas de órdenes editables

### ❌ Pendiente
- Generación automática de orden de ingreso desde SeleccionPage cuando candidato = Seleccionado
- Envío automático de orden al analista junior

---

## Req 9 — Portal Empresa

### ✅ Ya implementado
- Login y recuperación de contraseña por empresa
- Dashboard de empresa con candidatos
- Vista mejorada de candidatos
- Generación y distribución de QR (email, WhatsApp)
- Creación simplificada de candidatos

### ❌ Pendiente
- Selección de fecha de entrevista por parte del líder desde el portal
- Notificaciones push de nuevas solicitudes

---

## Req 10 — Portal Candidato

### ✅ Ya implementado
- Registro y login de candidatos
- Perfil editable
- Cambio de contraseña
- Recuperación de contraseña

### ❌ Pendiente
- Adjuntar documentos desde el portal candidato
- Ver estado de sus postulaciones

---

## Deuda técnica conocida

| Archivo | Problema |
|---------|---------|
| `DatosPersonalesForm.tsx` | Type mismatch en evento sintético |
| `EducacionTab.tsx` | `toast` no importado |
| `ExperienciaLaboralTab.tsx` | `toast` no importado |
| `TipoCandidatoSelector.tsx` | Props de hook no existen |
| `OrdenForm.tsx` | Importación de `@shared/schema` rota |
| `OrdenPDF.tsx` | Campos `empresa` y `aspirante` no existen en tipo `Orden` |
| `CompanyBusinessInfo.tsx` | Variable `actividadesEconomicas` declarada dos veces |
| `PermisoForm.tsx` | Tipo de formulario incorrecto |

> Estos errores son pre-existentes y no bloquean las funcionalidades principales (login, novedades, selección, dashboard).

---

## Próximos pasos recomendados

1. **Alta prioridad:**
   - Integrar documentos en SeleccionPage (adjuntar CV, pruebas, antecedentes)
   - Email al líder cuando vacante entra en "Entrevista Cliente Interno"
   - Botón "Solicitud de Ingreso" funcional desde SeleccionPage

2. **Media prioridad:**
   - Asignación paramétrica de analistas por Cliente/Sucursal/Proyecto
   - Política de 8 días hábiles para retiros
   - Carga Excel "Nuevo Proyecto"

3. **Baja prioridad / backlog:**
   - Homologación de categoría por cargo
   - Regla de aprobación los viernes
   - Deuda técnica de componentes con errores TS

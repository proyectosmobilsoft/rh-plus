# Estado de Requerimientos — RH Plus

> Actualizado: 2026-03-09
> Rama activa: `emmanuel`

---

## Resumen ejecutivo

| Módulo | Estado | Completitud |
|--------|--------|-------------|
| **Req 0** — Módulo Seguridad & Maestros | ⚠️ Parcial | ~55% |
| **Req 1** — Plataforma Cliente (Perfil Líder) | ⚠️ Parcial | ~45% |
| Autenticación & Seguridad (base) | ✅ Completo | ~95% |
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

## Req 0 — Módulo Seguridad & Maestros

> Requerimientos de configuración del sistema, maestros de datos y gestión de perfiles/roles.

### ✅ Maestro de Motivos de Novedad (`/maestro/motivos`)
- CRUD completo: crear, editar, activar/desactivar motivos
- **Parametrizable por empresa**: filtro por `empresa_id`, hereda motivos globales (`empresa_id IS NULL`)
- **Check adjunto obligatorio**: columna `requiere_adjunto` + `adjunto_obligatorio` (obligatorio solo si requiere adjunto)
- **Check campo observación**: columna `requiere_observacion` — muestra campo en formulario de novedad si activo
- **Check comité**: columna `requiere_comite` — redirige novedad al flujo de comité de aprobación
- Indicadores visuales en tabla (✅/Opc./✗ por cada check)
- Eliminación/inactivación de motivos

### ✅ Maestro Centro de Costos (`/maestro/centros-costo`)
- CRUD completo: crear, editar, activar/desactivar centros de costo
- Filtros por estado y sucursal
- Integrado con módulo de Sucursales (`sucursalesService`)
- Permisos por acción (`Can` wrapper)

### ✅ Maestro de Aprobadores de Comité (`/seguridad/usuarios`)
- Los aprobadores se gestionan desde el módulo de Usuarios asignándoles el rol **Aprobador Comité** (id=23)
- CRUD completo de usuarios con asignación de roles y empresas
- En el flujo de NovedadesPage el aprobador se identifica por su cédula (consulta a `gen_usuarios`)

### ✅ Perfiles / Roles (`/seguridad/perfiles`)
- CRUD de perfiles/roles en `gen_roles`
- Asignación de módulos y acciones por perfil (`gen_roles_modulos`)
- Permisos granulares por vista y acción (`PermissionsForm`, `AdvancedProfileManager`)
- **Perfil Líder** (id=22): creado en BD, asignable desde PerfilesPage
- **Perfil Aprobador Comité** (id=23): creado en BD, asignable desde PerfilesPage
- **Perfil Analista Selección** (id=20): creado en BD, asignable desde PerfilesPage
- **Perfil Aprobador Exámenes Médicos** (id=24): creado en BD, asignable desde PerfilesPage

### ⚠️ Parcialmente implementado

#### Restricciones del Perfil Líder
- El rol Líder (id=22) existe y se puede asignar a usuarios
- **Pendiente**: configurar restricciones específicas del líder (acceso solo a su empresa/sucursal, solo puede aprobar/rechazar entrevistas, sin acceso a módulos de selección o novedades)

#### Modificación Perfil Analista Selección
- El rol Analista Selección (id=20) existe en BD
- **Pendiente**: validar y documentar qué acciones/vistas específicas debe tener este perfil diferenciado del analista regular

#### Perfil Aprobador (Comité y Exámenes Médicos)
- Roles (id=23 y id=24) creados en BD
- **Pendiente**: definir y configurar acciones específicas para cada aprobador (aprobador comité solo ve módulo comité; aprobador exámenes solo ve módulo clínica)

### ❌ Pendiente

#### Maestro Homologación de Cargos
- No existe página ni servicio en el frontend
- No existe tabla en BD para homologación de cargos (mapeo cargo cliente → cargo estándar)
- **Por implementar**: CRUD de homologaciones, integración con módulo de Selección para asignar categoría automáticamente

#### Sincronización automática Kactus Vista
- **PENDIENTE — En espera del cliente**
- Kactus es el sistema de nómina/HRIS del cliente; aún no han entregado las credenciales ni especificaciones de la API/Vista
- Cuando esté disponible: sincronización de empleados activos, centros de costo, cargos y novedades desde Kactus hacia RH+
- _Nota: estar atento a la entrega de acceso a Kactus por parte del cliente_

---

## Módulo Base — Autenticación & Seguridad

> _Este módulo no tiene número de req en el documento del cliente; es infraestructura base._

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

### ✅ Extras implementados
- Expiración de sesión configurable (1h / 4h / 8h / 24h / 48h) — Configuraciones → Seguridad

---

## Req 1 — Plataforma para Cliente (Perfil Líder)

> Fuente: documento de requerimientos del cliente "REQ 1"

### 1.1 Creación del Perfil Líder

| Item | Estado | Notas |
|------|--------|-------|
| Perfil "Líder" en BD (`gen_roles` id=22) | ✅ | Asignable desde `/seguridad/perfiles` |
| Asignación a usuarios por empresa | ✅ | Desde `/seguridad/usuarios` |
| **Restricciones de vistas específicas del líder** | ❌ | El rol existe pero no hay portal/vista dedicada al líder; usa las mismas vistas que otros perfiles |
| Multiempresa | ✅ | Toda la app filtra por `empresaData` en localStorage |

### 1.2 Restricciones y Maestros del Perfil Líder

| Item | Estado | Notas |
|------|--------|-------|
| Visualización planta activa a su cargo | ❌ | Depende de Kactus — **en espera del cliente** |
| Maestro de motivos parametrizables por empresa | ✅ | `MotivosPage.tsx`, filtro por `empresa_id` |
| Check adjunto obligatorio en motivos | ✅ | `requiere_adjunto` + `adjunto_obligatorio` |
| Inactivar / eliminar motivos | ✅ | Desde MotivosPage |
| Check campo observación en motivos | ✅ | `requiere_observacion`, habilita textarea en novedad |
| Check comité + cédula aprobador + email disparador | ✅ | `requiere_comite`, busca aprobador en `gen_usuarios`, envía email |
| Módulo solicitudes realizadas (Módulo 2) | ⚠️ | Existe listado en NovedadesPage pero faltan campos: Nro. solicitud, ID colaborador, timeline visual |
| Módulo de entrevistas (Módulo 3) | ⚠️ | `EntrevistasPage.tsx` existe; faltan: adjuntos candidato, calificación Si/No/Posible, observaciones |
| Estados de solicitudes | ✅ | Solicitada, Aprobado Comité, En Proceso, En Reclutamiento, Entrevista Cliente Interno, Seleccionado, Rechazada, Congelada, Ejecutada |
| Añadir / congelar / eliminar solicitudes | ⚠️ | Añadir ✅; Congelar ✅ (SeleccionPage); Eliminar ❌ no implementado |
| Aprobar / rechazar candidatos | ⚠️ | Flujo parcial en ComiteAprobacionPage; desde vista líder ❌ |
| Visualizar documentos candidatos en entrevista | ❌ | `candidatosDocumentosService` existe, UI no integrada en EntrevistasPage |
| Sucursales asociadas | ✅ | `UbicacionesPage`, filtros por sucursal en novedades |
| Maestro centros de costo | ✅ | `CentrosCostoPage.tsx` |
| **Maestro homologación de cargos** | ❌ | No existe UI ni tabla en BD |
| Maestro aprobadores de comité | ✅ | Vía módulo de usuarios (rol Aprobador Comité id=23) |

### 1.3 Módulo 1 — Novedades: formularios por motivo

| Motivo | Estado | Campos faltantes |
|--------|--------|-----------------|
| **Incapacidades** | ✅ | fecha_inicio, fecha_fin, motivo_incapacidad — completo |
| **Retiros** | ⚠️ | ✅ fecha_retiro, fecha_solicitud, motivo_retiro, requiere_reemplazo, salario, horas, jornada, centro_costo, auxilio. ❌ `nivel_riesgo`, `ingreso y duración del contrato`, `adjunto soporte`, flujo doble (orden selección + orden retiro) cuando comité aprueba |
| **Aumento de Plaza** | ⚠️ | Estructura Excel existe en SeleccionPage. ❌ Campos específicos del req: cargo, salario, aux no prestacional, horas, jornada, centro de costo, área, negocio, ciudad, fecha ingreso, proyecto |
| **Cambio de Centro de Costo** | ⚠️ | ✅ sucursal_anterior, sucursal_nueva, fecha_inicio_cambio. ❌ Lupa/selector de centro de costo (actualmente texto libre) |
| **Vacaciones** | ✅ | fecha_inicio, fecha_fin, restricción 30 días, selección múltiple de empleados — completo |
| **Licencias** | ⚠️ | ✅ fecha_inicio, fecha_fin, tipo_licencia. ❌ `tiempo_licencia`, `observaciones` |
| **Renuncias** | ⚠️ | ✅ fecha_finalizacion, motivo_renuncia, requiere_reemplazo. ❌ `fecha_renuncia` separada, adjunto soporte, restricción solo cargos asistenciales, flujo orden de selección cuando aprueba comité |
| **Postulaciones Internas** | ⚠️ | ✅ cargo_postulacion, motivo_postulacion, salario_esperado, genera_reemplazo. ❌ adjunto opcional |

### 1.4 Módulo 2 — Solicitudes Registradas

| Item | Estado |
|------|--------|
| Listado de solicitudes con estado | ✅ |
| Filtros por motivo, sucursal, empresa | ✅ |
| Campos: Nro. solicitud, tipo, ID colaborador, nombre, fecha, centro de costo, empresa, estado | ⚠️ Parcial |
| Timeline de gestión de la solicitud | ❌ |
| Exportable en Excel | ✅ |

### 1.5 Módulo 3 — Programación de Entrevistas

| Item | Estado |
|------|--------|
| Listado de candidatos por vacante | ⚠️ Parcial |
| Visualización de adjuntos del candidato (HV, pruebas) | ❌ |
| Selector de fecha/lugar en calendario | ❌ |
| Calificación: Sí / No / Posible → cambia estado candidato | ❌ |
| Campo de observaciones | ❌ |

### 1.6 Kactus — Pendiente del cliente

| Item | Estado |
|------|--------|
| Visualización planta activa (tabla `nm_contr`) | ❌ **Pendiente acceso Kactus** |
| Sincronización automática de empleados | ❌ **Pendiente acceso Kactus** |

> ⚠️ El cliente aún no ha entregado credenciales ni especificaciones de acceso a Kactus. Cuando lo hagan, conectar vista `nm_contr` para planta activa y sincronización de empleados.

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

### ✅ Implementado recientemente
- Regla de aprobación los viernes: Retiros, Renuncias y Aumento de Plaza solo se pueden registrar los viernes (validación en `handleSubmitForm`)
- Notificación automática al coordinador: al cargar NovedadesPage, detecta solicitudes con +15 días sin gestión en estados no finales y envía email a todos los usuarios con `role = 'coordinador'`

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

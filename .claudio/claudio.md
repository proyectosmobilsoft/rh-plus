# Contexto del Proyecto — RH Plus
> Rama activa: `emmanuel` | Supabase: https://supabase.179.33.214.86.sslip.io/mcp
> Última actualización: 2026-03-25

---

## Stack Tecnológico
- **Frontend**: React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + RLS + Edge Functions)
- **State management**: React Query
- **Excel**: `exceljs` (reemplazó a `xlsx` por vulnerabilidad crítica)
- **Routing**: React Router — sidebar dinámico en `DynamicSidebar.tsx`

---

## Sistema de Permisos — DOS CAPAS

### Capa 1 — Navegación (sidebar)
Controla si una ruta aparece en el menú lateral.
- **Tablas**: `vistas_sistema` → `permisos_vista_perfil`
- Si `permisos_vista_perfil` no tiene el par `(perfil_id, vista_id)`, la ruta NO aparece.

### Capa 2 — Acciones (botones/features)
Controla qué puede hacer el usuario dentro del módulo.
- **Tablas**: `gen_modulos` → `gen_modulo_permisos` → `gen_roles_modulos`
- El campo clave es `gen_modulo_permisos.code` — debe coincidir EXACTAMENTE (guiones vs underscores) con `pathToActions` en `DynamicSidebar.tsx`.
- En login, `AuthContext` carga `gen_roles_modulos.selected_actions_codes` → `userData.acciones`

### Flujo completo
```
Login → AuthContext → userData.acciones = ["vista_usuarios", "accion-crear-usuario", ...]
Sidebar → Capa 1: vistasService.getVistasPorPerfil(perfilIds) → rutas dinámicas
        → Capa 2: pathToActions[ruta].some(code => userData.acciones.has(code)) → rutas estáticas
```

### Tablas de permisos relevantes
| Tabla | Rol |
|-------|-----|
| `gen_modulos` | Catálogo de módulos del sistema |
| `gen_modulo_permisos` | Acciones disponibles por módulo (con `code` único) |
| `gen_roles_modulos` | Pivote: qué códigos tiene asignados cada rol |
| `vistas_sistema` | Rutas del sidebar dinámico |
| `permisos_vista_perfil` | Qué perfiles ven qué rutas |
| `gen_roles` | Roles del sistema |
| `gen_usuario_roles` | Qué roles tiene cada usuario |
| `perfiles` | Perfiles de usuario |

### Ejemplo funcional: Módulo Usuarios (id=4)
- `gen_modulos`: id=4, nombre='Modulo Usuarios'
- `gen_modulo_permisos`: codes = `vista_usuarios`, `accion-crear-usuario`, `accion-editar-usuario`, etc.
- `gen_roles_modulos`: rol_id=1, modulo_id=4, selected_actions_codes=[...]
- `vistas_sistema`: id=2, ruta='/seguridad/usuarios'
- `permisos_vista_perfil`: perfil_id=1, vista_id=2, activo=true
- `DynamicSidebar.pathToActions`: `'/seguridad/usuarios': ['vista_usuarios']`

### Checklist para registrar módulo nuevo
```
[ ] 1. INSERT gen_modulos
[ ] 2. INSERT gen_modulo_permisos (mínimo: code='vista-[modulo]')
[ ] 3. INSERT gen_modulo_permisos acciones (accion-crear, accion-editar, etc.)
[ ] 4. INSERT vistas_sistema (ruta exacta, icono Lucide)
[ ] 5. INSERT permisos_vista_perfil (perfil_id + vista_id)
[ ] 6. INSERT/UPDATE gen_roles_modulos con los codes
[ ] 7. DynamicSidebar.pathToActions → agregar ruta
[ ] 8. Si no está en menuItems del sidebar → agregarlo
```

### SQL de diagnóstico rápido
```sql
-- Vistas sin permisos asignados
SELECT vs.id, vs.nombre, vs.ruta
FROM vistas_sistema vs
LEFT JOIN permisos_vista_perfil pvp ON pvp.vista_id = vs.id
WHERE pvp.id IS NULL;

-- Codes de un rol
SELECT rm.rol_id, m.nombre, rm.selected_actions_codes
FROM gen_roles_modulos rm
JOIN gen_modulos m ON m.id = rm.modulo_id
WHERE rm.rol_id = 1;
```

---

## Estado Actual del Proyecto (rama `emmanuel`)

- **Blocker activo**: `NovedadesPage.tsx` tiene 5 conflictos de merge sin resolver → no compila
- **Pendiente**: Resolver conflictos tomando la versión `revision` en todos los bloques (ver `estado.md`)
- `npm audit` → 0 vulnerabilidades (xlsx reemplazado por exceljs)

---

## Módulo Novedades — Req 4 (en desarrollo)

### Dos vistas para Analista de Selección
- **Vista Novedades**: retiros pendientes de comité, cambio centro de costo, postulaciones internas
- **Vista Selección**: vacaciones, renuncia, retiro (post-aprobación comité), licencias

### Acciones del analista
- Consultar solicitudes de clientes asignados
- Cambiar estados del proceso
- Asociar candidatos a vacante
- Adjuntar documentos (HV, pruebas, antecedentes)
- Solicitar entrevistas con cliente
- Cuando candidato = "seleccionado" → botón "Realizar solicitud de ingreso"

### Estados del proceso de selección
- En reclutamiento → Entrevista cliente interno → En contratación
- Estado final: Congelado / En espera / En proceso / Contratado (Externo/Interno)
- Categoría: Ordinario, Aumento de plaza, Equipos Extramurales, Otros

### Política de tiempos
- Por empresa: 1-15 días hábiles (Satisfactorio), 16-30 (Regular), +31 (Insatisfactorio)
- Cargos senior: 1-35 (Satisfactorio), 36-60 (Regular), +61 (Insatisfactorio)
- Retiros: 8 días hábiles

### Asignación de analistas
- Parametrizable por nivel: cliente / sucursal / proyecto
- Cada analista ve solo sus solicitudes
- Coordinador tiene permisos totales

---

## Tablas de la BD (76 total en schema `public`)
Ver lista completa en la conversación. Módulos clave:
- **Permisos**: `gen_modulos`, `gen_modulo_permisos`, `gen_roles`, `gen_roles_modulos`, `gen_usuario_roles`, `vistas_sistema`, `permisos_vista_perfil`, `perfiles`
- **Novedades**: `novedades_empleados`, `novedades_motivos`, `novedades_solicitudes`, `novedades_logs`
- **Usuarios**: `gen_usuarios`, `gen_usuario_empresas`, `gen_usuarios_logs`
- **Candidatos**: `candidatos`, `tipos_candidatos`, `experiencia_laboral`, `educacion_candidato`
- **Emails**: `email_campaigns`, `gmail_campaigns`, `whatsapp_templates`

---

## Archivos clave del sistema de permisos
- `client/src/pages/seguridad/PermisosPage.tsx` — UI de gestión de permisos
- `client/src/services/modulosService.ts` — CRUD de módulos y permisos
- `client/src/hooks/useModulos.ts` — React Query hooks
- `client/src/components/modulos/ModuloForm.tsx` — Formulario módulos
- `client/src/components/modulos/PermisoForm.tsx` — Formulario permisos
- `DynamicSidebar.tsx` — `pathToActions` y `menuItems` (crítico para permisos)

# Sistema de Permisos — RH Plus

## Cómo funciona (resumen ejecutivo)

Hay **DOS capas** de control que deben estar completas para que un módulo se muestre Y funcione:

| Capa | Qué controla | Tablas involucradas |
|------|-------------|---------------------|
| **Capa 1 – Navegación** | Si la ruta aparece en el sidebar | `vistas_sistema` → `permisos_vista_perfil` |
| **Capa 2 – Acciones** | Si los botones/features del módulo están activos | `gen_modulos` → `gen_modulo_permisos` → `gen_roles_modulos` |

---

## Flujo completo de datos

```
Login
  └─► AuthContext carga gen_roles_modulos.selected_actions_codes
        └─► userData.acciones = [ "vista_usuarios", "accion-crear-usuario", ... ]

Sidebar monta
  ├─► Capa 1 (dinámica): vistasService.getVistasPorPerfil(perfilIds)
  │     └─► permisos_vista_perfil ──► vistas_sistema
  │           → Rutas dinámicas que no están en el menú estático
  │
  └─► Capa 2 (estática): pathToActions[ruta].some(code => userData.acciones.has(code))
        → Muestra/oculta los ítems del menú hardcodeado en DynamicSidebar
```

---

## Descripción de cada tabla

### `gen_modulos`
**Qué es:** Catálogo de módulos. Aparece en el select "Nombre de la Vista" en la pantalla de Permisos.

```
id | nombre              | descripcion | activo
4  | Modulo Usuarios     | ...         | true
30 | Modulo Novedades    | ...         | true
```

### `gen_modulo_permisos`
**Qué es:** Los permisos (acciones) disponibles dentro de cada módulo. El campo `code` es la cadena que se guarda en `gen_roles_modulos.selected_actions_codes` y se compara en el sidebar.

```
id | nombre                  | code                   | modulo_id
9  | Ver Usuarios            | vista_usuarios         | 4
75 | Boton de Crear Usuario  | accion-crear-usuario   | 4
76 | Boton de Editar Usuario | accion-editar-usuario  | 4
```

> ⚠️ **El `code` debe coincidir exactamente** con lo que está en `DynamicSidebar.pathToActions`. Si hay diferencia de guiones/underscores, el permiso no funciona.

### `gen_roles_modulos`
**Qué es:** Tabla pivote que dice "este rol tiene ESTOS códigos de acción para ESTE módulo". Se llena cuando un admin configura permisos desde la UI.

```
rol_id | modulo_id | selected_actions_codes
1      | 4         | ["vista_usuarios", "accion-crear-usuario", "accion-editar-usuario"]
```

### `vistas_sistema`
**Qué es:** Catálogo de rutas de navegación para el sidebar dinámico. Controla qué rutas puede ver un perfil.

```
id | nombre      | ruta                   | icono       | orden | activo
2  | Usuarios    | /seguridad/usuarios    | Users       | 2     | true
13 | Novedades   | /novedades             | null        | 0     | true
15 | Comite...   | /comite_aprob          | null        | 13    | true
```

### `permisos_vista_perfil`
**Qué es:** Dice "el perfil X puede ver la ruta Y". Si no hay registro aquí, la vista no aparece en el sidebar dinámico.

```
perfil_id | vista_id | activo
1         | 2        | true   ← perfil Admin ve /seguridad/usuarios
1         | 13       | true   ← perfil Admin ve /novedades (FALTA)
```

---

## Ejemplo de referencia: Modulo Usuarios ✅

Este módulo funciona perfecto. Aquí están TODOS sus registros:

### 1. gen_modulos
```sql
id=4, nombre='Modulo Usuarios', activo=true
```

### 2. gen_modulo_permisos
```sql
id=9,  code='vista_usuarios',          modulo_id=4  -- permiso de vista
id=75, code='accion-crear-usuario',    modulo_id=4
id=76, code='accion-editar-usuario',   modulo_id=4
id=77, code='accion-inactivar-usuario',modulo_id=4
id=78, code='accion-activar-usuario',  modulo_id=4
id=79, code='accion-eliminar-usuario', modulo_id=4
id=80, code='accion-actualizar-usuario',modulo_id=4
```

### 3. gen_roles_modulos (rol Admin)
```json
{
  "rol_id": 1,
  "modulo_id": 4,
  "selected_actions_codes": [
    "vista_usuarios",
    "accion-crear-usuario",
    "accion-editar-usuario",
    "accion-inactivar-usuario",
    "accion-eliminar-usuario"
  ]
}
```

### 4. vistas_sistema
```sql
id=2, nombre='Usuarios', ruta='/seguridad/usuarios', icono='Users', orden=2, activo=true
```

### 5. permisos_vista_perfil
```sql
perfil_id=1, vista_id=2, activo=true
```

### 6. DynamicSidebar — pathToActions (código frontend)
```ts
'/seguridad/usuarios': ['vista_usuarios'],
```

---

## ¿Qué le falta a los módulos nuevos?

### Módulos problemáticos detectados

| Vista (vistas_sistema) | Ruta | Tiene permisos_vista_perfil |
|------------------------|------|-----------------------------|
| Novedades (id=13) | `/novedades` | ❌ NO |
| Entrevistas de Novedades (id=14) | `/novedades/entrevista` | ❌ NO |
| Comite de aprobacion (id=15) | `/comite_aprob` | ❌ NO |

### Qué le falta a cada uno

#### Novedades & Entrevistas
El sidebar espera el code `vista-novedades` (con guión). Hay que verificar:
1. ¿Existe en `gen_modulo_permisos` un registro con `code='vista-novedades'`?
2. ¿Está ese code en `gen_roles_modulos.selected_actions_codes` del rol correspondiente?
3. ¿Existe en `permisos_vista_perfil` el par `perfil_id + vista_id` para vista_ids 13 y 14?

#### Comite de Aprobación
**Adicionalmente**: `/comite_aprob` **NO está en el menú estático** de `DynamicSidebar`. Solo puede aparecer por el sistema dinámico (vistas_sistema), por lo que NECESITA obligatoriamente el registro en `permisos_vista_perfil`.

---

## Checklist para registrar un módulo nuevo correctamente

```
[ ] 1. INSERT en gen_modulos
        → nombre, descripcion, activo=true

[ ] 2. INSERT en gen_modulo_permisos (mínimo 1, el de vista)
        → nombre='Ver [Módulo]'
        → code='vista-[modulo]'   ← usar el MISMO formato que en pathToActions
        → modulo_id = el id del paso 1
        → activo=true

[ ] 3. Agregar acciones (botones) en gen_modulo_permisos
        → code='accion-crear-[modulo]', 'accion-editar-[modulo]', etc.

[ ] 4. INSERT en vistas_sistema
        → nombre, ruta (exacta), icono (nombre de Lucide), orden, activo=true

[ ] 5. INSERT en permisos_vista_perfil
        → perfil_id = id del perfil que debe ver la vista
        → vista_id = id del paso 4
        → activo=true

[ ] 6. Asignar códigos al rol en gen_roles_modulos
        → Hacer esto desde la UI de Permisos, o directo por SQL:
        INSERT INTO gen_roles_modulos (rol_id, modulo_id, selected_actions_codes)
        VALUES (1, [modulo_id], '["vista-[modulo]", "accion-crear-[modulo]"]');

[ ] 7. En DynamicSidebar.tsx — pathToActions: agregar la ruta
        '[ruta]': ['vista-[modulo]'],

[ ] 8. Si el módulo NO está en el array menuItems del sidebar → agregarlo
```

---

## SQL de diagnóstico rápido

```sql
-- Ver qué vistas NO tienen permisos asignados a ningún perfil
SELECT vs.id, vs.nombre, vs.ruta
FROM vistas_sistema vs
LEFT JOIN permisos_vista_perfil pvp ON pvp.vista_id = vs.id
WHERE pvp.id IS NULL;

-- Ver todos los codes que tiene un rol asignados
SELECT rm.rol_id, m.nombre as modulo, rm.selected_actions_codes
FROM gen_roles_modulos rm
JOIN gen_modulos m ON m.id = rm.modulo_id
WHERE rm.rol_id = 1;  -- cambiar por el rol_id a revisar

-- Ver los codes definidos para un módulo específico
SELECT id, nombre, code FROM gen_modulo_permisos
WHERE modulo_id = 30  -- cambiar por el modulo_id
ORDER BY id;

-- Ver vistas que tiene asignadas un perfil
SELECT vs.nombre, vs.ruta
FROM permisos_vista_perfil pvp
JOIN vistas_sistema vs ON vs.id = pvp.vista_id
WHERE pvp.perfil_id = 1;  -- cambiar por perfil_id
```

---

## Resumen visual del problema actual

```
gen_modulo_permisos  ──► gen_roles_modulos ──► userData.acciones
      (code)                (selected_codes)      (en memoria)
                                                        │
                                                        ▼
                                              DynamicSidebar filtra
                                              ítems estáticos del menú
                                              (pathToActions)

vistas_sistema ──► permisos_vista_perfil ──► vistasService.getVistasPorPerfil()
                                                        │
                                                        ▼
                                              DynamicSidebar agrega
                                              ítems dinámicos al menú
```

**Para que un módulo funcione al 100%: ambas columnas deben estar completas.**

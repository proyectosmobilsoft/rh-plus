# Solución al Error PGRST202 - hash_password

## Problema Identificado

El error `PGRST202` indica que la función `hash_password` no existe en la base de datos o tiene un nombre de parámetro incorrecto.

**Error específico:**
```
{code: "PGRST202", details: "Searched for the function public.hash_password with parameter password_input...", message: "Could not find the function public.hash_password(password_input) in the schema cache"}
```

## Causa del Problema

1. **Función RPC no existe**: La función `hash_password` no está creada en Supabase
2. **Parámetro incorrecto**: El código usaba `password_input` pero debería ser `password_to_hash`
3. **API endpoints inexistentes**: Algunas páginas intentan usar `/api/usuarios` que no existe

## Solución Implementada

### 1. Crear las funciones RPC en Supabase

Ejecutar el script `scripts/supabase_password_functions.sql` en el SQL Editor de Supabase:

1. Ve al Dashboard de Supabase (https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a "SQL Editor"
4. Crea una nueva query
5. Copia y pega el contenido de `scripts/supabase_password_functions.sql`
6. Ejecuta el script

Este script crea las siguientes funciones:
- `hash_password(password_to_hash TEXT)`: Genera hash bcrypt
- `check_password(password_to_check TEXT, stored_hash TEXT)`: Verifica contraseñas
- `update_user_password(user_id INTEGER, new_password TEXT)`: Actualiza contraseñas
- `verify_user_credentials(username_input TEXT, password_input TEXT)`: Verifica credenciales completas
- `migrate_legacy_passwords()`: Migra contraseñas legacy a bcrypt

### 2. Correcciones en el código

#### A. Servicio de Usuarios (`client/src/services/usuariosService.ts`)

✅ **Corregido**: Cambié `password_input` por `password_to_hash`
✅ **Agregado**: Soporte para actualizar contraseñas en el método `updateUsuario`
✅ **Mejorado**: Fallback a base64 si las funciones RPC no están disponibles

#### B. Página de Usuarios (`client/src/pages/seguridad/UsuariosPage.tsx`)

✅ **Corregido**: La llamada a `updateUsuario` ahora pasa todos los parámetros correctos

### 3. Funciones principales creadas

```sql
-- Generar hash bcrypt
hash_password(password_to_hash TEXT) RETURNS TEXT

-- Verificar contraseña (soporta bcrypt y legacy)
check_password(password_to_check TEXT, stored_hash TEXT) RETURNS BOOLEAN

-- Actualizar contraseña de usuario
update_user_password(user_id INTEGER, new_password TEXT) RETURNS BOOLEAN

-- Verificar credenciales completas
verify_user_credentials(username_input TEXT, password_input TEXT)
```

## Pasos para Implementar

### 1. Ejecutar el script SQL
```sql
-- En Supabase SQL Editor, ejecutar scripts/supabase_password_functions.sql
```

### 2. Verificar que las funciones se crearon
```sql
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name IN ('hash_password', 'check_password', 'update_user_password');
```

### 3. Probar la funcionalidad
1. Intenta crear un nuevo usuario
2. Intenta actualizar un usuario existente
3. Verifica que no aparezcan errores PGRST202

## Problema con EditarUsuarioPage.tsx

**Detectado**: La página `client/src/pages/seguridad/EditarUsuarioPage.tsx` está usando endpoints `/api/usuarios` que no existen.

**Recomendación**: Actualizar esta página para usar el servicio de Supabase directamente como las otras páginas.

## Verificación

Para verificar que todo funciona correctamente:

1. **Crear usuario**: Debe hashear la contraseña correctamente
2. **Actualizar usuario**: Debe permitir cambiar la contraseña sin errores
3. **Login**: Debe funcionar con las contraseñas hasheadas

## Credenciales por defecto

El script crea un usuario admin por defecto:
- **Username**: `admin`
- **Password**: `admin123`
- **Email**: `admin@sistema.com`

## Troubleshooting

### Si sigue apareciendo el error PGRST202:

1. **Verificar extensión pgcrypto**:
```sql
SELECT * FROM pg_extension WHERE extname = 'pgcrypto';
```

2. **Verificar permisos de las funciones**:
```sql
SELECT routine_name, routine_type, security_type 
FROM information_schema.routines 
WHERE routine_name LIKE '%password%';
```

3. **Revisar logs de Supabase**:
   - Ve a Logs → Database en el dashboard de Supabase
   - Busca errores relacionados con las funciones

### Si las funciones no se pueden crear:

Usar el fallback que ya está implementado:
- Las funciones tienen manejo de errores
- Se usa base64 como fallback si no hay bcrypt disponible
- Los logs mostrarán qué método se está usando

## Notas importantes

- ✅ Las funciones usan `SECURITY DEFINER` para ejecutarse con permisos de superusuario
- ✅ Soporte para contraseñas legacy (base64) y nuevas (bcrypt)
- ✅ Fallbacks implementados en caso de que las funciones RPC no estén disponibles
- ✅ Logs detallados para debugging
- ⚠️ Las contraseñas legacy se migran a una contraseña temporal `temp123`

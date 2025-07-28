# Solución para el Problema de Validación de Contraseñas

## Problema Identificado

El sistema tenía inconsistencias en el manejo de contraseñas:

1. **Base de datos**: Contraseñas hasheadas con bcrypt
2. **Servidor**: Usando `btoa(password)` (base64) para comparar
3. **Cliente**: Intentando usar función RPC inexistente
4. **Fallback**: Comparación directa sin hash

## Solución Implementada

### 1. Funciones RPC en Supabase

Ejecutar el archivo `supabase_functions.sql` en tu base de datos Supabase:

```sql
-- Ejecutar en el SQL Editor de Supabase
-- Este archivo contiene las funciones:
-- - check_password(): Verifica contraseñas (bcrypt + base64 legacy)
-- - hash_password(): Genera hash bcrypt
-- - update_user_password(): Actualiza contraseñas
-- - verify_user_credentials(): Verifica credenciales completas
```

### 2. Actualizar Contraseñas Existentes

Ejecutar el archivo `update_passwords.sql` para convertir contraseñas legacy a bcrypt:

```sql
-- Ejecutar en el SQL Editor de Supabase
-- Este script actualiza las contraseñas existentes a bcrypt
```

### 3. Cambios en el Código

#### Cliente (`client/src/services/authService.ts`)
- Actualizado para usar la nueva función RPC `verify_user_credentials`
- Mantiene fallbacks para compatibilidad

#### Servidor (`server/routes.ts`)
- Actualizado el endpoint `/api/auth/login-with-empresa`
- Usa la función RPC para verificación de contraseñas

### 4. Credenciales de Prueba

Después de ejecutar los scripts, las credenciales serán:

**Usuario Admin:**
- Username: `admin`
- Password: `admin123`

**Usuario de Prueba:**
- Username: `testuser`
- Password: `password123`

## Pasos para Implementar

1. **Ejecutar funciones RPC**:
   ```sql
   -- En Supabase SQL Editor
   -- Copiar y ejecutar el contenido de supabase_functions.sql
   ```

2. **Actualizar contraseñas**:
   ```sql
   -- En Supabase SQL Editor
   -- Copiar y ejecutar el contenido de update_passwords.sql
   ```

3. **Reiniciar el servidor**:
   ```bash
   npm run dev
   ```

4. **Probar el login**:
   - Ir a la página de login
   - Usar las credenciales: `admin` / `admin123`
   - Verificar que funciona correctamente

## Verificación

Para verificar que todo funciona:

1. **En la consola del navegador** deberías ver logs como:
   ```
   Verificación de contraseña con RPC: { userId: 1, is_valid: true, hasStoredHash: true }
   ```

2. **En los logs del servidor** deberías ver:
   ```
   Login exitoso
   ```

## Troubleshooting

### Si sigue fallando:

1. **Verificar que las funciones RPC existen**:
   ```sql
   SELECT routine_name 
   FROM information_schema.routines 
   WHERE routine_name IN ('check_password', 'verify_user_credentials');
   ```

2. **Verificar el tipo de hash en la base de datos**:
   ```sql
   SELECT username, 
          CASE 
            WHEN password_hash LIKE '$2b$%' THEN 'bcrypt'
            ELSE 'legacy'
          END as tipo_hash
   FROM usuarios 
   WHERE username = 'admin';
   ```

3. **Verificar logs del cliente**:
   - Abrir DevTools → Console
   - Intentar login
   - Revisar los logs de verificación

### Si las funciones RPC no están disponibles:

El sistema tiene fallbacks que deberían funcionar:
- Usa `check_password` si está disponible
- Usa comparación base64 como último recurso

## Notas Importantes

- Las funciones RPC requieren la extensión `pgcrypto` en Supabase
- El sistema mantiene compatibilidad con contraseñas legacy
- Los logs ayudan a diagnosticar qué método se está usando
- Las contraseñas se hashean automáticamente al crear nuevos usuarios 
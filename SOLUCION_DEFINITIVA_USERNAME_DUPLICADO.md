# Solución Definitiva al Error 23505 - Username Duplicado

## 🔍 Problema Actual

Estás recibiendo el error:
```
{code: "23505", message: "duplicate key value violates unique constraint \"usuarios_username_key\""}
```

Al editar un usuario con estos datos:
```json
{
  "identificacion": "12345678",
  "primer_nombre": "Ana",
  "segundo_nombre": "María", 
  "primer_apellido": "García",
  "segundo_apellido": "López",
  "telefono": "3001234567",
  "email": "ana.garcia@empresa.com",
  "username": "ana.garcia",
  "password_hash": "$2a$06$koeJven2p86R.m2/oFwTxebA6h4ydrovcwd5WYatxBzX6oy87e5ou"
}
```

## 🛠️ Soluciones Implementadas

### 1. **Validación Doble en el Servicio**
✅ Agregué validación de username único en `usuariosService.ts`
✅ Agregué validación de email único en `usuariosService.ts`
✅ Excluye correctamente el usuario actual de la verificación

### 2. **Sistema de Debugging Avanzado**
✅ Creé `debugService.ts` para diagnóstico completo
✅ Agregué logging detallado en `EditarUsuarioPage.tsx`
✅ Verificación previa antes de cada actualización

### 3. **Scripts de Diagnóstico**
✅ `scripts/diagnose_username_issue.sql` para investigar la BD
✅ Consultas para encontrar duplicados y conflictos

## 📋 Pasos para Resolver el Problema

### Paso 1: Ejecutar Diagnóstico en la Base de Datos

Ejecuta este script en Supabase SQL Editor:

```sql
-- 1. Buscar usuarios con username 'ana.garcia'
SELECT 
    id,
    username,
    email,
    primer_nombre,
    primer_apellido,
    activo,
    created_at
FROM gen_usuarios
WHERE username = 'ana.garcia'
ORDER BY created_at;

-- 2. Buscar usuarios con email 'ana.garcia@empresa.com'
SELECT 
    id,
    username,
    email,
    primer_nombre,
    primer_apellido,
    activo,
    created_at
FROM gen_usuarios
WHERE email = 'ana.garcia@empresa.com'
ORDER BY created_at;
```

### Paso 2: Identificar el Problema

**Posibles causas:**

1. **Usuario duplicado**: Existe otro usuario con el mismo username
2. **Registro corrupto**: El usuario que estás editando no existe
3. **ID incorrecto**: Estás editando con un ID que no corresponde
4. **Cache desactualizado**: Los datos en el frontend no coinciden con la BD

### Paso 3: Usar el Debug Avanzado

Abre la consola del navegador y verifica estos logs al editar:

```
🔬 Ejecutando diagnóstico previo...
👤 Usuario actual en BD: {...}
🔍 Verificando username: "ana.garcia", excluyendo ID: X
📊 Resultado verificación username: {...}
```

### Paso 4: Soluciones Específicas

#### Si hay usuarios duplicados:
```sql
-- Encontrar duplicados
SELECT username, COUNT(*) as cantidad
FROM gen_usuarios
WHERE username = 'ana.garcia'
GROUP BY username
HAVING COUNT(*) > 1;

-- Si hay duplicados, mantener el más reciente y eliminar el resto
-- ⚠️ CUIDADO: Respalda antes de ejecutar
DELETE FROM gen_usuarios 
WHERE username = 'ana.garcia' 
AND id NOT IN (
    SELECT MAX(id) 
    FROM gen_usuarios 
    WHERE username = 'ana.garcia'
);
```

#### Si el ID está mal:
```sql
-- Verificar qué ID corresponde al usuario que quieres editar
SELECT id, username, email, primer_nombre, primer_apellido
FROM gen_usuarios
WHERE primer_nombre = 'Ana' AND primer_apellido = 'García';
```

#### Si hay problemas de case-sensitivity:
```sql
-- Buscar variaciones del username
SELECT id, username, email
FROM gen_usuarios
WHERE LOWER(username) = LOWER('ana.garcia');
```

## 🔧 Funciones de Validación Implementadas

### En `usuariosService.ts`:
```typescript
// Validar username único (excluyendo usuario actual)
if (usuarioData.username) {
  const { data: existingUsers } = await supabase
    .from('gen_usuarios')
    .select('id, username')
    .eq('username', usuarioData.username)
    .neq('id', id);
    
  if (existingUsers && existingUsers.length > 0) {
    throw new Error(`El username '${usuarioData.username}' ya está en uso`);
  }
}
```

### En `debugService.ts`:
```typescript
// Verificación completa antes de actualizar
async testUpdate(id: number, updateData: any) {
  // Verifica conflictos potenciales sin hacer la actualización
  // Retorna información detallada sobre cualquier problema
}
```

## 🚀 Cómo Probar la Solución

1. **Abre la consola del navegador** (F12)
2. **Ve a la página de editar usuario**
3. **Intenta actualizar el usuario problemático**
4. **Revisa los logs detallados** que aparecerán en la consola
5. **Los logs te dirán exactamente qué está causando el conflicto**

### Logs esperados si todo funciona:
```
📝 Datos del formulario a actualizar: {...}
🔍 Usuario ID: 123
🔬 Ejecutando diagnóstico previo...
👤 Usuario actual en BD: {...}
🔍 Verificando username: "ana.garcia", excluyendo ID: 123
📊 Resultado verificación username: {data: [], error: null}
✅ No se detectaron conflictos para la actualización
📤 Datos mapeados para el servicio: {...}
```

### Logs si hay conflicto:
```
❌ Conflicto de username detectado: [{id: 456, username: "ana.garcia", ...}]
❌ Test de actualización falló: {error: "Username 'ana.garcia' ya está en uso"}
```

## 🎯 Próximos Pasos

1. **Ejecuta el diagnóstico SQL** para identificar el problema exacto
2. **Usa los logs del navegador** para obtener información detallada
3. **Aplica la solución específica** según lo que encuentres
4. **Reporta los resultados** para ajustar la solución si es necesario

## 🆘 Si Nada Funciona

Como último recurso, puedes:

1. **Cambiar temporalmente el username** a algo único (ej: "ana.garcia.temp")
2. **Guardar el usuario**
3. **Cambiar de vuelta al username deseado**
4. **Esto forzará una verificación completa de la BD**

La implementación actual debería resolver el problema automáticamente. Los logs te dirán exactamente qué está pasando para que podamos ajustar la solución si es necesario.

# ✅ Verificación del Sistema de Email - RH Compensamos

## 📋 Estado Actual de la Configuración

### ✅ Credenciales Configuradas
- **Gmail**: `proyectosmobilsoft@gmail.com`
- **Contraseña**: `Axul2025$`
- **Contraseña de App**: No configurada (opcional)

### ✅ Archivos Creados
1. **`client/src/services/emailService.ts`** - Servicio de email ✅
2. **`client/src/services/authService.ts`** - Actualizado con email ✅
3. **`supabase/functions/send-email/index.ts`** - Edge Function ✅
4. **`client/src/services/testEmailService.ts`** - Servicio de pruebas ✅
5. **`client/src/pages/config/EmailTestPage.tsx`** - Página de pruebas ✅

## 🔧 Pasos para Verificar

### Paso 1: Verificar Configuración de Gmail

#### 🔐 Configuración de Seguridad de Gmail
1. Ve a tu cuenta de Google: https://myaccount.google.com/
2. Seguridad → Verificación en dos pasos
3. Si tienes 2FA habilitado:
   - Ve a "Contraseñas de aplicación"
   - Genera una nueva contraseña para "RH Compensamos"
   - Usa esa contraseña en lugar de la normal

#### 🔓 Configuración sin 2FA
1. Ve a tu cuenta de Google
2. Seguridad → Contraseñas de aplicaciones
3. Habilita "Acceso de aplicaciones menos seguras"
4. Usa tu contraseña normal

### Paso 2: Desplegar Edge Function en Supabase

1. **Ve a tu proyecto de Supabase**
   - Dashboard → Edge Functions

2. **Crear nueva función**
   - Nombre: `send-email`
   - Copia el contenido de `supabase/functions/send-email/index.ts`

3. **Desplegar la función**
   - Click en "Deploy"

### Paso 3: Probar el Sistema

#### 🧪 Opción A: Usar la Página de Pruebas
1. Ve a `/config/email-test` (agregar a las rutas)
2. Verifica la configuración actual
3. Ejecuta "Probar Configuración"
4. Ejecuta "Probar Código"
5. Ejecuta "Probar Notificación"

#### 🧪 Opción B: Probar desde la Consola
```javascript
// En la consola del navegador
import { testEmailService } from '@/services/testEmailService';

// Probar configuración
await testEmailService.testEmailConfig();

// Probar envío de código
await testEmailService.testVerificationCode('proyectosmobilsoft@gmail.com');

// Probar notificación
await testEmailService.testPasswordChangeNotification('proyectosmobilsoft@gmail.com');
```

## 📧 Verificación de Emails

### ✅ Emails que Deberías Recibir

1. **Código de Verificación**
   - **Asunto**: "Código de Verificación - RH Compensamos"
   - **Contenido**: HTML profesional con código de 6 dígitos
   - **Expiración**: 30 minutos

2. **Notificación de Cambio**
   - **Asunto**: "Contraseña Cambiada - RH Compensamos"
   - **Contenido**: Confirmación de cambio exitoso

### 🔍 Dónde Buscar los Emails

1. **Bandeja de entrada** de `proyectosmobilsoft@gmail.com`
2. **Carpeta de spam** (revisar si no llegan)
3. **Consola del navegador** (códigos de prueba)

## 🛠️ Troubleshooting

### ❌ Error: "Authentication failed"
**Solución:**
- Verifica que la contraseña sea correcta
- Si tienes 2FA, usa contraseña de aplicación
- Habilita "Acceso de aplicaciones menos seguras"

### ❌ Error: "Connection timeout"
**Solución:**
- Verifica tu conexión a internet
- Revisa que la Edge Function esté desplegada
- Verifica los logs de Supabase

### ❌ Error: "Edge Function not found"
**Solución:**
- Asegúrate de que la función `send-email` esté desplegada
- Verifica el nombre exacto de la función
- Revisa los logs de Supabase

### ❌ Email no llega
**Solución:**
- Revisa la carpeta de spam
- Verifica que el correo de destino sea válido
- Revisa los logs de la Edge Function
- Verifica que las credenciales sean correctas

## 📊 Logs a Revisar

### En la Consola del Navegador:
```javascript
// Deberías ver:
✅ Configuración de email correcta
✅ Código enviado a proyectosmobilsoft@gmail.com: 123456
✅ Notificación enviada correctamente
```

### En los Logs de Supabase:
```javascript
// En Edge Functions → send-email → Logs
📧 Enviando email a: proyectosmobilsoft@gmail.com
📧 Desde: proyectosmobilsoft@gmail.com
✅ Email enviado exitosamente: <messageId>
```

## 🎯 Resultado Esperado

Si todo está configurado correctamente:

1. ✅ **Configuración**: La página de pruebas muestra "Configuración correcta"
2. ✅ **Código de Verificación**: Recibes un email con código de 6 dígitos
3. ✅ **Notificación**: Recibes un email de confirmación de cambio
4. ✅ **Logs**: Ves los logs exitosos en la consola y Supabase

## 🔄 Próximos Pasos

1. **Desplegar la Edge Function** en Supabase
2. **Probar la configuración** usando la página de pruebas
3. **Verificar emails** en tu bandeja de entrada
4. **Integrar con el sistema de recuperación** existente

## 📞 Soporte

Si encuentras problemas:
1. Revisa los logs de la consola del navegador
2. Revisa los logs de la Edge Function en Supabase
3. Verifica las credenciales de Gmail
4. Asegúrate de que la Edge Function esté desplegada

¿Necesitas ayuda con algún paso específico? 
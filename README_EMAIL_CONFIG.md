# Configuración de Email con Gmail - RH Compensamos

## 📧 Sistema de Envío de Códigos de Verificación

Este sistema permite enviar códigos de verificación por email usando Gmail SMTP para la recuperación de contraseñas.

## 🚀 Características

- ✅ **Envío automático** de códigos de verificación
- ✅ **Plantillas HTML** profesionales y responsivas
- ✅ **Notificaciones** de cambio de contraseña
- ✅ **Configuración fácil** desde la interfaz
- ✅ **Pruebas de email** integradas
- ✅ **Soporte para 2FA** con contraseñas de aplicación

## 📁 Archivos Creados

### Servicios
- `client/src/services/emailService.ts` - Servicio de email con Gmail
- `client/src/services/authService.ts` - Actualizado para integrar email

### Edge Functions
- `supabase/functions/send-email/index.ts` - Función para enviar emails

### Páginas
- `client/src/pages/config/EmailConfigPage.tsx` - Página de configuración

## 🔧 Configuración Paso a Paso

### Paso 1: Configurar Gmail

#### Opción A: Sin Autenticación de Dos Factores
1. Ve a tu cuenta de Google
2. Seguridad → Contraseñas de aplicaciones
3. Habilita "Acceso de aplicaciones menos seguras"
4. Usa tu contraseña normal de Gmail

#### Opción B: Con Autenticación de Dos Factores (Recomendado)
1. Ve a tu cuenta de Google
2. Seguridad → Verificación en dos pasos
3. Contraseñas de aplicación
4. Genera una nueva contraseña para "RH Compensamos"
5. Usa esta contraseña en lugar de tu contraseña normal

### Paso 2: Desplegar Edge Function

1. Ve a tu proyecto de Supabase
2. Edge Functions → Crear nueva función
3. Nombre: `send-email`
4. Copia el contenido de `supabase/functions/send-email/index.ts`
5. Despliega la función

### Paso 3: Configurar desde la Aplicación

1. Ve a la página de **Configuración de Email**
2. Ingresa tu correo de Gmail
3. Ingresa tu contraseña (normal o de aplicación)
4. Guarda la configuración
5. Prueba enviando un email de prueba

## 📋 Instrucciones Detalladas

### Configuración de Gmail

#### Para Gmail sin 2FA:
```javascript
// En authService.ts, línea 50-52
const EMAIL_CONFIG = {
  gmail: 'tu-email@gmail.com',
  password: 'tu-password-normal'
};
```

#### Para Gmail con 2FA:
```javascript
// En authService.ts, línea 50-53
const EMAIL_CONFIG = {
  gmail: 'tu-email@gmail.com',
  password: 'tu-password-normal',
  appPassword: 'tu-app-password' // Contraseña de aplicación
};
```

### Configuración desde la Interfaz

1. **Accede a la página de configuración**
   - URL: `/config/email` (agregar a las rutas)

2. **Ingresa las credenciales**
   - Correo de Gmail
   - Contraseña de Gmail
   - Contraseña de aplicación (si tienes 2FA)

3. **Prueba la configuración**
   - Ingresa un correo de prueba
   - Envía un email de prueba
   - Verifica que llegue correctamente

## 🔒 Seguridad

### Medidas Implementadas:
- ✅ Credenciales no se almacenan en base de datos
- ✅ Contraseñas se limpian después de configurar
- ✅ Validación de correos Gmail
- ✅ Manejo seguro de errores
- ✅ Logs para debugging

### Recomendaciones:
- 🔐 Usa autenticación de dos factores
- 🔐 Genera contraseñas de aplicación específicas
- 🔐 Revisa regularmente los logs de acceso
- 🔐 Monitorea emails enviados

## 📧 Plantillas de Email

### Código de Verificación
- **Asunto**: "Código de Verificación - RH Compensamos"
- **Contenido**: HTML profesional con código destacado
- **Expiración**: 30 minutos
- **Seguridad**: Advertencias de seguridad incluidas

### Notificación de Cambio de Contraseña
- **Asunto**: "Contraseña Cambiada - RH Compensamos"
- **Contenido**: Confirmación con medidas de seguridad
- **Seguridad**: Instrucciones si no fue el usuario

## 🛠️ Troubleshooting

### Error: "Authentication failed"
- Verifica que la contraseña sea correcta
- Si tienes 2FA, usa contraseña de aplicación
- Habilita "Acceso de aplicaciones menos seguras"

### Error: "Connection timeout"
- Verifica tu conexión a internet
- Revisa que la Edge Function esté desplegada
- Verifica los logs de Supabase

### Email no llega
- Revisa la carpeta de spam
- Verifica que el correo de destino sea válido
- Revisa los logs de la Edge Function

### Error en Edge Function
- Verifica que nodemailer esté disponible
- Revisa los logs de la función
- Verifica la configuración de CORS

## 📊 Monitoreo

### Logs a Revisar:
```javascript
// En la consola del navegador
console.log('✅ Código enviado a email@ejemplo.com: 123456');

// En los logs de Supabase Edge Functions
console.log('Email enviado:', messageId);
```

### Métricas a Monitorear:
- ✅ Emails enviados exitosamente
- ✅ Errores de autenticación
- ✅ Tiempo de respuesta
- ✅ Códigos generados vs verificados

## 🔄 Flujo Completo

1. **Usuario solicita recuperación**
   - Ingresa su email
   - Sistema verifica que existe

2. **Sistema genera código**
   - Código de 6 dígitos
   - Expiración en 30 minutos
   - Guardado en base de datos

3. **Email se envía**
   - Plantilla HTML profesional
   - Código destacado
   - Instrucciones de seguridad

4. **Usuario verifica código**
   - Ingresa el código recibido
   - Sistema valida y expiración

5. **Usuario cambia contraseña**
   - Nueva contraseña se hashea
   - Código se marca como usado
   - Notificación de cambio enviada

## 🎯 Resultado Final

Con esta configuración tendrás:
- ✅ Emails automáticos de códigos de verificación
- ✅ Plantillas profesionales y responsivas
- ✅ Sistema seguro con validaciones
- ✅ Interfaz fácil de configurar
- ✅ Pruebas integradas
- ✅ Notificaciones de seguridad

¿Necesitas ayuda con algún paso específico o tienes alguna pregunta sobre la configuración? 
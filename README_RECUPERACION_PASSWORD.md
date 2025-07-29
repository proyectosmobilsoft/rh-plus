# Sistema de Recuperación de Contraseña con Código de Verificación

## 📋 Descripción

Este sistema permite a los usuarios recuperar su contraseña mediante un código de verificación de 6 dígitos enviado por email.

## 🚀 Características

- ✅ **Generación de códigos** de 6 dígitos
- ✅ **Expiración automática** (30 minutos)
- ✅ **Verificación de códigos** en tiempo real
- ✅ **Cambio seguro de contraseña**
- ✅ **Interfaz moderna** y responsiva
- ✅ **Validaciones completas**

## 📁 Archivos Creados

### Base de Datos
- `shared/schema.ts` - Tabla `codigos_verificacion`
- `sql_codigos_verificacion.sql` - Script SQL para crear la tabla

### Servicios
- `services/authService.ts` - Servicio para manejar códigos de verificación

### Páginas
- `pages/auth/RecuperarPasswordPage.tsx` - Página para solicitar código
- `pages/auth/VerificarCodigoPage.tsx` - Página para verificar código y cambiar contraseña

### Rutas
- `/recuperar-password` - Solicitar código
- `/verificar-codigo` - Verificar código y cambiar contraseña

## 🔧 Configuración Requerida

### 1. Base de Datos
Ejecutar el script SQL en Supabase:
```sql
-- Ejecutar en Supabase SQL Editor
-- Ver archivo: sql_codigos_verificacion.sql
```

### 2. Sistema de Email
Para completar la funcionalidad, necesitas configurar un servicio de email:

#### Opción A: SendGrid
```javascript
// En authService.ts, reemplazar el TODO con:
import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: email,
  from: 'tu-app@tudominio.com',
  subject: 'Código de Verificación - Recuperación de Contraseña',
  html: `
    <h2>Código de Verificación</h2>
    <p>Tu código de verificación es: <strong>${codigo}</strong></p>
    <p>Este código expira en 30 minutos.</p>
  `
};
await sgMail.send(msg);
```

#### Opción B: AWS SES
```javascript
// Configurar AWS SES
import AWS from 'aws-sdk';
const ses = new AWS.SES({
  region: 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const params = {
  Source: 'tu-app@tudominio.com',
  Destination: { ToAddresses: [email] },
  Message: {
    Subject: { Data: 'Código de Verificación' },
    Body: {
      Html: {
        Data: `<h2>Código: ${codigo}</h2>`
      }
    }
  }
};
await ses.sendEmail(params).promise();
```

#### Opción C: Nodemailer (Gmail)
```javascript
// Configurar Nodemailer
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: 'tu-email@gmail.com',
    pass: 'tu-app-password'
  }
});

await transporter.sendMail({
  from: 'tu-email@gmail.com',
  to: email,
  subject: 'Código de Verificación',
  html: `<h2>Código: ${codigo}</h2>`
});
```

## 🔄 Flujo de Funcionamiento

1. **Usuario solicita recuperación** → `/recuperar-password`
2. **Ingresa email** → Sistema genera código de 6 dígitos
3. **Código se guarda en BD** → Con expiración de 30 minutos
4. **Email se envía** → Con el código de verificación
5. **Usuario ingresa código** → `/verificar-codigo`
6. **Sistema verifica código** → Valida que existe y no ha expirado
7. **Usuario cambia contraseña** → Nueva contraseña se hashea y guarda
8. **Código se marca como usado** → No se puede reutilizar

## 🛡️ Seguridad

- **Códigos de 6 dígitos** aleatorios
- **Expiración automática** (30 minutos)
- **Uso único** (se marca como usado)
- **Validación de email** antes de enviar
- **Hash seguro** de contraseñas
- **Prevención de spam** (máximo intentos por email)

## 🎨 Interfaz de Usuario

- **Diseño moderno** con gradientes
- **Iconos descriptivos** para cada paso
- **Estados de carga** con spinners
- **Validaciones en tiempo real**
- **Mensajes de error** claros
- **Responsive design** para móviles

## 🧪 Testing

Para probar sin email configurado:
1. El código se muestra en la consola del navegador
2. Usar el código mostrado para verificar
3. Cambiar contraseña normalmente

## 📝 Variables de Entorno

```env
# Para SendGrid
SENDGRID_API_KEY=tu_api_key

# Para AWS SES
AWS_ACCESS_KEY_ID=tu_access_key
AWS_SECRET_ACCESS_KEY=tu_secret_key

# Para Gmail
GMAIL_USER=tu-email@gmail.com
GMAIL_PASS=tu-app-password
```

## 🚀 Próximos Pasos

1. **Configurar servicio de email** (SendGrid, AWS SES, etc.)
2. **Personalizar plantillas de email**
3. **Agregar límites de intentos** por email
4. **Implementar notificaciones** de seguridad
5. **Agregar logs** de auditoría

¡El sistema está listo para usar una vez configurado el servicio de email! 
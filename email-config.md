# Configuración de Email para RH Compensamos

## ✅ Configuración Actual

El sistema ya está configurado con las siguientes credenciales:

```typescript
const EMAIL_CONFIG = {
  gmail: 'proyectosmobilsoft@gmail.com',
  password: 'Axul2025$',
  appPassword: 'sewi slmy fcls hvaa'
};
```

## 🚀 Estado del Sistema

- ✅ **EmailService configurado** en `authService.ts`
- ✅ **Supabase Edge Functions** funcionando
- ✅ **Envío de correos** operativo para recuperación de contraseña
- ✅ **Sistema de campañas** conectado al mismo servicio

## 📧 Funcionalidades Disponibles

### 1. **Recuperación de Contraseña**
- Envío de códigos de verificación
- Notificaciones de cambio de contraseña

### 2. **Campañas de Email** (NUEVO)
- Envío masivo a candidatos
- Envío masivo a empleadores
- Personalización con variables
- Registro de logs en `email_logs`

## 🎯 Variables Disponibles

En las plantillas de correo puedes usar:
- `{{nombre}}` → Nombre del destinatario
- `{{email}}` → Email del destinatario
- `{{empresa}}` → Empresa del destinatario
- `{{fecha}}` → Fecha actual
- `{{contraseña}}` → Placeholder

## 📊 Logs y Monitoreo

- **Tabla `email_logs`**: Registra todos los envíos
- **Estados**: `pendiente`, `enviado`, `error`, `cancelado`
- **Tracking**: Fecha de envío, errores, contenido enviado

## 🔧 Para Probar

1. **Ve al maestro de correos** (`/maestro`)
2. **Selecciona destinatarios** (Candidatos/Empleadores)
3. **Elige una plantilla** y completa los campos
4. **Haz clic en "Crear Campaña"**
5. **Los correos se enviarán automáticamente**

## 📝 Notas Importantes

- El sistema usa **Supabase Edge Functions** para el envío
- Las credenciales están configuradas en `authService.ts`
- Los correos se envían desde `proyectosmobilsoft@gmail.com`
- El sistema registra todos los envíos en la base de datos 
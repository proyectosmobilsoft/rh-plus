# 🚀 Guía Completa de Configuración SendGrid

## 📋 **Pasos para Configurar SendGrid**

### **Paso 1: Crear Cuenta en SendGrid**

1. **Ir a [SendGrid](https://sendgrid.com)**
2. **Hacer clic en "Start for Free"**
3. **Completar el formulario de registro:**
   - Email
   - Contraseña
   - Nombre de la empresa
4. **Verificar email** de registro
5. **Completar perfil** (opcional)

### **Paso 2: Obtener API Key**

1. **Ir al Dashboard** de SendGrid
2. **Settings → API Keys** (en el menú lateral)
3. **Hacer clic en "Create API Key"**
4. **Configurar la API Key:**
   - **Name**: `RH Compensamos API Key`
   - **API Key Permissions**: `Restricted Access`
   - **Mail Send**: `Full Access` ✅
   - **Mail Settings**: `Read Access` ✅
5. **Hacer clic en "Create & View"**
6. **Copiar la API Key** (empieza con `SG.`)

### **Paso 3: Configurar Variables de Entorno**

Crear archivo `.env` en la carpeta `client/`:

```env
# Configuración de Email - SendGrid
VITE_SENDGRID_API_KEY=SG.tu_api_key_real_aqui

# Configuración de Supabase
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

**⚠️ Importante:** 
- Reemplaza `SG.tu_api_key_real_aqui` con tu API Key real
- No compartas este archivo en Git (ya está en .gitignore)

### **Paso 4: Verificar Configuración**

1. **Reiniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

2. **Probar el envío de emails** usando el componente de prueba

### **Paso 5: Configurar Dominio (Opcional pero Recomendado)**

Para mejor deliverabilidad:

1. **En SendGrid Dashboard → Settings → Sender Authentication**
2. **Hacer clic en "Authenticate Your Domain"**
3. **Ingresar tu dominio:** `rhcompensamos.com`
4. **Seguir las instrucciones** para configurar DNS
5. **Verificar dominio** (puede tomar hasta 24 horas)

## 🧪 **Probar la Configuración**

### **Método 1: Usar el Componente de Prueba**

```tsx
import TestSendGrid from '@/components/TestSendGrid';

// En tu página de administración
<TestSendGrid />
```

### **Método 2: Probar desde la Consola**

```javascript
// En la consola del navegador
import { emailService } from '@/services/emailService';

const result = await emailService.sendVerificationCode(
  'tu-email@empresa.com',
  '123456',
  'Usuario de Prueba'
);

console.log(result);
```

## 📊 **Monitoreo y Estadísticas**

### **Dashboard de SendGrid**

1. **Activity Feed**: Ver todos los emails enviados
2. **Statistics**: Estadísticas de entrega, apertura, clics
3. **Suppressions**: Emails bloqueados o en lista negra
4. **Bounces**: Emails que rebotaron

### **Métricas Importantes**

- **Delivered**: Emails entregados exitosamente
- **Opens**: Emails abiertos por los destinatarios
- **Clicks**: Enlaces clickeados
- **Bounces**: Emails que rebotaron
- **Spam Reports**: Reportes de spam

## 🔧 **Configuración Avanzada**

### **Templates de Email**

1. **En SendGrid Dashboard → Email API → Dynamic Templates**
2. **Crear template** para emails de verificación
3. **Usar variables dinámicas** como `{{codigo}}`, `{{nombre}}`

### **Webhooks (Opcional)**

1. **Settings → Mail Settings → Event Webhook**
2. **Configurar URL** para recibir eventos
3. **Seleccionar eventos** a monitorear:
   - Delivered
   - Opened
   - Clicked
   - Bounced
   - Spam Report

## 🚨 **Solución de Problemas**

### **Error: "API Key not found"**

```bash
# Verificar que la variable esté configurada
echo $VITE_SENDGRID_API_KEY

# Reiniciar el servidor
npm run dev
```

### **Error: "Forbidden"**

- Verificar que la API Key tenga permisos de "Mail Send"
- Verificar que la API Key esté activa

### **Error: "Invalid email address"**

- Verificar formato del email
- Verificar que el dominio esté verificado (si usas dominio personalizado)

### **Emails no llegan a dominios corporativos**

1. **Verificar configuración DNS** (SPF, DKIM, DMARC)
2. **Revisar estadísticas** en SendGrid Dashboard
3. **Contactar soporte** de SendGrid si es necesario

## 📈 **Límites y Precios**

### **Plan Gratuito**
- **100 emails/día** gratis
- **40,000 emails/mes** gratis por 30 días
- **Soporte por email**

### **Plan Essentials** ($19.95/mes)
- **50,000 emails/mes**
- **Soporte por email y chat**
- **Estadísticas avanzadas**

## ✅ **Verificación Final**

Una vez configurado, deberías ver:

1. **En la consola del navegador:**
   ```
   ✅ Email enviado exitosamente con SendGrid a: usuario@empresa.com
   ```

2. **En SendGrid Dashboard:**
   - Emails aparecen en "Activity Feed"
   - Estadísticas se actualizan en tiempo real

3. **En el email del destinatario:**
   - Email llega a la bandeja de entrada
   - No aparece en spam
   - Headers muestran "via SendGrid"

## 🎯 **Resultado Esperado**

Con SendGrid configurado:

- ✅ **Gmail**: 99% de entrega
- ✅ **Dominios corporativos**: 90-95% de entrega
- ✅ **Menos emails en spam**: Configuración profesional
- ✅ **Estadísticas detalladas**: Monitoreo completo
- ✅ **Soporte profesional**: Ayuda cuando sea necesario

---

**¡Listo!** Con esta configuración, el problema de entrega a dominios corporativos debería resolverse completamente. 🎉

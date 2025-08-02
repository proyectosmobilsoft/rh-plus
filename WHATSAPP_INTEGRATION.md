# Integración de WhatsApp

## Descripción

Se ha implementado una integración moderna de WhatsApp en la página "Códigos QR" que permite enviar mensajes personalizados a candidatos con códigos QR generados.

## Características Implementadas

### 1. Servicio de WhatsApp (`whatsappService.ts`)
- **Envío de mensajes individuales y masivos**
- **Reemplazo de variables de plantilla** con datos reales del candidato
- **Validación de números de teléfono**
- **Formateo automático de números** (agrega código de país si es necesario)
- **Gestión de plantillas** (guardar/cargar desde base de datos)

### 2. Variables de Plantilla Disponibles
- `{{nombre}}` - Nombre completo del candidato
- `{{empresa}}` - Nombre de la empresa
- `{{telefono}}` - Número de teléfono
- `{{email}}` - Correo electrónico
- `{{documento}}` - Número de documento

### 3. Funcionalidades en la Interfaz
- **Selección de plantillas** desde base de datos
- **Editor de mensajes personalizados**
- **Vista previa en tiempo real** del mensaje con datos del candidato
- **Guardado de plantillas personalizadas**
- **Envío masivo** a múltiples candidatos seleccionados
- **Indicadores de carga** durante el envío
- **Manejo de errores** y notificaciones

## Configuración para Producción

### 1. WhatsApp Business API

Para usar en producción, necesitarás:

1. **Cuenta de WhatsApp Business API**
   - Registrarse en [Meta for Developers](https://developers.facebook.com/)
   - Crear una aplicación de WhatsApp Business
   - Obtener el token de acceso

2. **Configurar variables de entorno**
   ```env
   REACT_APP_WHATSAPP_TOKEN=tu_token_aqui
   REACT_APP_WHATSAPP_API_URL=https://graph.facebook.com/v18.0
   ```

3. **Actualizar el servicio**
   En `whatsappService.ts`, descomenta y configura la llamada real a la API:

   ```typescript
   // Reemplazar la simulación con la llamada real
   const response = await fetch(`${this.apiUrl}/messages`, {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${this.accessToken}`,
       'Content-Type': 'application/json',
     },
     body: JSON.stringify({
       messaging_product: 'whatsapp',
       to: messageData.to,
       type: 'text',
       text: {
         body: messageData.message
       }
     })
   });
   ```

### 2. Base de Datos

La tabla `whatsapp_templates` ya está creada con:
- Plantilla por defecto
- Soporte para variables personalizadas
- Estado activo/inactivo

### 3. Uso en Desarrollo

En desarrollo, el sistema:
- Simula las llamadas a la API
- Abre WhatsApp Web con el mensaje pre-llenado
- Valida números de teléfono
- Muestra notificaciones de éxito/error

## Uso

### 1. Enviar Mensajes
1. Ir a la página "Códigos QR"
2. Seleccionar el tab "WhatsApp"
3. Elegir candidatos con códigos QR generados
4. Seleccionar una plantilla o escribir mensaje personalizado
5. Revisar la vista previa
6. Hacer clic en "Enviar"

### 2. Crear Plantillas
1. Escribir el mensaje personalizado
2. Hacer clic en "Guardar como plantilla"
3. Ingresar nombre de la plantilla
4. La plantilla estará disponible para futuros envíos

### 3. Variables Disponibles
Usar las variables en el mensaje:
```
Hola {{nombre}},

Tu código QR para {{empresa}} está listo.
Documento: {{documento}}
Contacto: {{telefono}}

Saludos cordiales.
```

## Notas Técnicas

- **Validación**: Los números se validan automáticamente
- **Formato**: Se agrega código de país (57 para Colombia) si es necesario
- **Rate Limiting**: Se incluye delay entre mensajes para evitar limitaciones
- **Error Handling**: Manejo completo de errores con notificaciones
- **Loading States**: Indicadores de carga durante operaciones

## Próximos Pasos

1. **Configurar WhatsApp Business API** para producción
2. **Implementar webhooks** para recibir confirmaciones de entrega
3. **Agregar plantillas multimedia** (imágenes, documentos)
4. **Implementar programación** de envíos
5. **Agregar reportes** de envíos y entregas 
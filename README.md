# RH Compensamos - Sistema de Gestión de Contratación

## 📋 Tabla de Contenidos

- [Configuración de Email](#configuración-de-email)
- [Cambios en Botones de Campañas](#cambios-en-botones-de-campañas)
- [Cambios en Colores](#cambios-en-colores)
- [Configuración de Vercel](#configuración-de-vercel)
- [Estructura del Proyecto](#estructura-del-proyecto)

---

## 📧 Configuración de Email

### ✅ Configuración Actual

El sistema ya está configurado con las siguientes credenciales:

```typescript
const EMAIL_CONFIG = {
  gmail: 'proyectosmobilsoft@gmail.com',
  password: 'Axul2025$',
  appPassword: 'sewi slmy fcls hvaa'
};
```

### 🚀 Estado del Sistema

- ✅ **EmailService configurado** en `authService.ts`
- ✅ **Supabase Edge Functions** funcionando
- ✅ **Envío de correos** operativo para recuperación de contraseña
- ✅ **Sistema de campañas** conectado al mismo servicio

### 📧 Funcionalidades Disponibles

#### 1. **Recuperación de Contraseña**
- Envío de códigos de verificación
- Notificaciones de cambio de contraseña

#### 2. **Campañas de Email** (NUEVO)
- Envío masivo a candidatos
- Envío masivo a empleadores
- Personalización con variables
- Registro de logs en `email_logs`

### 🎯 Variables Disponibles

En las plantillas de correo puedes usar:
- `{{nombre}}` → Nombre del destinatario
- `{{email}}` → Email del destinatario
- `{{empresa}}` → Empresa del destinatario
- `{{fecha}}` → Fecha actual
- `{{contraseña}}` → Placeholder

### 📊 Logs y Monitoreo

- **Tabla `email_logs`**: Registra todos los envíos
- **Estados**: `pendiente`, `enviado`, `error`, `cancelado`
- **Tracking**: Fecha de envío, errores, contenido enviado

### 🔧 Para Probar

1. **Ve al maestro de correos** (`/maestro`)
2. **Selecciona destinatarios** (Candidatos/Empleadores)
3. **Elige una plantilla** y completa los campos
4. **Haz clic en "Crear Campaña"**
5. **Los correos se enviarán automáticamente**

---

## 🎯 Cambios en Botones de Campañas

### Resumen de Cambios

Se ha simplificado la interfaz de campañas de email masivo, reemplazando los 4 botones anteriores por un solo botón con icono de ojo que abre un modal elegante mostrando información completa sobre qué se envió y a quién.

### Cambios Realizados

#### 1. Funciones Eliminadas
Se eliminaron las siguientes funciones que ya no se utilizan:
- `handleViewCampaignDetails()` - Ver detalles básicos
- `handleResendCampaign()` - Reenviar campaña
- `handleDuplicateCampaign()` - Duplicar campaña  
- `handleViewCampaignStats()` - Ver estadísticas

#### 2. Nueva Función Implementada
Se creó una nueva función `handleViewCampaignSentInfo()` que:

**Funcionalidades:**
- Obtiene información completa de la campaña (nombre, asunto, contenido, estado)
- Consulta la base de datos para obtener la lista de destinatarios
- Abre un modal elegante con toda la información organizada
- Presenta la información de forma limpia y profesional

**Información Mostrada en el Modal:**
- 📧 **Información de la Campaña:**
  - Nombre de la campaña
  - Asunto del email
  - Estado actual con badge de color
  - Estadísticas de envío (enviados/total)
  - Fecha de envío

- 📝 **Mensaje Enviado:**
  - Contenido completo del email en texto plano
  - Formato legible con saltos de línea preservados
  - Sin elementos técnicos ni HTML

- 👥 **Lista de Destinatarios:**
  - Nombre completo de cada persona
  - Email de contacto
  - Empresa (si está disponible)
  - Estado del envío (enviado, pendiente, etc.)
  - Fecha de envío individual

#### 3. Modal Elegante

**Características del Modal:**
- **Diseño Responsivo:** Se adapta a diferentes tamaños de pantalla
- **Scroll Interno:** Permite ver toda la información sin problemas
- **Información Organizada:** Dividida en secciones claras
- **Sin Elementos Técnicos:** Solo muestra información relevante para el usuario
- **Interfaz Limpia:** Diseño profesional y fácil de leer

**Secciones del Modal:**
1. **Header:** Título con icono de email
2. **Información de Campaña:** Datos básicos en grid de 2 columnas
3. **Mensaje Enviado:** Contenido completo en texto plano
4. **Lista de Destinatarios:** Tabla con scroll interno
5. **Botón de Cierre:** Para cerrar el modal

#### 4. Botones Simplificados

**Antes:**
- 4 botones por campaña (Info, BarChart3, Copy, RefreshCw)
- Funcionalidades separadas y específicas

**Ahora:**
- 1 solo botón con icono de ojo (Eye)
- Funcionalidad unificada que abre modal elegante
- Tooltip: "Ver qué se envió y a quién"

#### 5. Estados Agregados
Se agregaron nuevos estados para controlar el modal:
- `showCampaignModal`: Controla la visibilidad del modal
- `campaignInfo`: Almacena la información de la campaña
- `campaignRecipients`: Almacena la lista de destinatarios

### Archivos Modificados

#### `client/src/pages/maestro/EmailMasivoPage.tsx`
- Eliminadas 4 funciones de manejo de campañas
- Agregada nueva función `handleViewCampaignSentInfo()`
- Reemplazados 4 botones por 1 botón de ojo
- Agregado modal elegante con información completa
- Actualizados imports de Lucide React y componentes UI
- Agregados estados para control del modal

### Beneficios del Cambio

1. **Simplicidad:** Interfaz más limpia y fácil de usar
2. **Información Completa:** Un solo clic muestra toda la información relevante
3. **Experiencia de Usuario:** Modal elegante y profesional
4. **Consistencia:** Mismo comportamiento para campañas Gmail y regulares
5. **Mantenibilidad:** Menos código para mantener
6. **Legibilidad:** Información organizada y fácil de leer

### Uso

Para ver la información de una campaña:
1. Ir a la página de Email Masivo
2. En la lista de campañas, hacer clic en el botón de ojo (👁️)
3. Se abrirá un modal elegante con toda la información
4. El modal se puede cerrar haciendo clic en "Cerrar" o fuera del modal

---

## 🎨 Cambios en Colores

### Resumen de Cambios

Se ha actualizado el color gris en toda la aplicación para usar el color específico `#9d9d9d` en lugar de los grises genéricos anteriores.

### Color Aplicado

- **Color específico**: `#9d9d9d`
- **Variable CSS**: `--brand-gray: 0 0% 62%`
- **Variable para placeholders**: `--placeholder-color: 0 0% 62%`

### Elementos Afectados

#### 1. Placeholders
- Todos los placeholders de inputs, textareas y selects ahora usan el color `#9d9d9d`
- Se aplica tanto en modo claro como oscuro
- Compatible con todos los navegadores (Chrome, Firefox, Safari, IE)

#### 2. Bordes de Campos
- Inputs, textareas, selects y otros campos de formulario
- Bordes de componentes de UI (cards, popovers, dropdowns)
- Bordes de calendarios y date pickers

#### 3. Estados Hover
- Efectos hover en campos de formulario
- Hover en componentes de UI
- Transiciones suaves manteniendo el color gris específico

#### 4. Componentes Específicos
- **Input**: Usa `border-input` y `placeholder:text-muted-foreground`
- **Textarea**: Usa `border-input` y `placeholder:text-muted-foreground`
- **Select**: Usa `border-input` y `placeholder:text-muted-foreground`
- **Calendar/DatePicker**: Bordes con el color gris específico
- **Cards**: Hover con borde gris específico
- **Badges**: Bordes con color gris específico
- **Switches/Toggles**: Fondo gris cuando no están activos

### Elementos NO Afectados

- **Texto de contenido**: Las letras y texto mantienen sus colores originales
- **Botones principales**: Mantienen los colores de marca (verde lima y azul turquesa)
- **Enlaces**: Mantienen el color azul turquesa
- **Iconos**: Mantienen sus colores originales

### Variables CSS Actualizadas

```css
:root {
  --brand-gray: 0 0% 62%;           /* #9d9d9d */
  --placeholder-color: 0 0% 62%;     /* #9d9d9d */
  --border: var(--brand-gray);       /* #9d9d9d */
  --input: var(--brand-gray);        /* #9d9d9d */
}
```

### Estilos Agregados

#### Placeholders
```css
::placeholder {
  color: hsl(var(--placeholder-color)) !important;
  opacity: 1;
}
```

#### Hovers en Campos
```css
input:hover,
textarea:hover,
select:hover {
  border-color: hsl(var(--brand-gray)) !important;
}
```

#### Focus en Campos
```css
input:focus,
textarea:focus,
select:focus {
  border-color: hsl(var(--brand-lime)) !important;
  outline-color: hsl(var(--brand-lime)) !important;
}
```

### Compatibilidad

- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Internet Explorer 10+

### Notas Importantes

1. **Consistencia**: Todos los placeholders ahora tienen el mismo color gris específico
2. **Accesibilidad**: El contraste del color `#9d9d9d` cumple con los estándares de accesibilidad
3. **Modo Oscuro**: Los placeholders mantienen el mismo color en modo oscuro
4. **Performance**: Los cambios usan variables CSS para mejor rendimiento

### Archivos Modificados

- `client/src/index.css`: Variables CSS y estilos globales
- `tailwind.config.ts`: Configuración de colores (ya tenía el color definido)

---

## 🚀 Configuración de Vercel

### Estructura del Proyecto

```
rh-compensamos/
├── client/           ← Aplicación React (Vite)
│   ├── package.json
│   ├── src/
│   ├── public/
│   └── dist/
├── supabase/         ← Configuración de Supabase
└── README.md         ← Este archivo
```

### Configuración Recomendada

#### 1. **Root Directory**: `client`
#### 2. **Framework Preset**: `Vite`
#### 3. **Build Command**: `npm run build`
#### 4. **Output Directory**: `dist`

### Variables de Entorno Necesarias

```bash
VITE_SUPABASE_URL=https://clffvmueangquavnaokd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Despliegue con Vercel CLI

```bash
cd client
vercel
```

### Solución de Problemas Comunes

#### Error 404
- Verificar que `Root Directory` esté configurado como `client`
- Asegurar que `Framework Preset` sea `Vite`
- Verificar que las variables de entorno estén configuradas

#### Error de Build
- Ejecutar `npm install` antes del build
- Verificar que todas las dependencias estén instaladas
- Revisar logs de build en Vercel

---

## 📁 Estructura del Proyecto

### Frontend (React + Vite)

```
client/
├── src/
│   ├── components/     ← Componentes reutilizables
│   ├── pages/         ← Páginas de la aplicación
│   ├── contexts/      ← Contextos de React
│   ├── hooks/         ← Hooks personalizados
│   ├── services/      ← Servicios de API
│   ├── types/         ← Tipos de TypeScript
│   ├── utils/         ← Utilidades
│   └── lib/           ← Librerías y configuraciones
├── public/            ← Archivos estáticos
├── dist/              ← Build de producción
└── package.json       ← Dependencias y scripts
```

### Backend (Supabase)

```
supabase/
├── functions/         ← Edge Functions
├── migrations/        ← Migraciones de base de datos
└── config/           ← Configuración de Supabase
```

### Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Inicia servidor de desarrollo
npm run build        # Construye para producción
npm run preview      # Previsualiza build de producción

# Vercel
vercel               # Despliega en Vercel
vercel --prod        # Despliega en producción
```

---

## 🔧 Desarrollo Local

### Requisitos

- Node.js 18+ 
- npm o yarn
- Supabase CLI (opcional)

### Instalación

```bash
# Clonar repositorio
git clone <url-del-repositorio>
cd rh-compensamos

# Instalar dependencias
cd client
npm install

# Iniciar desarrollo
npm run dev
```

### Variables de Entorno

Crear archivo `.env.local` en la carpeta `client`:

```env
VITE_SUPABASE_URL=https://clffvmueangquavnaokd.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anonima
```

---

## 📝 Notas Importantes

- El sistema usa **Supabase Edge Functions** para el envío de emails
- Las credenciales están configuradas en `authService.ts`
- Los correos se envían desde `proyectosmobilsoft@gmail.com`
- El sistema registra todos los envíos en la base de datos
- La aplicación está configurada como SPA (Single Page Application)
- El routing se maneja con React Router
- Los estilos usan Tailwind CSS con variables CSS personalizadas

---

## 🤝 Contribución

Para contribuir al proyecto:

1. Crear una rama desde `main`
2. Hacer cambios y commits descriptivos
3. Crear un Pull Request
4. Esperar revisión y aprobación

---

## 📞 Soporte

Para soporte técnico o preguntas:
- Crear un issue en el repositorio
- Contactar al equipo de desarrollo
- Revisar la documentación de Supabase y Vercel 
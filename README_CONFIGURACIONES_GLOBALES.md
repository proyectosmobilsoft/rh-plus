# Configuración de Talento Humano

## 📋 Descripción

La funcionalidad de **Configuración de Talento Humano** permite gestionar la información de la empresa de servicios de RRHH. Esta vista proporciona una interfaz completa para configurar todos los datos de "Talento Humano", la empresa principal que presta servicios de RRHH a otras empresas.

## 🎯 Características Principales

### ✨ **Funcionalidades:**

- **Visualización completa** de la información de la empresa seleccionada
- **Edición en tiempo real** de todos los campos de la empresa
- **Interfaz intuitiva** con formularios organizados por categorías
- **Validación de datos** y feedback visual
- **Guardado automático** con confirmación de cambios
- **Diseño responsivo** que funciona en todos los dispositivos

### 🏢 **Información Gestionada:**

#### **Información Básica:**
- Razón Social
- NIT
- Tipo de Documento
- Régimen Tributario
- Actividad Económica
- Número de Empleados

#### **Información de Contacto:**
- Teléfono
- Correo Electrónico
- Representante Legal
- Dirección completa
- Ciudad
- Departamento

#### **Información del Sistema:**
- Fecha de Registro
- Última Actualización
- ID de Empresa

## 🚀 Cómo Acceder

### **Desde el Sidebar:**
1. Navega al menú lateral
2. Busca la sección **"Configuración Talento Humano"**
3. Haz clic en el elemento con el icono de **Globe** 🌐
4. Serás dirigido a la página `/configuraciones/globales`

### **Acceso Directo:**
- URL: `/configuraciones/globales`

## 🎨 Diseño y UX

### **Banner Informativo:**
- **Fondo**: Gradiente azul-púrpura con información clara
- **Descripción**: Explica que es para configurar la empresa de servicios de RRHH
- **Iconografía**: Icono de usuarios para representar RRHH

### **Header con Gradiente:**
- **Fondo**: Gradiente azul-púrpura con efecto de profundidad
- **Información principal**: Nombre de la empresa y badges de "Empresa de Servicios RRHH" y "Talento Humano"
- **Estadísticas**: Número de empleados con diseño visual atractivo

### **Formulario Organizado:**
- **Dos columnas**: Información Básica e Información de Contacto
- **Campos agrupados**: Lógica por categorías para mejor organización
- **Estados visuales**: Campos habilitados/deshabilitados según modo de edición

### **Botones de Acción:**
- **Modo Vista**: Botón "Editar" para activar la edición
- **Modo Edición**: Botones "Guardar" y "Cancelar" con estados de carga
- **Feedback visual**: Spinners y confirmaciones de acciones

## 🔧 Funcionalidades Técnicas

### **Estados de la Aplicación:**
- **Loading**: Pantalla de carga con animación elegante
- **Error**: Manejo de errores con opción de reintento
- **Sin datos**: Mensaje cuando no hay empresa principal configurada
- **Edición**: Modo de edición con campos habilitados

### **Persistencia de Datos:**
- **Carga inicial**: Obtiene la empresa seleccionada del usuario logueado
- **Actualización**: Guarda cambios en Supabase con timestamp
- **Recarga**: Actualiza la vista después de guardar cambios

### **Validación y Seguridad:**
- **Campos requeridos**: Validación de datos obligatorios
- **Tipos de datos**: Validación de tipos (email, números, etc.)
- **Manejo de errores**: Feedback claro en caso de errores
- **Confirmaciones**: Toast notifications para acciones exitosas

## 📱 Responsive Design

### **Desktop (lg+):**
- Layout de dos columnas
- Formularios organizados horizontalmente
- Header con información completa

### **Tablet (md):**
- Layout adaptativo
- Formularios en columna única
- Header optimizado

### **Mobile (sm):**
- Layout vertical completo
- Formularios apilados
- Header compacto

## 🎯 Casos de Uso

### **1. Configuración Inicial:**
- Administrador selecciona "Talento Humano" desde el login
- Accede a configuración de Talento Humano
- Completa la información de su empresa de servicios de RRHH
- Guarda los datos para uso del sistema

### **2. Actualización de Datos:**
- Usuario autorizado edita información de contacto
- Actualiza datos fiscales o legales
- Guarda cambios con confirmación

### **3. Consulta de Información:**
- Usuario visualiza datos de la empresa
- Revisa información del sistema
- No requiere permisos de edición

## 🔐 Permisos y Seguridad

### **Acceso:**
- **Ruta protegida**: Requiere autenticación
- **Permisos**: Solo usuarios autorizados pueden editar
- **Auditoría**: Registro de cambios con timestamps

### **Validaciones:**
- **Campos obligatorios**: Razón social, NIT, etc.
- **Formato de email**: Validación de correo electrónico
- **Números**: Validación de campos numéricos

## 📊 Estructura de Datos

### **Interfaz EmpresaConfig:**
```typescript
interface EmpresaConfig {
  id: number;
  razon_social: string;
  nit: string;
  telefono: string;
  email: string;
  direccion: string;
  ciudad: string;
  departamento: string;
  representante_legal: string;
  tipo_documento: string;
  regimen_tributario: string;
  actividad_economica: string;
  numero_empleados: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
}
```

## 🛠️ Archivos Relacionados

### **Componentes:**
- `client/src/pages/configuraciones/ConfiguracionesGlobalesPage.tsx` - Página principal
- `client/src/components/DynamicSidebar.tsx` - Menú de navegación

### **Rutas:**
- `client/src/App.tsx` - Configuración de rutas

### **Servicios:**
- `client/src/services/supabaseClient.ts` - Conexión a base de datos

## 🎨 Estilos y Animaciones

### **Animaciones:**
- **Transiciones suaves**: 300ms para cambios de estado
- **Loading spinner**: Animación de carga elegante
- **Hover effects**: Efectos visuales en botones y campos

### **Colores y Temas:**
- **Header**: Gradiente verde-teal
- **Botones**: Verde para acciones positivas
- **Estados**: Colores diferenciados para loading, error, éxito

## 🚀 Mejoras Futuras

### **Funcionalidades Planificadas:**
1. **Validación avanzada**: Reglas de negocio específicas
2. **Historial de cambios**: Registro de modificaciones
3. **Backup automático**: Respaldo de configuraciones
4. **Notificaciones**: Alertas de cambios importantes
5. **Exportación**: Generar reportes de configuración

### **Optimizaciones:**
1. **Caché local**: Almacenamiento temporal de datos
2. **Validación en tiempo real**: Feedback inmediato
3. **Auto-guardado**: Guardado automático de cambios
4. **Modo offline**: Funcionalidad sin conexión

## 📝 Notas de Implementación

### **Consideraciones Técnicas:**
- La empresa "Talento Humano" se obtiene desde la selección del usuario logueado
- Los cambios se guardan inmediatamente en la base de datos
- Se mantiene un registro de fechas de modificación
- La interfaz es completamente responsiva
- Específicamente diseñada para empresas de servicios de RRHH

### **Dependencias:**
- **Supabase**: Para persistencia de datos
- **React Hook Form**: Para manejo de formularios (futuro)
- **Sonner**: Para notificaciones toast
- **Lucide React**: Para iconografía

---

**Versión**: 1.0.0  
**Última actualización**: Diciembre 2024  
**Desarrollado por**: Sistema de RRHH 
# Acerca de la Empresa - Nueva Funcionalidad

## 📋 Descripción

Se ha agregado una nueva vista "Acerca de la Empresa" que permite a los usuarios ver información detallada de la empresa que tienen seleccionada en el sistema.

## 🎯 Funcionalidades

### Información Mostrada

La página muestra la siguiente información de la empresa:

#### 📊 Información General
- **Razón Social**: Nombre completo de la empresa
- **Estado**: Activa/Inactiva (con badge de color)
- **Tipo de Empresa**: Prestador de Servicios, Cliente, o Ambos
- **Tipo de Documento**: NIT, CC, etc.
- **NIT**: Número de identificación tributaria
- **Régimen Tributario**: Tipo de régimen
- **Número de Empleados**: Cantidad de empleados

#### 📞 Información de Contacto
- **Dirección**: Dirección física completa
- **Ciudad y Departamento**: Ubicación geográfica
- **Teléfono**: Número de contacto
- **Correo Electrónico**: Email de la empresa
- **Representante Legal**: Nombre del representante

#### 🏢 Actividad Económica
- **Código de Actividad**: Código CIIU
- **Descripción de Actividad**: Descripción detallada (si está disponible)

#### ⚙️ Información del Sistema
- **Fecha de Registro**: Cuándo se registró en el sistema
- **Última Actualización**: Cuándo se actualizó por última vez
- **ID de Empresa**: Identificador único en el sistema

## 🚀 Cómo Acceder

1. **Inicia sesión** en el sistema
2. **Selecciona una empresa** (si tienes múltiples empresas)
3. **Ve al sidebar** y busca "Acerca de la Empresa"
4. **Haz clic** en la opción para ver la información

## 📍 Ubicación en el Menú

La nueva opción aparece en el sidebar principal:
- **Icono**: ℹ️ (Info)
- **Título**: "Acerca de la Empresa"
- **Ruta**: `/empresa/acerca`

## 🎨 Diseño

### Características del Diseño
- **Layout Responsivo**: Se adapta a diferentes tamaños de pantalla
- **Cards Organizadas**: Información dividida en secciones lógicas
- **Badges de Estado**: Indicadores visuales para estado y tipo de empresa
- **Iconos Descriptivos**: Cada sección tiene su icono representativo
- **Colores Consistentes**: Usa la paleta de colores del sistema

### Estados de la Página
- **Loading**: Muestra spinner mientras carga la información
- **Error**: Muestra mensaje de error si no se puede cargar
- **Sin Empresa**: Muestra mensaje si no hay empresa seleccionada
- **Información Completa**: Muestra todos los datos de la empresa

## 🔧 Archivos Creados/Modificados

### Nuevos Archivos
- `client/src/pages/empresa/AcercaEmpresaPage.tsx` - Página principal

### Archivos Modificados
- `client/src/components/DynamicSidebar.tsx` - Agregada nueva opción al menú
- `client/src/App.tsx` - Agregada nueva ruta

## 📊 Datos Requeridos

La página obtiene la información de la empresa desde:
1. **localStorage**: Para obtener la empresa seleccionada
2. **Base de Datos**: Para obtener información completa de la empresa

### Tabla de Datos
La información se obtiene de la tabla `empresas` con los siguientes campos:
- `id`, `tipo_documento`, `nit`, `regimen_tributario`
- `razon_social`, `direccion`, `ciudad`, `ciudad_nombre`, `departamento_nombre`
- `telefono`, `email`, `representante_legal`
- `actividad_economica`, `actividad_nombre`, `numero_empleados`
- `activo`, `tipo_empresa`, `created_at`, `updated_at`

## 🛡️ Seguridad

- **Ruta Protegida**: Solo usuarios autenticados pueden acceder
- **Validación de Empresa**: Verifica que haya una empresa seleccionada
- **Manejo de Errores**: Gestiona errores de carga de datos

## 🔄 Flujo de Funcionamiento

1. **Usuario accede** a la página `/empresa/acerca`
2. **Sistema verifica** si hay empresa seleccionada en localStorage
3. **Si no hay empresa**: Muestra mensaje de error
4. **Si hay empresa**: Obtiene datos completos desde la base de datos
5. **Muestra información** organizada en cards
6. **Usuario puede navegar** a otras secciones del sistema

## 🎯 Casos de Uso

### Caso 1: Usuario con Empresa Seleccionada
- ✅ Accede a la página
- ✅ Ve información completa de su empresa
- ✅ Puede verificar datos de contacto y legales

### Caso 2: Usuario sin Empresa Seleccionada
- ⚠️ Ve mensaje indicando que debe seleccionar una empresa
- ⚠️ Puede ir a otras secciones para seleccionar empresa

### Caso 3: Error de Carga
- ❌ Ve mensaje de error
- ❌ Puede intentar recargar la página

## 🚀 Próximas Mejoras

### Funcionalidades Futuras
- [ ] **Edición de Datos**: Permitir editar información de la empresa
- [ ] **Historial de Cambios**: Ver historial de modificaciones
- [ ] **Documentos Adjuntos**: Ver documentos de la empresa
- [ ] **Exportar Información**: Descargar datos en PDF/Excel
- [ ] **Notificaciones**: Alertas sobre datos faltantes o expirados

### Mejoras de UX
- [ ] **Búsqueda**: Buscar información específica
- [ ] **Filtros**: Filtrar por tipo de información
- [ ] **Vista Compacta**: Opción de vista resumida
- [ ] **Impresión**: Versión optimizada para imprimir

## 📝 Notas Técnicas

### Dependencias
- React Router para navegación
- Shadcn UI para componentes
- Lucide React para iconos
- Supabase para datos

### Performance
- **Carga Lazy**: Solo carga datos cuando se accede
- **Caching**: Usa datos del localStorage cuando es posible
- **Optimización**: Consulta solo los campos necesarios

### Mantenimiento
- **Código Limpio**: Sin logs de debug en producción
- **Tipado**: TypeScript para mejor mantenibilidad
- **Componentes Reutilizables**: Usa componentes existentes del sistema

---

**Desarrollado por**: Sistema RH Compensamos  
**Fecha**: Julio 2025  
**Versión**: 1.0.0 
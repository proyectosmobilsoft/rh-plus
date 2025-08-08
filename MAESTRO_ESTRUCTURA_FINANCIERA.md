# Maestro de Estructura Financiera

## Descripción

El **Maestro de Estructura Financiera** es una nueva funcionalidad del sistema que permite gestionar la estructura organizacional de la empresa de manera jerárquica, incluyendo regionales, sucursales, proyectos y centros de costo.

Esta funcionalidad está basada en la estructura mostrada en el archivo Excel "Estructura Financiera - Seven ERP/Regionales" proporcionado por el usuario.

## Estructura de Datos

### 1. Regionales
- **Propósito**: Divisiones geográficas principales de la empresa
- **Campos**:
  - Código único (ej: REG-001)
  - Nombre (ej: REGIONAL NORTE)
  - Estado (Activo/Inactivo)
  - Fechas de creación y actualización

### 2. Sucursales
- **Propósito**: Oficinas o puntos de atención por regional
- **Campos**:
  - Código único (ej: 11010001)
  - Nombre (ej: Suc Cali Av Cañasgordas)
  - Regional asociada
  - Estado (Activo/Inactivo)
  - Fechas de creación y actualización

### 3. Proyectos
- **Propósito**: Proyectos o líneas de negocio por regional
- **Campos**:
  - Código único (ej: 110001)
  - Nombre (ej: Consulta Médica Especializada)
  - Regional asociada
  - Estado (Activo/Inactivo)
  - Fechas de creación y actualización

### 4. Centros de Costo
- **Propósito**: Centros de costo específicos por proyecto
- **Campos**:
  - Código único (ej: 110001)
  - Nombre (ej: Consulta Médica Especializada)
  - Proyecto asociado
  - Área de negocio (Administrativo, Comercial, etc.)
  - Porcentaje de estructura (0-100%)
  - Estado (Activo/Inactivo)
  - Fechas de creación y actualización

## Funcionalidades

### 📋 **Gestión por Pestañas**
La interfaz está organizada en 4 pestañas principales:

1. **Regionales**: Gestión de las divisiones regionales
2. **Sucursales**: Gestión de sucursales por regional
3. **Proyectos**: Gestión de proyectos por regional
4. **Centros de Costo**: Gestión de centros de costo por proyecto

### 🔍 **Filtros y Búsqueda**
- **Búsqueda global**: Por nombre o código en todas las pestañas
- **Filtro por regional**: Para sucursales, proyectos y centros de costo
- **Búsqueda en tiempo real**: Los resultados se actualizan automáticamente

### ➕ **Operaciones CRUD**
Cada elemento permite:
- **Crear**: Agregar nuevos elementos con formulario modal
- **Editar**: Modificar elementos existentes
- **Eliminar**: Eliminar elementos (con confirmación)
- **Ver**: Visualizar información detallada

### 👁️ **Vista de Estructura Completa**
- Modal especial que muestra toda la estructura organizacional
- Organizada por regionales con sus respectivos elementos
- Vista jerárquica fácil de entender
- Códigos y porcentajes visibles

### 🎨 **Interfaz Visual**
- **Iconos diferenciados** por tipo de elemento
- **Badges de estado** (Activo/Inactivo)
- **Colores distintivos** para cada tipo:
  - 🔵 Regionales: Azul
  - 🟣 Sucursales: Morado
  - 🟠 Proyectos: Naranja
  - 🔴 Centros de Costo: Rojo

## Navegación

### 🧭 **Ubicación en el Menú**
```
Maestro → Estructura Financiera
```

### 🔗 **Ruta**
```
/maestro/estructura-financiera
```

## Archivos Creados

### 📁 **Servicios**
- `client/src/services/estructuraFinancieraService.ts`
  - Interfaces TypeScript para todos los tipos de datos
  - Servicio completo con métodos CRUD para cada entidad
  - Método para obtener estructura completa
  - Manejo de errores y relaciones entre tablas

### 📁 **Páginas**
- `client/src/pages/maestro/EstructuraFinancieraPage.tsx`
  - Componente principal con interfaz de pestañas
  - Formularios modales para cada tipo de elemento
  - Sistema de filtros y búsqueda
  - Modal de vista completa de estructura
  - Manejo de estados y operaciones CRUD

### 📁 **Base de Datos**
- `estructura_financiera_migration.sql`
  - Script SQL completo para crear todas las tablas
  - Índices para optimizar consultas
  - Políticas RLS (Row Level Security)
  - Datos de ejemplo basados en el Excel
  - Triggers para actualizar fechas automáticamente

### 📁 **Navegación**
- Actualizado `client/src/components/DynamicSidebar.tsx`
- Actualizado `client/src/App.tsx`

## Instalación

### 1. **Ejecutar Migración**
```sql
-- Ejecutar en Supabase SQL Editor
-- Contenido del archivo: estructura_financiera_migration.sql
```

### 2. **Verificar Tablas**
Las siguientes tablas deben crearse:
- `regionales`
- `sucursales` 
- `proyectos`
- `centros_costo`

### 3. **Datos de Ejemplo**
El script incluye datos de ejemplo basados en el Excel:
- 5 regionales (Norte, Centro, Noroccidente, etc.)
- Sucursales de ejemplo de Cali
- Proyectos médicos
- Centros de costo administrativos

## Características Técnicas

### 🔒 **Seguridad**
- **RLS habilitado** en todas las tablas
- **Políticas de acceso** para usuarios autenticados
- **Validación de datos** en formularios

### ⚡ **Performance**
- **Índices optimizados** para consultas frecuentes
- **Carga lazy** de datos relacionados
- **Filtros eficientes** en frontend y backend

### 🔄 **Mantenimiento**
- **Triggers automáticos** para actualizar fechas
- **Códigos únicos** para evitar duplicados
- **Relaciones con cascada** para integridad referencial

## Uso

### 1. **Crear Regional**
1. Ir a pestaña "Regionales"
2. Clic en "Nueva Regional"
3. Completar código y nombre
4. Seleccionar estado
5. Guardar

### 2. **Crear Sucursal**
1. Ir a pestaña "Sucursales"
2. Clic en "Nueva Sucursal"
3. Completar información
4. Seleccionar regional
5. Guardar

### 3. **Ver Estructura Completa**
1. Clic en "Ver Estructura Completa"
2. Se abre modal con vista jerárquica
3. Información organizada por regionales

### 4. **Filtrar y Buscar**
1. Usar caja de búsqueda para filtrar por nombre/código
2. Usar selector de regional para filtrar elementos
3. Los resultados se actualizan automáticamente

## Beneficios

✅ **Organización Clara**: Estructura jerárquica bien definida
✅ **Fácil Navegación**: Interfaz intuitiva con pestañas
✅ **Búsqueda Eficiente**: Filtros múltiples y búsqueda en tiempo real
✅ **Vista Completa**: Modal para ver toda la estructura
✅ **Gestión Completa**: CRUD completo para todos los elementos
✅ **Datos Consistentes**: Códigos únicos y relaciones validadas
✅ **Escalable**: Diseño preparado para crecimiento de la empresa

## Próximas Mejoras

🔮 **Funcionalidades Futuras**:
- Importación masiva desde Excel
- Exportación de estructura a diferentes formatos
- Reportes de estructura financiera
- Gráficos de organigrama visual
- Integración con módulos de facturación
- Historial de cambios en la estructura

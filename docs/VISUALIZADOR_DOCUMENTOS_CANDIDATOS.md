# 📁 Visualizador de Documentos de Candidatos

## 🎯 **Funcionalidad Implementada**

Se ha agregado un nuevo botón en el listado de candidatos que permite visualizar todos los documentos relacionados con un candidato, organizados por empresa.

## 🔧 **Componentes Creados**

### **1. DocumentosCandidatoViewer**
- **Ubicación**: `client/src/components/candidatos/DocumentosCandidatoViewer.tsx`
- **Propósito**: Modal que muestra los documentos del candidato organizados por empresa
- **Características**:
  - ✅ **Organización por empresa**: Los documentos se agrupan por la empresa asociada
  - ✅ **Información detallada**: Muestra nombre del documento, fecha de carga, vigencia
  - ✅ **Estados visuales**: Badges para documentos vencidos, por vencer o vigentes
  - ✅ **Acciones**: Botones para ver y descargar documentos
  - ✅ **Responsive**: Diseño adaptable a diferentes tamaños de pantalla

### **2. Integración en CandidatosPage**
- **Ubicación**: `client/src/pages/registros/CandidatosPage.tsx`
- **Cambios realizados**:
  - ✅ **Nuevo botón**: Icono de carpeta (FolderOpen) en la columna de acciones
  - ✅ **Estado del modal**: Control de apertura/cierre del modal
  - ✅ **Función de apertura**: `handleVerDocumentos()` para abrir el modal
  - ✅ **Permisos**: Integrado con el sistema de permisos

## 🎨 **Interfaz de Usuario**

### **Botón en el Listado**
- **Icono**: 📁 (FolderOpen)
- **Color**: Azul (#2563eb)
- **Tooltip**: "Ver Documentos"
- **Posición**: Entre "Editar" y "Inactivar/Activar"

### **Modal de Documentos**
- **Título**: "Documentos de [Nombre del Candidato]"
- **Estructura**:
  ```
  📁 Documentos de Juan Pérez
  ├── 🏢 Empresa ABC S.A.S. (NIT: 123456789)
  │   ├── 📄 Cédula de Ciudadanía
  │   │   ├── Estado: ✅ Vigente
  │   │   ├── Fecha carga: 15 Ene 2024
  │   │   ├── Vigencia: 15 Ene 2025
  │   │   └── [Ver] [Descargar]
  │   └── 📄 Certificado de Antecedentes
  │       ├── Estado: ⚠️ Por Vencer
  │       ├── Fecha carga: 10 Dic 2023
  │       ├── Vigencia: 10 Feb 2024
  │       └── [Ver] [Descargar]
  └── 🏢 Sin Empresa Asignada
      └── 📄 Hoja de Vida
          ├── Estado: ✅ Vigente
          ├── Fecha carga: 20 Ene 2024
          └── [Ver] [Descargar]
  ```

## 🔐 **Sistema de Permisos**

### **Nuevo Permiso Agregado**
- **Nombre**: `ver_documentos_candidatos`
- **Descripción**: Permite visualizar los documentos de los candidatos

### **Roles con Acceso**
- ✅ **Admin**: Acceso completo
- ✅ **Analista**: Solo visualización
- ✅ **Cliente**: Solo visualización
- ❌ **Candidato**: Sin acceso (solo su información personal)

## 📊 **Funcionalidades del Modal**

### **1. Carga de Datos**
- **Fuente**: Tabla `candidatos_documentos` con JOIN a `tipos_documentos`
- **Filtrado**: Por `candidato_id`
- **Ordenamiento**: Por fecha de carga (más recientes primero)

### **2. Agrupación por Empresa**
- **Lógica**: Obtiene `empresa_id` desde la tabla `candidatos`
- **JOIN**: Con tabla `empresas` para obtener `razon_social` y `nit`
- **Fallback**: Documentos sin empresa se agrupan en "Sin Empresa Asignada"

### **3. Estados de Documentos**
- **🟢 Vigente**: Documento válido y no próximo a vencer
- **🟡 Por Vencer**: Documento que vence en los próximos 30 días
- **🔴 Vencido**: Documento que ya expiró

### **4. Acciones Disponibles**
- **👁️ Ver**: Abre el documento en una nueva pestaña
- **⬇️ Descargar**: Descarga el archivo al dispositivo

## 🛠️ **Implementación Técnica**

### **Servicios Utilizados**
```typescript
// Obtener documentos con detalles
candidatosDocumentosService.getByCandidatoWithDetails(candidatoId)

// Obtener información de empresa
supabase.from('candidatos').select('empresa_id, empresas(*)')
```

### **Estructura de Datos**
```typescript
interface DocumentosPorEmpresa {
  empresa: {
    id: number;
    razon_social: string;
    nit: string;
  };
  documentos: CandidatoDocumentoConDetalles[];
}
```

### **Estados del Componente**
```typescript
const [documentosPorEmpresa, setDocumentosPorEmpresa] = useState<DocumentosPorEmpresa[]>([]);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

## 🎯 **Casos de Uso**

### **1. Administrador**
- Ver todos los documentos de cualquier candidato
- Identificar documentos vencidos o próximos a vencer
- Descargar documentos para revisión

### **2. Analista**
- Revisar documentos de candidatos asignados
- Verificar vigencia de documentos
- Acceder a información completa del candidato

### **3. Cliente**
- Ver documentos de sus candidatos
- Verificar estado de documentación
- Descargar documentos para sus procesos

## 🚀 **Beneficios**

1. **📋 Organización**: Documentos agrupados por empresa para fácil navegación
2. **⏰ Control de Vigencia**: Estados visuales para documentos vencidos/próximos a vencer
3. **🔍 Acceso Rápido**: Un clic para ver o descargar cualquier documento
4. **📱 Responsive**: Funciona en dispositivos móviles y desktop
5. **🔐 Seguro**: Integrado con sistema de permisos
6. **🎨 Intuitivo**: Interfaz clara y fácil de usar

## 📝 **Próximas Mejoras Sugeridas**

1. **🔍 Filtros**: Agregar filtros por tipo de documento o estado
2. **📊 Estadísticas**: Mostrar resumen de documentos por estado
3. **📧 Notificaciones**: Alertas para documentos próximos a vencer
4. **📤 Exportar**: Función para exportar lista de documentos
5. **🔄 Actualizar**: Botón para refrescar la lista de documentos

---

**¡La funcionalidad está lista para usar!** 🎉

Los usuarios con los permisos adecuados ahora pueden visualizar y gestionar los documentos de los candidatos de manera organizada y eficiente.

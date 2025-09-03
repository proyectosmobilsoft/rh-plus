# 📄 Modal de Visualización de Documentos

## 🎯 **Problema Identificado**

El botón de "Ver documento" abría una página que no existía en lugar de mostrar el documento directamente en la aplicación.

## ✅ **Solución Implementada**

### **1. Modal de Visualización Interno**

Se implementó un modal que muestra el documento directamente dentro de la aplicación:

```typescript
// Estado para el modal de visualización
const [modalVisualizacionOpen, setModalVisualizacionOpen] = useState(false);
const [documentoSeleccionado, setDocumentoSeleccionado] = useState<any>(null);

// Función para abrir el modal
const handleView = (documento: any) => {
  if (documento.url_archivo) {
    setDocumentoSeleccionado(documento);
    setModalVisualizacionOpen(true);
    toast.success(`Abriendo ${documento.nombre_archivo}`);
  } else {
    toast.error('No hay archivo disponible para visualizar');
  }
};
```

### **2. Contenedores de Empresa Colapsables**

Se implementó un sistema de colapso para las empresas cuando hay múltiples:

```typescript
// Estado para empresas expandidas
const [empresasExpandidas, setEmpresasExpandidas] = useState<Set<number>>(new Set());

// Función para manejar el colapso
const toggleEmpresa = (empresaId: number) => {
  const nuevasEmpresasExpandidas = new Set(empresasExpandidas);
  if (nuevasEmpresasExpandidas.has(empresaId)) {
    nuevasEmpresasExpandidas.delete(empresaId);
  } else {
    nuevasEmpresasExpandidas.add(empresaId);
  }
  setEmpresasExpandidas(nuevasEmpresasExpandidas);
};
```

## 🔧 **Funcionalidades Implementadas**

### **1. Modal de Visualización**

```tsx
<Dialog open={modalVisualizacionOpen} onOpenChange={setModalVisualizacionOpen}>
  <DialogContent className="max-w-4xl max-h-[90vh] p-0">
    <DialogHeader className="p-6 pb-4 border-b">
      <div className="flex items-center justify-between">
        <DialogTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          {documentoSeleccionado?.nombre_archivo || 'Visualizar Documento'}
        </DialogTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setModalVisualizacionOpen(false)}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </DialogHeader>
    
    <div className="p-6">
      {documentoSeleccionado?.url_archivo ? (
        <div className="w-full h-[70vh] border rounded-lg overflow-hidden">
          <iframe
            src={documentoSeleccionado.url_archivo}
            className="w-full h-full"
            title={documentoSeleccionado.nombre_archivo}
          />
        </div>
      ) : (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No hay archivo disponible para visualizar</p>
          </div>
        </div>
      )}
    </div>
  </DialogContent>
</Dialog>
```

### **2. Empresas Colapsables**

```tsx
<Collapsible 
  open={empresasExpandidas.has(grupo.empresa.id)}
  onOpenChange={() => toggleEmpresa(grupo.empresa.id)}
>
  <CollapsibleTrigger asChild>
    <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
      <CardTitle className="flex items-center justify-between text-lg">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-blue-600" />
          {grupo.empresa.razon_social}
          {grupo.empresa.nit !== 'N/A' && (
            <Badge variant="outline" className="ml-2">
              NIT: {grupo.empresa.nit}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {grupo.documentos.length} documento{grupo.documentos.length !== 1 ? 's' : ''}
          </Badge>
          {empresasExpandidas.has(grupo.empresa.id) ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </CardTitle>
    </CardHeader>
  </CollapsibleTrigger>
  
  <CollapsibleContent>
    <CardContent className="pt-0">
      {/* Contenido de documentos */}
    </CardContent>
  </CollapsibleContent>
</Collapsible>
```

## 🎨 **Mejoras de UX**

### **1. Expansión Automática**
- **Una empresa**: Se expande automáticamente
- **Múltiples empresas**: Se expande la primera automáticamente
- **Indicadores visuales**: Chevron que cambia según el estado

### **2. Modal de Visualización**
- **Tamaño optimizado**: `max-w-4xl` y `max-h-[90vh]`
- **Iframe integrado**: Muestra el documento directamente
- **Botón de cierre**: Fácil acceso para cerrar el modal
- **Título dinámico**: Muestra el nombre del archivo

### **3. Interacciones Mejoradas**
- **Hover effects**: En los encabezados de empresa
- **Transiciones suaves**: Para el colapso/expansión
- **Feedback visual**: Toasts informativos

## 📊 **Estados de la Aplicación**

### **1. Estados de Empresas**
```typescript
// Empresas expandidas
const [empresasExpandidas, setEmpresasExpandidas] = useState<Set<number>>(new Set());

// Lógica de expansión automática
if (documentosAgrupados.length > 1) {
  setEmpresasExpandidas(new Set([documentosAgrupados[0].empresa.id]));
} else if (documentosAgrupados.length === 1) {
  setEmpresasExpandidas(new Set([documentosAgrupados[0].empresa.id]));
}
```

### **2. Estados del Modal**
```typescript
// Modal de visualización
const [modalVisualizacionOpen, setModalVisualizacionOpen] = useState(false);
const [documentoSeleccionado, setDocumentoSeleccionado] = useState<any>(null);
```

## 🚀 **Ventajas de la Implementación**

### **1. Experiencia de Usuario**
- ✅ **Visualización interna**: No abre páginas externas
- ✅ **Navegación fluida**: Modal integrado en la aplicación
- ✅ **Organización clara**: Empresas colapsables para mejor organización
- ✅ **Acceso rápido**: Expansión automática de la primera empresa

### **2. Funcionalidad Técnica**
- ✅ **Iframe integrado**: Soporte para base64 y URLs
- ✅ **Responsive**: Se adapta al tamaño de pantalla
- ✅ **Manejo de errores**: Fallback cuando no hay archivo
- ✅ **Performance**: Carga solo cuando se necesita

### **3. Interfaz Intuitiva**
- ✅ **Indicadores visuales**: Chevrons para mostrar estado
- ✅ **Hover effects**: Feedback visual en interacciones
- ✅ **Badges informativos**: Contador de documentos por empresa
- ✅ **Botón de cierre**: Fácil acceso para cerrar el modal

## 🎯 **Resultado Final**

### **✅ Funcionalidades Implementadas**
1. **Modal de visualización**: Muestra documentos directamente en la app
2. **Empresas colapsables**: Organización mejorada cuando hay múltiples empresas
3. **Expansión automática**: Primera empresa se expande automáticamente
4. **Iframe integrado**: Soporte completo para base64 y URLs
5. **Interfaz intuitiva**: Indicadores visuales y transiciones suaves

### **🎨 Mejoras de UX**
- **Navegación interna**: No abre páginas externas
- **Organización clara**: Empresas colapsables para mejor gestión
- **Acceso rápido**: Expansión automática para facilitar el uso
- **Feedback visual**: Toasts y efectos hover informativos

### **🔧 Mejoras Técnicas**
- **Componentes reutilizables**: Collapsible y Dialog de shadcn/ui
- **Estado optimizado**: Gestión eficiente de empresas expandidas
- **Manejo de errores**: Fallbacks para casos sin archivo
- **Performance**: Carga condicional del modal

---

**¡El modal de visualización y las empresas colapsables ahora funcionan perfectamente!** 🎉

Los usuarios pueden ver documentos directamente en la aplicación y organizar mejor las empresas cuando hay múltiples.

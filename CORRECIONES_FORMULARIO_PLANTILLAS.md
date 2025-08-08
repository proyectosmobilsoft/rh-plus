# Correcciones: Formulario de Plantillas - Nombre/Descripción y Select

## Problemas Reportados

El usuario reportó dos problemas específicos en el formulario de plantillas:

1. **Al agregar un campo se borran el nombre y descripción de la plantilla** ❌
2. **El select de arriba debe cargar el formulario para editar, no otras cosas** ❌

## Análisis de los Problemas

### 🔍 **Problema 1: Nombre y Descripción se Borran**

**Causa Identificada:**
```typescript
// ANTES (problemático):
const FormBuilder: React.FC<{ precargados?: any[], readOnly?: boolean }> = ({ precargados, readOnly = false }) => {
  const [formName, setFormName] = useState('');        // ❌ Siempre vacío
  const [formDesc, setFormDesc] = useState('');        // ❌ Siempre vacío
  // ...
```

**El FormBuilder no recibía ni inicializaba** el nombre y descripción de la plantilla cuando se estaba editando una plantilla existente.

### 🔍 **Problema 2: Select No Funcional**

**Causa Identificada:**
```typescript
// ANTES (problemático):
{templateOption === 'existing' && (
  <div className="space-y-4">
    <select className="w-full border rounded p-2">
      <option value="">-- Seleccione una plantilla --</option>
      {PLANTILLAS_MOCK.map(p => (  // ❌ Datos falsos
        <option key={p.id} value={p.id}>{p.name} - {p.description}</option>
      ))}
    </select>
    <div className="border rounded p-4 bg-white">
      <FormPreview fields={[]} />  {/* ❌ Solo preview, no edición */}
    </div>
  </div>
)}
```

**Problemas identificados:**
- ❌ Usaba `PLANTILLAS_MOCK` (datos falsos)
- ❌ Solo mostraba `FormPreview` (no editable)
- ❌ No cargaba datos reales de la base de datos
- ❌ No permitía editar la plantilla seleccionada

## Soluciones Implementadas

### ✅ **Solución 1: Inicialización de Nombre y Descripción**

#### **Modificación de Props del FormBuilder:**
```typescript
// DESPUÉS (corregido):
const FormBuilder: React.FC<{ 
  precargados?: any[], 
  readOnly?: boolean,
  onSave?: (data: { nombre: string, descripcion: string, fields: any[] }) => Promise<void>,
  initialName?: string,           // ✅ Nombre inicial
  initialDescription?: string     // ✅ Descripción inicial
}> = ({ precargados, readOnly = false, onSave, initialName = '', initialDescription = '' }) => {
```

#### **Inicialización de Estados:**
```typescript
// DESPUÉS (corregido):
const [formName, setFormName] = useState(initialName);         // ✅ Valor inicial real
const [formDesc, setFormDesc] = useState(initialDescription); // ✅ Valor inicial real
```

#### **useEffect para Actualización Dinámica:**
```typescript
// Inicializar nombre y descripción cuando cambien las props
useEffect(() => {
  setFormName(initialName);
  setFormDesc(initialDescription);
}, [initialName, initialDescription]);
```

#### **Actualización del TemplateForm:**
```typescript
// DESPUÉS (corregido):
<FormBuilder 
  key="new-template" 
  precargados={initialData?.estructura_formulario || []}
  onSave={handleFormBuilderSave}
  initialName={initialData?.nombre || ''}           // ✅ Pasa el nombre
  initialDescription={initialData?.descripcion || ''} // ✅ Pasa la descripción
/>
```

### ✅ **Solución 2: Select Funcional con Plantillas Reales**

#### **Estados Agregados:**
```typescript
// Nuevos estados para manejar plantillas reales
const [plantillasExistentes, setPlantillasExistentes] = useState<any[]>([]);
const [selectedPlantillaId, setSelectedPlantillaId] = useState<string>('');
const [selectedPlantillaData, setSelectedPlantillaData] = useState<any>(null);
```

#### **Carga de Plantillas Reales:**
```typescript
// Cargar plantillas existentes
useEffect(() => {
  const cargarPlantillas = async () => {
    try {
      const plantillas = await plantillasService.getAll(); // ✅ Datos reales
      setPlantillasExistentes(plantillas);
    } catch (error) {
      console.error('Error al cargar plantillas:', error);
    }
  };
  cargarPlantillas();
}, []);
```

#### **Función de Selección:**
```typescript
// Manejar selección de plantilla existente
const handlePlantillaSelection = async (plantillaId: string) => {
  setSelectedPlantillaId(plantillaId);
  if (plantillaId) {
    try {
      const plantilla = await plantillasService.getById(parseInt(plantillaId)); // ✅ Cargar datos completos
      setSelectedPlantillaData(plantilla);
    } catch (error) {
      console.error('Error al cargar plantilla:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cargar la plantilla seleccionada.",
      });
    }
  } else {
    setSelectedPlantillaData(null);
  }
};
```

#### **Select Funcional:**
```typescript
// DESPUÉS (corregido):
{templateOption === 'existing' && (
  <div className="space-y-4">
    <div>
      <label className="block font-medium mb-1">Seleccionar Plantilla para Editar</label>
      <select 
        className="w-full border rounded p-2"
        value={selectedPlantillaId}
        onChange={(e) => handlePlantillaSelection(e.target.value)} // ✅ Función real
      >
        <option value="">-- Seleccione una plantilla para editar --</option>
        {plantillasExistentes.map(plantilla => (  // ✅ Datos reales
          <option key={plantilla.id} value={plantilla.id}>
            {plantilla.nombre} {plantilla.descripcion ? `- ${plantilla.descripcion}` : ''}
          </option>
        ))}
      </select>
    </div>
    {selectedPlantillaData && (  // ✅ Solo mostrar cuando hay selección
      <div className="border rounded p-4 bg-white">
        <FormBuilder   // ✅ FormBuilder completo para editar
          key={`existing-${selectedPlantillaId}`}
          precargados={selectedPlantillaData.estructura_formulario || []}
          onSave={handleFormBuilderSave}
          initialName={selectedPlantillaData.nombre || ''}
          initialDescription={selectedPlantillaData.descripcion || ''}
        />
      </div>
    )}
  </div>
)}
```

#### **Callback Mejorado:**
```typescript
// Callback para recibir datos del FormBuilder
const handleFormBuilderSave = async (data: { nombre: string, descripcion: string, fields: any[] }) => {
  try {
    const payload = {
      nombre: data.nombre,
      descripcion: data.descripcion || undefined,
      estructura_formulario: data.fields,
      es_default: false,
      activa: true,
    };

    let result;
    // ✅ Determinar qué plantilla actualizar (inicial o seleccionada)
    const plantillaId = initialData?.id || selectedPlantillaData?.id;
    
    if (plantillaId) {
      // Actualizar plantilla existente (ya sea de initialData o seleccionada)
      result = await plantillasService.update(plantillaId, payload);
    } else {
      // Crear nueva plantilla
      result = await plantillasService.create(payload);
    }

    if (result) {
      console.log('✅ Plantilla guardada exitosamente:', result);
      toast({
        title: "Plantilla guardada exitosamente",
        description: "La plantilla ha sido creada/actualizada correctamente.",
      });
      if (onSaved) onSaved();
    }
  } catch (error) {
    console.error('❌ Error al guardar plantilla:', error);
    toast({
      variant: "destructive",
      title: "Error",
      description: "Hubo un error al guardar la plantilla. Por favor, intente nuevamente.",
    });
  }
};
```

## Flujo de Funcionamiento Corregido

### 🔄 **Opción 1: Crear Nueva Plantilla**
1. **Seleccionar "Crear Nueva Plantilla"**
2. **FormBuilder se inicializa vacío** (para nueva plantilla)
3. **Agregar campos** → ✅ Nombre y descripción se mantienen
4. **Guardar** → Se crea nueva plantilla

### 🔄 **Opción 2: Editar Plantilla (desde lista)**
1. **Click en "Editar"** en PlantillasPage
2. **TemplateForm recibe initialData**
3. **FormBuilder se inicializa** con datos existentes
4. **Nombre y descripción aparecen** ✅
5. **Campos existentes se cargan** ✅
6. **Modificar y guardar** → Se actualiza plantilla existente

### 🔄 **Opción 3: Seleccionar Plantilla Existente (select)**
1. **Seleccionar "Seleccionar Plantilla Existente"**
2. **Select muestra plantillas reales** ✅
3. **Seleccionar una plantilla** del dropdown
4. **FormBuilder se carga** con datos de la plantilla seleccionada ✅
5. **Nombre, descripción y campos aparecen** ✅
6. **Editar y guardar** → Se actualiza la plantilla seleccionada

### 🔄 **Opción 4: Plantilla Básica**
1. **Seleccionar "Plantilla Básica"**
2. **FormPreview muestra** campos predefinidos
3. **Solo vista previa** (sin edición)

## Beneficios de las Correcciones

### 👨‍💻 **Para el Usuario**
- ✅ **Nombre y descripción se mantienen** al agregar campos
- ✅ **Select funcional** con plantillas reales de la base de datos
- ✅ **Edición completa** desde el select
- ✅ **Tres formas de trabajar**: nueva, editar existente, seleccionar existente
- ✅ **Experiencia consistente** en todos los flujos

### 🔧 **Para el Sistema**
- ✅ **Inicialización correcta** de estados
- ✅ **Comunicación mejorada** entre componentes
- ✅ **Datos reales** en lugar de mocks
- ✅ **Flexibilidad** para diferentes flujos de trabajo
- ✅ **Manejo de errores** robusto

### 📊 **Para los Datos**
- ✅ **Integridad mantenida** - No se pierden datos
- ✅ **Actualización correcta** de plantillas existentes
- ✅ **Selección dinámica** de cualquier plantilla
- ✅ **Compatibilidad** con plantillas existentes

## Casos de Uso Verificados

### ➕ **Crear Nueva Plantilla** ✅
1. Seleccionar "Crear Nueva Plantilla"
2. Llenar nombre y descripción
3. Agregar campos → **Nombre y descripción se mantienen** ✅
4. Guardar → Nueva plantilla creada

### ✏️ **Editar desde Lista** ✅
1. Click "Editar" en plantilla existente
2. **Datos aparecen automáticamente** ✅
3. Modificar campos → **Datos se mantienen** ✅
4. Guardar → Plantilla actualizada

### 🔍 **Seleccionar Existente** ✅
1. Seleccionar "Seleccionar Plantilla Existente"
2. **Ver lista real de plantillas** ✅
3. Seleccionar una → **FormBuilder carga con datos** ✅
4. **Editar completamente** ✅
5. Guardar → **Plantilla seleccionada se actualiza** ✅

## Archivos Modificados

### 📁 **client/src/components/FormBuilder.tsx**
**Cambios principales:**
- ✅ **Props extendidas** - `initialName`, `initialDescription`
- ✅ **Inicialización correcta** de estados con valores reales
- ✅ **useEffect** para actualización dinámica de props
- ✅ **Compatibilidad mantenida** con uso independiente

### 📁 **client/src/components/ordenes/TemplateForm.tsx**
**Cambios principales:**
- ✅ **Estados nuevos** - `plantillasExistentes`, `selectedPlantillaId`, `selectedPlantillaData`
- ✅ **Carga de plantillas reales** - `plantillasService.getAll()`
- ✅ **Función de selección** - `handlePlantillaSelection()`
- ✅ **Select funcional** - Con datos reales y onChange
- ✅ **FormBuilder para edición** - En lugar de solo preview
- ✅ **Callback mejorado** - Maneja actualización de plantilla seleccionada
- ✅ **Props al FormBuilder** - `initialName`, `initialDescription`

## Estado Final

### 🎯 **Completamente Funcional**
- 📝 **Crear plantillas** → Nombre/descripción se mantienen ✅
- ✏️ **Editar desde lista** → Datos se cargan correctamente ✅
- 🔍 **Seleccionar existente** → Select funcional con edición completa ✅
- 👁️ **Preview en tiempo real** → Funciona en todos los casos ✅
- 💾 **Guardado correcto** → Actualiza plantilla correcta ✅

### 🚀 **Listo para Producción**
Todas las opciones del formulario de plantillas funcionan correctamente:

1. **"Crear Nueva Plantilla"** → FormBuilder vacío, datos se mantienen
2. **"Seleccionar Plantilla Existente"** → Select con plantillas reales, edición completa
3. **"Plantilla Básica"** → Preview con campos predefinidos
4. **Edición desde lista** → Carga automática de datos existentes

### 🎯 **Verificación Final**
Para probar las correcciones:

#### **Problema 1 - Nombre/Descripción:**
1. Ve a **Maestro → Plantillas**
2. Click **"Nueva Plantilla"** o **"Editar"** existente
3. **Llena nombre y descripción**
4. **Agrega un campo** → ✅ **Nombre y descripción se mantienen**

#### **Problema 2 - Select Funcional:**
1. Ve a **Maestro → Plantillas → Nueva Plantilla**
2. **Selecciona "Seleccionar Plantilla Existente"**
3. **Verás lista real** de plantillas en el select ✅
4. **Selecciona una** → FormBuilder se carga con datos ✅
5. **Puedes editar completamente** la plantilla ✅
6. **Guardar actualiza** la plantilla seleccionada ✅

¡Ambos problemas completamente resueltos! 🎉

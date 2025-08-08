import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { X, Check, ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { TemplateBasicInfo } from "./form/TemplateBasicInfo";
import { TemplatePreview } from "./form/TemplatePreview";
import * as React from "react";
const { useEffect, useState, useRef } = React;
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import FormBuilder from "@/components/FormBuilder";
import FormPreview from "@/components/FormPreview";
import { useMemo } from "react";
import { v4 as uuidv4 } from 'uuid';
import { plantillasService } from '@/services/plantillasService';

// Definir los campos disponibles para plantillas de órdenes
const CAMPOS_DISPONIBLES = [
  { key: "nombreTrabajador", label: "Nombre del Trabajador", description: "Nombre completo del trabajador" },
  { key: "cedulaTrabajador", label: "Cédula del Trabajador", description: "Número de identificación" },
  { key: "empresaSeleccionada", label: "Empresa", description: "Empresa contratante" },
  { key: "cargoTrabajador", label: "Cargo", description: "Posición del trabajador" },
  { key: "fechaIngreso", label: "Fecha de Ingreso", description: "Fecha prevista de ingreso" },
  { key: "jornadaLaboral", label: "Jornada Laboral", description: "Horarios de trabajo" },
  { key: "salario", label: "Salario", description: "Salario del trabajador" },
  { key: "celular", label: "Celular", description: "Número de contacto" },
  { key: "correo", label: "Correo Electrónico", description: "Email de contacto" },
  { key: "direccion", label: "Dirección", description: "Dirección de residencia" },
  { key: "tipoExamen", label: "Tipo de Examen", description: "Tipo de examen médico" },
  { key: "observaciones", label: "Observaciones", description: "Notas adicionales" }
];

// Plantillas mock globales (en memoria)
const PLANTILLAS_MOCK = [
  { id: 1, name: "Plantilla de Ingreso", description: "Campos para ingreso de personal" },
  { id: 2, name: "Plantilla de Seguridad", description: "Campos de seguridad industrial" },
  { id: 3, name: "Plantilla de Salud", description: "Campos de salud ocupacional" },
];

// Definir los campos precargados para la plantilla básica
const camposBasicos = [
  { id: uuidv4(), type: 'text', label: 'Nombre del Trabajador', name: 'nombreTrabajador', required: true, order: 1, dimension: 6 },
  { id: uuidv4(), type: 'text', label: 'Cédula del Trabajador', name: 'cedulaTrabajador', required: true, order: 2, dimension: 6 },
  { id: uuidv4(), type: 'text', label: 'Cargo', name: 'cargoTrabajador', required: true, order: 3, dimension: 6 },
  { id: uuidv4(), type: 'date', label: 'Fecha de Ingreso', name: 'fechaIngreso', required: true, order: 4, dimension: 6 },
  { id: uuidv4(), type: 'text', label: 'Salario', name: 'salario', required: true, order: 5, dimension: 6 },
  { id: uuidv4(), type: 'text', label: 'Celular', name: 'celular', required: true, order: 6, dimension: 6 },
  { id: uuidv4(), type: 'email', label: 'Correo Electrónico', name: 'correo', required: true, order: 7, dimension: 12 },
  { id: uuidv4(), type: 'textarea', label: 'Dirección', name: 'direccion', required: true, order: 8, dimension: 12 },
  { id: uuidv4(), type: 'select', label: 'Tipo de Examen', name: 'tipoExamen', required: true, order: 9, dimension: 6, options: 'Preocupacional, Periódico, Retiro, Especial' },
  { id: uuidv4(), type: 'textarea', label: 'Observaciones', name: 'observaciones', required: false, order: 10, dimension: 12 },
];

interface TemplateFormProps {
  initialData?: any;
  onSaved?: () => void;
}

export function TemplateForm({ initialData, onSaved }: TemplateFormProps) {
  const { toast } = useToast();
  const [templateOption, setTemplateOption] = useState<'new' | 'existing' | 'basic'>('new');
  const [currentTab, setCurrentTab] = useState('datos-plantilla');
  const [fieldConfig, setFieldConfig] = useState<Record<string, { visible: boolean; required: boolean }>>({});
  const [formBuilderData, setFormBuilderData] = useState<{ nombre: string, descripcion: string, fields: any[] } | null>(null);
  const [plantillasExistentes, setPlantillasExistentes] = useState<any[]>([]);
  const [selectedPlantillaId, setSelectedPlantillaId] = useState<string>('');
  const [selectedPlantillaData, setSelectedPlantillaData] = useState<any>(null);
  const [formBuilderFields, setFormBuilderFields] = useState<any[]>([]);
  
  // Estado para plantillas asignadas
  const [plantillasAsignadas, setPlantillasAsignadas] = useState<number[]>(
    (initialData as any)?.plantillas?.map((p: any) => p.id) || []
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Cerrar el dropdown al hacer clic fuera de él
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Inicializar configuración de campos
  useEffect(() => {
    const initialConfig: Record<string, { visible: boolean; required: boolean }> = {};
    CAMPOS_DISPONIBLES.forEach(campo => {
      initialConfig[campo.key] = { visible: true, required: false };
    });
    setFieldConfig(initialConfig);
  }, []);

  // Cargar plantillas existentes
  useEffect(() => {
    const cargarPlantillas = async () => {
      try {
        const plantillas = await plantillasService.getAll();
        setPlantillasExistentes(plantillas);
      } catch (error) {
        console.error('Error al cargar plantillas:', error);
      }
    };
    cargarPlantillas();
  }, []);

  const form = useForm({
    defaultValues: {
      nombre: initialData?.nombre || "",
      descripcion: initialData?.descripcion || "",
      esDefault: initialData?.es_default || false,
      activo: initialData?.activa !== undefined ? initialData.activa : true,
      configuracionCampos: {}
    }
  });

  const onSubmit = async (data: any) => {
    try {
      // Determinar qué estructura usar según el tipo de plantilla
      let estructuraFormulario;
      
      if (templateOption === 'new' && formBuilderFields.length > 0) {
        // Usar campos del FormBuilder
        estructuraFormulario = formBuilderFields;
      } else if (templateOption === 'existing' && selectedPlantillaData) {
        // Usar campos de la plantilla seleccionada (pueden haber sido editados)
        estructuraFormulario = formBuilderFields.length > 0 ? formBuilderFields : selectedPlantillaData.estructura_formulario;
      } else if (templateOption === 'basic') {
        // Usar configuración de campos básicos
        estructuraFormulario = fieldConfig;
      } else {
        // Fallback a configuración de campos
        estructuraFormulario = fieldConfig;
      }

      // Validar que hay campos
      if (!estructuraFormulario || (Array.isArray(estructuraFormulario) && estructuraFormulario.length === 0)) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Por favor agregue al menos un campo a la plantilla.",
        });
        return;
      }

      // Preparar datos para Supabase
      const payload = {
        nombre: data.nombre,
        descripcion: data.descripcion,
        es_default: data.esDefault || false,
        estructura_formulario: estructuraFormulario,
        activa: true,
      };

      // Determinar qué plantilla actualizar
      const plantillaId = initialData?.id || selectedPlantillaData?.id;
      
      if (plantillaId) {
        await plantillasService.update(plantillaId, payload);
      } else {
        await plantillasService.create(payload);
      }

      toast({
        title: "Plantilla guardada exitosamente",
        description: "La plantilla ha sido creada/actualizada correctamente.",
      });
      if (onSaved) {
        onSaved();
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Hubo un error al procesar la solicitud. Por favor, intente nuevamente.",
      });
    }
  };

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
      // Determinar qué plantilla actualizar
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
      } else {
        throw new Error('No se pudo guardar la plantilla');
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

  // Manejar selección de plantilla existente
  const handlePlantillaSelection = async (plantillaId: string) => {
    setSelectedPlantillaId(plantillaId);
    if (plantillaId) {
      try {
        const plantilla = await plantillasService.getById(parseInt(plantillaId));
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

  const handleFieldConfigChange = (fieldKey: string, property: 'visible' | 'required', value: boolean) => {
    setFieldConfig(prev => ({
      ...prev,
      [fieldKey]: {
        ...prev[fieldKey],
        [property]: value
      }
    }));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs 
          value={currentTab} 
          onValueChange={setCurrentTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="datos-plantilla">Datos de la Plantilla</TabsTrigger>
            <TabsTrigger value="configuracion">Configuración de Campos</TabsTrigger>
            <TabsTrigger value="vista-previa">Vista Previa</TabsTrigger>
          </TabsList>
          
          <TabsContent value="datos-plantilla">
            <Card>
              <CardContent className="pt-6">
                <div className="grid gap-6">
                  <TemplateBasicInfo form={form} />
                  
                  <div>
                    <label className="block font-medium mb-1">Tipo de Plantilla</label>
                    <select
                      value={templateOption}
                      onChange={(e) => setTemplateOption(e.target.value as 'new' | 'existing' | 'basic')}
                      className="w-full border rounded p-2"
                    >
                      <option value="new">Crear Nueva Plantilla</option>
                      <option value="existing">Seleccionar Plantilla Existente</option>
                      <option value="basic">Plantilla Básica</option>
                    </select>
                  </div>

                  {templateOption === 'new' && (
                    <div className="border rounded p-4 bg-white">
                      <FormBuilder 
                        key="new-template" 
                        precargados={initialData?.estructura_formulario || []}
                        onSave={handleFormBuilderSave}
                        initialName={initialData?.nombre || ''}
                        initialDescription={initialData?.descripcion || ''}
                        onFieldsChange={setFormBuilderFields}
                        hideInternalSaveButton={true}
                      />
                    </div>
                  )}

                  {templateOption === 'existing' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block font-medium mb-1">Seleccionar Plantilla para Editar</label>
                        <select 
                          className="w-full border rounded p-2"
                          value={selectedPlantillaId}
                          onChange={(e) => handlePlantillaSelection(e.target.value)}
                        >
                          <option value="">-- Seleccione una plantilla para editar --</option>
                          {plantillasExistentes.map(plantilla => (
                            <option key={plantilla.id} value={plantilla.id}>
                              {plantilla.nombre} {plantilla.descripcion ? `- ${plantilla.descripcion}` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                      {selectedPlantillaData && (
                        <div className="border rounded p-4 bg-white">
                          <FormBuilder 
                            key={`existing-${selectedPlantillaId}`}
                            precargados={selectedPlantillaData.estructura_formulario || []}
                            onSave={handleFormBuilderSave}
                            initialName={selectedPlantillaData.nombre || ''}
                            initialDescription={selectedPlantillaData.descripcion || ''}
                            onFieldsChange={setFormBuilderFields}
                            hideInternalSaveButton={true}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {templateOption === 'basic' && (
                    <div className="border rounded p-4 bg-white">
                      <FormBuilder 
                        key="basic-template" 
                        precargados={camposBasicos}
                        onSave={handleFormBuilderSave}
                        initialName=""
                        initialDescription=""
                        onFieldsChange={setFormBuilderFields}
                        hideInternalSaveButton={true}
                      />
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button type="submit">
                      {initialData ? "Actualizar Plantilla" : "Crear Plantilla"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="configuracion">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Configuración de Campos</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Selecciona qué campos estarán disponibles en esta plantilla y cuáles serán obligatorios.
                  </p>
                  
                  <div className="grid gap-4">
                    {CAMPOS_DISPONIBLES.map((campo) => {
                      const config = fieldConfig[campo.key] || { visible: false, required: false };
                      return (
                        <div key={campo.key} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                checked={config.visible}
                                onChange={(e) => handleFieldConfigChange(campo.key, 'visible', e.target.checked)}
                                className="h-4 w-4"
                              />
                              <div>
                                <label className="text-sm font-medium">{campo.label}</label>
                                <p className="text-xs text-gray-500">{campo.description}</p>
                              </div>
                            </div>
                          </div>
                          {config.visible && (
                            <div className="flex items-center space-x-2">
                              <label className="text-xs">Obligatorio</label>
                              <input
                                type="checkbox"
                                checked={config.required}
                                onChange={(e) => handleFieldConfigChange(campo.key, 'required', e.target.checked)}
                                className="h-4 w-4"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="vista-previa">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Vista Previa de la Plantilla</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Así se verá el formulario con la configuración actual.
                  </p>
                  
                  <div className="border rounded p-4 bg-gray-50">
                    <TemplatePreview configuracion={fieldConfig} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </Form>
  );
} 
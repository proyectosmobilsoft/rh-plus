import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { X, Check, ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { TemplateBasicInfo } from "./form/TemplateBasicInfo";

import * as React from "react";
const { useEffect, useState, useRef } = React;

import FormBuilder from "@/components/FormBuilder";

import { useMemo } from "react";
import { v4 as uuidv4 } from 'uuid';
import { plantillasService } from '@/services/plantillasService';
import { toast } from "sonner";

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
  // Primera fila: campos de identificación (6 columnas cada uno)
  { id: uuidv4(), type: 'text', label: 'Nombre del Trabajador', name: 'nombreTrabajador', required: true, order: 1, dimension: 6 },
  { id: uuidv4(), type: 'text', label: 'Cédula del Trabajador', name: 'cedulaTrabajador', required: true, order: 2, dimension: 6 },
  
  // Segunda fila: cargo y fecha (6 columnas cada uno)
  { id: uuidv4(), type: 'text', label: 'Cargo', name: 'cargoTrabajador', required: true, order: 3, dimension: 6 },
  { id: uuidv4(), type: 'date', label: 'Fecha de Ingreso', name: 'fechaIngreso', required: true, order: 4, dimension: 6 },
  
  // Tercera fila: salario y celular (6 columnas cada uno)
  { id: uuidv4(), type: 'text', label: 'Salario', name: 'salario', required: true, order: 5, dimension: 6 },
  { id: uuidv4(), type: 'text', label: 'Celular', name: 'celular', required: true, order: 6, dimension: 6 },
  
  // Cuarta fila: correo (12 columnas - ancho completo)
  { id: uuidv4(), type: 'email', label: 'Correo Electrónico', name: 'correo', required: true, order: 7, dimension: 12 },
  
  // Quinta fila: dirección (12 columnas - ancho completo)
  { id: uuidv4(), type: 'textarea', label: 'Dirección', name: 'direccion', required: true, order: 8, dimension: 12 },
  
  // Sexta fila: tipo examen y observaciones (6 columnas cada uno)
  { id: uuidv4(), type: 'select', label: 'Tipo de Examen', name: 'tipoExamen', required: true, order: 9, dimension: 6, options: 'Preocupacional, Periódico, Retiro, Especial' },
  { id: uuidv4(), type: 'textarea', label: 'Observaciones', name: 'observaciones', required: false, order: 10, dimension: 6 },
];

interface TemplateFormProps {
  initialData?: any;
  onSaved?: () => void;
}

export function TemplateForm({ initialData, onSaved }: TemplateFormProps) {
  
  const [templateOption, setTemplateOption] = useState<'new' | 'existing' | 'basic'>('new');
  const [fieldConfig, setFieldConfig] = useState<Record<string, { visible: boolean; required: boolean }>>({});
  const [formBuilderData, setFormBuilderData] = useState<{ nombre: string, descripcion: string, fields: any[] } | null>(null);
  const [plantillasExistentes, setPlantillasExistentes] = useState<any[]>([]);
  const [selectedPlantillaId, setSelectedPlantillaId] = useState<string>('');
  const [selectedPlantillaData, setSelectedPlantillaData] = useState<any>(null);
  const [formBuilderFields, setFormBuilderFields] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Estado para el nombre y descripción de la plantilla
  const [plantillaNombre, setPlantillaNombre] = useState(initialData?.nombre || '');
  const [plantillaDescripcion, setPlantillaDescripcion] = useState(initialData?.descripcion || '');
  
  // Estado para plantillas asignadas
  const [plantillasAsignadas, setPlantillasAsignadas] = useState<number[]>(
    (initialData as any)?.plantillas?.map((p: any) => p.id) || []
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Callbacks para actualizar nombre y descripción desde FormBuilder
  const handleNombreChange = (nombre: string) => {
    setPlantillaNombre(nombre);
  };

  const handleDescripcionChange = (descripcion: string) => {
    setPlantillaDescripcion(descripcion);
  };
  
  // Cerrar el dropdown al hacer clic fuera de él
  const dropdownRef = useRef<HTMLDivElement>(null);
  
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
      id_empresa: initialData?.id_empresa || null,
      configuracionCampos: {}
    }
  });

  // Sincronizar valores del formulario con el estado
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'nombre') {
        setPlantillaNombre(value.nombre || '');
      }
      if (name === 'descripcion') {
        setPlantillaDescripcion(value.descripcion || '');
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form]);

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

  const onSubmit = async (data: any) => {
    try {
      setIsLoading(true);
      
      // Si estamos usando el FormBuilder, no usar esta función
      // El FormBuilder maneja su propio guardado a través del callback
      if (templateOption === 'new' || templateOption === 'existing' || templateOption === 'basic') {
        toast.error("Por favor use el botón 'Guardar plantilla' del FormBuilder para guardar la plantilla.");
        return;
      }

      // Solo para plantillas que no usan FormBuilder (si las hay)
      const payload = {
        nombre: data.nombre,
        descripcion: data.descripcion,
        es_default: data.esDefault || false,
        estructura_formulario: fieldConfig,
        activa: true,
        id_empresa: data.id_empresa || null,
      };

      // Determinar qué plantilla actualizar
      const plantillaId = initialData?.id || selectedPlantillaData?.id;
      
      if (plantillaId) {
        await plantillasService.update(plantillaId, payload);
      } else {
        await plantillasService.create(payload);
      }

      toast.success("Plantilla guardada exitosamente", { description: "La plantilla ha sido creada/actualizada correctamente." });
      if (onSaved) {
        onSaved();
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Hubo un error al procesar la solicitud. Por favor, intente nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  // Callback para recibir datos del FormBuilder
  const handleFormBuilderSave = async (data: { nombre: string, descripcion: string, fields: any[], estructura_formulario?: string }) => {
    try {
      setIsLoading(true);
      
      // Obtener los valores del formulario
      const formValues = form.getValues();
      
      const payload = {
        nombre: plantillaNombre || data.nombre,
        descripcion: plantillaDescripcion || data.descripcion || undefined,
        estructura_formulario: data.estructura_formulario || JSON.stringify(data.fields, null, 2),
        es_default: false,
        activa: true,
        id_empresa: formValues.id_empresa || null,
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
        toast.success("Plantilla guardada exitosamente", { description: "La plantilla ha sido creada/actualizada correctamente." });
        if (onSaved) onSaved();
      } else {
        throw new Error('No se pudo guardar la plantilla');
      }
    } catch (error) {
      console.error('❌ Error al guardar plantilla:', error);
      toast.error("Hubo un error al guardar la plantilla. Por favor, intente nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar selección de plantilla existente
  const handlePlantillaSelection = async (plantillaId: string) => {
    setSelectedPlantillaId(plantillaId);
    if (plantillaId) {
      try {
        const plantilla = await plantillasService.getById(parseInt(plantillaId));
        setSelectedPlantillaData(plantilla);
        // Actualizar el nombre y descripción en el estado
        if (plantilla) {
          setPlantillaNombre(plantilla.nombre || '');
          setPlantillaDescripcion(plantilla.descripcion || '');
        }
      } catch (error) {
        console.error('Error al cargar plantilla:', error);
        toast.error("No se pudo cargar la plantilla seleccionada.");
      }
    } else {
      setSelectedPlantillaData(null);
      // Limpiar el nombre y descripción
      setPlantillaNombre('');
      setPlantillaDescripcion('');
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
      <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
        <div className="w-full">
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-4">
                  <TemplateBasicInfo 
                    form={form} 
                    templateOption={templateOption}
                    onTemplateOptionChange={(value) => setTemplateOption(value as 'new' | 'existing' | 'basic')}
                  />
                  
                  {/* Campo de Tipo de Plantilla movido a TemplateBasicInfo */}
                  {/* Eliminado el campo duplicado */}

                  {templateOption === 'new' && (
                    <div className="border rounded p-3 bg-gray-50">
                      <FormBuilder 
                        key="new-template" 
                        precargados={initialData?.estructura_formulario || []}
                        onSave={handleFormBuilderSave}
                        initialName={plantillaNombre}
                        initialDescription={plantillaDescripcion}
                        onFieldsChange={setFormBuilderFields}
                        isEditing={!!initialData?.id}
                        onNameChange={handleNombreChange}
                        onDescriptionChange={handleDescripcionChange}
                      />
                    </div>
                  )}

                  {templateOption === 'existing' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block font-medium mb-2 text-sm">Seleccionar Plantilla para Editar</label>
                        <select 
                          className="w-full border rounded p-2 text-sm"
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
                        <div className="border rounded p-3 bg-gray-50">
                          <FormBuilder 
                            key={`existing-${selectedPlantillaId}`}
                            precargados={selectedPlantillaData.estructura_formulario || []}
                            onSave={handleFormBuilderSave}
                            initialName={plantillaNombre}
                            initialDescription={plantillaDescripcion}
                            onFieldsChange={setFormBuilderFields}
                            isEditing={true}
                            onNameChange={handleNombreChange}
                            onDescriptionChange={handleDescripcionChange}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {templateOption === 'basic' && (
                    <div className="border rounded p-3 bg-gray-50">
                      <FormBuilder 
                        key="basic-template" 
                        precargados={camposBasicos}
                        onSave={handleFormBuilderSave}
                        initialName={plantillaNombre}
                        initialDescription={plantillaDescripcion}
                        onFieldsChange={setFormBuilderFields}
                        isEditing={false}
                        onNameChange={handleNombreChange}
                        onDescriptionChange={handleDescripcionChange}
                      />
                    </div>
                  )}

                  {/* El botón de submit del formulario principal no se usa cuando se trabaja con FormBuilder */}
                  {/* Se quita para evitar confusión */}
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </Form>
  );
} 




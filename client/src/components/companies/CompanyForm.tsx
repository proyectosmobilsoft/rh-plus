import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { X, Check, ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CompanyBasicInfo } from "./form/CompanyBasicInfo";
import { CompanyContactInfo } from "./form/CompanyContactInfo";
import { CompanyBusinessInfo } from "./form/CompanyBusinessInfo";
import { CompanyVisibleFields } from "./form/CompanyVisibleFields";
import { Company } from "@/types/company";
import { CreateEmpresaDTO, createEmpresaSchema } from "@/types/empresa";
import * as React from "react";
const { useEffect, useState, useRef } = React;
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import FormBuilder from "@/components/FormBuilder";
import FormPreview from "@/components/FormPreview";
import { useMemo } from "react";
import { v4 as uuidv4 } from 'uuid';
import { empresasService } from '@/services/empresasService';

// Plantillas mock globales (en memoria)
const PLANTILLAS_MOCK = [
  { id: 1, name: "Plantilla de Ingreso", description: "Campos para ingreso de personal" },
  { id: 2, name: "Plantilla de Seguridad", description: "Campos de seguridad industrial" },
  { id: 3, name: "Plantilla de Salud", description: "Campos de salud ocupacional" },
];

// Definir los campos precargados para la plantilla básica
const camposBasicos = [
  { id: uuidv4(), type: 'select', label: 'Tipo de Identificación', name: 'tipo_identificacion', required: true, order: 1, dimension: 6, options: 'CC,CE,TI,Pasaporte' },
  { id: uuidv4(), type: 'text', label: 'Número de Identificación', name: 'numero_identificacion', required: true, order: 2, dimension: 6 },
  { id: uuidv4(), type: 'text', label: 'Dirección de Residencia', name: 'direccion_residencia', required: true, order: 3, dimension: 12 },
  { id: uuidv4(), type: 'text', label: 'Ciudad', name: 'ciudad', required: true, order: 4, dimension: 6 },
  { id: uuidv4(), type: 'text', label: 'Teléfono/Celular', name: 'telefono', required: true, order: 5, dimension: 6 },
  { id: uuidv4(), type: 'email', label: 'Mail', name: 'mail', required: true, order: 6, dimension: 12 },
  { id: uuidv4(), type: 'text', label: 'Cargos', name: 'cargos', required: true, order: 7, dimension: 12 },
  { id: uuidv4(), type: 'date', label: 'Fecha de Inicio', name: 'fecha_inicio', required: true, order: 8, dimension: 6 },
  { id: uuidv4(), type: 'select', label: 'Tipo de Contrato', name: 'tipo_contrato', required: true, order: 9, dimension: 6, options: 'Indefinido, Fijo, Prestación de Servicios, Aprendizaje' },
  { id: uuidv4(), type: 'number', label: 'Aspiración Salarial', name: 'aspiracion_salarial', required: true, order: 10, dimension: 6 },
];

interface CompanyFormProps {
  initialData?: Company;
  onSaved?: () => void;
  entityType?: 'afiliada' | 'prestador';
}

export function CompanyForm({ initialData, onSaved, entityType = 'afiliada' }: CompanyFormProps) {
  const { toast } = useToast();
  const [existingDocuments, setExistingDocuments] = useState<[]>([]);
  const [templateOption, setTemplateOption] = useState<'new' | 'existing' | 'basic'>('new');
  const [currentTab, setCurrentTab] = useState('datos-empresa');
  
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

  const form = useForm<CreateEmpresaDTO>({
    resolver: zodResolver(createEmpresaSchema),
    defaultValues: {
      razon_social: "",
      nit: "",
      nit_base: "",
      nit_verification: "",
      tipo_documento: "nit",
      regimen_tributario: "responsable_iva",
      direccion: "",
      ciudad: "",
      telefono: "",
      email: "",
      representante_legal: "",
      actividad_economica: "",
      numero_empleados: 1,
      activo: true,
      tipo_empresa: entityType,
      campos_visibles: {
        cargo: true,
        salario: true,
        celular: true,
        correo: true,
        fecha_ingreso: true,
        direccion: true,
        jornada_laboral: true
      },
      documentos: []
    },
  });

  useEffect(() => {
    if (initialData) {
      let nitBase = initialData.nit;
      let nitVerification = "";
      
      if (initialData.nit && initialData.nit.includes('-')) {
        [nitBase, nitVerification] = initialData.nit.split('-');
      }

      form.reset({
        razon_social: initialData.name,
        nit: initialData.nit,
        nit_base: nitBase,
        nit_verification: nitVerification,
        tipo_documento: initialData.tipo_documento || "nit",
        regimen_tributario: initialData.regimen_tributario || "responsable_iva",
        direccion: initialData.address,
        ciudad: initialData.city,
        telefono: initialData.phone,
        email: initialData.email,
        representante_legal: initialData.contactPerson,
        actividad_economica: initialData.sector,
        numero_empleados: initialData.employeeCount,
        activo: initialData.active,
        campos_visibles: {
          cargo: true,
          salario: true,
          celular: true,
          correo: true,
          fecha_ingreso: true,
          direccion: true,
          jornada_laboral: true
        }
      });
    }
  }, [initialData, form]);

  const onSubmit = async (data: CreateEmpresaDTO) => {
    try {
      // Filtra solo los campos válidos para la tabla empresas
      const empresaPayload = {
        razon_social: data.razon_social,
        nit: data.nit,
        tipo_documento: data.tipo_documento,
        regimen_tributario: data.regimen_tributario,
        direccion: data.direccion,
        ciudad: data.ciudad,
        telefono: data.telefono,
        email: data.email,
        representante_legal: data.representante_legal,
        actividad_economica: data.actividad_economica,
        numero_empleados: data.numero_empleados,
        tipo_empresa: data.tipo_empresa,
        activo: data.activo,
      };
      console.log('Payload enviado a Supabase:', empresaPayload);
      await empresasService.create(empresaPayload);
      toast({
        title: initialData 
          ? `${entityType === 'prestador' ? 'Prestador' : 'Empresa'} actualizada` 
          : `${entityType === 'prestador' ? 'Prestador' : 'Empresa'} registrada`,
        description: initialData 
          ? `La información del ${entityType === 'prestador' ? 'prestador' : 'la empresa'} ha sido actualizada exitosamente.`
          : `${entityType === 'prestador' ? 'El prestador' : 'La empresa'} ha sido registrada exitosamente.`,
      });
      if (!initialData) {
        form.reset();
      }
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs 
          key={`${entityType}-${initialData?.id || 'new'}-${currentTab}`} 
          value={currentTab} 
          onValueChange={setCurrentTab}
          className="w-full"
        >
          <TabsList className="mb-4">
            <TabsTrigger value="datos-empresa">Datos de la Empresa</TabsTrigger>
            {entityType === 'afiliada' && (
              <TabsTrigger value="plantilla">Plantilla Personalizada</TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="datos-empresa">
            <Card>
              <CardContent className="pt-6">
                <div className="grid gap-6">
                  <CompanyBasicInfo form={form} />
                  <CompanyContactInfo form={form} />
                  <CompanyBusinessInfo form={form} existingDocuments={existingDocuments} />
                  {entityType === 'afiliada' && <CompanyVisibleFields form={form} />}
                  {entityType === 'afiliada' && (
                    <div>
                      <label className="block font-medium mb-1">Plantillas asignadas a la empresa</label>
                      <div className="relative" ref={dropdownRef}>
                        <div 
                          className="w-full min-h-10 border rounded-md p-2 flex flex-wrap gap-1 cursor-pointer"
                          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        >
                          {plantillasAsignadas.length === 0 ? (
                            <span className="text-gray-400">Seleccionar plantillas...</span>
                          ) : (
                            plantillasAsignadas.map(id => {
                              const plantilla = PLANTILLAS_MOCK.find(p => p.id === id);
                              return plantilla ? (
                                <span 
                                  key={id} 
                                  className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center gap-1"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPlantillasAsignadas(plantillasAsignadas.filter(pId => pId !== id));
                                  }}
                                >
                                  {plantilla.name}
                                  <X className="h-3 w-3" />
                                </span>
                              ) : null;
                            })
                          )}
                          <ChevronDown className={`h-4 w-4 ml-auto self-center transition-transform ${isDropdownOpen ? 'transform rotate-180' : ''}`} />
                        </div>
                        
                        {isDropdownOpen && (
                          <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                            {PLANTILLAS_MOCK.map(p => (
                              <div 
                                key={p.id} 
                                className={`p-2 hover:bg-gray-100 cursor-pointer flex items-center ${plantillasAsignadas.includes(p.id) ? 'bg-blue-50' : ''}`}
                                onClick={() => {
                                  if (plantillasAsignadas.includes(p.id)) {
                                    setPlantillasAsignadas(plantillasAsignadas.filter(id => id !== p.id));
                                  } else {
                                    setPlantillasAsignadas([...plantillasAsignadas, p.id]);
                                  }
                                }}
                              >
                                <div className={`w-4 h-4 border rounded mr-2 flex items-center justify-center ${plantillasAsignadas.includes(p.id) ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                                  {plantillasAsignadas.includes(p.id) && <Check className="h-3 w-3 text-white" />}
                                </div>
                                <div>
                                  <div className="font-medium">{p.name}</div>
                                  <div className="text-xs text-gray-500">{p.description}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Haz clic para seleccionar o deseleccionar plantillas</div>
                    </div>
                  )}
                  <div className="flex justify-end">
                    <Button type="submit">
                      {initialData ? "Actualizar Empresa" : "Registrar Empresa"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {entityType === 'afiliada' && (
            <TabsContent value="plantilla">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
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
                        <FormBuilder key="new-template" />
                      </div>
                    )}

                    {templateOption === 'existing' && (
                      <div className="space-y-4">
                        <div>
                          <label className="block font-medium mb-1">Seleccionar Plantilla</label>
                          <select className="w-full border rounded p-2">
                            <option value="">-- Seleccione una plantilla --</option>
                            {PLANTILLAS_MOCK.map(p => (
                              <option key={p.id} value={p.id}>{p.name} - {p.description}</option>
                            ))}
                          </select>
                        </div>
                        <div className="border rounded p-4 bg-white">
                          <FormPreview fields={[]} />
                        </div>
                      </div>
                    )}

                    {templateOption === 'basic' && (
                      <div className="border rounded p-4 bg-white">
                        <FormBuilder key="basic-template" precargados={camposBasicos} readOnly={false} />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </form>
    </Form>
  );
}

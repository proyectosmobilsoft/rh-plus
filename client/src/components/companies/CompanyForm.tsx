import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { X, Check, ChevronDown, Eye, Upload, FileText, Building2, MapPin, Phone, Mail, User, Users, FileUp, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useQuery } from '@tanstack/react-query';
import { plantillasService } from '@/services/plantillasService';
import { empresaService } from '@/services/empresaService';
import { regimenTributarioService } from '@/services/regimenTributarioService';
import { useToast } from '@/hooks/use-toast';
import FormRenderer from '@/components/FormRenderer';
import { Company } from '@/types/company';
import { CreateEmpresaDTO, createEmpresaSchema } from '@/types/empresa';
import { useLoading } from '@/contexts/LoadingContext';

interface CompanyFormProps {
  initialData?: any; // Cambiado de Company a any para soportar las nuevas propiedades
  onSaved?: () => void;
  entityType?: 'afiliada' | 'prestador';
}

// Datos de ciudades y departamentos de Colombia
const ciudadesColombia = [
  { ciudad: "Bogotá", departamento: "Cundinamarca" },
  { ciudad: "Medellín", departamento: "Antioquia" },
  { ciudad: "Cali", departamento: "Valle del Cauca" },
  { ciudad: "Barranquilla", departamento: "Atlántico" },
  { ciudad: "Cartagena", departamento: "Bolívar" },
  { ciudad: "Cúcuta", departamento: "Norte de Santander" },
  { ciudad: "Bucaramanga", departamento: "Santander" },
  { ciudad: "Pereira", departamento: "Risaralda" },
  { ciudad: "Santa Marta", departamento: "Magdalena" },
  { ciudad: "Ibagué", departamento: "Tolima" },
  { ciudad: "Manizales", departamento: "Caldas" },
  { ciudad: "Villavicencio", departamento: "Meta" },
  { ciudad: "Neiva", departamento: "Huila" },
  { ciudad: "Pasto", departamento: "Nariño" },
  { ciudad: "Montería", departamento: "Córdoba" },
  { ciudad: "Armenia", departamento: "Quindío" },
  { ciudad: "Sincelejo", departamento: "Sucre" },
  { ciudad: "Popayán", departamento: "Cauca" },
  { ciudad: "Valledupar", departamento: "Cesar" },
  { ciudad: "Tunja", departamento: "Boyacá" },
];

// Función para calcular dígito de verificación del NIT
const calculateNITVerificationDigit = (nit: string): number => {
  const factors = [41, 37, 29, 23, 19, 17, 13, 7, 3];
  const cleanNIT = nit.replace(/[^0-9]/g, '').padStart(9, '0');

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanNIT[i]) * factors[i];
  }

  const remainder = sum % 11;
  return remainder > 1 ? 11 - remainder : remainder;
};

export function CompanyForm({ initialData, onSaved, entityType = 'afiliada' }: CompanyFormProps) {
  const { toast } = useToast();
  const { startLoading, stopLoading } = useLoading();
  const [existingDocuments, setExistingDocuments] = useState<{ [key: string]: string }>({});
  const [selectedPlantilla, setSelectedPlantilla] = useState<number | null>(null);
  const [showPlantillaPreview, setShowPlantillaPreview] = useState(false);
  const [previewPlantilla, setPreviewPlantilla] = useState<any>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [tipoDocumentoOpen, setTipoDocumentoOpen] = useState(false);
  const [regimenTributarioOpen, setRegimenTributarioOpen] = useState(false);
  const [ciudadOpen, setCiudadOpen] = useState(false);
  const [actividadEconomicaOpen, setActividadEconomicaOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{ [key: string]: string }>({});
  const [selectedDepartamento, setSelectedDepartamento] = useState<string>("");
  const [showDocumentPreview, setShowDocumentPreview] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<{ content: string; name: string; type: string } | null>(null);

  // Estado para plantillas asignadas
  const [plantillasAsignadas, setPlantillasAsignadas] = useState<number[]>(
    (initialData as any)?.plantillas?.map((p: any) => Number(p.id || p.plantilla_id)) || []
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Cerrar el dropdown al hacer clic fuera de él
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Efecto para actualizar plantillas asignadas cuando cambie initialData
  useEffect(() => {
    if (initialData?.plantillas) {
      console.log('=== ACTUALIZANDO PLANTILLAS ASIGNADAS ===');
      console.log('initialData.plantillas:', initialData.plantillas);
      console.log('Tipo de plantillas:', typeof initialData.plantillas);
      console.log('Es array:', Array.isArray(initialData.plantillas));
      
      if (Array.isArray(initialData.plantillas) && initialData.plantillas.length > 0) {
        const plantillaIds = initialData.plantillas.map((p: any) => {
          const id = Number(p.id || p.plantilla_id);
          console.log('Mapeando plantilla:', p, 'ID:', id);
          return id;
        });
        console.log('IDs de plantillas extraídos:', plantillaIds);
        setPlantillasAsignadas(plantillaIds);
        console.log('Plantillas asignadas actualizadas:', plantillaIds);
      } else {
        console.log('No se encontraron plantillas válidas en initialData');
        setPlantillasAsignadas([]);
      }
      console.log('=== FIN ACTUALIZANDO PLANTILLAS ===');
    } else {
      console.log('No hay plantillas en initialData, limpiando plantillas asignadas');
      setPlantillasAsignadas([]);
    }
  }, [initialData]);

  // Obtener plantillas de la base de datos
  const { data: plantillas = [], isLoading: loadingPlantillas, error: plantillasError } = useQuery({
    queryKey: ['plantillas'],
    queryFn: async () => {
      try {
        console.log('Iniciando carga de plantillas...');
        const result = await plantillasService.getAll();
        console.log('Resultado de plantillasService.getAll():', result);
        return result;
      } catch (error) {
        console.error('Error al cargar plantillas:', error);
        throw error;
      }
    },
    retry: 3,
    retryDelay: 1000,
  });

  // Obtener regímenes tributarios de la base de datos
  const { data: regimenesTributarios = [], isLoading: loadingRegimenes } = useQuery({
    queryKey: ['regimenes-tributarios'],
    queryFn: async () => {
      try {
        console.log('Iniciando carga de regímenes tributarios...');
        const result = await regimenTributarioService.getAll();
        console.log('Resultado de regimenTributarioService.getAll():', result);
        return result;
      } catch (error) {
        console.error('Error al cargar regímenes tributarios:', error);
        throw error;
      }
    },
    retry: 3,
    retryDelay: 1000,
  });

  // Debug: Log para verificar las plantillas
  useEffect(() => {
    console.log('=== DEBUG PLANTILLAS ===');
    console.log('Plantillas cargadas:', plantillas);
    console.log('Loading plantillas:', loadingPlantillas);
    console.log('Error plantillas:', plantillasError);
    console.log('Plantillas length:', plantillas.length);
    console.log('Tipo de plantillas:', typeof plantillas);
    console.log('Es array:', Array.isArray(plantillas));
    if (plantillas.length > 0) {
      console.log('Primera plantilla:', plantillas[0]);
    }
    console.log('=== FIN DEBUG PLANTILLAS ===');
  }, [plantillas, loadingPlantillas, plantillasError]);

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
      tipo_documento: "",
      regimen_tributario: 0, // Cambiado de string vacío a número
      direccion: "",
      ciudad: "",
      telefono: "",
      email: "",
      representante_legal: "",
      actividad_economica: "",
      numero_empleados: 1,
      activo: true,
      tipo_empresa: entityType,
      documentos: []
    },
  });

  // Efecto para calcular DV automáticamente
  useEffect(() => {
    const subscription = form.watch((value: any, { name }: any) => {
      if (name === 'nit_base' && value.nit_base) {
        const verificationDigit = calculateNITVerificationDigit(value.nit_base);
        form.setValue('nit_verification', verificationDigit.toString());
        form.setValue('nit', `${value.nit_base}-${verificationDigit}`);
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  // Efecto para cargar departamento cuando cambia la ciudad
  useEffect(() => {
    const subscription = form.watch((value: any, { name }: any) => {
      if (name === 'ciudad' && value.ciudad) {
        const ciudadData = ciudadesColombia.find(c => c.ciudad === value.ciudad);
        if (ciudadData) {
          setSelectedDepartamento(ciudadData.departamento);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  useEffect(() => {
    if (initialData) {
      console.log('=== DATOS INICIALES RECIBIDOS ===');
      console.log('initialData completo:', initialData);
      console.log('actividad_economica_id:', initialData.actividad_economica_id);
      console.log('actividad_economica:', initialData.actividad_economica);
      console.log('regimen_tributario_id:', initialData.regimen_tributario_id);
      console.log('regimen_tributario:', initialData.regimen_tributario);
      console.log('numero_empleados:', initialData.numero_empleados);
      console.log('Tipo de regimen_tributario_id:', typeof initialData.regimen_tributario_id);
      console.log('Tipo de actividad_economica_id:', typeof initialData.actividad_economica_id);
      console.log('================================');

      let nitBase = initialData.nit || "";
      let nitVerification = "";

      if (initialData.nit && initialData.nit.includes('-')) {
        [nitBase, nitVerification] = initialData.nit.split('-');
      }

      const formData = {
        razon_social: initialData.razon_social || initialData.razonSocial || initialData.name || "",
        nit: initialData.nit || "",
        nit_base: nitBase,
        nit_verification: nitVerification,
        tipo_documento: initialData.tipo_documento || "nit",
        regimen_tributario: Number(initialData.regimen_tributario_id || initialData.regimen_tributario || 0),
        direccion: initialData.direccion || initialData.address || "",
        ciudad: initialData.ciudad || initialData.city || "",
        telefono: initialData.telefono || initialData.phone || "",
        email: initialData.email || initialData.correoElectronico || "",
        representante_legal: initialData.representante_legal || initialData.representanteLegal || initialData.contactPerson || "",
        actividad_economica: initialData.actividad_economica_id || initialData.actividad_economica || initialData.sector || "",
        actividad_nombre: initialData.actividad_nombre || "", // Agregar el nombre de la actividad
        numero_empleados: Number(initialData.numero_empleados || initialData.employeeCount || 1),
        activo: initialData.active !== false,
        tipo_empresa: initialData.tipo_empresa || entityType,
        // Cargar documentos existentes
        documento_contrato_base64: initialData.documento_contrato || "",
        documento_camara_comercio_base64: initialData.documento_camara_comercio || "",
        documento_rut_base64: initialData.documento_rut || "",
        documentos: []
      };

      console.log('Datos del formulario a cargar:', formData);
      console.log('Actividad económica cargada:', formData.actividad_economica);
      console.log('Régimen tributario cargado:', formData.regimen_tributario);
      form.reset(formData);

      // Cargar plantillas asociadas si existen
      console.log('=== CARGANDO PLANTILLAS ASOCIADAS ===');
      console.log('initialData completo:', initialData);
      console.log('initialData.plantillas:', initialData.plantillas);
      console.log('Tipo de plantillas:', typeof initialData.plantillas);
      console.log('Es array:', Array.isArray(initialData.plantillas));
      console.log('Longitud de plantillas:', initialData.plantillas?.length);
      
      if (initialData.plantillas && Array.isArray(initialData.plantillas) && initialData.plantillas.length > 0) {
        const plantillaIds = initialData.plantillas.map((p: any) => {
          const id = Number(p.id || p.plantilla_id);
          console.log('Mapeando plantilla:', p, 'ID:', id);
          return id;
        });
        console.log('IDs de plantillas extraídos:', plantillaIds);
        setPlantillasAsignadas(plantillaIds);
        console.log('Plantillas asociadas cargadas:', plantillaIds);
        console.log('Plantillas detalladas:', initialData.plantillas);
      } else {
        console.log('No se encontraron plantillas asociadas o no es un array válido');
        console.log('Plantillas encontradas:', initialData.plantillas);
        setPlantillasAsignadas([]);
      }
      console.log('=== FIN CARGANDO PLANTILLAS ===');

      // Cargar documentos existentes para mostrar en la UI
      const existingDocs: { [key: string]: string } = {};
      if (initialData.documento_contrato) {
        existingDocs['contrato'] = 'Documento de contrato cargado';
        console.log('Documento de contrato encontrado:', !!initialData.documento_contrato);
      }
      if (initialData.documento_camara_comercio) {
        existingDocs['camara_comercio'] = 'Documento de cámara de comercio cargado';
        console.log('Documento de cámara de comercio encontrado:', !!initialData.documento_camara_comercio);
      }
      if (initialData.documento_rut) {
        existingDocs['rut'] = 'Documento RUT cargado';
        console.log('Documento RUT encontrado:', !!initialData.documento_rut);
      }
      console.log('Documentos existentes cargados:', existingDocs);
      setUploadedFiles(existingDocs);
      setExistingDocuments(existingDocs);

      // Cargar departamento cuando se carga la ciudad
      if (initialData.ciudad) {
        const ciudadData = ciudadesColombia.find(c => c.ciudad === initialData.ciudad);
        if (ciudadData) {
          setSelectedDepartamento(ciudadData.departamento);
        }
      }

      // Cargar el nombre de la actividad económica si existe
      if (initialData.actividad_economica_id || initialData.actividad_economica) {
        const actividadId = initialData.actividad_economica_id || initialData.actividad_economica;
        const actividadesEconomicas = [
          { codigo: "0111", descripcion: "Cultivo de cereales" },
          { codigo: "0112", descripcion: "Cultivo de arroz" },
          { codigo: "0113", descripcion: "Cultivo de hortalizas" },
          { codigo: "0141", descripcion: "Cría de ganado bovino" },
          { codigo: "1011", descripcion: "Procesamiento y conservación de carne" },
          { codigo: "1071", descripcion: "Elaboración de productos de panadería" },
          { codigo: "2011", descripcion: "Fabricación de sustancias químicas" },
          { codigo: "4711", descripcion: "Comercio al por menor" },
          { codigo: "6201", descripcion: "Actividades de desarrollo de sistemas informáticos" },
          { codigo: "8411", descripcion: "Actividades de la administración pública" },
          { codigo: "8511", descripcion: "Educación preescolar" },
          { codigo: "8610", descripcion: "Actividades de hospitales" },
          { codigo: "9311", descripcion: "Gestión de instalaciones deportivas" },
          { codigo: "9602", descripcion: "Peluquería y otros tratamientos de belleza" }
        ];
        
        const actividadEncontrada = actividadesEconomicas.find(a => a.codigo === actividadId);
        if (actividadEncontrada) {
          form.setValue("actividad_nombre", `${actividadEncontrada.codigo} - ${actividadEncontrada.descripcion}`);
        }
      }
    }
  }, [initialData, form, entityType]);

  // Debug: Verificar valores del formulario después de cargar
  useEffect(() => {
    if (initialData) {
      console.log('=== VALORES DEL FORMULARIO DESPUÉS DE CARGAR ===');
      console.log('actividad_economica en form:', form.watch("actividad_economica"));
      console.log('actividad_nombre en form:', form.watch("actividad_nombre"));
      console.log('regimen_tributario en form:', form.watch("regimen_tributario"));
      console.log('numero_empleados en form:', form.watch("numero_empleados"));
      console.log('===============================================');
    }
  }, [initialData, form.watch("actividad_economica"), form.watch("regimen_tributario"), form.watch("numero_empleados")]);

  const onSubmit = async (data: any) => {
    try {
      startLoading();
      // Preparar payload para la tabla empresas
      const empresaPayload = {
        razon_social: data.razon_social,
        nit: data.nit,
        direccion: data.direccion,
        telefono: data.telefono,
        email: data.email,
        representante_legal: data.representante_legal,
        ciudad: data.ciudad_nombre || data.ciudad || "",
        actividad_economica: data.actividad_economica, // ID del código CIIU
        regimen_tributario: data.regimen_tributario, // ID del régimen tributario
        numero_empleados: data.numero_empleados, // Número de empleados
        documento_contrato_base64: data.documento_contrato_base64,
        documento_camara_comercio_base64: data.documento_camara_comercio_base64,
        documento_rut_base64: data.documento_rut_base64,
        tipo_empresa: data.tipo_empresa || 'prestador',
        tipo_documento: data.tipo_documento, // Agregar el campo que falta
        activo: data.activo || true,
        plantillas_seleccionadas: plantillasAsignadas // Array de IDs de plantillas
      };
      console.log('Payload enviado a Supabase:', empresaPayload);
      console.log('=== DATOS DEL PAYLOAD ===');
      console.log('actividad_economica:', data.actividad_economica);
      console.log('regimen_tributario:', data.regimen_tributario);
      console.log('numero_empleados:', data.numero_empleados);
      console.log('Tipo de actividad_economica:', typeof data.actividad_economica);
      console.log('Tipo de regimen_tributario:', typeof data.regimen_tributario);
      console.log('Tipo de numero_empleados:', typeof data.numero_empleados);
      console.log('========================');

      if (initialData?.id) {
        // Actualizar empresa existente
        await empresaService.update(initialData.id, empresaPayload);
      } else {
        // Crear nueva empresa
        await empresaService.create(empresaPayload);
      }

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
        setUploadedFiles({});
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
    } finally {
      stopLoading();
    }
  };

  const handlePlantillaChange = (plantillaId: string) => {
    setSelectedPlantilla(Number(plantillaId));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        // Guardar el nombre del archivo para mostrar en la UI
        setUploadedFiles(prev => ({
          ...prev,
          [docType]: file.name
        }));
        // Guardar el base64 en el formulario según el tipo de documento
        switch (docType) {
          case 'contrato':
            form.setValue('documento_contrato_base64', base64);
            break;
          case 'camara_comercio':
            form.setValue('documento_camara_comercio_base64', base64);
            break;
          case 'rut':
            form.setValue('documento_rut_base64', base64);
            break;
        }
        toast({
          title: "Archivo seleccionado",
          description: `${file.name} ha sido seleccionado correctamente.`,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenPreview = (plantilla: any) => {
    setPreviewPlantilla(plantilla);
    setShowPreviewModal(true);
    setIsDropdownOpen(false); // Cerrar el dropdown
  };

  const handleViewDocument = (docType: string) => {
    let documentContent = '';
    let documentName = '';
    
    // Obtener el contenido del documento según el tipo
    switch (docType) {
      case 'contrato':
        documentContent = initialData?.documento_contrato || form.getValues('documento_contrato_base64') || '';
        documentName = 'Contrato';
        break;
      case 'camara_comercio':
        documentContent = initialData?.documento_camara_comercio || form.getValues('documento_camara_comercio_base64') || '';
        documentName = 'Cámara de Comercio';
        break;
      case 'rut':
        documentContent = initialData?.documento_rut || form.getValues('documento_rut_base64') || '';
        documentName = 'RUT';
        break;
    }

    if (documentContent && documentContent.startsWith('data:application/pdf;base64,')) {
      setPreviewDocument({
        content: documentContent,
        name: documentName,
        type: docType
      });
      setShowDocumentPreview(true);
    } else {
      toast({
        title: "Documento no disponible",
        description: "No se encontró un documento válido para visualizar.",
        variant: "destructive"
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardContent className="pt-6">
              {/* Información Básica */}
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  Información Básica
                </h3>

              {/* Primera fila: Tipo de documento, DV, Número empleados, NIT base, Régimen tributario */}
              <div className="grid grid-cols-12 gap-4 mb-4">
                <div className="col-span-12 md:col-span-3">
                  <Label htmlFor="tipo_documento" className="text-left">Tipo de Documento</Label>
                  <Popover open={tipoDocumentoOpen} onOpenChange={setTipoDocumentoOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={`w-full justify-between font-normal ${form.formState.errors.tipo_documento ? "border-red-500" : ""}`}
                      >
                        {form.watch("tipo_documento") === "nit" ? "NIT" :
                          form.watch("tipo_documento") === "cc" ? "Cédula de Ciudadanía" :
                            form.watch("tipo_documento") === "ce" ? "Cédula de Extranjería" :
                              form.watch("tipo_documento") === "pasaporte" ? "Pasaporte" : "Seleccionar tipo..."}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Buscar tipo de documento..." />
                        <CommandList>
                          <CommandEmpty>No se encontró el tipo de documento.</CommandEmpty>
                          <CommandGroup>
                            {[
                              { value: "nit", label: "NIT" },
                              { value: "cc", label: "Cédula de Ciudadanía" },
                              { value: "ce", label: "Cédula de Extranjería" },
                              { value: "pasaporte", label: "Pasaporte" }
                            ].map((tipo) => (
                              <CommandItem
                                key={tipo.value}
                                value={tipo.label}
                                onSelect={() => {
                                  form.setValue("tipo_documento", tipo.value);
                                  setTipoDocumentoOpen(false);
                                }}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${form.watch("tipo_documento") === tipo.value ? "opacity-100" : "opacity-0"
                                    }`}
                                />
                                <span className="font-normal">{tipo.label}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {form.formState.errors.tipo_documento && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.tipo_documento.message}
                    </p>
                  )}
                </div>
                <div className="col-span-12 md:col-span-3">
                  <Label htmlFor="nit_base" className="text-left">
                    {form.watch("tipo_documento") === "nit" ? "NIT *" :
                      form.watch("tipo_documento") === "cc" ? "Cédula de Ciudadanía *" :
                        form.watch("tipo_documento") === "ce" ? "Cédula de Extranjería *" :
                          form.watch("tipo_documento") === "pasaporte" ? "Pasaporte *" : "Número de Documento *"}
                  </Label>
                  <Input
                    id="nit_base"
                    placeholder={form.watch("tipo_documento") === "nit" ? "Número de identificación tributaria" : "Número de documento"}
                    {...form.register("nit_base")}
                    maxLength={form.watch("tipo_documento") === "nit" ? 9 : 10}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      const maxLength = form.watch("tipo_documento") === "nit" ? 9 : 10;
                      if (value.length <= maxLength) {
                        form.setValue('nit_base', value);
                      }
                    }}
                    className={form.formState.errors.nit ? "border-red-500" : ""}
                  />
                  {form.formState.errors.nit && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.nit.message}
                    </p>
                  )}
                </div>
                {form.watch("tipo_documento") === "nit" && (
                  <div className="col-span-12 md:col-span-1">
                    <Label htmlFor="nit_verification" className="text-left">DV</Label>
                    <Input
                      id="nit_verification"
                      placeholder="DV"
                      {...form.register("nit_verification")}
                      readOnly
                      className="bg-gray-100 w-full"
                      maxLength={2}
                    />
                  </div>
                )}
                <div className="col-span-12 md:col-span-2">
                  <Label htmlFor="numero_empleados" className="text-left">N° Empleados</Label>
                  <Input
                    id="numero_empleados"
                    type="number"
                    min="1"
                    {...form.register("numero_empleados", { valueAsNumber: true })}
                    className={`w-full ${form.formState.errors.numero_empleados ? "border-red-500" : ""}`}
                  />
                  {form.formState.errors.numero_empleados && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.numero_empleados.message}
                    </p>
                  )}
                </div>

                <div className="col-span-12 md:col-span-3">
                  <Label htmlFor="regimen_tributario" className="text-left">Régimen Tributario</Label>
                  <Popover open={regimenTributarioOpen} onOpenChange={setRegimenTributarioOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={`w-full justify-between font-normal ${form.formState.errors.regimen_tributario ? "border-red-500" : ""}`}
                        disabled={loadingRegimenes}
                      >
                        {(() => {
                          const regimenActual = regimenesTributarios.find(r => r.id === form.watch("regimen_tributario"));
                          console.log('=== SELECTOR RÉGIMEN TRIBUTARIO ===');
                          console.log('Valor en form:', form.watch("regimen_tributario"));
                          console.log('regimenesTributarios:', regimenesTributarios);
                          console.log('regimenActual encontrado:', regimenActual);
                          console.log('=====================================');
                          return regimenActual ? regimenActual.nombre : "Seleccionar régimen...";
                        })()}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Buscar régimen tributario..." />
                        <CommandList>
                          <CommandEmpty>No se encontró el régimen.</CommandEmpty>
                          <CommandGroup>
                            {regimenesTributarios.map((regimen) => (
                              <CommandItem
                                key={regimen.id}
                                value={regimen.nombre}
                                onSelect={() => {
                                  form.setValue("regimen_tributario", regimen.id);
                                  setRegimenTributarioOpen(false);
                                }}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${form.watch("regimen_tributario") === regimen.id ? "opacity-100" : "opacity-0"
                                    }`}
                                />
                                <span className="font-normal">{regimen.nombre}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {form.formState.errors.regimen_tributario && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.regimen_tributario.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Segunda fila: Razón social y Representante legal */}
              <div className="grid grid-cols-12 gap-4 mb-6">
                <div className="col-span-12 md:col-span-6">
                  <Label htmlFor="razon_social" className="text-left">
                    {form.watch("tipo_documento") === "nit" ? "Razón Social *" : "Nombre Completo *"}
                  </Label>
                  <Input
                    id="razon_social"
                    placeholder={form.watch("tipo_documento") === "nit" ? "Nombre de la empresa" : "Nombre completo"}
                    {...form.register("razon_social")}
                    className={form.formState.errors.razon_social ? "border-red-500" : ""}
                  />
                  {form.formState.errors.razon_social && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.razon_social.message}
                    </p>
                  )}
                </div>
                <div className="col-span-12 md:col-span-6">
                  <Label htmlFor="representante_legal" className="text-left">Representante Legal</Label>
                  <Input
                    id="representante_legal"
                    placeholder="Nombre del representante legal"
                    {...form.register("representante_legal")}
                  />
                </div>
              </div>
            </div>

              {/* Separador */}
              <div className="border-t border-gray-200 my-6"></div>

              {/* Información de Contacto */}
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  Información de Contacto
                </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <Label htmlFor="ciudad" className="text-left">Ciudad *</Label>
                  <Popover open={ciudadOpen} onOpenChange={setCiudadOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between font-normal"
                      >
                        {form.watch("ciudad") || "Seleccionar ciudad..."}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Buscar ciudad..." />
                        <CommandList>
                          <CommandEmpty>No se encontró la ciudad.</CommandEmpty>
                          <CommandGroup>
                            {ciudadesColombia.map((ciudad) => (
                              <CommandItem
                                key={ciudad.ciudad}
                                value={ciudad.ciudad}
                                onSelect={() => {
                                  form.setValue("ciudad", ciudad.ciudad);
                                  setCiudadOpen(false);
                                }}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${form.watch("ciudad") === ciudad.ciudad ? "opacity-100" : "opacity-0"
                                    }`}
                                />
                                <span className="font-normal">{ciudad.ciudad}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label htmlFor="departamento" className="text-left">Departamento</Label>
                  <Input
                    id="departamento"
                    value={selectedDepartamento}
                    disabled
                    className="bg-gray-100"
                    placeholder="Se selecciona automáticamente"
                  />
                </div>
                <div>
                  <Label htmlFor="telefono" className="text-left">Teléfono</Label>
                  <Input
                    id="telefono"
                    placeholder="Teléfono"
                    {...form.register("telefono")}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <Label htmlFor="direccion" className="text-left">Dirección *</Label>
                  <Input
                    id="direccion"
                    placeholder="Dirección de la empresa"
                    {...form.register("direccion")}
                    className={form.formState.errors.direccion ? "border-red-500" : ""}
                  />
                  {form.formState.errors.direccion && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.direccion.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="email" className="text-left">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Email de contacto"
                    {...form.register("email")}
                  />
                </div>
              </div>
            </div>

              {/* Separador */}
              <div className="border-t border-gray-200 my-6"></div>

              {/* Información Adicional */}
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Información Adicional
                </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <Label htmlFor="actividad_economica" className="text-left">Actividad Económica (CIIU)</Label>
                  <Popover open={actividadEconomicaOpen} onOpenChange={setActividadEconomicaOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between font-normal"
                      >
                        {form.watch("actividad_nombre") || "Seleccionar actividad económica..."}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Buscar actividad económica..." />
                        <CommandList>
                          <CommandEmpty>No se encontró la actividad económica.</CommandEmpty>
                          <CommandGroup>
                            {(() => {
                              console.log('=== SELECTOR ACTIVIDAD ECONÓMICA ===');
                              console.log('Valor actividad_economica en form:', form.watch("actividad_economica"));
                              console.log('Valor actividad_nombre en form:', form.watch("actividad_nombre"));
                              console.log('=====================================');
                              return null;
                            })()}
                            {[
                              { codigo: "0111", descripcion: "Cultivo de cereales" },
                              { codigo: "0112", descripcion: "Cultivo de arroz" },
                              { codigo: "0113", descripcion: "Cultivo de hortalizas" },
                              { codigo: "0141", descripcion: "Cría de ganado bovino" },
                              { codigo: "1011", descripcion: "Procesamiento y conservación de carne" },
                              { codigo: "1071", descripcion: "Elaboración de productos de panadería" },
                              { codigo: "2011", descripcion: "Fabricación de sustancias químicas" },
                              { codigo: "4711", descripcion: "Comercio al por menor" },
                              { codigo: "6201", descripcion: "Actividades de desarrollo de sistemas informáticos" },
                              { codigo: "8411", descripcion: "Actividades de la administración pública" },
                              { codigo: "8511", descripcion: "Educación preescolar" },
                              { codigo: "8610", descripcion: "Actividades de hospitales" },
                              { codigo: "9311", descripcion: "Gestión de instalaciones deportivas" },
                              { codigo: "9602", descripcion: "Peluquería y otros tratamientos de belleza" }
                            ].map((actividad) => (
                              <CommandItem
                                key={actividad.codigo}
                                value={`${actividad.codigo} - ${actividad.descripcion}`}
                                onSelect={() => {
                                  form.setValue("actividad_economica", actividad.codigo);
                                  form.setValue("actividad_nombre", `${actividad.codigo} - ${actividad.descripcion}`);
                                  setActividadEconomicaOpen(false);
                                }}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${form.watch("actividad_economica") === actividad.codigo ? "opacity-100" : "opacity-0"
                                    }`}
                                />
                                <span className="font-normal">{actividad.codigo} - {actividad.descripcion}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Plantillas de Solicitudes */}
                {entityType === 'afiliada' && (
                  <div>
                    <Label className="text-left">Plantillas de Solicitudes</Label>
                    
                    {/* Información sobre RLS si no hay plantillas */}
                    {plantillas.length === 0 && !loadingPlantillas && (
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-blue-800">
                            <strong>Info:</strong> No hay plantillas disponibles. 
                            Esto puede deberse a políticas de seguridad (RLS) en Supabase.
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                alert(`Para solucionar problemas de RLS:\n1. Ir a Supabase Dashboard\n2. Tabla: plantillas_solicitudes\n3. Configurar políticas RLS`);
                              } catch (error) {
                                console.error('Error al verificar permisos:', error);
                                alert(`Error al verificar permisos: ${error}`);
                              }
                            }}
                          >
                            Verificar Permisos
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    <div className="relative mt-2" ref={dropdownRef}>
                      <div
                        className="w-full min-h-10 border rounded-md p-2 flex flex-wrap gap-1 cursor-pointer"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      >
                        {plantillasAsignadas.length === 0 ? (
                          <span className="text-gray-400">
                            {loadingPlantillas ? "Cargando plantillas..." :
                              plantillasError ? "Error al cargar plantillas" :
                                plantillas.length === 0 ? "No hay plantillas disponibles" : "Seleccionar plantillas..."}
                          </span>
                        ) : (
                          plantillasAsignadas.map(id => {
                            const plantilla = plantillas.find(p => p.id === id);
                            return plantilla ? (
                              <span
                                key={id}
                                className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center gap-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPlantillasAsignadas(plantillasAsignadas.filter(pId => pId !== id));
                                }}
                              >
                                {plantilla.nombre}
                                <X className="h-3 w-3" />
                              </span>
                            ) : null;
                          })
                        )}
                        <ChevronDown className={`h-4 w-4 ml-auto self-center transition-transform ${isDropdownOpen ? 'transform rotate-180' : ''}`} />
                      </div>

                      {isDropdownOpen && (
                        <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                          {loadingPlantillas ? (
                            <div className="p-4 text-center text-gray-500">
                              <div className="flex items-center justify-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                Cargando plantillas...
                              </div>
                            </div>
                          ) : plantillasError ? (
                            <div className="p-4 text-center text-red-500">
                              <div className="flex flex-col items-center gap-2">
                                <span>⚠️</span>
                                <div>
                                  <p className="font-medium">Error al cargar plantillas</p>
                                  <p className="text-sm">{plantillasError.message}</p>
                                </div>
                              </div>
                            </div>
                          ) : plantillas.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                              <div className="flex flex-col items-center gap-2">
                                <FileText className="h-8 w-8 text-gray-400" />
                                <div>
                                  <p className="font-medium">No hay plantillas disponibles</p>
                                  <p className="text-sm">Las plantillas se cargan desde la base de datos</p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="p-2 text-xs text-gray-500 border-b bg-gray-50">
                                <div className="flex items-center justify-between">
                                  <span>{plantillas.length} plantilla(s) encontrada(s)</span>
                                  <span className="text-blue-600 font-medium">
                                    {plantillasAsignadas.length} seleccionada(s)
                                    {initialData && plantillasAsignadas.length > 0 && (
                                      <span className="ml-1 text-green-600">
                                        (Editando)
                                      </span>
                                    )}
                                  </span>
                                </div>
                              </div>
                              {plantillas.map(plantilla => (
                                <div
                                  key={plantilla.id}
                                  className={`p-3 hover:bg-gray-100 cursor-pointer flex items-center gap-3 ${plantillasAsignadas.includes(plantilla.id) ? 'bg-blue-50 border-l-2 border-blue-500' : ''}`}
                                  onClick={() => {
                                    if (plantillasAsignadas.includes(plantilla.id)) {
                                      setPlantillasAsignadas(plantillasAsignadas.filter(id => id !== plantilla.id));
                                    } else {
                                      setPlantillasAsignadas([...plantillasAsignadas, plantilla.id]);
                                    }
                                  }}
                                >
                                  <div className={`w-4 h-4 border rounded flex items-center justify-center ${plantillasAsignadas.includes(plantilla.id) ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                                    {plantillasAsignadas.includes(plantilla.id) && <Check className="h-3 w-3 text-white" />}
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-medium text-sm">{plantilla.nombre}</div>
                                    <div className="text-xs text-gray-500">
                                      {plantilla.descripcion || 'Sin descripción'}
                                      {plantilla.es_default && (
                                        <span className="ml-2 px-1 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                                          Default
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenPreview(plantilla);
                                    }}
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      {loadingPlantillas ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                          Cargando plantillas desde la base de datos...
                        </div>
                      ) : plantillasError ? (
                        <div className="flex items-center gap-2 text-red-600">
                          <span>⚠️</span>
                          Error al cargar plantillas: {plantillasError.message}
                        </div>
                      ) : plantillas.length === 0 ? (
                        <div className="flex items-center gap-2 text-amber-600">
                          <span>⚠️</span>
                          No hay plantillas disponibles en la base de datos
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span>Haz clic para seleccionar o deseleccionar plantillas</span>
                          {plantillasAsignadas.length > 0 && (
                            <span className="text-blue-600 font-medium">
                              {plantillasAsignadas.length} plantilla(s) seleccionada(s)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

              {/* Separador */}
              <div className="border-t border-gray-200 my-6"></div>

              {/* Sección de Documentos */}
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <FileUp className="w-5 h-5 text-blue-600" />
                  Documentos
                </h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                {[
                  { id: 'contrato', label: 'Contrato', icon: '📄' },
                  { id: 'camara_comercio', label: 'Cámara de Comercio', icon: '🏢' },
                  { id: 'rut', label: 'RUT', icon: '📋' }
                ].map((doc) => (
                  <div key={doc.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{doc.icon}</span>
                        <div>
                          <h4 className="font-semibold text-sm text-gray-800">{doc.label}</h4>
                          <p className="text-xs text-gray-500">Formato PDF</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {uploadedFiles[doc.id] ? (
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-3 w-3" />
                              <span className="text-xs font-medium">Subido</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDocument(doc.id)}
                                className="h-7 w-7 p-0 hover:bg-blue-50 rounded-full"
                                title="Visualizar documento"
                              >
                                <Eye className="h-4 w-4 text-blue-600" />
                              </Button>
                              {initialData && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => document.getElementById(doc.id)?.click()}
                                  className="h-7 w-7 p-0 hover:bg-gray-50 rounded-full"
                                  title="Cambiar documento"
                                >
                                  <Upload className="h-4 w-4 text-gray-600" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById(doc.id)?.click()}
                            className="h-7 px-3 text-xs font-medium"
                          >
                            <Upload className="h-3 w-3 mr-1" />
                            Subir
                          </Button>
                        )}
                        <input
                          id={doc.id}
                          type="file"
                          className="hidden"
                          accept=".pdf"
                          onChange={(e) => handleFileChange(e, doc.id)}
                          onClick={(e) => (e.target as HTMLInputElement).value = ''}
                        />
                      </div>
                    </div>
                    {uploadedFiles[doc.id] && (
                      <div className="text-xs mt-2 p-2 bg-gray-50 rounded">
                        <div className="text-gray-700 mb-1">
                          <span className="font-medium">Archivo:</span> {uploadedFiles[doc.id]}
                        </div>
                        {initialData && (
                          <div className="text-blue-600">
                            <span className="font-medium">Estado:</span> {existingDocuments[doc.id] ? 'Documento existente' : 'Nuevo documento'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

              {/* Botones de acción */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onSaved?.()}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {initialData ? "Actualizar Empresa" : "Registrar Empresa"}
                </Button>
              </div>
          </CardContent>
        </Card>
      </form>

      {/* Modal para visualizar documentos */}
      <Dialog open={showDocumentPreview} onOpenChange={setShowDocumentPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Visualizar Documento: {previewDocument?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {previewDocument?.content ? (
              <div className="w-full h-[70vh]">
                <iframe
                  src={previewDocument.content}
                  className="w-full h-full border rounded-lg"
                  title={`Visualización de ${previewDocument.name}`}
                />
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">Documento no disponible</p>
                <p className="text-sm">No se puede visualizar el documento</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal independiente para el preview de plantillas */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent 
          className="max-w-6xl max-h-[90vh] overflow-y-auto"
          onPointerDownOutside={(e) => {
            // Solo cerrar si se hace clic en el overlay (fuera del contenido)
            if (e.target === e.currentTarget) {
              return;
            }
            // Prevenir que se cierre si se hace clic dentro del contenido
            e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            // Permitir cerrar con Escape
            return;
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Vista Previa del Formulario: {previewPlantilla?.nombre}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-6">
            {/* Información de la Plantilla */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-3">Información de la Plantilla</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Nombre:</span> {previewPlantilla?.nombre}
                </div>
                <div>
                  <span className="font-medium">Estado:</span> 
                  <span className={`ml-1 px-2 py-1 rounded text-xs ${previewPlantilla?.activa ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {previewPlantilla?.activa ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
                {previewPlantilla?.descripcion && (
                  <div className="col-span-2">
                    <span className="font-medium">Descripción:</span> {previewPlantilla.descripcion}
                  </div>
                )}
                {previewPlantilla?.es_default && (
                  <div className="col-span-2">
                    <span className="font-medium">Tipo:</span> 
                    <span className="ml-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                      Plantilla por Defecto
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Preview del Formulario */}
            <div>
              <h4 className="font-medium mb-4 text-gray-800">Preview del Formulario</h4>
              <div className="border rounded-lg p-6 bg-white">
                {previewPlantilla?.estructura_formulario ? (
                  <>
                    {/* Debug info */}
                    <div className="mb-4 p-2 bg-blue-50 rounded text-xs">
                      <strong>Debug:</strong> Estructura encontrada
                      <br />
                      <strong>Tipo:</strong> {typeof previewPlantilla.estructura_formulario}
                      <br />
                      <strong>Tiene secciones:</strong> {previewPlantilla.estructura_formulario.secciones ? 'Sí' : 'No'}
                      <br />
                      <strong>Tiene campos:</strong> {previewPlantilla.estructura_formulario.campos ? 'Sí' : 'No'}
                      <br />
                      <strong>Secciones count:</strong> {previewPlantilla.estructura_formulario.secciones?.length || 0}
                    </div>
                    <FormRenderer estructura={previewPlantilla.estructura_formulario} />
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">No hay estructura definida</p>
                    <p className="text-sm">Esta plantilla no tiene estructura de formulario configurada</p>
                  </div>
                )}
              </div>
            </div>

            {/* Estructura JSON Raw */}
            <div>
              <h4 className="font-medium mb-2 text-gray-800">Estructura JSON</h4>
              <div className="bg-gray-100 p-4 rounded-lg">
                <pre className="text-xs overflow-auto max-h-64">
                  {JSON.stringify(previewPlantilla?.estructura_formulario, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Form>
  );
}

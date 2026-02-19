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
import { actividadesEconomicasService } from '@/services/actividadesEconomicasService';
import { toast } from 'sonner';
import FormRenderer from '@/components/FormRenderer';
import { Company } from '@/types/company';
import { CreateEmpresaDTO, createEmpresaSchema } from '@/types/empresa';
import { useLoading } from '@/contexts/LoadingContext';
import { supabase } from '@/services/supabaseClient';

interface CompanyFormProps {
  initialData?: any; // Cambiado de Company a any para soportar las nuevas propiedades
  onSaved?: () => void;
  onCancel?: () => void;
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

// Función para convertir archivo a Base64 (mantenida para compatibilidad con previews)
const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Función helper para establecer sesión de Supabase Auth si es necesario
const ensureSupabaseSession = async (): Promise<boolean> => {
  try {
    // Verificar si ya hay una sesión activa
    const { data: { session } } = await supabase.auth.getSession();
    if (session && session.user) {
      return true;
    }

    // Intentar establecer sesión usando el sistema de autenticación personalizado
    const userData = localStorage.getItem('userData');
    const authToken = localStorage.getItem('authToken');

    if (!userData || !authToken) {
      return false;
    }

    const parsedUserData = JSON.parse(userData);

    // Primero intentar refrescar la sesión si existe
    const { data: { user }, error: getUserError } = await supabase.auth.getUser();
    if (user && !getUserError) {
      // Intentar refrescar la sesión
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshedSession && !refreshError) {
        return true;
      }
    }

    // Si no hay sesión activa, intentar hacer sign in
    // Intentar obtener la contraseña desde sessionStorage (guardada durante el login)
    const email = parsedUserData.email || `${parsedUserData.username}@compensamos.com`;

    // Intentar sign in con el email y una contraseña temporal (si está disponible)
    // La contraseña se guarda en sessionStorage durante el login para este propósito
    try {
      const tempPassword = sessionStorage.getItem('temp_password');

      if (tempPassword) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email,
          password: tempPassword
        });

        if (!signInError && signInData?.session) {
          return true;
        } else {
          // Si el sign in falla, puede ser que el usuario no exista en Supabase Auth
          // Intentar crear el usuario una vez
          const syncKey = `supabase_auth_sync_attempted_${parsedUserData.id}`;
          if (!localStorage.getItem(syncKey)) {
            localStorage.setItem(syncKey, 'true');

            try {
              const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email: email,
                password: tempPassword,
                options: {
                  data: {
                    username: parsedUserData.username,
                    id: parsedUserData.id,
                    primer_nombre: parsedUserData.primerNombre,
                    primer_apellido: parsedUserData.primerApellido,
                    role: parsedUserData.role
                  }
                }
              });

              if (!signUpError && signUpData?.session) {
                return true;
              }
            } catch (signUpError) {
              // Error silenciado
            }
          }
        }
      }
    } catch (signInError) {
      // Error silenciado
    }

    return false;
  } catch (error) {
    return false;
  }
};

// Función para subir archivo a Supabase Storage
const uploadFileToStorage = async (
  file: File,
  folder: string,
  empresaId?: number
): Promise<string> => {
  // Verificar autenticación usando el sistema personalizado (localStorage)
  const userData = localStorage.getItem('userData');
  const authToken = localStorage.getItem('authToken');

  if (!userData || !authToken) {
    throw new Error('Debes estar autenticado para subir archivos');
  }

  // Intentar establecer sesión de Supabase Auth si no existe
  await ensureSupabaseSession();

  // Generar nombre único para el archivo
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const fileName = empresaId
    ? `${empresaId}_${timestamp}_${sanitizedName}`
    : `temp_${timestamp}_${sanitizedName}`;
  const filePath = `${folder}/${fileName}`;

  // Subir el archivo a Storage
  const { data, error } = await supabase.storage
    .from('empresas-documentos')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Error subiendo archivo a Storage:', error);
    throw error;
  }

  // Obtener URL pública del archivo
  const { data: urlData } = supabase.storage
    .from('empresas-documentos')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
};

// Función para eliminar archivo de Storage
const deleteFileFromStorage = async (url: string): Promise<void> => {
  if (!url || typeof url !== 'string') {
    return; // URL inválida
  }

  // Solo procesar si es una URL de Storage (http/https)
  if (!url.startsWith('http') && !url.startsWith('https')) {
    return; // No es una URL de Storage válida (probablemente es base64)
  }

  try {
    // Intentar extraer la ruta del archivo de diferentes formatos de URL de Supabase Storage
    let filePath = '';

    // Formato 1: /storage/v1/object/public/empresas-documentos/...
    if (url.includes('/storage/v1/object/public/empresas-documentos/')) {
      const urlParts = url.split('/storage/v1/object/public/empresas-documentos/');
      if (urlParts.length >= 2) {
        filePath = urlParts[1];
        // Remover query params si existen
        filePath = filePath.split('?')[0];
        // Decodificar URL encoding si existe
        filePath = decodeURIComponent(filePath);
        // Limpiar el path (remover espacios al inicio/fin y slashes duplicados)
        filePath = filePath.trim().replace(/\/+/g, '/');
      }
    }
    // Formato 2: /storage/v1/object/sign/empresas-documentos/... (signed URLs)
    else if (url.includes('/storage/v1/object/sign/empresas-documentos/')) {
      const urlParts = url.split('/storage/v1/object/sign/empresas-documentos/');
      if (urlParts.length >= 2) {
        // Remover los parámetros de firma (ej: ?token=...)
        filePath = urlParts[1].split('?')[0];
        // Decodificar URL encoding si existe
        filePath = decodeURIComponent(filePath);
        // Limpiar el path
        filePath = filePath.trim().replace(/\/+/g, '/');
      }
    }
    // Formato 3: URL directa con el path (fallback)
    else if (url.includes('empresas-documentos')) {
      // Intentar extraer el path después de empresas-documentos
      const match = url.match(/empresas-documentos\/(.+?)(?:\?|$)/);
      if (match && match[1]) {
        filePath = match[1];
        // Decodificar URL encoding si existe
        filePath = decodeURIComponent(filePath);
        // Limpiar el path
        filePath = filePath.trim().replace(/\/+/g, '/');
      }
    }

    if (!filePath) {
      console.error('❌ No se pudo extraer la ruta del archivo de la URL:', url);
      throw new Error(`No se pudo extraer el path de la URL: ${url}`);
    }

    // Asegurar que el path no empiece con / (debe ser relativo al bucket)
    if (filePath.startsWith('/')) {
      filePath = filePath.substring(1);
    }

    // Verificar autenticación antes de eliminar
    await ensureSupabaseSession();

    // Verificar sesión actual
    const { data: { session } } = await supabase.auth.getSession();

    // Validar que el path no esté vacío y tenga el formato correcto
    if (!filePath || filePath.trim().length === 0) {
      throw new Error('El path del archivo está vacío');
    }

    // Asegurar que el path no incluya el nombre del bucket
    if (filePath.startsWith('empresas-documentos/')) {
      filePath = filePath.replace('empresas-documentos/', '');
    }

    // Normalizar el path final
    const normalizedPath = filePath.trim().replace(/^\/+|\/+$/g, '');

    if (!normalizedPath || normalizedPath.length === 0) {
      throw new Error('El path normalizado está vacío');
    }

    const { data, error } = await supabase.storage
      .from('empresas-documentos')
      .remove([normalizedPath]);

    if (error) {
      console.error('❌ Error eliminando archivo de Storage:', error);
      throw error;
    }
  } catch (error: any) {
    console.error('❌ Error al procesar eliminación de archivo:', error);
    // Re-lanzar el error para que el código que llama pueda manejarlo
    throw error;
  }
};

export function CompanyForm({ initialData, onSaved, onCancel, entityType = 'afiliada' }: CompanyFormProps) {

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
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  // Estados para URLs de archivos subidos a Storage
  const [fileUrls, setFileUrls] = useState<{ [key: string]: string }>({});
  const [uploading, setUploading] = useState<{ [key: string]: boolean }>({});

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
      if (Array.isArray(initialData.plantillas) && initialData.plantillas.length > 0) {
        const plantillaIds = initialData.plantillas.map((p: any) => {
          const id = Number(p.id || p.plantilla_id);
          return id;
        });
        setPlantillasAsignadas(plantillaIds);
      } else {
        setPlantillasAsignadas([]);
      }
    } else {
      setPlantillasAsignadas([]);
    }
  }, [initialData]);

  // Obtener plantillas activas de la base de datos
  const { data: plantillas = [], isLoading: loadingPlantillas, error: plantillasError } = useQuery({
    queryKey: ['plantillas-activas'],
    queryFn: async () => {
      try {
        const result = await plantillasService.getAllActivas();
        return result;
      } catch (error) {
        console.error('Error al cargar plantillas activas:', error);
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
        const result = await regimenTributarioService.getAll();
        return result;
      } catch (error) {
        console.error('Error al cargar regímenes tributarios:', error);
        throw error;
      }
    },
    retry: 3,
    retryDelay: 1000,
  });

  // Obtener actividades económicas de la base de datos
  const { data: actividadesEconomicas = [], isLoading: loadingActividades } = useQuery({
    queryKey: ['actividades-economicas'],
    queryFn: async () => {
      try {
        const result = await actividadesEconomicasService.getAll();
        return result;
      } catch (error) {
        console.error('Error al cargar actividades económicas:', error);
        throw error;
      }
    },
    retry: 3,
    retryDelay: 1000,
  });


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
      documento_contrato_base64: "",
      documento_camara_comercio_base64: "",
      documento_rut_base64: "",
      logo_base64: "",
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
        // Cargar URLs de documentos existentes (preferir URLs de Storage sobre base64)
        documento_contrato_url: initialData.documento_contrato_url || initialData.documento_contrato || "",
        documento_camara_comercio_url: initialData.documento_camara_comercio_url || initialData.documento_camara_comercio || "",
        documento_rut_url: initialData.documento_rut_url || initialData.documento_rut || "",
        logo_url: initialData.logo_url || initialData.logo_base64 || "",
        documentos: []
      };

      form.reset(formData);

      // Cargar plantillas asociadas si existen
      if (initialData.plantillas && Array.isArray(initialData.plantillas) && initialData.plantillas.length > 0) {
        const plantillaIds = initialData.plantillas.map((p: any) => {
          const id = Number(p.id || p.plantilla_id);
          return id;
        });
        setPlantillasAsignadas(plantillaIds);
      } else {
        setPlantillasAsignadas([]);
      }

      // Cargar URLs de documentos existentes
      // Los documentos pueden estar guardados como URLs de Storage o como base64
      // Priorizar campos _url si existen, sino usar los campos directos
      const existingFileUrls: { [key: string]: string } = {};

      // Contrato
      const contratoUrl = initialData.documento_contrato_url || initialData.documento_contrato;
      if (contratoUrl && (contratoUrl.startsWith('http') || contratoUrl.startsWith('data:'))) {
        existingFileUrls['contrato'] = contratoUrl;
      }

      // Cámara de Comercio
      const camaraUrl = initialData.documento_camara_comercio_url || initialData.documento_camara_comercio;
      if (camaraUrl && (camaraUrl.startsWith('http') || camaraUrl.startsWith('data:'))) {
        existingFileUrls['camara_comercio'] = camaraUrl;
      }

      // RUT
      const rutUrl = initialData.documento_rut_url || initialData.documento_rut;
      if (rutUrl && (rutUrl.startsWith('http') || rutUrl.startsWith('data:'))) {
        existingFileUrls['rut'] = rutUrl;
      }

      // Logo
      const logoUrl = initialData.logo_url || initialData.logo_base64;
      if (logoUrl && (logoUrl.startsWith('http') || logoUrl.startsWith('data:'))) {
        existingFileUrls['logo'] = logoUrl;
      }
      setFileUrls(existingFileUrls);

      // Cargar nombres de archivos para mostrar en la UI
      // Usar nombres más descriptivos basados en las URLs
      const existingDocs: { [key: string]: string } = {};
      if (existingFileUrls['contrato']) {
        // Extraer nombre del archivo de la URL si es posible
        const fileName = existingFileUrls['contrato'].split('/').pop() || 'Documento de contrato';
        existingDocs['contrato'] = fileName.includes('_') ? fileName.split('_').slice(2).join('_') : 'Documento de contrato cargado';
      }
      if (existingFileUrls['camara_comercio']) {
        const fileName = existingFileUrls['camara_comercio'].split('/').pop() || 'Documento de cámara de comercio';
        existingDocs['camara_comercio'] = fileName.includes('_') ? fileName.split('_').slice(2).join('_') : 'Documento de cámara de comercio cargado';
      }
      if (existingFileUrls['rut']) {
        const fileName = existingFileUrls['rut'].split('/').pop() || 'Documento RUT';
        existingDocs['rut'] = fileName.includes('_') ? fileName.split('_').slice(2).join('_') : 'Documento RUT cargado';
      }
      setUploadedFiles(existingDocs);
      setExistingDocuments(existingDocs);

      // Cargar logo si existe (priorizar URL de Storage)
      if (initialData.logo_url || initialData.logo_base64) {
        // Si es URL de Storage, usar directamente; si es base64, usar para preview
        if (initialData.logo_url && initialData.logo_url.startsWith('http')) {
          setLogoPreview(initialData.logo_url);
        } else if (initialData.logo_base64) {
          setLogoPreview(initialData.logo_base64);
        }
      }

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
        // IMPORTANTE: Guardar las URLs de Storage directamente en los campos documento_contrato, documento_camara_comercio, documento_rut
        // Priorizar fileUrls (estado actual con URLs de Storage) sobre los valores del formulario
        documento_contrato: fileUrls['contrato'] || data.documento_contrato_url || data.documento_contrato || "",
        documento_camara_comercio: fileUrls['camara_comercio'] || data.documento_camara_comercio_url || data.documento_camara_comercio || "",
        documento_rut: fileUrls['rut'] || data.documento_rut_url || data.documento_rut || "",
        logo_base64: fileUrls['logo'] || data.logo_url || data.logo_base64 || "",
        tipo_empresa: data.tipo_empresa || 'prestador',
        tipo_documento: data.tipo_documento, // Agregar el campo que falta
        activo: data.activo || true,
        plantillas_seleccionadas: plantillasAsignadas // Array de IDs de plantillas
      };

      let empresaId: number | undefined;

      if (initialData?.id) {
        // Actualizar empresa existente
        empresaId = initialData.id;

        // Asegurar que las URLs de Storage se incluyan en el payload
        // Priorizar fileUrls (URLs actuales de Storage) sobre los valores del formulario
        empresaPayload.documento_contrato = fileUrls['contrato'] || empresaPayload.documento_contrato || "";
        empresaPayload.documento_camara_comercio = fileUrls['camara_comercio'] || empresaPayload.documento_camara_comercio || "";
        empresaPayload.documento_rut = fileUrls['rut'] || empresaPayload.documento_rut || "";
        empresaPayload.logo_base64 = fileUrls['logo'] || empresaPayload.logo_base64 || "";

        const updatedEmpresa = await empresaService.update(empresaId!, empresaPayload);
        if (!updatedEmpresa) {
          throw new Error('No se pudo actualizar la empresa');
        }
      } else {
        // Crear nueva empresa
        const newEmpresa = await empresaService.create(empresaPayload);
        if (!newEmpresa || !newEmpresa.id) {
          throw new Error('No se pudo crear la empresa');
        }
        empresaId = newEmpresa.id;

        // Mover archivos temporales a la carpeta de la empresa y actualizar URLs
        const filesToMove = ['contrato', 'camara_comercio', 'rut', 'logo'];
        const updatedFileUrls: { [key: string]: string } = { ...fileUrls };

        for (const fileType of filesToMove) {
          const tempUrl = fileUrls[fileType];
          if (tempUrl && tempUrl.includes('/empresas/temp/')) {
            try {
              // Extraer nombre del archivo de la URL temporal
              const urlParts = tempUrl.split('/empresas/temp/');
              if (urlParts.length > 1) {
                const fileName = urlParts[1];
                const oldPath = `empresas/temp/${fileName}`;
                const newPath = `empresas/${empresaId}/${fileName}`;

                // Mover archivo de temp a la carpeta de la empresa
                const { data: movedFile, error: moveError } = await supabase.storage
                  .from('empresas-documentos')
                  .move(oldPath, newPath);

                if (moveError) {
                  console.error(`Error moviendo archivo ${fileType}:`, moveError);
                  // Intentar copiar si move no funciona
                  const { data: fileData } = await supabase.storage
                    .from('empresas-documentos')
                    .download(oldPath);

                  if (fileData) {
                    await supabase.storage
                      .from('empresas-documentos')
                      .upload(newPath, fileData);

                    // Eliminar archivo temporal
                    await supabase.storage
                      .from('empresas-documentos')
                      .remove([oldPath]);
                  }
                }

                // Obtener la nueva URL pública después de mover
                const { data: urlData } = supabase.storage
                  .from('empresas-documentos')
                  .getPublicUrl(newPath);

                updatedFileUrls[fileType] = urlData.publicUrl;
              }
            } catch (error) {
              console.error(`Error procesando archivo ${fileType} después de crear empresa:`, error);
            }
          } else if (tempUrl && !tempUrl.includes('/empresas/temp/')) {
            // Si ya está en la carpeta correcta, mantener la URL
            updatedFileUrls[fileType] = tempUrl;
          }
        }

        // Actualizar la empresa con las URLs finales (después de mover archivos)
        const finalUrls: any = {
          documento_contrato: updatedFileUrls['contrato'] || empresaPayload.documento_contrato || "",
          documento_camara_comercio: updatedFileUrls['camara_comercio'] || empresaPayload.documento_camara_comercio || "",
          documento_rut: updatedFileUrls['rut'] || empresaPayload.documento_rut || "",
          logo_base64: updatedFileUrls['logo'] || empresaPayload.logo_base64 || ""
        };

        // Actualizar la empresa con las URLs finales
        await empresaService.update(empresaId, finalUrls);

        // Actualizar el estado local con las URLs finales
        setFileUrls(updatedFileUrls);
      }

      toast.success(
        initialData
          ? `${entityType === 'prestador' ? 'Prestador' : 'Empresa'} actualizada`
          : `${entityType === 'prestador' ? 'Prestador' : 'Empresa'} registrada`,
        {
          description: initialData
            ? `La información del ${entityType === 'prestador' ? 'prestador' : 'la empresa'} ha sido actualizada exitosamente.`
            : `${entityType === 'prestador' ? 'El prestador' : 'La empresa'} ha sido registrada exitosamente.`
        }
      );
      if (!initialData) {
        form.reset();
        setUploadedFiles({});
      }
      if (onSaved) {
        onSaved();
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Hubo un error al procesar la solicitud. Por favor, intente nuevamente.");
    } finally {
      stopLoading();
    }
  };

  const handlePlantillaChange = (plantillaId: string) => {
    setSelectedPlantilla(Number(plantillaId));
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, documentType: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo (solo PDFs para documentos)
    if (file.type !== 'application/pdf') {
      toast.error("Solo se permiten archivos PDF para documentos.");
      return;
    }

    try {
      // Mostrar loading global
      startLoading();
      setUploading(prev => ({ ...prev, [documentType]: true }));

      // Eliminar archivo anterior si existe (tanto de Storage como de initialData)
      const oldUrl = fileUrls[documentType] ||
        (documentType === 'contrato' ? initialData?.documento_contrato : null) ||
        (documentType === 'camara_comercio' ? initialData?.documento_camara_comercio : null) ||
        (documentType === 'rut' ? initialData?.documento_rut : null);

      if (oldUrl && (oldUrl.startsWith('http') || oldUrl.startsWith('https'))) {
        // Solo eliminar si es una URL de Storage (no base64)
        try {
          await deleteFileFromStorage(oldUrl);
        } catch (deleteError) {
          console.error(`❌ Error al eliminar archivo anterior para ${documentType}:`, deleteError);
          // Continuar de todas formas para no bloquear la subida del nuevo archivo
        }
      }

      // Subir archivo a Storage
      const empresaId = initialData?.id;
      const folder = empresaId ? `empresas/${empresaId}` : 'empresas/temp';
      const fileUrl = await uploadFileToStorage(file, folder, empresaId);

      // Guardar la URL en el estado y en el formulario
      setFileUrls(prev => ({ ...prev, [documentType]: fileUrl }));

      // Guardar en el formulario usando los campos correctos según el tipo de documento
      // Nota: Estos campos no están en el schema pero se usan temporalmente antes de guardar
      if (documentType === 'contrato') {
        form.setValue('documento_contrato_url' as any, fileUrl);
      } else if (documentType === 'camara_comercio') {
        form.setValue('documento_camara_comercio_url' as any, fileUrl);
      } else if (documentType === 'rut') {
        form.setValue('documento_rut_url' as any, fileUrl);
      }

      setUploadedFiles(prev => ({
        ...prev,
        [documentType]: file.name
      }));

      // Si la empresa ya existe, actualizar la URL en la base de datos inmediatamente
      if (empresaId) {
        try {
          const updateField = documentType === 'contrato' ? 'documento_contrato' :
            documentType === 'camara_comercio' ? 'documento_camara_comercio' :
              'documento_rut';

          const updateData: any = { [updateField]: fileUrl };

          const { error: updateError } = await supabase
            .from('empresas')
            .update(updateData)
            .eq('id', empresaId);

          if (updateError) {
            console.error(`Error actualizando ${updateField} en la base de datos:`, updateError);
            toast.error(`Error al actualizar ${updateField} en la base de datos`);
          } else {
            toast.success("Documento subido y guardado", {
              description: `${file.name} se ha subido correctamente y la URL se ha actualizado en la base de datos.`
            });
          }
        } catch (dbError) {
          console.error('Error al actualizar la base de datos:', dbError);
          toast.error("Error al actualizar la base de datos.");
        }
      } else {
        toast.success("Documento subido", { description: `${file.name} se ha subido correctamente a Storage.` });
      }
    } catch (error) {
      console.error('Error al subir archivo:', error);
      toast.error("No se pudo subir el archivo a Storage.");
    } finally {
      setUploading(prev => ({ ...prev, [documentType]: false }));
      stopLoading(); // Ocultar loading global
    }
  };

  // Función para validar dimensiones de imagen
  const validateImageDimensions = (file: File): Promise<{ isValid: boolean; message: string }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const { width, height } = img;
        const aspectRatio = width / height;
        const targetAspectRatio = 16 / 9; // 16:9 ratio

        // Verificar si las dimensiones están en el rango recomendado
        const isWidthInRange = width >= 1200 && width <= 1920;
        const isHeightInRange = height >= 675 && height <= 1080;
        const isAspectRatioClose = Math.abs(aspectRatio - targetAspectRatio) < 0.5;

        if (isWidthInRange && isHeightInRange && isAspectRatioClose) {
          resolve({
            isValid: true,
            message: `Dimensiones óptimas: ${width}x${height}px (${aspectRatio.toFixed(2)}:1)`
          });
        } else {
          resolve({
            isValid: false,
            message: `Se recomienda 1600x900px (16:9). Actual: ${width}x${height}px. Se optimizará automáticamente.`
          });
        }
      };
      img.onerror = () => resolve({ isValid: false, message: 'No se pudo validar la imagen' });
      img.src = URL.createObjectURL(file);
    });
  };

  const handleLogoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      toast.error("Por favor selecciona un archivo de imagen válido.");
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("El logo debe ser menor a 5MB.");
      return;
    }

    try {
      // Mostrar loading global
      startLoading();
      setUploading(prev => ({ ...prev, logo: true }));

      // Validar dimensiones de la imagen
      const validation = await validateImageDimensions(file);

      // Mostrar información sobre la imagen
      if (validation.isValid) {
        toast.success("Imagen óptima", { description: validation.message });
      } else {
        toast.info("Imagen detectada", { description: validation.message });
      }

      // Eliminar logo anterior si existe (tanto de Storage como de initialData)
      const oldLogoUrl = fileUrls.logo || initialData?.logo_url || initialData?.logo_base64;
      if (oldLogoUrl && (oldLogoUrl.startsWith('http') || oldLogoUrl.startsWith('https'))) {
        // Solo eliminar si es una URL de Storage (no base64)
        await deleteFileFromStorage(oldLogoUrl);
      }

      // Comprimir la imagen
      const compressedImage = await compressImage(file);

      // Subir imagen comprimida a Storage
      const empresaId = initialData?.id;
      const folder = empresaId ? `empresas/${empresaId}` : 'empresas/temp';
      const logoUrl = await uploadFileToStorage(compressedImage, folder, empresaId);

      // Guardar la URL en el estado y en el formulario
      setFileUrls(prev => ({ ...prev, logo: logoUrl }));
      form.setValue('logo_url' as any, logoUrl);

      // También generar preview para visualización
      const base64 = await convertFileToBase64(compressedImage);
      setLogoPreview(base64);

      // Si la empresa ya existe, actualizar la URL en la base de datos inmediatamente
      if (empresaId) {
        try {
          const { error: updateError } = await supabase
            .from('empresas')
            .update({ logo_base64: logoUrl })
            .eq('id', empresaId);

          if (updateError) {
            console.error('Error actualizando logo en la base de datos:', updateError);
            toast.error("Error al actualizar el logo en la base de datos");
          } else {
            toast.success("Logo procesado y guardado", {
              description: "Imagen optimizada, subida a Storage y URL actualizada en la base de datos."
            });
          }
        } catch (dbError) {
          console.error('Error al actualizar la base de datos:', dbError);
          toast.error("Error al actualizar la base de datos.");
        }
      } else {
        toast.success("Logo procesado", { description: "Imagen optimizada y subida a Storage." });
      }
    } catch (error) {
      console.error('Error al procesar logo:', error);
      toast.error("No se pudo procesar el logo.");
    } finally {
      setUploading(prev => ({ ...prev, logo: false }));
      stopLoading(); // Ocultar loading global
    }
  };

  // Función para comprimir imágenes
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Usar las medidas recomendadas: 1600x900px (16:9 ratio)
        const targetWidth = 1600;
        const targetHeight = 900;

        // Calcular dimensiones manteniendo el aspect ratio
        let { width, height } = img;
        const aspectRatio = width / height;
        const targetAspectRatio = targetWidth / targetHeight;

        let finalWidth, finalHeight;

        if (aspectRatio > targetAspectRatio) {
          // Imagen más ancha que 16:9, ajustar por altura
          finalHeight = targetHeight;
          finalWidth = targetHeight * aspectRatio;
        } else {
          // Imagen más alta que 16:9, ajustar por ancho
          finalWidth = targetWidth;
          finalHeight = targetWidth / aspectRatio;
        }

        // Configurar canvas con las dimensiones finales
        canvas.width = finalWidth;
        canvas.height = finalHeight;

        // Crear fondo blanco para centrar la imagen
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, finalWidth, finalHeight);

          // Calcular posición para centrar la imagen
          const offsetX = (finalWidth - width) / 2;
          const offsetY = (finalHeight - height) / 2;

          // Dibujar imagen centrada
          ctx.drawImage(img, offsetX, offsetY, width, height);
        }

        // Convertir a blob con alta calidad (PNG para mantener transparencia)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.png'), {
                type: 'image/png',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Error al comprimir imagen'));
            }
          },
          'image/png',
          0.95 // Alta calidad
        );
      };

      img.onerror = () => reject(new Error('Error al cargar imagen'));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleOpenPreview = (plantilla: any) => {
    setPreviewPlantilla(plantilla);
    setShowPreviewModal(true);
    setIsDropdownOpen(false); // Cerrar el dropdown
  };

  const handleViewDocument = (docType: string) => {
    let documentContent = '';
    let documentName = '';

    // Obtener la URL del documento según el tipo
    // Priorizar: 1. fileUrls (Storage), 2. valores del formulario, 3. initialData
    switch (docType) {
      case 'contrato':
        documentContent = fileUrls['contrato'] ||
          (form.getValues('documento_contrato_url' as any)) ||
          initialData?.documento_contrato_url ||
          initialData?.documento_contrato ||
          form.getValues('documento_contrato_base64') || '';
        documentName = 'Contrato';
        break;
      case 'camara_comercio':
        documentContent = fileUrls['camara_comercio'] ||
          ((form as any).getValues('documento_camara_comercio_url')) ||
          initialData?.documento_camara_comercio_url ||
          initialData?.documento_camara_comercio ||
          form.getValues('documento_camara_comercio_base64') || '';
        documentName = 'Cámara de Comercio';
        break;
      case 'rut':
        documentContent = fileUrls['rut'] ||
          ((form as any).getValues('documento_rut_url')) ||
          initialData?.documento_rut_url ||
          initialData?.documento_rut ||
          form.getValues('documento_rut_base64') || '';
        documentName = 'RUT';
        break;
    }

    // Verificar si hay contenido
    if (documentContent) {
      // Si es una URL de Storage (HTTP/HTTPS), usar directamente
      if (documentContent.startsWith('http://') || documentContent.startsWith('https://')) {
        setPreviewDocument({
          content: documentContent,
          name: documentName,
          type: docType
        });
        setShowDocumentPreview(true);
      }
      // Si es base64 (retrocompatibilidad), usar directamente
      else if (documentContent.startsWith('data:application/pdf;base64,')) {
        setPreviewDocument({
          content: documentContent,
          name: documentName,
          type: docType
        });
        setShowDocumentPreview(true);
      }
      // Si parece ser una URL pero sin protocolo, intentar agregar https://
      else if (documentContent.includes('/') && !documentContent.includes('data:')) {
        // Probablemente es una ruta relativa de Storage, construir URL completa
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://supabase.179.33.214.86.sslip.io';
        const fullUrl = documentContent.startsWith('/')
          ? `${supabaseUrl}${documentContent}`
          : `${supabaseUrl}/${documentContent}`;

        setPreviewDocument({
          content: fullUrl,
          name: documentName,
          type: docType
        });
        setShowDocumentPreview(true);
      }
      else {
        toast.error("No se encontró un documento válido para visualizar.");
      }
    } else {
      toast.error("No se encontró un documento válido para visualizar.");
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
                            {loadingActividades ? (
                              <CommandItem disabled>
                                <div className="flex items-center gap-2">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                                  Cargando actividades económicas...
                                </div>
                              </CommandItem>
                            ) : (
                              actividadesEconomicas.map((actividad) => (
                                <CommandItem
                                  key={actividad.id}
                                  value={`${actividad.codigo} - ${actividad.nombre}`}
                                  onSelect={() => {
                                    form.setValue("actividad_economica", actividad.id.toString());
                                    form.setValue("actividad_nombre", `${actividad.codigo} - ${actividad.nombre}`);
                                    setActividadEconomicaOpen(false);
                                  }}
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${form.watch("actividad_economica") === actividad.id.toString() ? "opacity-100" : "opacity-0"
                                      }`}
                                  />
                                  <div className="flex flex-col">
                                    <span className="font-medium">{actividad.codigo} - {actividad.nombre}</span>
                                    {actividad.descripcion && (
                                      <span className="text-sm text-gray-500">{actividad.descripcion}</span>
                                    )}
                                  </div>
                                </CommandItem>
                              ))
                            )}
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
                            {loadingPlantillas ? "Cargando plantillas activas..." :
                              plantillasError ? "Error al cargar plantillas activas" :
                                plantillas.length === 0 ? "No hay plantillas activas disponibles" : "Seleccionar plantillas activas..."}
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
                                Cargando plantillas activas...
                              </div>
                            </div>
                          ) : plantillasError ? (
                            <div className="p-4 text-center text-red-500">
                              <div className="flex flex-col items-center gap-2">
                                <span>⚠️</span>
                                <div>
                                  <p className="font-medium">Error al cargar plantillas activas</p>
                                  <p className="text-sm">{plantillasError.message}</p>
                                </div>
                              </div>
                            </div>
                          ) : plantillas.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                              <div className="flex flex-col items-center gap-2">
                                <FileText className="h-8 w-8 text-gray-400" />
                                <div>
                                  <p className="font-medium">No hay plantillas activas disponibles</p>
                                  <p className="text-sm">Solo se muestran plantillas en estado activo</p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="p-2 text-xs text-gray-500 border-b bg-gray-50">
                                <div className="flex items-center justify-between">
                                  <span>{plantillas.length} plantilla(s) activa(s) encontrada(s)</span>
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
                          Cargando plantillas activas desde la base de datos...
                        </div>
                      ) : plantillasError ? (
                        <div className="flex items-center gap-2 text-red-600">
                          <span>⚠️</span>
                          Error al cargar plantillas activas: {plantillasError.message}
                        </div>
                      ) : plantillas.length === 0 ? (
                        <div className="flex items-center gap-2 text-amber-600">
                          <span>⚠️</span>
                          No hay plantillas activas disponibles en la base de datos
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span>Haz clic para seleccionar o deseleccionar plantillas activas</span>
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

            {/* Sección del Logo */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                Logo de la Empresa
              </h3>
              <div className="flex items-center gap-6">
                {/* Vista previa del logo */}
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-white flex items-center justify-center">
                    {logoPreview || form.watch('logo_base64') ? (
                      <div
                        className="logo-preview-empresa"
                        style={{
                          backgroundImage: `url(${logoPreview || form.watch('logo_base64')})`
                        }}
                      ></div>
                    ) : (
                      <div className="text-center text-gray-400">
                        <Building2 className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-xs">Sin logo</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Controles del logo */}
                <div className="flex-1">
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="logo" className="text-sm font-medium text-gray-700">
                        Seleccionar Logo
                      </Label>
                      <p className="text-xs text-gray-500 mt-1">
                        Formatos soportados: JPG, PNG. Tamaño máximo: 5MB.
                        Se optimizará automáticamente a 1600x900px (16:9 ratio).
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('logo')?.click()}
                        className="flex items-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        {form.watch('logo_base64') ? 'Cambiar Logo' : 'Subir Logo'}
                      </Button>

                      {form.watch('logo_base64') && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            form.setValue('logo_base64', '');
                            setLogoPreview(null);
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Quitar Logo
                        </Button>
                      )}
                    </div>

                    <input
                      id="logo"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleLogoChange}
                      onClick={(e) => (e.target as HTMLInputElement).value = ''}
                    />

                    {form.watch('logo_base64') && (
                      <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                        <CheckCircle className="w-3 h-3 inline mr-1" />
                        Logo cargado correctamente
                      </div>
                    )}
                  </div>
                </div>
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
                        {(uploadedFiles[doc.id] || fileUrls[doc.id]) ? (
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
                                disabled={!fileUrls[doc.id] && !uploadedFiles[doc.id]}
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
                    {(uploadedFiles[doc.id] || fileUrls[doc.id]) && (
                      <div className="text-xs mt-2 p-2 bg-gray-50 rounded">
                        <div className="text-gray-700 mb-1">
                          <span className="font-medium">Archivo:</span> {uploadedFiles[doc.id] || 'Documento cargado'}
                        </div>
                        {initialData && (fileUrls[doc.id] || existingDocuments[doc.id]) && (
                          <div className="text-blue-600">
                            <span className="font-medium">Estado:</span> Documento existente desde Storage
                          </div>
                        )}
                        {!initialData && uploadedFiles[doc.id] && (
                          <div className="text-green-600">
                            <span className="font-medium">Estado:</span> Nuevo documento listo para subir
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
                onClick={() => (onCancel ? onCancel() : onSaved?.())}
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




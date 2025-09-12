import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/services/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Upload, 
  LogOut,
  Save,
  AlertCircle,
  CheckCircle,
  Settings,
  Key,
  ChevronDown,
  Building,
  FileText,
  Download,
  Trash2,
  FileUp,
  CheckCircle2,
  Clock,
  Eye
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ExperienciaLaboralTab } from '@/components/candidatos/ExperienciaLaboralTab';
import { EducacionTab } from '@/components/candidatos/EducacionTab';

// Componente para estilos CSS personalizados
const ProgressStyles = () => (
  <style>{`
    @keyframes shimmer {
      0% {
        transform: translateX(-100%);
        opacity: 0;
      }
      50% {
        opacity: 1;
      }
      100% {
        transform: translateX(100%);
        opacity: 0;
      }
    }
    
    @keyframes progressGlow {
      0% {
        box-shadow: 0 0 5px rgba(139, 195, 74, 0.3);
        transform: scaleY(1);
      }
      100% {
        box-shadow: 0 0 20px rgba(139, 195, 74, 0.6);
        transform: scaleY(1.05);
      }
    }
    
    @keyframes progressWave {
      0% {
        background-position: 0% 50%;
      }
      50% {
        background-position: 100% 50%;
      }
      100% {
        background-position: 0% 50%;
      }
    }
    
    .progress-shimmer {
      animation: shimmer 3s ease-in-out infinite;
      width: 30%;
    }
    
    .progress-wave {
      animation: progressWave 3s ease-in-out infinite;
    }
    
    @keyframes titleGlow {
      0% {
        transform: scale(1);
        opacity: 1;
      }
      100% {
        transform: scale(1.02);
        opacity: 0.8;
      }
    }
    
    .form-input {
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      padding: 12px 16px;
      font-size: 16px;
      background: linear-gradient(145deg, #ffffff, #f8fafc);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }
    
    .form-input:focus {
      border-color: #0891b2;
      box-shadow: 0 0 0 3px rgba(8, 145, 178, 0.1), 0 4px 12px rgba(0, 0, 0, 0.1);
      background: #ffffff;
    }
    
    .form-input:hover {
      border-color: #a5d6a7;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }
    
    .form-select {
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      padding: 12px 16px;
      font-size: 16px;
      background: linear-gradient(145deg, #ffffff, #f8fafc);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }
    
    .form-select:focus {
      border-color: #0891b2;
      box-shadow: 0 0 0 3px rgba(8, 145, 178, 0.1), 0 4px 12px rgba(0, 0, 0, 0.1);
      background: #ffffff;
    }
    
    .form-select:hover {
      border-color: #a5d6a7;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }
    
    .form-textarea {
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      padding: 12px 16px;
      font-size: 16px;
      background: linear-gradient(145deg, #ffffff, #f8fafc);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      resize: vertical;
      min-height: 100px;
    }
    
    .form-textarea:focus {
      border-color: #0891b2;
      box-shadow: 0 0 0 3px rgba(8, 145, 178, 0.1), 0 4px 12px rgba(0, 0, 0, 0.1);
      background: #ffffff;
    }
    
    .form-textarea:hover {
      border-color: #a5d6a7;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }
    
    .form-field-group {
      transition: box-shadow 0.2s ease;
      padding: 20px;
      border-radius: 16px;
      background: linear-gradient(145deg, #ffffff, #f8fafc);
      border: 1px solid #e5e7eb;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    }
    
    .form-field-group:hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    }
    
    .form-label {
      font-size: 14px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 8px;
      display: block;
      text-align: left;
      letter-spacing: 0.025em;
      text-transform: uppercase;
      position: relative;
      transition: color 0.2s ease;
    }
    
    .form-label::before {
      content: '';
      position: absolute;
      left: -12px;
      top: 50%;
      transform: translateY(-50%);
      width: 4px;
      height: 16px;
      background: linear-gradient(135deg, #0891b2, #06b6d4);
      border-radius: 2px;
      opacity: 0;
      transition: opacity 0.2s ease;
    }
    
    .form-label:hover::before {
      opacity: 1;
    }
    
    .form-label:hover {
      color: #0891b2;
    }
    
    .form-label-required::after {
      content: ' *';
      color: #ef4444;
      font-weight: 700;
      margin-left: 2px;
    }
    
    .tab-trigger-inactive {
      color: #000000 !important;
    }
    
    .tab-trigger-inactive:hover {
      color: #000000 !important;
    }
    
    /* Estilos más específicos para forzar texto negro */
    [data-state="inactive"] {
      color: #000000 !important;
    }
    
    [data-state="inactive"]:hover {
      color: #000000 !important;
    }
    
    [data-state="inactive"] span {
      color: #000000 !important;
    }
    
    [data-state="inactive"]:hover span {
      color: #000000 !important;
    }
    
    /* Forzar texto negro en todos los estados de hover */
    button[role="tab"]:not([data-state="active"]) {
      color: #000000 !important;
    }
    
    button[role="tab"]:not([data-state="active"]):hover {
      color: #000000 !important;
    }
    
    button[role="tab"]:not([data-state="active"]) span {
      color: #000000 !important;
    }
    
    button[role="tab"]:not([data-state="active"]):hover span {
      color: #000000 !important;
    }
  `}</style>
);

const perfilSchema = z.object({
  nombres: z.string().min(2, 'Los nombres son requeridos'),
  apellidos: z.string().min(2, 'Los apellidos son requeridos'),
  fechaNacimiento: z.string().optional(),
  edad: z.union([
    z.number().min(18, 'Debe ser mayor de edad').max(100),
    z.undefined()
  ]).optional(),
  sexo: z.string().optional(),
  estadoCivil: z.string().optional(),
  telefono: z.string().min(10, 'Teléfono requerido'),
  direccion: z.string().optional(),
  ciudad: z.string().optional(),
  cargoAspirado: z.string().optional(),
  eps: z.string().optional(),
  arl: z.string().optional(),
  grupoSanguineo: z.string().optional(),
  nivelEducativo: z.string().optional(),
  contactoEmergenciaNombre: z.string().optional(),
  contactoEmergenciaTelefono: z.string().optional(),
  contactoEmergenciaRelacion: z.string().optional(),
});

type PerfilForm = z.infer<typeof perfilSchema>;

interface Candidato {
  id: number;
  email: string;
  nombres: string;
  apellidos: string;
  tipoDocumento: string;
  numeroDocumento: string;
  fechaNacimiento?: string;
  edad?: number;
  sexo?: string;
  estadoCivil?: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  cargoAspirado?: string;
  eps?: string;
  arl?: string;
  grupoSanguineo?: string;
  nivelEducativo?: string;
  contactoEmergenciaNombre?: string;
  contactoEmergenciaTelefono?: string;
  contactoEmergenciaRelacion?: string;
  hojaDeVida?: string;
  fotografia?: string;
  completado: boolean;
  estado: string;
  fechaRegistro: string;
}

interface ExperienciaLaboral {
  id?: number;
  empresa: string;
  fechaInicio: string;
  fechaFin: string;
  cargo: string;
  responsabilidades: string;
  salario: string | number;
  motivoRetiro?: string;
}

interface Educacion {
  id?: number;
  titulo: string;
  institucion: string;
  fechaInicio: string;
  fechaFin: string;
  ciudad: string;
  nivelEducativo: string;
}

export default function PerfilCandidato() {
  const { user, logout } = useAuth();
  const [candidato, setCandidato] = useState<Candidato | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  const [experienciaLaboral, setExperienciaLaboral] = useState<ExperienciaLaboral[]>([]);
  const [educacion, setEducacion] = useState<Educacion[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<{[key: string]: string}>({});
  const [existingDocuments, setExistingDocuments] = useState<any[]>([]);
  const [tiposDocumentos, setTiposDocumentos] = useState<any[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [uploadingDocuments, setUploadingDocuments] = useState<{[key: number]: boolean}>({});
  const [uploadProgress, setUploadProgress] = useState<{[key: number]: number}>({});
  const [tipoCandidato, setTipoCandidato] = useState<any>(null);
  const [documentosRequeridos, setDocumentosRequeridos] = useState<any[]>([]);
  const [isLoadingTipoCandidato, setIsLoadingTipoCandidato] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const navigate = useNavigate();

  const form = useForm<PerfilForm>({
    resolver: zodResolver(perfilSchema),
    defaultValues: {
      nombres: '',
      apellidos: '',
      fechaNacimiento: '',
      edad: undefined,
      sexo: '',
      estadoCivil: '',
      telefono: '',
      direccion: '',
      ciudad: '',
      cargoAspirado: '',
      eps: '',
      arl: '',
      grupoSanguineo: '',
      nivelEducativo: '',
      contactoEmergenciaNombre: '',
      contactoEmergenciaTelefono: '',
      contactoEmergenciaRelacion: '',
    },
  });

  useEffect(() => {
    loadProfile();
    loadTiposDocumentos();
  }, []);

  // Efecto para actualizar el progreso cuando cambien los valores del formulario
  useEffect(() => {
    if (candidato) {
      const subscription = form.watch((value) => {
        // Actualizar el candidato con los nuevos valores del formulario
        setCandidato(prev => prev ? { ...prev, ...value } : prev);
      });
      
      return () => subscription.unsubscribe();
    }
  }, [form, candidato]);

  // Efecto para monitorear el estado de validación
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'edad' || name === 'fechaNacimiento') {
        console.log('🔍 Formulario - Campo cambiado:', name, 'Valor:', value[name]);
        console.log('🔍 Formulario - Estado de errores:', form.formState.errors);
        console.log('🔍 Formulario - Estado de validación:', form.formState.isValid);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form]);

  // Efecto para forzar actualización del progreso cuando cambien los documentos
  useEffect(() => {
    if (candidato && (existingDocuments.length > 0 || documentosRequeridos.length > 0)) {
      console.log('🔄 Documentos actualizados - Forzando recálculo del progreso');
      // Forzar re-render del componente para actualizar el progreso
      setCandidato(prev => prev ? { ...prev } : prev);
    }
  }, [existingDocuments, documentosRequeridos, candidato]);

  // Función de auto-guardado
  const autoSave = async (data: any) => {
    if (!user || !candidato) return;
    
    try {
      setIsAutoSaving(true);
      console.log('💾 Auto-guardando cambios...');
      
      const { error } = await supabase
        .from('candidatos')
        .update({
          primer_nombre: data.nombres,
          primer_apellido: data.apellidos,
          fecha_nacimiento: data.fechaNacimiento,
          edad: data.edad,
          sexo: data.sexo,
          estado_civil: data.estadoCivil,
          telefono: data.telefono,
          direccion: data.direccion,
          ciudad: data.ciudad,
          cargo_aspirado: data.cargoAspirado,
          eps: data.eps,
          arl: data.arl,
          grupo_sanguineo: data.grupoSanguineo,
          nivel_educativo: data.nivelEducativo,
          contacto_emergencia_nombre: data.contactoEmergenciaNombre,
          contacto_emergencia_telefono: data.contactoEmergenciaTelefono,
          contacto_emergencia_relacion: data.contactoEmergenciaRelacion,
          updated_at: new Date().toISOString()
        })
        .eq('email', user.email);

      if (error) {
        console.error('Error en auto-guardado:', error);
      } else {
        console.log('✅ Auto-guardado exitoso');
      }
    } catch (error) {
      console.error('Error en auto-guardado:', error);
    } finally {
      setIsAutoSaving(false);
    }
  };

  // useEffect para auto-guardado con debounce
  useEffect(() => {
    if (!candidato) return;

    const timeoutId = setTimeout(() => {
      const formData = form.getValues();
      autoSave(formData);
    }, 2000); // Auto-guardar después de 2 segundos de inactividad

    return () => clearTimeout(timeoutId);
  }, [candidato, form.watch()]);

  // Cargar tipos de documentos
  const loadTiposDocumentos = async () => {
    try {
      const { data, error } = await supabase
        .from('tipos_documentos')
        .select('*')
        .eq('activo', true)
        .order('nombre');
      
      if (error) throw error;
      setTiposDocumentos(data || []);
    } catch (error) {
      console.error('Error cargando tipos de documentos:', error);
    }
  };

  // Cargar tipo de candidato y sus documentos requeridos
  const loadTipoCandidato = async (tipoCandidatoId: number) => {
    try {
      setIsLoadingTipoCandidato(true);
      
      // Cargar información del tipo de candidato
      const { data: tipoData, error: tipoError } = await supabase
        .from('tipos_candidatos')
        .select('*')
        .eq('id', tipoCandidatoId)
        .single();
      
      if (tipoError) throw tipoError;
      setTipoCandidato(tipoData);

      // Cargar documentos asociados al tipo de candidato
      const { data: documentosData, error: documentosError } = await supabase
        .from('tipos_candidatos_documentos')
        .select(`
          *,
          tipos_documentos (
            id,
            nombre,
            descripcion,
            activo
          )
        `)
        .eq('tipo_candidato_id', tipoCandidatoId)
        .eq('obligatorio', true)
        .order('orden');
      
      if (documentosError) throw documentosError;
      
      console.log('🔍 PerfilCandidato - Documentos requeridos cargados:', {
        tipoCandidatoId,
        totalDocumentos: documentosData?.length || 0,
        documentos: documentosData?.map(d => ({
          id: d.id,
          nombre: d.tipos_documentos.nombre,
          obligatorio: d.obligatorio,
          orden: d.orden
        }))
      });
      
      setDocumentosRequeridos(documentosData || []);
    } catch (error) {
      console.error('Error cargando tipo de candidato:', error);
    } finally {
      setIsLoadingTipoCandidato(false);
    }
  };

  // Cargar documentos existentes del candidato
  const loadDocumentosCandidato = async (candidatoId: number) => {
    try {
      setIsLoadingDocuments(true);
      const { data, error } = await supabase
        .from('candidatos_documentos')
        .select(`
          *,
          tipos_documentos (
            id,
            nombre,
            descripcion
          )
        `)
        .eq('candidato_id', candidatoId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setExistingDocuments(data || []);
      
      // Actualizar uploadedFiles con los documentos existentes
      const files: {[key: string]: string} = {};
      data?.forEach((doc: any) => {
        files[doc.tipos_documentos.nombre] = doc.nombre_archivo;
      });
      setUploadedFiles(files);
    } catch (error) {
      console.error('Error cargando documentos:', error);
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  // Función para obtener una empresa válida
  const getValidEmpresaId = async (): Promise<number> => {
    try {
      // Primero intentar obtener la empresa del candidato
      if (candidato?.id) {
        const { data: candidatoData } = await supabase
          .from('candidatos')
          .select('empresa_id')
          .eq('id', candidato.id)
          .single();
        
        if (candidatoData?.empresa_id) {
          return candidatoData.empresa_id;
        }
      }
      
      // Si no tiene empresa asignada, obtener la primera empresa disponible
      const { data: empresas } = await supabase
        .from('empresas')
        .select('id')
        .eq('activo', true)
        .limit(1)
        .single();
      
      if (empresas?.id) {
        return empresas.id;
      }
      
      // Si no hay empresas activas, usar la primera empresa disponible
      const { data: primeraEmpresa } = await supabase
        .from('empresas')
        .select('id')
        .limit(1)
        .single();
      
      if (primeraEmpresa?.id) {
        return primeraEmpresa.id;
      }
      
      throw new Error('No se encontró ninguna empresa válida');
    } catch (error) {
      console.error('Error obteniendo empresa válida:', error);
      throw error;
    }
  };

  // Función para manejar la subida de archivos por empresa
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, tipoDocumentoId: number, nombreDocumento: string) => {
    console.log('🔄 handleFileChange llamado:', { tipoDocumentoId, nombreDocumento });
    
    const file = e.target.files?.[0];
    console.log('📁 Archivo seleccionado:', file);
    
    if (!file) {
      console.log('❌ No se seleccionó ningún archivo');
      return;
    }

    if (file.type !== 'application/pdf') {
      toast.error("Solo se permiten archivos PDF");
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      toast.error("El archivo no puede superar 5MB");
      return;
    }

    try {
      setUploadingDocuments(prev => ({ ...prev, [tipoDocumentoId]: true }));
      setUploadProgress(prev => ({ ...prev, [tipoDocumentoId]: 0 }));
      console.log('⏳ Iniciando subida de archivo...');
      
      // Obtener empresa válida
      const empresaId = await getValidEmpresaId();
      console.log('🏢 Empresa ID obtenida:', empresaId);
      
      // Simular progreso de lectura del archivo
      setUploadProgress(prev => ({ ...prev, [tipoDocumentoId]: 25 }));
      
      // Convertir archivo a base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const base64Data = base64.split(',')[1]; // Remover el prefijo data:application/pdf;base64,
        
        // Simular progreso de procesamiento
        setUploadProgress(prev => ({ ...prev, [tipoDocumentoId]: 50 }));
        
        if (!candidato?.id) {
          toast.error("No se puede subir documentos sin un perfil válido");
          return;
        }

        console.log('💾 Guardando documento en base de datos...');
        
        // Simular progreso de guardado
        setUploadProgress(prev => ({ ...prev, [tipoDocumentoId]: 75 }));

        // Guardar documento en la base de datos con empresa_id
        const { data, error } = await supabase
          .from('candidatos_documentos')
          .upsert({
            candidato_id: candidato.id,
            tipo_documento_id: tipoDocumentoId,
            empresa_id: empresaId,
            nombre_archivo: file.name,
            url_archivo: base64Data,
            fecha_carga: new Date().toISOString()
          })
          .select();

        if (error) {
          console.error('❌ Error en base de datos:', error);
          throw error;
        }

        // Completar progreso
        setUploadProgress(prev => ({ ...prev, [tipoDocumentoId]: 100 }));
        
        console.log('✅ Documento guardado exitosamente:', data);
        toast.success(`${file.name} ha sido subido correctamente.`);

        // Actualizar la lista de documentos
        await loadDocumentosCandidato(candidato.id);
        
        // Limpiar progreso después de un momento
        setTimeout(() => {
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[tipoDocumentoId];
            return newProgress;
          });
        }, 1000);
      };
      
      reader.onerror = (error) => {
        console.error('❌ Error leyendo archivo:', error);
        toast.error("Error al procesar el archivo");
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[tipoDocumentoId];
          return newProgress;
        });
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('❌ Error subiendo archivo:', error);
      toast.error("Error al subir el archivo");
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[tipoDocumentoId];
        return newProgress;
      });
    } finally {
      setUploadingDocuments(prev => ({ ...prev, [tipoDocumentoId]: false }));
    }
  };

  // Función para eliminar documento
  const handleDeleteDocument = async (documentoId: number) => {
    try {
      const { error } = await supabase
        .from('candidatos_documentos')
        .delete()
        .eq('id', documentoId);

      if (error) throw error;

              toast.success("El documento ha sido eliminado correctamente.");

      // Recargar documentos
      if (candidato?.id) {
        await loadDocumentosCandidato(candidato.id);
      }
    } catch (error) {
      console.error('Error eliminando documento:', error);
              toast.error("Error al eliminar el documento");
    }
  };

  // Función para descargar documento
  const handleDownloadDocument = (documento: any) => {
    try {
      const base64 = `data:application/pdf;base64,${documento.url_archivo}`;
      const link = document.createElement('a');
      link.href = base64;
      link.download = documento.nombre_archivo;
      document.body.appendChild(link);
      link.click();
      
      // Verificar que el elemento existe antes de eliminarlo
      if (link.parentNode) {
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error descargando documento:', error);
      toast.error("Error al descargar el documento");
    }
  };

  // Función para visualizar documento (similar a empresa)
  const handleViewDocument = (documento: any) => {
    try {
      const base64 = `data:application/pdf;base64,${documento.url_archivo}`;
      
      // Crear una nueva ventana para visualizar el PDF
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${documento.nombre_archivo}</title>
              <style>
                body { margin: 0; padding: 0; }
                iframe { width: 100%; height: 100vh; border: none; }
              </style>
            </head>
            <body>
              <iframe src="${base64}" title="${documento.nombre_archivo}"></iframe>
            </body>
          </html>
        `);
        newWindow.document.close();
      } else {
        // Fallback: descargar el archivo
        handleDownloadDocument(documento);
      }
    } catch (error) {
      console.error('Error visualizando documento:', error);
      toast.error("Error al visualizar el documento");
    }
  };

  // Función para calcular el progreso del perfil
  const calcularProgresoPerfil = () => {
    if (!candidato) return 0;
    
    // Todos los campos del formulario con sus pesos
    const camposConPeso = [
      { campo: 'nombres', peso: 8, requerido: true },
      { campo: 'apellidos', peso: 8, requerido: true },
      { campo: 'fechaNacimiento', peso: 6, requerido: false },
      { campo: 'edad', peso: 4, requerido: false },
      { campo: 'sexo', peso: 4, requerido: false },
      { campo: 'estadoCivil', peso: 4, requerido: false },
      { campo: 'telefono', peso: 8, requerido: true },
      { campo: 'direccion', peso: 6, requerido: false },
      { campo: 'ciudad', peso: 6, requerido: false },
      { campo: 'cargoAspirado', peso: 8, requerido: false },
      { campo: 'eps', peso: 6, requerido: false },
      { campo: 'arl', peso: 6, requerido: false },
      { campo: 'grupoSanguineo', peso: 4, requerido: false },
      { campo: 'nivelEducativo', peso: 6, requerido: false },
      { campo: 'contactoEmergenciaNombre', peso: 4, requerido: false },
      { campo: 'contactoEmergenciaTelefono', peso: 4, requerido: false },
      { campo: 'contactoEmergenciaRelacion', peso: 4, requerido: false },
      { campo: 'hojaDeVida', peso: 8, requerido: false },
      { campo: 'fotografia', peso: 6, requerido: false }
    ];
    
    let puntajeTotal = 0;
    let puntajeCompletado = 0;
    
    // Calcular progreso de campos del formulario
    camposConPeso.forEach(({ campo, peso, requerido }) => {
      puntajeTotal += peso;
      const valor = candidato[campo as keyof Candidato];
      
      if (valor && valor.toString().trim() !== '') {
        puntajeCompletado += peso;
      } else if (requerido) {
        // Los campos requeridos vacíos no suman puntos
        puntajeTotal -= peso;
      }
    });
    
    // Calcular progreso de documentos requeridos
    if (documentosRequeridos.length > 0) {
      // Filtrar solo los documentos que son requeridos
      const documentosRequeridosFiltrados = documentosRequeridos.filter(doc => doc.requerido);
      
      if (documentosRequeridosFiltrados.length > 0) {
        // Distribuir 40% del progreso total entre los documentos requeridos
        const pesoPorDocumento = Math.floor(40 / documentosRequeridosFiltrados.length);
        
        // Contar solo los documentos que corresponden a los requeridos para este tipo de candidato
        const documentosCompletados = existingDocuments.filter(doc => 
          documentosRequeridosFiltrados.some(req => req.tipo_documento_id === doc.tipo_documento_id)
        ).length;
        
        puntajeTotal += documentosRequeridosFiltrados.length * pesoPorDocumento;
        puntajeCompletado += documentosCompletados * pesoPorDocumento;
        
        console.log('🔍 calcularProgresoPerfil - Peso por documento:', pesoPorDocumento);
        console.log('🔍 calcularProgresoPerfil - Documentos completados vs requeridos:', documentosCompletados, '/', documentosRequeridosFiltrados.length);
      }
    }
    
    console.log('🔍 calcularProgresoPerfil - Documentos requeridos:', documentosRequeridos.length);
    console.log('🔍 calcularProgresoPerfil - Documentos existentes totales:', existingDocuments.length);
    console.log('🔍 calcularProgresoPerfil - Documentos completados (filtrados):', existingDocuments.filter(doc => 
      documentosRequeridos.some(req => req.tipo_documento_id === doc.tipo_documento_id)
    ).length);
    console.log('🔍 calcularProgresoPerfil - Campos del formulario completados:', camposConPeso.filter(({ campo, requerido }) => {
      const valor = candidato[campo as keyof Candidato];
      return valor && valor.toString().trim() !== '';
    }).length, '/', camposConPeso.length);
    console.log('🔍 calcularProgresoPerfil - Puntaje total:', puntajeTotal);
    console.log('🔍 calcularProgresoPerfil - Puntaje completado:', puntajeCompletado);
    console.log('🔍 calcularProgresoPerfil - Progreso calculado:', puntajeTotal > 0 ? Math.round((puntajeCompletado / puntajeTotal) * 100) : 0);
    
    return puntajeTotal > 0 ? Math.round((puntajeCompletado / puntajeTotal) * 100) : 0;
  };

  // Función para obtener el color del progreso
  const getColorProgreso = (progreso: number) => {
    if (progreso < 30) return 'bg-red-500';
    if (progreso < 60) return 'bg-yellow-500';
    if (progreso < 90) return 'bg-cyan-500';
    return 'bg-brand-lime';
  };

  // Función para obtener el texto del progreso
  const getTextoProgreso = (progreso: number) => {
    if (progreso < 30) return 'Incompleto';
    if (progreso < 60) return 'En progreso';
    if (progreso < 90) return 'Casi completo';
    return 'Completo';
  };

  // Función para calcular la edad automáticamente
  const calcularEdad = (fechaNacimiento: string) => {
    if (!fechaNacimiento) {
      console.log('🔍 calcularEdad - No hay fecha de nacimiento');
      return undefined;
    }
    
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mesActual = hoy.getMonth();
    const diaActual = hoy.getDate();
    const mesNacimiento = nacimiento.getMonth();
    const diaNacimiento = nacimiento.getDate();
    
    if (mesActual < mesNacimiento || (mesActual === mesNacimiento && diaActual < diaNacimiento)) {
      edad--;
    }
    
    console.log('🔍 calcularEdad - Fecha:', fechaNacimiento, 'Edad calculada:', edad);
    return edad > 0 ? edad : undefined;
  };

  const loadProfile = async () => {
    try {
      if (!user) {
        toast.error('No hay usuario autenticado');
        navigate('/login');
        return;
      }

      // Verificar si el usuario es un candidato o un administrador
      console.log('Usuario autenticado:', user);

      // Buscar el candidato en la base de datos usando el email del usuario
      const { data: candidatoData, error } = await supabase
        .from('candidatos')
        .select('*')
        .eq('email', user.email)
        .single();

      if (error) {
        console.error('Error cargando perfil:', error);
        
        // Si no se encuentra el candidato, crear un perfil vacío para administradores
        if (error.code === 'PGRST116') {
          console.log('No se encontró candidato, creando perfil vacío para administrador');
          
          // Crear un perfil vacío para administradores
          const perfilVacio = {
            id: 0,
            email: user.email,
            nombres: user.primerNombre || '',
            apellidos: user.primerApellido || '',
            tipoDocumento: '',
            numeroDocumento: '',
            fechaNacimiento: '',
            edad: undefined,
            sexo: '',
            estadoCivil: '',
            telefono: '',
            direccion: '',
            ciudad: '',
            cargoAspirado: '',
            eps: '',
            arl: '',
            grupoSanguineo: '',
            nivelEducativo: '',
            contactoEmergenciaNombre: '',
            contactoEmergenciaTelefono: '',
            contactoEmergenciaRelacion: '',
            hojaDeVida: '',
            fotografia: '',
            completado: false,
            estado: 'activo',
            fechaRegistro: new Date().toISOString()
          };

          setCandidato(perfilVacio);
          form.reset(perfilVacio);
          return;
        }
        
        toast.error('Error al cargar el perfil');
        return;
      }

      if (candidatoData) {
        // Transformar los datos para que coincidan con la interfaz Candidato
        const candidatoTransformado = {
          id: candidatoData.id,
          email: candidatoData.email,
          nombres: candidatoData.primer_nombre,
          apellidos: candidatoData.primer_apellido,
          tipoDocumento: candidatoData.tipo_documento,
          numeroDocumento: candidatoData.numero_documento,
          fechaNacimiento: candidatoData.fecha_nacimiento,
          edad: candidatoData.edad || undefined,
          sexo: candidatoData.genero,
          estadoCivil: candidatoData.estado_civil,
          telefono: candidatoData.telefono || '',
          direccion: candidatoData.direccion || '',
          ciudad: candidatoData.ciudad_id ? 'Ciudad' : '', // Placeholder
          cargoAspirado: candidatoData.cargo_aspirado || '',
          eps: candidatoData.eps || '',
          arl: candidatoData.arl || '',
          grupoSanguineo: candidatoData.grupo_sanguineo || '',
          nivelEducativo: candidatoData.nivel_educativo || '',
          contactoEmergenciaNombre: candidatoData.contacto_emergencia_nombre || '',
          contactoEmergenciaTelefono: candidatoData.contacto_emergencia_telefono || '',
          contactoEmergenciaRelacion: candidatoData.contacto_emergencia_relacion || '',
          hojaDeVida: candidatoData.hoja_de_vida || '',
          fotografia: candidatoData.fotografia || '',
          completado: candidatoData.completado || false,
          estado: candidatoData.estado || 'activo',
          fechaRegistro: candidatoData.created_at
        };

        setCandidato(candidatoTransformado);
        form.reset(candidatoTransformado);
        
        // Cargar tipo de candidato y sus documentos requeridos
        if (candidatoData.tipo_candidato_id) {
          await loadTipoCandidato(candidatoData.tipo_candidato_id);
        }
        
        // Cargar documentos del candidato
        await loadDocumentosCandidato(candidatoData.id);
      } else {
        toast.error('No se encontró el perfil del candidato');
      }
    } catch (error) {
      console.error('Error cargando perfil:', error);
      toast.error('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: PerfilForm) => {
    setIsSaving(true);
    try {
      if (!user) {
        toast.error('No hay usuario autenticado');
        return;
      }

      // Actualizar el candidato en Supabase
      const { data: updatedCandidato, error } = await supabase
        .from('candidatos')
        .update({
          primer_nombre: data.nombres,
          primer_apellido: data.apellidos,
          fecha_nacimiento: data.fechaNacimiento,
          edad: data.edad,
          sexo: data.sexo,
          estado_civil: data.estadoCivil,
          telefono: data.telefono,
          direccion: data.direccion,
          ciudad: data.ciudad,
          cargo_aspirado: data.cargoAspirado,
          eps: data.eps,
          arl: data.arl,
          grupo_sanguineo: data.grupoSanguineo,
          nivel_educativo: data.nivelEducativo,
          contacto_emergencia_nombre: data.contactoEmergenciaNombre,
          contacto_emergencia_telefono: data.contactoEmergenciaTelefono,
          contacto_emergencia_relacion: data.contactoEmergenciaRelacion,
          completado: true,
          updated_at: new Date().toISOString()
        })
        .eq('email', user.email)
        .select()
        .single();

      if (error) {
        console.error('Error actualizando perfil:', error);
        toast.error('Error al actualizar el perfil');
        return;
      }

      if (updatedCandidato) {
        // Transformar los datos actualizados
        const candidatoTransformado = {
          id: updatedCandidato.id,
          email: updatedCandidato.email,
          nombres: updatedCandidato.primer_nombre,
          apellidos: updatedCandidato.primer_apellido,
          tipoDocumento: updatedCandidato.tipo_documento,
          numeroDocumento: updatedCandidato.numero_documento,
          fechaNacimiento: updatedCandidato.fecha_nacimiento,
          edad: updatedCandidato.edad,
          sexo: updatedCandidato.sexo,
          estadoCivil: updatedCandidato.estado_civil,
          telefono: updatedCandidato.telefono,
          direccion: updatedCandidato.direccion,
          ciudad: updatedCandidato.ciudad,
          cargoAspirado: updatedCandidato.cargo_aspirado,
          eps: updatedCandidato.eps,
          arl: updatedCandidato.arl,
          grupoSanguineo: updatedCandidato.grupo_sanguineo,
          nivelEducativo: updatedCandidato.nivel_educativo,
          contactoEmergenciaNombre: updatedCandidato.contacto_emergencia_nombre,
          contactoEmergenciaTelefono: updatedCandidato.contacto_emergencia_telefono,
          contactoEmergenciaRelacion: updatedCandidato.contacto_emergencia_relacion,
          hojaDeVida: updatedCandidato.hoja_de_vida,
          fotografia: updatedCandidato.fotografia,
          completado: updatedCandidato.completado || false,
          estado: updatedCandidato.estado || 'activo',
          fechaRegistro: updatedCandidato.created_at
        };

        setCandidato(candidatoTransformado);
        toast.success('Perfil actualizado exitosamente');
      }
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      toast.error('Error de conexión');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error en logout:', error);
      navigate('/login');
    }
  };

  const handleCambiarPassword = () => {
    navigate('/cambiar-password');
  };

  const handleFileUpload = async (file: File, type: 'hojaDeVida' | 'fotografia') => {
    // In a real app, you'd upload to cloud storage
    // For now, we'll just show a success message
    toast.success(`${type === 'hojaDeVida' ? 'Hoja de vida' : 'Fotografía'} cargada exitosamente`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto"></div>
          <p className="mt-4 text-brand-gray">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!candidato) {
    return null;
  }

  return (
    <div className="p-6 space-y-6">
      <ProgressStyles />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-4xl font-black text-cyan-800 flex items-center gap-3 mb-3 tracking-tight">
          <User className="w-10 h-10 text-brand-gray" />
          <span className="text-cyan-800">
            Información Personal
          </span>
        </h1>
      </div>

      {/* Contenedor unificado con header, progreso y formulario */}
      <div className="bg-white rounded-lg border shadow-lg">
        {/* Header unificado */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="-ml-6 pl-6">
            <div className="text-left">
              <span className="text-xl font-bold tracking-wide block" style={{ color: '#215761', textShadow: '0 2px 4px rgba(33, 87, 97, 0.15)', letterSpacing: '0.025em' }}>PERFIL PERSONAL</span>
              <p className="text-base font-medium mt-1" style={{ color: '#215761', textShadow: '0 1px 2px rgba(33, 87, 97, 0.1)', fontWeight: '600' }}>
                {candidato ? `${candidato.nombres} ${candidato.apellidos}` : 'Gestiona tu información personal y profesional'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {isAutoSaving && (
              <div className="flex items-center text-sm" style={{ color: '#215761', textShadow: '0 1px 2px rgba(33, 87, 97, 0.1)', fontWeight: '500' }}>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 mr-2" style={{ borderColor: '#215761' }}></div>
                Guardando cambios...
              </div>
            )}
            {candidato && (
              <Badge variant={candidato.completado ? "default" : "secondary"} className="flex items-center space-x-1">
                {candidato.completado ? (
                  <>
                    <CheckCircle className="w-3 h-3" />
                    <span>Completado</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3 h-3" />
                    <span>En Proceso</span>
                  </>
                )}
              </Badge>
            )}
            <Button
              onClick={handleCambiarPassword}
              className="login-button rounded-xl font-bold text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden"
            >
              {/* Efecto de brillo en hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              <div className="flex items-center justify-center relative z-10">
                <span>Cambiar Contraseña</span>
              </div>
            </Button>
          </div>
        </div>

        {/* Progress Bar integrado */}
        <div className="px-6 py-4 border-b bg-brand-gray/5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-cyan-100 rounded-full flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-cyan-600 rounded-full animate-pulse"></div>
              </div>
              <span className="text-sm font-medium" style={{ color: '#06b6d4', textShadow: '0 1px 2px rgba(6, 182, 212, 0.1)', fontWeight: '600' }}>Progreso del Perfil</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold" style={{ color: '#06b6d4', textShadow: '0 1px 2px rgba(6, 182, 212, 0.1)', fontWeight: '700' }}>
                {calcularProgresoPerfil()}%
              </span>
              <Badge variant="outline" className="text-xs px-2 py-0.5 border-cyan-200 text-cyan-700 bg-cyan-50">
                {getTextoProgreso(calcularProgresoPerfil())}
              </Badge>
            </div>
          </div>
          
          {/* Barra de progreso compacta */}
          <div className="relative">
            <div className="w-full h-2 bg-cyan-100 rounded-full overflow-hidden">
              {/* Progreso completado */}
              <div 
                className="h-full transition-all duration-1000 ease-out rounded-full relative progress-wave"
                style={{
                  width: `${calcularProgresoPerfil()}%`,
                  background: `linear-gradient(90deg, #06b6d4, #0891b2, #0e7490, #0891b2)`,
                  backgroundSize: '200% 100%',
                  boxShadow: '0 0 15px rgba(6, 182, 212, 0.4)',
                  animation: 'progressGlow 2s ease-in-out infinite alternate, progressWave 3s ease-in-out infinite'
                }}
              >
                {/* Efecto de brillo sutil */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-pulse"></div>
              </div>
              
              {/* Progreso restante con animación sutil */}
              {calcularProgresoPerfil() < 100 && (
                <div 
                  className="absolute top-0 h-full bg-gradient-to-r from-gray-300 to-gray-400 rounded-full overflow-hidden"
                  style={{ 
                    left: `${calcularProgresoPerfil()}%`,
                    width: `${100 - calcularProgresoPerfil()}%`
                  }}
                >
                  {/* Efecto shimmer más sutil */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-10 progress-shimmer"></div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Formulario con pestañas integradas */}
        <div className="px-6 pt-6 pb-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                {/* Header del formulario integrado */}
                <div className="mb-6 -ml-6 pl-6">
                  <div className="text-left">
                    <span className="text-lg font-bold tracking-tight block" style={{ color: '#215761', textShadow: '0 2px 4px rgba(33, 87, 97, 0.15)', letterSpacing: '0.025em' }}>INFORMACIÓN DEL CANDIDATO</span>
                    <p className="text-sm font-medium" style={{ color: '#215761', textShadow: '0 1px 2px rgba(33, 87, 97, 0.1)', fontWeight: '600' }}>Complete toda la información para mejorar sus oportunidades laborales</p>
                  </div>
                </div>

                {/* Pestañas integradas con estilo moderno */}
                <TabsList className="grid w-full grid-cols-5 mb-6 bg-gray-50/50 p-1 rounded-2xl border border-gray-200/50">
                  <TabsTrigger 
                    value="personal"
                    className={`relative rounded-xl font-semibold text-sm transition-all duration-300 ${
                      activeTab === 'personal' 
                        ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/25 border-0 transform scale-105' 
                        : 'hover:bg-white/80 hover:shadow-md text-gray-600 border-0 hover:scale-102'
                    }`}
                    style={activeTab !== 'personal' ? { 
                      color: '#6b7280 !important',
                      backgroundColor: 'transparent !important'
                    } : {}}
                  >
                    <span style={{ 
                      color: activeTab === 'personal' ? '#ffffff' : '#6b7280 !important',
                      fontWeight: '600 !important'
                    }}>Personal</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="contacto"
                    className={`relative rounded-xl font-semibold text-sm transition-all duration-300 ${
                      activeTab === 'contacto' 
                        ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/25 border-0 transform scale-105' 
                        : 'hover:bg-white/80 hover:shadow-md text-gray-600 border-0 hover:scale-102'
                    }`}
                    style={activeTab !== 'contacto' ? { 
                      color: '#6b7280 !important',
                      backgroundColor: 'transparent !important'
                    } : {}}
                  >
                    <span style={{ 
                      color: activeTab === 'contacto' ? '#ffffff' : '#6b7280 !important',
                      fontWeight: '600 !important'
                    }}>Contacto</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="profesional"
                    className={`relative rounded-xl font-semibold text-sm transition-all duration-300 ${
                      activeTab === 'profesional' 
                        ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/25 border-0 transform scale-105' 
                        : 'hover:bg-white/80 hover:shadow-md text-gray-600 border-0 hover:scale-102'
                    }`}
                    style={activeTab !== 'profesional' ? { 
                      color: '#6b7280 !important',
                      backgroundColor: 'transparent !important'
                    } : {}}
                  >
                    <span style={{ 
                      color: activeTab === 'profesional' ? '#ffffff' : '#6b7280 !important',
                      fontWeight: '600 !important'
                    }}>Experiencia Laboral</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="educacion"
                    className={`relative rounded-xl font-semibold text-sm transition-all duration-300 ${
                      activeTab === 'educacion' 
                        ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/25 border-0 transform scale-105' 
                        : 'hover:bg-white/80 hover:shadow-md text-gray-600 border-0 hover:scale-102'
                    }`}
                    style={activeTab !== 'educacion' ? { 
                      color: '#6b7280 !important',
                      backgroundColor: 'transparent !important'
                    } : {}}
                  >
                    <span style={{ 
                      color: activeTab === 'educacion' ? '#ffffff' : '#6b7280 !important',
                      fontWeight: '600 !important'
                    }}>Educación</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="archivos"
                    className={`relative rounded-xl font-semibold text-sm transition-all duration-300 ${
                      activeTab === 'archivos' 
                        ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/25 border-0 transform scale-105' 
                        : 'hover:bg-white/80 hover:shadow-md text-gray-600 border-0 hover:scale-102'
                    }`}
                    style={activeTab !== 'archivos' ? { 
                      color: '#6b7280 !important',
                      backgroundColor: 'transparent !important'
                    } : {}}
                  >
                    <span style={{ 
                      color: activeTab === 'archivos' ? '#ffffff' : '#6b7280 !important',
                      fontWeight: '600 !important'
                    }}>Archivos</span>
                  </TabsTrigger>
                </TabsList>

                  <TabsContent value="personal" className="space-y-6">
                    <div className="form-field-group">
                      <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="nombres"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="form-label form-label-required">Nombres</FormLabel>
                            <FormControl>
                              <Input {...field} className="form-input" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="apellidos"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="form-label form-label-required">Apellidos</FormLabel>
                            <FormControl>
                              <Input {...field} className="form-input" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="fechaNacimiento"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="form-label form-label-required">Fecha de Nacimiento</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="date" 
                                value={field.value || ''}
                                onChange={(e) => {
                                  console.log('🔍 Campo fechaNacimiento - Nuevo valor:', e.target.value);
                                  field.onChange(e);
                                  const edad = calcularEdad(e.target.value);
                                  console.log('🔍 Campo fechaNacimiento - Edad calculada para el formulario:', edad);
                                  form.setValue('edad', edad);
                                }}
                                className="form-input"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="edad"
                        render={({ field }) => {
                          console.log('🔍 Campo edad - Valor actual:', field.value, 'Tipo:', typeof field.value);
                          return (
                            <FormItem>
                              <FormLabel className="form-label">Edad</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="number" 
                                  min="18" 
                                  max="100" 
                                  value={field.value || ''}
                                  onChange={(e) => {
                                    const value = e.target.value === '' ? undefined : parseInt(e.target.value);
                                    console.log('🔍 Campo edad - Nuevo valor:', value, 'Tipo:', typeof value);
                                    field.onChange(value);
                                  }}
                                  className="form-input"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />

                      <FormField
                        control={form.control}
                        name="sexo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="form-label">Sexo</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="form-select">
                                  <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Masculino">Masculino</SelectItem>
                                <SelectItem value="Femenino">Femenino</SelectItem>
                                <SelectItem value="Otro">Otro</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="estadoCivil"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="form-label">Estado Civil</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="form-select">
                                  <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Soltero">Soltero</SelectItem>
                                <SelectItem value="Casado">Casado</SelectItem>
                                <SelectItem value="Divorciado">Divorciado</SelectItem>
                                <SelectItem value="Viudo">Viudo</SelectItem>
                                <SelectItem value="Unión Libre">Unión Libre</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="grupoSanguineo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="form-label">Grupo Sanguíneo</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="form-select">
                                  <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="O+">O+</SelectItem>
                                <SelectItem value="O-">O-</SelectItem>
                                <SelectItem value="A+">A+</SelectItem>
                                <SelectItem value="A-">A-</SelectItem>
                                <SelectItem value="B+">B+</SelectItem>
                                <SelectItem value="B-">B-</SelectItem>
                                <SelectItem value="AB+">AB+</SelectItem>
                                <SelectItem value="AB-">AB-</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="contacto" className="space-y-6">
                    <div className="form-field-group">
                      <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="telefono"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="form-label form-label-required">Teléfono</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Phone className="absolute left-3 top-3 h-4 w-4 text-brand-gray" />
                                <Input {...field} className="pl-10 form-input" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="ciudad"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="form-label">Ciudad</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <MapPin className="absolute left-3 top-3 h-4 w-4 text-brand-gray" />
                                <Input {...field} className="pl-10 form-input" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="md:col-span-2">
                        <FormField
                          control={form.control}
                          name="direccion"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="form-label">Dirección</FormLabel>
                              <FormControl>
                                <Textarea {...field} placeholder="Dirección completa" className="form-textarea" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="contactoEmergenciaNombre"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="form-label">Contacto de Emergencia - Nombre</FormLabel>
                            <FormControl>
                              <Input {...field} className="form-input" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="contactoEmergenciaTelefono"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="form-label">Contacto de Emergencia - Teléfono</FormLabel>
                            <FormControl>
                              <Input {...field} className="form-input" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="contactoEmergenciaRelacion"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="form-label">Relación con Contacto de Emergencia</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Ej: Madre, Padre, Hermano" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="profesional" className="space-y-4">
                    <ExperienciaLaboralTab 
                      experienciaLaboral={experienciaLaboral}
                      onChange={setExperienciaLaboral}
                    />
                  </TabsContent>

                  <TabsContent value="educacion" className="space-y-2">
                    {/* Header de Educación */}
                    <div className="flex items-center space-x-3 mb-3">
                      <GraduationCap className="w-6 h-6 text-brand-gray" />
                      <span className="text-lg font-bold text-brand-gray">Educación</span>
                    </div>
                    <EducacionTab 
                      educacion={educacion}
                      onChange={setEducacion}
                    />
                  </TabsContent>

                  <TabsContent value="archivos" className="space-y-4">
                    <div className="space-y-6">
                      {/* Header con icono */}
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="p-2 bg-brand-gray/10 rounded-lg">
                          <FileUp className="w-6 h-6 text-brand-gray" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-brand-gray">Documentos</h3>
                          <p className="text-sm text-brand-gray">
                            {tipoCandidato ? `Documentos asociados para: ${tipoCandidato.nombre}` : 'Cargando tipo de candidato...'}
                          </p>
                        </div>
                      </div>
                      
                      {isLoadingTipoCandidato || isLoadingDocuments ? (
                        <div className="flex justify-center py-12">
                          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                        </div>
                      ) : !tipoCandidato ? (
                        <div className="text-center py-12">
                          <AlertCircle className="w-16 h-16 text-brand-gray mx-auto mb-4" />
                          <p className="text-brand-gray text-lg">No se ha configurado un tipo de candidato para este perfil.</p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {/* Documentos requeridos con nueva interfaz */}
                          {documentosRequeridos.length > 0 && (
                            <div className="space-y-4">
                              <h4 className="text-lg font-semibold text-brand-gray flex items-center">
                                <Clock className="w-5 h-5 text-brand-gray mr-2" />
                                Documentos del tipo de candidato ({documentosRequeridos.length})
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {documentosRequeridos.map((documentoRequerido) => {
                                  const isUploaded = existingDocuments.some(
                                    (doc) => doc.tipo_documento_id === documentoRequerido.tipo_documento_id
                                  );
                                  
                                  const getDocumentIcon = (nombre: string) => {
                                    if (nombre.toLowerCase().includes('cedula')) return '🆔';
                                    if (nombre.toLowerCase().includes('diploma')) return '🎓';
                                    if (nombre.toLowerCase().includes('certificado')) return '📜';
                                    if (nombre.toLowerCase().includes('hoja')) return '📄';
                                    if (nombre.toLowerCase().includes('foto')) return '📷';
                                    if (nombre.toLowerCase().includes('eps')) return '🏥';
                                    if (nombre.toLowerCase().includes('arl')) return '🛡️';
                                    return '📋';
                                  };
                                  
                                  return (
                                    <Card key={documentoRequerido.id} className={`border-2 transition-all duration-200 hover:shadow-md ${
                                      isUploaded 
                                        ? 'border-brand-lime/20 bg-brand-lime/10' 
                                        : 'border-brand-gray/30 bg-white hover:border-blue-300'
                                    }`}>
                                      <CardHeader className="pb-3 pt-4">
                                        <CardTitle className="flex items-center justify-between text-sm">
                                          <div className="flex items-center">
                                            <div className={`p-2 rounded-lg mr-3 ${
                                              isUploaded ? 'bg-brand-lime/10' : 'bg-blue-100'
                                            }`}>
                                              <span className="text-lg">{getDocumentIcon(documentoRequerido.tipos_documentos.nombre)}</span>
                                            </div>
                                            <div>
                                              <div className="flex items-center gap-2">
                                                <span className="font-semibold text-brand-gray">
                                                  {documentoRequerido.tipos_documentos.nombre}
                                                </span>
                                                {documentoRequerido.requerido && (
                                                  <Badge variant="destructive" className="text-xs px-2 py-0.5">
                                                    Requerido
                                                  </Badge>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                                                                     {isUploaded && (
                                             <div className="flex items-center gap-1 text-brand-lime">
                                               <CheckCircle2 className="h-3 w-3" />
                                               <span className="text-xs font-medium">Subido</span>
                                             </div>
                                           )}
                                        </CardTitle>
                                        <CardDescription className="text-xs text-brand-gray mt-2">
                                          Formato PDF
                                        </CardDescription>
                                      </CardHeader>
                                                                             <CardContent className="pt-0 pb-4">
                                         <div className="space-y-3">
                                           {/* Progress Bar for Upload */}
                                           {uploadProgress[documentoRequerido.tipo_documento_id] !== undefined && (
                                             <div className="space-y-2">
                                               <div className="flex items-center justify-between text-xs text-brand-gray">
                                                 <span>Subiendo documento...</span>
                                                 <span>{uploadProgress[documentoRequerido.tipo_documento_id]}%</span>
                                               </div>
                                               <Progress 
                                                 value={uploadProgress[documentoRequerido.tipo_documento_id]} 
                                                 className="h-2 bg-brand-gray/20"
                                               />
                                             </div>
                                           )}
                                           
                                           <div className="flex items-center gap-3">
                                             {isUploaded ? (
                                               <div className="flex items-center gap-3">
                                                 <div className="flex items-center gap-1">
                                                   <Button
                                                     type="button"
                                                     variant="ghost"
                                                     size="sm"
                                                     onClick={() => handleViewDocument(existingDocuments.find(doc => doc.tipo_documento_id === documentoRequerido.tipo_documento_id))}
                                                     className="h-7 w-7 p-0 hover:bg-blue-50 rounded-full"
                                                     title="Visualizar documento"
                                                   >
                                                     <Eye className="h-4 w-4 text-brand-gray" />
                                                   </Button>
                                                   <Button
                                                     type="button"
                                                     variant="ghost"
                                                     size="sm"
                                                     onClick={() => document.getElementById(`file-${documentoRequerido.tipo_documento_id}`)?.click()}
                                                     className="h-7 w-7 p-0 hover:bg-gray-50 rounded-full"
                                                     title="Cambiar documento"
                                                   >
                                                     <Upload className="h-4 w-4 text-brand-gray" />
                                                   </Button>
                                                   <Button
                                                     type="button"
                                                     variant="ghost"
                                                     size="sm"
                                                     onClick={() => {
                                                       const existingDoc = existingDocuments.find(doc => doc.tipo_documento_id === documentoRequerido.tipo_documento_id);
                                                       if (existingDoc) {
                                                         handleDeleteDocument(existingDoc.id);
                                                       }
                                                     }}
                                                     className="h-7 w-7 p-0 hover:bg-red-50 rounded-full"
                                                     title="Eliminar documento"
                                                   >
                                                     <Trash2 className="h-4 w-4 text-red-600" />
                                                   </Button>
                                                 </div>
                                               </div>
                                             ) : (
                                               <Button
                                                 type="button"
                                                 variant="outline"
                                                 size="sm"
                                                 onClick={() => document.getElementById(`file-${documentoRequerido.tipo_documento_id}`)?.click()}
                                                 className="h-7 px-3 text-xs font-medium"
                                                 disabled={uploadingDocuments[documentoRequerido.tipo_documento_id]}
                                               >
                                                 {uploadingDocuments[documentoRequerido.tipo_documento_id] ? (
                                                   <>
                                                     <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1"></div>
                                                     Subiendo...
                                                   </>
                                                 ) : (
                                                   <>
                                                     <Upload className="h-3 w-3 mr-1" />
                                                     Subir
                                                   </>
                                                 )}
                                               </Button>
                                             )}
                                           </div>
                                         </div>
                                         <input
                                           type="file"
                                           accept=".pdf"
                                           className="hidden"
                                           id={`file-${documentoRequerido.tipo_documento_id}`}
                                           onChange={(e) => {
                                             console.log('📁 Input file cambiado:', e.target.files);
                                             handleFileChange(e, documentoRequerido.tipo_documento_id, documentoRequerido.tipos_documentos.nombre);
                                           }}
                                           onClick={(e) => (e.target as HTMLInputElement).value = ''}
                                                                                  />
                                         {isUploaded && (
                                           <div className="text-xs mt-2 p-2 bg-brand-gray/5 rounded">
                                             <div className="text-brand-gray mb-1">
                                               <span className="font-medium">Archivo:</span> {existingDocuments.find(doc => doc.tipo_documento_id === documentoRequerido.tipo_documento_id)?.nombre_archivo}
                                             </div>
                                             <div className="text-brand-lime">
                                               <span className="font-medium">Estado:</span> Documento subido
                                             </div>
                                           </div>
                                         )}
                                       </CardContent>
                                     </Card>
                                   );
                                 })}
                              </div>
                            </div>
                          )}

                          {documentosRequeridos.length === 0 && (
                            <div className="text-center py-12">
                              <CheckCircle className="w-16 h-16 text-brand-lime mx-auto mb-4" />
                              <p className="text-brand-gray text-lg">No hay documentos asociados para este tipo de candidato.</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end pt-6 border-t">
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="px-8 login-button rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden"
                  >
                    {/* Efecto de brillo en hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    <div className="flex items-center justify-center relative z-10">
                      {isSaving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Guardar Perfil
                        </>
                      )}
                    </div>
                  </Button>
                </div>
              </form>
            </Form>
        </div>
      </div>
    </div>
  );
}
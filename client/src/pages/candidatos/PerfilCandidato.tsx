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
  Clock
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
  const [tipoCandidato, setTipoCandidato] = useState<any>(null);
  const [documentosRequeridos, setDocumentosRequeridos] = useState<any[]>([]);
  const [isLoadingTipoCandidato, setIsLoadingTipoCandidato] = useState(false);
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

      // Cargar documentos requeridos para este tipo de candidato
      const { data: documentosData, error: documentosError } = await supabase
        .from('tipos_candidatos_documentos')
        .select(`
          *,
          tipos_documentos (
            id,
            nombre,
            descripcion,
            requerido,
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
            descripcion,
            requerido
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
      console.log('⏳ Iniciando subida de archivo...');
      
      // Obtener empresa válida
      const empresaId = await getValidEmpresaId();
      console.log('🏢 Empresa ID obtenida:', empresaId);
      
      // Convertir archivo a base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const base64Data = base64.split(',')[1]; // Remover el prefijo data:application/pdf;base64,
        
        if (!candidato?.id) {
          toast.error("No se puede subir documentos sin un perfil válido");
          return;
        }

        console.log('💾 Guardando documento en base de datos...');

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

        console.log('✅ Documento guardado exitosamente:', data);
        toast.success(`${file.name} ha sido subido correctamente.`);

        // Actualizar la lista de documentos
        await loadDocumentosCandidato(candidato.id);
      };
      
      reader.onerror = (error) => {
        console.error('❌ Error leyendo archivo:', error);
        toast.error("Error al procesar el archivo");
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('❌ Error subiendo archivo:', error);
      toast.error("Error al subir el archivo");
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
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error descargando documento:', error);
              toast.error("Error al descargar el documento");
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
    
    return puntajeTotal > 0 ? Math.round((puntajeCompletado / puntajeTotal) * 100) : 0;
  };

  // Función para obtener el color del progreso
  const getColorProgreso = (progreso: number) => {
    if (progreso < 30) return 'bg-red-500';
    if (progreso < 60) return 'bg-yellow-500';
    if (progreso < 90) return 'bg-blue-500';
    return 'bg-green-500';
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!candidato) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
            <p className="text-gray-600">Administra tu información personal y profesional</p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Indicador de progreso mejorado */}
            <div className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg">
              <div className="flex flex-col items-center">
                <span className="text-xs font-medium text-gray-600">Progreso del Perfil</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20">
                    <Progress 
                      value={calcularProgresoPerfil()} 
                      className={`h-2 ${getColorProgreso(calcularProgresoPerfil())}`} 
                    />
                  </div>
                  <span className={`text-sm font-bold ${getColorProgreso(calcularProgresoPerfil()).replace('bg-', 'text-')}`}>
                    {calcularProgresoPerfil()}%
                  </span>
                </div>
                <span className="text-xs text-gray-500 mt-1">
                  {getTextoProgreso(calcularProgresoPerfil())}
                </span>
              </div>
            </div>
            
            {/* Menú de usuario */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Mi Cuenta</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleCambiarPassword}>
                  <Key className="w-4 h-4 mr-2" />
                  Cambiar Contraseña
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Profile Info Card */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{candidato.nombres} {candidato.apellidos}</h2>
                <p className="text-gray-600">{candidato.email}</p>
                <p className="text-sm text-gray-500">
                  {candidato.tipoDocumento}: {candidato.numeroDocumento}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Form */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Candidato</CardTitle>
            <CardDescription>
              Complete toda la información para mejorar sus oportunidades laborales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="personal">Personal</TabsTrigger>
                    <TabsTrigger value="contacto">Contacto</TabsTrigger>
                    <TabsTrigger value="profesional">Experiencia Laboral</TabsTrigger>
                    <TabsTrigger value="educacion">Educacion</TabsTrigger>
                    <TabsTrigger value="archivos">Archivos</TabsTrigger>
                  </TabsList>

                  <TabsContent value="personal" className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="nombres"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombres *</FormLabel>
                            <FormControl>
                              <Input {...field} />
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
                            <FormLabel>Apellidos *</FormLabel>
                            <FormControl>
                              <Input {...field} />
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
                            <FormLabel>Fecha de Nacimiento *</FormLabel>
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
                              <FormLabel>Edad</FormLabel>
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
                            <FormLabel>Sexo</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
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
                            <FormLabel>Estado Civil</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
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
                            <FormLabel>Grupo Sanguíneo</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
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
                  </TabsContent>

                  <TabsContent value="contacto" className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="telefono"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Teléfono *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input {...field} className="pl-10" />
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
                            <FormLabel>Ciudad</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input {...field} className="pl-10" />
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
                              <FormLabel>Dirección</FormLabel>
                              <FormControl>
                                <Textarea {...field} placeholder="Dirección completa" />
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
                            <FormLabel>Contacto de Emergencia - Nombre</FormLabel>
                            <FormControl>
                              <Input {...field} />
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
                            <FormLabel>Contacto de Emergencia - Teléfono</FormLabel>
                            <FormControl>
                              <Input {...field} />
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
                            <FormLabel>Relación con Contacto de Emergencia</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Ej: Madre, Padre, Hermano" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="profesional" className="space-y-4">
                    <ExperienciaLaboralTab 
                      experienciaLaboral={experienciaLaboral}
                      onChange={setExperienciaLaboral}
                    />
                  </TabsContent>

                  <TabsContent value="educacion" className="space-y-4">
                    <EducacionTab 
                      educacion={educacion}
                      onChange={setEducacion}
                    />
                  </TabsContent>

                  <TabsContent value="archivos" className="space-y-4">
                    <div className="space-y-6">
                      {/* Header con icono */}
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <FileUp className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">Documentos</h3>
                          <p className="text-sm text-gray-600">
                            {tipoCandidato ? `Documentos requeridos para: ${tipoCandidato.nombre}` : 'Cargando tipo de candidato...'}
                          </p>
                        </div>
                      </div>
                      
                      {isLoadingTipoCandidato || isLoadingDocuments ? (
                        <div className="flex justify-center py-12">
                          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                        </div>
                      ) : !tipoCandidato ? (
                        <div className="text-center py-12">
                          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600 text-lg">No se ha configurado un tipo de candidato para este perfil.</p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {/* Documentos existentes */}
                          {existingDocuments.length > 0 && (
                            <div className="space-y-4">
                              <h4 className="text-lg font-semibold text-gray-800 flex items-center">
                                <CheckCircle2 className="w-5 h-5 text-green-600 mr-2" />
                                Documentos subidos ({existingDocuments.length})
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {existingDocuments.map((documento) => (
                                  <Card key={documento.id} className="border-2 border-green-200 bg-green-50 hover:border-green-300 transition-all duration-200">
                                    <CardHeader className="pb-3 pt-4">
                                      <CardTitle className="flex items-center justify-between text-sm">
                                        <div className="flex items-center">
                                          <div className="p-2 bg-green-100 rounded-lg mr-3">
                                            <FileText className="w-4 h-4 text-green-600" />
                                          </div>
                                          <span className="font-semibold text-gray-800">{documento.tipos_documentos.nombre}</span>
                                        </div>
                                        <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                                          <CheckCircle2 className="w-3 h-3 mr-1" />
                                          Subido
                                        </Badge>
                                      </CardTitle>
                                      <CardDescription className="text-xs text-gray-600 mt-2">
                                        {documento.nombre_archivo}
                                      </CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-0 pb-4">
                                      <div className="flex space-x-2">
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          className="text-xs h-8 flex-1 border-green-300 text-green-700 hover:bg-green-100"
                                          onClick={() => handleDownloadDocument(documento)}
                                        >
                                          <Download className="w-3 h-3 mr-1" />
                                          Descargar
                                        </Button>
                                        <Button 
                                          variant="destructive" 
                                          size="sm"
                                          className="text-xs h-8 flex-1"
                                          onClick={() => handleDeleteDocument(documento.id)}
                                        >
                                          <Trash2 className="w-3 h-3 mr-1" />
                                          Eliminar
                                        </Button>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Documentos requeridos con nueva interfaz */}
                          {documentosRequeridos.length > 0 && (
                            <div className="space-y-4">
                              <h4 className="text-lg font-semibold text-gray-800 flex items-center">
                                <Clock className="w-5 h-5 text-blue-600 mr-2" />
                                Documentos requeridos ({documentosRequeridos.length})
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
                                        ? 'border-green-200 bg-green-50' 
                                        : 'border-gray-200 bg-white hover:border-blue-300'
                                    }`}>
                                      <CardHeader className="pb-3 pt-4">
                                        <CardTitle className="flex items-center justify-between text-sm">
                                          <div className="flex items-center">
                                            <div className={`p-2 rounded-lg mr-3 ${
                                              isUploaded ? 'bg-green-100' : 'bg-blue-100'
                                            }`}>
                                              <span className="text-lg">{getDocumentIcon(documentoRequerido.tipos_documentos.nombre)}</span>
                                            </div>
                                            <div>
                                              <span className="font-semibold text-gray-800">
                                                {documentoRequerido.tipos_documentos.nombre}
                                              </span>
                                              {documentoRequerido.obligatorio && (
                                                <span className="text-red-500 ml-1">*</span>
                                              )}
                                            </div>
                                          </div>
                                          {isUploaded && (
                                            <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                                              <CheckCircle2 className="w-3 h-3 mr-1" />
                                              Subido
                                            </Badge>
                                          )}
                                        </CardTitle>
                                        <CardDescription className="text-xs text-gray-600 mt-2">
                                          Formato PDF
                                        </CardDescription>
                                      </CardHeader>
                                      <CardContent className="pt-0 pb-4">
                                        <input
                                          type="file"
                                          accept=".pdf"
                                          className="hidden"
                                          id={`file-${documentoRequerido.tipo_documento_id}`}
                                          onChange={(e) => {
                                            console.log('📁 Input file cambiado:', e.target.files);
                                            handleFileChange(e, documentoRequerido.tipo_documento_id, documentoRequerido.tipos_documentos.nombre);
                                          }}
                                          disabled={isUploaded}
                                        />
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          className={`text-xs h-8 w-full cursor-pointer transition-all duration-200 ${
                                            isUploaded 
                                              ? 'border-green-300 text-green-700 bg-green-100' 
                                              : uploadingDocuments[documentoRequerido.tipo_documento_id]
                                              ? 'border-blue-300 text-blue-700 bg-blue-100'
                                              : 'border-gray-300 text-gray-700 hover:border-blue-400 hover:bg-blue-50'
                                          }`}
                                          disabled={isUploaded || uploadingDocuments[documentoRequerido.tipo_documento_id]}
                                          onClick={() => {
                                            if (!isUploaded && !uploadingDocuments[documentoRequerido.tipo_documento_id]) {
                                              document.getElementById(`file-${documentoRequerido.tipo_documento_id}`)?.click();
                                            }
                                          }}
                                        >
                                          {uploadingDocuments[documentoRequerido.tipo_documento_id] ? (
                                            <>
                                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1"></div>
                                              Subiendo...
                                            </>
                                          ) : (
                                            <>
                                              <Upload className="w-3 h-3 mr-1" />
                                              {isUploaded ? 'Ya subido' : 'Subir'}
                                            </>
                                          )}
                                        </Button>
                                      </CardContent>
                                    </Card>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {documentosRequeridos.length === 0 && (
                            <div className="text-center py-12">
                              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                              <p className="text-gray-600 text-lg">No hay documentos requeridos para este tipo de candidato.</p>
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
                    className="px-8"
                  >
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
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
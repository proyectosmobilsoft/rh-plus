import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';
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
  Eye,
  Home,
  Users,
  UserCheck,
  Folder,
  X
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
import { CustomDatePicker } from '@/components/ui/date-picker';
import { ExperienciaLaboralTab } from '@/components/candidatos/ExperienciaLaboralTab';
import { EducacionTab } from '@/components/candidatos/EducacionTab';
import { useCityData } from '@/hooks/useCityData';

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
    
    .progress-shimmer {
      animation: shimmer 3s ease-in-out infinite;
      width: 30%;
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
  departamento: z.string().optional(),
  ciudad: z.string().optional(),
  ciudad_id: z.number().optional(),
  cargoAspirado: z.string().optional(),
  eps: z.string().optional(),
  arl: z.string().optional(),
  grupoSanguineo: z.string().optional(),
  nivelEducativo: z.string().optional(),
  contactoEmergenciaNombre: z.string().optional(),
  contactoEmergenciaTelefono: z.string().optional(),
  contactoEmergenciaRelacion: z.string().optional(),
  tallaCamisa: z.string().optional(),
  tallaPantalon: z.string().optional(),
  tallaZapato: z.string().optional(),
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
  departamento?: string;
  ciudad?: string;
  ciudad_id?: number;
  cargoAspirado?: string;
  eps?: string;
  arl?: string;
  grupoSanguineo?: string;
  nivelEducativo?: string;
  contactoEmergenciaNombre?: string;
  contactoEmergenciaTelefono?: string;
  contactoEmergenciaRelacion?: string;
  tallaCamisa?: string;
  tallaPantalon?: string;
  tallaZapato?: string;
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
  const [uploadingDocuments, setUploadingDocuments] = useState<{[key: string]: boolean}>({});
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  // Eliminado: tipoCandidato y documentosRequeridos ligados al candidato.
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [progresoRefreshKey, setProgresoRefreshKey] = useState(0);
  const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState<number | null>(null);
  const [modalDocumento, setModalDocumento] = useState<{isOpen: boolean, documento: any}>({isOpen: false, documento: null});
  const [documentoACambiar, setDocumentoACambiar] = useState<{id: number, progressKey: string} | null>(null);
  const [ciudadesDisponibles, setCiudadesDisponibles] = useState<any[]>([]);
  const [solicitudesCandidato, setSolicitudesCandidato] = useState<any[]>([]);
  const [isLoadingSolicitudes, setIsLoadingSolicitudes] = useState(false);
  const [cargosMeta, setCargosMeta] = useState<Record<number, { nombre: string; documentos: any[] }>>({});
  const [documentosPorSolicitud, setDocumentosPorSolicitud] = useState<Record<string, any[]>>({});
  const navigate = useNavigate();

  // Hook para obtener datos de departamentos y ciudades
  const { data: cityData, isLoading: isLoadingCityData } = useCityData();

  // Función para manejar la selección de departamento
  const handleDepartamentoChange = (departamentoId: number) => {
    setDepartamentoSeleccionado(departamentoId);
    form.setValue('departamento', cityData?.[departamentoId]?.nombre || '', { shouldDirty: true, shouldTouch: true });
    form.setValue('ciudad', '', { shouldDirty: true, shouldTouch: true });
    form.setValue('ciudad_id', undefined, { shouldDirty: true, shouldTouch: true });
    
    // Filtrar ciudades del departamento seleccionado
    if (cityData?.[departamentoId]) {
      setCiudadesDisponibles(cityData[departamentoId].ciudades);
    } else {
      setCiudadesDisponibles([]);
    }
    
    // Disparar auto-guardado
    triggerAutoSave();
  };

  // Función para manejar la selección de ciudad
  const handleCiudadChange = (ciudadId: number) => {
    const ciudadSeleccionada = ciudadesDisponibles.find(ciudad => ciudad.id === ciudadId);
    if (ciudadSeleccionada) {
      form.setValue('ciudad', ciudadSeleccionada.nombre, { shouldDirty: true, shouldTouch: true });
      form.setValue('ciudad_id', ciudadId, { shouldDirty: true, shouldTouch: true });
      // Disparar auto-guardado
      triggerAutoSave();
    }
  };

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
      departamento: '',
      ciudad: '',
      ciudad_id: undefined,
      cargoAspirado: '',
      eps: '',
      arl: '',
      grupoSanguineo: '',
      nivelEducativo: '',
      contactoEmergenciaNombre: '',
      contactoEmergenciaTelefono: '',
      contactoEmergenciaRelacion: '',
      tallaCamisa: '',
      tallaPantalon: '',
      tallaZapato: '',
    },
  });

  useEffect(() => {
    loadProfile();
    loadTiposDocumentos();
  }, []);

  // Efecto para inicializar estados de departamento y ciudad cuando cityData esté disponible
  useEffect(() => {
    if (candidato && candidato.ciudad_id && candidato.departamento && cityData && !isLoadingCityData) {
      // Buscar el departamento por nombre en los datos cargados
      const departamentos = Object.entries(cityData);
      const departamentoEncontrado = departamentos.find(([id, dept]) => 
        dept.nombre.toLowerCase() === (candidato.departamento || '').toLowerCase()
      );
      
      if (departamentoEncontrado) {
        const [departamentoId, departamentoData] = departamentoEncontrado;
        console.log('🔄 Reinicializando estados con cityData:', {
          departamentoId: parseInt(departamentoId),
          departamentoNombre: departamentoData.nombre,
          ciudadesDisponibles: departamentoData.ciudades.length
        });
        
        setDepartamentoSeleccionado(parseInt(departamentoId));
        setCiudadesDisponibles(departamentoData.ciudades);
      }
    }
  }, [candidato, cityData, isLoadingCityData]);

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
    if (candidato && existingDocuments.length > 0) {
      console.log('🔄 Documentos actualizados - Forzando recálculo del progreso');
      setCandidato(prev => prev ? { ...prev } : prev);
    }
  }, [existingDocuments, candidato]);

  // Efecto para activar el input de cambio de documento
  useEffect(() => {
    if (documentoACambiar) {
      const input = document.getElementById(`change-file-${documentoACambiar.progressKey}`);
      if (input) {
        input.click();
      }
    }
  }, [documentoACambiar]);

  // Función para cargar registros actuales de la base de datos
  const loadCurrentRecordsFromDB = useCallback(async () => {
    if (!candidato) return { experiencia: [], educacion: [] };

    try {
      // Cargar experiencia laboral actual
      const { data: expData, error: expError } = await supabase
        .from('experiencia_laboral')
        .select('*')
        .eq('candidato_id', candidato.id)
        .order('fecha_inicio', { ascending: false });

      if (expError) {
        console.error('Error cargando experiencia de BD:', expError);
      }

      // Cargar educación actual
      const { data: eduData, error: eduError } = await supabase
        .from('educacion_candidato')
        .select('*')
        .eq('candidato_id', candidato.id)
        .order('fecha_inicio', { ascending: false });

      if (eduError) {
        console.error('Error cargando educación de BD:', eduError);
      }

      return {
        experiencia: expData || [],
        educacion: eduData || []
      };
    } catch (error) {
      console.error('Error cargando registros de BD:', error);
      return { experiencia: [], educacion: [] };
    }
  }, [candidato, supabase]);

  // Función de auto-guardado con debounce
  const autoSave = useCallback(async (data: any) => {
    if (!user || !candidato) return;
    
    try {
      setIsAutoSaving(true);
      console.log('💾 Auto-guardando cambios...');
      console.log('📊 Datos del formulario:', data);
      console.log('💼 Experiencia laboral actual:', experienciaLaboral);
      console.log('🎓 Educación actual:', educacion);
      console.log('🆔 Candidato ID:', candidato.id);

      // Cargar registros actuales de la base de datos para validación
      console.log('🔍 Cargando registros actuales de la base de datos...');
      const currentDBRecords = await loadCurrentRecordsFromDB();
      console.log('📊 Registros actuales en BD - Experiencia:', currentDBRecords.experiencia);
      console.log('📊 Registros actuales en BD - Educación:', currentDBRecords.educacion);

      // Validar que los registros mostrados coincidan con los de la BD
      console.log('✅ Validando sincronización entre UI y BD...');
      
      // Comparar cantidad de registros de experiencia
      const expCountMatch = experienciaLaboral.length === currentDBRecords.experiencia.length;
      console.log(`📊 Experiencia - UI: ${experienciaLaboral.length}, BD: ${currentDBRecords.experiencia.length}, Coinciden: ${expCountMatch}`);
      
      // Comparar cantidad de registros de educación
      const eduCountMatch = educacion.length === currentDBRecords.educacion.length;
      console.log(`📊 Educación - UI: ${educacion.length}, BD: ${currentDBRecords.educacion.length}, Coinciden: ${eduCountMatch}`);
      
      if (!expCountMatch || !eduCountMatch) {
        console.warn('⚠️ ADVERTENCIA: Los registros en la UI no coinciden con los de la BD');
        console.log('🔄 Procediendo con sincronización...');
      } else {
        console.log('✅ Los registros en la UI coinciden con los de la BD');
      }
      
      // Actualizar datos principales del candidato
      const { error: candidatoError } = await supabase
        .from('candidatos')
        .update({
          primer_nombre: data.nombres,
          primer_apellido: data.apellidos,
          fecha_nacimiento: data.fechaNacimiento,
          edad: data.edad,
          genero: data.sexo,
          estado_civil: data.estadoCivil,
          telefono: data.telefono,
          direccion: data.direccion,
          ciudad: data.ciudad,
          ciudad_id: data.ciudad_id,
          departamento: data.departamento,
          cargo_aspirado: data.cargoAspirado,
          eps: data.eps,
          arl: data.arl,
          grupo_sanguineo: data.grupoSanguineo,
          nivel_educativo: data.nivelEducativo,
          contacto_emergencia_nombre: data.contactoEmergenciaNombre,
          contacto_emergencia_telefono: data.contactoEmergenciaTelefono,
          contacto_emergencia_relacion: data.contactoEmergenciaRelacion,
          talla_camisa: data.tallaCamisa,
          talla_pantalon: data.tallaPantalon,
          talla_zapato: data.tallaZapato,
          updated_at: new Date().toISOString()
        })
        .eq('email', user.email);

      if (candidatoError) {
        console.error('Error actualizando candidato:', candidatoError);
      }

      // Guardar experiencia laboral (incluso si está vacía, para eliminar registros)
      console.log('💼 Procesando experiencia laboral...');
      console.log('📋 Cantidad de registros de experiencia:', experienciaLaboral.length);
      console.log('📋 Datos de experiencia a guardar:', experienciaLaboral);
        
      // Eliminar registros existentes
      console.log('🗑️ Eliminando experiencia existente para candidato ID:', candidato.id);
      const { error: deleteExpError } = await supabase
        .from('experiencia_laboral')
        .delete()
        .eq('candidato_id', candidato.id);

      if (deleteExpError) {
        console.error('❌ Error eliminando experiencia existente:', deleteExpError);
      } else {
        console.log('✅ Experiencia existente eliminada exitosamente');
      }

      // Insertar nuevos registros solo si hay datos
      if (experienciaLaboral.length > 0) {
        const experienciaData = experienciaLaboral.map(exp => ({
          candidato_id: candidato.id,
          empresa: exp.empresa,
          cargo: exp.cargo,
          fecha_inicio: exp.fechaInicio,
          fecha_fin: exp.fechaFin || null,
          funciones: exp.responsabilidades || null,
          salario: exp.salario || null,
          motivo_retiro: exp.motivoRetiro || null
        }));

        console.log('📤 Insertando datos de experiencia:', experienciaData);

        const { error: expError } = await supabase
          .from('experiencia_laboral')
          .insert(experienciaData);

        if (expError) {
          console.error('Error guardando experiencia laboral:', expError);
        } else {
          console.log('✅ Experiencia laboral guardada exitosamente');
        }
      } else {
        console.log('ℹ️ No hay registros de experiencia para insertar');
      }

      // Guardar educación (incluso si está vacía, para eliminar registros)
      console.log('🎓 Procesando educación...');
      console.log('📚 Cantidad de registros de educación:', educacion.length);
      console.log('📚 Datos de educación a guardar:', educacion);
      
      // Eliminar registros existentes
      console.log('🗑️ Eliminando educación existente para candidato ID:', candidato.id);
      const { error: deleteEduError } = await supabase
        .from('educacion_candidato')
        .delete()
        .eq('candidato_id', candidato.id);

      if (deleteEduError) {
        console.error('❌ Error eliminando educación existente:', deleteEduError);
      } else {
        console.log('✅ Educación existente eliminada exitosamente');
      }

      // Insertar nuevos registros solo si hay datos
      if (educacion.length > 0) {
        const educacionData = educacion.map(edu => ({
          candidato_id: candidato.id,
          nivel: edu.nivelEducativo,
          institucion: edu.institucion,
          titulo: edu.titulo,
          fecha_inicio: edu.fechaInicio,
          fecha_fin: edu.fechaFin || null,
          ciudad: edu.ciudad,
          estado: 'completado'
        }));

        console.log('📤 Insertando datos de educación:', educacionData);

        const { error: eduError } = await supabase
          .from('educacion_candidato')
          .insert(educacionData);

        if (eduError) {
          console.error('Error guardando educación:', eduError);
        } else {
          console.log('✅ Educación guardada exitosamente');
        }
      } else {
        console.log('ℹ️ No hay registros de educación para insertar');
      }

      if (!candidatoError) {
        console.log('✅ Auto-guardado exitoso');
      }
    } catch (error) {
      console.error('Error en auto-guardado:', error);
    } finally {
      setIsAutoSaving(false);
    }
  }, [user, candidato, experienciaLaboral, educacion]);

  // Ref para manejar el timeout del debounce
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // useEffect para auto-guardado cuando se detecten cambios en el formulario principal
  useEffect(() => {
    if (!candidato) return;

    const subscription = form.watch((value, { name, type }) => {
      // Solo auto-guardar si hay un cambio real en un campo
      if (type === 'change' && name) {
        console.log(`🔄 Campo del formulario cambiado: ${name}`);
        triggerAutoSave();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [candidato, form]);

  // Función para activar el auto-guardado con debounce
  const triggerAutoSave = useCallback((immediate = false): Promise<void> => {
    console.log('🔄 triggerAutoSave() llamado', immediate ? '(inmediato)' : '(con debounce)');
    
    return new Promise((resolve, reject) => {
      // Limpiar timeout anterior si existe
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      if (immediate) {
        // Ejecutar inmediatamente para ediciones
        console.log('⚡ Ejecutando auto-guardado inmediato...');
      const formData = form.getValues();
        autoSave(formData)
          .then(() => resolve())
          .catch((error) => reject(error));
      } else {
        // Debounce: esperar 1.5 segundos después del último cambio
        autoSaveTimeoutRef.current = setTimeout(() => {
          console.log('⏰ Timeout del auto-guardado ejecutándose...');
          const formData = form.getValues();
          autoSave(formData)
            .then(() => resolve())
            .catch((error) => reject(error));
        }, 1500);
      }
    });
  }, [form, autoSave]);

  // Referencias para detectar solo cambios en cantidad de elementos
  const prevExperienciaLength = useRef(experienciaLaboral.length);
  const prevEducacionLength = useRef(educacion.length);
  const isInitialLoad = useRef(true);

  // useEffect para auto-guardado cuando se agrega o quita experiencia laboral o educación
  useEffect(() => {
    if (!candidato) return;

    const currentExperienciaLength = experienciaLaboral.length;
    const currentEducacionLength = educacion.length;
    
    // Solo disparar si cambió la cantidad de elementos (agregar/quitar)
    const experienciaChanged = currentExperienciaLength !== prevExperienciaLength.current;
    const educacionChanged = currentEducacionLength !== prevEducacionLength.current;
    
    // NO ejecutar auto-guardado durante la carga inicial
    if (isInitialLoad.current) {
      console.log('🔄 Carga inicial - NO ejecutando auto-guardado');
      console.log(`  - Experiencia laboral: ${prevExperienciaLength.current} → ${currentExperienciaLength}`);
      console.log(`  - Educación: ${prevEducacionLength.current} → ${currentEducacionLength}`);
      
      // Actualizar las referencias y marcar que ya no es carga inicial
      prevExperienciaLength.current = currentExperienciaLength;
      prevEducacionLength.current = currentEducacionLength;
      isInitialLoad.current = false;
      return;
    }
    
    if (experienciaChanged || educacionChanged) {
      console.log('🔄 Cambios en cantidad de registros detectados:');
      console.log(`  - Experiencia laboral: ${prevExperienciaLength.current} → ${currentExperienciaLength}`);
      console.log(`  - Educación: ${prevEducacionLength.current} → ${currentEducacionLength}`);
      
      // Ejecutar auto-guardado y luego refrescar datos
      triggerAutoSave().then(() => {
        console.log('🔄 Refrescando datos desde la base de datos...');
        // Recargar datos para obtener IDs reales y datos actualizados
        loadExperienciasLaborales(candidato.id);
        loadEducaciones(candidato.id);
      }).catch((error: any) => {
        console.error('❌ Error en auto-guardado:', error);
      });
    }
    
    // Actualizar las referencias para la próxima comparación
    prevExperienciaLength.current = currentExperienciaLength;
    prevEducacionLength.current = currentEducacionLength;
  }, [candidato, experienciaLaboral.length, educacion.length, triggerAutoSave]);

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

  // Cargar solicitudes asociadas al candidato (incluye empresa y estructura_datos)
  const loadSolicitudesCandidato = async (candidatoId: number) => {
    try {
      setIsLoadingSolicitudes(true);
      const { data, error } = await supabase
        .from('hum_solicitudes')
        .select(`
          id,
          empresa_id,
          candidato_id,
          estructura_datos,
          created_at,
          empresas!empresa_id ( id, razon_social ),
          candidatos!candidato_id ( id )
        `)
        .eq('candidato_id', candidatoId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSolicitudesCandidato(data || []);

      // A partir de las solicitudes, obtener los cargos (ids) y precargar su info y documentos
      const cargoIds = Array.from(new Set((data || []).map((s: any) => {
        const cargoFromJSON = s?.estructura_datos?.cargo ?? s?.estructura_datos?.datos?.cargo;
        return typeof cargoFromJSON === 'string' ? parseInt(cargoFromJSON) : cargoFromJSON;
      }).filter((id: any) => !!id)));

      if (cargoIds.length > 0) {
        // Cargar nombres de tipos_candidatos
        const { data: tipos, error: tiposError } = await supabase
          .from('tipos_candidatos')
          .select('id, nombre')
          .in('id', cargoIds);
        if (tiposError) throw tiposError;

        // Cargar documentos por tipo_candidato
        const { data: docs, error: docsError } = await supabase
        .from('tipos_candidatos_documentos')
        .select(`
            tipo_candidato_id,
            requerido,
            tipos_documentos ( id, nombre, descripcion )
          `)
          .in('tipo_candidato_id', cargoIds);
        if (docsError) throw docsError;

        const mapa: Record<number, { nombre: string; documentos: any[] }> = {};
        (tipos || []).forEach((t: any) => {
          mapa[t.id] = { nombre: t.nombre, documentos: [] };
        });
        (docs || []).forEach((d: any) => {
          if (!mapa[d.tipo_candidato_id]) {
            mapa[d.tipo_candidato_id] = { nombre: 'Desconocido', documentos: [] };
          }
          mapa[d.tipo_candidato_id].documentos.push(d);
        });
        setCargosMeta(mapa);

        // Cargar documentos existentes por solicitud
        const { data: documentosExistentes, error: docsExistentesError } = await supabase
          .from('candidatos_documentos')
          .select(`
            *,
            tipos_documentos(id, nombre, descripcion)
          `)
          .eq('candidato_id', candidatoId)
          .not('solicitud_id', 'is', null);

        if (docsExistentesError) {
          console.error('Error cargando documentos existentes:', docsExistentesError);
        } else {
          // Organizar documentos por solicitud y tipo de cargo
          const docsPorSolicitud: Record<string, any[]> = {};
          documentosExistentes?.forEach(doc => {
            const key = `${doc.solicitud_id}_${doc.tipo_cargo_id}`;
            if (!docsPorSolicitud[key]) {
              docsPorSolicitud[key] = [];
            }
            docsPorSolicitud[key].push(doc);
          });
          setDocumentosPorSolicitud(docsPorSolicitud);
          console.log('📄 Documentos existentes por solicitud:', docsPorSolicitud);
        }
      } else {
        setCargosMeta({});
        setDocumentosPorSolicitud({});
      }
    } catch (error) {
      console.error('Error cargando solicitudes del candidato:', error);
    } finally {
      setIsLoadingSolicitudes(false);
    }
  };

  // Eliminado: loadTipoCandidato. Los documentos ahora se derivan por cargo desde las solicitudes.

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
      
      // Forzar actualización del progreso
      setProgresoRefreshKey(prev => prev + 1);
      
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

  // Función para convertir archivo a Base64 (igual que en formulario de empresa)
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Función para manejar la subida de archivos por solicitud y cargo
  const handleFileChangeSolicitud = async (
    event: React.ChangeEvent<HTMLInputElement>, 
    solicitudId: number, 
    tipoCargoId: number, 
    tipoDocumentoId: number, 
    nombreDocumento: string
  ) => {
    const file = event.target.files?.[0];
    if (!file || !candidato) return;

    // Validar tipo de archivo
    if (file.type !== 'application/pdf') {
      toast.error('Solo se permiten archivos PDF');
      return;
    }

    // Validar tamaño (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('El archivo no puede ser mayor a 5MB');
      return;
    }

    try {
      const progressKey = `${solicitudId}_${tipoCargoId}_${tipoDocumentoId}`;
      setUploadingDocuments(prev => ({ ...prev, [progressKey]: true }));
      setUploadProgress(prev => ({ ...prev, [progressKey]: 0 }));

      // Simular progreso de lectura del archivo
      setUploadProgress(prev => ({ ...prev, [progressKey]: 25 }));

      // Convertir archivo a base64 (igual que en formulario de empresa)
      const base64 = await convertFileToBase64(file);
      const base64Data = base64.split(',')[1]; // Remover el prefijo data:application/pdf;base64,

      // Simular progreso de procesamiento
      setUploadProgress(prev => ({ ...prev, [progressKey]: 50 }));

      console.log('💾 Guardando documento en base de datos...');

      // Simular progreso de guardado
      setUploadProgress(prev => ({ ...prev, [progressKey]: 75 }));

      // Guardar información del documento en la base de datos con las nuevas columnas
      const { data: documentoData, error: documentoError } = await supabase
        .from('candidatos_documentos')
        .insert({
          candidato_id: candidato.id,
          solicitud_id: solicitudId,
          tipo_cargo_id: tipoCargoId,
          tipo_documento_id: tipoDocumentoId,
          nombre_archivo: file.name,
          url_archivo: base64Data, // Guardar base64 directamente como en empresa
          fecha_carga: new Date().toISOString()
        })
        .select(`
          *,
          tipos_documentos(id, nombre, descripcion)
        `)
        .single();

      if (documentoError) {
        console.error('❌ Error guardando documento:', documentoError);
        toast.error('Error guardando la información del documento');
        return;
      }

      // Completar progreso
      setUploadProgress(prev => ({ ...prev, [progressKey]: 100 }));

      // Actualizar la lista de documentos por solicitud
      const key = `${solicitudId}_${tipoCargoId}`;
      setDocumentosPorSolicitud(prev => ({
        ...prev,
        [key]: [...(prev[key] || []), documentoData]
      }));

      // Actualizar documentos existentes y forzar recálculo del progreso
      if (candidato?.id) {
        await loadDocumentosCandidato(candidato.id);
      }

      // Verificar si todos los documentos requeridos están subidos y actualizar estado
      await verificarYActualizarEstadoSolicitud(solicitudId, tipoCargoId);

      toast.success(`${nombreDocumento} subido correctamente`);
      console.log('✅ Documento guardado exitosamente:', documentoData);

      // Limpiar progreso después de un momento
      setTimeout(() => {
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[progressKey];
          return newProgress;
        });
      }, 1000);

    } catch (error) {
      console.error('❌ Error en handleFileChangeSolicitud:', error);
      toast.error('Error subiendo el archivo');
      const progressKey = `${solicitudId}_${tipoCargoId}_${tipoDocumentoId}`;
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[progressKey];
        return newProgress;
      });
    } finally {
      const progressKey = `${solicitudId}_${tipoCargoId}_${tipoDocumentoId}`;
      setUploadingDocuments(prev => ({ ...prev, [progressKey]: false }));
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

  // Función para visualizar documento (similar a empresa)
  // Función para visualizar documento en modal
  const handleViewDocument = (documento: any) => {
    setModalDocumento({isOpen: true, documento});
  };

  // Función para cerrar modal
  const handleCloseModal = () => {
    setModalDocumento({isOpen: false, documento: null});
  };


  // Función para verificar y actualizar estado de solicitud
  const verificarYActualizarEstadoSolicitud = async (solicitudId: number, tipoCargoId: number) => {
    try {
      // Obtener documentos requeridos para este cargo
      const cargo = cargosMeta[tipoCargoId];
      if (!cargo) {
        console.log('❌ No se encontró el cargo:', tipoCargoId);
        return;
      }

      const documentosRequeridos = cargo.documentos.filter(doc => doc.requerido);
      const documentosRequeridosIds = documentosRequeridos.map(doc => doc.tipos_documentos.id);
      
      console.log('🔍 Documentos requeridos para el cargo:', documentosRequeridosIds);

      // Obtener documentos subidos directamente de la base de datos para esta solicitud y cargo
      const { data: documentosSubidos, error: docsError } = await supabase
        .from('candidatos_documentos')
        .select('tipo_documento_id')
        .eq('solicitud_id', solicitudId)
        .eq('tipo_cargo_id', tipoCargoId);

      if (docsError) {
        console.error('Error obteniendo documentos subidos:', docsError);
        return;
      }

      const documentosSubidosIds = documentosSubidos?.map(doc => doc.tipo_documento_id) || [];
      console.log('🔍 Documentos subidos para la solicitud:', documentosSubidosIds);

      // Verificar si todos los documentos requeridos están subidos
      const documentosRequeridosSubidos = documentosRequeridosIds.filter(id => 
        documentosSubidosIds.includes(id)
      );

      console.log('🔍 Documentos requeridos subidos:', documentosRequeridosSubidos);
      console.log('🔍 Total requeridos:', documentosRequeridosIds.length);
      console.log('🔍 Total subidos:', documentosRequeridosSubidos.length);

      const todosLosDocumentosRequeridosSubidos = documentosRequeridosSubidos.length === documentosRequeridosIds.length;

      if (todosLosDocumentosRequeridosSubidos && documentosRequeridosIds.length > 0) {
        console.log('✅ Todos los documentos requeridos están subidos, actualizando estado...');
        
        // Actualizar estado de la solicitud a "documentos entregados"
        const { error } = await supabase
          .from('hum_solicitudes')
          .update({ 
            estado: 'documentos entregados',
            updated_at: new Date().toISOString()
          })
          .eq('id', solicitudId);

        if (error) {
          console.error('Error actualizando estado de solicitud:', error);
        } else {
          console.log('✅ Estado de solicitud actualizado a "documentos entregados"');
          toast.success('¡Todos los documentos requeridos han sido entregados!');
        }
      } else {
        console.log('❌ Aún faltan documentos requeridos');
      }
    } catch (error) {
      console.error('Error verificando estado de solicitud:', error);
    }
  };

  // Función para cambiar documento
  const handleChangeDocument = async (file: File, documentoId: number, progressKey: string) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('El archivo no puede ser mayor a 5MB');
      return;
    }

    try {
      setUploadingDocuments(prev => ({ ...prev, [progressKey]: true }));
      setUploadProgress(prev => ({ ...prev, [progressKey]: 0 }));

      // Simular progreso de lectura del archivo
      setUploadProgress(prev => ({ ...prev, [progressKey]: 25 }));

      // Convertir archivo a base64
      const base64 = await convertFileToBase64(file);
      const base64Data = base64.split(',')[1]; // Remover el prefijo data:application/pdf;base64,

      // Simular progreso de procesamiento
      setUploadProgress(prev => ({ ...prev, [progressKey]: 50 }));

      console.log('💾 Actualizando documento en base de datos...');

      // Simular progreso de guardado
      setUploadProgress(prev => ({ ...prev, [progressKey]: 75 }));

      // Actualizar documento en la base de datos
      const { data, error } = await supabase
        .from('candidatos_documentos')
        .update({
          nombre_archivo: file.name,
          url_archivo: base64Data,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentoId)
        .select();

      if (error) {
        console.error('❌ Error actualizando documento:', error);
        toast.error('Error actualizando el documento');
        return;
      }

      // Completar progreso
      setUploadProgress(prev => ({ ...prev, [progressKey]: 100 }));

      toast.success(`${file.name} ha sido actualizado correctamente.`);

      // Actualizar la lista de documentos y solicitudes
      if (candidato?.id) {
        await loadDocumentosCandidato(candidato.id);
        await loadSolicitudesCandidato(candidato.id);
      }

      // Limpiar progreso después de un momento
      setTimeout(() => {
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[progressKey];
          return newProgress;
        });
      }, 1000);

    } catch (error) {
      console.error('❌ Error actualizando documento:', error);
      toast.error('Error actualizando el documento');
    } finally {
      setUploadingDocuments(prev => ({ ...prev, [progressKey]: false }));
      setDocumentoACambiar(null);
    }
  };

  // Función para calcular el progreso del perfil
  const calcularProgresoPerfil = () => {
    // Usar progresoRefreshKey para forzar recálculo
    const _ = progresoRefreshKey;
    
    if (!candidato) return 0;
    
    // Campos del formulario con sus pesos (SOLO los que están implementados visualmente)
    const camposConPeso = [
      { campo: 'nombres', peso: 8, requerido: true },
      { campo: 'apellidos', peso: 8, requerido: true },
      { campo: 'fechaNacimiento', peso: 6, requerido: false },
      { campo: 'edad', peso: 4, requerido: false },
      { campo: 'sexo', peso: 4, requerido: false },
      { campo: 'estadoCivil', peso: 4, requerido: false },
      { campo: 'telefono', peso: 8, requerido: true },
      { campo: 'direccion', peso: 6, requerido: false },
      { campo: 'departamento', peso: 4, requerido: false },
      { campo: 'ciudad', peso: 6, requerido: false },
      { campo: 'grupoSanguineo', peso: 4, requerido: false },
      { campo: 'contactoEmergenciaNombre', peso: 4, requerido: false },
      { campo: 'contactoEmergenciaTelefono', peso: 4, requerido: false },
      { campo: 'contactoEmergenciaRelacion', peso: 4, requerido: false },
      { campo: 'tallaCamisa', peso: 3, requerido: false },
      { campo: 'tallaPantalon', peso: 3, requerido: false },
      { campo: 'tallaZapato', peso: 3, requerido: false }
    ];
    
    let puntajeTotal = 0;
    let puntajeCompletado = 0;
    
    // Calcular progreso de campos del formulario
    camposConPeso.forEach(({ campo, peso, requerido }) => {
      puntajeTotal += peso;
      const valor = candidato[campo as keyof Candidato];
      
      if (valor && valor.toString().trim() !== '') {
        puntajeCompletado += peso;
      }
    });
    
    // Calcular progreso de experiencia laboral (15 puntos)
    if (experienciaLaboral.length > 0) {
      puntajeTotal += 15;
      puntajeCompletado += 15;
      console.log('🔍 calcularProgresoPerfil - Experiencia laboral: +15 puntos');
    }
    
    // Calcular progreso de educación (15 puntos)
    if (educacion.length > 0) {
      puntajeTotal += 15;
      puntajeCompletado += 15;
      console.log('🔍 calcularProgresoPerfil - Educación: +15 puntos');
    }
    
    // Calcular progreso por documentos requeridos (20 puntos máximo)
    const documentosRequeridosIds = new Set<number>();
    Object.values(cargosMeta).forEach(cargo => {
      cargo.documentos.forEach(doc => {
        if (doc.requerido) {
          documentosRequeridosIds.add(doc.tipos_documentos.id);
        }
      });
    });

    if (documentosRequeridosIds.size > 0) {
      // Contar cuántos documentos requeridos están subidos
      const documentosRequeridosSubidos = existingDocuments.filter(doc => 
        documentosRequeridosIds.has(doc.tipo_documento_id)
      ).length;

      const pesoTotalDocumentos = 20; // 20 puntos fijos para documentos requeridos
      const pesoDocumentosCompletados = Math.round((documentosRequeridosSubidos / documentosRequeridosIds.size) * pesoTotalDocumentos);

      puntajeTotal += pesoTotalDocumentos;
      puntajeCompletado += pesoDocumentosCompletados;
      
      console.log('🔍 calcularProgresoPerfil - Documentos requeridos:', documentosRequeridosIds.size);
      console.log('🔍 calcularProgresoPerfil - Documentos requeridos subidos:', documentosRequeridosSubidos);
      console.log('🔍 calcularProgresoPerfil - Documentos requeridos: +', pesoDocumentosCompletados, '/', pesoTotalDocumentos, 'puntos');
    }
    
    // Debug información detallada
    console.log('🔍 calcularProgresoPerfil - Experiencia laboral:', experienciaLaboral.length, 'registros');
    console.log('🔍 calcularProgresoPerfil - Educación:', educacion.length, 'registros');
    console.log('🔍 calcularProgresoPerfil - Documentos existentes totales:', existingDocuments.length);
    console.log('🔍 calcularProgresoPerfil - Cargos meta:', Object.keys(cargosMeta).length);
    
    // Identificar campos faltantes
    const camposCompletados = camposConPeso.filter(({ campo }) => {
      const valor = candidato[campo as keyof Candidato];
      return valor && valor.toString().trim() !== '';
    });
    
    const camposFaltantes = camposConPeso.filter(({ campo }) => {
      const valor = candidato[campo as keyof Candidato];
      return !valor || valor.toString().trim() === '';
    });
    
    console.log('🔍 calcularProgresoPerfil - Campos del formulario completados:', camposCompletados.length, '/', camposConPeso.length);
    console.log('🔍 calcularProgresoPerfil - Campos FALTANTES:', camposFaltantes.map(({ campo, peso }) => `${campo} (${peso}pts)`));
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

  // Función para calcular el estado de documentos por cargo
  const calcularEstadoDocumentosCargo = (cargoId: number) => {
    // Usar progresoRefreshKey para forzar recálculo
    const _ = progresoRefreshKey;
    
    if (!candidato || !cargosMeta[cargoId]) return { completado: false, total: 0, subidos: 0 };
    
    const cargo = cargosMeta[cargoId];
    const documentosRequeridos = cargo.documentos.filter(doc => doc.requerido);
    const documentosNoRequeridos = cargo.documentos.filter(doc => !doc.requerido);
    
    // Contar documentos requeridos subidos
    const documentosRequeridosSubidos = documentosRequeridos.filter(doc => 
      existingDocuments.some(existing => existing.tipo_documento_id === doc.tipos_documentos.id)
    ).length;
    
    // Contar documentos no requeridos subidos
    const documentosNoRequeridosSubidos = documentosNoRequeridos.filter(doc => 
      existingDocuments.some(existing => existing.tipo_documento_id === doc.tipos_documentos.id)
    ).length;
    
    const totalDocumentos = documentosRequeridos.length;
    const documentosSubidos = documentosRequeridosSubidos;
    
    return {
      completado: documentosRequeridosSubidos === documentosRequeridos.length,
      total: totalDocumentos,
      subidos: documentosSubidos,
      opcionalesSubidos: documentosNoRequeridosSubidos,
      opcionalesTotal: documentosNoRequeridos.length
    };
  };

  // Función para detectar documentos no requeridos pendientes
  const tieneDocumentosNoRequeridosPendientes = () => {
    // Usar progresoRefreshKey para forzar recálculo
    const _ = progresoRefreshKey;
    
    if (!candidato || existingDocuments.length === 0) return false;
    
    // Obtener IDs de documentos requeridos
    const documentosRequeridosIds = new Set<number>();
    Object.values(cargosMeta).forEach(cargo => {
      cargo.documentos.forEach(doc => {
        if (doc.requerido) {
          documentosRequeridosIds.add(doc.tipos_documentos.id);
        }
      });
    });

    // Obtener todos los tipos de documentos disponibles para los cargos
    const todosLosDocumentosIds = new Set<number>();
    Object.values(cargosMeta).forEach(cargo => {
      cargo.documentos.forEach(doc => {
        todosLosDocumentosIds.add(doc.tipos_documentos.id);
      });
    });

    // Obtener documentos no requeridos disponibles
    const documentosNoRequeridosIds = new Set<number>();
    Object.values(cargosMeta).forEach(cargo => {
      cargo.documentos.forEach(doc => {
        if (!doc.requerido) {
          documentosNoRequeridosIds.add(doc.tipos_documentos.id);
        }
      });
    });

    // Verificar si hay documentos no requeridos que no están subidos
    const documentosNoRequeridosSubidos = existingDocuments.filter(doc => 
      documentosNoRequeridosIds.has(doc.tipo_documento_id)
    ).length;

    return documentosNoRequeridosIds.size > 0 && documentosNoRequeridosSubidos < documentosNoRequeridosIds.size;
  };

  // Función para obtener el texto del progreso
  const getTextoProgreso = (progreso: number) => {
    if (progreso < 30) return 'Incompleto';
    if (progreso < 60) return 'En progreso';
    if (progreso < 90) return 'Casi completo';
    
    // Si está al 100% pero tiene documentos no requeridos pendientes, mostrar "En proceso"
    if (progreso === 100 && tieneDocumentosNoRequeridosPendientes()) {
      return 'En proceso';
    }
    
    return 'Completado';
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
        .select(`
          *,
          ciudades!ciudad_id (
            id,
            nombre,
            departamento_id,
            departamentos!departamento_id (
              id,
              nombre
            )
          )
        `)
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
            tallaCamisa: '',
            tallaPantalon: '',
            tallaZapato: '',
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
        console.log('🔍 Datos del candidato cargados:', {
          ciudad: candidatoData.ciudades?.nombre || candidatoData.ciudad,
          ciudad_id: candidatoData.ciudad_id,
          departamento: candidatoData.ciudades?.departamentos?.nombre || candidatoData.departamento,
          departamento_id: candidatoData.ciudades?.departamento_id,
          relaciones: candidatoData.ciudades
        });
        
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
          ciudad: candidatoData.ciudades?.nombre || candidatoData.ciudad || '',
          ciudad_id: candidatoData.ciudad_id || undefined,
          departamento: candidatoData.ciudades?.departamentos?.nombre || candidatoData.departamento || '',
          cargoAspirado: candidatoData.cargo_aspirado || '',
          eps: candidatoData.eps || '',
          arl: candidatoData.arl || '',
          grupoSanguineo: candidatoData.grupo_sanguineo || '',
          nivelEducativo: candidatoData.nivel_educativo || '',
          contactoEmergenciaNombre: candidatoData.contacto_emergencia_nombre || '',
          contactoEmergenciaTelefono: candidatoData.contacto_emergencia_telefono || '',
          contactoEmergenciaRelacion: candidatoData.contacto_emergencia_relacion || '',
          tallaCamisa: candidatoData.talla_camisa || '',
          tallaPantalon: candidatoData.talla_pantalon || '',
          tallaZapato: candidatoData.talla_zapato || '',
          hojaDeVida: candidatoData.hoja_de_vida || '',
          fotografia: candidatoData.fotografia || '',
          completado: candidatoData.completado || false,
          estado: candidatoData.estado || 'activo',
          fechaRegistro: candidatoData.created_at
        };

        setCandidato(candidatoTransformado);
        form.reset(candidatoTransformado);
        
        // Inicializar estados de departamento y ciudad si existen
        if (candidatoData.ciudad_id && candidatoData.ciudades?.departamento_id) {
          // Usar el departamento_id de la relación
          const departamentoId = candidatoData.ciudades.departamento_id;
          setDepartamentoSeleccionado(departamentoId);
          
          console.log('🔍 Inicializando estados:', {
            departamentoId,
            cityDataDisponible: !!cityData,
            ciudadesDelDepartamento: cityData?.[departamentoId]?.ciudades?.length || 0
          });
          
          // Cargar ciudades del departamento
          if (cityData?.[departamentoId]) {
            setCiudadesDisponibles(cityData[departamentoId].ciudades);
            console.log('✅ Ciudades cargadas:', cityData[departamentoId].ciudades);
          } else {
            console.log('❌ No se encontraron ciudades para el departamento:', departamentoId);
          }
        }
        
        // Cargar tipo de candidato y sus documentos requeridos
        // Ya no se carga tipo_candidato desde candidatos. Los documentos se derivan de las solicitudes (cargo en estructura_datos)
        
        // Cargar documentos del candidato
        await loadDocumentosCandidato(candidatoData.id);
        
        // Cargar experiencias laborales del candidato
        await loadExperienciasLaborales(candidatoData.id);
        
        // Cargar educaciones del candidato
        await loadEducaciones(candidatoData.id);

        // Cargar solicitudes del candidato (para Tab Archivos)
        await loadSolicitudesCandidato(candidatoData.id);
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

  // Función para cargar experiencias laborales del candidato
  const loadExperienciasLaborales = async (candidatoId: number) => {
    try {
      console.log('🔄 Cargando experiencias laborales para candidato:', candidatoId);
      const { data, error } = await supabase
        .from('experiencia_laboral')
        .select('*')
        .eq('candidato_id', candidatoId)
        .order('fecha_inicio', { ascending: false });
      
      if (error) throw error;
      
      // Transformar los datos para que coincidan con el formato esperado
      const experienciasTransformadas = (data || []).map(exp => ({
        id: exp.id,
        empresa: exp.empresa || '',
        cargo: exp.cargo || '',
        fechaInicio: exp.fecha_inicio || '',
        fechaFin: exp.fecha_fin || '',
        responsabilidades: exp.responsabilidades || '',
        salario: exp.salario || '',
        motivoRetiro: exp.motivo_retiro || ''
      }));
      
      setExperienciaLaboral(experienciasTransformadas);
      console.log('✅ Experiencias laborales cargadas:', experienciasTransformadas.length);
    } catch (error) {
      console.error('Error cargando experiencias laborales:', error);
    }
  };

  // Función para cargar educaciones del candidato
  const loadEducaciones = async (candidatoId: number) => {
    try {
      console.log('🔄 Cargando educaciones para candidato:', candidatoId);
      const { data, error } = await supabase
        .from('educacion_candidato')
        .select('*')
        .eq('candidato_id', candidatoId)
        .order('fecha_inicio', { ascending: false });
      
      if (error) throw error;
      
      // Transformar los datos para que coincidan con el formato esperado
      const educacionesTransformadas = (data || []).map(edu => ({
        id: edu.id,
        nivelEducativo: edu.nivel || '',
        institucion: edu.institucion || '',
        titulo: edu.titulo || '',
        fechaInicio: edu.fecha_inicio || '',
        fechaFin: edu.fecha_fin || '',
        ciudad: edu.ciudad || ''
      }));
      
      setEducacion(educacionesTransformadas);
      console.log('✅ Educaciones cargadas:', educacionesTransformadas.length);
    } catch (error) {
      console.error('Error cargando educaciones:', error);
    }
  };

  const onSubmit = async (data: PerfilForm) => {
    setIsSaving(true);
    try {
      if (!user) {
        toast.error('No hay usuario autenticado');
        return;
      }

      console.log('🔍 Datos del formulario a guardar:', {
        ciudad: data.ciudad,
        ciudad_id: data.ciudad_id,
        departamento: data.departamento,
        departamentoSeleccionado: departamentoSeleccionado,
        ciudadesDisponibles: ciudadesDisponibles.length
      });

      // Actualizar el candidato en Supabase
      const { data: updatedCandidato, error } = await supabase
        .from('candidatos')
        .update({
          primer_nombre: data.nombres,
          primer_apellido: data.apellidos,
          fecha_nacimiento: data.fechaNacimiento,
          edad: data.edad,
          genero: data.sexo,
          estado_civil: data.estadoCivil,
          telefono: data.telefono,
          direccion: data.direccion,
          ciudad: data.ciudad, // Mantener el texto para compatibilidad
          ciudad_id: data.ciudad_id, // Guardar el ID de la ciudad
          departamento: data.departamento, // Guardar el departamento
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
          <p className="mt-4 text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!candidato) {
    return null;
  }

  return (
    <div className="p-4 max-w-full mx-auto">
      <ProgressStyles />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-extrabold text-cyan-800 flex items-center gap-2 mb-2">
          <User className="w-8 h-8 text-cyan-600" />
          Información Personal
        </h1>
      </div>

      {/* Header similar al diseño de otras páginas */}
      <div className="bg-white rounded-lg border mb-6">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
              <User className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <span className="text-lg font-semibold text-gray-700">PERFIL PERSONAL</span>
              <div className="flex items-center space-x-2">
                <p className="text-sm text-gray-500">
                  {candidato ? `${candidato.nombres} ${candidato.apellidos} · ${candidato.email}` : 'Gestiona tu información personal y profesional'}
                </p>
                {candidato && (
                  <Badge 
                    variant="outline" 
                    className={`text-xs px-2 py-0.5 ${
                      getTextoProgreso(calcularProgresoPerfil()) === 'Completado' 
                        ? 'bg-green-50 text-green-700 border-green-200' 
                        : getTextoProgreso(calcularProgresoPerfil()) === 'En proceso'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-gray-50 text-gray-700 border-gray-200'
                    }`}
                  >
                    {getTextoProgreso(calcularProgresoPerfil())}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {isAutoSaving && (
              <div className="flex items-center text-sm text-cyan-600">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-cyan-600 mr-2"></div>
                Guardando cambios...
              </div>
            )}
            {candidato && (
              <Badge 
                variant="outline" 
                className={`flex items-center space-x-1 ${
                  getTextoProgreso(calcularProgresoPerfil()) === 'Completado' 
                    ? 'bg-green-50 text-green-700 border-green-200' 
                    : getTextoProgreso(calcularProgresoPerfil()) === 'En proceso'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-gray-50 text-gray-700 border-gray-200'
                }`}
              >
                {getTextoProgreso(calcularProgresoPerfil()) === 'Completado' ? (
                  <>
                    <CheckCircle className="w-3 h-3" />
                    <span>Completado</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3 h-3" />
                    <span>{getTextoProgreso(calcularProgresoPerfil())}</span>
                  </>
                )}
              </Badge>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="p-3 border-b bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-cyan-100 rounded-full flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-cyan-600 rounded-full animate-pulse"></div>
              </div>
              <span className="text-sm font-medium text-gray-700">Progreso del Perfil</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-bold ${getColorProgreso(calcularProgresoPerfil()).replace('bg-', 'text-')}`}>
                {calcularProgresoPerfil()}%
              </span>
              <Badge variant="outline" className="text-xs px-2 py-0.5">
                {getTextoProgreso(calcularProgresoPerfil())}
              </Badge>
            </div>
          </div>
          
          {/* Advertencia para documentos no requeridos pendientes */}
          {calcularProgresoPerfil() === 100 && tieneDocumentosNoRequeridosPendientes() && (
            <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-amber-800">Documentos adicionales disponibles</h4>
                  <p className="text-xs text-amber-700 mt-1">
                    Tienes documentos opcionales por subir en el tab de archivos. Aunque tu perfil está completo, puedes subir estos documentos adicionales para mejorar tu perfil.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Barra de progreso compacta */}
          <div className="relative group">
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden transition-all duration-300 group-hover:bg-gray-300">
              {/* Progreso completado */}
              <div 
                className={`h-full transition-all duration-1000 ease-out rounded-full relative group-hover:shadow-lg ${
                  calcularProgresoPerfil() >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-500 group-hover:from-green-600 group-hover:to-emerald-600' :
                  calcularProgresoPerfil() >= 60 ? 'bg-gradient-to-r from-cyan-500 to-teal-500 group-hover:from-cyan-600 group-hover:to-teal-600' :
                  calcularProgresoPerfil() >= 40 ? 'bg-gradient-to-r from-yellow-500 to-orange-500 group-hover:from-yellow-600 group-hover:to-orange-600' :
                  'bg-gradient-to-r from-red-400 to-pink-500 group-hover:from-red-500 group-hover:to-pink-600'
                }`}
                style={{ 
                  width: `${calcularProgresoPerfil()}%`
                }}
              >
                {/* Efecto de brillo sutil */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-pulse group-hover:opacity-30"></div>
              </div>
              
              {/* Progreso restante con animación sutil */}
              {calcularProgresoPerfil() < 100 && (
                <div 
                  className="absolute top-0 h-full bg-gradient-to-r from-gray-300 to-gray-400 rounded-full overflow-hidden group-hover:from-gray-400 group-hover:to-gray-500"
                  style={{ 
                    left: `${calcularProgresoPerfil()}%`,
                    width: `${100 - calcularProgresoPerfil()}%`
                  }}
                >
                  {/* Efecto shimmer más sutil */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-10 progress-shimmer group-hover:opacity-15"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <span className="text-lg font-semibold text-gray-700">INFORMACIÓN DEL CANDIDATO</span>
              <p className="text-sm text-gray-500">Complete toda la información para mejorar sus oportunidades laborales</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-5 bg-cyan-100/60 p-1 rounded-lg">
                  <TabsTrigger 
                    value="personal"
                    className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
                  >
                    Personal
                  </TabsTrigger>
                  <TabsTrigger 
                    value="contacto"
                    className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
                  >
                    Contacto
                  </TabsTrigger>
                  <TabsTrigger 
                    value="profesional"
                    className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
                  >
                    Experiencia Laboral
                  </TabsTrigger>
                  <TabsTrigger 
                    value="educacion"
                    className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
                  >
                    Educación
                  </TabsTrigger>
                  <TabsTrigger 
                    value="archivos"
                    className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
                  >
                    Archivos
                  </TabsTrigger>
                </TabsList>

                  <TabsContent value="personal" className="space-y-4">
                    {/* Primera fila */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Nombres *</label>
                        <Input 
                          value={form.watch('nombres') || ''}
                          onChange={(e) => form.setValue('nombres', e.target.value)}
                        />
                        {form.formState.errors.nombres && (
                          <p className="text-sm text-red-500">{form.formState.errors.nombres.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Apellidos *</label>
                              <Input 
                          value={form.watch('apellidos') || ''}
                          onChange={(e) => form.setValue('apellidos', e.target.value)}
                        />
                        {form.formState.errors.apellidos && (
                          <p className="text-sm text-red-500">{form.formState.errors.apellidos.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Fecha de Nacimiento *</label>
                        <div 
                          onClick={() => console.log('🔍 Click en contenedor del DatePicker')}
                          className="relative"
                        >
                          <CustomDatePicker
                            value={form.watch('fechaNacimiento') ? (() => {
                              const fechaString = form.watch('fechaNacimiento') || '';
                              const fechaParsed = parseISO(fechaString);
                              console.log('🔍 Campo fechaNacimiento - String original:', fechaString);
                              console.log('🔍 Campo fechaNacimiento - Fecha parseada:', fechaParsed);
                              return fechaParsed;
                            })() : null}
                            onChange={(date) => {
                              const fechaString = date ? format(date, 'yyyy-MM-dd') : '';
                              console.log('🔍 Campo fechaNacimiento - Fecha seleccionada:', date);
                              console.log('🔍 Campo fechaNacimiento - Nuevo valor formateado:', fechaString);
                              form.setValue('fechaNacimiento', fechaString, { shouldDirty: true, shouldTouch: true });
                              const edad = calcularEdad(fechaString);
                                  console.log('🔍 Campo fechaNacimiento - Edad calculada para el formulario:', edad);
                              form.setValue('edad', edad, { shouldDirty: true, shouldTouch: true });
                              // Disparar auto-guardado manualmente
                              triggerAutoSave();
                            }}
                            maxDate={new Date()} // No permitir fechas futuras
                          />
                        </div>
                        {form.formState.errors.fechaNacimiento && (
                          <p className="text-sm text-red-500">{form.formState.errors.fechaNacimiento.message}</p>
                        )}
                      </div>
                    </div>

                    {/* Segunda fila */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Edad</label>
                                <Input 
                                  type="number" 
                                  min="18" 
                                  max="100" 
                          value={form.watch('edad') || ''}
                                  onChange={(e) => {
                                    const value = e.target.value === '' ? undefined : parseInt(e.target.value);
                                    console.log('🔍 Campo edad - Nuevo valor:', value, 'Tipo:', typeof value);
                            form.setValue('edad', value);
                          }}
                          className="w-full"
                        />
                        {form.formState.errors.edad && (
                          <p className="text-sm text-red-500">{form.formState.errors.edad.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Grupo Sanguíneo</label>
                        <Select 
                          value={form.watch('grupoSanguineo') || ''} 
                          onValueChange={(value) => {
                            form.setValue('grupoSanguineo', value, { shouldDirty: true, shouldTouch: true });
                            triggerAutoSave();
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue  />
                          </SelectTrigger>
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
                        {form.formState.errors.grupoSanguineo && (
                          <p className="text-sm text-red-500">{form.formState.errors.grupoSanguineo.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Sexo</label>
                        <Select 
                          value={form.watch('sexo') || ''} 
                          onValueChange={(value) => {
                            console.log('🔍 Campo sexo - Valor seleccionado:', value);
                            form.setValue('sexo', value, { shouldDirty: true, shouldTouch: true });
                            console.log('🔍 Campo sexo - Valor en formulario después de setValue:', form.getValues('sexo'));
                            triggerAutoSave();
                            console.log('🔍 Campo sexo - triggerAutoSave() ejecutado');
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue  />
                                </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Masculino">Masculino</SelectItem>
                                <SelectItem value="Femenino">Femenino</SelectItem>
                                <SelectItem value="Otro">Otro</SelectItem>
                              </SelectContent>
                            </Select>
                        {form.formState.errors.sexo && (
                          <p className="text-sm text-red-500">{form.formState.errors.sexo.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Estado Civil</label>
                        <Select 
                          value={form.watch('estadoCivil') || ''} 
                          onValueChange={(value) => {
                            form.setValue('estadoCivil', value, { shouldDirty: true, shouldTouch: true });
                            triggerAutoSave();
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue  />
                                </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Soltero">Soltero</SelectItem>
                                <SelectItem value="Casado">Casado</SelectItem>
                                <SelectItem value="Divorciado">Divorciado</SelectItem>
                                <SelectItem value="Viudo">Viudo</SelectItem>
                                <SelectItem value="Unión Libre">Unión Libre</SelectItem>
                              </SelectContent>
                            </Select>
                        {form.formState.errors.estadoCivil && (
                          <p className="text-sm text-red-500">{form.formState.errors.estadoCivil.message}</p>
                        )}
                      </div>
                    </div>

                    {/* Sección de Tallas - Separada visualmente */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Información de Tallas
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-blue-800">Talla Camisa</label>
                          <Input 
                            value={form.watch('tallaCamisa') || ''}
                            onChange={(e) => {
                              form.setValue('tallaCamisa', e.target.value, { shouldDirty: true, shouldTouch: true });
                              triggerAutoSave();
                            }}
                            placeholder="Ej: M, L, XL"
                          />
                          {form.formState.errors.tallaCamisa && (
                            <p className="text-sm text-red-500">{form.formState.errors.tallaCamisa.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-blue-800">Talla Pantalón</label>
                          <Input 
                            value={form.watch('tallaPantalon') || ''}
                            onChange={(e) => {
                              form.setValue('tallaPantalon', e.target.value, { shouldDirty: true, shouldTouch: true });
                              triggerAutoSave();
                            }}
                            placeholder="Ej: 32, 34, 36"
                          />
                          {form.formState.errors.tallaPantalon && (
                            <p className="text-sm text-red-500">{form.formState.errors.tallaPantalon.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-blue-800">Talla Zapato</label>
                          <Input 
                            value={form.watch('tallaZapato') || ''}
                            onChange={(e) => {
                              form.setValue('tallaZapato', e.target.value, { shouldDirty: true, shouldTouch: true });
                              triggerAutoSave();
                            }}
                            placeholder="Ej: 40, 42, 44"
                          />
                          {form.formState.errors.tallaZapato && (
                            <p className="text-sm text-red-500">{form.formState.errors.tallaZapato.message}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="contacto" className="space-y-4">
                    {/* Primera fila - Información básica */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                        name="departamento"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Departamento</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Select
                                  value={departamentoSeleccionado?.toString() || ''}
                                  onValueChange={(value) => handleDepartamentoChange(parseInt(value))}
                                >
                                  <SelectTrigger className="pl-10">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {cityData && Object.entries(cityData).map(([id, dept]) => (
                                      <SelectItem key={id} value={id}>
                                        {dept.nombre}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
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
                                <Select
                                  value={form.watch('ciudad_id')?.toString() || ''}
                                  onValueChange={(value) => handleCiudadChange(parseInt(value))}
                                  disabled={!departamentoSeleccionado}
                                >
                                  <SelectTrigger className="pl-10">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {ciudadesDisponibles.map((ciudad) => (
                                      <SelectItem key={ciudad.id} value={ciudad.id.toString()}>
                                        {ciudad.nombre}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                        <FormField
                          control={form.control}
                          name="direccion"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Dirección</FormLabel>
                              <FormControl>
                              <div className="relative">
                                <Home className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input {...field} className="pl-10" />
                              </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                    {/* Segunda fila - Contacto de emergencia */}
                    <div className="space-y-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center space-x-2 mb-4">
                        <UserCheck className="h-4 w-4 text-blue-600" />
                        <h3 className="text-lg font-semibold text-blue-900">Contacto de Emergencia</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="contactoEmergenciaNombre"
                        render={({ field }) => (
                          <FormItem>
                              <FormLabel>Nombre</FormLabel>
                            <FormControl>
                                <div className="relative">
                                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                  <Input {...field} className="pl-10" />
                                </div>
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
                              <FormLabel>Teléfono</FormLabel>
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
                        name="contactoEmergenciaRelacion"
                        render={({ field }) => (
                          <FormItem>
                              <FormLabel>Relación</FormLabel>
                            <FormControl>
                                <div className="relative">
                                  <UserCheck className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                  <Input {...field} className="pl-10" />
                                </div>
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
                  triggerAutoSave={triggerAutoSave}
                  candidatoId={candidato?.id}
                    />
                  </TabsContent>

                  <TabsContent value="educacion" className="space-y-4">
                    <EducacionTab 
                      educacion={educacion}
                      onChange={setEducacion}
                      triggerAutoSave={triggerAutoSave}
                      candidatoId={candidato?.id}
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
                          <p className="text-sm text-gray-600">Archivos asociados a sus solicitudes y cargos</p>
                        </div>
                      </div>
                      
                      {isLoadingDocuments ? (
                        <div className="flex justify-center py-12">
                          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {/* Documentos por solicitudes del candidato */}
                            <div className="space-y-4">
                              <h4 className="text-lg font-semibold text-gray-800 flex items-center">
                              <Folder className="w-5 h-5 text-blue-600 mr-2" />
                              Documentos por Solicitud (agrupado por Empresa y Cargo)
                              </h4>

                            {isLoadingSolicitudes ? (
                              <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                              </div>
                            ) : solicitudesCandidato.length === 0 ? (
                              <p className="text-sm text-gray-500">No hay solicitudes asociadas al candidato.</p>
                            ) : (
                              <Accordion type="multiple" className="w-full">
                                {(() => {
                                  const grupos: Record<string, any[]> = {};
                                  solicitudesCandidato.forEach((sol) => {
                                    const empresa = sol.empresas?.razon_social || 'Empresa no especificada';
                                    const cargoId = (sol.estructura_datos && (sol.estructura_datos.cargo || sol.estructura_datos?.datos?.cargo)) || sol.cargo;
                                    const cargo = cargoId && cargosMeta[Number(cargoId)] ? `${cargosMeta[Number(cargoId)].nombre} (#${cargoId})` : 'Cargo no especificado';
                                    const clave = `${empresa}__${cargo}`;
                                    if (!grupos[clave]) grupos[clave] = [];
                                    grupos[clave].push(sol);
                                  });

                                  return Object.entries(grupos).map(([clave, solicitudes], idx) => {
                                    const [empresa, cargo] = clave.split('__');
                                    return (
                                      <AccordionItem key={clave} value={`grupo-${idx}`} className="border border-gray-200 rounded-lg mb-2 data-[state=closed]:bg-gray-50 data-[state=open]:bg-white transition-colors duration-200">
                                        <AccordionTrigger className="px-4 py-3 hover:bg-gray-100 data-[state=closed]:bg-gray-50 data-[state=open]:bg-white transition-colors duration-200">
                                          <div className="flex items-center justify-between w-full">
                                            <div className="flex flex-col text-left">
                                              <span className="text-sm font-semibold text-gray-900">{empresa}</span>
                                              <div className="flex items-center space-x-2">
                                                <span className="text-xs text-gray-600">Cargo:</span>
                                                <span className="text-sm font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-md">
                                                  {cargo}
                                                </span>
                                              </div>
                                            </div>
                                            {(() => {
                                              const cargoIdTexto = (cargo.match(/#(\d+)/) || [])[1];
                                              const cargoIdNum = cargoIdTexto ? Number(cargoIdTexto) : undefined;
                                              if (!cargoIdNum) return null;
                                              
                                              const estado = calcularEstadoDocumentosCargo(cargoIdNum);
                                              return (
                                                <Badge 
                                                  variant="outline" 
                                                  className={`text-xs px-2 py-1 ${
                                                    estado.completado 
                                                      ? 'bg-green-50 text-green-700 border-green-200' 
                                                      : 'bg-amber-50 text-amber-700 border-amber-200'
                                                  }`}
                                                >
                                                  {estado.completado ? (
                                                    <>
                                                      <CheckCircle className="w-3 h-3 mr-1" />
                                                      <span>Completo</span>
                                                    </>
                                                  ) : (
                                                    <>
                                                      <Clock className="w-3 h-3 mr-1" />
                                                      <span>{estado.subidos}/{estado.total}</span>
                                                    </>
                                                  )}
                                                </Badge>
                                              );
                                            })()}
                                          </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="px-4 pb-4">
                                          <div className="space-y-4">
                                            {/* Lista de documentos requeridos por cargo */}
                                            {(() => {
                                              const cargoIdTexto = (cargo.match(/#(\d+)/) || [])[1];
                                              const cargoIdNum = cargoIdTexto ? Number(cargoIdTexto) : undefined;
                                              const documentosCargo = cargoIdNum ? cargosMeta[cargoIdNum]?.documentos || [] : [];
                                              
                                              if (documentosCargo.length === 0) {
                                                return (
                                                  <div className="text-center py-4 text-gray-500">
                                                    No hay documentos requeridos para este cargo
                                                  </div>
                                                );
                                              }

                                              return (
                                                <div className="space-y-4">
                                                  <div className="text-sm font-medium text-gray-700 mb-3">
                                                    Documentos requeridos para este cargo:
                                                  </div>
                                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {documentosCargo.map((dc: any, i: number) => {
                                                      const solicitud = solicitudes[0]; // Usar la primera solicitud del grupo
                                                      const key = `${solicitud.id}_${cargoIdNum}`;
                                                      const documentosExistentes = documentosPorSolicitud[key] || [];
                                                      const documentoExistente = documentosExistentes.find(
                                                        doc => doc.tipo_documento_id === dc.tipos_documentos.id
                                                      );
                                                      const progressKey = `${solicitud.id}_${cargoIdNum}_${dc.tipos_documentos.id}`;
                                                      const isUploading = uploadingDocuments[progressKey];
                                                      const uploadProgressValue = uploadProgress[progressKey] || 0;
                                  
                                  return (
                                                        <Card key={i} className={`border-2 transition-all duration-200 hover:shadow-md ${
                                                          documentoExistente 
                                                            ? 'border-green-200 bg-green-50' 
                                        : 'border-gray-200 bg-white hover:border-blue-300'
                                    }`}>
                                      <CardHeader className="pb-3 pt-4">
                                        <CardTitle className="flex items-center justify-between text-sm">
                                          <div className="flex items-center">
                                            <div className={`p-2 rounded-lg mr-3 ${
                                                                  documentoExistente ? 'bg-green-100' : 'bg-blue-100'
                                            }`}>
                                                                  <FileText className="w-4 h-4 text-blue-600" />
                                            </div>
                                            <div>
                                                <span className="font-semibold text-gray-800">
                                                                    {dc.tipos_documentos.nombre}
                                                </span>
                                                                  {dc.requerido && (
                                                                    <Badge variant="destructive" className="text-xs px-2 py-0.5 ml-2">
                                                                      Obligatorio
                                                                    </Badge>
                                                                  )}
                                              </div>
                                            </div>
                                                              {documentoExistente && (
                                                                <div className="flex items-center gap-1 text-green-600">
                                               <CheckCircle2 className="h-3 w-3" />
                                               <span className="text-xs font-medium">Subido</span>
                                             </div>
                                           )}
                                        </CardTitle>
                                      </CardHeader>
                                                                             <CardContent className="pt-0 pb-4">
                                         <div className="space-y-3">
                                           {/* Progress Bar for Upload */}
                                                              {uploadProgressValue > 0 && (
                                             <div className="space-y-2">
                                               <div className="flex items-center justify-between text-xs text-gray-600">
                                                 <span>Subiendo documento...</span>
                                                                    <span>{uploadProgressValue}%</span>
                                               </div>
                                               <Progress 
                                                                    value={uploadProgressValue} 
                                                 className="h-2 bg-gray-200"
                                               />
                                             </div>
                                           )}
                                           
                                           <div className="flex items-center gap-3">
                                                                {documentoExistente ? (
                                                                  <div className="flex items-center gap-2">
                                                   <Button
                                                     type="button"
                                                     variant="ghost"
                                                     size="sm"
                                                     onClick={() => handleViewDocument(documentoExistente)}
                                                     className="h-7 w-7 p-0 hover:bg-blue-50 rounded-full"
                                                     title="Ver documento"
                                                   >
                                                     <Eye className="h-4 w-4 text-blue-600" />
                                                   </Button>
                                                   <Button
                                                     type="button"
                                                     variant="ghost"
                                                     size="sm"
                                                     onClick={() => setDocumentoACambiar({id: documentoExistente.id, progressKey})}
                                                     className="h-7 w-7 p-0 hover:bg-gray-50 rounded-full"
                                                     title="Cambiar documento"
                                                   >
                                                     <Upload className="h-4 w-4 text-gray-600" />
                                                   </Button>
                                               </div>
                                             ) : (
                                               <Button
                                                 type="button"
                                                 variant="outline"
                                                 size="sm"
                                                                    onClick={() => document.getElementById(`file-${progressKey}`)?.click()}
                                                 className="h-7 px-3 text-xs font-medium"
                                                                    disabled={isUploading}
                                               >
                                                                    {isUploading ? (
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
                                                              id={`file-${progressKey}`}
                                           onChange={(e) => {
                                                                handleFileChangeSolicitud(
                                                                  e, 
                                                                  solicitud.id, 
                                                                  cargoIdNum!, 
                                                                  dc.tipos_documentos.id, 
                                                                  dc.tipos_documentos.nombre
                                                                );
                                           }}
                                           onClick={(e) => (e.target as HTMLInputElement).value = ''}
                                                                                  />
                                                            {documentoExistente && (
                                           <div className="text-xs mt-2 p-2 bg-gray-50 rounded">
                                             <div className="text-gray-700 mb-1">
                                                                  <span className="font-medium">Archivo:</span> {documentoExistente.nombre_archivo}
                                             </div>
                                                                <div className="text-green-600">
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
                                              );
                                            })()}

                                          </div>
                                        </AccordionContent>
                                      </AccordionItem>
                                    );
                                  });
                                })()}
                              </Accordion>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>

              </form>
            </Form>
        </div>
      </div>

      {/* Modal para visualizar documento */}
      {modalDocumento.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-11/12 h-5/6 max-w-6xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {modalDocumento.documento?.nombre_archivo}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseModal}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 p-4">
              <iframe
                src={`data:application/pdf;base64,${modalDocumento.documento?.url_archivo}`}
                className="w-full h-full border-0 rounded"
                title={modalDocumento.documento?.nombre_archivo}
              />
            </div>
          </div>
        </div>
      )}


      {/* Input oculto para cambiar documento */}
      {documentoACambiar && (
        <input
          type="file"
          id={`change-file-${documentoACambiar.progressKey}`}
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              handleChangeDocument(file, documentoACambiar.id, documentoACambiar.progressKey);
            }
            e.target.value = ''; // Limpiar el input
          }}
        />
      )}
    </div>
  );
}
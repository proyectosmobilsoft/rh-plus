import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, UserCheck, Building2, FileText, MapPin, ArrowUpDown, User, X } from 'lucide-react';
import { toast } from "sonner";
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MultiSelect } from '@/components/ui/multi-select';
import { analystsService } from '@/services/analystsService';
import { empresasService } from '@/services/empresasService';
import { asociacionPrioridadService } from '@/services/asociacionPrioridadService';
import { sucursalesService } from '@/services/sucursalesService';

// Schema de validación simplificado para prioridades
const analistaSchema = z.object({
  username: z.string().optional(),
  email: z.string().optional(),
  password: z.string().optional(),
  primer_nombre: z.string().optional(),
  segundo_nombre: z.string().optional(),
  primer_apellido: z.string().optional(),
  segundo_apellido: z.string().optional(),
  activo: z.boolean().optional(),
  // Campos para prioridades - todos opcionales
  prioridad_1: z.enum(['cliente', 'solicitudes', 'sucursal']).optional(),
  prioridad_2: z.enum(['cliente', 'solicitudes', 'sucursal']).optional(),
  prioridad_3: z.enum(['cliente', 'solicitudes', 'sucursal']).optional(),
  // Campos dinámicos para valores de prioridad
  empresa_1: z.array(z.number()).optional(),
  empresa_2: z.array(z.number()).optional(),
  empresa_3: z.array(z.number()).optional(),
  solicitudes_1: z.number().optional(),
  solicitudes_2: z.number().optional(),
  solicitudes_3: z.number().optional(),
  sucursal_1: z.array(z.number()).optional(),
  sucursal_2: z.array(z.number()).optional(),
  sucursal_3: z.array(z.number()).optional(),
});

type AnalistaFormData = z.infer<typeof analistaSchema>;

interface AnalistaFormProps {
  analistaSeleccionado?: any;
  onSuccess?: () => void;
}

type PrioridadOption = {
  value: 'cliente' | 'solicitudes' | 'sucursal';
  label: string;
  icon: any;
  description: string;
};

const PRIORIDADES_OPTIONS: PrioridadOption[] = [
  { value: 'cliente', label: 'Cliente', icon: Building2, description: 'Priorizar por cliente' },
  { value: 'solicitudes', label: 'Cantidad de Solicitudes', icon: FileText, description: 'Priorizar por volumen de trabajo' },
  { value: 'sucursal', label: 'Sucursal', icon: MapPin, description: 'Priorizar por ubicación' }
];

// Las sucursales se cargan desde la base de datos

export function AnalistaForm({ analistaSeleccionado, onSuccess }: AnalistaFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analistaActualizado, setAnalistaActualizado] = useState<any>(analistaSeleccionado);
  const queryClient = useQueryClient();

  // Cargar sucursales desde la base de datos
  const { data: sucursales = [], isLoading: loadingSucursales } = useQuery({
    queryKey: ['sucursales'],
    queryFn: async () => {
      try {
        const data = await sucursalesService.getAll();
        return data;
      } catch (error) {
        console.error('Error cargando sucursales:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
  
  // Cargar clientes desde la base de datos
  const { data: empresas = [], isLoading: empresasLoading, error: empresasError } = useQuery({
    queryKey: ['empresas'],
    queryFn: async () => {
      try {
        const data = await empresasService.getAll();
        return data || [];
      } catch (error) {
        console.error('Error cargando clientes:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
  
  // Actualizar analistaActualizado cuando cambie analistaSeleccionado
  useEffect(() => {
    setAnalistaActualizado(analistaSeleccionado);
  }, [analistaSeleccionado]);
  
  const form = useForm<AnalistaFormData>({
    resolver: zodResolver(analistaSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      primer_nombre: '',
      segundo_nombre: '',
      primer_apellido: '',
      segundo_apellido: '',
      activo: true,
      prioridad_1: undefined,
      prioridad_2: undefined,
      prioridad_3: undefined,
      empresa_1: [],
      empresa_2: [],
      empresa_3: [],
      solicitudes_1: undefined,
      solicitudes_2: undefined,
      solicitudes_3: undefined,
      sucursal_1: [],
      sucursal_2: [],
      sucursal_3: [],
    }
  });

  // Cargar datos del analista seleccionado
  useEffect(() => {
    if (analistaSeleccionado) {
      // Cargar las prioridades existentes del analista desde la base de datos
      const cargarPrioridadesAnalista = async () => {
        try {
          const prioridades = await asociacionPrioridadService.getPrioridadesByUsuarioId(analistaSeleccionado.usuario_id);
          
          // Extraer nombre y apellido del usuario_nombre
          const nombreCompleto = analistaSeleccionado.usuario_nombre || '';
          const partesNombre = nombreCompleto.split(' ');
          const primerNombre = partesNombre[0] || '';
          const primerApellido = partesNombre[1] || '';
          
          // Preparar los valores del formulario
          const formValues = {
            username: analistaSeleccionado.usuario_nombre || '',
            email: analistaSeleccionado.usuario_email || '',
            password: '', // No cargar contraseña por seguridad
            primer_nombre: primerNombre,
            segundo_nombre: '',
            primer_apellido: primerApellido,
            segundo_apellido: '',
            activo: true,
            // Inicializar prioridades como undefined
            prioridad_1: undefined,
            prioridad_2: undefined,
            prioridad_3: undefined,
            empresa_1: [],
            empresa_2: [],
            empresa_3: [],
            solicitudes_1: undefined,
            solicitudes_2: undefined,
            solicitudes_3: undefined,
            sucursal_1: [],
            sucursal_2: [],
            sucursal_3: [],
          };
          
                                                       // Procesar las prioridades cargadas (ahora solo un registro)
                  if (prioridades && prioridades.length > 0) {
                    const prioridad = prioridades[0]; // Solo el primer registro
                    
                                         // Procesar prioridad 1
                     if (prioridad.nivel_prioridad_1) {
                       (formValues as any).prioridad_1 = prioridad.nivel_prioridad_1;
                       if (prioridad.nivel_prioridad_1 === 'cliente' && prioridad.empresa_ids && prioridad.empresa_ids.length > 0) {
                         (formValues as any).empresa_1 = prioridad.empresa_ids;
                       } else if (prioridad.nivel_prioridad_1 === 'cliente' && prioridad.empresa_id && prioridad.empresa_id > 0) {
                         (formValues as any).empresa_1 = [prioridad.empresa_id];
                       } else if (prioridad.nivel_prioridad_1 === 'solicitudes' && prioridad.cantidad_solicitudes !== undefined && prioridad.cantidad_solicitudes !== null && prioridad.cantidad_solicitudes > 0) {
                         (formValues as any).solicitudes_1 = prioridad.cantidad_solicitudes;
                       } else if (prioridad.nivel_prioridad_1 === 'sucursal' && prioridad.sucursal_ids && prioridad.sucursal_ids.length > 0) {
                         (formValues as any).sucursal_1 = prioridad.sucursal_ids;
                       } else if (prioridad.nivel_prioridad_1 === 'sucursal' && prioridad.sucursal_id && prioridad.sucursal_id > 0) {
                         (formValues as any).sucursal_1 = [prioridad.sucursal_id];
                       }
                     }
                     
                     // Procesar prioridad 2
                     if (prioridad.nivel_prioridad_2) {
                       (formValues as any).prioridad_2 = prioridad.nivel_prioridad_2;
                       if (prioridad.nivel_prioridad_2 === 'cliente' && prioridad.empresa_ids && prioridad.empresa_ids.length > 0) {
                         (formValues as any).empresa_2 = prioridad.empresa_ids;
                       } else if (prioridad.nivel_prioridad_2 === 'cliente' && prioridad.empresa_id && prioridad.empresa_id > 0) {
                         (formValues as any).empresa_2 = [prioridad.empresa_id];
                       } else if (prioridad.nivel_prioridad_2 === 'solicitudes' && prioridad.cantidad_solicitudes !== undefined && prioridad.cantidad_solicitudes !== null && prioridad.cantidad_solicitudes > 0) {
                         (formValues as any).solicitudes_2 = prioridad.cantidad_solicitudes;
                       } else if (prioridad.nivel_prioridad_2 === 'sucursal' && prioridad.sucursal_ids && prioridad.sucursal_ids.length > 0) {
                         (formValues as any).sucursal_2 = prioridad.sucursal_ids;
                       } else if (prioridad.nivel_prioridad_2 === 'sucursal' && prioridad.sucursal_id && prioridad.sucursal_id > 0) {
                         (formValues as any).sucursal_2 = [prioridad.sucursal_id];
                       }
                     }
                     
                     // Procesar prioridad 3
                     if (prioridad.nivel_prioridad_3) {
                       (formValues as any).prioridad_3 = prioridad.nivel_prioridad_3;
                       if (prioridad.nivel_prioridad_3 === 'cliente' && prioridad.empresa_ids && prioridad.empresa_ids.length > 0) {
                         (formValues as any).empresa_3 = prioridad.empresa_ids;
                       } else if (prioridad.nivel_prioridad_3 === 'cliente' && prioridad.empresa_id && prioridad.empresa_id > 0) {
                         (formValues as any).empresa_3 = [prioridad.empresa_id];
                       } else if (prioridad.nivel_prioridad_3 === 'solicitudes' && prioridad.cantidad_solicitudes !== undefined && prioridad.cantidad_solicitudes !== null && prioridad.cantidad_solicitudes > 0) {
                         (formValues as any).solicitudes_3 = prioridad.cantidad_solicitudes;
                       } else if (prioridad.nivel_prioridad_3 === 'sucursal' && prioridad.sucursal_ids && prioridad.sucursal_ids.length > 0) {
                         (formValues as any).sucursal_3 = prioridad.sucursal_ids;
                       } else if (prioridad.nivel_prioridad_3 === 'sucursal' && prioridad.sucursal_id && prioridad.sucursal_id > 0) {
                         (formValues as any).sucursal_3 = [prioridad.sucursal_id];
                       }
                     }
                  }
          
          form.reset(formValues);
          
        } catch (error) {
          console.error('Error cargando prioridades del analista:', error);
          // Si hay error, cargar solo los datos básicos
          const nombreCompleto = analistaSeleccionado.usuario_nombre || '';
          const partesNombre = nombreCompleto.split(' ');
          const primerNombre = partesNombre[0] || '';
          const primerApellido = partesNombre[1] || '';
          
          form.reset({
            username: analistaSeleccionado.usuario_nombre || '',
            email: analistaSeleccionado.usuario_email || '',
            password: '',
            primer_nombre: primerNombre,
            segundo_nombre: '',
            primer_apellido: primerApellido,
            segundo_apellido: '',
            activo: true,
            prioridad_1: undefined,
            prioridad_2: undefined,
            prioridad_3: undefined,
            empresa_1: [],
            empresa_2: [],
            empresa_3: [],
            solicitudes_1: undefined,
            solicitudes_2: undefined,
            solicitudes_3: undefined,
            sucursal_1: [],
            sucursal_2: [],
            sucursal_3: [],
          });
        }
      };
      
      cargarPrioridadesAnalista();
    }
  }, [analistaSeleccionado, form]);

  const onSubmit = async (data: AnalistaFormData) => {
    try {
      setIsSubmitting(true);
      
      if (analistaSeleccionado) {
        // Actualizar analista existente
        // Guardar las prioridades en la nueva tabla
        await guardarPrioridadesAnalista(analistaSeleccionado.usuario_id, data);
        
        toast.success('Prioridades del analista actualizadas exitosamente');
      } else {
        // Crear nuevo analista
        const payload = {
          username: data.username || '',
          email: data.email || '',
          password: data.password || '',
          primer_nombre: data.primer_nombre || '',
          segundo_nombre: data.segundo_nombre || '',
          primer_apellido: data.primer_apellido || '',
          segundo_apellido: data.segundo_apellido || '',
          activo: data.activo || true,
        };
        
        const nuevoAnalista = await analystsService.create(payload);
        
        if (nuevoAnalista && nuevoAnalista.id) {
          // Guardar las prioridades en la nueva tabla
          await guardarPrioridadesAnalista(nuevoAnalista.id, data);
        }
        
        toast.success('Analista creado exitosamente');
      }
      
      // Invalidar la consulta del listado de analistas para refrescar los datos
      await queryClient.invalidateQueries({ queryKey: ['analistas-prioridades'] });
      
      form.reset();
      onSuccess?.();
      
    } catch (error) {
      console.error('=== ERROR en onSubmit ===');
      console.error('Error guardando analista:', error);
      toast.error('Error al guardar analista');
    } finally {
      setIsSubmitting(false);
    }
  };

     // Función para guardar las prioridades del analista
   const guardarPrioridadesAnalista = async (usuarioId: number, data: AnalistaFormData) => {
     try {
       // Primero eliminar todas las prioridades existentes del analista
       await asociacionPrioridadService.deleteByUsuarioId(usuarioId);
       
       // Crear un solo registro con todas las prioridades
       const prioridadData: any = {
         usuario_id: usuarioId,
         empresa_ids: [] as number[],
         sucursal_ids: [] as number[],
         nivel_prioridad_1: null,
         nivel_prioridad_2: null,
         nivel_prioridad_3: null,
         cantidad_solicitudes: 0,
       };
       
       // Recopilar todos los IDs de empresas y sucursales de todas las prioridades
       const empresaIdsSeleccionadas: number[] = [];
       const sucursalIdsSeleccionadas: number[] = [];
       
        // Procesar prioridad 1
        if (data.prioridad_1) {
          prioridadData.nivel_prioridad_1 = data.prioridad_1;
          if (data.prioridad_1 === 'cliente' && data.empresa_1 && Array.isArray(data.empresa_1)) {
            data.empresa_1.forEach(empId => {
              if (!empresaIdsSeleccionadas.includes(empId)) {
                empresaIdsSeleccionadas.push(empId);
              }
            });
          } else if (data.prioridad_1 === 'sucursal' && data.sucursal_1 && Array.isArray(data.sucursal_1)) {
            data.sucursal_1.forEach(sucId => {
              if (!sucursalIdsSeleccionadas.includes(sucId)) {
                sucursalIdsSeleccionadas.push(sucId);
              }
            });
          } else if (data.prioridad_1 === 'solicitudes' && data.solicitudes_1) {
            prioridadData.cantidad_solicitudes = data.solicitudes_1;
          }
        }
        
        // Procesar prioridad 2
        if (data.prioridad_2) {
          prioridadData.nivel_prioridad_2 = data.prioridad_2;
          if (data.prioridad_2 === 'cliente' && data.empresa_2 && Array.isArray(data.empresa_2)) {
            data.empresa_2.forEach(empId => {
              if (!empresaIdsSeleccionadas.includes(empId)) {
                empresaIdsSeleccionadas.push(empId);
              }
            });
          } else if (data.prioridad_2 === 'sucursal' && data.sucursal_2 && Array.isArray(data.sucursal_2)) {
            data.sucursal_2.forEach(sucId => {
              if (!sucursalIdsSeleccionadas.includes(sucId)) {
                sucursalIdsSeleccionadas.push(sucId);
              }
            });
          } else if (data.prioridad_2 === 'solicitudes' && data.solicitudes_2) {
            // Sumar las solicitudes si ya hay un valor
            prioridadData.cantidad_solicitudes += data.solicitudes_2;
          }
        }
        
        // Procesar prioridad 3
        if (data.prioridad_3) {
          prioridadData.nivel_prioridad_3 = data.prioridad_3;
          if (data.prioridad_3 === 'cliente' && data.empresa_3 && Array.isArray(data.empresa_3)) {
            data.empresa_3.forEach(empId => {
              if (!empresaIdsSeleccionadas.includes(empId)) {
                empresaIdsSeleccionadas.push(empId);
              }
            });
          } else if (data.prioridad_3 === 'sucursal' && data.sucursal_3 && Array.isArray(data.sucursal_3)) {
            data.sucursal_3.forEach(sucId => {
              if (!sucursalIdsSeleccionadas.includes(sucId)) {
                sucursalIdsSeleccionadas.push(sucId);
              }
            });
          } else if (data.prioridad_3 === 'solicitudes' && data.solicitudes_3) {
            // Sumar las solicitudes si ya hay un valor
            prioridadData.cantidad_solicitudes += data.solicitudes_3;
          }
        }
       
       // Asignar los arrays de IDs
       prioridadData.empresa_ids = empresaIdsSeleccionadas;
       prioridadData.sucursal_ids = sucursalIdsSeleccionadas;
       
       // Eliminar prioridades existentes del analista (el upsert lo hace automáticamente)
       await asociacionPrioridadService.deleteByUsuarioId(usuarioId);
       
       // Guardar el registro único
       await asociacionPrioridadService.upsert(prioridadData);
     } catch (error) {
       console.error('=== ERROR en guardarPrioridadesAnalista ===');
       console.error('Error guardando prioridades:', error);
       throw error;
     }
   };

     

  const getPrioridadLabel = (value: string) => {
    return PRIORIDADES_OPTIONS.find(option => option.value === value)?.label || value;
  };

  // Obtener las prioridades seleccionadas para filtrar opciones
  const prioridad1 = form.watch('prioridad_1');
  const prioridad2 = form.watch('prioridad_2');
  const prioridad3 = form.watch('prioridad_3');

  // Escuchar cambios en el formulario y actualizar el estado del analista
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (name && type === 'change') {
        actualizarEstadoAnalista(value as AnalistaFormData);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form.watch]);

  // Filtrar opciones disponibles para cada prioridad de forma dinámica
  const getOpcionesDisponibles = (nivelPrioridad: 1 | 2 | 3) => {
    const prioridadesSeleccionadas = [prioridad1, prioridad2, prioridad3].filter(Boolean) as Array<'cliente' | 'solicitudes' | 'sucursal'>;
    
    // Obtener la prioridad actual del nivel que se está configurando
    const prioridadActual = nivelPrioridad === 1 ? prioridad1 : nivelPrioridad === 2 ? prioridad2 : prioridad3;
    
    return PRIORIDADES_OPTIONS.filter(option => {
      // Si esta opción ya está seleccionada en este nivel, mantenerla disponible
      if (option.value === prioridadActual) {
        return true;
      }
      
      // Si esta opción está seleccionada en otro nivel, no mostrarla
      return !prioridadesSeleccionadas.includes(option.value);
    });
  };

  // Función para obtener opciones disponibles para el primer nivel (todas las opciones)
  const getOpcionesDisponiblesNivel1 = () => {
    const prioridadesSeleccionadas = [prioridad2, prioridad3].filter(Boolean) as Array<'cliente' | 'solicitudes' | 'sucursal'>;
    
    return PRIORIDADES_OPTIONS.filter(option => {
      // Si esta opción ya está seleccionada en este nivel, mantenerla disponible
      if (option.value === prioridad1) {
        return true;
      }
      
      // Si esta opción está seleccionada en otro nivel, no mostrarla
      return !prioridadesSeleccionadas.includes(option.value);
    });
  };

  // Función para actualizar el estado del analista con los datos del formulario
  const actualizarEstadoAnalista = (data: AnalistaFormData) => {
    // Obtener datos de cliente si hay uno seleccionado
    let empresaSeleccionada = null;
    const empresaIds = (data.empresa_1 || data.empresa_2 || data.empresa_3) as string[] | undefined;
    const primeraEmpresaId = empresaIds && empresaIds.length > 0 ? empresaIds[0] : undefined;
    
    if (primeraEmpresaId && empresas.length > 0) {
      empresaSeleccionada = empresas.find((emp: any) => emp.id.toString() === primeraEmpresaId);
    }
    
    // Obtener datos de sucursal si hay una seleccionada
    let sucursalSeleccionada = null;
    const sucursalIds = (data.sucursal_1 || data.sucursal_2 || data.sucursal_3) as string[] | undefined;
    const primeraSucursalId = sucursalIds && sucursalIds.length > 0 ? sucursalIds[0] : undefined;
    
    if (primeraSucursalId) {
      sucursalSeleccionada = sucursales.find((suc: any) => suc.id.toString() === primeraSucursalId);
    }
    
    const analistaActualizado = {
      ...analistaSeleccionado,
      nivel_prioridad_1: !!data.prioridad_1,
      nivel_prioridad_2: !!data.prioridad_2,
      nivel_prioridad_3: !!data.prioridad_3,
      cantidad_solicitudes: data.solicitudes_1 || data.solicitudes_2 || data.solicitudes_3 || 0,
      empresa_id: primeraEmpresaId ? parseInt(primeraEmpresaId) : undefined,
      empresa_nombre: empresaSeleccionada ? empresaSeleccionada.razon_social || empresaSeleccionada.nombre : '',
      empresa_nit: empresaSeleccionada ? empresaSeleccionada.nit || '' : '',
      empresa_direccion: sucursalSeleccionada ? sucursalSeleccionada.nombre : '',
    };
    
    setAnalistaActualizado(analistaActualizado);
  };

     // Función para limpiar campos cuando cambia una prioridad
   const limpiarCamposDePrioridad = (nivel: 1 | 2 | 3, nuevaPrioridad: string) => {
     // Limpiar campos específicos según el tipo
     form.setValue(`empresa_${nivel}` as any, []);
     form.setValue(`solicitudes_${nivel}` as any, undefined);
     form.setValue(`sucursal_${nivel}` as any, []);

     // Si la nueva prioridad es diferente, limpiar también los otros niveles
     if (nivel === 1 && prioridad1 && prioridad1 !== nuevaPrioridad) {
       form.setValue('empresa_1', []);
       form.setValue('solicitudes_1', undefined);
       form.setValue('sucursal_1', []);
     } else if (nivel === 2 && prioridad2 && prioridad2 !== nuevaPrioridad) {
       form.setValue('empresa_2', []);
       form.setValue('solicitudes_2', undefined);
       form.setValue('sucursal_2', []);
     } else if (nivel === 3 && prioridad3 && prioridad3 !== nuevaPrioridad) {
       form.setValue('empresa_3', []);
       form.setValue('solicitudes_3', undefined);
       form.setValue('sucursal_3', []);
     }
   };

     // Función para quitar una prioridad de un nivel específico
   const quitarPrioridad = (nivel: 1 | 2 | 3) => {
     const campoPrioridad = `prioridad_${nivel}` as 'prioridad_1' | 'prioridad_2' | 'prioridad_3';
     const campoEmpresa = `empresa_${nivel}` as 'empresa_1' | 'empresa_2' | 'empresa_3';
     const campoSolicitudes = `solicitudes_${nivel}` as 'solicitudes_1' | 'solicitudes_2' | 'solicitudes_3';
     const campoSucursal = `sucursal_${nivel}` as 'sucursal_1' | 'sucursal_2' | 'sucursal_3';

     // Limpiar la prioridad y sus campos relacionados
     form.setValue(campoEmpresa, []);
     form.setValue(campoSolicitudes, undefined);
     form.setValue(campoSucursal, []);
     
     // Limpiar el campo de prioridad usando un enfoque que funcione con el select
     if (nivel === 1) {
       form.setValue('prioridad_1', undefined);
     } else if (nivel === 2) {
       form.setValue('prioridad_2', undefined);
     } else if (nivel === 3) {
       form.setValue('prioridad_3', undefined);
     }
   };

  return (
    <div className="max-w-7xl mx-auto space-y-4 px-4">
             {/* Información Básica del Analista - Compacta */}
       {analistaActualizado && (
         <Card>
           <CardHeader className="bg-blue-50 py-3">
             <CardTitle className="flex items-center gap-2 text-blue-800 text-sm">
               <User className="w-4 h-4" />
               Información del Analista
             </CardTitle>
           </CardHeader>
           <CardContent className="pt-3">
             <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
               <div>
                 <span className="font-medium text-gray-600">Usuario:</span>
                 <p className="text-gray-900">{analistaActualizado.usuario_nombre || 'N/A'}</p>
               </div>
               <div>
                 <span className="font-medium text-gray-600">Email:</span>
                 <p className="text-gray-900">{analistaActualizado.usuario_email || 'N/A'}</p>
               </div>
               <div>
                 <span className="font-medium text-gray-600">Nombre:</span>
                 <p className="text-gray-900">
                   {analistaActualizado.usuario_nombre || 'N/A'}
                 </p>
               </div>
               <div>
                 <span className="font-medium text-gray-600">Estado:</span>
                 <Badge 
                   variant="outline" 
                   className="bg-green-50 text-green-700 border-green-200"
                 >
                   Activo
                 </Badge>
               </div>
             </div>
             
             
           </CardContent>
         </Card>
       )}

      {/* Sistema de Prioridades */}
      <Card className="border-2">
        <CardHeader className="bg-green-50 py-5 border-b-2">
          <CardTitle className="flex items-center gap-2 text-green-800 text-xl">
            <ArrowUpDown className="w-6 h-6" />
            Configuración de Prioridades
          </CardTitle>
          <CardDescription className="text-base">
            Configure el orden de prioridades para la asignación de solicitudes
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 pb-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              {/* Selectores de Prioridades en Grilla */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Prioridad 1 */}
                <div className="space-y-5">
                  <FormField
                    control={form.control}
                    name="prioridad_1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Badge variant="default" className="bg-red-100 text-red-800">1</Badge>
                          Primera Prioridad *
                        </FormLabel>
                        <div className="flex gap-2">
                          <Select 
                            onValueChange={(value) => {
                              field.onChange(value);
                              limpiarCamposDePrioridad(1, value);
                            }} 
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {getOpcionesDisponiblesNivel1().map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  <div className="flex items-center gap-2">
                                    <option.icon className="w-4 h-4" />
                                    {option.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {field.value && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => quitarPrioridad(1)}
                                    className="px-2 border-red-200 hover:bg-red-50"
                                  >
                                    <X className="w-4 h-4 text-red-500" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Quitar prioridad de este nivel</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Campos Dinámicos para Prioridad 1 */}
                  {prioridad1 && (
                    <div className="border-2 rounded-lg p-5 bg-red-50 shadow-sm">
                      <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <Badge variant="default" className="bg-red-100 text-red-800">1</Badge>
                        Configuración de {prioridad1 === 'solicitudes' ? 'Solicitudes' : getPrioridadLabel(prioridad1)}
                      </h4>
                      
                      {prioridad1 === 'cliente' && (
                        <FormField
                          control={form.control}
                          name="empresa_1"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-normal text-left mb-2">Seleccionar Cliente(s) *</FormLabel>
                              <FormControl>
                                <MultiSelect
                                  options={empresas.map(emp => ({
                                    id: emp.id,
                                    value: emp.id.toString(),
                                    label: emp.razon_social || emp.nombre || '',
                                    description: emp.nit || ''
                                  }))}
                                  selected={field.value as number[] || []}
                                  onSelectionChange={field.onChange}
                                  placeholder={empresasLoading ? "Cargando..." : "Seleccione cliente(s)"}
                                  emptyText="No hay clientes disponibles"
                                  isLoading={empresasLoading}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {prioridad1 === 'solicitudes' && (
                        <FormField
                          control={form.control}
                          name="solicitudes_1"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-normal text-left mb-2">Cantidad de Solicitudes *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="Ej: 10" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {prioridad1 === 'sucursal' && (
                        <FormField
                          control={form.control}
                          name="sucursal_1"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-normal text-left mb-2">Seleccionar Sucursal(es) *</FormLabel>
                              <FormControl>
                                <MultiSelect
                                  options={sucursales.map(suc => ({
                                    id: suc.id,
                                    value: suc.id.toString(),
                                    label: suc.nombre || '',
                                    description: suc.codigo || ''
                                  }))}
                                  selected={field.value as number[] || []}
                                  onSelectionChange={field.onChange}
                                  placeholder={loadingSucursales ? "Cargando..." : "Seleccione sucursal(es)"}
                                  emptyText="No hay sucursales disponibles"
                                  isLoading={loadingSucursales}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Prioridad 2 */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="prioridad_2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Badge variant="default" className="bg-yellow-100 text-yellow-800">2</Badge>
                          Segunda Prioridad *
                        </FormLabel>
                        <div className="flex gap-2">
                          <Select 
                            onValueChange={(value) => {
                              field.onChange(value);
                              limpiarCamposDePrioridad(2, value);
                            }} 
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {getOpcionesDisponibles(2).map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  <div className="flex items-center gap-2">
                                    <option.icon className="w-4 h-4" />
                                    {option.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {field.value && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => quitarPrioridad(2)}
                                    className="px-2 border-red-200 hover:bg-red-50"
                                  >
                                    <X className="w-4 h-4 text-red-500" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Quitar prioridad de este nivel</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Campos Dinámicos para Prioridad 2 */}
                  {prioridad2 && (
                    <div className="border-2 rounded-lg p-5 bg-yellow-50 shadow-sm">
                      <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <Badge variant="default" className="bg-yellow-100 text-yellow-800">2</Badge>
                        Configuración de {prioridad2 === 'solicitudes' ? 'Solicitudes' : getPrioridadLabel(prioridad2)}
                      </h4>
                      
                      {prioridad2 === 'cliente' && (
                        <FormField
                          control={form.control}
                          name="empresa_2"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-normal text-left mb-2">Seleccionar Cliente(s) *</FormLabel>
                              <FormControl>
                                <MultiSelect
                                  options={empresas.map(emp => ({
                                    id: emp.id,
                                    value: emp.id.toString(),
                                    label: emp.razon_social || emp.nombre || '',
                                    description: emp.nit || ''
                                  }))}
                                  selected={field.value as number[] || []}
                                  onSelectionChange={field.onChange}
                                  placeholder={empresasLoading ? "Cargando..." : "Seleccione cliente(s)"}
                                  emptyText="No hay clientes disponibles"
                                  isLoading={empresasLoading}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {prioridad2 === 'solicitudes' && (
                        <FormField
                          control={form.control}
                          name="solicitudes_2"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-normal text-left mb-2">Cantidad de Solicitudes *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="Ej: 10" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {prioridad2 === 'sucursal' && (
                        <FormField
                          control={form.control}
                          name="sucursal_2"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-normal text-left mb-2">Seleccionar Sucursal(es) *</FormLabel>
                              <FormControl>
                                <MultiSelect
                                  options={sucursales.map(suc => ({
                                    id: suc.id,
                                    value: suc.id.toString(),
                                    label: suc.nombre || '',
                                    description: suc.codigo || ''
                                  }))}
                                  selected={field.value as number[] || []}
                                  onSelectionChange={field.onChange}
                                  placeholder={loadingSucursales ? "Cargando..." : "Seleccione sucursal(es)"}
                                  emptyText="No hay sucursales disponibles"
                                  isLoading={loadingSucursales}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Prioridad 3 */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="prioridad_3"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Badge variant="default" className="bg-green-100 text-green-800">3</Badge>
                          Tercera Prioridad *
                        </FormLabel>
                        <div className="flex gap-2">
                          <Select 
                            onValueChange={(value) => {
                              field.onChange(value);
                              limpiarCamposDePrioridad(3, value);
                            }} 
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {getOpcionesDisponibles(3).map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  <div className="flex items-center gap-2">
                                    <option.icon className="w-4 h-4" />
                                    {option.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {field.value && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => quitarPrioridad(3)}
                                    className="px-2 border-red-200 hover:bg-red-50"
                                  >
                                    <X className="w-4 h-4 text-red-500" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Quitar prioridad de este nivel</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Campos Dinámicos para Prioridad 3 */}
                  {prioridad3 && (
                    <div className="border-2 rounded-lg p-5 bg-green-50 shadow-sm">
                      <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <Badge variant="default" className="bg-green-100 text-green-800">3</Badge>
                        Configuración de {prioridad3 === 'solicitudes' ? 'Solicitudes' : getPrioridadLabel(prioridad3)}
                      </h4>
                      
                      {prioridad3 === 'cliente' && (
                        <FormField
                          control={form.control}
                          name="empresa_3"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-normal text-left mb-2">Seleccionar Cliente(s) *</FormLabel>
                              <FormControl>
                                <MultiSelect
                                  options={empresas.map(emp => ({
                                    id: emp.id,
                                    value: emp.id.toString(),
                                    label: emp.razon_social || emp.nombre || '',
                                    description: emp.nit || ''
                                  }))}
                                  selected={field.value as number[] || []}
                                  onSelectionChange={field.onChange}
                                  placeholder={empresasLoading ? "Cargando..." : "Seleccione cliente(s)"}
                                  emptyText="No hay clientes disponibles"
                                  isLoading={empresasLoading}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {prioridad3 === 'solicitudes' && (
                        <FormField
                          control={form.control}
                          name="solicitudes_3"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-normal text-left mb-2">Cantidad de Solicitudes *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="Ej: 10" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {prioridad3 === 'sucursal' && (
                        <FormField
                          control={form.control}
                          name="sucursal_3"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-normal text-left mb-2">Seleccionar Sucursal(es) *</FormLabel>
                              <FormControl>
                                <MultiSelect
                                  options={sucursales.map(suc => ({
                                    id: suc.id,
                                    value: suc.id.toString(),
                                    label: suc.nombre || '',
                                    description: suc.codigo || ''
                                  }))}
                                  selected={field.value as number[] || []}
                                  onSelectionChange={field.onChange}
                                  placeholder={loadingSucursales ? "Cargando..." : "Seleccione sucursal(es)"}
                                  emptyText="No hay sucursales disponibles"
                                  isLoading={loadingSucursales}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => form.reset()}
                  disabled={isSubmitting}
                >
                  Limpiar Formulario
                </Button>
                <Button 
                  type="button"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700"
                                     onClick={async () => {
                     // Verificar si el formulario es válido
                     const isValid = await form.trigger();
                     
                     if (isValid) {
                       await onSubmit(form.getValues());
                     } else {
                       // Corregir campos de solicitudes que están como strings vacíos
                       const formData = form.getValues();
                       const formDataCorregido = { ...formData };
                       
                       // Convertir strings vacíos de solicitudes a undefined
                       ['solicitudes_1', 'solicitudes_2', 'solicitudes_3'].forEach(field => {
                         if (formDataCorregido[field as keyof typeof formDataCorregido] === '') {
                           (formDataCorregido as any)[field] = undefined;
                         }
                       });
                       
                       // Verificar si el formulario es válido después de la corrección
                       const isValidAfterCorrection = await form.trigger();
                       
                       if (isValidAfterCorrection) {
                         await onSubmit(formDataCorregido);
                       } else {
                         // Permitir guardar incluso si no hay prioridades configuradas
                         const tieneAlgunaPrioridad = formDataCorregido.prioridad_1 || formDataCorregido.prioridad_2 || formDataCorregido.prioridad_3;
                         
                         if (!tieneAlgunaPrioridad) {
                           await onSubmit(formDataCorregido);
                         }
                       }
                     }
                   }}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Guardar Datos
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}


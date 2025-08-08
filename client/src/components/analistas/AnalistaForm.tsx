import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, UserCheck, Building2, FileText, MapPin, ArrowUpDown, User, X } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

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
import { analystsService } from '@/services/analystsService';
import { empresasService } from '@/services/empresasService';
import { asociacionPrioridadService } from '@/services/asociacionPrioridadService';

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
  // Campos para prioridades
  prioridad_1: z.enum(['empresa', 'solicitudes', 'sucursal']).optional(),
  prioridad_2: z.enum(['empresa', 'solicitudes', 'sucursal']).optional(),
  prioridad_3: z.enum(['empresa', 'solicitudes', 'sucursal']).optional(),
  // Campos dinámicos para valores de prioridad
  empresa_1: z.string().optional(),
  empresa_2: z.string().optional(),
  empresa_3: z.string().optional(),
  solicitudes_1: z.number().optional(),
  solicitudes_2: z.number().optional(),
  solicitudes_3: z.number().optional(),
  sucursal_1: z.string().optional(),
  sucursal_2: z.string().optional(),
  sucursal_3: z.string().optional(),
});

type AnalistaFormData = z.infer<typeof analistaSchema>;

interface AnalistaFormProps {
  analistaSeleccionado?: any;
  onSuccess?: () => void;
}

type PrioridadOption = {
  value: 'empresa' | 'solicitudes' | 'sucursal';
  label: string;
  icon: any;
  description: string;
};

const PRIORIDADES_OPTIONS: PrioridadOption[] = [
  { value: 'empresa', label: 'Empresa', icon: Building2, description: 'Priorizar por empresa' },
  { value: 'solicitudes', label: 'Cantidad de Solicitudes', icon: FileText, description: 'Priorizar por volumen de trabajo' },
  { value: 'sucursal', label: 'Sucursal', icon: MapPin, description: 'Priorizar por ubicación' }
];

// Datos de ejemplo para sucursales
const SUCURSALES = [
  { id: '1', nombre: 'Sucursal Centro' },
  { id: '2', nombre: 'Sucursal Norte' },
  { id: '3', nombre: 'Sucursal Sur' },
];

export function AnalistaForm({ analistaSeleccionado, onSuccess }: AnalistaFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analistaActualizado, setAnalistaActualizado] = useState<any>(analistaSeleccionado);
  
  console.log('AnalistaForm renderizado con analistaSeleccionado:', analistaSeleccionado);
  console.log('AnalistaForm con datos actualizados:', analistaActualizado);
  
  // Cargar empresas desde la base de datos
  const { data: empresas = [], isLoading: empresasLoading, error: empresasError } = useQuery({
    queryKey: ['empresas'],
    queryFn: async () => {
      try {
        console.log('Iniciando carga de empresas...');
        const data = await empresasService.getAll();
        console.log('Empresas cargadas:', data);
        return data || [];
      } catch (error) {
        console.error('Error cargando empresas:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  console.log('Estado de empresas en el componente:', { empresas, empresasLoading, empresasError });
  
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
      empresa_1: '',
      empresa_2: '',
      empresa_3: '',
      solicitudes_1: undefined,
      solicitudes_2: undefined,
      solicitudes_3: undefined,
      sucursal_1: '',
      sucursal_2: '',
      sucursal_3: '',
    }
  });

  // Cargar datos del analista seleccionado
  useEffect(() => {
    console.log('useEffect ejecutado con analistaSeleccionado:', analistaSeleccionado);
    if (analistaSeleccionado) {
      console.log('Analista seleccionado:', analistaSeleccionado);
      
      // Cargar las prioridades existentes del analista desde la base de datos
      const cargarPrioridadesAnalista = async () => {
        try {
          console.log('Cargando prioridades del analista ID:', analistaSeleccionado.usuario_id);
          const prioridades = await asociacionPrioridadService.getPrioridadesByUsuarioId(analistaSeleccionado.usuario_id);
          console.log('Prioridades cargadas:', prioridades);
          
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
            empresa_1: '',
            empresa_2: '',
            empresa_3: '',
            solicitudes_1: undefined,
            solicitudes_2: undefined,
            solicitudes_3: undefined,
            sucursal_1: '',
            sucursal_2: '',
            sucursal_3: '',
          };
          
                           // Procesar las prioridades cargadas
                 if (prioridades && prioridades.length > 0) {
                   prioridades.forEach((prioridad: any) => {
                     console.log('Procesando prioridad:', prioridad);
                     
                     // Determinar el nivel de prioridad basado en los campos booleanos
                     let nivel = 0;
                     if (prioridad.nivel_prioridad_1) nivel = 1;
                     else if (prioridad.nivel_prioridad_2) nivel = 2;
                     else if (prioridad.nivel_prioridad_3) nivel = 3;
                     
                     if (nivel > 0) {
                       // Determinar el tipo de prioridad basado en los datos
                       let tipo = '';
                       if (prioridad.empresa_id && prioridad.empresa_id > 0) {
                         tipo = 'empresa';
                         (formValues as any)[`empresa_${nivel}`] = prioridad.empresa_id.toString();
                       } else if (prioridad.cantidad_solicitudes && prioridad.cantidad_solicitudes > 0) {
                         tipo = 'solicitudes';
                         (formValues as any)[`solicitudes_${nivel}`] = prioridad.cantidad_solicitudes;
                       } else if (prioridad.sucursal_id && prioridad.sucursal_id > 0) {
                         tipo = 'sucursal';
                         (formValues as any)[`sucursal_${nivel}`] = prioridad.sucursal_id.toString();
                       }
                       
                       // Asignar el tipo de prioridad
                       if (tipo) {
                         (formValues as any)[`prioridad_${nivel}`] = tipo;
                       }
                     }
                   });
                 }
          
          console.log('Valores del formulario a cargar:', formValues);
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
            empresa_1: '',
            empresa_2: '',
            empresa_3: '',
            solicitudes_1: undefined,
            solicitudes_2: undefined,
            solicitudes_3: undefined,
            sucursal_1: '',
            sucursal_2: '',
            sucursal_3: '',
          });
        }
      };
      
      cargarPrioridadesAnalista();
    }
  }, [analistaSeleccionado, form]);

  const onSubmit = async (data: AnalistaFormData) => {
    try {
      setIsSubmitting(true);
      
      console.log('=== INICIO onSubmit ===');
      console.log('Datos enviados a Supabase:', data);
      console.log('analistaSeleccionado:', analistaSeleccionado);
      
      if (analistaSeleccionado) {
        // Actualizar analista existente
        console.log('Actualizando prioridades del analista:', analistaSeleccionado.usuario_id);
        
        // Guardar las prioridades en la nueva tabla
        console.log('Llamando a guardarPrioridadesAnalista...');
        await guardarPrioridadesAnalista(analistaSeleccionado.usuario_id, data);
        console.log('guardarPrioridadesAnalista completado');
        
        toast.success('Prioridades del analista actualizadas exitosamente');
      } else {
        // Crear nuevo analista
        const payload = {
          username: data.username || '',
          email: data.email || '',
          password_hash: data.password || '',
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
      
      console.log('=== FIN onSubmit - ÉXITO ===');
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
      console.log('=== INICIO guardarPrioridadesAnalista ===');
      console.log('Usuario ID:', usuarioId);
      console.log('Datos de prioridades:', {
        prioridad_1: data.prioridad_1,
        prioridad_2: data.prioridad_2,
        prioridad_3: data.prioridad_3,
        empresa_1: data.empresa_1,
        empresa_2: data.empresa_2,
        empresa_3: data.empresa_3,
        solicitudes_1: data.solicitudes_1,
        solicitudes_2: data.solicitudes_2,
        solicitudes_3: data.solicitudes_3,
        sucursal_1: data.sucursal_1,
        sucursal_2: data.sucursal_2,
        sucursal_3: data.sucursal_3,
      });
      
      // Primero eliminar todas las prioridades existentes del analista
      console.log('Eliminando prioridades existentes...');
      await asociacionPrioridadService.deleteByUsuarioId(usuarioId);
      console.log('Prioridades eliminadas');
      
      // Procesar cada prioridad individualmente
      if (data.prioridad_1) {
        console.log('Procesando prioridad 1:', data.prioridad_1);
        await procesarPrioridad(usuarioId, 1, data.prioridad_1, data.empresa_1, data.solicitudes_1, data.sucursal_1);
      } else {
        console.log('No hay prioridad 1 configurada');
      }
      
      if (data.prioridad_2) {
        console.log('Procesando prioridad 2:', data.prioridad_2);
        await procesarPrioridad(usuarioId, 2, data.prioridad_2, data.empresa_2, data.solicitudes_2, data.sucursal_2);
      } else {
        console.log('No hay prioridad 2 configurada');
      }
      
      if (data.prioridad_3) {
        console.log('Procesando prioridad 3:', data.prioridad_3);
        await procesarPrioridad(usuarioId, 3, data.prioridad_3, data.empresa_3, data.solicitudes_3, data.sucursal_3);
      } else {
        console.log('No hay prioridad 3 configurada');
      }
      
      console.log('=== FIN guardarPrioridadesAnalista - ÉXITO ===');
    } catch (error) {
      console.error('=== ERROR en guardarPrioridadesAnalista ===');
      console.error('Error guardando prioridades:', error);
      throw error;
    }
  };

     // Función auxiliar para procesar cada prioridad
   const procesarPrioridad = async (
     usuarioId: number, 
     nivel: number, 
     tipo: string, 
     empresaValor?: string, 
     solicitudesValor?: number, 
     sucursalValor?: string
   ) => {
     console.log(`=== INICIO procesarPrioridad nivel ${nivel} ===`);
     console.log(`Tipo: ${tipo}, Empresa: ${empresaValor}, Solicitudes: ${solicitudesValor}, Sucursal: ${sucursalValor}`);
     
     if (tipo === 'empresa' && empresaValor) {
       console.log('Procesando prioridad de empresa...');
       // Buscar la empresa por ID (empresaValor ya es el ID)
       const empresas = await empresasService.getAll();
       const empresa = empresas?.find((emp: any) => emp.id.toString() === empresaValor);
       
       if (empresa) {
         console.log('Empresa encontrada:', empresa.razon_social);
         // Guardar en la tabla analista_prioridades
         const resultado = await asociacionPrioridadService.upsert({
           usuario_id: usuarioId,
           empresa_id: empresa.id,
           sucursal_id: undefined,
           nivel_prioridad_1: nivel === 1,
           nivel_prioridad_2: nivel === 2,
           nivel_prioridad_3: nivel === 3,
           cantidad_solicitudes: 0,
         });
         console.log('Resultado upsert empresa:', resultado);
       } else {
         console.log('Empresa no encontrada para ID:', empresaValor);
       }
     } else if (tipo === 'solicitudes' && solicitudesValor) {
       console.log('Procesando prioridad de solicitudes:', solicitudesValor);
       // Para prioridades de solicitudes, guardar sin empresa ni sucursal
       const resultado = await asociacionPrioridadService.upsert({
         usuario_id: usuarioId,
         empresa_id: undefined,
         sucursal_id: undefined,
         nivel_prioridad_1: nivel === 1,
         nivel_prioridad_2: nivel === 2,
         nivel_prioridad_3: nivel === 3,
         cantidad_solicitudes: solicitudesValor,
       });
       console.log('Resultado upsert solicitudes:', resultado);
     } else if (tipo === 'sucursal' && sucursalValor) {
       console.log('Procesando prioridad de sucursal:', sucursalValor);
       // Para prioridades de sucursal, guardar con sucursal_id
       const resultado = await asociacionPrioridadService.upsert({
         usuario_id: usuarioId,
         empresa_id: undefined,
         sucursal_id: parseInt(sucursalValor),
         nivel_prioridad_1: nivel === 1,
         nivel_prioridad_2: nivel === 2,
         nivel_prioridad_3: nivel === 3,
         cantidad_solicitudes: 0,
       });
       console.log('Resultado upsert sucursal:', resultado);
     } else {
       console.log('No se cumplen las condiciones para procesar la prioridad');
     }
     
     console.log(`=== FIN procesarPrioridad nivel ${nivel} ===`);
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
    const prioridadesSeleccionadas = [prioridad1, prioridad2, prioridad3].filter(Boolean) as Array<'empresa' | 'solicitudes' | 'sucursal'>;
    
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
    const prioridadesSeleccionadas = [prioridad2, prioridad3].filter(Boolean) as Array<'empresa' | 'solicitudes' | 'sucursal'>;
    
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
    // Obtener datos de empresa si hay una seleccionada
    let empresaSeleccionada = null;
    const empresaId = data.empresa_1 || data.empresa_2 || data.empresa_3;
    
    if (empresaId && empresas.length > 0) {
      empresaSeleccionada = empresas.find((emp: any) => emp.id.toString() === empresaId);
    }
    
    // Obtener datos de sucursal si hay una seleccionada
    let sucursalSeleccionada = null;
    const sucursalId = data.sucursal_1 || data.sucursal_2 || data.sucursal_3;
    
    if (sucursalId) {
      sucursalSeleccionada = SUCURSALES.find((suc: any) => suc.id === sucursalId);
    }
    
    const analistaActualizado = {
      ...analistaSeleccionado,
      nivel_prioridad_1: !!data.prioridad_1,
      nivel_prioridad_2: !!data.prioridad_2,
      nivel_prioridad_3: !!data.prioridad_3,
      cantidad_solicitudes: data.solicitudes_1 || data.solicitudes_2 || data.solicitudes_3 || 0,
      empresa_id: empresaId ? parseInt(empresaId) : undefined,
      empresa_nombre: empresaSeleccionada ? empresaSeleccionada.razon_social || empresaSeleccionada.nombre : '',
      empresa_nit: empresaSeleccionada ? empresaSeleccionada.nit || '' : '',
      empresa_direccion: sucursalSeleccionada ? sucursalSeleccionada.nombre : (data.sucursal_1 || data.sucursal_2 || data.sucursal_3 || ''),
    };
    
    setAnalistaActualizado(analistaActualizado);
    console.log('Estado del analista actualizado:', analistaActualizado);
  };

  // Función para limpiar campos cuando cambia una prioridad
  const limpiarCamposDePrioridad = (nivel: 1 | 2 | 3, nuevaPrioridad: string) => {
    const camposALimpiar = {
      empresa: `empresa_${nivel}`,
      solicitudes: `solicitudes_${nivel}`,
      sucursal: `sucursal_${nivel}`
    };

    // Limpiar todos los campos del nivel
    Object.values(camposALimpiar).forEach(campo => {
      form.setValue(campo as any, '');
    });

    // Si la nueva prioridad es diferente, limpiar también los otros niveles
    if (nivel === 1 && prioridad1 && prioridad1 !== nuevaPrioridad) {
      form.setValue('empresa_1', '');
      form.setValue('solicitudes_1', undefined);
      form.setValue('sucursal_1', '');
    } else if (nivel === 2 && prioridad2 && prioridad2 !== nuevaPrioridad) {
      form.setValue('empresa_2', '');
      form.setValue('solicitudes_2', undefined);
      form.setValue('sucursal_2', '');
    } else if (nivel === 3 && prioridad3 && prioridad3 !== nuevaPrioridad) {
      form.setValue('empresa_3', '');
      form.setValue('solicitudes_3', undefined);
      form.setValue('sucursal_3', '');
    }
  };

  // Función para quitar una prioridad de un nivel específico
  const quitarPrioridad = (nivel: 1 | 2 | 3) => {
    const campoPrioridad = `prioridad_${nivel}` as 'prioridad_1' | 'prioridad_2' | 'prioridad_3';
    const campoEmpresa = `empresa_${nivel}` as 'empresa_1' | 'empresa_2' | 'empresa_3';
    const campoSolicitudes = `solicitudes_${nivel}` as 'solicitudes_1' | 'solicitudes_2' | 'solicitudes_3';
    const campoSucursal = `sucursal_${nivel}` as 'sucursal_1' | 'sucursal_2' | 'sucursal_3';

    // Limpiar la prioridad y sus campos relacionados
    form.setValue(campoEmpresa, '');
    form.setValue(campoSolicitudes, undefined);
    form.setValue(campoSucursal, '');
    
    // Limpiar el campo de prioridad usando un enfoque que funcione con el select
    if (nivel === 1) {
      form.setValue('prioridad_1', '' as any);
    } else if (nivel === 2) {
      form.setValue('prioridad_2', '' as any);
    } else if (nivel === 3) {
      form.setValue('prioridad_3', '' as any);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
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
      <Card>
        <CardHeader className="bg-green-50 py-4">
          <CardTitle className="flex items-center gap-2 text-green-800 text-lg">
            <ArrowUpDown className="w-5 h-5" />
            Configuración de Prioridades
          </CardTitle>
          <CardDescription>
            Configure el orden de prioridades para la asignación de solicitudes
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Selectores de Prioridades en Grilla */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Prioridad 1 */}
                <div className="space-y-4">
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
                    <div className="border rounded-lg p-4 bg-red-50">
                      <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <Badge variant="default" className="bg-red-100 text-red-800">1</Badge>
                        Configuración de {prioridad1 === 'solicitudes' ? 'Solicitudes' : getPrioridadLabel(prioridad1)}
                      </h4>
                      
                      {prioridad1 === 'empresa' && (
                        <FormField
                          control={form.control}
                          name="empresa_1"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-normal text-left mb-2">Seleccionar Empresa *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccione una empresa" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {empresasLoading ? (
                                    <SelectItem value="" disabled>
                                      Cargando empresas...
                                    </SelectItem>
                                  ) : empresasError ? (
                                    <SelectItem value="" disabled>
                                      Error cargando empresas
                                    </SelectItem>
                                  ) : empresas.length === 0 ? (
                                    <SelectItem value="" disabled>
                                      No hay empresas disponibles
                                    </SelectItem>
                                  ) : (
                                    empresas.map((empresa) => (
                                      <SelectItem key={empresa.id} value={empresa.id.toString()}>
                                        {empresa.razon_social || empresa.nombre}
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
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
                              <FormLabel className="font-normal text-left mb-2">Seleccionar Sucursal *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccione una sucursal" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {SUCURSALES.map((sucursal) => (
                                    <SelectItem key={sucursal.id} value={sucursal.id}>
                                      {sucursal.nombre}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
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
                    <div className="border rounded-lg p-4 bg-yellow-50">
                      <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <Badge variant="default" className="bg-yellow-100 text-yellow-800">2</Badge>
                        Configuración de {prioridad2 === 'solicitudes' ? 'Solicitudes' : getPrioridadLabel(prioridad2)}
                      </h4>
                      
                      {prioridad2 === 'empresa' && (
                        <FormField
                          control={form.control}
                          name="empresa_2"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-normal text-left mb-2">Seleccionar Empresa *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccione una empresa" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {empresasLoading ? (
                                    <SelectItem value="" disabled>
                                      Cargando empresas...
                                    </SelectItem>
                                  ) : empresasError ? (
                                    <SelectItem value="" disabled>
                                      Error cargando empresas
                                    </SelectItem>
                                  ) : empresas.length === 0 ? (
                                    <SelectItem value="" disabled>
                                      No hay empresas disponibles
                                    </SelectItem>
                                  ) : (
                                    empresas.map((empresa) => (
                                      <SelectItem key={empresa.id} value={empresa.id.toString()}>
                                        {empresa.razon_social || empresa.nombre}
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
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
                              <FormLabel className="font-normal text-left mb-2">Seleccionar Sucursal *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccione una sucursal" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {SUCURSALES.map((sucursal) => (
                                    <SelectItem key={sucursal.id} value={sucursal.id}>
                                      {sucursal.nombre}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
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
                    <div className="border rounded-lg p-4 bg-green-50">
                      <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <Badge variant="default" className="bg-green-100 text-green-800">3</Badge>
                        Configuración de {prioridad3 === 'solicitudes' ? 'Solicitudes' : getPrioridadLabel(prioridad3)}
                      </h4>
                      
                      {prioridad3 === 'empresa' && (
                        <FormField
                          control={form.control}
                          name="empresa_3"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-normal text-left mb-2">Seleccionar Empresa *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccione una empresa" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {empresasLoading ? (
                                    <SelectItem value="" disabled>
                                      Cargando empresas...
                                    </SelectItem>
                                  ) : empresasError ? (
                                    <SelectItem value="" disabled>
                                      Error cargando empresas
                                    </SelectItem>
                                  ) : empresas.length === 0 ? (
                                    <SelectItem value="" disabled>
                                      No hay empresas disponibles
                                    </SelectItem>
                                  ) : (
                                    empresas.map((empresa) => (
                                      <SelectItem key={empresa.id} value={empresa.id.toString()}>
                                        {empresa.razon_social || empresa.nombre}
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
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
                              <FormLabel className="font-normal text-left mb-2">Seleccionar Sucursal *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccione una sucursal" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {SUCURSALES.map((sucursal) => (
                                    <SelectItem key={sucursal.id} value={sucursal.id}>
                                      {sucursal.nombre}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
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
                    console.log('=== BOTÓN GUARDAR CLICKEADO ===');
                    console.log('Estado del formulario:', form.getValues());
                    console.log('Errores del formulario:', form.formState.errors);
                    
                    // Verificar si el formulario es válido
                    const isValid = await form.trigger();
                    console.log('Formulario válido:', isValid);
                    
                    if (isValid) {
                      console.log('Ejecutando onSubmit...');
                      await onSubmit(form.getValues());
                    } else {
                      console.log('Formulario no válido, no ejecutando onSubmit');
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
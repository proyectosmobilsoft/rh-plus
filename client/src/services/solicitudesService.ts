import { supabase } from '@/services/supabaseClient';
import { analistaAsignacionService } from './analistaAsignacionService';

export interface Solicitud {
  id?: number;
  empresa_id?: number;
  candidato_id?: number;
  plantilla_id?: number;
  estado: string;
  fecha_solicitud?: string;
  fecha_programada?: string;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  analista_id?: number; // Nuevo campo para el analista asignado
  // Nuevos campos para manejo de estructura JSON
  estructura_datos?: Record<string, any>; // Los datos del formulario en formato JSON
  plantilla_nombre?: string; // Nombre de la plantilla utilizada
  nombres?: string;
  apellidos?: string;
  tipo_documento?: string;
  numero_documento?: string;
  lugar_expedicion?: string;
  celular?: string;
  direccion?: string;
  empresa_usuaria?: string;
  ciudad_prestacion_servicio?: string;
  departamento_prestacion_servicio?: string;
  cargo?: string;
  salario?: string;
  ciudad?: string;
  fecha_ingreso?: string;
  tipo_contrato?: string;
  salario_basico?: string;
  auxilio_transporte?: string;
  viaje_rotativo?: boolean;
  vehiculo_transportel?: string;
  vehiculo_alimentacion?: string;
  salario_mensual?: string;
  jornada_laboral?: string;
  pagos_auxilios?: string;
  especificaciones_adicionales?: string;
  prioridad?: string;
  observaciones?: string;
  notas_internas?: string;
  centro_trabajo?: string;
  area_funcional?: string;
  tipo_examen?: string;
  examen_medico_realizar?: string;
  departamento?: string;
  cumple_horario?: boolean;
  especifique?: string;
  // Relaciones
  candidatos?: {
    id: number;
    primer_nombre: string;
    segundo_nombre?: string;
    primer_apellido: string;
    segundo_apellido?: string;
    tipo_documento: string;
    numero_documento: string;
    telefono?: string;
    direccion?: string;
    ciudad_id?: number;
    ciudades?: {
      nombre: string;
    };
  };
  empresas?: {
    id: number;
    razon_social: string;
    nit: string;
    ciudad?: string;
  };
  // Relación con analista asignado
  analista?: {
    id: number;
    nombre: string;
    email?: string;
  };
}

export const solicitudesService = {
  getAll: async (): Promise<Solicitud[]> => {
    try {
      const { data, error } = await supabase
        .from('hum_solicitudes')
        .select(`
          *,
          candidatos!candidato_id (
            primer_nombre,
            segundo_nombre,
            primer_apellido,
            segundo_apellido,
            tipo_documento,
            numero_documento,
            telefono,
            direccion,
            ciudad_id,
            ciudades!ciudad_id ( nombre )
          ),
          empresas!empresa_id (
            razon_social,
            nit,
            ciudad
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching solicitudes:', error);
        throw error;
      }

      // Obtener información de analistas por separado para evitar problemas de relación
      const solicitudesConAnalistas = await Promise.all(
        (data || []).map(async (solicitud) => {
          let analista = undefined;
          
          if (solicitud.analista_id) {
            try {
              const { data: analistaData, error: analistaError } = await supabase
                .from('gen_usuarios')
                .select('id, primer_nombre, primer_apellido, username, email')
                .eq('id', solicitud.analista_id)
                .single();
              
              if (!analistaError && analistaData) {
                analista = {
                  id: analistaData.id,
                  nombre: `${analistaData.primer_nombre || ''} ${analistaData.primer_apellido || ''}`.trim() || analistaData.username,
                  email: analistaData.email
                };
              }
            } catch (error) {
              console.warn(`Error obteniendo analista ${solicitud.analista_id}:`, error);
            }
          }

          return {
            ...solicitud,
            analista
          };
        })
      );

      return solicitudesConAnalistas;
    } catch (error) {
      console.error('Error in solicitudesService.getAll:', error);
      throw error;
    }
  },

  getByStatus: async (estado: string): Promise<Solicitud[]> => {
    try {
      const { data, error } = await supabase
        .from('hum_solicitudes')
        .select(`
          *,
          candidatos!candidato_id (
            primer_nombre,
            segundo_nombre,
            primer_apellido,
            segundo_apellido,
            tipo_documento,
            numero_documento,
            telefono,
            direccion,
            ciudad_id,
            ciudades!ciudad_id ( nombre )
          ),
          empresas!empresa_id (
            razon_social,
            nit,
            ciudad
          )
        `)
        .eq('estado', estado)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching solicitudes by status:', error);
        throw error;
      }

      // Obtener información de analistas por separado
      const solicitudesConAnalistas = await Promise.all(
        (data || []).map(async (solicitud) => {
          let analista = undefined;
          
          if (solicitud.analista_id) {
            try {
              const { data: analistaData, error: analistaError } = await supabase
                .from('gen_usuarios')
                .select('id, primer_nombre, primer_apellido, username, email')
                .eq('id', solicitud.analista_id)
                .single();
              
              if (!analistaError && analistaData) {
                analista = {
                  id: analistaData.id,
                  nombre: `${analistaData.primer_nombre || ''} ${analistaData.primer_apellido || ''}`.trim() || analistaData.username,
                  email: analistaData.email
                };
              }
            } catch (error) {
              console.warn(`Error obteniendo analista ${solicitud.analista_id}:`, error);
            }
          }

          return {
            ...solicitud,
            analista
          };
        })
      );

      return solicitudesConAnalistas;
    } catch (error) {
      console.error('Error in solicitudesService.getByStatus:', error);
      throw error;
    }
  },

  getById: async (id: number): Promise<Solicitud | null> => {
    try {
      const { data, error } = await supabase
        .from('hum_solicitudes')
        .select(`
          *,
          candidatos!candidato_id (
            primer_nombre,
            segundo_nombre,
            primer_apellido,
            segundo_apellido,
            tipo_documento,
            numero_documento,
            telefono,
            direccion,
            ciudad_id,
            ciudades!ciudad_id ( nombre )
          ),
          empresas!empresa_id (
            razon_social,
            nit,
            ciudad
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching solicitud by ID:', error);
        throw error;
      }

      if (!data) return null;

      // Obtener información del analista por separado
      let analista = undefined;
      
      if (data.analista_id) {
        try {
          const { data: analistaData, error: analistaError } = await supabase
            .from('gen_usuarios')
            .select('id, primer_nombre, primer_apellido, username, email')
            .eq('id', data.analista_id)
            .single();
          
          if (!analistaError && analistaData) {
            analista = {
              id: analistaData.id,
              nombre: `${analistaData.primer_nombre || ''} ${analistaData.primer_apellido || ''}`.trim() || analistaData.username,
              email: analistaData.email
            };
          }
        } catch (error) {
          console.warn(`Error obteniendo analista ${data.analista_id}:`, error);
        }
      }

      const solicitudTransformada = {
        ...data,
        analista
      };

      return solicitudTransformada;
    } catch (error) {
      console.error('Error in solicitudesService.getById:', error);
      throw error;
    }
  },

  create: async (solicitud: Omit<Solicitud, 'id' | 'created_at' | 'updated_at'>): Promise<Solicitud> => {
    try {
      console.log('🔍 Creando solicitud con asignación automática de analista...');
      
      // Asignar analista automáticamente si no se especifica uno
      let analistaId = solicitud.analista_id;
      let estadoFinal = solicitud.estado;
      
      if (!analistaId && solicitud.empresa_id) {
        console.log('🔄 Asignando analista automáticamente...');
        const analistaAsignado = await analistaAsignacionService.asignarAnalistaAutomatico(solicitud.empresa_id);
        
        if (analistaAsignado) {
          analistaId = analistaAsignado.analista_id;
          estadoFinal = 'ASIGNADO'; // Cambiar estado a ASIGNADO cuando se asigna analista
          console.log('✅ Analista asignado automáticamente:', analistaAsignado.analista_nombre);
          console.log('🔄 Estado de solicitud cambiado a: ASIGNADO');
        } else {
          console.log('⚠️ No se pudo asignar analista automáticamente');
        }
      }

      // Preparar datos de la solicitud
      const solicitudData = {
        ...solicitud,
        analista_id: analistaId,
        estado: estadoFinal, // Usar el estado final (ASIGNADO si se asignó analista)
        fecha_solicitud: solicitud.fecha_solicitud || new Date().toISOString()
      };

      console.log('📝 Datos de la solicitud a crear:', solicitudData);

      const { data, error } = await supabase
        .from('hum_solicitudes')
        .insert(solicitudData)
        .select(`
          *,
          candidatos!candidato_id (
            primer_nombre,
            segundo_nombre,
            primer_apellido,
            segundo_apellido,
            tipo_documento,
            numero_documento,
            telefono,
            direccion,
            ciudad_id,
            ciudades!ciudad_id ( nombre )
          ),
          empresas!empresa_id (
            razon_social,
            nit,
            ciudad
          )
        `)
        .single();

      if (error) {
        console.error('Error creating solicitud:', error);
        throw error;
      }

      // Obtener información del analista por separado
      let analista = undefined;
      
      if (data.analista_id) {
        try {
          const { data: analistaData, error: analistaError } = await supabase
            .from('gen_usuarios')
            .select('id, primer_nombre, primer_apellido, username, email')
            .eq('id', data.analista_id)
            .single();
          
          if (!analistaError && analistaData) {
            analista = {
              id: analistaData.id,
              nombre: `${analistaData.primer_nombre || ''} ${analistaData.primer_apellido || ''}`.trim() || analistaData.username,
              email: analistaData.email
            };
          }
        } catch (error) {
          console.warn(`Error obteniendo analista ${data.analista_id}:`, error);
        }
      }

      const solicitudTransformada = {
        ...data,
        analista
      };

      console.log('✅ Solicitud creada exitosamente con analista:', solicitudTransformada.analista?.nombre || 'Sin asignar');
      console.log('📊 Estado final de la solicitud:', solicitudTransformada.estado);
      return solicitudTransformada;
    } catch (error) {
      console.error('Error in solicitudesService.create:', error);
      throw error;
    }
  },

  update: async (id: number, updates: Partial<Solicitud>): Promise<Solicitud> => {
    try {
      const { data, error } = await supabase
        .from('hum_solicitudes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating solicitud:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in solicitudesService.update:', error);
      throw error;
    }
  },

  delete: async (id: number): Promise<void> => {
    try {
      const { error } = await supabase
        .from('hum_solicitudes')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting solicitud:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in solicitudesService.delete:', error);
      throw error;
    }
  },

  // Filtrar por prioridad
  getByPriority: async (prioridad: string): Promise<Solicitud[]> => {
    try {
      const { data, error } = await supabase
        .from('hum_solicitudes')
        .select('*')
        .eq('prioridad', prioridad)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching solicitudes by priority:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in solicitudesService.getByPriority:', error);
      throw error;
    }
  },

  // Buscar solicitudes
  search: async (searchTerm: string): Promise<Solicitud[]> => {
    try {
      const { data, error } = await supabase
        .from('hum_solicitudes')
        .select('*')
        .or(`nombres.ilike.%${searchTerm}%,apellidos.ilike.%${searchTerm}%,cargo.ilike.%${searchTerm}%,empresa_usuaria.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error searching solicitudes:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in solicitudesService.search:', error);
      throw error;
    }
  },

  // Obtener estadísticas
  getStatistics: async () => {
    try {
      const { data, error } = await supabase
        .from('hum_solicitudes')
        .select('estado, prioridad');

      if (error) {
        console.error('Error fetching solicitudes statistics:', error);
        throw error;
      }

      const total = data?.length || 0;
      const pendientes = data?.filter((s: any) => s.estado === 'PENDIENTE').length || 0;
      const aprobadas = data?.filter((s: any) => s.estado === 'APROBADA').length || 0;
      const rechazadas = data?.filter((s: any) => s.estado === 'RECHAZADA').length || 0;
      const altaPrioridad = data?.filter((s: any) => s.prioridad === 'alta').length || 0;

      return {
        total,
        pendientes,
        aprobadas,
        rechazadas,
        altaPrioridad,
        porcentajeAprobacion: total > 0 ? Math.round((aprobadas / total) * 100) : 0
      };
    } catch (error) {
      console.error('Error in solicitudesService.getStatistics:', error);
      throw error;
    }
  },

  // Crear solicitud con estructura de plantilla
  createWithTemplate: async (
    empresaId: number,
    plantillaId: number,
    plantillaNombre: string,
    estructuraDatos: Record<string, any>,
    candidatoId?: number
  ): Promise<Solicitud> => {
    try {
      console.log('🔍 Creando solicitud con plantilla y asignación automática de analista...');
      
      // Asignar analista automáticamente
      console.log('🔄 Asignando analista automáticamente...');
      const analistaAsignado = await analistaAsignacionService.asignarAnalistaAutomatico(empresaId);
      
      let analistaId: number | undefined;
      let estadoFinal = 'PENDIENTE'; // Estado por defecto
      
      if (analistaAsignado) {
        analistaId = analistaAsignado.analista_id;
        estadoFinal = 'ASIGNADO'; // Cambiar estado a ASIGNADO cuando se asigna analista
        console.log('✅ Analista asignado automáticamente:', analistaAsignado.analista_nombre);
        console.log('🔄 Estado de solicitud cambiado a: ASIGNADO');
      } else {
        console.log('⚠️ No se pudo asignar analista automáticamente');
        console.log('🔄 Estado de solicitud se mantiene como: PENDIENTE');
      }

      const solicitudData = {
        empresa_id: empresaId,
        plantilla_id: plantillaId,
        plantilla_nombre: plantillaNombre,
        estructura_datos: estructuraDatos,
        candidato_id: candidatoId,
        analista_id: analistaId,
        estado: estadoFinal, // Usar el estado final (ASIGNADO si se asignó analista)
        fecha_solicitud: new Date().toISOString()
        // created_by se omite por ahora hasta implementar autenticación de usuarios
      };

      console.log('📝 Datos de la solicitud a crear:', solicitudData);

      const { data, error } = await supabase
        .from('hum_solicitudes')
        .insert(solicitudData)
        .select(`
          *,
          candidatos!candidato_id (
            primer_nombre,
            segundo_nombre,
            primer_apellido,
            segundo_apellido,
            tipo_documento,
            numero_documento,
            telefono,
            direccion,
            ciudad_id,
            ciudades!ciudad_id ( nombre )
          ),
          empresas!empresa_id (
            razon_social,
            nit,
            ciudad
          )
        `)
        .single();

      if (error) {
        console.error('Error creating solicitud with template:', error);
        throw error;
      }

      // Obtener información del analista por separado
      let analista = undefined;
      
      if (data.analista_id) {
        try {
          const { data: analistaData, error: analistaError } = await supabase
            .from('gen_usuarios')
            .select('id, primer_nombre, primer_apellido, username, email')
            .eq('id', data.analista_id)
            .single();
          
          if (!analistaError && analistaData) {
            analista = {
              id: analistaData.id,
              nombre: `${analistaData.primer_nombre || ''} ${analistaData.primer_apellido || ''}`.trim() || analistaData.username,
              email: analistaData.email
            };
          }
        } catch (error) {
          console.warn(`Error obteniendo analista ${data.analista_id}:`, error);
        }
      }

      const solicitudTransformada = {
        ...data,
        analista
      };

      console.log('✅ Solicitud con plantilla creada exitosamente con analista:', solicitudTransformada.analista?.nombre || 'Sin asignar');
      console.log('📊 Estado final de la solicitud:', solicitudTransformada.estado);
      return solicitudTransformada;
    } catch (error) {
      console.error('Error in solicitudesService.createWithTemplate:', error);
      throw error;
    }
  },

  // Actualizar solicitud con estructura de plantilla
  updateWithTemplate: async (
    id: number,
    estructuraDatos: Record<string, any>
  ): Promise<Solicitud> => {
    try {
      const { data, error } = await supabase
        .from('hum_solicitudes')
        .update({
          estructura_datos: estructuraDatos,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating solicitud with template:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in solicitudesService.updateWithTemplate:', error);
      throw error;
    }
  }
}; 
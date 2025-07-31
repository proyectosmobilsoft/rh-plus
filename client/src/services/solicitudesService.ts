import { supabase } from '@/services/supabaseClient';

export interface Solicitud {
  id?: number;
  // Información del trabajador
  nombres: string;
  apellidos: string;
  tipoDocumento: string;
  numeroDocumento: string;
  lugarExpedicion?: string;
  celular?: string;
  direccion?: string;
  // Información de la empresa usuaria
  empresaUsuaria?: string;
  ciudadPrestacionServicio?: string;
  departamentoPrestacionServicio?: string;
  // Información del trabajo
  cargo: string;
  salario?: string;
  ciudad: string;
  fechaIngreso?: string;
  tipoContrato?: string;
  // Especificaciones para el ingreso
  salarioBasico?: string;
  auxilioTransporte?: string;
  viajeRotativo?: boolean;
  // Vehículo de transporte y alimentación
  vehiculoTransporte?: string;
  vehiculoAlimentacion?: string;
  // Salario mensual
  salarioMensual?: string;
  // Jornada laboral
  jornadaLaboral?: string;
  // Pagos adicionales
  pagosAuxilios?: string;
  // Especificaciones adicionales
  especificacionesAdicionales?: string;
  // Estado y seguimiento
  estado: string;
  prioridad?: string;
  // Fechas de seguimiento
  fechaCreacion?: string;
  fechaAsignacion?: string;
  fechaInicioExamenes?: string;
  fechaFinalizacion?: string;
  fechaVencimiento?: string;
  // Metadatos
  observaciones?: string;
  notasInternas?: string;
  leadTime?: number;
  // Campos adicionales para el examen médico
  centroTrabajo?: string;
  areaFuncional?: string;
  tipoExamen?: string;
  examenMedicoRealizar?: string;
  // Información adicional de ubicación
  departamento?: string;
  // Campos de cumplimiento
  cumpleHorario?: boolean;
  especifique?: string;
  // Campos de auditoría
  created_at?: string;
  updated_at?: string;
}

export const solicitudesService = {
  // Obtener todas las solicitudes
  getAll: async (): Promise<Solicitud[]> => {
    try {
      const { data, error } = await supabase
        .from('hum_solicitudes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching solicitudes:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in solicitudesService.getAll:', error);
      throw error;
    }
  },

  // Obtener solicitud por ID
  getById: async (id: number): Promise<Solicitud | null> => {
    try {
      const { data, error } = await supabase
        .from('hum_solicitudes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching solicitud by ID:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in solicitudesService.getById:', error);
      throw error;
    }
  },

  // Crear nueva solicitud
  create: async (solicitud: Omit<Solicitud, 'id'>): Promise<Solicitud> => {
    try {
      const { data, error } = await supabase
        .from('hum_solicitudes')
        .insert([solicitud])
        .select()
        .single();

      if (error) {
        console.error('Error creating solicitud:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in solicitudesService.create:', error);
      throw error;
    }
  },

  // Actualizar solicitud
  update: async (id: number, solicitud: Partial<Solicitud>): Promise<Solicitud> => {
    try {
      const { data, error } = await supabase
        .from('hum_solicitudes')
        .update(solicitud)
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

  // Eliminar solicitud
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

  // Filtrar por estado
  getByStatus: async (estado: string): Promise<Solicitud[]> => {
    try {
      const { data, error } = await supabase
        .from('hum_solicitudes')
        .select('*')
        .eq('estado', estado)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching solicitudes by status:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in solicitudesService.getByStatus:', error);
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
  }
}; 
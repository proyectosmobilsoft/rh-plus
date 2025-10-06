import { supabase } from './supabaseClient';

export interface SolicitudLog {
  id?: number;
  solicitud_id: number;
  usuario_id?: number; // Hacer opcional
  accion: string;
  estado_anterior?: string;
  estado_nuevo?: string;
  observacion?: string;
  fecha_accion?: string;
  // Relaciones
  usuario?: {
    id: number;
    username: string;
    email: string;
    primer_nombre: string;
    primer_apellido: string;
  };
  solicitud?: {
    id: number;
    estado: string;
    empresa_id?: number;
    candidato_id?: number;
  };
}

export const solicitudesLogsService = {
  // Crear un nuevo log
  crearLog: async (logData: Omit<SolicitudLog, 'id' | 'fecha_accion'>): Promise<SolicitudLog | null> => {
    try {
      console.log('📝 Creando log:', logData);
      
      // Preparar datos del log
      const logDataToInsert: any = {
        ...logData,
        fecha_accion: new Date().toISOString()
      };
      
      // Si no hay usuario_id válido, intentar obtener uno por defecto
      if (!logData.usuario_id) {
        console.log('⚠️ No hay usuario válido, intentando obtener usuario por defecto...');
        const usuarioPorDefecto = await getUsuarioPorDefecto();
        if (usuarioPorDefecto) {
          logDataToInsert.usuario_id = usuarioPorDefecto;
          console.log('✅ Usuario por defecto asignado:', usuarioPorDefecto);
        } else {
          console.log('❌ No se pudo obtener usuario por defecto, omitiendo campo usuario_id');
          delete logDataToInsert.usuario_id;
        }
      }
      
      const { data, error } = await supabase
        .from('hum_solicitudes_logs')
        .insert(logDataToInsert)
        .select(`
          *,
          usuario:gen_usuarios(id, username, email, primer_nombre, primer_apellido),
          solicitud:hum_solicitudes(id, estado, empresa_id, candidato_id)
        `)
        .single();

      if (error) {
        console.error('Error creating log:', error);
        return null;
      }

      console.log('✅ Log creado exitosamente:', data);
      return data;
    } catch (error) {
      console.error('Error in crearLog:', error);
      return null;
    }
  },

  // Obtener logs de una solicitud específica
  getLogsBySolicitud: async (solicitudId: number): Promise<SolicitudLog[]> => {
    try {
      const { data, error } = await supabase
        .from('hum_solicitudes_logs')
        .select(`
          *,
          usuario:gen_usuarios(id, username, email, primer_nombre, primer_apellido),
          solicitud:hum_solicitudes(id, estado, empresa_id, candidato_id)
        `)
        .eq('solicitud_id', solicitudId)
        .order('fecha_accion', { ascending: false });

      if (error) {
        console.error('Error fetching logs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getLogsBySolicitud:', error);
      return [];
    }
  },

  // Obtener todos los logs
  getAllLogs: async (): Promise<SolicitudLog[]> => {
    try {
      const { data, error } = await supabase
        .from('hum_solicitudes_logs')
        .select(`
          *,
          usuario:gen_usuarios(id, username, email, primer_nombre, primer_apellido),
          solicitud:hum_solicitudes(id, estado, empresa_id, candidato_id)
        `)
        .order('fecha_accion', { ascending: false });

      if (error) {
        console.error('Error fetching all logs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching all logs:', error);
      return [];
    }
  },

  // Obtener todos los logs con paginación (para compatibilidad)
  getAllLogsPaginated: async (page: number = 1, limit: number = 50): Promise<{
    logs: SolicitudLog[];
    total: number;
    page: number;
    totalPages: number;
  }> => {
    try {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      // Obtener el total de logs
      const { count, error: countError } = await supabase
        .from('hum_solicitudes_logs')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.error('Error al contar logs:', countError);
        return { logs: [], total: 0, page, totalPages: 0 };
      }

      // Obtener los logs de la página actual
      const { data, error } = await supabase
        .from('hum_solicitudes_logs')
        .select(`
          *,
          usuario:gen_usuarios(id, username, email, primer_nombre, primer_apellido),
          solicitud:hum_solicitudes(id, estado, empresa_id, candidato_id)
        `)
        .order('fecha_accion', { ascending: false })
        .range(from, to);

      if (error) {
        console.error('Error al obtener logs:', error);
        return { logs: [], total: 0, page, totalPages: 0 };
      }

      const total = count || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        logs: data || [],
        total,
        page,
        totalPages
      };
    } catch (error) {
      console.error('Error in getAllLogsPaginated:', error);
      return { logs: [], total: 0, page, totalPages: 0 };
    }
  },

  // Obtener logs por acción específica
  getLogsByAccion: async (accion: string): Promise<SolicitudLog[]> => {
    try {
      const { data, error } = await supabase
        .from('hum_solicitudes_logs')
        .select(`
          *,
          usuario:gen_usuarios(id, username, email, primer_nombre, primer_apellido),
          solicitud:hum_solicitudes(id, estado, empresa_id, candidato_id)
        `)
        .eq('accion', accion)
        .order('fecha_accion', { ascending: false });

      if (error) {
        console.error('Error fetching logs by action:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getLogsByAccion:', error);
      return [];
    }
  },

  // Obtener logs por usuario
  getLogsByUsuario: async (usuarioId: number): Promise<SolicitudLog[]> => {
    try {
      const { data, error } = await supabase
        .from('hum_solicitudes_logs')
        .select(`
          *,
          usuario:gen_usuarios(id, username, email, primer_nombre, primer_apellido),
          solicitud:hum_solicitudes(id, estado, empresa_id, candidato_id)
        `)
        .eq('usuario_id', usuarioId)
        .order('fecha_accion', { ascending: false });

      if (error) {
        console.error('Error fetching logs by user:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getLogsByUsuario:', error);
      return [];
    }
  },

  // Obtener logs por rango de fechas
  getLogsByDateRange: async (fechaInicio: string, fechaFin: string): Promise<SolicitudLog[]> => {
    try {
      const { data, error } = await supabase
        .from('hum_solicitudes_logs')
        .select(`
          *,
          usuario:gen_usuarios(id, username, email, primer_nombre, primer_apellido),
          solicitud:hum_solicitudes(id, estado, empresa_id, candidato_id)
        `)
        .gte('fecha_accion', fechaInicio)
        .lte('fecha_accion', fechaFin)
        .order('fecha_accion', { ascending: false });

      if (error) {
        console.error('Error fetching logs by date range:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getLogsByDateRange:', error);
      return [];
    }
  }
};

// Constantes para las acciones del sistema
export const ACCIONES_SISTEMA = {
  CREAR_SOLICITUD: 'CREAR_SOLICITUD',
  ASIGNAR_ANALISTA: 'ASIGNAR_ANALISTA',
  CAMBIAR_ESTADO: 'CAMBIAR_ESTADO',
  CONTACTAR: 'CONTACTAR',
  PUT_STANDBY: 'PUT_STANDBY',
  REACTIVAR: 'REACTIVAR',
  EDITAR_SOLICITUD: 'EDITAR_SOLICITUD',
  ELIMINAR_SOLICITUD: 'ELIMINAR_SOLICITUD',
  APROBAR_SOLICITUD: 'APROBAR_SOLICITUD',
  RECHAZAR_SOLICITUD: 'RECHAZAR_SOLICITUD',
  CONTRATAR_SOLICITUD: 'CONTRATAR_SOLICITUD',
  ASIGNAR_PRIORIDAD: 'ASIGNAR_PRIORIDAD',
  ACTUALIZAR_OBSERVACIONES: 'ACTUALIZAR_OBSERVACIONES',
  DEVOLVER_DOCUMENTOS: 'DEVOLVER_DOCUMENTOS'
} as const;

// Constantes de compatibilidad para mantener el código existente funcionando
export const ACCIONES_SOLICITUDES = {
  CREAR: 'CREAR_SOLICITUD',
  CAMBIAR_ESTADO: 'CAMBIAR_ESTADO',
  ASIGNAR_ANALISTA: 'ASIGNAR_ANALISTA',
  EDITAR: 'EDITAR_SOLICITUD',
  APROBAR: 'APROBAR_SOLICITUD',
  RECHAZAR: 'RECHAZAR_SOLICITUD',
  CONTRATAR: 'CONTRATAR_SOLICITUD',
  CONTACTAR: 'CONTACTAR',
  STAND_BY: 'PUT_STANDBY',
  REACTIVAR: 'REACTIVAR',
  ELIMINAR: 'ELIMINAR_SOLICITUD'
} as const;

// Función helper para obtener el usuario actual
export const getUsuarioActual = (): number | null => {
  try {
    const userData = localStorage.getItem('userData');
    if (userData) {
      const usuario = JSON.parse(userData);
      return usuario.id || null;
    }
    return null;
  } catch (error) {
    console.warn('Error obteniendo usuario actual:', error);
    return null;
  }
};

// Función para obtener un usuario por defecto para los logs
export const getUsuarioPorDefecto = async (): Promise<number | null> => {
  try {
    // Intentar obtener el primer usuario activo del sistema
    const { data, error } = await supabase
      .from('gen_usuarios')
      .select('id')
      .eq('activo', true)
      .limit(1)
      .single();

    if (error || !data) {
      console.warn('No se pudo obtener usuario por defecto:', error);
      return null;
    }

    return data.id;
  } catch (error) {
    console.warn('Error obteniendo usuario por defecto:', error);
    return null;
  }
};

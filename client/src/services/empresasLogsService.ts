import { supabase } from './supabaseClient';

export interface EmpresaLog {
  id?: number;
  empresa_id: number;
  usuario_id: number;
  accion: string;
  detalles?: string;
  fecha_accion?: string;
  // Relaciones
  usuario?: {
    id: number;
    username: string;
    email: string;
    primer_nombre: string;
    primer_apellido: string;
  };
  empresa?: {
    id: number;
    razon_social: string;
    nit: string;
  };
}

export const empresasLogsService = {
  // Crear un nuevo log
  crearLog: async (logData: Omit<EmpresaLog, 'id' | 'fecha_accion'>): Promise<EmpresaLog | null> => {
    try {
      console.log('📝 Creando log de empresa:', logData);
      
      const { data, error } = await supabase
        .from('gen_empresas_logs')
        .insert({
          ...logData,
          fecha_accion: new Date().toISOString()
        })
        .select(`
          *,
          usuario:gen_usuarios(id, username, email, primer_nombre, primer_apellido),
          empresa:gen_empresas(id, razon_social, nit)
        `)
        .single();

      if (error) {
        console.error('Error creating company log:', error);
        return null;
      }

      console.log('✅ Log de empresa creado exitosamente:', data);
      return data;
    } catch (error) {
      console.error('Error in crearLog:', error);
      return null;
    }
  },

  // Obtener logs de una empresa específica
  getLogsByEmpresa: async (empresaId: number): Promise<EmpresaLog[]> => {
    try {
      const { data, error } = await supabase
        .from('gen_empresas_logs')
        .select(`
          *,
          usuario:gen_usuarios(id, username, email, primer_nombre, primer_apellido),
          empresa:gen_empresas(id, razon_social, nit)
        `)
        .eq('empresa_id', empresaId)
        .order('fecha_accion', { ascending: false });

      if (error) {
        console.error('Error fetching company logs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getLogsByEmpresa:', error);
      return [];
    }
  },

  // Obtener todos los logs de empresas
  getAllLogs: async (): Promise<EmpresaLog[]> => {
    try {
      const { data, error } = await supabase
        .from('gen_empresas_logs')
        .select(`
          *,
          usuario:gen_usuarios(id, username, email, primer_nombre, primer_apellido),
          empresa:gen_empresas(id, razon_social, nit)
        `)
        .order('fecha_accion', { ascending: false });

      if (error) {
        console.error('Error fetching all company logs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllLogs:', error);
      return [];
    }
  }
};

// Constantes para las acciones de empresas
export const ACCIONES_EMPRESAS = {
  CREAR_EMPRESA: 'CREAR_EMPRESA',
  EDITAR_EMPRESA: 'EDITAR_EMPRESA',
  ELIMINAR_EMPRESA: 'ELIMINAR_EMPRESA',
  ACTIVAR_EMPRESA: 'ACTIVAR_EMPRESA',
  DESACTIVAR_EMPRESA: 'DESACTIVAR_EMPRESA',
  ASIGNAR_ANALISTA: 'ASIGNAR_ANALISTA',
  CAMBIAR_ESTADO: 'CAMBIAR_ESTADO',
  ACTUALIZAR_INFORMACION: 'ACTUALIZAR_INFORMACION'
} as const;

// Función helper para obtener el usuario actual
export const getUsuarioActual = (): number => {
  try {
    const usuarioActual = localStorage.getItem('usuarioActual');
    return usuarioActual ? JSON.parse(usuarioActual).id : 1; // Fallback a ID 1
  } catch (error) {
    console.warn('Error obteniendo usuario actual:', error);
    return 1; // Fallback a ID 1
  }
};


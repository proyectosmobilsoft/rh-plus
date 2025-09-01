import { supabase } from './supabaseClient';

export interface Analyst {
  id?: number;
  username: string;
  email: string;
  password?: string;
  primer_nombre?: string;
  segundo_nombre?: string;
  primer_apellido?: string;
  segundo_apellido?: string;
  activo?: boolean;
  rol_id?: number;
  created_at?: string;
  updated_at?: string;
}

const ANALISTA_ROLE_ID = 4;

export const analystsService = {
  // Listar solo analistas
  getAll: async (): Promise<Analyst[]> => {
    const { data, error } = await supabase
      .from('gen_usuarios')
      .select('*')
      .eq('rol_id', ANALISTA_ROLE_ID);
    if (error) throw error;
    return data || [];
  },
  // Guardar analista
  create: async (analyst: Analyst): Promise<Analyst | null> => {
    const { password, ...rest } = analyst;
    const insertData = {
      ...rest,
              password: password || '',
      rol_id: ANALISTA_ROLE_ID,
    };
    const { data, error } = await supabase.from('gen_usuarios').insert([insertData]).select();
    if (error) throw error;
    return data ? data[0] : null;
  },
  // Editar analista
  update: async (id: number, updates: Partial<Analyst>): Promise<Analyst | null> => {
    const { data, error } = await supabase
      .from('gen_usuarios')
      .update(updates)
      .eq('id', id)
      .eq('rol_id', ANALISTA_ROLE_ID)
      .select();
    if (error) throw error;
    return data ? data[0] : null;
  },
  // Eliminar analista (solo si está inactivo)
  remove: async (id: number): Promise<boolean> => {
    // Primero verificar si el analista está inactivo
    const { data: analyst, error: fetchError } = await supabase
      .from('gen_usuarios')
      .select('activo')
      .eq('id', id)
      .eq('rol_id', ANALISTA_ROLE_ID)
      .single();
    
    if (fetchError) throw fetchError;
    
    if (analyst?.activo === true) {
      throw new Error('No se puede eliminar un analista activo. Primero desactívalo.');
    }

    const { error } = await supabase
      .from('gen_usuarios')
      .delete()
      .eq('id', id)
      .eq('rol_id', ANALISTA_ROLE_ID);
    if (error) throw error;
    return true;
  },

  // Activar analista
  activate: async (id: number): Promise<boolean> => {
    const { error } = await supabase
      .from('gen_usuarios')
      .update({ activo: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('rol_id', ANALISTA_ROLE_ID);
    if (error) throw error;
    return true;
  },

  // Desactivar analista
  deactivate: async (id: number): Promise<boolean> => {
    const { error } = await supabase
      .from('gen_usuarios')
      .update({ activo: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('rol_id', ANALISTA_ROLE_ID);
    if (error) throw error;
    return true;
  }
}; 
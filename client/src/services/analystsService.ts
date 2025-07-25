import { supabase } from './supabaseClient';

export interface Analyst {
  id?: number;
  username: string;
  email: string;
  password_hash?: string;
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
      .from('usuarios')
      .select('*')
      .eq('rol_id', ANALISTA_ROLE_ID);
    if (error) throw error;
    return data || [];
  },
  // Guardar analista
  create: async (analyst: Analyst): Promise<Analyst | null> => {
    const { password_hash, ...rest } = analyst;
    const insertData = {
      ...rest,
      password_hash: password_hash || '',
      rol_id: ANALISTA_ROLE_ID,
    };
    const { data, error } = await supabase.from('usuarios').insert([insertData]).select();
    if (error) throw error;
    return data ? data[0] : null;
  },
  // Editar analista
  update: async (id: number, updates: Partial<Analyst>): Promise<Analyst | null> => {
    const { data, error } = await supabase
      .from('usuarios')
      .update(updates)
      .eq('id', id)
      .eq('rol_id', ANALISTA_ROLE_ID)
      .select();
    if (error) throw error;
    return data ? data[0] : null;
  },
  // Eliminar analista
  remove: async (id: number): Promise<boolean> => {
    const { error } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', id)
      .eq('rol_id', ANALISTA_ROLE_ID);
    if (error) throw error;
    return true;
  }
}; 
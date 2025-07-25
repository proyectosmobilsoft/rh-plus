import { supabase } from './supabaseClient';

export interface Analyst {
  id?: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  active?: boolean;
  priority_level?: string;
  created_at?: string;
  updated_at?: string;
}

export const analystsService = {
  // Listar
  getAll: async (): Promise<Analyst[]> => {
    const { data, error } = await supabase.from('analysts').select('*');
    if (error) throw error;
    return data || [];
  },
  // Guardar
  create: async (analyst: Analyst): Promise<Analyst | null> => {
    const { data, error } = await supabase.from('analysts').insert([analyst]).select();
    if (error) throw error;
    return data ? data[0] : null;
  },
  // Editar
  update: async (id: number, updates: Partial<Analyst>): Promise<Analyst | null> => {
    const { data, error } = await supabase.from('analysts').update(updates).eq('id', id).select();
    if (error) throw error;
    return data ? data[0] : null;
  },
  // Eliminar
  remove: async (id: number): Promise<boolean> => {
    const { error } = await supabase.from('analysts').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
}; 
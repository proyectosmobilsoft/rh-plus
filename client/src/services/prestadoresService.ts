import { supabase } from './supabaseClient';

export interface Prestador {
  id?: number;
  identificacion: string;
  nombre: string;
  apellido: string;
  especialidad: string;
  telefono?: string;
  correo?: string;
}

export const prestadoresService = {
  getAll: async (): Promise<Prestador[]> => {
    const { data, error } = await supabase.from('prestadores').select('*');
    if (error) throw error;
    return data || [];
  },
  create: async (prestador: Partial<Prestador>): Promise<Prestador | null> => {
    const { data, error } = await supabase.from('prestadores').insert([prestador]).select();
    if (error) throw error;
    return data ? data[0] : null;
  },
  update: async (id: number, prestador: Partial<Prestador>): Promise<Prestador | null> => {
    const { data, error } = await supabase.from('prestadores').update(prestador).eq('id', id).select();
    if (error) throw error;
    return data ? data[0] : null;
  },
  delete: async (id: number): Promise<boolean> => {
    const { error } = await supabase.from('prestadores').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
}; 
import { supabase } from './supabaseClient';

export interface Candidato {
  id?: number;
  tipo_documento: string;
  numero_documento: string;
  primer_nombre: string;
  segundo_nombre?: string;
  primer_apellido: string;
  segundo_apellido?: string;
  email: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  empresa_id: number; // Relación con empresa
}

export const candidatosService = {
  getAll: async (): Promise<Candidato[]> => {
    const { data, error } = await supabase.from('candidatos').select('*');
    if (error) throw error;
    return data || [];
  },
  create: async (candidato: Partial<Candidato>): Promise<Candidato | null> => {
    const { data, error } = await supabase.from('candidatos').insert([candidato]).select();
    if (error) throw error;
    return data ? data[0] : null;
  },
  update: async (id: number, candidato: Partial<Candidato>): Promise<Candidato | null> => {
    const { data, error } = await supabase.from('candidatos').update(candidato).eq('id', id).select();
    if (error) throw error;
    return data ? data[0] : null;
  },
  delete: async (id: number): Promise<boolean> => {
    const { error } = await supabase.from('candidatos').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
};
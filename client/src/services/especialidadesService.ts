import { supabase } from './supabaseClient';

export interface Especialidad {
  id: number;
  nombre: string;
  descripcion?: string;
  created_at?: string;
  updated_at?: string;
}

export const especialidadesService = {
  getAll: async (): Promise<Especialidad[]> => {
    const { data, error } = await supabase.from('especialidades').select('id, nombre, descripcion, created_at, updated_at').order('nombre');
    if (error) throw error;
    return data || [];
  },
  
  getById: async (id: number): Promise<Especialidad | null> => {
    const { data, error } = await supabase.from('especialidades').select('id, nombre, descripcion, created_at, updated_at').eq('id', id).single();
    if (error) throw error;
    return data;
  },
  
  create: async (especialidad: Partial<Especialidad>): Promise<Especialidad | null> => {
    const { data, error } = await supabase.from('especialidades').insert([especialidad]).select();
    if (error) throw error;
    return data ? data[0] : null;
  },
  
  update: async (id: number, especialidad: Partial<Especialidad>): Promise<Especialidad | null> => {
    const { data, error } = await supabase.from('especialidades').update(especialidad).eq('id', id).select();
    if (error) throw error;
    return data ? data[0] : null;
  },
  
  delete: async (id: number): Promise<boolean> => {
    const { error } = await supabase.from('especialidades').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
}; 


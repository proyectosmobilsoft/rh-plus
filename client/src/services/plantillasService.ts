import { supabase } from './supabaseClient';

export interface Plantilla {
  id: number;
  nombre: string;
  descripcion?: string;
  es_default: boolean;
  estructura_formulario: any;
  activa: boolean;
  empresa_id?: number | null;
  usuario_id?: number | null;
  created_at: string;
  updated_at: string;
}

export const plantillasService = {
  getAll: async (): Promise<Plantilla[]> => {
    const { data, error } = await supabase
      .from('plantillas')
      .select('*')
      .order('nombre', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  getById: async (id: number): Promise<Plantilla | null> => {
    const { data, error } = await supabase
      .from('plantillas')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  create: async (plantilla: Partial<Plantilla>): Promise<Plantilla | null> => {
    const { data, error } = await supabase
      .from('plantillas')
      .insert([plantilla])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  update: async (id: number, plantilla: Partial<Plantilla>): Promise<Plantilla | null> => {
    const { data, error } = await supabase
      .from('plantillas')
      .update({ ...plantilla, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  delete: async (id: number): Promise<boolean> => {
    const { error } = await supabase
      .from('plantillas')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },
}; 
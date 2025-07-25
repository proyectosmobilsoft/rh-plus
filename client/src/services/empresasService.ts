
import { supabase } from './supabaseClient';

export interface Empresa {
  id?: number;
  razon_social: string;
  nit: string;
  tipo_documento?: string;
  regimen_tributario?: string;
  direccion?: string;
  ciudad?: string;
  telefono?: string;
  email?: string;
  representante_legal?: string;
  actividad_economica?: string;
  numero_empleados?: number;
  tipo_empresa?: string;
  activo?: boolean;
  created_at?: string;
  updated_at?: string;
}

export const empresasService = {
  getAll: async (): Promise<Empresa[]> => {
    const { data, error } = await supabase.from('empresas').select('*');
    if (error) throw error;
    return data || [];
  },
  create: async (empresa: Omit<Empresa, 'id'>): Promise<Empresa | null> => {
    const { data, error } = await supabase.from('empresas').insert([empresa]).select();
    if (error) throw error;
    return data ? data[0] : null;
  },
  update: async (empresa: Empresa): Promise<Empresa | null> => {
    if (!empresa.id) throw new Error('ID requerido para actualizar empresa');
    const { data, error } = await supabase.from('empresas').update(empresa).eq('id', empresa.id).select();
    if (error) throw error;
    return data ? data[0] : null;
  },
  delete: async (id: number): Promise<boolean> => {
    const { error } = await supabase.from('empresas').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
};

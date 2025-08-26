import { supabase } from '@/services/supabaseClient';

export interface Sucursal {
  id: number;
  codigo?: string;
  nombre: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
  ciudad_id?: number;
}

class SucursalesService {
  async getAll(): Promise<Sucursal[]> {
    try {
      const { data, error } = await supabase
        .from('gen_sucursales')
        .select('*')
        .eq('activo', true)
        .order('nombre');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching sucursales:', error);
      throw error;
    }
  }

  async getAllIncludingInactive(): Promise<Sucursal[]> {
    try {
      const { data, error } = await supabase
        .from('gen_sucursales')
        .select('*')
        .order('nombre');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching sucursales:', error);
      throw error;
    }
  }
}

export const sucursalesService = new SucursalesService();

import { supabase } from '@/services/supabaseClient';

export interface Proyecto {
  id: number;
  codigo: string;
  nombre: string;
  regional_id?: number;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
  regional?: {
    id: number;
    nombre: string;
    codigo: string;
  };
}

class ProyectosService {
  async getAll(): Promise<Proyecto[]> {
    try {
      const { data, error } = await supabase
        .from('proyectos')
        .select(`
          *,
          regional:regionales(
            id,
            nombre,
            codigo
          )
        `)
        .eq('activo', true)
        .order('nombre');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching proyectos:', error);
      throw error;
    }
  }

  async getAllIncludingInactive(): Promise<Proyecto[]> {
    try {
      const { data, error } = await supabase
        .from('proyectos')
        .select(`
          *,
          regional:regionales(
            id,
            nombre,
            codigo
          )
        `)
        .order('nombre');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching proyectos:', error);
      throw error;
    }
  }
}

export const proyectosService = new ProyectosService();

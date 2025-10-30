import { supabase } from '@/services/supabaseClient';

export interface ActividadEconomica {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateActividadEconomicaData {
  codigo: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

export interface UpdateActividadEconomicaData {
  codigo?: string;
  nombre?: string;
  descripcion?: string;
  activo?: boolean;
}

class ActividadesEconomicasService {
  async getAll(): Promise<ActividadEconomica[]> {
    try {
      const { data, error } = await supabase
        .from('gen_actividades_economicas')
        .select('id, codigo, nombre, descripcion, activo, created_at, updated_at')
        .order('codigo');

      if (error) {
        console.error('Error al obtener actividades económicas:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error en getAll de actividades económicas:', error);
      throw error;
    }
  }

  async getById(id: number): Promise<ActividadEconomica | null> {
    try {
      const { data, error } = await supabase
        .from('gen_actividades_economicas')
        .select('id, codigo, nombre, descripcion, activo, created_at, updated_at')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error al obtener actividad económica:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error en getById de actividad económica:', error);
      throw error;
    }
  }

  async create(actividadData: CreateActividadEconomicaData): Promise<ActividadEconomica> {
    try {
      const { data, error } = await supabase
        .from('gen_actividades_economicas')
        .insert([actividadData])
        .select()
        .single();

      if (error) {
        console.error('Error al crear actividad económica:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error en create de actividad económica:', error);
      throw error;
    }
  }

  async update(id: number, actividadData: UpdateActividadEconomicaData): Promise<ActividadEconomica> {
    try {
      const { data, error } = await supabase
        .from('gen_actividades_economicas')
        .update({
          ...actividadData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error al actualizar actividad económica:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error en update de actividad económica:', error);
      throw error;
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      // Primero verificar si la actividad está activa
      const { data: actividad, error: fetchError } = await supabase
        .from('gen_actividades_economicas')
        .select('activo')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        console.error('Error al verificar estado de actividad económica:', fetchError);
        throw fetchError;
      }
      
      if (actividad?.activo === true) {
        throw new Error('No se puede eliminar una actividad económica activa. Primero desactívala.');
      }

      const { error } = await supabase
        .from('gen_actividades_economicas')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error al eliminar actividad económica:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error en delete de actividad económica:', error);
      throw error;
    }
  }

  async activate(id: number): Promise<ActividadEconomica> {
    try {
      const { data, error } = await supabase
        .from('gen_actividades_economicas')
        .update({ 
          activo: true, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error al activar actividad económica:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error en activate de actividad económica:', error);
      throw error;
    }
  }

  async deactivate(id: number): Promise<ActividadEconomica> {
    try {
      const { data, error } = await supabase
        .from('gen_actividades_economicas')
        .update({ 
          activo: false, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error al desactivar actividad económica:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error en deactivate de actividad económica:', error);
      throw error;
    }
  }

  async search(searchTerm: string): Promise<ActividadEconomica[]> {
    try {
      const { data, error } = await supabase
        .from('gen_actividades_economicas')
        .select('id, codigo, nombre, descripcion, activo, created_at, updated_at')
        .or(`codigo.ilike.%${searchTerm}%,nombre.ilike.%${searchTerm}%,descripcion.ilike.%${searchTerm}%`)
        .order('codigo');

      if (error) {
        console.error('Error al buscar actividades económicas:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error en search de actividades económicas:', error);
      throw error;
    }
  }
}

export const actividadesEconomicasService = new ActividadesEconomicasService();


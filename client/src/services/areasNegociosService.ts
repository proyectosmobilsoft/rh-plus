import { supabase } from '@/services/supabaseClient';

export interface AreaNegocio {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateAreaNegocioData {
  codigo: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

export interface UpdateAreaNegocioData {
  codigo?: string;
  nombre?: string;
  descripcion?: string;
  activo?: boolean;
}

class AreasNegociosService {
  async getAll(): Promise<AreaNegocio[]> {
    try {
      const { data, error } = await supabase
        .from('gen_areas_negocios')
        .select('*')
        .order('codigo');

      if (error) {
        console.error('Error al obtener áreas de negocios:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error en getAll de áreas de negocios:', error);
      throw error;
    }
  }

  async getById(id: number): Promise<AreaNegocio | null> {
    try {
      const { data, error } = await supabase
        .from('gen_areas_negocios')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error al obtener área de negocio:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error en getById de área de negocio:', error);
      throw error;
    }
  }

  async create(areaNegocioData: CreateAreaNegocioData): Promise<AreaNegocio> {
    try {
      const { data, error } = await supabase
        .from('gen_areas_negocios')
        .insert([areaNegocioData])
        .select()
        .single();

      if (error) {
        console.error('Error al crear área de negocio:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error en create de área de negocio:', error);
      throw error;
    }
  }

  async update(id: number, areaNegocioData: UpdateAreaNegocioData): Promise<AreaNegocio> {
    try {
      const { data, error } = await supabase
        .from('gen_areas_negocios')
        .update({
          ...areaNegocioData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error al actualizar área de negocio:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error en update de área de negocio:', error);
      throw error;
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      // Primero verificar si el área de negocio está activa
      const { data: areaNegocio, error: fetchError } = await supabase
        .from('gen_areas_negocios')
        .select('activo')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        console.error('Error al verificar estado de área de negocio:', fetchError);
        throw fetchError;
      }
      
      if (areaNegocio?.activo === true) {
        throw new Error('No se puede eliminar un área de negocio activa. Primero desactívala.');
      }

      const { error } = await supabase
        .from('gen_areas_negocios')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error al eliminar área de negocio:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error en delete de área de negocio:', error);
      throw error;
    }
  }

  async activate(id: number): Promise<AreaNegocio> {
    try {
      const { data, error } = await supabase
        .from('gen_areas_negocios')
        .update({ 
          activo: true, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error al activar área de negocio:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error en activate de área de negocio:', error);
      throw error;
    }
  }

  async deactivate(id: number): Promise<AreaNegocio> {
    try {
      const { data, error } = await supabase
        .from('gen_areas_negocios')
        .update({ 
          activo: false, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error al desactivar área de negocio:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error en deactivate de área de negocio:', error);
      throw error;
    }
  }

  async search(searchTerm: string): Promise<AreaNegocio[]> {
    try {
      const { data, error } = await supabase
        .from('gen_areas_negocios')
        .select('*')
        .or(`codigo.ilike.%${searchTerm}%,nombre.ilike.%${searchTerm}%,descripcion.ilike.%${searchTerm}%`)
        .order('codigo');

      if (error) {
        console.error('Error al buscar áreas de negocios:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error en search de áreas de negocios:', error);
      throw error;
    }
  }
}

export const areasNegociosService = new AreasNegociosService();

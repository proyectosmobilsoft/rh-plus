import { supabase } from '@/services/supabaseClient';

export interface Proyecto {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateProyectoData {
  codigo: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

export interface UpdateProyectoData {
  codigo?: string;
  nombre?: string;
  descripcion?: string;
  activo?: boolean;
}

class ProyectosService {
  async getAll(): Promise<Proyecto[]> {
    try {
      const { data, error } = await supabase
        .from('gen_proyectos')
        .select('*')
        .order('codigo');

      if (error) {
        console.error('Error al obtener proyectos:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error en getAll de proyectos:', error);
      throw error;
    }
  }

  async getById(id: number): Promise<Proyecto | null> {
    try {
      const { data, error } = await supabase
        .from('gen_proyectos')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error al obtener proyecto:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error en getById de proyecto:', error);
      throw error;
    }
  }

  async create(proyectoData: CreateProyectoData): Promise<Proyecto> {
    try {
      const { data, error } = await supabase
        .from('gen_proyectos')
        .insert([proyectoData])
        .select()
        .single();

      if (error) {
        console.error('Error al crear proyecto:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error en create de proyecto:', error);
      throw error;
    }
  }

  async update(id: number, proyectoData: UpdateProyectoData): Promise<Proyecto> {
    try {
      const { data, error } = await supabase
        .from('gen_proyectos')
        .update({
          ...proyectoData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error al actualizar proyecto:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error en update de proyecto:', error);
      throw error;
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      // Primero verificar si el proyecto está activo
      const { data: proyecto, error: fetchError } = await supabase
        .from('gen_proyectos')
        .select('activo')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        console.error('Error al verificar estado de proyecto:', fetchError);
        throw fetchError;
      }
      
      if (proyecto?.activo === true) {
        throw new Error('No se puede eliminar un proyecto activo. Primero desactívalo.');
      }

      const { error } = await supabase
        .from('gen_proyectos')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error al eliminar proyecto:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error en delete de proyecto:', error);
      throw error;
    }
  }

  async activate(id: number): Promise<Proyecto> {
    try {
      const { data, error } = await supabase
        .from('gen_proyectos')
        .update({ 
          activo: true, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error al activar proyecto:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error en activate de proyecto:', error);
      throw error;
    }
  }

  async deactivate(id: number): Promise<Proyecto> {
    try {
      const { data, error } = await supabase
        .from('gen_proyectos')
        .update({ 
          activo: false, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error al desactivar proyecto:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error en deactivate de proyecto:', error);
      throw error;
    }
  }

  async search(searchTerm: string): Promise<Proyecto[]> {
    try {
      const { data, error } = await supabase
        .from('gen_proyectos')
        .select('*')
        .or(`codigo.ilike.%${searchTerm}%,nombre.ilike.%${searchTerm}%,descripcion.ilike.%${searchTerm}%`)
        .order('codigo');

      if (error) {
        console.error('Error al buscar proyectos:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error en search de proyectos:', error);
      throw error;
    }
  }
}

export const proyectosService = new ProyectosService();

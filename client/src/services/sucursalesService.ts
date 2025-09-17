import { supabase } from './supabaseClient';

export interface Sucursal {
  id: number;
  nombre: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  activo: boolean;
  codigo?: string;
  ciudad_id?: number;
  created_at?: string;
  updated_at?: string;
}

export const sucursalesService = {
  // Obtener todas las sucursales activas
  getAll: async (): Promise<Sucursal[]> => {
    const { data, error } = await supabase
      .from('gen_sucursales')
      .select('*')
      .eq('activo', true)
      .order('nombre', { ascending: true });
    
    if (error) {
      console.error('Error obteniendo sucursales:', error);
      throw error;
    }
    
    return data || [];
  },

  // Obtener todas las sucursales (incluyendo inactivas)
  getAllIncludingInactive: async (): Promise<Sucursal[]> => {
    const { data, error } = await supabase
      .from('gen_sucursales')
      .select('*')
      .order('nombre', { ascending: true });
    
    if (error) {
      console.error('Error obteniendo sucursales:', error);
      throw error;
    }
    
    return data || [];
  },

  // Obtener sucursal por ID
  getById: async (id: number): Promise<Sucursal | null> => {
    const { data, error } = await supabase
      .from('gen_sucursales')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error obteniendo sucursal por ID:', error);
      return null;
    }
    
    return data;
  },

  // Crear nueva sucursal
  create: async (sucursal: Omit<Sucursal, 'id' | 'created_at' | 'updated_at'>): Promise<Sucursal> => {
    const { data, error } = await supabase
      .from('gen_sucursales')
      .insert([sucursal])
      .select()
      .single();
    
    if (error) {
      console.error('Error creando sucursal:', error);
      throw error;
    }
    
    return data;
  },

  // Actualizar sucursal
  update: async (id: number, updates: Partial<Sucursal>): Promise<Sucursal> => {
    const { data, error } = await supabase
      .from('gen_sucursales')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error actualizando sucursal:', error);
      throw error;
    }
    
    return data;
  },

  // Eliminar sucursal (soft delete)
  delete: async (id: number): Promise<void> => {
    const { error } = await supabase
      .from('gen_sucursales')
      .update({ activo: false })
      .eq('id', id);
    
    if (error) {
      console.error('Error eliminando sucursal:', error);
      throw error;
    }
  },

  // Activar sucursal
  activate: async (id: number): Promise<void> => {
    const { error } = await supabase
      .from('gen_sucursales')
      .update({ activo: true })
      .eq('id', id);
    
    if (error) {
      console.error('Error activando sucursal:', error);
      throw error;
    }
  },

  // Obtener sucursales con información de ciudad
  getWithCityInfo: async (): Promise<(Sucursal & { ciudad?: { nombre: string } })[]> => {
    const { data, error } = await supabase
      .from('gen_sucursales')
      .select(`
        *,
        ciudades!ciudad_id (
          nombre
        )
      `)
      .eq('activo', true)
      .order('nombre', { ascending: true });
    
    if (error) {
      console.error('Error obteniendo sucursales con información de ciudad:', error);
      throw error;
    }
    
    return data || [];
  }
};
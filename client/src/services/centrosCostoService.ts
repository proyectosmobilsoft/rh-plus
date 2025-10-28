import { supabase } from '@/services/supabaseClient';

export interface CentroCosto {
  id: number;
  codigo: string;
  nombre: string;
  sucursal_id?: number;
  area_negocio?: string;
  porcentaje_estructura?: number;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
  sucursal?: {
    id: number;
    nombre: string;
    codigo?: string;
  };
}

export interface CreateCentroCostoData {
  codigo: string;
  nombre: string;
  sucursal_id?: number;
  area_negocio?: string;
  porcentaje_estructura?: number;
  activo: boolean;
}

export interface UpdateCentroCostoData {
  codigo?: string;
  nombre?: string;
  sucursal_id?: number;
  area_negocio?: string;
  porcentaje_estructura?: number;
  activo?: boolean;
}

class CentrosCostoService {
  async getAll(): Promise<CentroCosto[]> {
    try {
      const { data, error } = await supabase
        .from('centros_costo')
        .select(`
          *,
          sucursal:gen_sucursales(
            id,
            nombre,
            codigo
          )
        `)
        .eq('activo', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching centros de costo:', error);
      throw error;
    }
  }

  async getAllIncludingInactive(): Promise<CentroCosto[]> {
    try {
      const { data, error } = await supabase
        .from('centros_costo')
        .select(`
          *,
          sucursal:gen_sucursales(
            id,
            nombre,
            codigo
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching centros de costo:', error);
      throw error;
    }
  }

  async getById(id: number): Promise<CentroCosto | null> {
    try {
      const { data, error } = await supabase
        .from('centros_costo')
        .select(`
          *,
          sucursal:gen_sucursales(
            id,
            nombre,
            codigo
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching centro de costo:', error);
      throw error;
    }
  }

  async create(centroCostoData: CreateCentroCostoData): Promise<CentroCosto> {
    try {
      const { data, error } = await supabase
        .from('centros_costo')
        .insert([centroCostoData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating centro de costo:', error);
      throw error;
    }
  }

  async update(id: number, centroCostoData: UpdateCentroCostoData): Promise<CentroCosto> {
    try {
      const { data, error } = await supabase
        .from('centros_costo')
        .update({
          ...centroCostoData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating centro de costo:', error);
      throw error;
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('centros_costo')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting centro de costo:', error);
      throw error;
    }
  }

  async activate(id: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('centros_costo')
        .update({ 
          activo: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error activating centro de costo:', error);
      throw error;
    }
  }

  async deactivate(id: number): Promise<boolean> {
    try {
      console.log('🔄 Servicio: Iniciando deactivate para centro de costo ID:', id);
      const { error } = await supabase
        .from('centros_costo')
        .update({ 
          activo: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('❌ Servicio: Error en la consulta de deactivate:', error);
        throw error;
      }
      console.log('✅ Servicio: deactivate ejecutado exitosamente');
      return true;
    } catch (error) {
      console.error('❌ Servicio: Error deactivating centro de costo:', error);
      throw error;
    }
  }

  async getBySucursal(sucursalId: number): Promise<CentroCosto[]> {
    try {
      const { data, error } = await supabase
        .from('centros_costo')
        .select(`
          *,
          sucursal:gen_sucursales(
            id,
            nombre,
            codigo
          )
        `)
        .eq('sucursal_id', sucursalId)
        .eq('activo', true)
        .order('nombre');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching centros de costo by sucursal:', error);
      throw error;
    }
  }

  async search(query: string): Promise<CentroCosto[]> {
    try {
      const { data, error } = await supabase
        .from('centros_costo')
        .select(`
          *,
          sucursal:gen_sucursales(
            id,
            nombre,
            codigo
          )
        `)
        .or(`nombre.ilike.%${query}%,codigo.ilike.%${query}%`)
        .eq('activo', true)
        .order('nombre');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching centros de costo:', error);
      throw error;
    }
  }
}

export const centrosCostoService = new CentrosCostoService();


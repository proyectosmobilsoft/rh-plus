import { supabase } from '@/services/supabaseClient';
import { handleServiceError, logError } from '@/utils/errorHandler';

export interface CentroCosto {
  id: number;
  codigo: string;
  nombre: string;
  sucursal_id?: number;
  empresa_id?: number;
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
  empresa?: {
    id: number;
    razon_social: string;
  };
}

export interface CreateCentroCostoData {
  codigo: string;
  nombre: string;
  sucursal_id?: number;
  empresa_id?: number;
  area_negocio?: string;
  porcentaje_estructura?: number;
  activo: boolean;
}

export interface UpdateCentroCostoData {
  codigo?: string;
  nombre?: string;
  sucursal_id?: number;
  empresa_id?: number;
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
          ),
          empresa:empresas(
            id,
            razon_social
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
          ),
          empresa:empresas(
            id,
            razon_social
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
      console.log('🔄 Obteniendo centro de costo por ID:', id);
      
      const { data, error } = await supabase
        .from('centros_costo')
        .select(`
          *,
          sucursal:gen_sucursales(
            id,
            nombre,
            codigo
          ),
          empresa:empresas(
            id,
            razon_social
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        logError('obtener centro de costo por ID', error);
        if (error.code === 'PGRST116') {
          return null; // No encontrado
        }
        throw error;
      }
      
      console.log('✅ Centro de costo obtenido:', data);
      return data;
    } catch (error) {
      logError('getById centro de costo', error);
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

      if (error) {
        logError('crear centro de costo', error);
        throw new Error(handleServiceError(error, 'Error al crear el centro de costo'));
      }
      return data;
    } catch (error) {
      logError('create centro de costo', error);
      throw error;
    }
  }

  async update(id: number, centroCostoData: UpdateCentroCostoData): Promise<CentroCosto> {
    try {
      console.log('🔄 Actualizando centro de costo ID:', id, 'con datos:', centroCostoData);
      
      // Primero verificar que el registro existe
      const { data: existingData, error: checkError } = await supabase
        .from('centros_costo')
        .select('id, activo')
        .eq('id', id);

      console.log('🔍 Verificación de existencia - ID:', id, 'Datos encontrados:', existingData, 'Error:', checkError);

      if (checkError) {
        logError('verificar existencia centro de costo', checkError);
        throw new Error('El centro de costo no existe o no se puede encontrar');
      }

      if (!existingData || existingData.length === 0) {
        throw new Error('El centro de costo no existe');
      }

      console.log('✅ Centro de costo encontrado, procediendo con actualización...');

      // Filtrar solo los campos que realmente necesitan ser actualizados
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      // Solo incluir campos que tienen valores válidos
      if (centroCostoData.codigo !== undefined) updateData.codigo = centroCostoData.codigo;
      if (centroCostoData.nombre !== undefined) updateData.nombre = centroCostoData.nombre;
      if (centroCostoData.sucursal_id !== undefined) updateData.sucursal_id = centroCostoData.sucursal_id;
      if (centroCostoData.empresa_id !== undefined) updateData.empresa_id = centroCostoData.empresa_id;
      if (centroCostoData.area_negocio !== undefined) updateData.area_negocio = centroCostoData.area_negocio;
      if (centroCostoData.porcentaje_estructura !== undefined) updateData.porcentaje_estructura = centroCostoData.porcentaje_estructura;
      if (centroCostoData.activo !== undefined) updateData.activo = centroCostoData.activo;

      console.log('📝 Datos filtrados para actualización:', updateData);

      // Realizar la actualización sin .single() para evitar el error PGRST116
      const { data, error } = await supabase
        .from('centros_costo')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          sucursal:gen_sucursales(
            id,
            nombre,
            codigo
          ),
          empresa:empresas(
            id,
            razon_social
          )
        `);

      if (error) {
        logError('actualizar centro de costo', error);
        throw new Error(handleServiceError(error, 'Error al actualizar el centro de costo'));
      }

      if (!data || data.length === 0) {
        throw new Error('No se pudo actualizar el centro de costo. El registro puede no existir.');
      }

      console.log('✅ Centro de costo actualizado exitosamente:', data[0]);
      return data[0];
    } catch (error) {
      logError('update centro de costo', error);
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
          ),
          empresa:empresas(
            id,
            razon_social
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
          ),
          empresa:empresas(
            id,
            razon_social
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


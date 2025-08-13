import { supabase } from './supabaseClient';
import { 
  TipoDocumento, 
  CreateTipoDocumentoData, 
  UpdateTipoDocumentoData 
} from '@/types/maestro';

export const tiposDocumentosService = {
  // Obtener todos los tipos de documentos
  async getAll(): Promise<TipoDocumento[]> {
    console.log('🔍 tiposDocumentosService.getAll - Ejecutando query...');
    const { data, error } = await supabase
      .from('tipos_documentos')
      .select('*')
      .order('nombre');

    if (error) {
      console.error('🔍 tiposDocumentosService.getAll - Error:', error);
      throw new Error(`Error al obtener tipos de documentos: ${error.message}`);
    }

    console.log('🔍 tiposDocumentosService.getAll - Datos obtenidos:', data);
    return data || [];
  },

  // Obtener tipos de documentos activos
  async getActive(): Promise<TipoDocumento[]> {
    console.log('🔍 tiposDocumentosService.getActive - Ejecutando query...');
    const { data, error } = await supabase
      .from('tipos_documentos')
      .select('*')
      .eq('activo', true)
      .order('nombre');

    if (error) {
      console.error('🔍 tiposDocumentosService.getActive - Error:', error);
      throw new Error(`Error al obtener tipos de documentos activos: ${error.message}`);
    }

    console.log('🔍 tiposDocumentosService.getActive - Datos obtenidos:', data);
    return data || [];
  },



  // Obtener un tipo de documento por ID
  async getById(id: number): Promise<TipoDocumento | null> {
    const { data, error } = await supabase
      .from('tipos_documentos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No encontrado
      }
      throw new Error(`Error al obtener tipo de documento: ${error.message}`);
    }

    return data;
  },

  // Crear un nuevo tipo de documento
  async create(data: CreateTipoDocumentoData): Promise<TipoDocumento> {
    console.log('🔍 tiposDocumentosService.create - Creando nuevo tipo de documento:', data);
    const { data: newTipo, error } = await supabase
      .from('tipos_documentos')
      .insert([{ ...data, activo: data.activo ?? true }])
      .select()
      .single();

    if (error) {
      console.error('🔍 tiposDocumentosService.create - Error:', error);
      throw new Error(`Error al crear tipo de documento: ${error.message}`);
    }

    console.log('🔍 tiposDocumentosService.create - Tipo creado exitosamente:', newTipo);
    return newTipo;
  },

  // Actualizar un tipo de documento
  async update(id: number, data: UpdateTipoDocumentoData): Promise<TipoDocumento> {
    const { data: updatedTipo, error } = await supabase
      .from('tipos_documentos')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al actualizar tipo de documento: ${error.message}`);
    }

    return updatedTipo;
  },

  // Eliminar un tipo de documento (soft delete)
  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('tipos_documentos')
      .update({ activo: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw new Error(`Error al eliminar tipo de documento: ${error.message}`);
    }
  },

  // Activar un tipo de documento
  async activate(id: number): Promise<void> {
    const { error } = await supabase
      .from('tipos_documentos')
      .update({ activo: true, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw new Error(`Error al activar tipo de documento: ${error.message}`);
    }
  },

  // Verificar si existe un tipo de documento por nombre
  async existsByName(nombre: string, excludeId?: number): Promise<boolean> {
    let query = supabase
      .from('tipos_documentos')
      .select('id')
      .eq('nombre', nombre);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error al verificar existencia: ${error.message}`);
    }

    return (data?.length || 0) > 0;
  }
};

// Re-exportar tipos para compatibilidad
export type { TipoDocumento, CreateTipoDocumentoData, UpdateTipoDocumentoData }; 
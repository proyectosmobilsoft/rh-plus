
import { supabase } from './supabaseClient';
import { 
  Motivo, 
  CreateMotivoData, 
  UpdateMotivoData 
} from '@/types/maestro';

export const motivosService = {
  // Obtener todos los motivos
  async getAll(): Promise<Motivo[]> {
    const { data, error } = await supabase
      .from('novedades_motivos')
      .select('id, codigo, nombre, descripcion, tipo, empresa_id, requiere_adjunto, adjunto_obligatorio, requiere_observacion, requiere_comite, activo, created_at')
      .order('nombre');

    if (error) {
      console.error('🔍 motivosService.getAll - Error:', error);
      throw new Error(`Error al obtener motivos: ${error.message}`);
    }

    return data || [];
  },

  // Obtener motivos activos
  async getActive(): Promise<Motivo[]> {
    const { data, error } = await supabase
      .from('novedades_motivos')
      .select('id, codigo, nombre, descripcion, tipo, empresa_id, requiere_adjunto, adjunto_obligatorio, requiere_observacion, requiere_comite, activo, created_at')
      .eq('activo', true)
      .order('nombre');

    if (error) {
      console.error('🔍 motivosService.getActive - Error:', error);
      throw new Error(`Error al obtener motivos activos: ${error.message}`);
    }

    return data || [];
  },

  // Obtener un motivo por ID
  async getById(id: number): Promise<Motivo | null> {
    const { data, error } = await supabase
      .from('novedades_motivos')
      .select('id, codigo, nombre, descripcion, tipo, empresa_id, requiere_adjunto, adjunto_obligatorio, requiere_observacion, requiere_comite, activo, created_at')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No encontrado
      }
      throw new Error(`Error al obtener motivo: ${error.message}`);
    }

    return data;
  },

  // Crear un nuevo motivo
  async create(data: CreateMotivoData): Promise<Motivo> {
    const { data: newMotivo, error } = await supabase
      .from('novedades_motivos')
      .insert([{ ...data, activo: data.activo ?? true }])
      .select()
      .single();

    if (error) {
      throw new Error(`Error al crear motivo: ${error.message}`);
    }

    return newMotivo;
  },

  // Actualizar un motivo
  async update(id: number, data: UpdateMotivoData): Promise<Motivo> {
    const { data: updatedMotivo, error } = await supabase
      .from('novedades_motivos')
      .update({ ...data })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al actualizar motivo: ${error.message}`);
    }

    return updatedMotivo;
  },

  // Eliminar un motivo (soft delete)
  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('novedades_motivos')
      .update({ activo: false })
      .eq('id', id);

    if (error) {
      throw new Error(`Error al eliminar motivo: ${error.message}`);
    }
  },

  // Activar un motivo
  async activate(id: number): Promise<void> {
    const { error } = await supabase
      .from('novedades_motivos')
      .update({ activo: true })
      .eq('id', id);

    if (error) {
      throw new Error(`Error al activar motivo: ${error.message}`);
    }
  },

  // Verificar si existe un motivo por nombre
  async existsByName(nombre: string, excludeId?: number): Promise<boolean> {
    let query = supabase
      .from('novedades_motivos')
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

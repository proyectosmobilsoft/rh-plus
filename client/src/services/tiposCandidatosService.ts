import { supabase } from './supabaseClient';
import { 
  TipoCandidato, 
  CreateTipoCandidatoData, 
  UpdateTipoCandidatoData 
} from '@/types/maestro';

export const tiposCandidatosService = {
  // Obtener todos los tipos de candidatos
  async getAll(): Promise<TipoCandidato[]> {
    const { data, error } = await supabase
      .from('tipos_candidatos')
      .select('*')
      .order('nombre');

    if (error) {
      throw new Error(`Error al obtener tipos de candidatos: ${error.message}`);
    }

    return data || [];
  },

  // Obtener tipos de candidatos activos
  async getActive(): Promise<TipoCandidato[]> {
    const { data, error } = await supabase
      .from('tipos_candidatos')
      .select('*')
      .eq('activo', true)
      .order('nombre');

    if (error) {
      throw new Error(`Error al obtener tipos de candidatos activos: ${error.message}`);
    }

    return data || [];
  },

  // Obtener un tipo de candidato por ID
  async getById(id: number): Promise<TipoCandidato | null> {
    const { data, error } = await supabase
      .from('tipos_candidatos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No encontrado
      }
      throw new Error(`Error al obtener tipo de candidato: ${error.message}`);
    }

    return data;
  },

  // Crear un nuevo tipo de candidato
  async create(data: CreateTipoCandidatoData): Promise<TipoCandidato> {
    const { data: newTipo, error } = await supabase
      .from('tipos_candidatos')
      .insert([data])
      .select()
      .single();

    if (error) {
      throw new Error(`Error al crear tipo de candidato: ${error.message}`);
    }

    return newTipo;
  },

  // Actualizar un tipo de candidato
  async update(id: number, data: UpdateTipoCandidatoData): Promise<TipoCandidato> {
    const { data: updatedTipo, error } = await supabase
      .from('tipos_candidatos')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al actualizar tipo de candidato: ${error.message}`);
    }

    return updatedTipo;
  },

  // Eliminar un tipo de candidato (soft delete)
  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('tipos_candidatos')
      .update({ activo: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw new Error(`Error al eliminar tipo de candidato: ${error.message}`);
    }
  },

  // Activar un tipo de candidato
  async activate(id: number): Promise<void> {
    const { error } = await supabase
      .from('tipos_candidatos')
      .update({ activo: true, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw new Error(`Error al activar tipo de candidato: ${error.message}`);
    }
  },

  // Verificar si existe un tipo de candidato por nombre
  async existsByName(nombre: string, excludeId?: number): Promise<boolean> {
    let query = supabase
      .from('tipos_candidatos')
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
export type { TipoCandidato, CreateTipoCandidatoData, UpdateTipoCandidatoData }; 
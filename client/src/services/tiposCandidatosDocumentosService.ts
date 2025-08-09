import { supabase } from './supabaseClient';
import { 
  TipoCandidatoDocumento, 
  CreateTipoCandidatoDocumentoData, 
  UpdateTipoCandidatoDocumentoData,
  TipoCandidatoDocumentoConDetalles
} from '@/types/maestro';

export const tiposCandidatosDocumentosService = {
  // Obtener documentos requeridos para un tipo de candidato
  async getByTipoCandidato(tipoCandidatoId: number): Promise<TipoCandidatoDocumento[]> {
    const { data, error } = await supabase
      .from('tipos_candidatos_documentos')
      .select('*')
      .eq('tipo_candidato_id', tipoCandidatoId)
      .order('orden');

    if (error) {
      throw new Error(`Error al obtener documentos del tipo de candidato: ${error.message}`);
    }

    return data || [];
  },

  // Obtener todos los documentos requeridos con información completa
  async getByTipoCandidatoWithDetails(tipoCandidatoId: number): Promise<TipoCandidatoDocumentoConDetalles[]> {
    const { data, error } = await supabase
      .from('tipos_candidatos_documentos')
      .select(`
        *,
        tipos_documentos (
          id,
          nombre,
          descripcion,
          requerido,
          activo
        )
      `)
      .eq('tipo_candidato_id', tipoCandidatoId)
      .order('orden');

    if (error) {
      throw new Error(`Error al obtener documentos del tipo de candidato: ${error.message}`);
    }

    return data || [];
  },

  // Crear una nueva relación tipo candidato - documento
  async create(data: CreateTipoCandidatoDocumentoData): Promise<TipoCandidatoDocumento> {
    const { data: newRelacion, error } = await supabase
      .from('tipos_candidatos_documentos')
      .insert([data])
      .select()
      .single();

    if (error) {
      throw new Error(`Error al crear relación tipo candidato - documento: ${error.message}`);
    }

    return newRelacion;
  },

  // Actualizar una relación tipo candidato - documento
  async update(id: number, data: UpdateTipoCandidatoDocumentoData): Promise<TipoCandidatoDocumento> {
    const { data: updatedRelacion, error } = await supabase
      .from('tipos_candidatos_documentos')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al actualizar relación tipo candidato - documento: ${error.message}`);
    }

    return updatedRelacion;
  },

  // Eliminar una relación tipo candidato - documento
  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('tipos_candidatos_documentos')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error al eliminar relación tipo candidato - documento: ${error.message}`);
    }
  },

  // Eliminar todas las relaciones de un tipo de candidato
  async deleteByTipoCandidato(tipoCandidatoId: number): Promise<void> {
    const { error } = await supabase
      .from('tipos_candidatos_documentos')
      .delete()
      .eq('tipo_candidato_id', tipoCandidatoId);

    if (error) {
      throw new Error(`Error al eliminar relaciones del tipo de candidato: ${error.message}`);
    }
  },

  // Actualizar múltiples documentos para un tipo de candidato
  async updateDocumentosForTipoCandidato(
    tipoCandidatoId: number, 
    documentos: Array<{ tipo_documento_id: number; obligatorio: boolean; orden: number }>
  ): Promise<void> {
    // Primero eliminar todas las relaciones existentes
    await this.deleteByTipoCandidato(tipoCandidatoId);

    // Luego crear las nuevas relaciones
    if (documentos.length > 0) {
      const relaciones = documentos.map(doc => ({
        tipo_candidato_id: tipoCandidatoId,
        tipo_documento_id: doc.tipo_documento_id,
        obligatorio: doc.obligatorio,
        orden: doc.orden
      }));

      const { error } = await supabase
        .from('tipos_candidatos_documentos')
        .insert(relaciones);

      if (error) {
        throw new Error(`Error al actualizar documentos del tipo de candidato: ${error.message}`);
      }
    }
  },

  // Verificar si existe una relación
  async exists(tipoCandidatoId: number, tipoDocumentoId: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('tipos_candidatos_documentos')
      .select('id')
      .eq('tipo_candidato_id', tipoCandidatoId)
      .eq('tipo_documento_id', tipoDocumentoId);

    if (error) {
      throw new Error(`Error al verificar existencia de relación: ${error.message}`);
    }

    return (data?.length || 0) > 0;
  },

  // Obtener el siguiente orden disponible para un tipo de candidato
  async getNextOrden(tipoCandidatoId: number): Promise<number> {
    const { data, error } = await supabase
      .from('tipos_candidatos_documentos')
      .select('orden')
      .eq('tipo_candidato_id', tipoCandidatoId)
      .order('orden', { ascending: false })
      .limit(1);

    if (error) {
      throw new Error(`Error al obtener siguiente orden: ${error.message}`);
    }

    return data && data.length > 0 ? (data[0].orden + 1) : 0;
  },

  // Obtener el conteo de documentos asociados a un tipo de candidato
  async getDocumentosCount(tipoCandidatoId: number): Promise<number> {
    const { count, error } = await supabase
      .from('tipos_candidatos_documentos')
      .select('*', { count: 'exact', head: true })
      .eq('tipo_candidato_id', tipoCandidatoId);

    if (error) {
      throw new Error(`Error al obtener conteo de documentos: ${error.message}`);
    }

    return count || 0;
  },

  // Obtener conteos para múltiples tipos de candidatos
  async getDocumentosCounts(tiposCandidatosIds: number[]): Promise<Record<number, number>> {
    if (tiposCandidatosIds.length === 0) return {};

    const { data, error } = await supabase
      .from('tipos_candidatos_documentos')
      .select('tipo_candidato_id')
      .in('tipo_candidato_id', tiposCandidatosIds);

    if (error) {
      throw new Error(`Error al obtener conteos de documentos: ${error.message}`);
    }

    // Contar manualmente los documentos por tipo de candidato
    const counts: Record<number, number> = {};
    tiposCandidatosIds.forEach(id => {
      counts[id] = 0;
    });

    data?.forEach(item => {
      counts[item.tipo_candidato_id] = (counts[item.tipo_candidato_id] || 0) + 1;
    });

    return counts;
  }
};

// Re-exportar tipos para compatibilidad
export type { 
  TipoCandidatoDocumento, 
  CreateTipoCandidatoDocumentoData, 
  UpdateTipoCandidatoDocumentoData,
  TipoCandidatoDocumentoConDetalles
}; 
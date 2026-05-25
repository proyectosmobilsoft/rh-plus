import { supabase } from '@/services/supabaseClient';

export interface MotivoRenuncia {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateMotivoRenunciaData {
  codigo: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

export interface UpdateMotivoRenunciaData {
  codigo?: string;
  nombre?: string;
  descripcion?: string;
  activo?: boolean;
}

class MotivosRenunciaService {
  async getAll(): Promise<MotivoRenuncia[]> {
    try {
      const { data, error } = await supabase
        .from('gen_motivos_renuncia')
        .select('id, codigo, nombre, descripcion, activo, created_at, updated_at')
        .order('nombre');

      if (error) {
        console.error('Error al obtener motivos de renuncia:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error en getAll de motivos de renuncia:', error);
      throw error;
    }
  }

  async getAllActivos(): Promise<MotivoRenuncia[]> {
    try {
      const { data, error } = await supabase
        .from('gen_motivos_renuncia')
        .select('id, codigo, nombre, descripcion, activo, created_at, updated_at')
        .eq('activo', true)
        .order('nombre');

      if (error) {
        console.error('Error al obtener motivos de renuncia activos:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error en getAllActivos de motivos de renuncia:', error);
      throw error;
    }
  }

  async getById(id: number): Promise<MotivoRenuncia | null> {
    try {
      const { data, error } = await supabase
        .from('gen_motivos_renuncia')
        .select('id, codigo, nombre, descripcion, activo, created_at, updated_at')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error al obtener motivo de renuncia:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error en getById de motivo de renuncia:', error);
      throw error;
    }
  }

  async create(motivoData: CreateMotivoRenunciaData): Promise<MotivoRenuncia> {
    try {
      const { data, error } = await supabase
        .from('gen_motivos_renuncia')
        .insert([motivoData])
        .select()
        .single();

      if (error) {
        console.error('Error al crear motivo de renuncia:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error en create de motivo de renuncia:', error);
      throw error;
    }
  }

  async update(id: number, motivoData: UpdateMotivoRenunciaData): Promise<MotivoRenuncia> {
    try {
      const { data, error } = await supabase
        .from('gen_motivos_renuncia')
        .update({
          ...motivoData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error al actualizar motivo de renuncia:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error en update de motivo de renuncia:', error);
      throw error;
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      const { data: motivo, error: fetchError } = await supabase
        .from('gen_motivos_renuncia')
        .select('activo')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Error al verificar estado del motivo:', fetchError);
        throw fetchError;
      }

      if (motivo?.activo === true) {
        throw new Error('No se puede eliminar un motivo activo. Primero desactívalo.');
      }

      const { error } = await supabase
        .from('gen_motivos_renuncia')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error al eliminar motivo de renuncia:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error en delete de motivo de renuncia:', error);
      throw error;
    }
  }

  async activate(id: number): Promise<MotivoRenuncia> {
    try {
      const { data, error } = await supabase
        .from('gen_motivos_renuncia')
        .update({ activo: true, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error al activar motivo de renuncia:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error en activate de motivo de renuncia:', error);
      throw error;
    }
  }

  async deactivate(id: number): Promise<MotivoRenuncia> {
    try {
      const { data, error } = await supabase
        .from('gen_motivos_renuncia')
        .update({ activo: false, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error al desactivar motivo de renuncia:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error en deactivate de motivo de renuncia:', error);
      throw error;
    }
  }
}

export const motivosRenunciaService = new MotivosRenunciaService();

import { supabase } from './supabaseClient';

export interface PrestadorHorario {
  id?: number;
  prestador_id: number;
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
  created_at?: string;
  updated_at?: string;
}

export interface PrestadorHorarioCreate {
  prestador_id: number;
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
}

class PrestadoresHorariosService {
  // Obtener todos los horarios de un prestador
  async getByPrestadorId(prestadorId: number): Promise<PrestadorHorario[]> {
    const { data, error } = await supabase
      .from('prestadores_horarios')
      .select('*')
      .eq('prestador_id', prestadorId)
      .order('dia_semana', { ascending: true });

    if (error) {
      throw new Error(`Error al obtener horarios: ${error.message}`);
    }

    return data || [];
  }

  // Crear un horario
  async create(horario: PrestadorHorarioCreate): Promise<PrestadorHorario> {
    const { data, error } = await supabase
      .from('prestadores_horarios')
      .insert([horario])
      .select()
      .single();

    if (error) {
      throw new Error(`Error al crear horario: ${error.message}`);
    }

    return data;
  }

  // Crear múltiples horarios
  async createMultiple(horarios: PrestadorHorarioCreate[]): Promise<PrestadorHorario[]> {
    const { data, error } = await supabase
      .from('prestadores_horarios')
      .insert(horarios)
      .select();

    if (error) {
      throw new Error(`Error al crear horarios: ${error.message}`);
    }

    return data || [];
  }

  // Actualizar un horario
  async update(id: number, horario: Partial<PrestadorHorarioCreate>): Promise<PrestadorHorario> {
    const { data, error } = await supabase
      .from('prestadores_horarios')
      .update(horario)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al actualizar horario: ${error.message}`);
    }

    return data;
  }

  // Eliminar un horario
  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('prestadores_horarios')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error al eliminar horario: ${error.message}`);
    }
  }

  // Eliminar todos los horarios de un prestador
  async deleteByPrestadorId(prestadorId: number): Promise<void> {
    const { error } = await supabase
      .from('prestadores_horarios')
      .delete()
      .eq('prestador_id', prestadorId);

    if (error) {
      throw new Error(`Error al eliminar horarios del prestador: ${error.message}`);
    }
  }

  // Sincronizar horarios (eliminar todos y crear nuevos)
  async syncHorarios(prestadorId: number, horarios: PrestadorHorarioCreate[]): Promise<PrestadorHorario[]> {
    // Primero eliminar todos los horarios existentes
    await this.deleteByPrestadorId(prestadorId);
    
    // Si no hay horarios nuevos, retornar array vacío
    if (horarios.length === 0) {
      return [];
    }

    // Crear los nuevos horarios
    return await this.createMultiple(horarios);
  }
}

export const prestadoresHorariosService = new PrestadoresHorariosService();

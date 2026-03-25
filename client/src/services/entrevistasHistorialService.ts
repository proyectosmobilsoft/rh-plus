import { supabase } from './supabaseClient';

export type AccionEntrevista = 'programada' | 'aplazada' | 'cancelada' | 'reprogramada' | 'realizada';

export interface EntrevistaHistorial {
  id?: number;
  candidato_id: number;
  accion: AccionEntrevista;
  fecha_entrevista?: string;
  hora_entrevista?: string;
  lugar_entrevista?: string;
  motivo?: string;
  observaciones?: string;
  created_at?: string;
  created_by?: string;
}

const ACCION_LABELS: Record<AccionEntrevista, string> = {
  programada: 'Programada',
  aplazada: 'Aplazada',
  cancelada: 'Cancelada',
  reprogramada: 'Reprogramada',
  realizada: 'Realizada',
};

export const entrevistasHistorialService = {
  getAccionLabel(accion: AccionEntrevista): string {
    return ACCION_LABELS[accion] || accion;
  },

  async getByCandidato(candidatoId: number): Promise<EntrevistaHistorial[]> {
    const { data, error } = await supabase
      .from('entrevistas_historial')
      .select('*')
      .eq('candidato_id', candidatoId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async create(registro: Omit<EntrevistaHistorial, 'id' | 'created_at'>): Promise<EntrevistaHistorial> {
    const { data, error } = await supabase
      .from('entrevistas_historial')
      .insert(registro)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async countByAccion(candidatoId: number, accion: AccionEntrevista): Promise<number> {
    const { count, error } = await supabase
      .from('entrevistas_historial')
      .select('*', { count: 'exact', head: true })
      .eq('candidato_id', candidatoId)
      .eq('accion', accion);

    if (error) throw error;
    return count || 0;
  },
};

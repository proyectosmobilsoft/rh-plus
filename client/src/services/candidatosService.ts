import { supabase } from './supabaseClient';

export interface Candidato {
  id?: number;
  tipo_documento: string;
  numero_documento: string;
  primer_nombre: string;
  segundo_nombre?: string;
  primer_apellido: string;
  segundo_apellido?: string;
  email: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  empresa_id: number; // Relación con empresa
}

export interface DocumentoCandidato {
  id: number;
  candidato_id: number;
  tipo: string;
  nombre_archivo: string;
  url_archivo: string;
  created_at: string;
  updated_at: string;
}

export const candidatosService = {
  getAll: async (): Promise<Candidato[]> => {
    const { data, error } = await supabase.from('candidatos').select('*');
    if (error) throw error;
    return data || [];
  },

  // Obtener candidato por número de documento (cédula)
  getByDocumento: async (numeroDocumento: string): Promise<Candidato | null> => {
    const { data, error } = await supabase
      .from('candidatos')
      .select('*')
      .eq('numero_documento', numeroDocumento)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Obtener documentos de un candidato
  getDocumentos: async (candidatoId: number): Promise<DocumentoCandidato[]> => {
    const { data, error } = await supabase
      .from('documentos_candidato')
      .select('*')
      .eq('candidato_id', candidatoId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  create: async (candidato: Partial<Candidato>): Promise<Candidato | null> => {
    const { data, error } = await supabase.from('candidatos').insert([candidato]).select();
    if (error) throw error;
    return data ? data[0] : null;
  },
  update: async (id: number, candidato: Partial<Candidato>): Promise<Candidato | null> => {
    const { data, error } = await supabase.from('candidatos').update(candidato).eq('id', id).select();
    if (error) throw error;
    return data ? data[0] : null;
  },
  delete: async (id: number): Promise<void> => {
    const { error } = await supabase.from('candidatos').delete().eq('id', id);
    if (error) throw error;
  },
};
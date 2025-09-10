import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/services/supabaseClient';

export interface TipoCandidato {
  id: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export const useTiposCandidatos = () => {
  return useQuery({
    queryKey: ['tipos-candidatos'],
    queryFn: async (): Promise<TipoCandidato[]> => {
      const { data, error } = await supabase
        .from('tipos_candidatos')
        .select('*')
        .eq('activo', true)
        .order('nombre');

      if (error) {
        throw error;
      }

      return data || [];
    },
  });
};

export const useTipoCandidato = (id: number) => {
  return useQuery({
    queryKey: ['tipo-candidato', id],
    queryFn: async (): Promise<TipoCandidato | null> => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('tipos_candidatos')
        .select('*')
        .eq('id', id)
        .eq('activo', true)
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    enabled: !!id,
  });
};
import { supabase } from './supabaseClient';

// Función para obtener el contexto de loading
const getLoadingContext = () => {
  // Intentar obtener el contexto de loading si está disponible
  try {
    const { useLoading } = require('@/contexts/LoadingContext');
    return useLoading();
  } catch {
    // Si no está disponible, retornar funciones vacías
    return {
      startLoading: () => {},
      stopLoading: () => {}
    };
  }
};

export interface RegimenTributario {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Obtiene todos los regímenes tributarios activos
 */
export const getRegimenesTributarios = async (): Promise<RegimenTributario[]> => {
  const { startLoading, stopLoading } = getLoadingContext();
  
  try {
    startLoading();
    const { data, error } = await supabase
      .from('regimen_tributario')
      .select('*')
      .eq('activo', true)
      .order('nombre');

    if (error) {
      console.error('Error al obtener regímenes tributarios:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error en getRegimenesTributarios:', error);
    return [];
  } finally {
    stopLoading();
  }
};

/**
 * Obtiene un régimen tributario por ID
 */
export const getRegimenTributarioById = async (id: number): Promise<RegimenTributario | null> => {
  try {
    const { data, error } = await supabase
      .from('regimen_tributario')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error al obtener régimen tributario:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error en getRegimenTributarioById:', error);
    return null;
  }
};

/**
 * Obtiene un régimen tributario por código
 */
export const getRegimenTributarioByCodigo = async (codigo: string): Promise<RegimenTributario | null> => {
  try {
    const { data, error } = await supabase
      .from('regimen_tributario')
      .select('*')
      .eq('codigo', codigo)
      .single();

    if (error) {
      console.error('Error al obtener régimen tributario por código:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error en getRegimenTributarioByCodigo:', error);
    return null;
  }
};

// Exportar el servicio completo
export const regimenTributarioService = {
  getAll: getRegimenesTributarios,
  getById: getRegimenTributarioById,
  getByCodigo: getRegimenTributarioByCodigo
}; 


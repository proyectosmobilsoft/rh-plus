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

export interface Plantilla {
  id: number;
  nombre: string;
  descripcion?: string;
  estructura_formulario?: any;
  es_default?: boolean;
  activa?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Obtiene todas las plantillas de solicitudes
 */
export const getAllPlantillas = async (): Promise<Plantilla[]> => {
  const { startLoading, stopLoading } = getLoadingContext();
  
  try {
    startLoading();
    const { data, error } = await supabase
      .from('plantillas_solicitudes')
      .select('*')
      .eq('activa', true)
      .order('nombre');

    if (error) {
      console.error('Error al obtener plantillas:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error en getAllPlantillas:', error);
    return [];
  } finally {
    stopLoading();
  }
};

/**
 * Obtiene una plantilla por ID
 */
export const getPlantillaById = async (id: number): Promise<Plantilla | null> => {
  const { startLoading, stopLoading } = getLoadingContext();
  
  try {
    startLoading();
    const { data, error } = await supabase
      .from('plantillas_solicitudes')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error al obtener plantilla:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error en getPlantillaById:', error);
    return null;
  } finally {
    stopLoading();
  }
};

/**
 * Crea una nueva plantilla
 */
export const createPlantilla = async (plantilla: Partial<Plantilla>): Promise<Plantilla | null> => {
  const { startLoading, stopLoading } = getLoadingContext();
  
  try {
    startLoading();
    const { data, error } = await supabase
      .from('plantillas_solicitudes')
      .insert([plantilla])
      .select()
      .single();
    
    if (error) {
      console.error('Error al crear plantilla:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error en createPlantilla:', error);
    return null;
  } finally {
    stopLoading();
  }
};

/**
 * Actualiza una plantilla existente
 */
export const updatePlantilla = async (id: number, plantilla: Partial<Plantilla>): Promise<Plantilla | null> => {
  const { startLoading, stopLoading } = getLoadingContext();
  
  try {
    startLoading();
    const { data, error } = await supabase
      .from('plantillas_solicitudes')
      .update({ ...plantilla, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error al actualizar plantilla:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error en updatePlantilla:', error);
    return null;
  } finally {
    stopLoading();
  }
};

/**
 * Elimina una plantilla
 */
export const deletePlantilla = async (id: number): Promise<boolean> => {
  const { startLoading, stopLoading } = getLoadingContext();
  
  try {
    startLoading();
    const { error } = await supabase
      .from('plantillas_solicitudes')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error al eliminar plantilla:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error en deletePlantilla:', error);
    return false;
  } finally {
    stopLoading();
  }
};

// Exportar el servicio completo
export const plantillasService = {
  getAll: getAllPlantillas,
  getById: getPlantillaById,
  create: createPlantilla,
  update: updatePlantilla,
  delete: deletePlantilla
}; 
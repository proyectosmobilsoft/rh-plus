
import { supabase } from './supabaseClient';

export interface Empresa {
  id: number;
  nombre: string;
  razonSocial: string;
  nit: string;
  direccion: string;
  telefono: string;
  email: string;
  representanteLegal: string;
  cargoRepresentante: string;
  estado: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Obtiene información completa de una empresa por ID
 */
export const obtenerEmpresaPorId = async (empresaId: number): Promise<Empresa | null> => {
  try {
    console.log('Consultando empresa con ID:', empresaId);
    
    const { data, error } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', empresaId)
      .single();

    if (error) {
      console.error('Error al consultar empresa:', error);
      return null;
    }

    if (data) {
      console.log('Empresa encontrada:', data);
      return data;
    }

    console.log('No se encontró empresa con ID:', empresaId);
    return null;
  } catch (error) {
    console.error('Error en obtenerEmpresaPorId:', error);
    return null;
  }
};

/**
 * Obtiene todas las empresas
 */
export const obtenerEmpresas = async (): Promise<Empresa[]> => {
  try {
    const { data, error } = await supabase
      .from('empresas')
      .select('*')
      .order('nombre');

    if (error) {
      console.error('Error al obtener empresas:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error en obtenerEmpresas:', error);
    return [];
  }
};

// Exportar el servicio completo para mantener compatibilidad
export const empresasService = {
  getAll: async (): Promise<Empresa[]> => {
    return await obtenerEmpresas();
  },
  create: async (empresa: Omit<Empresa, 'id' | 'createdAt' | 'updatedAt'>): Promise<Empresa | null> => {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .insert([empresa])
        .select()
        .single();

      if (error) {
        console.error('Error al crear empresa:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error en create empresa:', error);
      return null;
    }
  },
  update: async (empresa: Empresa): Promise<Empresa | null> => {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .update(empresa)
        .eq('id', empresa.id)
        .select()
        .single();

      if (error) {
        console.error('Error al actualizar empresa:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error en update empresa:', error);
      return null;
    }
  },
  delete: async (id: number): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('empresas')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error al eliminar empresa:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error en delete empresa:', error);
      return false;
    }
  }
};

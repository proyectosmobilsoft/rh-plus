import { supabase } from './supabaseClient';

export interface Pais {
  id: number;
  nombre: string;
  codigo_iso?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Departamento {
  id: number;
  nombre: string;
  codigo_dane?: string;
  pais_id: number;
  created_at?: string;
  updated_at?: string;
  paises?: Pais;
}

export interface Ciudad {
  id: number;
  nombre: string;
  codigo_dane?: string;
  departamento_id: number;
  created_at?: string;
  updated_at?: string;
  departamentos?: Departamento;
}

export const ubicacionesService = {
  // Servicios para países
  getPaises: async (): Promise<Pais[]> => {
    const { data, error } = await supabase
      .from('paises')
      .select('*')
      .order('nombre');
    if (error) throw error;
    return data || [];
  },

  createPais: async (pais: Partial<Pais>): Promise<Pais | null> => {
    const { data, error } = await supabase
      .from('paises')
      .insert([pais])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updatePais: async (id: number, pais: Partial<Pais>): Promise<Pais | null> => {
    const { data, error } = await supabase
      .from('paises')
      .update(pais)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deletePais: async (id: number): Promise<void> => {
    const { error } = await supabase
      .from('paises')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Servicios para departamentos
  getDepartamentos: async (): Promise<Departamento[]> => {
    const { data, error } = await supabase
      .from('departamentos')
      .select(`
        *,
        paises (
          id,
          nombre,
          codigo_iso
        )
      `)
      .order('nombre');
    if (error) throw error;
    return data || [];
  },

  getDepartamentosByPais: async (paisId: number): Promise<Departamento[]> => {
    const { data, error } = await supabase
      .from('departamentos')
      .select(`
        *,
        paises (
          id,
          nombre,
          codigo_iso
        )
      `)
      .eq('pais_id', paisId)
      .order('nombre');
    if (error) throw error;
    return data || [];
  },

  createDepartamento: async (departamento: Partial<Departamento>): Promise<Departamento | null> => {
    const { data, error } = await supabase
      .from('departamentos')
      .insert([departamento])
      .select(`
        *,
        paises (
          id,
          nombre,
          codigo_iso
        )
      `)
      .single();
    if (error) throw error;
    return data;
  },

  updateDepartamento: async (id: number, departamento: Partial<Departamento>): Promise<Departamento | null> => {
    const { data, error } = await supabase
      .from('departamentos')
      .update(departamento)
      .eq('id', id)
      .select(`
        *,
        paises (
          id,
          nombre,
          codigo_iso
        )
      `)
      .single();
    if (error) throw error;
    return data;
  },

  deleteDepartamento: async (id: number): Promise<void> => {
    const { error } = await supabase
      .from('departamentos')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Servicios para ciudades
  getCiudades: async (): Promise<Ciudad[]> => {
    const { data, error } = await supabase
      .from('ciudades')
      .select(`
        *,
        departamentos (
          id,
          nombre,
          codigo_dane,
          paises (
            id,
            nombre,
            codigo_iso
          )
        )
      `)
      .order('nombre');
    if (error) throw error;
    return data || [];
  },

  getCiudadesByDepartamento: async (departamentoId: number): Promise<Ciudad[]> => {
    const { data, error } = await supabase
      .from('ciudades')
      .select(`
        *,
        departamentos (
          id,
          nombre,
          codigo_dane,
          paises (
            id,
            nombre,
            codigo_iso
          )
        )
      `)
      .eq('departamento_id', departamentoId)
      .order('nombre');
    if (error) throw error;
    return data || [];
  },

  createCiudad: async (ciudad: Partial<Ciudad>): Promise<Ciudad | null> => {
    const { data, error } = await supabase
      .from('ciudades')
      .insert([ciudad])
      .select(`
        *,
        departamentos (
          id,
          nombre,
          codigo_dane,
          paises (
            id,
            nombre,
            codigo_iso
          )
        )
      `)
      .single();
    if (error) throw error;
    return data;
  },

  updateCiudad: async (id: number, ciudad: Partial<Ciudad>): Promise<Ciudad | null> => {
    const { data, error } = await supabase
      .from('ciudades')
      .update(ciudad)
      .eq('id', id)
      .select(`
        *,
        departamentos (
          id,
          nombre,
          codigo_dane,
          paises (
            id,
            nombre,
            codigo_iso
          )
        )
      `)
      .single();
    if (error) throw error;
    return data;
  },

  deleteCiudad: async (id: number): Promise<void> => {
    const { error } = await supabase
      .from('ciudades')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
}; 
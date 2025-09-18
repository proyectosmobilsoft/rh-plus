import { supabase } from './supabaseClient';

export interface Prestador {
  id?: number;
  identificacion: string;
  razon_social: string;
  especialidad?: string; // Campo legacy
  especialidad_id?: number;
  telefono?: string;
  correo?: string;
  direccion_laboratorio?: string;
  nombre_laboratorio?: string;
  contacto_laboratorio?: string;
  sucursal_id?: number;
  activo?: boolean;
  // Campos relacionados
  especialidad_nombre?: string;
  sucursal_nombre?: string;
  ciudad_nombre?: string;
  departamento_nombre?: string;
}

export const prestadoresService = {
  getAll: async (): Promise<Prestador[]> => {
    const { data, error } = await supabase
      .from('prestadores')
      .select(`
        *,
        especialidades:especialidad_id(nombre),
        sucursales:sucursal_id(nombre, ciudades:ciudad_id(nombre, departamentos:departamento_id(nombre)))
      `);
    if (error) throw error;
    
    // Transformar los datos para incluir nombres relacionados
    return (data || []).map(prestador => ({
      ...prestador,
      especialidad_nombre: prestador.especialidades?.nombre,
      sucursal_nombre: prestador.sucursales?.nombre,
      ciudad_nombre: prestador.sucursales?.ciudades?.nombre,
      departamento_nombre: prestador.sucursales?.ciudades?.departamentos?.nombre
    }));
  },
  
  create: async (prestador: Partial<Prestador>): Promise<Prestador | null> => {
    const { data, error } = await supabase.from('prestadores').insert([prestador]).select();
    if (error) throw error;
    return data ? data[0] : null;
  },
  
  update: async (id: number, prestador: Partial<Prestador>): Promise<Prestador | null> => {
    const { data, error } = await supabase.from('prestadores').update(prestador).eq('id', id).select();
    if (error) throw error;
    return data ? data[0] : null;
  },
  
  delete: async (id: number): Promise<boolean> => {
    const { error } = await supabase.from('prestadores').delete().eq('id', id);
    if (error) throw error;
    return true;
  },
  
  activate: async (id: number): Promise<boolean> => {
    const { error } = await supabase.from('prestadores').update({ activo: true }).eq('id', id);
    if (error) throw error;
    return true;
  },
  
  deactivate: async (id: number): Promise<boolean> => {
    const { error } = await supabase.from('prestadores').update({ activo: false }).eq('id', id);
    if (error) throw error;
    return true;
  }
}; 
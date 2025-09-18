import { supabase } from './supabaseClient';

export interface Sucursal {
  id: number;
  nombre: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  activo: boolean;
  codigo?: string;
  ciudad_id?: number;
  // Campos relacionados
  ciudad_nombre?: string;
  departamento_nombre?: string;
}

export const sucursalesService = {
  getAll: async (): Promise<Sucursal[]> => {
    const { data, error } = await supabase
      .from('gen_sucursales')
      .select(`
        *,
        ciudades:ciudad_id(nombre, departamentos:departamento_id(nombre))
      `)
      .eq('activo', true)
      .order('nombre');
    
    if (error) throw error;
    
    // Transformar los datos para incluir nombres relacionados
    return (data || []).map(sucursal => ({
      ...sucursal,
      ciudad_nombre: sucursal.ciudades?.nombre,
      departamento_nombre: sucursal.ciudades?.departamentos?.nombre
    }));
  }
};
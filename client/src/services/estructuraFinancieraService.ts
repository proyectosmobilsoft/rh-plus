import { supabase } from './supabaseClient';

// Interfaces
export interface Regional {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Sucursal {
  id: number;
  codigo: string;
  nombre: string;
  direccion: string;
  regional_id: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
  regional?: Regional;
}

export interface Proyecto {
  id: number;
  codigo: string;
  nombre: string;
  regional_id: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
  regional?: Regional;
}

export interface CentroCosto {
  id: number;
  codigo: string;
  nombre: string;
  proyecto_id: number;
  area_negocio: string;
  porcentaje_estructura: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
  proyecto?: Proyecto;
}

export interface EstructuraFinancieraCompleta {
  regional: Regional;
  sucursales: Sucursal[];
  proyectos: Proyecto[];
  centrosCosto: CentroCosto[];
}

class EstructuraFinancieraService {
  // REGIONALES
  async getRegionales(): Promise<Regional[]> {
    const { data, error } = await supabase
      .from('gen_regional')
      .select('*')
      .order('nombre');

    if (error) throw error;
    return data || [];
  }

  async createRegional(regional: Omit<Regional, 'id' | 'created_at' | 'updated_at'>): Promise<Regional> {
    const { data, error } = await supabase
      .from('gen_regional')
      .insert(regional)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateRegional(id: number, regional: Partial<Regional>): Promise<Regional> {
    const { data, error } = await supabase
      .from('gen_regional')
      .update({ ...regional, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteRegional(id: number): Promise<void> {
    const { error } = await supabase
      .from('gen_regional')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // SUCURSALES
  async getSucursales(): Promise<Sucursal[]> {
    const { data, error } = await supabase
      .from('gen_sucursales')
      .select(`
        *,
        regional:gen_regional(*)
      `)
      .order('nombre');

    if (error) throw error;
    return data || [];
  }

  async createSucursal(sucursal: Omit<Sucursal, 'id' | 'created_at' | 'updated_at'>): Promise<Sucursal> {
    const { data, error } = await supabase
      .from('gen_sucursales')
      .insert(sucursal)
      .select(`
        *,
        regional:gen_regional(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async updateSucursal(id: number, sucursal: Partial<Sucursal>): Promise<Sucursal> {
    const { data, error } = await supabase
      .from('gen_sucursales')
      .update({ ...sucursal, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(`
        *,
        regional:gen_regional(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async deleteSucursal(id: number): Promise<void> {
    const { error } = await supabase
      .from('gen_sucursales')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // PROYECTOS
  async getProyectos(): Promise<Proyecto[]> {
    const { data, error } = await supabase
      .from('proyectos')
      .select(`
        *,
        regional:gen_regional(*)
      `)
      .order('nombre');

    if (error) throw error;
    return data || [];
  }

  async createProyecto(proyecto: Omit<Proyecto, 'id' | 'created_at' | 'updated_at'>): Promise<Proyecto> {
    const { data, error } = await supabase
      .from('proyectos')
      .insert(proyecto)
      .select(`
        *,
        regional:gen_regional(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async updateProyecto(id: number, proyecto: Partial<Proyecto>): Promise<Proyecto> {
    const { data, error } = await supabase
      .from('proyectos')
      .update({ ...proyecto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(`
        *,
        regional:gen_regional(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async deleteProyecto(id: number): Promise<void> {
    const { error } = await supabase
      .from('proyectos')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // CENTROS DE COSTO
  async getCentrosCosto(): Promise<CentroCosto[]> {
    const { data, error } = await supabase
      .from('centros_costo')
      .select(`
        *,
        proyecto:proyectos(
          *,
          regional:gen_regional(*)
        )
      `)
      .order('nombre');

    if (error) throw error;
    return data || [];
  }

  async createCentroCosto(centroCosto: Omit<CentroCosto, 'id' | 'created_at' | 'updated_at'>): Promise<CentroCosto> {
    const { data, error } = await supabase
      .from('centros_costo')
      .insert(centroCosto)
      .select(`
        *,
        proyecto:proyectos(
          *,
          regional:gen_regional(*)
        )
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async updateCentroCosto(id: number, centroCosto: Partial<CentroCosto>): Promise<CentroCosto> {
    const { data, error } = await supabase
      .from('centros_costo')
      .update({ ...centroCosto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(`
        *,
        proyecto:proyectos(
          *,
          regional:gen_regional(*)
        )
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async deleteCentroCosto(id: number): Promise<void> {
    const { error } = await supabase
      .from('centros_costo')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // ESTRUCTURA COMPLETA
  async getEstructuraCompleta(): Promise<EstructuraFinancieraCompleta[]> {
    const regionales = await this.getRegionales();
    const sucursales = await this.getSucursales();
    const proyectos = await this.getProyectos();
    const centrosCosto = await this.getCentrosCosto();

    return regionales.map(regional => ({
      regional,
      sucursales: sucursales.filter(s => s.regional_id === regional.id),
      proyectos: proyectos.filter(p => p.regional_id === regional.id),
      centrosCosto: centrosCosto.filter(cc => 
        proyectos.some(p => p.id === cc.proyecto_id && p.regional_id === regional.id)
      )
    }));
  }

  // INICIALIZAR TABLAS
  async initializeTables(): Promise<void> {
    try {
      // Crear tabla regionales
      const { error: regionalError } = await supabase.rpc('create_regionales_table');
      if (regionalError && !regionalError.message.includes('already exists')) {
        console.error('Error creando tabla regionales:', regionalError);
      }

      // Crear tabla sucursales
      const { error: sucursalError } = await supabase.rpc('create_sucursales_table');
      if (sucursalError && !sucursalError.message.includes('already exists')) {
        console.error('Error creando tabla sucursales:', sucursalError);
      }

      // Crear tabla proyectos
      const { error: proyectoError } = await supabase.rpc('create_proyectos_table');
      if (proyectoError && !proyectoError.message.includes('already exists')) {
        console.error('Error creando tabla proyectos:', proyectoError);
      }

      // Crear tabla centros_costo
      const { error: centroCostoError } = await supabase.rpc('create_centros_costo_table');
      if (centroCostoError && !centroCostoError.message.includes('already exists')) {
        console.error('Error creando tabla centros_costo:', centroCostoError);
      }

    } catch (error) {
      console.error('Error inicializando tablas de estructura financiera:', error);
    }
  }
}

export const estructuraFinancieraService = new EstructuraFinancieraService();

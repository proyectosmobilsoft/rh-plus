import { supabase } from './supabaseClient';

export interface Pais {
  id: number;
  nombre: string;
  codigo_iso?: string;
  estado: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Departamento {
  id: number;
  nombre: string;
  codigo_dane?: string;
  pais_id: number;
  estado: boolean;
  created_at?: string;
  updated_at?: string;
  paises?: Pais;
}

export interface Ciudad {
  id: number;
  nombre: string;
  codigo_dane?: string;
  departamento_id: number;
  pais_id: number;
  estado: boolean;
  created_at?: string;
  updated_at?: string;
  departamentos?: Departamento;
}

export interface Regional {
  id: number;
  nombre: string;
  codigo?: string;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface RegionalDepartamento {
  regional_id: number;
  departamento_id: number;
}

export interface Sucursal {
  id: number;
  codigo?: string;
  nombre: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  activo: boolean;
  ciudad_id?: number | null;
  created_at?: string;
  updated_at?: string;
  ciudades?: { id: number; nombre: string; departamento_id: number } | null;
}

export const ubicacionesService = {
  // Servicios para países
  getPaises: async (): Promise<Pais[]> => {
    console.log('🔧 getPaises ejecutándose...');
    const { data, error } = await supabase
      .from('paises')
      .select('*')
      .order('nombre');
    if (error) {
      console.error('❌ Error en getPaises:', error);
      throw error;
    }
    console.log('📊 getPaises resultado:', data?.length || 0, 'registros');
    console.log('📋 Estados de países:', data?.map(p => `${p.nombre}: ${p.estado}`));
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

  activatePais: async (id: number): Promise<void> => {
    console.log('🔧 activatePais llamado con ID:', id);
    const { data, error } = await supabase
      .from('paises')
      .update({ estado: true })
      .eq('id', id)
      .select('id, estado')
      .single();
    if (error) {
      console.error('❌ Error en activatePais:', error);
      throw error;
    }
    if (!data || data.estado !== true) {
      throw new Error('No se pudo activar el país (0 filas actualizadas)');
    }
    console.log('✅ activatePais completado exitosamente');
  },

  deactivatePais: async (id: number): Promise<void> => {
    console.log('🔧 deactivatePais llamado con ID:', id);
    const { data, error } = await supabase
      .from('paises')
      .update({ estado: false })
      .eq('id', id)
      .select('id, estado')
      .single();
    if (error) {
      console.error('❌ Error en deactivatePais:', error);
      throw error;
    }
    if (!data || data.estado !== false) {
      throw new Error('No se pudo inactivar el país (0 filas actualizadas)');
    }
    console.log('✅ deactivatePais completado exitosamente');
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

  activateDepartamento: async (id: number): Promise<void> => {
    console.log('🔧 activateDepartamento llamado con ID:', id);
    const { data, error } = await supabase
      .from('departamentos')
      .update({ estado: true })
      .eq('id', id)
      .select('id, estado')
      .single();
    if (error) {
      console.error('❌ Error en activateDepartamento:', error);
      throw error;
    }
    if (!data || data.estado !== true) {
      throw new Error('No se pudo activar el departamento (0 filas actualizadas)');
    }
    console.log('✅ activateDepartamento completado exitosamente');
  },

  deactivateDepartamento: async (id: number): Promise<void> => {
    console.log('🔧 deactivateDepartamento llamado con ID:', id);
    const { data, error } = await supabase
      .from('departamentos')
      .update({ estado: false })
      .eq('id', id)
      .select('id, estado')
      .single();
    if (error) {
      console.error('❌ Error en deactivateDepartamento:', error);
      throw error;
    }
    if (!data || data.estado !== false) {
      throw new Error('No se pudo inactivar el departamento (0 filas actualizadas)');
    }
    console.log('✅ deactivateDepartamento completado exitosamente');
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

  // Sucursales
  getSucursales: async (): Promise<Sucursal[]> => {
    const { data, error } = await supabase
      .from('gen_sucursales')
      .select(`
        *,
        ciudades (
          id,
          nombre,
          departamento_id
        )
      `)
      .order('nombre');
    if (error) throw error;
    return (data || []) as unknown as Sucursal[];
  },

  createSucursal: async (payload: Partial<Sucursal>): Promise<Sucursal | null> => {
    const { data, error } = await supabase
      .from('gen_sucursales')
      .insert([{
        codigo: payload.codigo,
        nombre: payload.nombre,
        direccion: payload.direccion,
        telefono: payload.telefono,
        email: payload.email,
        ciudad_id: payload.ciudad_id ?? null,
      }])
      .select(`
        *,
        ciudades (
          id,
          nombre,
          departamento_id
        )
      `)
      .single();
    if (error) throw error;
    return data as unknown as Sucursal;
  },

  updateSucursal: async (id: number, payload: Partial<Sucursal>): Promise<Sucursal | null> => {
    const { data, error } = await supabase
      .from('gen_sucursales')
      .update({
        codigo: payload.codigo,
        nombre: payload.nombre,
        direccion: payload.direccion,
        telefono: payload.telefono,
        email: payload.email,
        ciudad_id: payload.ciudad_id ?? null,
      })
      .eq('id', id)
      .select(`
        *,
        ciudades (
          id,
          nombre,
          departamento_id
        )
      `)
      .single();
    if (error) throw error;
    return data as unknown as Sucursal;
  },

  deleteSucursal: async (id: number): Promise<void> => {
    const { error } = await supabase
      .from('gen_sucursales')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  activateSucursal: async (id: number): Promise<void> => {
    const { error } = await supabase
      .from('gen_sucursales')
      .update({ activo: true })
      .eq('id', id);
    if (error) throw error;
  },

  deactivateSucursal: async (id: number): Promise<void> => {
    const { error } = await supabase
      .from('gen_sucursales')
      .update({ activo: false })
      .eq('id', id);
    if (error) throw error;
  },

  // Servicios para regionales
  getRegionales: async (): Promise<Regional[]> => {
    const { data, error } = await supabase
      .from('regionales')
      .select('*')
      .order('nombre');
    if (error) throw error;
    return (data || []) as unknown as Regional[];
  },

  getRegionalesDepartamentos: async (): Promise<RegionalDepartamento[]> => {
    const { data, error } = await supabase
      .from('regionales_departamentos')
      .select('regional_id, departamento_id');
    if (error) throw error;
    return (data || []) as RegionalDepartamento[];
  },

  createRegional: async (payload: Partial<Regional>): Promise<Regional | null> => {
    const { data, error } = await supabase
      .from('regionales')
      .insert([{ nombre: payload.nombre, codigo: payload.codigo }])
      .select('*')
      .single();
    if (error) throw error;
    return data as unknown as Regional;
  },

  updateRegional: async (id: number, payload: Partial<Regional>): Promise<Regional | null> => {
    const { data, error } = await supabase
      .from('regionales')
      .update({ nombre: payload.nombre, codigo: payload.codigo })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data as unknown as Regional;
  },

  deleteRegional: async (id: number): Promise<void> => {
    const { error } = await supabase
      .from('regionales')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  activateRegional: async (id: number): Promise<void> => {
    const { error } = await supabase
      .from('regionales')
      .update({ activo: true })
      .eq('id', id);
    if (error) throw error;
  },

  deactivateRegional: async (id: number): Promise<void> => {
    const { error } = await supabase
      .from('regionales')
      .update({ activo: false })
      .eq('id', id);
    if (error) throw error;
  },

  setDepartamentosForRegional: async (regionalId: number, departamentoIds: number[]): Promise<void> => {
    // borrar existentes
    const { error: delError } = await supabase
      .from('regionales_departamentos')
      .delete()
      .eq('regional_id', regionalId);
    if (delError) throw delError;
    if (departamentoIds.length === 0) return;
    const rows = departamentoIds.map((departamento_id) => ({ regional_id: regionalId, departamento_id }));
    const { error: insError } = await supabase
      .from('regionales_departamentos')
      .insert(rows);
    if (insError) throw insError;
  },

  createCiudad: async (ciudad: Partial<Ciudad>): Promise<Ciudad | null> => {
    // Asegurar pais_id a partir del departamento si no viene
    let payload: any = { ...ciudad };
    if (!payload.pais_id && payload.departamento_id) {
      const { data: dept, error: deptError } = await supabase
        .from('departamentos')
        .select('pais_id')
        .eq('id', payload.departamento_id)
        .single();
      if (deptError) throw deptError;
      payload.pais_id = dept?.pais_id;
    }

    const { data, error } = await supabase
      .from('ciudades')
      .insert([payload])
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
    // Asegurar pais_id coherente si cambia el departamento
    let payload: any = { ...ciudad };
    if (payload.departamento_id && !payload.pais_id) {
      const { data: dept, error: deptError } = await supabase
        .from('departamentos')
        .select('pais_id')
        .eq('id', payload.departamento_id)
        .single();
      if (deptError) throw deptError;
      payload.pais_id = dept?.pais_id;
    }

    const { data, error } = await supabase
      .from('ciudades')
      .update(payload)
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
  },

  activateCiudad: async (id: number): Promise<void> => {
    console.log('🔧 activateCiudad llamado con ID:', id);
    const { data, error } = await supabase
      .from('ciudades')
      .update({ estado: true })
      .eq('id', id)
      .select('id, estado')
      .single();
    if (error) {
      console.error('❌ Error en activateCiudad:', error);
      throw error;
    }
    if (!data || data.estado !== true) {
      throw new Error('No se pudo activar la ciudad (0 filas actualizadas)');
    }
    console.log('✅ activateCiudad completado exitosamente');
  },

  deactivateCiudad: async (id: number): Promise<void> => {
    console.log('🔧 deactivateCiudad llamado con ID:', id);
    const { data, error } = await supabase
      .from('ciudades')
      .update({ estado: false })
      .eq('id', id)
      .select('id, estado')
      .single();
    if (error) {
      console.error('❌ Error en deactivateCiudad:', error);
      throw error;
    }
    if (!data || data.estado !== false) {
      throw new Error('No se pudo inactivar la ciudad (0 filas actualizadas)');
    }
    console.log('✅ deactivateCiudad completado exitosamente');
  },

  // Helpers para desasociar referencias antes de eliminar
  nullifyPrestadoresByCiudad: async (ciudadId: number): Promise<void> => {
    const { error } = await supabase
      .from('prestadores')
      .update({ ciudad_id: null })
      .eq('ciudad_id', ciudadId);
    if (error) throw error;
  },

  nullifyPrestadoresByDepartamento: async (departamentoId: number): Promise<void> => {
    const { data: ciudades, error: ciudadesError } = await supabase
      .from('ciudades')
      .select('id')
      .eq('departamento_id', departamentoId);
    if (ciudadesError) throw ciudadesError;
    const ciudadIds = (ciudades || []).map(c => c.id);
    if (ciudadIds.length === 0) return;
    const { error } = await supabase
      .from('prestadores')
      .update({ ciudad_id: null })
      .in('ciudad_id', ciudadIds);
    if (error) throw error;
  },

  nullifyPrestadoresByPais: async (paisId: number): Promise<void> => {
    const { data: departamentos, error: deptError } = await supabase
      .from('departamentos')
      .select('id')
      .eq('pais_id', paisId);
    if (deptError) throw deptError;
    const deptIds = (departamentos || []).map(d => d.id);
    if (deptIds.length === 0) return;
    const { data: ciudades, error: ciudadesError } = await supabase
      .from('ciudades')
      .select('id')
      .in('departamento_id', deptIds);
    if (ciudadesError) throw ciudadesError;
    const ciudadIds = (ciudades || []).map(c => c.id);
    if (ciudadIds.length === 0) return;
    const { error } = await supabase
      .from('prestadores')
      .update({ ciudad_id: null })
      .in('ciudad_id', ciudadIds);
    if (error) throw error;
  }
}; 
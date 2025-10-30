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
  id_empresa?: number;
  empresa_nombre?: string; // Nombre de la empresa asociada
  created_at?: string;
  updated_at?: string;
}

/**
 * Obtiene todas las plantillas de solicitudes filtradas por empresa autenticada
 * Si no hay empresa en localStorage, muestra todas las plantillas
 */
export const getAllPlantillas = async (): Promise<Plantilla[]> => {
  const { startLoading, stopLoading } = getLoadingContext();
  
  try {
    startLoading();
    
    // Obtener datos de la empresa del localStorage
    const empresaData = localStorage.getItem('empresaData');
    
    if (!empresaData) {
      console.log('🔍 No se encontraron datos de empresa en localStorage, mostrando todas las plantillas');
      
      // Si no hay empresa, mostrar todas las plantillas con JOIN a empresas
      const { data, error } = await supabase
        .from('plantillas_solicitudes')
        .select(`
          *,
          empresas!fk_plantillas_solicitudes_empresa(razon_social)
        `)
        .order('nombre');

      if (error) {
        console.error('Error al obtener todas las plantillas:', error);
        return [];
      }

      // Mapear los datos para incluir el nombre de la empresa
      const plantillasConEmpresa = data?.map(plantilla => ({
        ...plantilla,
        empresa_nombre: plantilla.empresas?.razon_social || 'Sin empresa'
      })) || [];

      console.log('✅ Todas las plantillas obtenidas:', plantillasConEmpresa?.length || 0);
      return plantillasConEmpresa;
    }
    
    const empresa = JSON.parse(empresaData);
    const empresaId = empresa.id;
    
    console.log('🔍 Obteniendo plantillas para empresa ID:', empresaId);
    
    const { data, error } = await supabase
      .from('plantillas_solicitudes')
      .select(`
        *,
        empresas!fk_plantillas_solicitudes_empresa(razon_social)
      `)
      .eq('id_empresa', empresaId)
      .order('nombre');

    if (error) {
      console.error('Error al obtener plantillas:', error);
      return [];
    }

    // Mapear los datos para incluir el nombre de la empresa
    const plantillasConEmpresa = data?.map(plantilla => ({
      ...plantilla,
      empresa_nombre: plantilla.empresas?.razon_social || 'Sin empresa'
    })) || [];

    console.log('✅ Plantillas obtenidas:', plantillasConEmpresa?.length || 0);
    return plantillasConEmpresa;
  } catch (error) {
    console.error('Error en getAllPlantillas:', error);
    return [];
  } finally {
    stopLoading();
  }
};

/**
 * Verifica la estructura de la base de datos probando consultas directas
 */
export const verificarEstructuraDB = async () => {
  try {
    console.log('🔍 Verificando estructura de la base de datos...');
    
    let empresasPlantillasExists = false;
    let plantillasSolicitudesExists = false;
    
    // Verificar si existe la tabla empresas_plantillas
    try {
      const { error: epError } = await supabase
        .from('empresas_plantillas')
        .select('empresa_id, plantilla_id')
        .limit(1);
      
      empresasPlantillasExists = !epError;
      console.log('✅ Tabla empresas_plantillas existe:', empresasPlantillasExists);
    } catch (error) {
      console.log('❌ Tabla empresas_plantillas no existe o no es accesible');
    }
    
    // Verificar si existe la tabla plantillas_solicitudes
    try {
      const { error: psError } = await supabase
        .from('plantillas_solicitudes')
        .select('id')
        .limit(1);
        
      plantillasSolicitudesExists = !psError;
      console.log('✅ Tabla plantillas_solicitudes existe:', plantillasSolicitudesExists);
    } catch (error) {
      console.log('❌ Tabla plantillas_solicitudes no existe o no es accesible');
    }
    
    return {
      empresasPlantillasExists,
      plantillasSolicitudesExists,
      tables: ['empresas_plantillas', 'plantillas_solicitudes'] // Lista simplificada
    };
  } catch (error) {
    console.error('❌ Error al verificar estructura DB:', error);
    return {
      empresasPlantillasExists: true, // Asumir que existen para evitar bloqueos
      plantillasSolicitudesExists: true,
      tables: []
    };
  }
};

/**
 * Obtiene todas las plantillas activas (fallback)
 */
export const getAllPlantillasActivas = async (): Promise<Plantilla[]> => {
  const { startLoading, stopLoading } = getLoadingContext();
  
  try {
    startLoading();
    console.log('🔄 Obteniendo todas las plantillas activas...');
    
    const { data: plantillas, error } = await supabase
      .from('plantillas_solicitudes')
      .select('id, nombre, descripcion, es_default, estructura_formulario, activa, created_at, updated_at, id_empresa')
      .eq('activa', true)
      .order('nombre');

    if (error) {
      console.error('❌ Error al obtener plantillas activas:', error);
      return [];
    }

    console.log('✅ Plantillas activas obtenidas:', plantillas?.length || 0);
    return plantillas || [];
  } catch (error) {
    console.error('❌ Error en getAllPlantillasActivas:', error);
    return [];
  } finally {
    stopLoading();
  }
};

/**
 * Obtiene las plantillas asociadas a una empresa específica
 * Solo devuelve plantillas de la empresa, sin fallbacks que muestren todas las plantillas
 */
export const getPlantillasByEmpresa = async (empresaId: number | null | undefined, skipGlobalLoading: boolean = false): Promise<Plantilla[]> => {
  const { startLoading, stopLoading } = getLoadingContext();
  
  try {
    if (!skipGlobalLoading) {
      startLoading();
    }
    console.log('🔍 Buscando plantillas para empresa ID:', empresaId);
    
    // Si no hay empresaId, devolver array vacío
    if (!empresaId) {
      console.log('⚠️ No hay empresa ID proporcionado, devolviendo array vacío');
      return [];
    }
    
    // Primero verificamos si existe la tabla empresas_plantillas
    const { data: tableExists, error: tableError } = await supabase
      .from('empresas_plantillas')
      .select('count')
      .limit(1);

    if (tableError) {
      console.error('❌ Error al verificar tabla empresas_plantillas:', tableError);
      console.log('🔄 Intentando obtener plantillas por id_empresa...');
      
      // Si no existe la tabla, buscar por id_empresa en plantillas_solicitudes
      const { data: plantillas, error } = await supabase
        .from('plantillas_solicitudes')
        .select(`
          *,
          empresas!fk_plantillas_solicitudes_empresa(razon_social, nit)
        `)
        .eq('id_empresa', empresaId)
        .order('nombre');

      if (error) {
        console.error('❌ Error al obtener plantillas por id_empresa:', error);
        return [];
      }

      // Mapear los datos para incluir el nombre de la empresa
      const plantillasConEmpresa = plantillas?.map(plantilla => ({
        ...plantilla,
        empresa_nombre: plantilla.empresas?.razon_social || 'Sin empresa'
      })) || [];

      console.log('✅ Plantillas obtenidas por id_empresa:', plantillasConEmpresa?.length || 0);
      return plantillasConEmpresa;
    }

    // Si la tabla existe, obtenemos las plantillas asignadas a la empresa
    console.log('📋 Tabla empresas_plantillas existe, buscando asignaciones...');
    const { data: plantillasAsignadas, error: errorAsignadas } = await supabase
      .from('empresas_plantillas')
      .select('plantilla_id')
      .eq('empresa_id', empresaId);

    if (errorAsignadas) {
      console.error('❌ Error al obtener plantillas asignadas:', errorAsignadas);
      return [];
    }

    console.log('📊 Plantillas asignadas encontradas:', plantillasAsignadas?.length || 0);
    console.log('📋 Datos de plantillas asignadas:', plantillasAsignadas);

    // Si no hay plantillas asignadas, devolver array vacío
    if (!plantillasAsignadas || plantillasAsignadas.length === 0) {
      console.log('⚠️ No hay plantillas asignadas para la empresa ID:', empresaId);
      return [];
    }

    // Obtenemos los IDs de las plantillas asignadas
    const plantillaIds = plantillasAsignadas.map(pa => pa.plantilla_id);
    console.log('🆔 IDs de plantillas a buscar:', plantillaIds);

    // Obtenemos las plantillas completas con información de empresa
    const { data: plantillas, error } = await supabase
      .from('plantillas_solicitudes')
      .select(`
        *,
        empresas!fk_plantillas_solicitudes_empresa(razon_social, nit)
      `)
      .in('id', plantillaIds)
      .order('nombre');

    if (error) {
      console.error('❌ Error al obtener plantillas:', error);
      return [];
    }

    // Mapear los datos para incluir el nombre de la empresa
    const plantillasConEmpresa = plantillas?.map(plantilla => ({
      ...plantilla,
      empresa_nombre: plantilla.empresas?.razon_social || 'Sin empresa'
    })) || [];

    console.log('✅ Plantillas obtenidas exitosamente:', plantillasConEmpresa?.length || 0);
    console.log('📋 Plantillas:', plantillasConEmpresa);
    return plantillasConEmpresa;
  } catch (error) {
    console.error('❌ Error en getPlantillasByEmpresa:', error);
    return [];
  } finally {
    if (!skipGlobalLoading) {
      stopLoading();
    }
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
      .select('id, nombre, descripcion, es_default, estructura_formulario, activa, created_at, updated_at, id_empresa')
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
    
    // Obtener datos de la empresa del localStorage
    const empresaData = localStorage.getItem('empresaData');
    
    let plantillaConEmpresa = { ...plantilla };
    
    if (empresaData) {
      const empresa = JSON.parse(empresaData);
      const empresaId = empresa.id;
      
      console.log('📝 Creando plantilla para empresa ID:', empresaId);
      
      // Agregar el id_empresa a la plantilla
      plantillaConEmpresa = {
        ...plantilla,
        id_empresa: empresaId
      };
    } else {
      console.log('📝 Creando plantilla sin empresa específica (modo administrador)');
    }
    
    const { data, error } = await supabase
      .from('plantillas_solicitudes')
      .insert([plantillaConEmpresa])
      .select()
      .single();
    
    if (error) {
      console.error('Error al crear plantilla:', error);
      return null;
    }
    
    console.log('✅ Plantilla creada exitosamente:', data);
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
    
    // Obtener datos de la empresa del localStorage
    const empresaData = localStorage.getItem('empresaData');
    
    let plantillaConEmpresa = {
      ...plantilla,
      updated_at: new Date().toISOString()
    };
    
    let query = supabase
      .from('plantillas_solicitudes')
      .update(plantillaConEmpresa)
      .eq('id', id);
    
    if (empresaData) {
      const empresa = JSON.parse(empresaData);
      const empresaId = empresa.id;
      
      console.log('📝 Actualizando plantilla ID:', id, 'para empresa ID:', empresaId);
      
      // Agregar el id_empresa a la plantilla
      plantillaConEmpresa = {
        ...plantilla,
        id_empresa: empresaId,
        updated_at: new Date().toISOString()
      };
      
      // Asegurar que solo se actualice si pertenece a la empresa
      query = query.eq('id_empresa', empresaId);
    } else {
      console.log('📝 Actualizando plantilla ID:', id, 'sin restricción de empresa (modo administrador)');
    }
    
    const { data, error } = await query.select().single();
    
    if (error) {
      console.error('Error al actualizar plantilla:', error);
      return null;
    }
    
    console.log('✅ Plantilla actualizada exitosamente:', data);
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
    
    // Obtener datos de la empresa del localStorage
    const empresaData = localStorage.getItem('empresaData');
    
    let query = supabase
      .from('plantillas_solicitudes')
      .delete()
      .eq('id', id);
    
    if (empresaData) {
      const empresa = JSON.parse(empresaData);
      const empresaId = empresa.id;
      
      console.log('🗑️ Eliminando plantilla ID:', id, 'de empresa ID:', empresaId);
      
      // Solo eliminar si pertenece a la empresa
      query = query.eq('id_empresa', empresaId);
    } else {
      console.log('🗑️ Eliminando plantilla ID:', id, 'sin restricción de empresa (modo administrador)');
    }
    
    const { error } = await query;
    
    if (error) {
      console.error('Error al eliminar plantilla:', error);
      return false;
    }
    
    console.log('✅ Plantilla eliminada exitosamente');
    return true;
  } catch (error) {
    console.error('Error en deletePlantilla:', error);
    return false;
  } finally {
    stopLoading();
  }
};

/**
 * Activa una plantilla
 */
export const activatePlantilla = async (id: number): Promise<boolean> => {
  console.log('🔄 activatePlantilla llamado con ID:', id);
  const { startLoading, stopLoading } = getLoadingContext();
  
  try {
    startLoading();
    
    // Obtener datos de la empresa del localStorage
    const empresaData = localStorage.getItem('empresaData');
    
    let query = supabase
      .from('plantillas_solicitudes')
      .update({ activa: true, updated_at: new Date().toISOString() })
      .eq('id', id);
    
    if (empresaData) {
      const empresa = JSON.parse(empresaData);
      const empresaId = empresa.id;
      
      console.log('📝 Activando plantilla ID:', id, 'para empresa ID:', empresaId);
      
      // Solo activar si pertenece a la empresa
      query = query.eq('id_empresa', empresaId);
    } else {
      console.log('📝 Activando plantilla ID:', id, 'sin restricción de empresa (modo administrador)');
    }
    
    const { data, error } = await query.select();
    
    console.log('📊 Respuesta de Supabase:', { data, error });
    
    if (error) {
      console.error('❌ Error al activar plantilla:', error);
      return false;
    }
    
    console.log('✅ Plantilla activada exitosamente');
    return true;
  } catch (error) {
    console.error('❌ Error en activatePlantilla:', error);
    return false;
  } finally {
    stopLoading();
  }
};

/**
 * Inactiva una plantilla
 */
export const deactivatePlantilla = async (id: number): Promise<boolean> => {
  console.log('🔄 deactivatePlantilla llamado con ID:', id);
  const { startLoading, stopLoading } = getLoadingContext();
  
  try {
    startLoading();
    
    // Obtener datos de la empresa del localStorage
    const empresaData = localStorage.getItem('empresaData');
    
    let query = supabase
      .from('plantillas_solicitudes')
      .update({ activa: false, updated_at: new Date().toISOString() })
      .eq('id', id);
    
    if (empresaData) {
      const empresa = JSON.parse(empresaData);
      const empresaId = empresa.id;
      
      console.log('📝 Inactivando plantilla ID:', id, 'para empresa ID:', empresaId);
      
      // Solo inactivar si pertenece a la empresa
      query = query.eq('id_empresa', empresaId);
    } else {
      console.log('📝 Inactivando plantilla ID:', id, 'sin restricción de empresa (modo administrador)');
    }
    
    const { data, error } = await query.select();
    
    console.log('📊 Respuesta de Supabase:', { data, error });
    
    if (error) {
      console.error('❌ Error al inactivar plantilla:', error);
      return false;
    }
    
    console.log('✅ Plantilla inactivada exitosamente');
    return true;
  } catch (error) {
    console.error('❌ Error en deactivatePlantilla:', error);
    return false;
  } finally {
    stopLoading();
  }
};

/**
 * Establece una plantilla como predeterminada
 * Primero remueve el estado de predeterminada de todas las plantillas de la empresa
 * Luego establece la plantilla especificada como predeterminada
 */
export const setDefaultPlantilla = async (id: number): Promise<boolean> => {
  console.log('🔄 setDefaultPlantilla llamado con ID:', id);
  const { startLoading, stopLoading } = getLoadingContext();
  
  try {
    startLoading();
    
    // Obtener datos de la empresa del localStorage
    const empresaData = localStorage.getItem('empresaData');
    
    if (empresaData) {
      const empresa = JSON.parse(empresaData);
      const empresaId = empresa.id;
      
      console.log('📝 Removiendo estado predeterminada de todas las plantillas de la empresa ID:', empresaId);
      // Primero, remover el estado de predeterminada de todas las plantillas de la empresa
      const { error: errorRemoveDefault } = await supabase
        .from('plantillas_solicitudes')
        .update({ es_default: false, updated_at: new Date().toISOString() })
        .eq('es_default', true)
        .eq('id_empresa', empresaId);
      
      if (errorRemoveDefault) {
        console.error('❌ Error al remover estado predeterminada:', errorRemoveDefault);
        return false;
      }
      
      console.log('✅ Estado predeterminada removido de todas las plantillas de la empresa');
      
      console.log('📝 Estableciendo plantilla con ID:', id, 'como predeterminada para empresa ID:', empresaId);
      // Luego, establecer la plantilla especificada como predeterminada
      const { error: errorSetDefault } = await supabase
        .from('plantillas_solicitudes')
        .update({ es_default: true, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('id_empresa', empresaId); // Solo establecer como predeterminada si pertenece a la empresa
      
      if (errorSetDefault) {
        console.error('❌ Error al establecer plantilla como predeterminada:', errorSetDefault);
        return false;
      }
    } else {
      console.log('📝 Removiendo estado predeterminada de todas las plantillas (modo administrador)');
      // Primero, remover el estado de predeterminada de todas las plantillas
      const { error: errorRemoveDefault } = await supabase
        .from('plantillas_solicitudes')
        .update({ es_default: false, updated_at: new Date().toISOString() })
        .eq('es_default', true);
      
      if (errorRemoveDefault) {
        console.error('❌ Error al remover estado predeterminada:', errorRemoveDefault);
        return false;
      }
      
      console.log('✅ Estado predeterminada removido de todas las plantillas');
      
      console.log('📝 Estableciendo plantilla con ID:', id, 'como predeterminada (modo administrador)');
      // Luego, establecer la plantilla especificada como predeterminada
      const { error: errorSetDefault } = await supabase
        .from('plantillas_solicitudes')
        .update({ es_default: true, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (errorSetDefault) {
        console.error('❌ Error al establecer plantilla como predeterminada:', errorSetDefault);
        return false;
      }
    }
    
    console.log('✅ Plantilla establecida como predeterminada exitosamente');
    return true;
  } catch (error) {
    console.error('❌ Error en setDefaultPlantilla:', error);
    return false;
  } finally {
    stopLoading();
  }
};

// Exportar el servicio completo
export const plantillasService = {
  getAll: getAllPlantillas,
  getAllActivas: getAllPlantillasActivas,
  getByEmpresa: getPlantillasByEmpresa,
  getById: getPlantillaById,
  create: createPlantilla,
  update: updatePlantilla,
  delete: deletePlantilla,
  activate: activatePlantilla,
  deactivate: deactivatePlantilla,
  setDefault: setDefaultPlantilla,
  verificarEstructura: verificarEstructuraDB
}; 


import { supabase } from './supabaseClient';
import { CreateEmpresaDTO } from '@/types/empresa';

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

export interface Empresa {
  id: number;
  razon_social: string;
  nit: string;
  direccion: string;
  telefono: string;
  email: string;
  representante_legal: string;
  tipo_empresa: string;
  documento_contrato?: string;
  documento_camara_comercio?: string;
  documento_rut?: string;
  actividad_economica_id?: string;
  regimen_tributario_id?: string | number;
  numero_empleados?: number;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Crea una nueva empresa en la tabla empresa
 */
export const createEmpresa = async (data: CreateEmpresaDTO): Promise<Empresa | null> => {
  const { startLoading, stopLoading } = getLoadingContext();
  
  try {
    startLoading();
    console.log('Creando empresa con datos:', data);
    
    // Preparar los datos para la inserción usando la estructura de la tabla empresas
    const empresaData = {
      razon_social: data.razon_social,
      nit: data.nit,
      direccion: data.direccion,
      telefono: data.telefono,
      email: data.email,
      representante_legal: data.representante_legal,
      ciudad: data.ciudad_nombre || data.ciudad || "",
      actividad_economica_id: data.actividad_economica, // ID del código CIIU
      regimen_tributario_id: data.regimen_tributario, // ID del régimen tributario
      numero_empleados: data.numero_empleados, // Número de empleados
      documento_contrato: data.documento_contrato_base64,
      documento_camara_comercio: data.documento_camara_comercio_base64,
      documento_rut: data.documento_rut_base64,
      tipo_empresa: data.tipo_empresa || 'prestador',
      activo: data.activo || true
    };

    console.log('=== DATOS A INSERTAR EN EMPRESA ===');
    console.log('actividad_economica_id:', empresaData.actividad_economica_id);
    console.log('regimen_tributario_id:', empresaData.regimen_tributario_id);
    console.log('numero_empleados:', empresaData.numero_empleados);
    console.log('===================================');

    const { data: result, error } = await supabase
      .from('empresas')
      .insert([empresaData])
      .select()
      .single();

    if (error) {
      console.error('Error al crear empresa:', error);
      return null;
    }

    console.log('Empresa creada exitosamente:', result);

    // Guardar las plantillas seleccionadas en empresas_plantillas
    if (data.plantillas_seleccionadas && data.plantillas_seleccionadas.length > 0) {
      const plantillasToInsert = data.plantillas_seleccionadas.map(plantillaId => ({
        empresa_id: result.id,
        plantilla_id: plantillaId
      }));

      const { error: plantillasError } = await supabase
        .from('empresas_plantillas')
        .insert(plantillasToInsert);

      if (plantillasError) {
        console.error('Error al guardar plantillas:', plantillasError);
      } else {
        console.log('Plantillas guardadas exitosamente');
      }
    }

    return result;
  } catch (error) {
    console.error('Error en createEmpresa:', error);
    return null;
  } finally {
    stopLoading();
  }
};

/**
 * Obtiene una empresa por ID
 */
export const getEmpresaById = async (id: number): Promise<Empresa | null> => {
  const { startLoading, stopLoading } = getLoadingContext();
  
  try {
    startLoading();
    // Primero obtener la empresa
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', id)
      .single();

    if (empresaError) {
      console.error('Error al obtener empresa:', empresaError);
      return null;
    }

    // Luego obtener las plantillas asociadas
    console.log('=== CONSULTANDO PLANTILLAS PARA EMPRESA ID:', id, '===');
    
    const { data: plantillasAsociadas, error: plantillasError } = await supabase
      .from('empresas_plantillas')
      .select('*')
      .eq('empresa_id', id);

    console.log('Consulta plantillas - data:', plantillasAsociadas);
    console.log('Consulta plantillas - error:', plantillasError);

    if (plantillasError) {
      console.error('Error al obtener plantillas asociadas:', plantillasError);
    }

    // Si hay plantillas asociadas, obtener sus detalles
    let plantillasDetalladas: any[] = [];
    if (plantillasAsociadas && plantillasAsociadas.length > 0) {
      const plantillaIds = plantillasAsociadas.map(ep => ep.plantilla_id);
      console.log('IDs de plantillas encontrados:', plantillaIds);
      
      const { data: plantillasData, error: plantillasDataError } = await supabase
        .from('plantillas_solicitudes')
        .select('id, nombre, descripcion')
        .in('id', plantillaIds);
      
      console.log('Plantillas detalladas obtenidas:', plantillasData);
      console.log('Error al obtener plantillas detalladas:', plantillasDataError);
      
      plantillasDetalladas = plantillasData || [];
    }

    // Transformar los datos para que las plantillas estén en el formato esperado
    const empresaConPlantillas = {
      ...empresa,
      plantillas: plantillasDetalladas
    };

    console.log('Empresa obtenida:', empresa);
    console.log('Plantillas asociadas (raw):', plantillasAsociadas);
    console.log('Plantillas asociadas (length):', plantillasAsociadas?.length);
    console.log('Empresa con plantillas:', empresaConPlantillas);
    console.log('Plantillas en empresa final:', empresaConPlantillas.plantillas);
    console.log('Plantillas length en empresa final:', empresaConPlantillas.plantillas?.length);
    console.log('Propiedades de empresaConPlantillas:', Object.keys(empresaConPlantillas));
    console.log('¿Tiene propiedad plantillas?:', 'plantillas' in empresaConPlantillas);
    console.log('=== DATOS DE LA EMPRESA ===');
    console.log('actividad_economica_id:', empresa.actividad_economica_id);
    console.log('regimen_tributario_id:', empresa.regimen_tributario_id);
    console.log('numero_empleados:', empresa.numero_empleados);
    console.log('Tipo de actividad_economica_id:', typeof empresa.actividad_economica_id);
    console.log('Tipo de regimen_tributario_id:', typeof empresa.regimen_tributario_id);
    console.log('Tipo de numero_empleados:', typeof empresa.numero_empleados);
    console.log('Todas las propiedades de empresa:', Object.keys(empresa));
    console.log('Empresa completa (JSON):', JSON.stringify(empresa, null, 2));
    console.log('==========================');
    
    return empresaConPlantillas;
  } catch (error) {
    console.error('Error en getEmpresaById:', error);
    return null;
  } finally {
    stopLoading();
  }
};

/**
 * Actualiza una empresa existente
 */
export const updateEmpresa = async (id: number, data: Partial<CreateEmpresaDTO>): Promise<Empresa | null> => {
  const { startLoading, stopLoading } = getLoadingContext();
  
  try {
    startLoading();
    console.log('Actualizando empresa con datos:', data);
    
    // Preparar los datos para la actualización usando la estructura de la tabla empresas
    const empresaData = {
      razon_social: data.razon_social,
      nit: data.nit,
      direccion: data.direccion,
      telefono: data.telefono,
      email: data.email,
      representante_legal: data.representante_legal,
      ciudad: data.ciudad_nombre || data.ciudad || "",
      actividad_economica_id: data.actividad_economica, // ID del código CIIU
      regimen_tributario_id: data.regimen_tributario, // ID del régimen tributario
      numero_empleados: data.numero_empleados, // Número de empleados
      documento_contrato: data.documento_contrato_base64,
      documento_camara_comercio: data.documento_camara_comercio_base64,
      documento_rut: data.documento_rut_base64,
      tipo_empresa: data.tipo_empresa || 'prestador',
      activo: data.activo || true
    };

    console.log('=== DATOS A ACTUALIZAR EN EMPRESA ===');
    console.log('actividad_economica_id:', empresaData.actividad_economica_id);
    console.log('regimen_tributario_id:', empresaData.regimen_tributario_id);
    console.log('numero_empleados:', empresaData.numero_empleados);
    console.log('===================================');

    const { data: result, error } = await supabase
      .from('empresas')
      .update(empresaData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error al actualizar empresa:', error);
      return null;
    }

    console.log('Empresa actualizada exitosamente:', result);

    // Actualizar las plantillas seleccionadas en empresas_plantillas
    if (data.plantillas_seleccionadas) {
      // Primero eliminar todas las plantillas existentes
      const { error: deleteError } = await supabase
        .from('empresas_plantillas')
        .delete()
        .eq('empresa_id', id);

      if (deleteError) {
        console.error('Error al eliminar plantillas existentes:', deleteError);
      }

      // Luego insertar las nuevas plantillas
      if (data.plantillas_seleccionadas.length > 0) {
        const plantillasToInsert = data.plantillas_seleccionadas.map(plantillaId => ({
          empresa_id: id,
          plantilla_id: plantillaId
        }));

        const { error: plantillasError } = await supabase
          .from('empresas_plantillas')
          .insert(plantillasToInsert);

        if (plantillasError) {
          console.error('Error al guardar plantillas:', plantillasError);
        } else {
          console.log('Plantillas actualizadas exitosamente');
        }
      }
    }

    return result;
  } catch (error) {
    console.error('Error en updateEmpresa:', error);
    return null;
  } finally {
    stopLoading();
  }
};

/**
 * Obtiene todas las empresas
 */
export const getAllEmpresas = async (): Promise<Empresa[]> => {
  const { startLoading, stopLoading } = getLoadingContext();
  
  try {
    startLoading();
    const { data, error } = await supabase
      .from('empresas')
      .select('*')
      .order('razon_social');

    if (error) {
      console.error('Error al obtener empresas:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error en getAllEmpresas:', error);
    return [];
  } finally {
    stopLoading();
  }
};

// Exportar el servicio completo
export const empresaService = {
  create: createEmpresa,
  getById: getEmpresaById,
  update: updateEmpresa,
  getAll: getAllEmpresas
}; 
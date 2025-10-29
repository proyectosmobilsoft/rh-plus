import { obtenerEmpresaPorId } from '@/services/empresasService';

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
 * Guarda la empresa seleccionada consultando primero la base de datos
 */
export const guardarEmpresaSeleccionadaConConsulta = async (empresaId: number): Promise<boolean> => {
  try {
    // Consultar información completa de la empresa
    const empresaCompleta = await obtenerEmpresaPorId(empresaId);
    
    if (!empresaCompleta) {
      console.error('No se pudo obtener información de la empresa con ID:', empresaId);
      return false;
    }
    
    // Mapear de snake_case a camelCase para compatibilidad
    const empresaMapeada: Empresa = {
      id: empresaCompleta.id,
      nombre: empresaCompleta.nombre,
      razonSocial: empresaCompleta.razon_social,
      nit: empresaCompleta.nit,
      direccion: empresaCompleta.direccion,
      telefono: empresaCompleta.telefono,
      email: empresaCompleta.email,
      representanteLegal: empresaCompleta.representante_legal,
      cargoRepresentante: empresaCompleta.cargo_representante,
      estado: empresaCompleta.estado,
      createdAt: empresaCompleta.createdAt,
      updatedAt: empresaCompleta.updatedAt,
    };
    
    // Guardar empresa Y datos de autenticación
    const resultado = guardarEmpresaSeleccionada(empresaMapeada);
    
    if (resultado) {
      return true;
    } else {
      console.error('Error al guardar empresa y datos de autenticación');
      return false;
    }
  } catch (error) {
    console.error('Error en guardarEmpresaSeleccionadaConConsulta:', error);
    return false;
  }
};



/**
 * Función para guardar la empresa seleccionada en localStorage
 */
export const guardarEmpresaSeleccionada = (empresa: Empresa): boolean => {
  try {
    // Guardar empresaData
    localStorage.setItem('empresaData', JSON.stringify(empresa));
    
    // Disparar evento para notificar a otros componentes
    window.dispatchEvent(new CustomEvent('empresaSelected', { detail: empresa }));
    
    return true;
  } catch (error) {
    console.error('Error al guardar empresa en localStorage:', error);
    return false;
  }
};

/**
 * Función para obtener la empresa seleccionada desde localStorage
 */
export const obtenerEmpresaSeleccionada = (): Empresa | null => {
  try {
    const empresaDataString = localStorage.getItem('empresaData');
    if (empresaDataString) {
      const empresa = JSON.parse(empresaDataString);
      return empresa;
    }
    return null;
  } catch (error) {
    console.error('Error al obtener empresa desde localStorage:', error);
    return null;
  }
};

/**
 * Función para verificar si hay una empresa seleccionada
 */
export const hayEmpresaSeleccionada = (): boolean => {
  try {
    const empresaData = localStorage.getItem('empresaData');
    return empresaData !== null;
  } catch (error) {
    console.error('Error al verificar empresa seleccionada:', error);
    return false;
  }
};

/**
 * Función para limpiar la empresa seleccionada del localStorage
 */
export const limpiarEmpresaSeleccionada = (): void => {
  try {
    localStorage.removeItem('empresaData');
  } catch (error) {
    console.error('Error al limpiar empresa del localStorage:', error);
  }
};

/**
 * Función para debuggear el estado de localStorage
 */
export const debugLocalStorage = () => {
  const userData = localStorage.getItem('userData');
  const authToken = localStorage.getItem('authToken');
  const empresaData = localStorage.getItem('empresaData');
  
  // Función de debug - no hace nada en producción
  // Se puede eliminar si no se usa
  return {
    userData: userData ? JSON.parse(userData) : null,
    authToken,
    empresaData: empresaData ? JSON.parse(empresaData) : null
  };
};

/**
 * Función para obtener información completa del usuario con empresa
 */
export const obtenerUsuarioConEmpresa = () => {
  try {
    const userDataString = localStorage.getItem('userData');
    const userData = userDataString ? JSON.parse(userDataString) : {};
    
    return {
      ...userData,
      empresa: userData.empresa || obtenerEmpresaSeleccionada()
    };
  } catch (error) {
    console.error('Error al obtener usuario con empresa:', error);
    return null;
  }
}; 


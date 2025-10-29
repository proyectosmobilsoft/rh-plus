import { User } from '@/contexts/AuthContext';

/**
 * Valida si el usuario autenticado tiene una empresa asociada
 * @param user - Usuario autenticado
 * @returns true si tiene empresa asociada, false si no
 */
export function hasEmpresaAsociada(user: User | null): boolean {
  if (!user) {
    return false;
  }

  // Verificar si tiene empresas en el array de empresas
  if (user.empresas && user.empresas.length > 0) {
    return true;
  }

  // Verificar si hay empresa seleccionada en localStorage
  try {
    const empresaData = localStorage.getItem('empresaData');
    if (empresaData) {
      const empresa = JSON.parse(empresaData);
      return empresa && empresa.id;
    }
  } catch (error) {
    // Silenciar error de localStorage
  }

  return false;
}

/**
 * Obtiene la empresa seleccionada del localStorage
 * @returns ID de la empresa seleccionada o null si no hay
 */
export function getEmpresaSeleccionada(): number | null {
  try {
    const empresaData = localStorage.getItem('empresaData');
    if (empresaData) {
      const empresa = JSON.parse(empresaData);
      return empresa?.id || null;
    }
  } catch (error) {
    // Silenciar error de localStorage
  }
  return null;
}

/**
 * Obtiene información completa de la empresa seleccionada
 * @returns Objeto con información de la empresa o null si no hay
 */
export function getEmpresaInfo(): { id: number; razon_social: string } | null {
  try {
    const empresaData = localStorage.getItem('empresaData');
    if (empresaData) {
      const empresa = JSON.parse(empresaData);
      return {
        id: empresa.id,
        razon_social: empresa.razon_social
      };
    }
  } catch (error) {
    // Silenciar error de localStorage
  }
  return null;
}

/**
 * Valida si el usuario puede crear solicitudes
 * @param user - Usuario autenticado
 * @returns Objeto con resultado de validación y mensaje de error si aplica
 */
export function canCreateSolicitud(user: User | null): {
  canCreate: boolean;
  errorMessage?: string;
  empresaId?: number;
} {
  if (!user) {
    return {
      canCreate: false,
      errorMessage: 'No hay usuario autenticado'
    };
  }

  if (!hasEmpresaAsociada(user)) {
    return {
      canCreate: false,
      errorMessage: 'No tienes ninguna empresa asociada a tu cuenta'
    };
  }

  const empresaId = getEmpresaSeleccionada();
  if (!empresaId) {
    return {
      canCreate: false,
      errorMessage: 'No hay empresa seleccionada'
    };
  }

  return {
    canCreate: true,
    empresaId
  };
}


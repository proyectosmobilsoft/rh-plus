import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Permission } from '@/config/permissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ 
  children, 
  permission, 
  permissions = [], 
  requireAll = false,
  fallback 
}: ProtectedRouteProps) {
  const { user, isLoading, hasPermission, hasAnyPermission } = useAuth();

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Si no está autenticado, redirigir al login
  if (!user) {
    window.location.href = '/login';
    return null;
  }

  // TEMPORALMENTE DESACTIVADO: Siempre dar acceso
  return <>{children}</>;

  /* CÓDIGO ORIGINAL COMENTADO
  // Verificar permisos específicos
  let hasAccess = true;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions.length > 0) {
    if (requireAll) {
      // Requiere todos los permisos
      hasAccess = permissions.every(perm => hasPermission(perm));
    } else {
      // Requiere al menos uno de los permisos
      hasAccess = hasAnyPermission(permissions);
    }
  }

  // Si no tiene acceso, mostrar fallback o página de acceso denegado
  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md mx-auto text-center">
          <div className="mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.232 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
          <p className="text-gray-600 mb-6">
            No tienes los permisos necesarios para acceder a esta página.
          </p>
          <div className="space-x-4">
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Volver
            </button>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Ir al Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
  */
}

// Hook personalizado para verificar permisos en componentes
export function usePermissions() {
  // TEMPORALMENTE DESACTIVADO: Siempre retornar true
  return {
    hasPermission: () => true,
    hasAnyPermission: () => true,
    canAccess: () => true,
    canAccessAny: () => true
  };
}
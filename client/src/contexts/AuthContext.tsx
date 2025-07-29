import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserRole, Permission, getUserPermissions } from '@/config/permissions';
import { guardarEmpresaSeleccionadaConConsulta } from '@/utils/empresaUtils';

export interface User {
  id: number;
  username: string;
  email: string;
  primerNombre: string;
  primerApellido: string;
  role: UserRole;
  permissions: Permission[];
  activo: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  selectEmpresa: (empresaId: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
}

interface LoginCredentials {
  username: string;
  password: string;
  empresaId?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Verificar sesión existente al cargar
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Verificar si hay datos de usuario en localStorage
      const userData = localStorage.getItem('userData');
      const token = localStorage.getItem('authToken');
      
      console.log('=== INICIO: checkSession ===');
      console.log('userData existe:', !!userData);
      console.log('token existe:', !!token);
      
      if (userData && token) {
        try {
          // Verificar si es un token simulado (nuestro formato)
          const tokenParts = token.split('.');
          console.log('Token parts:', tokenParts.length);
          
          if (tokenParts.length === 2) {
            // Es un token simulado, no verificar con el servidor
            console.log('✅ Token simulado detectado, saltando verificación del servidor');
            const user = JSON.parse(userData);
            setUser(user);
            console.log('Usuario restaurado desde localStorage:', user);
            return;
          }
          
          console.log('🔍 Token no simulado, verificando con servidor...');
          // Verificar token con el servidor solo si no es simulado
          const response = await fetch('/api/auth/verify', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            // Token válido, restaurar usuario
            const user = JSON.parse(userData);
            const userPermissions = await getUserPermissionsFromDB(user.id, user.role);
          
            setUser({
              ...user,
              permissions: userPermissions
            });
          } else {
            // Token inválido, limpiar localStorage
            console.log('❌ Token inválido, limpiando localStorage');
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            localStorage.removeItem('empresaData');
          }
        } catch (verifyError) {
          console.error('Error verificando token:', verifyError);
          // Solo limpiar si no es un token simulado
          if (!token.includes('.')) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            localStorage.removeItem('empresaData');
          }
        }
      } else {
        console.log('No hay datos de autenticación en localStorage');
      }
      
      console.log('=== FIN: checkSession ===');
    } catch (error) {
      console.error('Error checking session:', error);
      setError('Error al verificar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      // Validar credenciales con el servidor
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(credentials),
          credentials: 'include'
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Error en las credenciales');
        }

        const data = await response.json();
      
      // Guardar token en localStorage
      if (data.token) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userData', JSON.stringify(data.user));
      }
        
        // Obtener permisos del usuario
        const userPermissions = await getUserPermissionsFromDB(data.user.id, data.user.role);
        
        const userWithPermissions = {
          ...data.user,
          permissions: userPermissions
        };

        setUser(userWithPermissions);
        
        // Redirigir según el rol del usuario
        const dashboard = getDefaultDashboard(data.user.role);
        window.location.href = dashboard;

    } catch (error) {
      throw error;
    }
  };

  const selectEmpresa = async (empresaId: string) => {
    try {
      console.log('Seleccionando empresa con ID:', empresaId);
      
      // Consultar empresa en base de datos y guardar TODO
      const resultado = await guardarEmpresaSeleccionadaConConsulta(parseInt(empresaId));
      
      if (resultado) {
        console.log('Empresa seleccionada y datos de autenticación guardados exitosamente');
        
        // Actualizar el estado del usuario con los datos guardados
        const userDataString = localStorage.getItem('userData');
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          setUser(userData);
          console.log('Estado del usuario actualizado:', userData);
        }
        
        // Redirigir al dashboard
        const dashboard = getDefaultDashboard(user?.role || 'admin');
        window.location.href = dashboard;
      } else {
        throw new Error('No se pudo guardar la empresa seleccionada');
      }
    } catch (error) {
      console.error('Error selecting empresa:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Limpiar estado local y localStorage
      setUser(null);
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      localStorage.removeItem('empresaData'); // Borrar también empresaData
      
      console.log('Sesión cerrada - todos los datos eliminados del localStorage');
      
      // Redirigir al login
      window.location.href = '/login';
    }
  };

  // Función para obtener permisos del usuario desde la base de datos
  const getUserPermissionsFromDB = async (userId: number, role: UserRole): Promise<Permission[]> => {
    try {
      // Obtener permisos base del rol
      const basePermissions = getUserPermissions(role);
      
      // Obtener permisos adicionales del usuario desde la base de datos
      const response = await fetch(`/api/usuarios/${userId}/permisos`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const additionalPermissions = await response.json();
        return getUserPermissions(role, additionalPermissions);
      }
      
      return basePermissions;
    } catch (error) {
      console.error('Error loading user permissions:', error);
      return getUserPermissions(role);
    }
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    return user.permissions.includes(permission);
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    if (!user) return false;
    return permissions.some(permission => user.permissions.includes(permission));
  };

  const getDefaultDashboard = (role: UserRole): string => {
    switch (role) {
      case "admin":
        return "/dashboard";
      case "analista":
        return "/dashboard";
      case "cliente":
        return "/empresa/dashboard";
      case "candidato":
        return "/candidato/perfil";
      default:
        return "/dashboard";
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    selectEmpresa,
    logout,
    hasPermission,
    hasAnyPermission
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
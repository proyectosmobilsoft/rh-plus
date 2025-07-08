import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserRole, Permission, getUserPermissions } from '@/config/permissions';

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
  logout: () => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
}

interface LoginCredentials {
  username: string;
  password: string;
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

  // Verificar sesión existente al cargar
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/auth/session', {
        credentials: 'include'
      });

      if (response.ok) {
        const sessionData = await response.json();
        if (sessionData.user) {
          // Obtener permisos del usuario desde la base de datos
          const userPermissions = await getUserPermissionsFromDB(sessionData.user.id, sessionData.user.role);
          
          setUser({
            ...sessionData.user,
            permissions: userPermissions
          });
        }
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
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

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setUser(null);
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
        return "/candidatos/perfil";
      default:
        return "/dashboard";
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
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
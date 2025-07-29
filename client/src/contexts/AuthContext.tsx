import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserRole, Permission, getUserPermissions } from '@/config/permissions';
import { authService } from '@/services/authService';

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
  selectEmpresa: (empresaId: string) => void;
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
      
      if (userData && token) {
        try {
          // Con Supabase, verificamos directamente desde localStorage
          const user = JSON.parse(userData);
          const userPermissions = await getUserPermissionsFromDB(user.id, user.role);
          
          setUser({
            ...user,
            permissions: userPermissions
          });
        } catch (verifyError) {
          console.error('Error verificando usuario:', verifyError);
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
        }
      }
    } catch (error) {
      console.error('Error checking session:', error);
      setError('Error al verificar sesión');
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      // Usar el servicio de autenticación con Supabase
      const userValidation = await authService.validateUser(credentials.username);
      
      if (!userValidation) {
        throw new Error('Usuario no encontrado');
      }

      // Verificar contraseña
      const isValidPassword = await authService.verifyPassword(userValidation.user.id, credentials.password);
      
      if (!isValidPassword) {
        throw new Error('Contraseña incorrecta');
      }

      // Crear token simple (en producción usarías JWT real)
      const token = btoa(JSON.stringify({
        userId: userValidation.user.id,
        timestamp: Date.now()
      }));

      // Determinar el rol del usuario
      const userRole = userValidation.roles[0]?.nombre as UserRole || 'admin';
      
      const userData = {
        id: userValidation.user.id,
        username: userValidation.user.username,
        email: userValidation.user.email,
        primerNombre: userValidation.user.primer_nombre,
        primerApellido: userValidation.user.primer_apellido,
        role: userRole,
        activo: userValidation.user.activo
      };

      // Guardar datos en localStorage
      localStorage.setItem('authToken', token);
      localStorage.setItem('userData', JSON.stringify(userData));
      
      // Obtener permisos del usuario
      const userPermissions = await getUserPermissionsFromDB(userData.id, userRole);
      
      const userWithPermissions = {
        ...userData,
        permissions: userPermissions
      };

      setUser(userWithPermissions);
      
      // Redirigir según el rol del usuario
      const dashboard = getDefaultDashboard(userRole);
      window.location.href = dashboard;

    } catch (error) {
      throw error;
    }
  };

  const selectEmpresa = (empresaId: string) => {
    // Crear usuario simulado con la información ya validada
    const mockUser = {
      id: 1,
      username: 'usuario_validado',
      email: 'usuario@validado.com',
      primerNombre: 'Usuario',
      primerApellido: 'Validado',
      role: 'admin' as const,
      permissions: [],
      activo: true,
      selectedEmpresa: { 
        id: parseInt(empresaId), 
        razon_social: 'Empresa seleccionada' 
      }
    };

    // Crear token simulado
    const mockToken = btoa(JSON.stringify({
      userId: 1,
      username: 'usuario_validado',
      email: 'usuario@validado.com',
      role: 'admin',
      empresaId: parseInt(empresaId)
    })) + '.' + Date.now();

    // Guardar en localStorage
    localStorage.setItem('authToken', mockToken);
    localStorage.setItem('userData', JSON.stringify(mockUser));

    setUser(mockUser);
    
    // Redirigir al dashboard
    const dashboard = getDefaultDashboard(mockUser.role);
    window.location.href = dashboard;
  };

  const logout = async () => {
    try {
      // Con Supabase, solo limpiamos el localStorage
      // No necesitamos hacer llamada al servidor
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Limpiar estado local y localStorage
      setUser(null);
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      
      // Redirigir al login
      window.location.href = '/login';
    }
  };

  // Función para obtener permisos del usuario desde la base de datos
  const getUserPermissionsFromDB = async (userId: number, role: UserRole): Promise<Permission[]> => {
    try {
      // Obtener permisos base del rol
      const basePermissions = getUserPermissions(role);
      
      // Con Supabase, por ahora solo retornamos los permisos base del rol
      // En el futuro puedes agregar permisos específicos del usuario desde Supabase
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
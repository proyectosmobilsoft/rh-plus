import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserRole, Permission, getUserPermissions } from '@/config/permissions';
import { guardarEmpresaSeleccionadaConConsulta } from '@/utils/empresaUtils';
import { authService } from '@/services/authService';
import { supabase } from '@/services/supabaseClient';

export interface User {
  id: number;
  username: string;
  email: string;
  primerNombre: string;
  primerApellido: string;
  role: UserRole;
  permissions: Permission[];
  activo: boolean;
  roles?: Array<{
    id: number;
    nombre: string;
  }>;
  empresas?: Array<{
    id: number;
    razon_social: string;
  }>;
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
      const userData = localStorage.getItem('userData');
      const token = localStorage.getItem('authToken');
      
      if (userData && token) {
        try {
          // Verificar si es un token simulado (nuestro formato)
          const tokenParts = token.split('.');
          
          if (tokenParts.length === 3 && tokenParts[0] === 'simulated') {
            const [, expStr, userIdStr] = tokenParts;
            const expMs = Number(expStr);
            const tokenUserId = Number(userIdStr);

            // Validaciones básicas del token simulado
            if (!Number.isFinite(expMs)) {
              localStorage.removeItem('authToken');
              localStorage.removeItem('userData');
              localStorage.removeItem('empresaData');
              return;
            }

            if (expMs <= Date.now()) {
              localStorage.removeItem('authToken');
              localStorage.removeItem('userData');
              localStorage.removeItem('empresaData');
              return;
            }

            const parsedUser = JSON.parse(userData);
            if (!Number.isFinite(tokenUserId) || parsedUser?.id !== tokenUserId) {
              localStorage.removeItem('authToken');
              localStorage.removeItem('userData');
              localStorage.removeItem('empresaData');
              return;
            }

            setUser(parsedUser);
            
            // Intentar sincronizar con Supabase Auth al restaurar sesión
            try {
              const email = parsedUser.email || `${parsedUser.username}@compensamos.com`;
              // Intentar obtener la sesión actual de Supabase Auth
              const { data: { session } } = await supabase.auth.getSession();
              if (!session) {
                // Nota: No podemos hacer sign in sin la contraseña aquí
                // Pero podemos verificar si hay una sesión guardada
                const { data: { user } } = await supabase.auth.getUser();
              }
            } catch (authSyncError) {
              // Error sincronizando con Supabase Auth al restaurar
            }
            
            return;
          }
          
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
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            localStorage.removeItem('empresaData');
          }
        } catch (verifyError) {
          console.error('Error verificando token:', verifyError);
          // Solo limpiar si no es un token simulado
          if (!token.includes('simulated')) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            localStorage.removeItem('empresaData');
          }
        }
      }
    } catch (error) {
      console.error('Error en checkSession:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      // Validar usuario con Supabase
      const userValidation = await authService.validateUser(credentials.username);
      
      if (!userValidation) {
        throw new Error('Usuario no encontrado');
      }

      // Verificar contraseña
      const passwordResult = await authService.verifyPassword(userValidation.user.id, credentials.password);
      
      if (!passwordResult.success) {
        throw new Error('Contraseña incorrecta');
      }

      const userData = passwordResult.userData;

      // Enriquecer userData con acciones por rol desde gen_roles_modulos
      try {
        const accionesPorRol: Record<string, string[]> = {};
        // Obtener acciones por cada rol asignado
        const roleIds = (userData.roles || []).map((r: any) => r.id).filter((id: any) => id != null);
        if (roleIds.length > 0) {
          const { supabase } = await import('@/services/supabaseClient');
          const { data, error } = await supabase
            .from('gen_roles_modulos')
            .select('rol_id, selected_actions_codes')
            .in('rol_id', roleIds);
          if (!error && Array.isArray(data)) {
            for (const row of data) {
              const key = String(row.rol_id);
              const codes = Array.isArray(row.selected_actions_codes) ? row.selected_actions_codes : [];
              accionesPorRol[key] = codes as string[];
            }
            (userData as any).accionesPorRol = accionesPorRol;
            // También aplanado total por conveniencia
            const set = new Set<string>();
            Object.values(accionesPorRol).forEach((arr) => arr.forEach((c) => set.add(c)));
            (userData as any).acciones = Array.from(set);
          } else {
            // Asegurar que existan las claves aunque vengan vacías
            (userData as any).accionesPorRol = accionesPorRol;
            (userData as any).acciones = [];
          }
        } else {
          // Sin roles, asegurar claves vacías
          (userData as any).accionesPorRol = accionesPorRol;
          (userData as any).acciones = [];
        }
      } catch (e) {
        // Asegurar claves incluso en error
        if (!(userData as any).accionesPorRol) (userData as any).accionesPorRol = {};
        if (!(userData as any).acciones) (userData as any).acciones = [];
      }

      // Generar JWT real vía Edge Function (o fallback a token simulado si falla)
      let token: string | null = null;
      try {
        // Usar la URL completa de Supabase para las Edge Functions
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://clffvmueangquavnaokd.supabase.co';
        const edgeFunctionUrl = `${supabaseUrl}/functions/v1/issue-jwt`;
        
        const res = await fetch(edgeFunctionUrl, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`,
            'apikey': `${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`
          },
          body: JSON.stringify({ userData })
        });
        if (res.ok) {
          const { token: jwt } = await res.json();
          token = jwt;
        }
      } catch (e) {
        // Error llamando issue-jwt
      }

      if (!token) {
        const expMs = Date.now() + 1000 * 60 * 60 * 8;
        token = `simulated.${expMs}.${userData.id}`;
      }

      localStorage.setItem('authToken', token);
      
      // Si recibimos un JWT real, tomar accionesPorRol/acciones desde su payload
      try {
        const parts = token.split('.');
        if (parts.length === 3 && parts[0] !== 'simulated') {
          const base64url = parts[1];
          const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
          const json = decodeURIComponent(Array.prototype.map.call(atob(base64), (c: string) =>
            '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
          ).join(''));
          const payload = JSON.parse(json);
          if (payload && (payload.accionesPorRol || payload.acciones)) {
            (userData as any).accionesPorRol = payload.accionesPorRol || (userData as any).accionesPorRol || {};
            (userData as any).acciones = payload.acciones || (userData as any).acciones || [];
          }
        }
      } catch (e) {
        // No se pudieron leer acciones desde el JWT
      }

      // Obtener permisos del usuario
      const userPermissions = await getUserPermissionsFromDB(userData.id, userData.role);
      
      const userWithPermissions = {
        ...userData,
        permissions: userPermissions
      };

      // Guardar datos completos del usuario en localStorage (incluye foto)
      /*localStorage.setItem('userData', JSON.stringify(userWithPermissions));*/

      // Actualizar estado del contexto
      setUser(userWithPermissions);
      
      // 🔐 SINCRONIZAR CON SUPABASE AUTH (Opcional - se ejecuta en background)
      // Esta sincronización es completamente opcional y no bloquea el login
      // Solo se intenta para habilitar Storage, pero si falla, la app funciona normalmente
      // Se ejecuta en un setTimeout para no bloquear el flujo principal
      setTimeout(async () => {
        try {
          const email = userData.email || `${userData.username}@compensamos.com`;
          
          // Verificar primero si el usuario ya tiene una sesión activa
          const { data: { session: existingSession } } = await supabase.auth.getSession();
          if (existingSession) {
            return; // Ya está sincronizado
          }
          
          // Guardar temporalmente la contraseña en sessionStorage para poder establecer sesión más tarde
          // Esto se limpia automáticamente al cerrar la pestaña
          sessionStorage.setItem('temp_password', credentials.password);
          
          // Intentar hacer sign in de forma silenciosa
          // Si falla, simplemente continuamos sin Supabase Auth
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: email,
            password: credentials.password
          }).catch(() => ({ data: null, error: { message: 'Sign in failed' } }));
          
          if (!signInError && signInData?.session) {
            // Sesión establecida exitosamente
            // Limpiar la contraseña temporal después de establecer la sesión
            sessionStorage.removeItem('temp_password');
          } else {
            // Si falla el sign in, intentar crear el usuario solo una vez
            // Usar un flag para evitar múltiples intentos
            const syncKey = `supabase_auth_sync_attempted_${userData.id}`;
            if (!localStorage.getItem(syncKey)) {
              localStorage.setItem(syncKey, 'true');
              
              try {
                const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                  email: email,
                  password: credentials.password,
                  options: {
                    data: {
                      username: userData.username,
                      id: userData.id,
                      primer_nombre: userData.primerNombre,
                      primer_apellido: userData.primerApellido,
                      role: userData.role
                    }
                  }
                });
                
                // Si hay error (usuario ya existe, etc.), simplemente ignorar
              } catch {
                // Ignorar cualquier error al crear usuario
              }
            }
          }
        } catch {
          // Cualquier error se ignora completamente - no es crítico
        }
      }, 500); // Ejecutar después de un delay para no interferir con el login
      
      // Si el usuario tiene múltiples empresas, mostrar selector
      if (userValidation.empresas.length > 1) {
        window.location.href = '/select-empresa';
        return;
      }
      
      // Si tiene solo una empresa, seleccionarla automáticamente
      if (userValidation.empresas.length === 1) {
        try {
          await selectEmpresa(userValidation.empresas[0].id.toString());
          return;
        } catch (empresaError) {
          console.error('Error seleccionando empresa automáticamente:', empresaError);
          // Continuar con el flujo normal
        }
      }
      
      // Redirigir al dashboard
      const dashboard = getDefaultDashboard(userData.role);
      window.location.href = dashboard;

    } catch (error) {
      console.error('❌ Error en login:', error);
      throw error;
    }
  };

  const selectEmpresa = async (empresaId: string) => {
    try {
      // Consultar empresa en base de datos y guardar TODO
      const resultado = await guardarEmpresaSeleccionadaConConsulta(parseInt(empresaId));
      
      if (resultado) {
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
      // Con Supabase, solo limpiamos el localStorage
      // No necesitamos hacer llamada al servidor
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Limpiar estado local y localStorage
      setUser(null);
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      localStorage.removeItem('empresaData'); // Borrar también empresaData
      
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


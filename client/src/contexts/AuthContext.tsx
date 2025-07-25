import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, authService, type AuthUser } from '@/services/supabaseClient';
import { toast } from 'sonner';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signUp: (email: string, password: string, metadata?: any) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Obtener sesión inicial
    const getInitialSession = async () => {
      try {
        const session = await authService.getSession();
        setUser(session?.user || null);
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      await authService.login(email, password);
      toast.success('Inicio de sesión exitoso');
    } catch (error: any) {
      toast.error(error.message || 'Error en el inicio de sesión');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await authService.logout();
      toast.success('Sesión cerrada exitosamente');
    } catch (error: any) {
      toast.error(error.message || 'Error al cerrar sesión');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      setLoading(true);
      await authService.signUp(email, password, metadata);
      toast.success('Usuario registrado exitosamente');
    } catch (error: any) {
      toast.error(error.message || 'Error en el registro');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      await authService.resetPassword(email);
      toast.success('Se ha enviado un enlace de recuperación a tu email');
    } catch (error: any) {
      toast.error(error.message || 'Error al enviar el enlace de recuperación');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    signUp,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
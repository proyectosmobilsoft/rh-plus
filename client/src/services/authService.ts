import { supabase } from './supabaseClient';

export interface LoginCredentials {
  username: string;
  password: string;
  empresaId?: string;
}

export interface AuthResponse {
  user: {
    id: number;
    username: string;
    email: string;
    primer_nombre: string;
    primer_apellido: string;
    role: string;
    activo: boolean;
  };
  token: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      console.log('🔐 Iniciando login con Supabase...');
      
      // Buscar el usuario en gen_usuarios por username o email
      const { data: userData, error: userError } = await supabase
        .from('gen_usuarios')
        .select('*')
        .or(`username.eq.${credentials.username},email.eq.${credentials.username}`)
        .eq('activo', true)
        .single();

      if (userError || !userData) {
        throw new Error('Usuario no encontrado o inactivo');
      }

      console.log('👤 Usuario encontrado:', userData);

      // Verificar la contraseña (usando el hash simple que implementamos)
      const expectedHash = btoa(credentials.password); // Base64 encoding
      
      if (userData.password_hash !== expectedHash) {
        throw new Error('Contraseña incorrecta');
      }

      console.log('✅ Contraseña verificada correctamente');

      // Obtener el rol del usuario
      const { data: userRoles, error: rolesError } = await supabase
        .from('gen_usuario_roles')
        .select(`
          gen_roles (
            id,
            nombre
          )
        `)
        .eq('usuario_id', userData.id);

      if (rolesError) {
        console.error('Error obteniendo roles:', rolesError);
      }

      const userRole = (userRoles?.[0]?.gen_roles as any)?.nombre || 'candidato';

      // Generar un token simple (en producción usarías JWT)
      const token = btoa(JSON.stringify({
        userId: userData.id,
        username: userData.username,
        role: userRole,
        timestamp: Date.now()
      }));

      const response: AuthResponse = {
        user: {
          id: userData.id,
          username: userData.username,
          email: userData.email,
          primer_nombre: userData.primer_nombre,
          primer_apellido: userData.primer_apellido,
          role: userRole,
          activo: userData.activo
        },
        token
      };

      console.log('🎉 Login exitoso:', response);
      return response;

    } catch (error) {
      console.error('❌ Error en login:', error);
      throw error;
    }
  },

  async logout(): Promise<void> {
    // Con Supabase, solo limpiamos el localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    console.log('👋 Logout completado');
  },

  async getCurrentUser(): Promise<any> {
    const token = localStorage.getItem('authToken');
    if (!token) {
      return null;
    }

    try {
      const tokenData = JSON.parse(atob(token));
      const { data: userData, error } = await supabase
        .from('gen_usuarios')
        .select('*')
        .eq('id', tokenData.userId)
        .eq('activo', true)
        .single();

      if (error || !userData) {
        return null;
      }

      return userData;
    } catch (error) {
      console.error('Error obteniendo usuario actual:', error);
      return null;
    }
  }
}; 
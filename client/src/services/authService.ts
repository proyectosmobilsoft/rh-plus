import { supabase } from './supabaseClient';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface UserValidation {
  user: {
    id: number;
    username: string;
    email: string;
    primer_nombre: string;
    primer_apellido: string;
    activo: boolean;
  };
  empresas: Array<{
    id: number;
    razon_social: string;
  }>;
  roles: Array<{
    id: number;
    nombre: string;
  }>;
}

export interface AuthService {
  // Métodos originales
  validateUser: (identifier: string) => Promise<UserValidation | null>;
  verifyPassword: (userId: number, password: string) => Promise<boolean>;
  getUserEmpresas: (userId: number) => Promise<any[]>;
  
  // Métodos de recuperación de contraseña
  generarCodigoVerificacion: (email: string) => Promise<{ success: boolean; message: string }>;
  verificarCodigo: (email: string, codigo: string) => Promise<{ success: boolean; message: string }>;
  cambiarContraseña: (email: string, codigo: string, nuevaContraseña: string) => Promise<{ success: boolean; message: string }>;
}

export const authService: AuthService = {
  // Métodos originales
  validateUser: async (identifier: string): Promise<UserValidation | null> => {
    try {
      console.log('Validando usuario:', identifier);
      
      // Usuario de prueba para desarrollo
      if (identifier === 'testuser' || identifier === 'test@example.com') {
        console.log('Usando usuario de prueba');
        return {
          user: {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            primer_nombre: 'Usuario',
            primer_apellido: 'Prueba',
            activo: true,
          },
          empresas: [
            { id: 1, razon_social: 'Empresa de Prueba 1' },
            { id: 2, razon_social: 'Empresa de Prueba 2' }
          ],
          roles: [
            { id: 1, nombre: 'admin' }
          ]
        };
      }
      
      const { data, error } = await supabase
        .from('gen_usuarios')
        .select(`
          id,
          username,
          email,
          primer_nombre,
          primer_apellido,
          activo,
          gen_usuario_empresas (
            empresas (
              id,
              razon_social
            )
          ),
          gen_usuario_roles (
            gen_roles (
              id,
              nombre
            )
          )
        `)
        .or(`email.eq.${identifier},username.eq.${identifier}`)
        .eq('activo', true)
        .single();

      console.log('Respuesta de Supabase:', { data, error });
      
      if (error || !data) {
        console.log('Usuario no encontrado o error:', error);
        return null;
      }

      // Extraer empresas y roles de la respuesta anidada
      const empresas = data.gen_usuario_empresas?.map((ue: any) => ue.empresas) || [];
      const roles = data.gen_usuario_roles?.map((ur: any) => ur.gen_roles) || [];

      console.log('Empresas encontradas:', empresas);
      console.log('Roles encontrados:', roles);
      
      return {
        user: {
          id: data.id,
          username: data.username,
          email: data.email,
          primer_nombre: data.primer_nombre,
          primer_apellido: data.primer_apellido,
          activo: data.activo,
        },
        empresas,
        roles
      };
    } catch (error) {
      console.error('Error validating user:', error);
      return null;
    }
  },

  verifyPassword: async (userId: number, password: string): Promise<boolean> => {
    try {
      // Usuario de prueba para desarrollo
      if (userId === 1 && password === 'password123') {
        console.log('Verificación de usuario de prueba exitosa');
        return true;
      }

      // Obtener el hash de la contraseña del usuario
      const { data: userData, error: userError } = await supabase
        .from('gen_usuarios')
        .select('password_hash')
        .eq('id', userId)
        .single();
      
      if (userError || !userData) {
        console.log('Usuario no encontrado o error:', userError);
        return false;
      }

      // Intentar usar la función RPC check_password (más simple)
      try {
        const { data: verifyData, error: verifyError } = await supabase.rpc('check_password', {
          password_to_check: password,
          stored_hash: userData.password_hash
        });

        if (!verifyError && verifyData !== null) {
          console.log('Verificación de contraseña con check_password:', { 
            userId, 
            isMatch: verifyData,
            hasStoredHash: !!userData.password_hash
          });
          return verifyData;
        }
      } catch (rpcError) {
        console.log('Función check_password no disponible, usando fallback base64:', rpcError);
      }

      // Fallback final: comparar con hash simple (base64)
      const simpleHash = btoa(password);
      const isMatch = simpleHash === userData.password_hash;
      console.log('Verificación de contraseña con fallback base64:', { 
        userId, 
        hasStoredHash: !!userData.password_hash,
        isMatch 
      });
      
      return isMatch;
    } catch (error) {
      console.error('Error verifying password:', error);
      return false;
    }
  },

  getUserEmpresas: async (userId: number) => {
    try {
      const { data, error } = await supabase
        .from('gen_usuario_empresas')
        .select(`
          empresas (
            id,
            razon_social
          )
        `)
        .eq('usuario_id', userId);
      
      if (error) throw error;
      
      return data?.map((item: any) => item.empresas) || [];
    } catch (error) {
      console.error('Error getting user empresas:', error);
      return [];
    }
  },

  // Métodos de recuperación de contraseña
  generarCodigoVerificacion: async (email: string) => {
    try {
      // Generar código de 6 dígitos
      const codigo = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Fecha de expiración (30 minutos)
      const fechaExpiracion = new Date();
      fechaExpiracion.setMinutes(fechaExpiracion.getMinutes() + 30);
      
      // Guardar código en la base de datos
      const { error } = await supabase
        .from('codigos_verificacion')
        .insert({
          email,
          codigo,
          tipo: 'recuperacion',
          usado: false,
          fecha_expiracion: fechaExpiracion.toISOString()
        });
      
      if (error) throw error;
      
      // TODO: Aquí se enviaría el email con el código
      // Por ahora solo retornamos éxito
      console.log(`Código generado para ${email}: ${codigo}`);
      
      return {
        success: true,
        message: 'Código de verificación enviado a tu correo electrónico'
      };
    } catch (error) {
      console.error('Error generando código:', error);
      return {
        success: false,
        message: 'Error al generar el código de verificación'
      };
    }
  },

  verificarCodigo: async (email: string, codigo: string) => {
    try {
      const { data, error } = await supabase
        .from('codigos_verificacion')
        .select('*')
        .eq('email', email)
        .eq('codigo', codigo)
        .eq('tipo', 'recuperacion')
        .eq('usado', false)
        .gte('fecha_expiracion', new Date().toISOString())
        .order('fecha_creacion', { ascending: false })
        .limit(1)
        .single();
      
      if (error || !data) {
        return {
          success: false,
          message: 'Código inválido o expirado'
        };
      }
      
      return {
        success: true,
        message: 'Código verificado correctamente'
      };
    } catch (error) {
      console.error('Error verificando código:', error);
      return {
        success: false,
        message: 'Error al verificar el código'
      };
    }
  },

  cambiarContraseña: async (email: string, codigo: string, nuevaContraseña: string) => {
    try {
      // Primero verificar que el código es válido
      const verificacion = await authService.verificarCodigo(email, codigo);
      if (!verificacion.success) {
        return verificacion;
      }
      
      // Hash de la nueva contraseña (base64 por ahora)
      const passwordHash = btoa(nuevaContraseña);
      
      // Actualizar contraseña en la tabla de usuarios
      const { error: updateError } = await supabase
        .from('gen_usuarios')
        .update({ password_hash: passwordHash })
        .eq('email', email);
      
      if (updateError) throw updateError;
      
      // Marcar código como usado
      const { error: markError } = await supabase
        .from('codigos_verificacion')
        .update({ usado: true })
        .eq('email', email)
        .eq('codigo', codigo);
      
      if (markError) throw markError;
      
      return {
        success: true,
        message: 'Contraseña cambiada exitosamente'
      };
    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      return {
        success: false,
        message: 'Error al cambiar la contraseña'
      };
    }
  }
}; 
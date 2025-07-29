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

export const authService = {
  // Validar usuario por email o username
  async validateUser(identifier: string): Promise<UserValidation | null> {
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

  // Verificar contraseña del usuario y retornar datos del usuario si es exitoso
  async verifyPassword(userId: number, password: string): Promise<{ success: boolean; userData?: any }> {
    try {
      // Usuario de prueba para desarrollo
      if (userId === 1 && password === 'password123') {
        console.log('Verificación de usuario de prueba exitosa');
        return {
          success: true,
          userData: {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            primerNombre: 'Usuario',
            primerApellido: 'Prueba',
            role: 'admin',
            activo: true,
            roles: [
              { id: 1, nombre: 'admin' }
            ],
            empresas: [
              { id: 1, razon_social: 'Empresa de Prueba 1' },
              { id: 2, razon_social: 'Empresa de Prueba 2' }
            ]
          }
        };
      }

      // Obtener los datos completos del usuario con roles y empresas
      const { data: userData, error: userError } = await supabase
        .from('gen_usuarios')
        .select(`
          id,
          username,
          email,
          primer_nombre,
          primer_apellido,
          password_hash,
          activo
        `)
        .eq('id', userId)
        .single();

      if (userError || !userData) {
        console.log('Usuario no encontrado o error:', userError);
        return { success: false };
      }

      // Obtener roles del usuario desde gen_usuario_roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('gen_usuario_roles')
        .select(`
          gen_roles (
            id,
            nombre
          )
        `)
        .eq('usuario_id', userId);

      if (rolesError) {
        console.log('Error obteniendo roles del usuario:', rolesError);
      }

      // Obtener empresas del usuario desde gen_usuario_empresas
      const { data: userEmpresas, error: empresasError } = await supabase
        .from('gen_usuario_empresas')
        .select(`
          empresas (
            id,
            razon_social
          )
        `)
        .eq('usuario_id', userId);

      if (empresasError) {
        console.log('Error obteniendo empresas del usuario:', empresasError);
      }

      // Extraer roles y empresas de la respuesta
      const roles = userRoles?.map((ur: any) => ur.gen_roles).filter(Boolean) || [];
      const empresas = userEmpresas?.map((ue: any) => ue.empresas).filter(Boolean) || [];

      console.log('📊 Datos obtenidos del usuario:');
      console.log('- Usuario:', userData);
      console.log('- Roles:', roles);
      console.log('- Empresas:', empresas);

      // Intentar usar la función RPC check_password
      try {
        const { data: verifyData, error: verifyError } = await supabase.rpc('check_password', {
          password_to_check: password,
          stored_hash: userData.password_hash
        });

        if (!verifyError && verifyData === true) {
          console.log('✅ Verificación de contraseña con check_password exitosa:', { 
            userId, 
            isMatch: verifyData,
            hasStoredHash: !!userData.password_hash
          });
          
          // Retornar datos completos del usuario para guardar en localStorage
          return {
            success: true,
            userData: {
              id: userData.id,
              username: userData.username,
              email: userData.email,
              primerNombre: userData.primer_nombre,
              primerApellido: userData.primer_apellido,
              role: roles.length > 0 ? roles[0].nombre : 'admin', // Usar el primer rol o admin por defecto
              activo: userData.activo,
              roles: roles,
              empresas: empresas,
              // Información adicional del usuario
              password_hash: userData.password_hash // Solo para debug, no usar en producción
            }
          };
        } else {
          console.log('❌ Verificación de contraseña fallida:', { verifyData, verifyError });
          return { success: false };
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
      
      if (isMatch) {
        console.log('✅ Verificación de contraseña exitosa (fallback)');
        
        return {
          success: true,
          userData: {
            id: userData.id,
            username: userData.username,
            email: userData.email,
            primerNombre: userData.primer_nombre,
            primerApellido: userData.primer_apellido,
            role: roles.length > 0 ? roles[0].nombre : 'admin',
            activo: userData.activo,
            roles: roles,
            empresas: empresas,
            // Información adicional del usuario
            password_hash: userData.password_hash // Solo para debug
          }
        };
      }
      
      return { success: false };
    } catch (error) {
      console.error('Error verifying password:', error);
      return { success: false };
    }
  },

  // Obtener empresas asociadas a un usuario
  async getUserEmpresas(userId: number) {
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
  }
}; 
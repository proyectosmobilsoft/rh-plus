import { supabase } from './supabaseClient';

export const debugService = {
  // Verificar si un username existe y obtener información detallada
  async checkUsername(username: string, excludeId?: number) {
    console.log(`🔍 Verificando username: "${username}", excluyendo ID: ${excludeId}`);
    
    let query = supabase
      .from('gen_usuarios')
      .select('id, username, email, primer_nombre, primer_apellido, activo, created_at');
    
    query = query.eq('username', username);
    
    if (excludeId) {
      query = query.neq('id', excludeId);
    }
    
    const { data, error } = await query;
    
    console.log(`📊 Resultado verificación username:`, { data, error });
    
    return { data: data || [], error };
  },

  // Verificar si un email existe
  async checkEmail(email: string, excludeId?: number) {
    console.log(`🔍 Verificando email: "${email}", excluyendo ID: ${excludeId}`);
    
    let query = supabase
      .from('gen_usuarios')
      .select('id, username, email, primer_nombre, primer_apellido, activo, created_at');
    
    query = query.eq('email', email);
    
    if (excludeId) {
      query = query.neq('id', excludeId);
    }
    
    const { data, error } = await query;
    
    console.log(`📊 Resultado verificación email:`, { data, error });
    
    return { data: data || [], error };
  },

  // Obtener información completa de un usuario por ID
  async getUserById(id: number) {
    console.log(`🔍 Obteniendo usuario por ID: ${id}`);
    
    const { data, error } = await supabase
      .from('gen_usuarios')
      .select('*')
      .eq('id', id)
      .single();
    
    console.log(`📊 Usuario encontrado:`, { data, error });
    
    return { data, error };
  },

  // Listar todos los usuarios con username o email similar
  async findSimilarUsers(searchTerm: string) {
    console.log(`🔍 Buscando usuarios similares a: "${searchTerm}"`);
    
    const { data, error } = await supabase
      .from('gen_usuarios')
      .select('id, username, email, primer_nombre, primer_apellido, activo')
      .or(`username.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
    
    console.log(`📊 Usuarios similares encontrados:`, { data, error });
    
    return { data: data || [], error };
  },

  // Verificar restricciones de la tabla
  async checkTableConstraints() {
    console.log(`🔍 Verificando restricciones de la tabla gen_usuarios`);
    
    const { data, error } = await supabase.rpc('get_table_constraints', {
      table_name: 'gen_usuarios'
    });
    
    console.log(`📊 Restricciones de tabla:`, { data, error });
    
    return { data, error };
  },

  // Función para hacer una actualización de prueba (sin commitear)
  async testUpdate(id: number, updateData: any) {
    console.log(`🧪 Probando actualización para usuario ID: ${id}`, updateData);
    
    // Primero verificar el usuario actual
    const currentUser = await this.getUserById(id);
    console.log(`👤 Usuario actual:`, currentUser.data);
    
    // Verificar conflictos potenciales
    if (updateData.username) {
      const usernameCheck = await this.checkUsername(updateData.username, id);
      if (usernameCheck.data.length > 0) {
        console.log(`❌ Conflicto de username detectado:`, usernameCheck.data);
        return { 
          success: false, 
          error: `Username '${updateData.username}' ya está en uso`,
          conflictingUsers: usernameCheck.data
        };
      }
    }
    
    if (updateData.email) {
      const emailCheck = await this.checkEmail(updateData.email, id);
      if (emailCheck.data.length > 0) {
        console.log(`❌ Conflicto de email detectado:`, emailCheck.data);
        return { 
          success: false, 
          error: `Email '${updateData.email}' ya está en uso`,
          conflictingUsers: emailCheck.data
        };
      }
    }
    
    console.log(`✅ No se detectaron conflictos para la actualización`);
    return { success: true, error: null };
  }
};


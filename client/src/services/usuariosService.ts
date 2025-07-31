import { supabase } from './supabaseClient';

export interface UsuarioData {
  identificacion?: string; // Ahora opcional si no es requerido en BD
  primer_nombre: string;
  segundo_nombre?: string;
  primer_apellido: string;
  segundo_apellido?: string;
  telefono?: string;
  email: string;
  username: string;
  activo?: boolean;
}

export const usuariosService = {
  // Listar todos los usuarios con sus roles y empresas
  async listUsuarios() {
    const { data, error } = await supabase
      .from('gen_usuarios')
      .select(`
        id,
        identificacion,
        primer_nombre,
        segundo_nombre,
        primer_apellido,
        segundo_apellido,
        telefono,
        email,
        username,
        activo,
        gen_usuario_roles ( id, rol_id, created_at, gen_roles ( id, nombre ) ),
        gen_usuario_empresas ( id, empresa_id, created_at, empresas ( id, razon_social ) )
      `);
    if (error) throw error;
    return data;
  },

  // Crear un nuevo usuario y asignarle roles y empresas
  async createUsuario(usuarioData: UsuarioData, password: string, rolesIds: number[], empresaIds: number[]) {
    console.log("usuariosService: createUsuario llamado con:", { usuarioData, rolesIds, empresaIds });
    
    // Usar hash simple directamente (la función RPC no existe)
    const simpleHash = btoa(password); // Base64 encoding
    const userDataWithHash = {
      ...usuarioData,
      password_hash: simpleHash
    };
    
    const { data: newUser, error: userError } = await supabase
      .from('gen_usuarios')
      .insert(userDataWithHash)
      .select()
      .single();
    if (userError) throw userError;

    // 2. Asignar roles
    if (rolesIds.length > 0) {
      const rolesToInsert = rolesIds.map(rol_id => ({ usuario_id: newUser.id, rol_id }));
      await supabase.from('gen_usuario_roles').insert(rolesToInsert);
    }

    // 3. Asignar empresas
    if (empresaIds.length > 0) {
      const empresasToInsert = empresaIds.map(empresa_id => ({ usuario_id: newUser.id, empresa_id }));
      await supabase.from('gen_usuario_empresas').insert(empresasToInsert);
    }

    return newUser;
  },

  // Actualizar un usuario y sus relaciones
  async updateUsuario(id: number, usuarioData: Partial<UsuarioData>, rolesIds: number[], empresaIds: number[]) {
    console.log("usuariosService: updateUsuario llamado con:", { id, usuarioData, rolesIds, empresaIds });
    
    // 1. Actualizar datos del usuario
    const { data: updatedUser, error: userError } = await supabase
      .from('gen_usuarios')
      .update(usuarioData)
      .eq('id', id)
      .select()
      .single();
    if (userError) throw userError;

    // 2. Actualizar roles (eliminar antiguos y añadir nuevos)
    await supabase.from('gen_usuario_roles').delete().eq('usuario_id', id);
    if (rolesIds.length > 0) {
      const rolesToInsert = rolesIds.map(rol_id => ({ usuario_id: id, rol_id }));
      await supabase.from('gen_usuario_roles').insert(rolesToInsert);
    }

    // 3. Actualizar empresas (eliminar antiguas y añadir nuevas)
    await supabase.from('gen_usuario_empresas').delete().eq('usuario_id', id);
    if (empresaIds.length > 0) {
      const empresasToInsert = empresaIds.map(empresa_id => ({ usuario_id: id, empresa_id }));
      await supabase.from('gen_usuario_empresas').insert(empresasToInsert);
    }

    return updatedUser;
  },

  // Inactivar un usuario
  async deactivateUsuario(id: number) {
    const { data, error } = await supabase
      .from('gen_usuarios')
      .update({ activo: false })
      .eq('id', id);
    if (error) throw error;
    return data;
  },
  
  // Activar un usuario
  async activateUsuario(id: number) {
    const { data, error } = await supabase
      .from('gen_usuarios')
      .update({ activo: true })
      .eq('id', id);
    if (error) throw error;
    return data;
  },

  // Eliminar un usuario permanentemente
  async deleteUsuarioPermanent(id: number) {
    const { data, error } = await supabase
      .from('gen_usuarios')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return data;
  }
}; 
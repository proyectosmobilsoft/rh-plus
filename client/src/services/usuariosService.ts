import { supabase } from './supabaseClient';

export interface UsuarioData {
  id?: number;
  identificacion?: string;
  primer_nombre: string;
  segundo_nombre?: string;
  primer_apellido: string;
  segundo_apellido?: string;
  telefono?: string;
  email: string;
  username: string;
  activo?: boolean;
  password?: string;
  foto_base64?: string;
  ultimo_acceso?: string;
  createdAt?: string;
  updatedAt?: string;
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
        password,
        foto_base64,
        created_at,
        gen_usuario_roles ( id, rol_id, created_at, gen_roles ( id, nombre ) ),
        gen_usuario_empresas ( id, empresa_id, created_at, empresas ( id, razon_social ) )
      `)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // Crear un nuevo usuario y asignarle roles y empresas
  async createUsuario(usuarioData: UsuarioData, password: string, rolesIds: number[], empresaIds: number[]) {
    // Validar username único antes de crear
    const { data: existingUsers, error: checkError } = await supabase
      .from('gen_usuarios')
      .select('id, username, primer_nombre, primer_apellido')
      .eq('username', usuarioData.username);
    
    if (checkError) {
      console.error('❌ Error verificando username único:', checkError);
      throw new Error('Error verificando la unicidad del username');
    }
    
    if (existingUsers && existingUsers.length > 0) {
      console.error('❌ Username ya existe:', existingUsers);
      throw new Error(`El username '${usuarioData.username}' ya está en uso por: ${existingUsers[0].primer_nombre} ${existingUsers[0].primer_apellido} (ID: ${existingUsers[0].id})`);
    }
    
    // Validar email único antes de crear
    const { data: existingEmails, error: emailCheckError } = await supabase
      .from('gen_usuarios')
      .select('id, email, primer_nombre, primer_apellido')
      .eq('email', usuarioData.email);
    
    if (emailCheckError) {
      console.error('❌ Error verificando email único:', emailCheckError);
      throw new Error('Error verificando la unicidad del email');
    }
    
    if (existingEmails && existingEmails.length > 0) {
      console.error('❌ Email ya existe:', existingEmails);
      throw new Error(`El email '${usuarioData.email}' ya está en uso por: ${existingEmails[0].primer_nombre} ${existingEmails[0].primer_apellido} (ID: ${existingEmails[0].id})`);
    }
    
    // 1. Guardar la contraseña como texto plano
    const userDataWithPassword = {
      ...usuarioData,
      password: password
    };
      
      const { data: newUser, error: userError } = await supabase
        .from('gen_usuarios')
        .insert(userDataWithPassword)
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
  async updateUsuario(id: number, usuarioData: Partial<UsuarioData>, rolesIds: number[], empresaIds: number[], password?: string) {
    // Validar username único si se está actualizando
    if (usuarioData.username) {
      const { data: existingUsers, error: checkError } = await supabase
        .from('gen_usuarios')
        .select('id, username, primer_nombre, primer_apellido')
        .eq('username', usuarioData.username)
        .neq('id', id);
      
      if (checkError) {
        console.error('❌ Error verificando username único:', checkError);
        throw new Error('Error verificando la unicidad del username');
      }
      
      if (existingUsers && existingUsers.length > 0) {
        console.error('❌ Username duplicado encontrado:', existingUsers);
        throw new Error(`El username '${usuarioData.username}' ya está en uso por otro usuario: ${existingUsers[0].primer_nombre} ${existingUsers[0].primer_apellido} (ID: ${existingUsers[0].id})`);
      }
    }

    // Validar email único si se está actualizando
    if (usuarioData.email) {
      const { data: existingEmails, error: emailCheckError } = await supabase
        .from('gen_usuarios')
        .select('id, email, primer_nombre, primer_apellido')
        .eq('email', usuarioData.email)
        .neq('id', id);
      
      if (emailCheckError) {
        console.error('❌ Error verificando email único:', emailCheckError);
        throw new Error('Error verificando la unicidad del email');
      }
      
      if (existingEmails && existingEmails.length > 0) {
        console.error('❌ Email duplicado encontrado:', existingEmails);
        throw new Error(`El email '${usuarioData.email}' ya está en uso por otro usuario: ${existingEmails[0].primer_nombre} ${existingEmails[0].primer_apellido} (ID: ${existingEmails[0].id})`);
      }
    }
    
    let finalUsuarioData = { ...usuarioData };
    
    // Si se proporciona una nueva contraseña, guardarla como texto plano
    if (password && password.trim() !== '') {
      finalUsuarioData.password = password;
    }
    
    // 1. Actualizar datos del usuario
    const { data: updatedUser, error: userError } = await supabase
      .from('gen_usuarios')
      .update(finalUsuarioData)
      .eq('id', id)
      .select()
      .single();
      
    if (userError) {
      console.error('❌ Error actualizando usuario en BD:', userError);
      throw userError;
    }
    
    

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

  // Eliminar un usuario (inactivar primero, luego eliminar permanentemente)
  async deleteUsuario(id: number) {
    // Primero verificar si el usuario está inactivo
    const { data: usuario, error: fetchError } = await supabase
      .from('gen_usuarios')
      .select('activo, primer_nombre, primer_apellido')
      .eq('id', id)
      .single();
    
    if (fetchError) throw fetchError;
    
    if (usuario?.activo === true) {
      throw new Error('No se puede eliminar un usuario activo. Primero debe inactivarlo.');
    }

    // Verificar si el usuario tiene relaciones con candidatos activos
    const { data: candidatosRelacionados, error: candidatosError } = await supabase
      .from('candidatos')
      .select('id, primer_nombre, primer_apellido, activo')
      .eq('usuario_id', id)
      .eq('activo', true);
    
    if (candidatosError) {
      console.error('Error verificando candidatos relacionados:', candidatosError);
      throw new Error('Error al verificar las relaciones del usuario');
    }

    if (candidatosRelacionados && candidatosRelacionados.length > 0) {
      const candidatosNombres = candidatosRelacionados
        .map(c => `${c.primer_nombre} ${c.primer_apellido}`)
        .join(', ');
      
      throw new Error(
        `No se puede eliminar el usuario "${usuario.primer_nombre} ${usuario.primer_apellido}" porque está relacionado con candidatos activos: ${candidatosNombres}. ` +
        `Primero debe inactivar o eliminar estos candidatos.`
      );
    }

    // Verificar si el usuario tiene relaciones con solicitudes activas
    const { data: solicitudesRelacionadas, error: solicitudesError } = await supabase
      .from('hum_solicitudes')
      .select('id, estado')
      .eq('analista_id', id)
      .in('estado', ['pendiente', 'en_proceso', 'aprobada']);
    
    if (solicitudesError) {
      console.error('Error verificando solicitudes relacionadas:', solicitudesError);
      throw new Error('Error al verificar las relaciones del usuario');
    }

    if (solicitudesRelacionadas && solicitudesRelacionadas.length > 0) {
      throw new Error(
        `No se puede eliminar el usuario "${usuario.primer_nombre} ${usuario.primer_apellido}" porque tiene solicitudes activas (${solicitudesRelacionadas.length} solicitudes). ` +
        `Primero debe completar o cancelar estas solicitudes.`
      );
    }
    
    // Si no hay relaciones activas, proceder con la eliminación permanente
    try {
      const { data, error } = await supabase
        .from('gen_usuarios')
        .delete()
        .eq('id', id);
      
      if (error) {
        // Manejar errores de restricción de clave foránea
        if (error.code === '23503') {
          throw new Error(
            `No se puede eliminar el usuario "${usuario.primer_nombre} ${usuario.primer_apellido}" porque tiene datos relacionados en el sistema. ` +
            `Contacte al administrador para revisar todas las relaciones.`
          );
        }
        throw error;
      }
      
      return data;
    } catch (error: any) {
      if (error.code === '23503') {
        throw new Error(
          `No se puede eliminar el usuario "${usuario.primer_nombre} ${usuario.primer_apellido}" porque tiene datos relacionados en el sistema. ` +
          `Contacte al administrador para revisar todas las relaciones.`
        );
      }
      throw error;
    }
  },

  // Eliminar un usuario permanentemente (sin verificar estado)
  async deleteUsuarioPermanent(id: number) {
    const { data, error } = await supabase
      .from('gen_usuarios')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return data;
  },

  // Verificar si un usuario puede ser eliminado (sin relaciones activas)
  async canDeleteUsuario(id: number) {
    try {
      // Verificar si el usuario está activo
      const { data: usuario, error: fetchError } = await supabase
        .from('gen_usuarios')
        .select('activo, primer_nombre, primer_apellido')
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;
      
      if (usuario?.activo === true) {
        return {
          canDelete: false,
          reason: 'El usuario está activo. Primero debe inactivarlo.',
          details: null
        };
      }

      // Verificar candidatos activos
      const { data: candidatosRelacionados, error: candidatosError } = await supabase
        .from('candidatos')
        .select(`
          id, 
          primer_nombre, 
          primer_apellido, 
          segundo_nombre,
          segundo_apellido,
          email,
          telefono,
          activo,
          created_at
        `)
        .eq('usuario_id', id)
        .eq('activo', true);
      
      if (candidatosError) throw candidatosError;

      if (candidatosRelacionados && candidatosRelacionados.length > 0) {
        return {
          canDelete: false,
          reason: 'El usuario tiene candidatos activos relacionados.',
          details: candidatosRelacionados.map(c => ({
            id: c.id,
            nombre: `${c.primer_nombre} ${c.primer_apellido}`,
            email: c.email,
            telefono: c.telefono,
            fechaCreacion: c.created_at
          }))
        };
      }

      // Verificar solicitudes activas
      const { data: solicitudesRelacionadas, error: solicitudesError } = await supabase
        .from('hum_solicitudes')
        .select('id, estado')
        .eq('analista_id', id)
        .in('estado', ['pendiente', 'en_proceso', 'aprobada']);
      
      if (solicitudesError) throw solicitudesError;

      if (solicitudesRelacionadas && solicitudesRelacionadas.length > 0) {
        return {
          canDelete: false,
          reason: `El usuario tiene ${solicitudesRelacionadas.length} solicitudes activas.`,
          details: null
        };
      }

      return {
        canDelete: true,
        reason: null,
        details: null
      };
    } catch (error) {
      console.error('Error verificando si se puede eliminar usuario:', error);
      return {
        canDelete: false,
        reason: 'Error al verificar las relaciones del usuario.',
        details: null
      };
    }
  },

  // Actualizar último acceso del usuario
  async updateUltimoAcceso(id: number) {
    const { data, error } = await supabase
      .from('gen_usuarios')
      .update({ 
        ultimo_acceso: new Date().toISOString() 
      })
      .eq('id', id)
      .select('ultimo_acceso')
      .single();
    
    if (error) throw error;
    return data;
  }
}; 


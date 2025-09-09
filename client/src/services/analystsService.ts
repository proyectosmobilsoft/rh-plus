import { supabase } from './supabaseClient';

export interface Analyst {
  id?: number;
  username: string;
  email: string;
  password?: string;
  primer_nombre?: string;
  segundo_nombre?: string;
  primer_apellido?: string;
  segundo_apellido?: string;
  activo?: boolean;
  rol_id?: number;
  created_at?: string;
  updated_at?: string;
}

export const analystsService = {
  // Listar solo analistas (usuarios con permiso rol_analista)
  getAll: async (): Promise<Analyst[]> => {
    try {
      // Obtener roles que tienen el permiso 'rol_analista' en gen_roles_modulos
      const { data: rolesConPermisoAnalista, error: rolesError } = await supabase
        .from('gen_roles_modulos')
        .select(`
          rol_id,
          selected_actions_codes
        `)
        .contains('selected_actions_codes', '["rol_analista"]');

      if (rolesError) {
        console.error('Error al obtener roles con permiso rol_analista:', rolesError);
        return [];
      }

      const rolIds = rolesConPermisoAnalista?.map((r: any) => r.rol_id) || [];

      if (rolIds.length === 0) {
        console.log('No se encontraron roles con permiso rol_analista');
        return [];
      }

      // Obtener usuarios con esos roles
      const { data, error } = await supabase
        .from('gen_usuarios')
        .select(`
          *,
          gen_usuario_roles(
            gen_roles(id, nombre)
          )
        `)
        .eq('activo', true)
        .or(`rol_id.in.(${rolIds.join(',')}),gen_usuario_roles.gen_roles.id.in.(${rolIds.join(',')})`);

      if (error) {
        console.error('Error al obtener analistas:', error);
        return [];
      }

      // Filtrar usuarios que realmente tengan el rol de analista
      const analistas = data?.filter((usuario: any) => {
        const tieneRolPrincipal = usuario.rol_id && rolIds.includes(usuario.rol_id);
        const tieneRolesAdicionales = usuario.gen_usuario_roles?.some((ur: any) => 
          rolIds.includes(ur.gen_roles.id)
        );
        return tieneRolPrincipal || tieneRolesAdicionales;
      }) || [];

      return analistas;
    } catch (error) {
      console.error('Error en getAll de analystsService:', error);
      return [];
    }
  },
  // Guardar analista
  create: async (analyst: Analyst): Promise<Analyst | null> => {
    const { password, ...rest } = analyst;
    const insertData = {
      ...rest,
      password: password || '',
      // No asignamos rol_id aquí, se debe asignar manualmente el rol con permiso rol_analista
    };
    const { data, error } = await supabase.from('gen_usuarios').insert([insertData]).select();
    if (error) throw error;
    return data ? data[0] : null;
  },
  // Editar analista
  update: async (id: number, updates: Partial<Analyst>): Promise<Analyst | null> => {
    const { data, error } = await supabase
      .from('gen_usuarios')
      .update(updates)
      .eq('id', id)
      .select();
    if (error) throw error;
    return data ? data[0] : null;
  },
  // Eliminar analista (solo si está inactivo)
  remove: async (id: number): Promise<boolean> => {
    // Primero verificar si el analista está inactivo
    const { data: analyst, error: fetchError } = await supabase
      .from('gen_usuarios')
      .select('activo')
      .eq('id', id)
      .single();
    
    if (fetchError) throw fetchError;
    
    if (analyst?.activo === true) {
      throw new Error('No se puede eliminar un analista activo. Primero desactívalo.');
    }

    const { error } = await supabase
      .from('gen_usuarios')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  // Activar analista
  activate: async (id: number): Promise<boolean> => {
    const { error } = await supabase
      .from('gen_usuarios')
      .update({ activo: true, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  // Desactivar analista
  deactivate: async (id: number): Promise<boolean> => {
    const { error } = await supabase
      .from('gen_usuarios')
      .update({ activo: false, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    return true;
  }
}; 
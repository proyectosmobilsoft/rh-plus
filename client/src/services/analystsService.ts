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

// Función helper para reintentar consultas con timeout
const retryQuery = async <T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  maxRetries: number = 2,
  retryDelay: number = 1000
): Promise<{ data: T | null; error: any }> => {
  let lastError: any = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await queryFn();
      
      // Si hay error y es timeout (57014), reintentar
      if (result.error && result.error.code === '57014') {
        lastError = result.error;
        if (attempt < maxRetries) {
          console.log(`⚠️ [retryQuery] Timeout en intento ${attempt + 1}/${maxRetries + 1}, reintentando en ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
      }
      
      // Si no hay error o no es timeout, retornar resultado
      return result;
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        console.log(`⚠️ [retryQuery] Error en intento ${attempt + 1}/${maxRetries + 1}, reintentando en ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        continue;
      }
    }
  }
  
  // Si llegamos aquí, todos los intentos fallaron
  return { data: null, error: lastError };
};

export const analystsService = {
  // Listar solo analistas (usuarios con permiso rol_analista)
  getAll: async (): Promise<Analyst[]> => {
    try {
      console.log('🔄 [analystsService.getAll] Iniciando petición a gen_usuarios...');
      
      // Obtener todos los usuarios activos con reintentos
      const { data: usuarios, error: usuariosError } = await retryQuery(
        () => supabase
          .from('gen_usuarios')
          .select(`
            *,
            gen_usuario_roles(
              gen_roles(id, nombre)
            )
          `)
          .eq('activo', true),
        2, // 2 reintentos (total 3 intentos)
        1000 // 1 segundo de espera entre reintentos
      );

      console.log('✅ [analystsService.getAll] Petición a gen_usuarios completada, usuarios recibidos:', usuarios?.length || 0);

      if (usuariosError) {
        console.error('❌ [analystsService.getAll] Error al obtener usuarios después de reintentos:', usuariosError);
        return [];
      }

      console.log('🔄 [analystsService.getAll] Obteniendo roles con permiso rol_analista...');
      // Obtener roles que tienen el permiso 'rol_analista'
      const { data: rolesConPermisoAnalista, error: rolesError } = await supabase
        .from('gen_roles_modulos')
        .select(`
          rol_id,
          selected_actions_codes
        `)
        .contains('selected_actions_codes', '["rol_analista"]');

      if (rolesError) {
        console.error('❌ [analystsService.getAll] Error al obtener roles con permiso rol_analista:', rolesError);
        return [];
      }

      const rolIds = rolesConPermisoAnalista?.map((r: any) => r.rol_id) || [];

      if (rolIds.length === 0) {
        console.log('⚠️ [analystsService.getAll] No se encontraron roles con permiso rol_analista');
        return [];
      }

      console.log('🔄 [analystsService.getAll] Filtrando analistas...');
      // Filtrar usuarios que tengan el rol de analista (principal o adicional)
      const analistas = usuarios?.filter((usuario: any) => {
        const tieneRolPrincipal = usuario.rol_id && rolIds.includes(usuario.rol_id);
        const tieneRolesAdicionales = usuario.gen_usuario_roles?.some((ur: any) => 
          rolIds.includes(ur.gen_roles?.id)
        );
        return tieneRolPrincipal || tieneRolesAdicionales;
      }) || [];

      console.log('✅ [analystsService.getAll] Analistas encontrados:', analistas.length);
      return analistas;
    } catch (error) {
      console.error('❌ [analystsService.getAll] Error en getAll:', error);
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


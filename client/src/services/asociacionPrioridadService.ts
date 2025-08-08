import { supabase } from './supabaseClient';

export interface AsociacionPrioridad {
  id?: number;
  usuario_id: number;
  empresa_id?: number;
  sucursal_id?: number;
  nivel_prioridad_1: string | null;
  nivel_prioridad_2: string | null;
  nivel_prioridad_3: string | null;
  cantidad_solicitudes?: number;
  created_at?: string;
  updated_at?: string;
}

export interface AnalistaPrioridad {
  usuario_id: number;
  usuario_nombre: string;
  usuario_email: string;
  empresa_id?: number;
  empresa_nombre?: string;
  empresa_nit?: string;
  empresa_direccion?: string;
  nivel_prioridad_1: string | null;
  nivel_prioridad_2: string | null;
  nivel_prioridad_3: string | null;
  cantidad_solicitudes?: number;
  roles?: Array<{ id: number; nombre: string }>; // Agregar información de roles
}

export const asociacionPrioridadService = {
  // Obtener todas las asociaciones de prioridad con información de analistas y empresas
  getAllWithDetails: async (): Promise<AnalistaPrioridad[]> => {
    try {
      const { data, error } = await supabase
        .from('analista_prioridades')
        .select(`
          usuario_id,
          empresa_id,
          nivel_prioridad_1,
          nivel_prioridad_2,
          nivel_prioridad_3,
          cantidad_solicitudes,
          empresa_nombre,
          empresa_nit,
          empresa_direccion,
          gen_usuarios!inner(
            username,
            email,
            primer_nombre,
            primer_apellido,
            activo
          ),
          empresas(
            id,
            razon_social,
            nit,
            direccion
          )
        `)
        .eq('gen_usuarios.rol_id', 4) // Solo analistas
        .eq('gen_usuarios.activo', true);

      if (error) {
        console.error('Error al obtener asociaciones de prioridad:', error);
        return [];
      }

      // Transformar los datos para el formato esperado
      const result: AnalistaPrioridad[] = (data || []).map((item: any) => ({
        usuario_id: item.usuario_id,
        usuario_nombre: `${item.gen_usuarios.primer_nombre || ''} ${item.gen_usuarios.primer_apellido || ''}`.trim() || item.gen_usuarios.username,
        usuario_email: item.gen_usuarios.email,
        empresa_id: item.empresa_id,
        empresa_nombre: item.empresa_nombre || item.empresas?.razon_social || '',
        empresa_nit: item.empresa_nit || item.empresas?.nit || '',
        empresa_direccion: item.empresa_direccion || item.empresas?.direccion || '',
        nivel_prioridad_1: item.nivel_prioridad_1,
        nivel_prioridad_2: item.nivel_prioridad_2,
        nivel_prioridad_3: item.nivel_prioridad_3,
        cantidad_solicitudes: item.cantidad_solicitudes || 0
      }));

      return result;
    } catch (error) {
      console.error('Error en getAllWithDetails:', error);
      return [];
    }
  },

  // Obtener analistas con sus prioridades agrupadas
  getAnalistasWithPriorities: async (): Promise<AnalistaPrioridad[]> => {
    try {
      // Primero obtener los IDs de roles que están relacionados con el módulo 10
      const { data: rolesModulo10, error: rolesError } = await supabase
        .from('gen_roles_modulos')
        .select('rol_id')
        .eq('modulo_id', 10);

      if (rolesError) {
        console.error('Error al obtener roles del módulo 10:', rolesError);
        return [];
      }

      const rolIds = rolesModulo10?.map((r: any) => r.rol_id) || [];
      console.log('Roles relacionados con módulo 10:', rolIds);

      if (rolIds.length === 0) {
        console.log('No se encontraron roles relacionados con el módulo 10');
        return [];
      }

      // Obtener analistas que tengan alguno de estos roles (ya sea rol principal o roles adicionales)
      console.log('Consultando usuarios con roles:', rolIds);
      
      // Primero obtener todos los usuarios activos
      const { data: todosUsuarios, error: usuariosError } = await supabase
        .from('gen_usuarios')
        .select(`
          id, 
          username, 
          email, 
          primer_nombre, 
          primer_apellido, 
          activo,
          rol_id,
          gen_usuario_roles(
            gen_roles(id, nombre)
          )
        `)
        .eq('activo', true);

      if (usuariosError) {
        console.error('Error al obtener usuarios:', usuariosError);
        return [];
      }

      // Filtrar usuarios que tengan roles relacionados con el módulo 10
      const analistas = todosUsuarios?.filter((usuario: any) => {
        // Verificar si el rol principal está en la lista
        const tieneRolPrincipal = usuario.rol_id && rolIds.includes(usuario.rol_id);
        
        // Verificar si tiene roles adicionales relacionados
        const tieneRolesAdicionales = usuario.gen_usuario_roles?.some((ur: any) => 
          rolIds.includes(ur.gen_roles.id)
        );
        
        const esAnalista = tieneRolPrincipal || tieneRolesAdicionales;
        
        if (esAnalista) {
          console.log(`Usuario ${usuario.username} es analista:`, {
            rolPrincipal: usuario.rol_id,
            rolesAdicionales: usuario.gen_usuario_roles?.map((ur: any) => ur.gen_roles.id),
            tieneRolPrincipal,
            tieneRolesAdicionales
          });
        }
        
        return esAnalista;
      }) || [];

      console.log('Analistas encontrados:', analistas?.length || 0);
      console.log('Detalles de analistas:', analistas);

      // Obtener las prioridades de cada analista
      const analistasConPrioridades: AnalistaPrioridad[] = [];

      for (const analista of analistas || []) {
        console.log('Procesando analista:', analista);
        
        // Extraer roles del usuario que estén relacionados con el módulo 10
        const roles = [];
        
        // Verificar si el rol principal del usuario está en la lista de roles del módulo 10
        if (analista.rol_id && rolIds.includes(analista.rol_id)) {
          console.log('Rol principal incluido:', analista.rol_id);
          roles.push({
            id: analista.rol_id,
            nombre: 'Analista' // Asumimos que rol_id = 4 es Analista
          });
        }
        
        // Agregar roles adicionales de gen_usuario_roles que estén en la lista del módulo 10
        if (analista.gen_usuario_roles) {
          console.log('Roles adicionales encontrados:', analista.gen_usuario_roles);
          const rolesAdicionales = analista.gen_usuario_roles
            .filter((ur: any) => rolIds.includes(ur.gen_roles.id))
            .map((ur: any) => ({
              id: ur.gen_roles.id,
              nombre: ur.gen_roles.nombre
            }));
          roles.push(...rolesAdicionales);
        }
        
        console.log('Roles finales para el analista:', roles);

                               // Obtener las prioridades del analista
        const { data: prioridades, error: prioridadesError } = await supabase
          .from('analista_prioridades')
          .select(`
            empresa_id,
            sucursal_id,
            nivel_prioridad_1,
            nivel_prioridad_2,
            nivel_prioridad_3,
            cantidad_solicitudes,
            empresas(
              id,
              razon_social,
              nit,
              direccion
            )
          `)
          .eq('usuario_id', analista.id);

        if (prioridadesError) {
          console.error('Error al obtener prioridades del analista:', prioridadesError);
          continue;
        }

        // Si el analista tiene prioridades, agregar cada una
        if (prioridades && prioridades.length > 0) {
          for (const prioridad of prioridades) {
            analistasConPrioridades.push({
              usuario_id: analista.id,
              usuario_nombre: `${analista.primer_nombre || ''} ${analista.primer_apellido || ''}`.trim() || analista.username,
              usuario_email: analista.email,
              empresa_id: prioridad.empresa_id,
              empresa_nombre: (prioridad.empresas as any)?.razon_social || '',
              empresa_nit: (prioridad.empresas as any)?.nit || '',
              empresa_direccion: (prioridad.empresas as any)?.direccion || '',
              nivel_prioridad_1: prioridad.nivel_prioridad_1,
              nivel_prioridad_2: prioridad.nivel_prioridad_2,
              nivel_prioridad_3: prioridad.nivel_prioridad_3,
              cantidad_solicitudes: prioridad.cantidad_solicitudes || 0,
              roles: roles
            });
          }
        } else {
          // Si no tiene prioridades, agregar con valores por defecto
          analistasConPrioridades.push({
            usuario_id: analista.id,
            usuario_nombre: `${analista.primer_nombre || ''} ${analista.primer_apellido || ''}`.trim() || analista.username,
            usuario_email: analista.email,
            empresa_id: undefined,
            empresa_nombre: '',
            empresa_nit: '',
            empresa_direccion: '',
            nivel_prioridad_1: null,
            nivel_prioridad_2: null,
            nivel_prioridad_3: null,
            cantidad_solicitudes: 0,
            roles: roles
          });
        }
      }

      console.log('=== FIN getAnalistasWithPriorities ===');
      console.log('Total de analistas retornados:', analistasConPrioridades.length);
      console.log('Analistas con prioridades:', analistasConPrioridades);
      return analistasConPrioridades;
    } catch (error) {
      console.error('Error en getAnalistasWithPriorities:', error);
      return [];
    }
  },

  // Crear o actualizar asociación de prioridad
  upsert: async (asociacion: Omit<AsociacionPrioridad, 'id' | 'created_at' | 'updated_at'>): Promise<AsociacionPrioridad | null> => {
    try {
      console.log('=== INICIO upsert ===');
      console.log('Datos a insertar:', asociacion);
      
      const { data, error } = await supabase
        .from('analista_prioridades')
        .upsert([asociacion], {
          onConflict: 'usuario_id,empresa_id'
        })
        .select()
        .single();

      if (error) {
        console.error('Error al crear/actualizar asociación:', error);
        return null;
      }

      console.log('=== FIN upsert - ÉXITO ===');
      console.log('Datos insertados:', data);
      return data;
    } catch (error) {
      console.error('=== ERROR en upsert ===');
      console.error('Error en upsert:', error);
      return null;
    }
  },

  // Eliminar asociación de prioridad
  delete: async (usuarioId: number, empresaId: number): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('analista_prioridades')
        .delete()
        .eq('usuario_id', usuarioId)
        .eq('empresa_id', empresaId);

      if (error) {
        console.error('Error al eliminar asociación:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error en delete:', error);
      return false;
    }
  },

  // Obtener prioridades de un usuario específico
  getPrioridadesByUsuarioId: async (usuarioId: number): Promise<any[]> => {
    try {
      console.log('=== INICIO getPrioridadesByUsuarioId ===');
      console.log('Usuario ID a consultar:', usuarioId);
      
                     const { data, error } = await supabase
        .from('analista_prioridades')
        .select(`
          id,
          usuario_id,
          empresa_id,
          sucursal_id,
          nivel_prioridad_1,
          nivel_prioridad_2,
          nivel_prioridad_3,
          cantidad_solicitudes,
          created_at,
          updated_at
        `)
        .eq('usuario_id', usuarioId);

      if (error) {
        console.error('Error al obtener prioridades del usuario:', error);
        return [];
      }

      console.log('=== FIN getPrioridadesByUsuarioId - ÉXITO ===');
      console.log('Prioridades encontradas:', data);
      return data || [];
    } catch (error) {
      console.error('Error en getPrioridadesByUsuarioId:', error);
      return [];
    }
  },

  // Eliminar todas las prioridades de un usuario
  deleteByUsuarioId: async (usuarioId: number): Promise<boolean> => {
    try {
      console.log('=== INICIO deleteByUsuarioId ===');
      console.log('Usuario ID a eliminar:', usuarioId);
      
      const { error } = await supabase
        .from('analista_prioridades')
        .delete()
        .eq('usuario_id', usuarioId);

      if (error) {
        console.error('Error al eliminar prioridades del usuario:', error);
        return false;
      }

      console.log('=== FIN deleteByUsuarioId - ÉXITO ===');
      return true;
    } catch (error) {
      console.error('=== ERROR en deleteByUsuarioId ===');
      console.error('Error en deleteByUsuarioId:', error);
      return false;
    }
  },

  // Obtener cantidad de solicitudes por analista y empresa
  getSolicitudesPorAnalista: async (usuarioId?: number, empresaId?: number): Promise<number> => {
    try {
      let query = supabase
        .from('hum_solicitudes')
        .select('id', { count: 'exact', head: true });

      if (usuarioId) {
        query = query.eq('analista_id', usuarioId);
      }

      if (empresaId) {
        query = query.eq('empresa_id', empresaId);
      }

      const { count, error } = await query;

      if (error) {
        console.error('Error al contar solicitudes:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error en getSolicitudesPorAnalista:', error);
      return 0;
    }
  }
};

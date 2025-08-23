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
  sucursal_id?: number;
  sucursal_nombre?: string;
  nivel_prioridad_1: string | null;
  nivel_prioridad_2: string | null;
  nivel_prioridad_3: string | null;
  // Cantidad configurada en la asociación (target)
  cantidad_configurada?: number;
  // Cantidad real asignada (conteo actual)
  cantidad_asignadas?: number;
  // Campo legacy para compatibilidad (se usará como asignadas)
  cantidad_solicitudes?: number;
  roles?: Array<{ id: number; nombre: string }>;
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
        .eq('gen_usuarios.rol_id', 4)
        .eq('gen_usuarios.activo', true);

      if (error) {
        console.error('Error al obtener asociaciones de prioridad:', error);
        return [];
      }

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
        cantidad_configurada: item.cantidad_solicitudes || 0,
        cantidad_asignadas: 0,
        cantidad_solicitudes: 0,
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
      const { data: rolesModulo10, error: rolesError } = await supabase
        .from('gen_roles_modulos')
        .select('rol_id')
        .eq('modulo_id', 10);

      if (rolesError) {
        console.error('Error al obtener roles del módulo 10:', rolesError);
        return [];
      }

      const rolIds = rolesModulo10?.map((r: any) => r.rol_id) || [];

      if (rolIds.length === 0) {
        return [];
      }

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

      const analistas = todosUsuarios?.filter((usuario: any) => {
        const tieneRolPrincipal = usuario.rol_id && rolIds.includes(usuario.rol_id);
        const tieneRolesAdicionales = usuario.gen_usuario_roles?.some((ur: any) => 
          rolIds.includes(ur.gen_roles.id)
        );
        return tieneRolPrincipal || tieneRolesAdicionales;
      }) || [];

      const analistasConPrioridades: AnalistaPrioridad[] = [];

      for (const analista of analistas || []) {
        const roles: Array<{ id: number; nombre: string }> = [];
        if (analista.rol_id && rolIds.includes(analista.rol_id)) {
          roles.push({ id: analista.rol_id, nombre: 'Analista' });
        }
        if (analista.gen_usuario_roles) {
          const rolesAdicionales = analista.gen_usuario_roles
            .filter((ur: any) => rolIds.includes(ur.gen_roles.id))
            .map((ur: any) => ({ id: ur.gen_roles.id, nombre: ur.gen_roles.nombre }));
          roles.push(...rolesAdicionales);
        }

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
            ),
            gen_sucursales(
              id,
              nombre
            )
          `)
          .eq('usuario_id', analista.id);

        if (prioridadesError) {
          console.error('Error al obtener prioridades del analista:', prioridadesError);
          continue;
        }

        const { count: solicitudesReales } = await supabase
          .from('hum_solicitudes')
          .select('*', { count: 'exact', head: true })
          .eq('analista_id', analista.id);

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
              sucursal_id: prioridad.sucursal_id,
              sucursal_nombre: (prioridad.gen_sucursales as any)?.nombre || '',
              nivel_prioridad_1: prioridad.nivel_prioridad_1,
              nivel_prioridad_2: prioridad.nivel_prioridad_2,
              nivel_prioridad_3: prioridad.nivel_prioridad_3,
              cantidad_configurada: prioridad.cantidad_solicitudes || 0,
              cantidad_asignadas: solicitudesReales || 0,
              // Mantener compatibilidad: usar asignadas en cantidad_solicitudes para la columna general
              cantidad_solicitudes: solicitudesReales || 0,
              roles
            });
          }
        } else {
          analistasConPrioridades.push({
            usuario_id: analista.id,
            usuario_nombre: `${analista.primer_nombre || ''} ${analista.primer_apellido || ''}`.trim() || analista.username,
            usuario_email: analista.email,
            empresa_id: undefined,
            empresa_nombre: '',
            empresa_nit: '',
            empresa_direccion: '',
            sucursal_id: undefined,
            sucursal_nombre: '',
            nivel_prioridad_1: null,
            nivel_prioridad_2: null,
            nivel_prioridad_3: null,
            cantidad_configurada: 0,
            cantidad_asignadas: solicitudesReales || 0,
            cantidad_solicitudes: solicitudesReales || 0,
            roles
          });
        }
      }

      const analistasOrdenados = analistasConPrioridades.sort((a, b) => {
        const solicitudesA = a.cantidad_asignadas || 0;
        const solicitudesB = b.cantidad_asignadas || 0;
        return solicitudesB - solicitudesA;
      });
      return analistasOrdenados;
    } catch (error) {
      console.error('Error en getAnalistasWithPriorities:', error);
      return [];
    }
  },

  // Crear o actualizar asociación de prioridad
  upsert: async (asociacion: Omit<AsociacionPrioridad, 'id' | 'created_at' | 'updated_at'>): Promise<AsociacionPrioridad | null> => {
    try {
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

      return data || [];
    } catch (error) {
      console.error('Error en getPrioridadesByUsuarioId:', error);
      return [];
    }
  },

  // Eliminar todas las prioridades de un usuario
  deleteByUsuarioId: async (usuarioId: number): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('analista_prioridades')
        .delete()
        .eq('usuario_id', usuarioId);

      if (error) {
        console.error('Error al eliminar prioridades del usuario:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('=== ERROR en deleteByUsuarioId ===');
      console.error('Error en deleteByUsuarioId:', error);
      return false;
    }
  },

};

import { supabase } from './supabaseClient';

export interface AsociacionPrioridad {
  id?: number;
  usuario_id: number;
  empresa_ids?: number[];
  sucursal_ids?: number[];
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
  empresa_id?: number; // Legacy field, extraído de empresa_ids[0]
  empresa_ids?: number[];
  empresa_nombre?: string;
  empresa_nit?: string;
  empresa_direccion?: string;
  sucursal_id?: number; // Legacy field, extraído de sucursal_ids[0]
  sucursal_ids?: number[];
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
          empresa_ids,
          sucursal_ids,
          nivel_prioridad_1,
          nivel_prioridad_2,
          nivel_prioridad_3,
          cantidad_solicitudes,
          gen_usuarios!inner(
            username,
            email,
            primer_nombre,
            primer_apellido,
            activo
          )
        `)
        .eq('gen_usuarios.rol_id', 4)
        .eq('gen_usuarios.activo', true);

      if (error) {
        console.error('Error al obtener asociaciones de prioridad:', error);
        return [];
      }

      const result: AnalistaPrioridad[] = (data || []).map((item: any) => {
        const empresaIds = item.empresa_ids || [];
        const sucursalIds = item.sucursal_ids || [];
        return {
          usuario_id: item.usuario_id,
          usuario_nombre: `${item.gen_usuarios.primer_nombre || ''} ${item.gen_usuarios.primer_apellido || ''}`.trim() || item.gen_usuarios.username,
          usuario_email: item.gen_usuarios.email,
          empresa_id: empresaIds.length > 0 ? empresaIds[0] : undefined,
          empresa_ids: empresaIds,
          sucursal_id: sucursalIds.length > 0 ? sucursalIds[0] : undefined,
          sucursal_ids: sucursalIds,
          empresa_nombre: '',
          empresa_nit: '',
          empresa_direccion: '',
          sucursal_nombre: '',
          nivel_prioridad_1: item.nivel_prioridad_1,
          nivel_prioridad_2: item.nivel_prioridad_2,
          nivel_prioridad_3: item.nivel_prioridad_3,
          cantidad_configurada: item.cantidad_solicitudes || 0,
          cantidad_asignadas: 0,
          cantidad_solicitudes: 0,
        };
      });

      return result;
    } catch (error) {
      console.error('Error en getAllWithDetails:', error);
      return [];
    }
  },

  // Obtener analistas con sus prioridades agrupadas
  getAnalistasWithPriorities: async (): Promise<AnalistaPrioridad[]> => {
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

      console.log('Roles con permiso rol_analista:', rolIds);

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
            empresa_ids,
            sucursal_ids,
            nivel_prioridad_1,
            nivel_prioridad_2,
            nivel_prioridad_3,
            cantidad_solicitudes
          `)
          .eq('usuario_id', analista.id);

        if (prioridadesError) {
          console.error('Error al obtener prioridades del analista:', prioridadesError);
          continue;
        }

        console.log(`🔍 Prioridades para ${analista.username} (ID: ${analista.id}):`, prioridades);

        const { count: solicitudesReales } = await supabase
          .from('hum_solicitudes')
          .select('*', { count: 'exact', head: true })
          .eq('analista_id', analista.id)
        .not('estado', 'in', '(contratado,cancelado,descartado,stand_by,deserto)');

        if (prioridades && prioridades.length > 0) {
          for (const prioridad of prioridades) {
            // Extraer los arrays de IDs (si existen)
            const empresaIds = prioridad.empresa_ids || [];
            const sucursalIds = prioridad.sucursal_ids || [];
            
            // Usar el primer ID si existe
            const primeraEmpresaId = empresaIds.length > 0 ? empresaIds[0] : undefined;
            const primeraSucursalId = sucursalIds.length > 0 ? sucursalIds[0] : undefined;
            
            analistasConPrioridades.push({
              usuario_id: analista.id,
              usuario_nombre: `${analista.primer_nombre || ''} ${analista.primer_apellido || ''}`.trim() || analista.username,
              usuario_email: analista.email,
              empresa_id: primeraEmpresaId,
              empresa_nombre: '',
              empresa_nit: '',
              empresa_direccion: '',
              sucursal_id: primeraSucursalId,
              sucursal_nombre: '',
              nivel_prioridad_1: prioridad.nivel_prioridad_1,
              nivel_prioridad_2: prioridad.nivel_prioridad_2,
              nivel_prioridad_3: prioridad.nivel_prioridad_3,
              cantidad_configurada: prioridad.cantidad_solicitudes || 0,
              cantidad_asignadas: solicitudesReales || 0,
              // Mantener compatibilidad: usar asignadas en cantidad_solicitudes para la columna general
              cantidad_solicitudes: solicitudesReales || 0,
              roles,
              // Agregar los arrays completos para referencia
              empresa_ids: empresaIds,
              sucursal_ids: sucursalIds
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
      // Insertar el nuevo registro (las prioridades existentes ya fueron eliminadas antes de llamar a este método)
      const { data, error } = await supabase
        .from('analista_prioridades')
        .insert(asociacion)
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
          empresa_ids,
          sucursal_ids,
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


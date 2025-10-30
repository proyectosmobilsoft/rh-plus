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

      // ===== OPTIMIZACIÓN: consultar prioridades y conteos en bloque para evitar N+1 =====
      const analistaIds: number[] = analistas.map((u: any) => u.id);

      // Prioridades en bloque
      const { data: prioridadesAll, error: prioridadesAllError } = await supabase
        .from('analista_prioridades')
        .select(`
          usuario_id,
          empresa_ids,
          sucursal_ids,
          nivel_prioridad_1,
          nivel_prioridad_2,
          nivel_prioridad_3,
          cantidad_solicitudes
        `)
        .in('usuario_id', analistaIds);
      if (prioridadesAllError) {
        console.error('Error al obtener prioridades en bloque:', prioridadesAllError);
      }
      const usuarioIdToPrioridad = new Map<number, any>();
      (prioridadesAll || []).forEach((p: any) => {
        const prev = usuarioIdToPrioridad.get(p.usuario_id);
        if (!prev) {
          usuarioIdToPrioridad.set(p.usuario_id, { ...p });
        } else {
          prev.empresa_ids = Array.from(new Set([...(prev.empresa_ids || []), ...(p.empresa_ids || [])]));
          prev.sucursal_ids = Array.from(new Set([...(prev.sucursal_ids || []), ...(p.sucursal_ids || [])]));
          prev.cantidad_solicitudes = Math.max(prev.cantidad_solicitudes || 0, p.cantidad_solicitudes || 0);
          prev.nivel_prioridad_1 = prev.nivel_prioridad_1 || p.nivel_prioridad_1;
          prev.nivel_prioridad_2 = prev.nivel_prioridad_2 || p.nivel_prioridad_2;
          prev.nivel_prioridad_3 = prev.nivel_prioridad_3 || p.nivel_prioridad_3;
        }
      });

      // Conteo de solicitudes en bloque (una sola consulta)
      const { data: solicitudesRows, error: solicitudesRowsError } = await supabase
        .from('hum_solicitudes')
        .select('analista_id')
        .in('analista_id', analistaIds)
        .not('estado', 'in', '(contratado,cancelado,descartado,stand_by,deserto)');
      if (solicitudesRowsError) {
        console.error('Error al obtener solicitudes para conteo:', solicitudesRowsError);
      }
      const countByAnalistaId = new Map<number, number>();
      (solicitudesRows || []).forEach((row: any) => {
        const id = row.analista_id;
        countByAnalistaId.set(id, (countByAnalistaId.get(id) || 0) + 1);
      });

      const analistasConPrioridades: AnalistaPrioridad[] = (analistas || []).map((analista: any) => {
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

        const p = usuarioIdToPrioridad.get(analista.id) || {};
        const empresaIds = p.empresa_ids || [];
        const sucursalIds = p.sucursal_ids || [];
        const primeraEmpresaId = empresaIds.length > 0 ? empresaIds[0] : undefined;
        const primeraSucursalId = sucursalIds.length > 0 ? sucursalIds[0] : undefined;
        const asignadas = countByAnalistaId.get(analista.id) || 0;

        return {
          usuario_id: analista.id,
          usuario_nombre: `${analista.primer_nombre || ''} ${analista.primer_apellido || ''}`.trim() || analista.username,
          usuario_email: analista.email,
          empresa_id: primeraEmpresaId,
          empresa_ids: empresaIds,
          empresa_nombre: '',
          empresa_nit: '',
          empresa_direccion: '',
          sucursal_id: primeraSucursalId,
          sucursal_ids: sucursalIds,
          sucursal_nombre: '',
          nivel_prioridad_1: p.nivel_prioridad_1 || null,
          nivel_prioridad_2: p.nivel_prioridad_2 || null,
          nivel_prioridad_3: p.nivel_prioridad_3 || null,
          cantidad_configurada: p.cantidad_solicitudes || 0,
          cantidad_asignadas: asignadas,
          cantidad_solicitudes: asignadas,
          roles,
        } as AnalistaPrioridad;
      });

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


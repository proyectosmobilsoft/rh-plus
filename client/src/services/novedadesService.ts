import { supabase } from './supabaseClient';

// ============================================================
// TIPOS E INTERFACES
// ============================================================

export interface NovedadEmpleado {
    id?: number;
    nombre: string;
    apellido?: string;
    numero_documento?: string;
    tipo_documento?: string;
    cargo?: string;
    empresa_id?: number;
    sucursal?: string;
    centro_costo_id?: number;
    fecha_ingreso?: string;
    lider_id?: number;
    estado?: string;
    horas_laborales?: number;
    jornada?: string;
    nivel_riesgo?: string;
    salario?: number;
    auxilio_no_prestacional?: number;
    duracion_contrato?: string;
    area?: string;
    negocio?: string;
    ciudad?: string;
    proyecto?: string;
    activo?: boolean;
    created_at?: string;
    updated_at?: string;
    // Joins
    empresa?: { id: number; razon_social: string };
    lider?: { id: number; primer_nombre: string; primer_apellido: string };
}

export interface NovedadMotivo {
    id: number;
    nombre: string;
    codigo: string;
    descripcion?: string;
    requiere_comite: boolean;
    requiere_reemplazo_check: boolean;
    permite_adjuntos: boolean;
    permite_seleccion_multiple: boolean;
    activo: boolean;
    orden: number;
}

export interface NovedadSolicitud {
    id?: number;
    empleado_id?: number;
    motivo_id: number;
    empresa_id?: number;
    datos_formulario: Record<string, any>;
    estado?: string;
    estado_anterior?: string;
    sucursal?: string;
    requiere_reemplazo?: boolean;
    observaciones?: string;
    documentos_soporte?: string[];
    datos_reemplazo?: Record<string, any>;
    created_by?: number;
    updated_by?: number;
    aprobado_por?: number;
    fecha_aprobacion?: string;
    empleados_ids?: number[];
    created_at?: string;
    updated_at?: string;
    // Joins
    empleado?: NovedadEmpleado;
    motivo?: NovedadMotivo;
    creador?: { id: number; primer_nombre: string; primer_apellido: string; username: string };
}

export interface NovedadFiltros {
    motivo_id?: number;
    empresa_id?: number;
    sucursal?: string;
    estado?: string;
    created_by?: number;
    fecha_desde?: string;
    fecha_hasta?: string;
    busqueda?: string;
}

// ============================================================
// ESTADOS Y TRANSICIONES
// ============================================================

export const ESTADOS_NOVEDAD = {
    SOLICITADA: 'solicitada',
    APROBADO_COMITE: 'aprobado_comite',
    EN_PROCESO: 'en_proceso',
    EN_RECLUTAMIENTO: 'en_reclutamiento',
    ENTREVISTA_CLIENTE: 'entrevista_cliente',
    SELECCIONADO: 'seleccionado',
    RECHAZADA: 'rechazada',
    CONGELADA: 'congelada',
    EJECUTADA: 'ejecutada',
    CANCELADA: 'cancelada',
} as const;

export const ESTADO_LABELS: Record<string, string> = {
    solicitada: 'Solicitada',
    aprobado_comite: 'Aprobado Comité',
    en_proceso: 'En Proceso',
    en_reclutamiento: 'En Reclutamiento',
    entrevista_cliente: 'Entrevista Cliente',
    seleccionado: 'Seleccionado',
    rechazada: 'Rechazada',
    congelada: 'Congelada',
    ejecutada: 'Ejecutada',
    cancelada: 'Cancelada',
};

export const ESTADO_COLORS: Record<string, string> = {
    solicitada: 'bg-blue-100 text-blue-800',
    aprobado_comite: 'bg-green-100 text-green-800',
    en_proceso: 'bg-yellow-100 text-yellow-800',
    en_reclutamiento: 'bg-purple-100 text-purple-800',
    entrevista_cliente: 'bg-indigo-100 text-indigo-800',
    seleccionado: 'bg-emerald-100 text-emerald-800',
    rechazada: 'bg-red-100 text-red-800',
    congelada: 'bg-gray-100 text-gray-800',
    ejecutada: 'bg-teal-100 text-teal-800',
    cancelada: 'bg-orange-100 text-orange-800',
};

// Transiciones válidas de estado
export const TRANSICIONES_VALIDAS: Record<string, string[]> = {
    solicitada: ['aprobado_comite', 'en_proceso', 'rechazada', 'congelada', 'cancelada'],
    aprobado_comite: ['en_proceso', 'rechazada', 'congelada'],
    en_proceso: ['en_reclutamiento', 'ejecutada', 'congelada'],
    en_reclutamiento: ['entrevista_cliente', 'seleccionado', 'congelada'],
    entrevista_cliente: ['seleccionado', 'rechazada', 'congelada'],
    seleccionado: ['ejecutada'],
    rechazada: [],
    congelada: ['solicitada', 'en_proceso'],
    ejecutada: [],
    cancelada: [],
};

// ============================================================
// HELPERS
// ============================================================

const getUsuarioActualId = (): number | null => {
    try {
        const userData = localStorage.getItem('userData');
        if (userData) {
            const user = JSON.parse(userData);
            return user.id || null;
        }
        return null;
    } catch {
        return null;
    }
};

// ============================================================
// SERVICIO PRINCIPAL
// ============================================================

export const novedadesService = {

    // ----------------------------------------------------------
    // MOTIVOS
    // ----------------------------------------------------------

    getMotivos: async (): Promise<NovedadMotivo[]> => {
        try {
            console.log('Fetching motivos...');
            const { data, error } = await supabase
                .from('novedades_motivos')
                .select('*')
                .eq('activo', true)
                .order('orden', { ascending: true });

            if (error) {
                console.error('Error obteniendo motivos (Supabase):', error);
                return [];
            }
            console.log('Motivos fetched:', data);
            return data || [];
        } catch (error) {
            console.error('Error en getMotivos (Catch):', error);
            return [];
        }
    },

    // ----------------------------------------------------------
    // EMPLEADOS
    // ----------------------------------------------------------

    getEmpleadosByLider: async (
        liderId: number,
        filtros?: { empresa_id?: number; sucursal?: string; busqueda?: string }
    ): Promise<NovedadEmpleado[]> => {
        try {
            let query = supabase
                .from('novedades_empleados')
                .select(`
          *,
          empresa:empresas(id, razon_social),
          lider:gen_usuarios!novedades_empleados_lider_id_fkey(id, primer_nombre, primer_apellido)
        `)
                .eq('lider_id', liderId)
                .eq('activo', true)
                .eq('estado', 'activo');

            if (filtros?.empresa_id) {
                query = query.eq('empresa_id', filtros.empresa_id);
            }
            if (filtros?.sucursal) {
                query = query.ilike('sucursal', `%${filtros.sucursal}%`);
            }
            if (filtros?.busqueda) {
                query = query.or(
                    `nombre.ilike.%${filtros.busqueda}%,apellido.ilike.%${filtros.busqueda}%,numero_documento.ilike.%${filtros.busqueda}%`
                );
            }

            const { data, error } = await query.order('nombre', { ascending: true });

            if (error) {
                console.error('Error obteniendo empleados:', error);
                return [];
            }
            return data || [];
        } catch (error) {
            console.error('Error en getEmpleadosByLider:', error);
            return [];
        }
    },

    getAllEmpleados: async (
        filtros?: { empresa_id?: number; sucursal?: string; busqueda?: string }
    ): Promise<NovedadEmpleado[]> => {
        try {
            let query = supabase
                .from('novedades_empleados')
                .select(`
          *,
          empresa:empresas(id, razon_social),
          lider:gen_usuarios!novedades_empleados_lider_id_fkey(id, primer_nombre, primer_apellido)
        `)
                .eq('activo', true)
                .eq('estado', 'activo');

            if (filtros?.empresa_id) {
                query = query.eq('empresa_id', filtros.empresa_id);
            }
            if (filtros?.sucursal) {
                query = query.ilike('sucursal', `%${filtros.sucursal}%`);
            }
            if (filtros?.busqueda) {
                query = query.or(
                    `nombre.ilike.%${filtros.busqueda}%,apellido.ilike.%${filtros.busqueda}%,numero_documento.ilike.%${filtros.busqueda}%`
                );
            }

            const { data, error } = await query.order('nombre', { ascending: true });

            if (error) {
                console.error('Error obteniendo todos los empleados:', error);
                return [];
            }
            return data || [];
        } catch (error) {
            console.error('Error en getAllEmpleados:', error);
            return [];
        }
    },

    getEmpleadoById: async (id: number): Promise<NovedadEmpleado | null> => {
        try {
            const { data, error } = await supabase
                .from('novedades_empleados')
                .select(`
          *,
          empresa:empresas(id, razon_social),
          lider:gen_usuarios!novedades_empleados_lider_id_fkey(id, primer_nombre, primer_apellido)
        `)
                .eq('id', id)
                .single();

            if (error) {
                console.error('Error obteniendo empleado:', error);
                return null;
            }
            return data;
        } catch (error) {
            console.error('Error en getEmpleadoById:', error);
            return null;
        }
    },

    createEmpleado: async (empleado: Omit<NovedadEmpleado, 'id' | 'created_at' | 'updated_at'>): Promise<NovedadEmpleado | null> => {
        try {
            const { data, error } = await supabase
                .from('novedades_empleados')
                .insert(empleado)
                .select()
                .single();

            if (error) {
                console.error('Error creando empleado:', error);
                return null;
            }
            return data;
        } catch (error) {
            console.error('Error en createEmpleado:', error);
            return null;
        }
    },

    updateEmpleado: async (id: number, empleado: Partial<NovedadEmpleado>): Promise<NovedadEmpleado | null> => {
        try {
            const { data, error } = await supabase
                .from('novedades_empleados')
                .update(empleado)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                console.error('Error actualizando empleado:', error);
                return null;
            }
            return data;
        } catch (error) {
            console.error('Error en updateEmpleado:', error);
            return null;
        }
    },

    // ----------------------------------------------------------
    // SOLICITUDES
    // ----------------------------------------------------------

    getSolicitudes: async (filtros?: NovedadFiltros): Promise<NovedadSolicitud[]> => {
        try {
            let query = supabase
                .from('novedades_solicitudes')
                .select(`
          *,
          empleado:novedades_empleados(id, nombre, apellido, numero_documento, cargo, sucursal),
          motivo:novedades_motivos(id, nombre, codigo, requiere_comite),
          creador:gen_usuarios!novedades_solicitudes_created_by_fkey(id, primer_nombre, primer_apellido, username)
        `);

            if (filtros?.motivo_id) {
                query = query.eq('motivo_id', filtros.motivo_id);
            }
            if (filtros?.empresa_id) {
                query = query.eq('empresa_id', filtros.empresa_id);
            }
            if (filtros?.sucursal) {
                query = query.ilike('sucursal', `%${filtros.sucursal}%`);
            }
            if (filtros?.estado) {
                query = query.eq('estado', filtros.estado);
            }
            if (filtros?.created_by) {
                query = query.eq('created_by', filtros.created_by);
            }
            if (filtros?.fecha_desde) {
                query = query.gte('created_at', filtros.fecha_desde);
            }
            if (filtros?.fecha_hasta) {
                query = query.lte('created_at', filtros.fecha_hasta);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) {
                console.error('Error obteniendo solicitudes:', error);
                return [];
            }
            return data || [];
        } catch (error) {
            console.error('Error en getSolicitudes:', error);
            return [];
        }
    },

    getSolicitudById: async (id: number): Promise<NovedadSolicitud | null> => {
        try {
            const { data, error } = await supabase
                .from('novedades_solicitudes')
                .select(`
          *,
          empleado:novedades_empleados(*),
          motivo:novedades_motivos(*),
          creador:gen_usuarios!novedades_solicitudes_created_by_fkey(id, primer_nombre, primer_apellido, username, email)
        `)
                .eq('id', id)
                .single();

            if (error) {
                console.error('Error obteniendo solicitud:', error);
                return null;
            }
            return data;
        } catch (error) {
            console.error('Error en getSolicitudById:', error);
            return null;
        }
    },

    createSolicitud: async (solicitud: Omit<NovedadSolicitud, 'id' | 'created_at' | 'updated_at'>): Promise<NovedadSolicitud | null> => {
        try {
            const userId = getUsuarioActualId();
            const dataToInsert = {
                ...solicitud,
                created_by: userId,
                estado: 'solicitada',
            };

            const { data, error } = await supabase
                .from('novedades_solicitudes')
                .insert(dataToInsert)
                .select(`
          *,
          empleado:novedades_empleados(id, nombre, apellido, cargo),
          motivo:novedades_motivos(id, nombre, codigo)
        `)
                .single();

            if (error) {
                console.error('Error creando solicitud:', error);
                return null;
            }

            // Crear log de creación
            if (data) {
                await novedadesLogsService.crearLog({
                    solicitud_id: data.id!,
                    usuario_id: userId || undefined,
                    accion: ACCIONES_NOVEDADES.CREAR,
                    estado_nuevo: 'solicitada',
                    observacion: `Solicitud de ${data.motivo?.nombre || 'novedad'} creada`,
                });
            }

            console.log('✅ Solicitud de novedad creada:', data);
            return data;
        } catch (error) {
            console.error('Error en createSolicitud:', error);
            return null;
        }
    },

    updateSolicitud: async (id: number, solicitud: Partial<NovedadSolicitud>): Promise<NovedadSolicitud | null> => {
        try {
            // Solo se puede editar si está en estado 'solicitada'
            const current = await novedadesService.getSolicitudById(id);
            if (!current || current.estado !== 'solicitada') {
                console.error('Solo se pueden editar solicitudes en estado "solicitada"');
                return null;
            }

            const userId = getUsuarioActualId();
            const { data, error } = await supabase
                .from('novedades_solicitudes')
                .update({ ...solicitud, updated_by: userId })
                .eq('id', id)
                .select(`
          *,
          empleado:novedades_empleados(id, nombre, apellido, cargo),
          motivo:novedades_motivos(id, nombre, codigo)
        `)
                .single();

            if (error) {
                console.error('Error actualizando solicitud:', error);
                return null;
            }

            if (data) {
                await novedadesLogsService.crearLog({
                    solicitud_id: id,
                    usuario_id: userId || undefined,
                    accion: ACCIONES_NOVEDADES.EDITAR,
                    observacion: 'Solicitud actualizada',
                });
            }

            return data;
        } catch (error) {
            console.error('Error en updateSolicitud:', error);
            return null;
        }
    },

    cambiarEstado: async (
        id: number,
        nuevoEstado: string,
        observacion?: string
    ): Promise<NovedadSolicitud | null> => {
        try {
            const current = await novedadesService.getSolicitudById(id);
            if (!current) {
                console.error('Solicitud no encontrada');
                return null;
            }

            // Validar transición
            const transicionesPermitidas = TRANSICIONES_VALIDAS[current.estado || ''] || [];
            if (!transicionesPermitidas.includes(nuevoEstado)) {
                console.error(`Transición no permitida: ${current.estado} → ${nuevoEstado}`);
                return null;
            }

            const userId = getUsuarioActualId();
            const updateData: any = {
                estado: nuevoEstado,
                estado_anterior: current.estado,
                updated_by: userId,
            };

            if (nuevoEstado === 'aprobado_comite' || nuevoEstado === 'ejecutada') {
                updateData.aprobado_por = userId;
                updateData.fecha_aprobacion = new Date().toISOString();
            }

            const { data, error } = await supabase
                .from('novedades_solicitudes')
                .update(updateData)
                .eq('id', id)
                .select(`
          *,
          empleado:novedades_empleados(id, nombre, apellido, cargo),
          motivo:novedades_motivos(id, nombre, codigo)
        `)
                .single();

            if (error) {
                console.error('Error cambiando estado:', error);
                return null;
            }

            // Log del cambio de estado
            if (data) {
                await novedadesLogsService.crearLog({
                    solicitud_id: id,
                    usuario_id: userId || undefined,
                    accion: ACCIONES_NOVEDADES.CAMBIAR_ESTADO,
                    estado_anterior: current.estado,
                    estado_nuevo: nuevoEstado,
                    observacion: observacion || `Estado cambiado a ${ESTADO_LABELS[nuevoEstado] || nuevoEstado}`,
                });
            }

            console.log(`✅ Estado cambiado: ${current.estado} → ${nuevoEstado}`);
            return data;
        } catch (error) {
            console.error('Error en cambiarEstado:', error);
            return null;
        }
    },

    cancelarSolicitud: async (id: number, observacion?: string): Promise<boolean> => {
        try {
            const result = await novedadesService.cambiarEstado(
                id,
                ESTADOS_NOVEDAD.CANCELADA,
                observacion || 'Solicitud cancelada por el usuario'
            );
            return result !== null;
        } catch (error) {
            console.error('Error en cancelarSolicitud:', error);
            return false;
        }
    },

    aprobarComite: async (id: number, observacion?: string): Promise<NovedadSolicitud | null> => {
        return novedadesService.cambiarEstado(
            id,
            ESTADOS_NOVEDAD.APROBADO_COMITE,
            observacion || 'Aprobado por comité'
        );
    },

    rechazarSolicitud: async (id: number, observacion?: string): Promise<NovedadSolicitud | null> => {
        return novedadesService.cambiarEstado(
            id,
            ESTADOS_NOVEDAD.RECHAZADA,
            observacion || 'Solicitud rechazada'
        );
    },

    congelarSolicitud: async (id: number, observacion?: string): Promise<NovedadSolicitud | null> => {
        return novedadesService.cambiarEstado(
            id,
            ESTADOS_NOVEDAD.CONGELADA,
            observacion || 'Solicitud congelada'
        );
    },

    // Guardar datos de reemplazo
    guardarDatosReemplazo: async (id: number, datosReemplazo: Record<string, any>): Promise<boolean> => {
        try {
            const userId = getUsuarioActualId();
            const { error } = await supabase
                .from('novedades_solicitudes')
                .update({
                    datos_reemplazo: datosReemplazo,
                    requiere_reemplazo: true,
                    updated_by: userId,
                })
                .eq('id', id);

            if (error) {
                console.error('Error guardando datos de reemplazo:', error);
                return false;
            }

            await novedadesLogsService.crearLog({
                solicitud_id: id,
                usuario_id: userId || undefined,
                accion: ACCIONES_NOVEDADES.GESTIONAR_REEMPLAZO,
                observacion: 'Datos de reemplazo registrados',
            });

            return true;
        } catch (error) {
            console.error('Error en guardarDatosReemplazo:', error);
            return false;
        }
    },

    // ----------------------------------------------------------
    // ESTADÍSTICAS
    // ----------------------------------------------------------

    getEstadisticas: async (empresaId?: number): Promise<Record<string, number>> => {
        try {
            let query = supabase
                .from('novedades_solicitudes')
                .select('estado', { count: 'exact' });

            if (empresaId) {
                query = query.eq('empresa_id', empresaId);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error obteniendo estadísticas:', error);
                return {};
            }

            const stats: Record<string, number> = {};
            (data || []).forEach((row: any) => {
                stats[row.estado] = (stats[row.estado] || 0) + 1;
            });

            return stats;
        } catch (error) {
            console.error('Error en getEstadisticas:', error);
            return {};
        }
    },

    // ----------------------------------------------------------
    // SUCURSALES (para filtros)
    // ----------------------------------------------------------

    getSucursales: async (): Promise<string[]> => {
        try {
            const { data, error } = await supabase
                .from('novedades_empleados')
                .select('sucursal')
                .eq('activo', true)
                .not('sucursal', 'is', null);

            if (error) {
                console.error('Error obteniendo sucursales:', error);
                return [];
            }

            const sucursales = [...new Set((data || []).map((d: any) => d.sucursal).filter(Boolean))];
            return sucursales.sort();
        } catch (error) {
            console.error('Error en getSucursales:', error);
            return [];
        }
    },
};

// ============================================================
// SERVICIO DE LOGS (importado por circularidad-evitando)
// ============================================================

export interface NovedadLog {
    id?: number;
    solicitud_id: number;
    usuario_id?: number;
    accion: string;
    estado_anterior?: string;
    estado_nuevo?: string;
    observacion?: string;
    metadata?: Record<string, any>;
    fecha_accion?: string;
    // Joins
    usuario?: { id: number; primer_nombre: string; primer_apellido: string; username: string };
}

export const ACCIONES_NOVEDADES = {
    CREAR: 'CREAR_NOVEDAD',
    EDITAR: 'EDITAR_NOVEDAD',
    CAMBIAR_ESTADO: 'CAMBIAR_ESTADO',
    CANCELAR: 'CANCELAR_NOVEDAD',
    APROBAR: 'APROBAR_NOVEDAD',
    RECHAZAR: 'RECHAZAR_NOVEDAD',
    CONGELAR: 'CONGELAR_NOVEDAD',
    EXPORTAR: 'EXPORTAR_NOVEDADES',
    GESTIONAR_REEMPLAZO: 'GESTIONAR_REEMPLAZO',
} as const;

export const novedadesLogsService = {
    crearLog: async (logData: Omit<NovedadLog, 'id' | 'fecha_accion'>): Promise<NovedadLog | null> => {
        try {
            const dataToInsert: any = {
                ...logData,
                accion: logData.accion?.toLowerCase(),
                fecha_accion: new Date().toISOString(),
            };

            if (!logData.usuario_id) {
                const userId = getUsuarioActualId();
                if (userId) {
                    dataToInsert.usuario_id = userId;
                } else {
                    delete dataToInsert.usuario_id;
                }
            }

            const { data, error } = await supabase
                .from('novedades_logs')
                .insert(dataToInsert)
                .select(`
          *,
          usuario:gen_usuarios(id, primer_nombre, primer_apellido, username)
        `)
                .single();

            if (error) {
                console.error('Error creando log de novedad:', error);
                return null;
            }

            return data;
        } catch (error) {
            console.error('Error en crearLog (novedades):', error);
            return null;
        }
    },

    getLogsBySolicitud: async (solicitudId: number): Promise<NovedadLog[]> => {
        try {
            const { data, error } = await supabase
                .from('novedades_logs')
                .select(`
          *,
          usuario:gen_usuarios(id, primer_nombre, primer_apellido, username)
        `)
                .eq('solicitud_id', solicitudId)
                .order('fecha_accion', { ascending: false });

            if (error) {
                console.error('Error obteniendo logs:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('Error en getLogsBySolicitud:', error);
            return [];
        }
    },
};

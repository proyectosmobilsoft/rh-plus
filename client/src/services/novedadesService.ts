import { supabase } from './supabaseClient';
import { analistaAsignacionService } from './analistaAsignacionService';

// ============================================================
// TIPOS E INTERFACES
// ============================================================

export interface NovedadEmpleado {
    id?: number;
    nombre: string;
    apellido?: string;
    email?: string;
    numero_documento?: string;
    tipo_documento?: string;
    cargo?: string;
    codigo_cargo?: string;
    empresa_id?: number;
    sucursal_id?: number;
    sucursal?: string;
    centro_costo_id?: number;
    fecha_ingreso?: string;
    fecha_nacimiento?: string;
    fecha_expedicion?: string;
    lider_id?: number;
    estado?: string;
    horas_laborales?: number;
    jornada?: string;
    nivel_riesgo?: string;
    salario?: number;
    auxilio_no_prestacional?: number;
    duracion_contrato?: string;
    tipo_contrato?: string;
    numero_contrato?: string;
    direccion?: string;
    telefono?: string;
    sexo?: string;
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
    tipo?: string;
    empresa_id?: number;
    requiere_adjunto: boolean;
    adjunto_obligatorio: boolean;
    requiere_observacion: boolean;
}

export interface NovedadSolicitud {
    id?: number;
    empleado_id?: number;
    motivo_id: number;
    empresa_id?: number;
    datos_formulario: Record<string, any>;
    estado?: string;
    estado_anterior?: string;
    requiere_reemplazo?: boolean;
    observaciones?: string;
    documentos_soporte?: string[];
    datos_reemplazo?: Record<string, any>;
    created_by?: number;
    updated_by?: number;
    aprobado_por?: number;
    fecha_aprobacion?: string;
    fecha_inicio_vacante?: string;
    fecha_congelamiento?: string;
    empleados_ids?: number[];
    analista_id?: number;
    sede_labor_id?: number;
    created_at?: string;
    updated_at?: string;
    // Joins
    empleado?: NovedadEmpleado;
    motivo?: NovedadMotivo;
    empresa?: { id: number; razon_social: string };
    creador?: { id: number; primer_nombre: string; primer_apellido: string; username: string };
    analista?: { id: number; primer_nombre: string; primer_apellido: string; username: string };
}

export interface NovedadFiltros {
    motivo_id?: number;
    empresa_id?: number;
    sucursal?: string;
    estado?: string;
    created_by?: number;
    analista_id?: number;
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

export interface SolicitudCandidato {
    id: number;
    solicitud_id: number;
    identificacion: string;
    nombre_completo: string;
    celular?: string;
    correo?: string;
    estado?: string;
    fecha_entrevista?: string;
    hora_entrevista?: string;
    lugar_entrevista?: string;
    cargo_aspirado?: string;
    observacion_entrevista?: string;
    created_at?: string;
    updated_at?: string;
}

export interface NovedadAprobador {
    id: number;
    usuario_id: number;
    activo: boolean;
    created_at?: string;
    updated_at?: string;
    // Joins
    usuario?: { id: number; primer_nombre: string; primer_apellido: string; username: string };
    cargos?: string[]; // Homologación de cargos
}

export interface NovedadAprobadorCargo {
    id: number;
    aprobador_id: number;
    cargo_nombre: string;
}

// Transiciones válidas de estado (Refinadas según requerimiento)
export const TRANSICIONES_VALIDAS: Record<string, string[]> = {
    solicitada: ['aprobado_comite', 'en_proceso', 'rechazada', 'congelada', 'cancelada'],
    aprobado_comite: ['en_proceso', 'rechazada', 'congelada'],
    en_proceso: ['en_reclutamiento', 'congelada', 'cancelada'],
    en_reclutamiento: ['entrevista_cliente', 'congelada', 'cancelada'],
    entrevista_cliente: ['seleccionado', 'en_reclutamiento', 'congelada'],
    seleccionado: ['ejecutada', 'cancelada'],
    congelada: ['solicitada', 'en_proceso', 'en_reclutamiento'],
    rechazada: [],
    ejecutada: [],
    cancelada: []
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

    getMotivos: async (empresa_id?: number): Promise<NovedadMotivo[]> => {
        try {
            let query = supabase
                .from('novedades_motivos')
                .select('*')
                .eq('activo', true)
                .order('nombre', { ascending: true });

            // Filtrar por empresa: mostrar los que son de esa empresa O los que no tienen empresa asignada (globales)
            if (empresa_id) {
                query = query.or(`empresa_id.eq.${empresa_id},empresa_id.is.null`);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error obteniendo motivos:', error);
                return [];
            }
            return data || [];
        } catch (error) {
            console.error('Error en getMotivos:', error);
            return [];
        }
    },

    // ----------------------------------------------------------
    // EMPLEADOS
    // ----------------------------------------------------------

    getEmpleadosByLider: async (
        liderId: number,
        filtros?: { empresa_id?: number; sucursal_id?: number; busqueda?: string }
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
            if (filtros?.sucursal_id) {
                query = query.eq('sucursal_id', filtros.sucursal_id);
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
        filtros?: { empresa_id?: number; sucursal_id?: number; busqueda?: string }
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
            if (filtros?.sucursal_id) {
                query = query.eq('sucursal_id', filtros.sucursal_id);
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

    getEmpleadosKaptus: async (
        params?: { page?: number; pageSize?: number; all?: boolean }
    ): Promise<NovedadEmpleado[]> => {
        try {
            const token = import.meta.env.VITE_KAPTUS_API_TOKEN
                || '14bf055ff3a38813f8fc9724c281e1588b2d6ff133e8f0f44f2dfe16c63b6175';
            const page = params?.page ?? 1;
            const pageSize = params?.pageSize ?? 20;
            const all = params?.all ?? false;
            // Por defecto usa proxy /kaptus-api (dev/preview). En IIS prod definir VITE_KAPTUS_API_URL.
            const baseUrl = (import.meta.env.VITE_KAPTUS_API_URL || '/kaptus-api').replace(/\/$/, '');
            const isAbsolute = /^https?:\/\//i.test(baseUrl);
            const url = isAbsolute
                ? new URL(`${baseUrl}/api/empleados_kaptus`)
                : new URL(`${baseUrl}/api/empleados_kaptus`, window.location.origin);
            url.searchParams.set('page', String(page));
            url.searchParams.set('pageSize', String(pageSize));
            url.searchParams.set('all', String(all));

            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    api_token: token,
                },
            });

            if (!response.ok) {
                console.error('Error fetching empleados kaptus:', response.status);
                return [];
            }

            const data: any[] = await response.json();

            return (data || []).map((k: any): NovedadEmpleado => ({
                id: k['Numero documento Identidad'],
                nombre: (k['Nombre Empleado'] || '').trim(),
                apellido: (k['Apellidos empleados'] || '').trim(),
                email: k['Mail Colaborador'] || undefined,
                numero_documento: String(k['Numero documento Identidad'] || ''),
                tipo_documento: k['Tipo Documento'] || undefined,
                cargo: (k['Nombre Cargo'] || '').trim() || undefined,
                codigo_cargo: (k['Codigo Cargo'] || '').trim() || undefined,
                sucursal: k['Codigo Sucursal'] != null ? String(k['Codigo Sucursal']) : undefined,
                fecha_ingreso: k['Fecha Ingresos'] || undefined,
                fecha_nacimiento: k['Fecha Nacimiento'] || undefined,
                fecha_expedicion: k['Fecha Expedicion'] || undefined,
                salario: k['Sueldo Basico'] || undefined,
                auxilio_no_prestacional: k['Aux No prestacional'] || undefined,
                estado: k['Indicador de Actividad'] === 'A' ? 'activo' : 'inactivo',
                lider_id: k['Lider'] || undefined,
                tipo_contrato: k['Tipo Contrato'] || undefined,
                duracion_contrato: k['Tipo Contrato'] === 'I' ? 'Indefinido' : k['Tipo Contrato'] === 'F' ? 'Fijo' : k['Tipo Contrato'] === 'T' ? 'Temporal' : k['Tipo Contrato'] || undefined,
                numero_contrato: (k['Numero de contrato'] || '').trim() || undefined,
                direccion: k['Direccion Residencia'] || undefined,
                telefono: k['Telefono Movil'] || undefined,
                sexo: k['Sexo Empleado'] || undefined,
                empresa: {
                    id: k['Codigo Empresa'],
                    razon_social: (k['Nombre Empresa'] || '').trim(),
                },
                lider: k['Lider'] ? {
                    id: k['Lider'],
                    primer_nombre: k['Nombre lider'] || '',
                    primer_apellido: k['Apellidos lider'] || '',
                } : undefined,
            }));
        } catch (error) {
            console.error('Error en getEmpleadosKaptus:', error);
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
            // Auto-descongelar vacantes que lleven más de 1 mes congeladas
            novedadesService.autoDescongelarExpirados().catch(() => {});

            let query = supabase
                .from('novedades_solicitudes')
                .select(`
                    *,
                    empleado:novedades_empleados(*, sucursal:gen_sucursales(id, nombre), lider:gen_usuarios(id, email, primer_nombre, primer_apellido)),
                    motivo:novedades_motivos(id, nombre, codigo, requiere_comite, tipo),
                    empresa:empresas(id, razon_social),
                    creador:gen_usuarios!novedades_solicitudes_created_by_fkey(id, primer_nombre, primer_apellido, username),
                    analista:gen_usuarios!novedades_solicitudes_analista_id_fkey(id, primer_nombre, primer_apellido, username)
                `);

            if (filtros?.motivo_id) {
                query = query.eq('motivo_id', filtros.motivo_id);
            }
            if (filtros?.empresa_id) {
                query = query.eq('empresa_id', filtros.empresa_id);
            }
            if (filtros?.estado) {
                query = query.eq('estado', filtros.estado);
            }
            if (filtros?.created_by) {
                query = query.eq('created_by', filtros.created_by);
            }
            if (filtros?.analista_id) {
                query = query.eq('analista_id', filtros.analista_id);
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
          empresa:empresas(id, razon_social),
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

            // Resolve empleado_id: Kaptus devuelve numero_documento como id; convertir al id real de novedades_empleados
            let resolvedEmpleadoId = solicitud.empleado_id;
            if (resolvedEmpleadoId != null) {
                const { data: empById } = await supabase
                    .from('novedades_empleados')
                    .select('id')
                    .eq('id', resolvedEmpleadoId)
                    .maybeSingle();
                if (!empById) {
                    const { data: empByDoc } = await supabase
                        .from('novedades_empleados')
                        .select('id')
                        .eq('numero_documento', String(resolvedEmpleadoId))
                        .maybeSingle();
                    if (empByDoc) resolvedEmpleadoId = empByDoc.id;
                }
            }
            solicitud = { ...solicitud, empleado_id: resolvedEmpleadoId };

            // Asignación automática de analista de selección
            let analistaId: number | undefined = solicitud.analista_id;
            if (!analistaId) {
                const sucursalId = resolvedEmpleadoId
                    ? await (async () => {
                        const { data } = await supabase
                            .from('novedades_empleados')
                            .select('sucursal_id')
                            .eq('id', resolvedEmpleadoId)
                            .maybeSingle();
                        return data?.sucursal_id as number | undefined;
                    })()
                    : undefined;

                const analistaAsignado = await analistaAsignacionService.asignarAnalistaSeleccionAutomatico(
                    solicitud.empresa_id,
                    sucursalId
                );
                if (analistaAsignado) {
                    analistaId = analistaAsignado.analista_id;
                    console.log('✅ Analista de selección asignado automáticamente:', analistaAsignado.analista_nombre);
                } else {
                    console.log('⚠️ No se encontró analista de selección elegible, la novedad queda sin analista asignado');
                }
            }

            const dataToInsert = {
                ...solicitud,
                created_by: userId,
                estado: 'solicitada',
                fecha_inicio_vacante: new Date().toISOString(),
                analista_id: analistaId ?? null,
            };

            const { data, error } = await supabase
                .from('novedades_solicitudes')
                .insert(dataToInsert)
                .select(`
                    *,
                    empleado:novedades_empleados(id, nombre, apellido, cargo),
                    motivo:novedades_motivos(id, nombre, codigo),
                    analista:gen_usuarios!novedades_solicitudes_analista_id_fkey(id, primer_nombre, primer_apellido, username)
                `)
                .single();

            if (error) {
                console.error('Error creando solicitud:', error);
                return null;
            }

            if (data) {
                await novedadesLogsService.crearLog({
                    solicitud_id: data.id!,
                    usuario_id: userId || undefined,
                    accion: ACCIONES_NOVEDADES.CREAR,
                    estado_nuevo: 'solicitada',
                    observacion: `Solicitud de ${data.motivo?.nombre || 'novedad'} creada${analistaId ? ` — analista asignado automáticamente` : ''}`,
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

            // Al congelar, registrar fecha de congelamiento
            if (nuevoEstado === ESTADOS_NOVEDAD.CONGELADA) {
                updateData.fecha_congelamiento = new Date().toISOString();
            }

            // Al reactivar desde congelada, reiniciar el tiempo de inicio de vacante
            if (current.estado === ESTADOS_NOVEDAD.CONGELADA) {
                updateData.fecha_inicio_vacante = new Date().toISOString();
                updateData.fecha_congelamiento = null;
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

    // Auto-descongela vacantes congeladas por más de 30 días
    autoDescongelarExpirados: async (): Promise<void> => {
        try {
            const hace30Dias = new Date();
            hace30Dias.setDate(hace30Dias.getDate() - 30);
            const { data, error } = await supabase
                .from('novedades_solicitudes')
                .select('id, estado_anterior')
                .eq('estado', 'congelada')
                .lt('fecha_congelamiento', hace30Dias.toISOString())
                .not('fecha_congelamiento', 'is', null);
            if (error || !data?.length) return;
            const userId = getUsuarioActualId();
            for (const s of data) {
                const estadoRetorno = (s.estado_anterior && s.estado_anterior !== 'congelada') ? s.estado_anterior : 'solicitada';
                await supabase
                    .from('novedades_solicitudes')
                    .update({
                        estado: estadoRetorno,
                        estado_anterior: 'congelada',
                        fecha_inicio_vacante: new Date().toISOString(),
                        fecha_congelamiento: null,
                        updated_by: userId,
                    })
                    .eq('id', s.id);
            }
        } catch {
            // Ignorar para no bloquear el flujo
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

    getCongelamientoConfig: async (): Promise<number> => {
        try {
            const { data } = await supabase
                .from('config_empresa')
                .select('congelamiento')
                .eq('estado', 'activo')
                .maybeSingle();
            return typeof data?.congelamiento === 'number' ? data.congelamiento : 30;
        } catch {
            return 30;
        }
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
                .from('gen_sucursales')
                .select('nombre')
                .eq('activo', true)
                .order('nombre');

            if (error) {
                console.error('Error obteniendo sucursales:', error);
                return [];
            }

            return (data || []).map((d: any) => d.nombre).filter(Boolean);
        } catch (error) {
            console.error('Error en getSucursales:', error);
            return [];
        }
    },

    // ----------------------------------------------------------
    // APROBADORES (MAESTRO)
    // ----------------------------------------------------------

    getAprobadores: async (): Promise<NovedadAprobador[]> => {
        try {
            const { data, error } = await supabase
                .from('novedades_aprobadores')
                .select(`
                    *,
                    usuario:gen_usuarios(id, primer_nombre, primer_apellido, username),
                    novedades_aprobadores_cargos(cargo_nombre)
                `)
                .eq('activo', true);

            if (error) throw error;

            return (data || []).map(a => ({
                ...a,
                cargos: a.novedades_aprobadores_cargos?.map((c: any) => c.cargo_nombre) || []
            }));
        } catch (error) {
            console.error('Error getAprobadores:', error);
            return [];
        }
    },

    addAprobador: async (usuarioId: number, cargos: string[]): Promise<boolean> => {
        try {
            const { data, error } = await supabase
                .from('novedades_aprobadores')
                .insert({ usuario_id: usuarioId })
                .select()
                .single();

            if (error) throw error;

            if (cargos.length > 0) {
                const cargosInsert = cargos.map(c => ({
                    aprobador_id: data.id,
                    cargo_nombre: c
                }));
                await supabase.from('novedades_aprobadores_cargos').insert(cargosInsert);
            }

            return true;
        } catch (error) {
            console.error('Error addAprobador:', error);
            return false;
        }
    },

    removeAprobador: async (id: number): Promise<boolean> => {
        try {
            const { error } = await supabase
                .from('novedades_aprobadores')
                .update({ activo: false })
                .eq('id', id);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error removeAprobador:', error);
            return false;
        }
    },

    updateAprobadorCargos: async (aprobadorId: number, cargos: string[]): Promise<boolean> => {
        try {
            await supabase.from('novedades_aprobadores_cargos').delete().eq('aprobador_id', aprobadorId);

            if (cargos.length > 0) {
                const cargosInsert = cargos.map(c => ({
                    aprobador_id: aprobadorId,
                    cargo_nombre: c
                }));
                await supabase.from('novedades_aprobadores_cargos').insert(cargosInsert);
            }
            return true;
        } catch (error) {
            console.error('Error updateAprobadorCargos:', error);
            return false;
        }
    },

    // ----------------------------------------------------------
    // CANDIDATOS POR SOLICITUD (Módulo de Selección)
    // ----------------------------------------------------------

    getCandidatosBySolicitud: async (solicitudId: number): Promise<SolicitudCandidato[]> => {
        try {
            const { data, error } = await supabase
                .from('novedades_solicitudes_candidatos')
                .select('*')
                .eq('solicitud_id', solicitudId)
                .order('created_at', { ascending: true });
            if (error) {
                console.error('Error getCandidatosBySolicitud:', error);
                return [];
            }
            return data || [];
        } catch (error) {
            console.error('Error getCandidatosBySolicitud:', error);
            return [];
        }
    },

    addCandidatoToSolicitud: async (data: Omit<SolicitudCandidato, 'id' | 'created_at' | 'updated_at'>): Promise<SolicitudCandidato | null> => {
        try {
            const { data: result, error } = await supabase
                .from('novedades_solicitudes_candidatos')
                .insert(data)
                .select()
                .single();
            if (error) {
                console.error('Error addCandidatoToSolicitud:', error);
                return null;
            }
            return result;
        } catch (error) {
            console.error('Error addCandidatoToSolicitud:', error);
            return null;
        }
    },

    updateCandidato: async (id: number, data: Partial<SolicitudCandidato>): Promise<SolicitudCandidato | null> => {
        try {
            const { data: result, error } = await supabase
                .from('novedades_solicitudes_candidatos')
                .update(data)
                .eq('id', id)
                .select()
                .single();
            if (error) {
                console.error('Error updateCandidato:', error);
                return null;
            }
            return result;
        } catch (error) {
            console.error('Error updateCandidato:', error);
            return null;
        }
    },

    updateCandidatoEstado: async (id: number, estado: string): Promise<SolicitudCandidato | null> => {
        try {
            const { data, error } = await supabase
                .from('novedades_solicitudes_candidatos')
                .update({ estado })
                .eq('id', id)
                .select()
                .single();
            if (error) {
                console.error('Error updateCandidatoEstado:', error);
                return null;
            }
            return data;
        } catch (error) {
            console.error('Error updateCandidatoEstado:', error);
            return null;
        }
    },

    deleteCandidato: async (id: number): Promise<boolean> => {
        try {
            const { error } = await supabase
                .from('novedades_solicitudes_candidatos')
                .delete()
                .eq('id', id);
            if (error) {
                console.error('Error deleteCandidato:', error);
                return false;
            }
            return true;
        } catch (error) {
            console.error('Error deleteCandidato:', error);
            return false;
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

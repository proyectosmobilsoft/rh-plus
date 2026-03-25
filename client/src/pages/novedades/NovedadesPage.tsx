import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
    ClipboardCheck,
    Plus,
    Search,
    Download,
    Filter,
    ArrowUp,
    ArrowDown,
    ArrowLeft,
    Users,
    FileText,
    Clock,
    Eye,
    XCircle,
    CheckCircle,
    Pause,
    Loader2,
    AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
    novedadesService,
    novedadesLogsService,
    ESTADOS_NOVEDAD,
    ESTADO_LABELS,
    ESTADO_COLORS,
    TRANSICIONES_VALIDAS,
    ACCIONES_NOVEDADES,
    type NovedadSolicitud,
    type NovedadEmpleado,
    type NovedadMotivo,
    type NovedadFiltros,
    type NovedadLog,
} from '@/services/novedadesService';
import { supabase } from '@/services/supabaseClient';
import { emailService } from '@/services/emailService';
import { Can, usePermissions } from '@/contexts/PermissionsContext';

// ============================================================
// TIPOS DE FORMULARIO POR MOTIVO
// ============================================================

const FORM_FIELDS_BY_MOTIVO: Record<string, { label: string; name: string; type: string; required?: boolean; options?: string[]; helperText?: string; defaultToday?: boolean; rowSpan?: boolean; colStart?: 1 | 2; rowStart?: number; multiple?: boolean }[]> = {
    incapacidades: [
        { label: 'Fecha de inicio', name: 'fecha_inicio', type: 'date', required: true },
        { label: 'Fecha final', name: 'fecha_fin', type: 'date', required: true },
    ],
    retiros: [
        { label: 'Fecha de solicitud', name: 'fecha_solicitud', type: 'date', required: true, defaultToday: true, colStart: 1 },
        { label: 'Último día de trabajo', name: 'fecha_retiro', type: 'date', required: true, colStart: 1 },
        { label: 'Motivo del retiro', name: 'motivo_retiro', type: 'textarea', required: true, rowSpan: true, colStart: 2, rowStart: 1 },
        { label: '¿Requiere reemplazo?', name: 'requiere_reemplazo', type: 'checkbox', colStart: 1 },
        { label: 'Documentos de soporte', name: 'documento_soporte', type: 'file', colStart: 2, multiple: true },
    ],
    aumento_plaza: [
        { label: 'Cargo', name: 'cargo', type: 'text', required: true },
        { label: 'Salario', name: 'salario', type: 'number' },
        { label: 'Auxilio no prestacional', name: 'auxilio', type: 'number' },
        { label: 'Horas laborales', name: 'horas', type: 'jornada-select', required: true },
        { label: 'Jornada', name: 'jornada', type: 'select', options: ['Diurna', 'Nocturna', 'Mixta', 'Flexible'], required: true },
        { label: 'Centro de costo', name: 'centro_costo', type: 'text', required: true },
        { label: 'Área', name: 'area', type: 'text', required: true },
        { label: 'Unidad de negocio', name: 'negocio', type: 'text', required: true },
        { label: 'Ciudad', name: 'ciudad', type: 'text', required: true },
        { label: 'Fecha de ingreso', name: 'fecha_ingreso', type: 'date', required: true },
        { label: 'Proyecto', name: 'proyecto', type: 'text' },
    ],
    cambio_centro_costo: [
        { label: 'Sucursal anterior', name: 'sucursal_anterior', type: 'text', required: true },
        { label: 'Sucursal nueva', name: 'sucursal_nueva', type: 'text', required: true },
        { label: 'Fecha inicio del cambio', name: 'fecha_inicio_cambio', type: 'date', required: true },
    ],
    vacaciones: [
        { label: 'Fecha de inicio', name: 'fecha_inicio', type: 'date', required: true },
        { label: 'Fecha final', name: 'fecha_fin', type: 'date', required: true, helperText: 'Mínimo 30 días entre fechas' },
    ],
    licencias: [
        { label: 'Fecha de inicio', name: 'fecha_inicio', type: 'date', required: true },
        { label: 'Fecha final', name: 'fecha_fin', type: 'date', required: true },
        { label: 'Tipo de licencia', name: 'tipo_licencia', type: 'select', options: ['Maternidad', 'Paternidad', 'Luto', 'Calamidad doméstica', 'Sin goce de sueldo', 'Otra'], required: true },
        { label: 'Duración', name: 'duracion', type: 'text', required: true },
        { label: 'Observaciones', name: 'observaciones', type: 'textarea' },
    ],
    renuncias: [
        { label: 'Fecha de solicitud', name: 'fecha_renuncia', type: 'date', required: true, defaultToday: true },
        { label: 'Motivo de la renuncia', name: 'motivo_renuncia', type: 'textarea', required: true, rowSpan: true },
        { label: 'Último día de trabajo', name: 'fecha_finalizacion', type: 'date', required: true },
        { label: '¿Requiere reemplazo?', name: 'requiere_reemplazo', type: 'checkbox' },
        { label: 'Documento de soporte', name: 'documento_soporte', type: 'file' },
    ],
    postulaciones_internas: [
        { label: 'Cargo al que postula', name: 'cargo_postulacion', type: 'text', required: true },
        { label: 'Motivo de la postulación', name: 'motivo_postulacion', type: 'textarea', required: true },
        { label: 'Salario esperado', name: 'salario_esperado', type: 'number' },
        { label: '¿Genera reemplazo?', name: 'genera_reemplazo', type: 'checkbox' },
        { label: 'Documento adjunto', name: 'documento_adjunto', type: 'file' },
    ],
};

// Aprobador de comité (quemado por ahora; luego se hará la relación con usuario/aprobador)
const CEDULA_APROBADOR_COMITE = '123456789';
const NOMBRE_APROBADOR_COMITE = 'Aprobador Comité';

// Aliases en singular para compatibilidad con códigos de BD
FORM_FIELDS_BY_MOTIVO.incapacidad = FORM_FIELDS_BY_MOTIVO.incapacidades;
FORM_FIELDS_BY_MOTIVO.retiro = FORM_FIELDS_BY_MOTIVO.retiros;
FORM_FIELDS_BY_MOTIVO.renuncia = FORM_FIELDS_BY_MOTIVO.renuncias;
FORM_FIELDS_BY_MOTIVO.licencia = FORM_FIELDS_BY_MOTIVO.licencias;
FORM_FIELDS_BY_MOTIVO.postulacion_interna = FORM_FIELDS_BY_MOTIVO.postulaciones_internas;

// La aprobación de novedades solo está permitida los viernes
const esViernes = () => new Date().getDay() === 5;

// Días sin gestión antes de notificar al coordinador
const DIAS_LIMITE_NOTIFICACION = 15;

// Estados que se consideran finales (no generan alerta)
const ESTADOS_FINALES = [ESTADOS_NOVEDAD.EJECUTADA, ESTADOS_NOVEDAD.RECHAZADA, ESTADOS_NOVEDAD.CANCELADA];

const escapeHtml = (str: string) =>
    str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

const NovedadesPage: React.FC = () => {
    const queryClient = useQueryClient();

    // Empresa del usuario actual
    const empresaId: number | undefined = (() => {
        try {
            const raw = localStorage.getItem('empresaData') || localStorage.getItem('userData');
            if (!raw) return undefined;
            const parsed = JSON.parse(raw);
            return parsed?.empresa?.id ?? parsed?.empresas?.[0]?.id ?? undefined;
        } catch { return undefined; }
    })();

    // Jornadas laborales para el select de horas
    const [jornadasLaborales, setJornadasLaborales] = useState<{ id: number; nombre_jornada: string; horas_laborales: number }[]>([]);
    useEffect(() => {
        supabase.from('jornadas_laborales').select('id, nombre_jornada, horas_laborales').eq('activo', true).order('nombre_jornada')
            .then(({ data }) => { if (data) setJornadasLaborales(data); });
    }, []);

    // Estado de filtros
    const [filtros, setFiltros] = useState<NovedadFiltros>({});
    const [busquedaEmpleado, setBusquedaEmpleado] = useState('');
    const { hasAction } = usePermissions();
    const defaultTab = hasAction('accion-tab-novedades') ? 'solicitudes' : hasAction('accion-tab-empleados') ? 'empleados' : 'solicitudes';
    const [activeTab, setActiveTab] = useState(defaultTab);
    const [prevTab, setPrevTab] = useState('solicitudes');

    // Formulario de nueva solicitud
    const [selectedMotivo, setSelectedMotivo] = useState<NovedadMotivo | null>(null);
    const [selectedEmpleado, setSelectedEmpleado] = useState<NovedadEmpleado | null>(null);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [observaciones, setObservaciones] = useState('');

    // Modal de detalle
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedSolicitud, setSelectedSolicitud] = useState<NovedadSolicitud | null>(null);

    // Modal de timeline
    const [showTimelineModal, setShowTimelineModal] = useState(false);
    const [timelineSolicitudId, setTimelineSolicitudId] = useState<number | null>(null);

    // Selección múltiple (vacaciones)
    const [selectedEmpleados, setSelectedEmpleados] = useState<number[]>([]);

    // Flags del motivo seleccionado
    const [adjuntoFile, setAdjuntoFile] = useState<File | null>(null);
    const [cedulaAprobador, setCedulaAprobador] = useState('');

    // Expanded rows
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
    const [sortFecha, setSortFecha] = useState<'asc' | 'desc'>('desc');

    // ============================================================
    // QUERIES
    // ============================================================

    const { data: motivos = [], isLoading: motivosLoading } = useQuery<NovedadMotivo[]>({
        queryKey: ['novedades-motivos', empresaId],
        queryFn: () => novedadesService.getMotivos(empresaId),
    });

    const { data: solicitudes = [], isLoading: solicitudesLoading, refetch: refetchSolicitudes } = useQuery<NovedadSolicitud[]>({
        queryKey: ['novedades-solicitudes', filtros],
        queryFn: () => novedadesService.getSolicitudes(filtros),
    });

    const { data: empleados = [], isLoading: empleadosLoading } = useQuery<NovedadEmpleado[]>({
        queryKey: ['novedades-empleados', busquedaEmpleado, filtros.empresa_id],
        queryFn: () => novedadesService.getAllEmpleados({
            busqueda: busquedaEmpleado || undefined,
            empresa_id: filtros.empresa_id,
        }),
    });

    const { data: sucursales = [] } = useQuery<string[]>({
        queryKey: ['novedades-sucursales'],
        queryFn: () => novedadesService.getSucursales(),
    });

    const { data: timeline = [] } = useQuery<NovedadLog[]>({
        queryKey: ['novedades-timeline', timelineSolicitudId],
        queryFn: () => timelineSolicitudId ? novedadesLogsService.getLogsBySolicitud(timelineSolicitudId) : Promise.resolve([]),
        enabled: !!timelineSolicitudId,
    });

    // Notificación automática al coordinador cuando una novedad supera el límite de días
    const notificacionEnviadaRef = useRef(false);
    useEffect(() => {
        if (!solicitudes.length || notificacionEnviadaRef.current) return;

        // Calcular días una sola vez por solicitud (map → filter)
        const ahora = Date.now();
        const vencidas = solicitudes
            .filter(s => s.created_at && !ESTADOS_FINALES.includes(s.estado || ''))
            .map(s => ({
                ...s,
                diasSinGestion: Math.floor((ahora - new Date(s.created_at!).getTime()) / (1000 * 60 * 60 * 24)),
            }))
            .filter(s => s.diasSinGestion >= DIAS_LIMITE_NOTIFICACION);

        if (!vencidas.length) return;
        notificacionEnviadaRef.current = true;

        (async () => {
            try {
                const { data: coordinadores } = await supabase
                    .from('gen_usuarios')
                    .select('email, primer_nombre, primer_apellido')
                    .eq('role', 'coordinador')
                    .eq('activo', true);

                if (!coordinadores?.length) return;

                const from = (import.meta as any).env?.VITE_GMAIL_USER || 'noreply@rhplus.co';
                const subject = `⚠️ Alerta: ${vencidas.length} novedad(es) superaron ${DIAS_LIMITE_NOTIFICACION} días sin gestión`;

                const filas = vencidas.map(s => {
                    const nombre = s.empleado
                        ? escapeHtml(`${s.empleado.nombre} ${s.empleado.apellido || ''}`.trim())
                        : `ID ${s.empleado_id}`;
                    return `<tr>
                        <td style="padding:6px 10px;border:1px solid #e5e7eb">${s.id}</td>
                        <td style="padding:6px 10px;border:1px solid #e5e7eb">${escapeHtml(s.motivo?.nombre || String(s.motivo_id))}</td>
                        <td style="padding:6px 10px;border:1px solid #e5e7eb">${nombre}</td>
                        <td style="padding:6px 10px;border:1px solid #e5e7eb;color:#dc2626;font-weight:600">${s.diasSinGestion} días</td>
                        <td style="padding:6px 10px;border:1px solid #e5e7eb">${s.estado || 'solicitada'}</td>
                    </tr>`;
                }).join('');

                // Enviar a todos los coordinadores en paralelo
                await Promise.all(coordinadores.map(coord => emailService.sendEmail({
                    to: coord.email,
                    from,
                    subject,
                    html: `
                        <div style="font-family:sans-serif;max-width:680px;margin:0 auto">
                            <h2 style="color:#b45309">⚠️ Novedades sin gestión — Alerta de tiempo</h2>
                            <p>Estimado/a <strong>${escapeHtml(coord.primer_nombre)} ${escapeHtml(coord.primer_apellido)}</strong>,</p>
                            <p>Las siguientes solicitudes llevan más de <strong>${DIAS_LIMITE_NOTIFICACION} días</strong> sin ser gestionadas:</p>
                            <table style="border-collapse:collapse;width:100%;margin:16px 0;font-size:14px">
                                <thead>
                                    <tr style="background:#fef3c7">
                                        <th style="padding:8px 10px;border:1px solid #e5e7eb;text-align:left">#</th>
                                        <th style="padding:8px 10px;border:1px solid #e5e7eb;text-align:left">Motivo</th>
                                        <th style="padding:8px 10px;border:1px solid #e5e7eb;text-align:left">Empleado</th>
                                        <th style="padding:8px 10px;border:1px solid #e5e7eb;text-align:left">Días</th>
                                        <th style="padding:8px 10px;border:1px solid #e5e7eb;text-align:left">Estado</th>
                                    </tr>
                                </thead>
                                <tbody>${filas}</tbody>
                            </table>
                            <p>Por favor gestione estas solicitudes a la brevedad.</p>
                        </div>
                    `,
                })));
            } catch (_) {
                // No bloquear la UI si el email falla
            }
        })();
    }, [solicitudes.length]);

    // ============================================================
    // MUTATIONS
    // ============================================================

    const createMutation = useMutation({
        mutationFn: (data: any) => novedadesService.createSolicitud(data),
        onSuccess: () => {
            toast.success('Solicitud de novedad creada exitosamente');
            queryClient.invalidateQueries({ queryKey: ['novedades-solicitudes'] });
            resetForm();
        },
        onError: () => toast.error('Error al crear la solicitud'),
    });

    const cambiarEstadoMutation = useMutation({
        mutationFn: ({ id, estado, obs }: { id: number; estado: string; obs?: string }) =>
            novedadesService.cambiarEstado(id, estado, obs),
        onSuccess: () => {
            toast.success('Estado actualizado correctamente');
            queryClient.invalidateQueries({ queryKey: ['novedades-solicitudes'] });
        },
        onError: (err: Error) => toast.error(err?.message || 'Error al cambiar el estado'),
    });

    const cancelMutation = useMutation({
        mutationFn: (id: number) => novedadesService.cancelarSolicitud(id),
        onSuccess: () => {
            toast.success('Solicitud cancelada');
            queryClient.invalidateQueries({ queryKey: ['novedades-solicitudes'] });
        },
        onError: () => toast.error('Error al cancelar la solicitud'),
    });

    // ============================================================
    // HANDLERS
    // ============================================================

    const buildDefaultFormData = (motivo: NovedadMotivo | null) => {
        if (!motivo) return {};
        const fields = FORM_FIELDS_BY_MOTIVO[motivo.codigo] || [];
        const defaults: Record<string, any> = {};
        const today = new Date().toISOString().split('T')[0];
        for (const f of fields) {
            if (f.defaultToday && f.type === 'date') defaults[f.name] = today;
        }
        return defaults;
    };

    const goToRegistro = () => {
        setPrevTab(activeTab);
        setSelectedMotivo(null);
        setSelectedEmpleado(null);
        setFormData({});
        setObservaciones('');
        setSelectedEmpleados([]);
        setAdjuntoFile(null);
        setCedulaAprobador('');
        setActiveTab('nueva_novedad');
    };

    const resetForm = () => {
        setSelectedMotivo(null);
        setSelectedEmpleado(null);
        setFormData({});
        setObservaciones('');
        setSelectedEmpleados([]);
        setAdjuntoFile(null);
        setCedulaAprobador('');
        setActiveTab(prevTab);
    };

    const handleSubmitForm = async () => {
        if (!selectedMotivo) {
            toast.error('Selecciona un motivo de novedad');
            return;
        }

        // Validar campos requeridos del formulario dinámico
        const fields = FORM_FIELDS_BY_MOTIVO[selectedMotivo.codigo] || [];
        for (const field of fields) {
            if (field.required && !formData[field.name] && field.type !== 'checkbox') {
                toast.error(`El campo "${field.label}" es requerido`);
                return;
            }
        }

        // Validación de vacaciones: mínimo 30 días
        if (selectedMotivo.codigo === 'vacaciones' && formData.fecha_inicio && formData.fecha_fin) {
            const inicio = new Date(formData.fecha_inicio);
            const fin = new Date(formData.fecha_fin);
            const diffDays = Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays < 30) {
                toast.error('Para vacaciones, debe haber mínimo 30 días entre las fechas');
                return;
            }
        }

        // Validar observación obligatoria
        if (selectedMotivo.requiere_observacion && !observaciones.trim()) {
            toast.error('Las observaciones son obligatorias para este motivo');
            return;
        }

        // Validar adjunto obligatorio
        if (selectedMotivo.adjunto_obligatorio && !adjuntoFile) {
            toast.error('Debe adjuntar un documento obligatorio para este motivo');
            return;
        }

        // Cuando requiere comité se usa la cédula aprobador asignada automáticamente (quemada por ahora)

        // Para vacaciones con selección múltiple
        if (selectedMotivo.permite_seleccion_multiple && selectedEmpleados.length === 0 && !selectedEmpleado) {
            toast.error('Selecciona al menos un empleado');
            return;
        }

        // Para otros motivos, verificar que hay empleado seleccionado
        if (!selectedMotivo.permite_seleccion_multiple && !selectedEmpleado) {
            toast.error('Selecciona un empleado');
            return;
        }

        const datosForm = { ...formData };
        if (selectedMotivo.codigo === 'renuncias') {
            datosForm.fecha_renuncia = new Date().toISOString().split('T')[0];
        }
        const solicitudData = {
            motivo_id: selectedMotivo.id,
            empleado_id: selectedEmpleado?.id,
            empresa_id: selectedEmpleado?.empresa_id || filtros.empresa_id,
            sucursal: selectedEmpleado?.sucursal,
            datos_formulario: {
                ...datosForm,
                ...(adjuntoFile ? { adjunto_nombre: adjuntoFile.name, adjunto_tipo: adjuntoFile.type } : {}),
                ...(selectedMotivo.requiere_comite ? { cedula_aprobador: CEDULA_APROBADOR_COMITE, nombre_aprobador: NOMBRE_APROBADOR_COMITE } : {}),
            },
            observaciones,
            requiere_reemplazo: formData.requiere_reemplazo || formData.genera_reemplazo || false,
            empleados_ids: selectedMotivo.permite_seleccion_multiple ? selectedEmpleados : [],
        };

        createMutation.mutate(solicitudData, {
            onSuccess: async (nuevaSolicitud) => {
                // Si requiere comité, buscar aprobador y enviar correo (cédula asignada automáticamente)
                if (selectedMotivo.requiere_comite) {
                    try {
                        const { data: aprobador } = await supabase
                            .from('gen_usuarios')
                            .select('email, primer_nombre, primer_apellido')
                            .eq('identificacion', CEDULA_APROBADOR_COMITE)
                            .eq('activo', true)
                            .single();

                        if (aprobador?.email) {
                            const empleadoNombre = selectedEmpleado
                                ? escapeHtml(`${selectedEmpleado.nombre} ${selectedEmpleado.apellido || ''}`.trim())
                                : 'Empleado';
                            await emailService.sendEmail({
                                to: aprobador.email,
                                from: (import.meta as any).env?.VITE_GMAIL_USER || 'noreply@rhplus.co',
                                subject: `Solicitud de comité: ${selectedMotivo.nombre}`,
                                html: `
                                    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
                                        <h2 style="color:#0e7490">Solicitud requiere su aprobación de comité</h2>
                                        <p>Estimado/a <strong>${escapeHtml(aprobador.primer_nombre)} ${escapeHtml(aprobador.primer_apellido)}</strong>,</p>
                                        <p>Se ha creado una solicitud de novedad que requiere su aprobación:</p>
                                        <table style="border-collapse:collapse;width:100%;margin:16px 0">
                                            <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:600;background:#f9fafb">Motivo</td><td style="padding:8px;border:1px solid #e5e7eb">${escapeHtml(selectedMotivo.nombre)}</td></tr>
                                            <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:600;background:#f9fafb">Empleado</td><td style="padding:8px;border:1px solid #e5e7eb">${empleadoNombre}</td></tr>
                                            ${observaciones ? `<tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:600;background:#f9fafb">Observaciones</td><td style="padding:8px;border:1px solid #e5e7eb">${escapeHtml(observaciones)}</td></tr>` : ''}
                                        </table>
                                        <p>Ingrese al sistema para <strong>aprobar o rechazar</strong> esta solicitud en el módulo de Comité de Aprobación.</p>
                                    </div>
                                `,
                            });
                            toast.info(`Notificación enviada al aprobador ${aprobador.primer_nombre}`);
                        } else {
                            toast.warning('Solicitud creada, pero no se encontró el aprobador con esa cédula');
                        }
                    } catch (_) {
                        toast.warning('Solicitud creada, pero no se pudo enviar el correo al aprobador');
                    }
                }
            },
        });
    };

    const handleViewDetail = async (solicitud: NovedadSolicitud) => {
        const detail = await novedadesService.getSolicitudById(solicitud.id!);
        setSelectedSolicitud(detail || solicitud);
        setShowDetailModal(true);
    };

    const handleViewTimeline = (solicitudId: number) => {
        setTimelineSolicitudId(solicitudId);
        setShowTimelineModal(true);
    };

    const toggleRow = (id: number) => {
        setExpandedRows(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleEmpleadoSelection = (empId: number) => {
        setSelectedEmpleados(prev =>
            prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
        );
    };

    // ============================================================
    // ESTADÍSTICAS
    // ============================================================

    const stats = useMemo(() => {
        const s: Record<string, number> = {};
        solicitudes.forEach(sol => {
            s[sol.estado || 'solicitada'] = (s[sol.estado || 'solicitada'] || 0) + 1;
        });
        return s;
    }, [solicitudes]);

    const chartMotivos = useMemo(() => {
        const m: Record<string, number> = {};
        solicitudes.forEach(s => {
            const nombre = s.motivo?.nombre || 'Sin motivo';
            m[nombre] = (m[nombre] || 0) + 1;
        });
        return Object.entries(m)
            .map(([nombre, total]) => ({ nombre: nombre.length > 14 ? nombre.slice(0, 13) + '…' : nombre, total }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 7);
    }, [solicitudes]);

    const ESTADO_CHART_COLORS: Record<string, string> = {
        solicitada: '#38bdf8',
        en_proceso: '#fb923c',
        aprobado_comite: '#34d399',
        rechazada: '#f87171',
        congelada: '#a78bfa',
        ejecutada: '#6b7280',
        cancelada: '#d1d5db',
    };

    const chartEstados = useMemo(() =>
        Object.entries(stats)
            .filter(([, v]) => v > 0)
            .map(([estado, value]) => ({
                name: ESTADO_LABELS[estado] || estado,
                value,
                color: ESTADO_CHART_COLORS[estado] || '#94a3b8',
            })),
        [stats]
    );

    // ============================================================
    // RENDER
    // ============================================================

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('es-CO', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    return (
        <div className="p-4 max-w-full mx-auto">
            {activeTab !== 'nueva_novedad' && (
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-3xl font-extrabold text-cyan-800 flex items-center gap-2 mb-2">
                        <ClipboardCheck className="w-8 h-8 text-cyan-600" />
                        Gestión de Novedades
                    </h1>
                </div>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                {activeTab !== 'nueva_novedad' && (hasAction('accion-tab-novedades') || hasAction('accion-tab-empleados')) && (
                    <TabsList className={`grid w-full bg-cyan-100/60 p-1 rounded-lg ${hasAction('accion-tab-novedades') && hasAction('accion-tab-empleados') ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        {hasAction('accion-tab-novedades') && (
                            <TabsTrigger
                                value="solicitudes"
                                className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
                            >
                                Listado de Solicitudes
                            </TabsTrigger>
                        )}
                        {hasAction('accion-tab-empleados') && (
                            <TabsTrigger
                                value="empleados"
                                className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
                            >
                                Empleados
                            </TabsTrigger>
                        )}
                    </TabsList>
                )}

                {/* TAB: SOLICITUDES */}
                <TabsContent value="solicitudes" className="mt-6">
                    <div className="bg-white rounded-lg border">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-orange-600" />
                                </div>
                                <span className="text-lg font-semibold text-gray-700">SOLICITUDES</span>
                                <Badge variant="secondary" className="ml-1">{solicitudes.length}</Badge>
                            </div>
                            <div className="flex space-x-2">
                                <Can action="accion-exportar-novedades">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            if (!solicitudes.length) { toast.error('No hay datos para exportar'); return; }
                                            const dataToExport = solicitudes.map(s => ({
                                                ID: s.id,
                                                Empleado: s.empleado ? `${s.empleado.nombre} ${s.empleado.apellido || ''}`.trim() : 'N/A',
                                                Documento: s.empleado?.documento || 'N/A',
                                                Cargo: s.empleado?.cargo || 'N/A',
                                                Motivo: s.motivo?.nombre || 'N/A',
                                                Estado: ESTADO_LABELS[s.estado || 'solicitada'] || s.estado,
                                                'Fecha Solicitud': formatDate(s.created_at),
                                                Sucursal: s.sucursal || 'N/A',
                                                'Creado Por': s.creador ? `${s.creador.primer_nombre} ${s.creador.primer_apellido}`.trim() : 'Sistema',
                                                Observaciones: s.observaciones || '',
                                                'Requiere Reemplazo': s.requiere_reemplazo ? 'Sí' : 'No',
                                            }));
                                            import('@/utils/exportUtils').then(({ exportToExcel }) => {
                                                exportToExcel(dataToExport, `Solicitudes_Novedades_${new Date().toISOString().split('T')[0]}`, 'Solicitudes')
                                                    .then(() => toast.success('Exportación generada exitosamente'))
                                                    .catch(() => toast.error('Error al generar el archivo Excel'));
                                            }).catch(() => toast.error('Error al generar el archivo Excel'));
                                        }}
                                        className="flex items-center gap-2"
                                    >
                                        <Download className="h-4 w-4" />
                                        Exportar
                                    </Button>
                                </Can>
                                <Can action="accion-crear-novedad">
                                    <Button
                                        onClick={goToRegistro}
                                        className="bg-teal-400 hover:bg-teal-500 text-white text-xs px-3 py-1"
                                        size="sm"
                                    >
                                        Adicionar Registro
                                    </Button>
                                </Can>
                            </div>
                        </div>

                        {/* Filtros */}
                        <div className="p-4 border-b bg-gray-50">
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                <Select
                                    value={filtros.motivo_id?.toString() || 'all'}
                                    onValueChange={(v) => setFiltros(prev => ({ ...prev, motivo_id: v === 'all' ? undefined : parseInt(v) }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Motivo de novedad" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos los motivos</SelectItem>
                                        {motivos.map(m => (
                                            <SelectItem key={m.id} value={m.id.toString()}>{m.nombre}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select
                                    value={filtros.sucursal || 'all'}
                                    onValueChange={(v) => setFiltros(prev => ({ ...prev, sucursal: v === 'all' ? undefined : v }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sucursal" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todas las sucursales</SelectItem>
                                        {sucursales.map(s => (
                                            <SelectItem key={s} value={s}>{s}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select
                                    value={filtros.estado || 'all'}
                                    onValueChange={(v) => setFiltros(prev => ({ ...prev, estado: v === 'all' ? undefined : v }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Estado" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos los estados</SelectItem>
                                        {Object.entries(ESTADO_LABELS).map(([key, label]) => (
                                            <SelectItem key={key} value={key}>{label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <div className="relative md:col-span-1">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <Input
                                        placeholder="Buscar empleado..."
                                        value={busquedaEmpleado}
                                        onChange={e => setBusquedaEmpleado(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>

                                <Button
                                    variant="outline"
                                    onClick={() => { setFiltros({}); setBusquedaEmpleado(''); }}
                                    className="flex items-center gap-2"
                                >
                                    <Filter className="w-4 h-4" />
                                    Limpiar filtros
                                </Button>
                            </div>
                        </div>

                        {/* Tabla */}
                        <div className="overflow-x-auto rounded-lg shadow-sm">
                            {solicitudesLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        Cargando solicitudes...
                                    </TableCell>
                                </TableRow>
                            ) : solicitudes.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <div className="p-4 rounded-full bg-gray-50 mb-4">
                                        <FileText className="h-10 w-10 text-gray-300" />
                                    </div>
                                    <p className="text-lg font-semibold text-gray-600">No hay solicitudes</p>
                                    <p className="text-sm text-gray-400 mt-1">Crea una nueva novedad para comenzar</p>
                                    <Can action="accion-crear-novedad">
                                        <Button
                                            size="sm"
                                            onClick={goToRegistro}
                                            className="mt-4 bg-teal-400 hover:bg-teal-500 text-white"
                                        >
                                            Crear primera solicitud
                                        </Button>
                                    </Can>
                                </div>
                            ) : (
                                <Table className="min-w-[900px] w-full text-xs">
                                    <TableHeader className="bg-cyan-50">
                                        <TableRow className="text-left font-semibold text-gray-700">
                                            <TableHead className="px-2 py-1 text-teal-600 w-28">Acciones</TableHead>
                                            <TableHead className="px-4 py-3 w-16">ID</TableHead>
                                            <TableHead className="px-4 py-3 w-1/4">Empleado</TableHead>
                                            <TableHead className="px-4 py-3">Motivo</TableHead>
                                            <TableHead className="px-4 py-3">Estado</TableHead>
                                            <TableHead
                                                className="px-4 py-3 cursor-pointer select-none"
                                                onClick={() => setSortFecha(d => d === 'desc' ? 'asc' : 'desc')}
                                            >
                                                <span className="flex items-center gap-1">
                                                    Fecha
                                                    {sortFecha === 'desc'
                                                        ? <ArrowDown className="h-3 w-3" />
                                                        : <ArrowUp className="h-3 w-3" />
                                                    }
                                                </span>
                                            </TableHead>
                                            <TableHead className="px-4 py-3">Sucursal</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {[...solicitudes].sort((a, b) => {
                                            const ta = new Date(a.created_at || 0).getTime();
                                            const tb = new Date(b.created_at || 0).getTime();
                                            return sortFecha === 'desc' ? tb - ta : ta - tb;
                                        }).map(sol => (
                                            <React.Fragment key={sol.id}>
                                                <TableRow className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleRow(sol.id!)}>
                                                    <TableCell className="px-2 py-1">
                                                        <div className="flex flex-row gap-1 items-center">
                                                            {hasAction('accion-ver-detalle-novedad') && (
                                                                <TooltipProvider>
                                                                    <UITooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                onClick={(e) => { e.stopPropagation(); handleViewDetail(sol); }}
                                                                                className="h-8 w-8"
                                                                            >
                                                                                <Eye className="h-4 w-4 text-cyan-600 hover:text-cyan-800 transition-colors" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent><p>Ver detalle</p></TooltipContent>
                                                                    </UITooltip>
                                                                </TooltipProvider>
                                                            )}
                                                            {hasAction('accion-ver-timeline-novedad') && (
                                                                <TooltipProvider>
                                                                    <UITooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                onClick={(e) => { e.stopPropagation(); handleViewTimeline(sol.id!); }}
                                                                                className="h-8 w-8"
                                                                            >
                                                                                <Clock className="h-4 w-4 text-indigo-600 hover:text-indigo-800 transition-colors" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent><p>Ver timeline</p></TooltipContent>
                                                                    </UITooltip>
                                                                </TooltipProvider>
                                                            )}
                                                            {sol.estado === 'solicitada' && (
                                                                <Can action="accion-cancelar-novedad">
                                                                    <TooltipProvider>
                                                                        <UITooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    onClick={(e) => { e.stopPropagation(); cancelMutation.mutate(sol.id!); }}
                                                                                    className="h-8 w-8"
                                                                                >
                                                                                    <XCircle className="h-4 w-4 text-red-600 hover:text-red-800 transition-colors" />
                                                                                </Button>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent><p>Cancelar</p></TooltipContent>
                                                                        </UITooltip>
                                                                    </TooltipProvider>
                                                                </Can>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3 text-sm text-gray-900 font-mono">#{sol.id}</TableCell>
                                                    <TableCell className="px-4 py-3 text-sm text-gray-900 font-medium">
                                                        {sol.empleado ? `${sol.empleado.nombre} ${sol.empleado.apellido || ''}` : '-'}
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3">
                                                        <Badge variant="outline" className="text-xs font-medium border-gray-200 bg-white">
                                                            {sol.motivo?.nombre || '-'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3">
                                                        <Badge className={`text-xs font-semibold ${ESTADO_COLORS[sol.estado || 'solicitada']}`}>
                                                            {ESTADO_LABELS[sol.estado || 'solicitada']}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3 text-sm text-gray-500">{formatDate(sol.created_at)}</TableCell>
                                                    <TableCell className="px-4 py-3 text-sm text-gray-500">{sol.sucursal || '-'}</TableCell>
                                                </TableRow>
                                                {expandedRows.has(sol.id!) && (
                                                    <TableRow className="bg-gray-50/80">
                                                        <TableCell colSpan={7} className="px-6 py-4">
                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                                                                <div>
                                                                    <span className="text-gray-500 font-medium">Creado por:</span>
                                                                    <p className="mt-0.5">{sol.creador ? `${sol.creador.primer_nombre} ${sol.creador.primer_apellido}` : '-'}</p>
                                                                </div>
                                                                <div>
                                                                    <span className="text-gray-500 font-medium">Reemplazo:</span>
                                                                    <p className="mt-0.5">{sol.requiere_reemplazo ? 'Sí' : 'No'}</p>
                                                                </div>
                                                                <div>
                                                                    <span className="text-gray-500 font-medium">Observaciones:</span>
                                                                    <p className="mt-0.5 line-clamp-2">{sol.observaciones || 'Sin observaciones'}</p>
                                                                </div>
                                                                <Can action="accion-cambiar-estado-novedad">
                                                                    <div className="flex gap-2 flex-wrap">
                                                                        {(TRANSICIONES_VALIDAS[sol.estado || ''] || []).slice(0, 3).map(nextEstado => {
                                                                            const soloViernes = nextEstado === 'aprobado_comite' && !esViernes();
                                                                            return (
                                                                                <Button
                                                                                    key={nextEstado}
                                                                                    variant="outline"
                                                                                    size="sm"
                                                                                    className="text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                                                                                    disabled={soloViernes}
                                                                                    title={soloViernes ? 'La aprobación solo está permitida los viernes' : undefined}
                                                                                    onClick={() => cambiarEstadoMutation.mutate({ id: sol.id!, estado: nextEstado })}
                                                                                >
                                                                                    {ESTADO_LABELS[nextEstado]}
                                                                                </Button>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </Can>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </div>
                    </div>

                    {/* Stats + Gráficas */}
                    {solicitudes.length > 0 && (
                        <div className="mt-4 space-y-4">
                            <div className="grid grid-cols-5 divide-x divide-gray-100 bg-white border border-gray-100 rounded-xl overflow-hidden">
                                {[
                                    { label: 'Total', value: solicitudes.length, color: 'text-gray-900' },
                                    { label: 'Solicitadas', value: stats.solicitada || 0, color: 'text-sky-600' },
                                    { label: 'En proceso', value: stats.en_proceso || 0, color: 'text-amber-600' },
                                    { label: 'Aprobadas', value: stats.aprobado_comite || 0, color: 'text-emerald-600' },
                                    { label: 'Rechazadas', value: stats.rechazada || 0, color: 'text-rose-500' },
                                ].map(stat => (
                                    <div key={stat.label} className="flex flex-col items-center justify-center py-5">
                                        <span className={`text-3xl font-bold ${stat.color}`}>{stat.value}</span>
                                        <span className="text-xs text-gray-400 mt-1">{stat.label}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white border border-gray-100 rounded-xl p-4">
                                    <p className="text-sm font-medium text-gray-700 mb-3">Solicitudes por motivo</p>
                                    <ResponsiveContainer width="100%" height={180}>
                                        <BarChart data={chartMotivos} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                            <XAxis dataKey="nombre" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #f3f4f6', boxShadow: '0 2px 8px #0001' }} cursor={{ fill: '#f9fafb' }} />
                                            <Bar dataKey="total" fill="#38bdf8" radius={[4, 4, 0, 0]} maxBarSize={32} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="bg-white border border-gray-100 rounded-xl p-4">
                                    <p className="text-sm font-medium text-gray-700 mb-3">Distribución por estado</p>
                                    <ResponsiveContainer width="100%" height={180}>
                                        <PieChart>
                                            <Pie data={chartEstados} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value">
                                                {chartEstados.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                            </Pie>
                                            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #f3f4f6', boxShadow: '0 2px 8px #0001' }} />
                                            <Legend iconType="circle" iconSize={8} formatter={(value) => <span style={{ fontSize: 11, color: '#6b7280' }}>{value}</span>} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}
                </TabsContent>

                {/* TAB: NUEVA NOVEDAD */}
                <TabsContent value="nueva_novedad" className="mt-6">
                    <div className="bg-white rounded-lg border">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b">
                            <div className="flex items-center space-x-3">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={resetForm}
                                    className="h-8 w-8 rounded-full hover:bg-cyan-100"
                                >
                                    <ArrowLeft className="h-5 w-5 text-cyan-700" />
                                </Button>
                                <div className="w-8 h-8 bg-cyan-100 rounded flex items-center justify-center">
                                    <ClipboardCheck className="w-5 h-5 text-cyan-600" />
                                </div>
                                <span className="text-lg font-semibold text-gray-700">NUEVA SOLICITUD DE NOVEDAD</span>
                            </div>
                        </div>

                        {/* Paso 1: Motivo — siempre visible */}
                        <div className="p-4 border-b bg-gray-50">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Motivo de Novedad *</Label>
                                    <Select
                                        value={selectedMotivo?.id?.toString() || ''}
                                        onValueChange={(v) => {
                                            const motivo = motivos.find(m => m.id === parseInt(v)) || null;
                                            setSelectedMotivo(motivo);
                                            setFormData(buildDefaultFormData(motivo));
                                            setSelectedEmpleado(null);
                                            setSelectedEmpleados([]);
                                        }}
                                    >
                                        <SelectTrigger className="mt-1.5 bg-white">
                                            <SelectValue placeholder="Seleccionar motivo..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {motivos.map(m => (
                                                <SelectItem key={m.id} value={m.id.toString()}>
                                                    {m.nombre}
                                                    {m.requiere_comite && ' (Requiere Comité)'}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {selectedMotivo?.requiere_comite && (
                                        <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" />
                                            Esta novedad requiere evaluación del comité
                                        </p>
                                    )}
                                </div>

                                {selectedMotivo && (
                                    <div>
                                        <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            {selectedMotivo.permite_seleccion_multiple ? 'Empleados *' : 'Empleado *'}
                                        </Label>
                                        {selectedMotivo.permite_seleccion_multiple ? (
                                            <div className="mt-1.5 border rounded-md max-h-40 overflow-y-auto p-2 space-y-1 bg-white">
                                                {empleados.map(emp => (
                                                    <label key={emp.id} className="flex items-center gap-2 py-1 px-2 rounded hover:bg-gray-50 cursor-pointer text-sm">
                                                        <Checkbox
                                                            checked={selectedEmpleados.includes(emp.id!)}
                                                            onCheckedChange={() => toggleEmpleadoSelection(emp.id!)}
                                                        />
                                                        {emp.nombre} {emp.apellido} — {emp.cargo || 'Sin cargo'}
                                                    </label>
                                                ))}
                                                {empleados.length === 0 && <p className="text-xs text-gray-400 py-2">No hay empleados disponibles</p>}
                                            </div>
                                        ) : (
                                            <Select
                                                value={selectedEmpleado?.id?.toString() || ''}
                                                onValueChange={(v) => {
                                                    const emp = empleados.find(e => e.id === parseInt(v));
                                                    setSelectedEmpleado(emp || null);
                                                }}
                                            >
                                                <SelectTrigger className="mt-1.5 bg-white">
                                                    <SelectValue placeholder="Seleccionar empleado..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {empleados.map(emp => (
                                                        <SelectItem key={emp.id} value={emp.id!.toString()}>
                                                            {emp.nombre} {emp.apellido} — {emp.cargo || 'Sin cargo'}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Paso 2: Formulario dinámico — solo cuando hay motivo + empleado */}
                        {selectedMotivo && (selectedEmpleado || selectedEmpleados.length > 0) && (
                            <div className="p-5 space-y-5">
                                {/* Sección: Datos del motivo */}
                                {(FORM_FIELDS_BY_MOTIVO[selectedMotivo.codigo] || []).length > 0 && (
                                    <div className="rounded-lg border border-gray-200 overflow-hidden">
                                        <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
                                            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                Datos de {selectedMotivo.nombre}
                                            </span>
                                        </div>
                                        <div className="p-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 items-start">
                                                {(FORM_FIELDS_BY_MOTIVO[selectedMotivo.codigo] || []).map(field => (
                                                    <div key={field.name} style={{
                                                        ...(field.colStart ? { gridColumnStart: field.colStart } : {}),
                                                        ...(field.rowStart ? { gridRowStart: field.rowStart } : {}),
                                                        ...(field.rowSpan ? { gridRowEnd: `span 2` } : {}),
                                                    }} className={[
                                                        field.rowSpan ? 'flex flex-col' : '',
                                                        !field.rowSpan && field.type === 'textarea' && !field.colStart ? 'md:col-span-2' : '',
                                                    ].join(' ').trim()}>
                                                        <Label className="text-xs font-medium text-gray-600">
                                                            {field.label} {field.required && <span className="text-red-500">*</span>}
                                                        </Label>
                                                        {field.type === 'text' && (
                                                            <Input
                                                                value={formData[field.name] || ''}
                                                                onChange={e => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                                                                className="mt-1"
                                                                placeholder={field.label}
                                                            />
                                                        )}
                                                        {field.type === 'number' && (
                                                            <Input
                                                                type="number"
                                                                value={formData[field.name] || ''}
                                                                onChange={e => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                                                                className="mt-1"
                                                                placeholder="0"
                                                            />
                                                        )}
                                                        {field.type === 'date' && (
                                                            <Input
                                                                type="date"
                                                                value={formData[field.name] || ''}
                                                                onChange={e => !field.defaultToday && setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                                                                className={`mt-1 ${field.defaultToday ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                                                                readOnly={field.defaultToday}
                                                            />
                                                        )}
                                                        {field.type === 'textarea' && (
                                                            <Textarea
                                                                value={formData[field.name] || ''}
                                                                onChange={e => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                                                                className={field.rowSpan ? 'mt-1 flex-1 min-h-[100px]' : 'mt-1'}
                                                                rows={field.rowSpan ? undefined : 3}
                                                                placeholder={field.label}
                                                            />
                                                        )}
                                                        {field.type === 'select' && (
                                                            <Select
                                                                value={formData[field.name] || ''}
                                                                onValueChange={v => setFormData(prev => ({ ...prev, [field.name]: v }))}
                                                            >
                                                                <SelectTrigger className="mt-1">
                                                                    <SelectValue placeholder={`Seleccionar...`} />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {(field.options || []).map(opt => (
                                                                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        )}
                                                        {field.type === 'jornada-select' && (
                                                            <Select
                                                                value={formData[field.name] || ''}
                                                                onValueChange={v => setFormData(prev => ({ ...prev, [field.name]: v }))}
                                                            >
                                                                <SelectTrigger className="mt-1">
                                                                    <SelectValue placeholder="Seleccionar jornada..." />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {jornadasLaborales.length === 0 ? (
                                                                        <SelectItem value="__none__" disabled>Sin jornadas registradas</SelectItem>
                                                                    ) : jornadasLaborales.map(j => (
                                                                        <SelectItem key={j.id} value={String(j.id)}>
                                                                            {j.nombre_jornada} — {j.horas_laborales}h
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        )}
                                                        {field.type === 'checkbox' && (
                                                            <div className="flex items-center gap-2 mt-2 rounded-md border p-3">
                                                                <Checkbox
                                                                    checked={!!formData[field.name]}
                                                                    onCheckedChange={checked => setFormData(prev => ({ ...prev, [field.name]: checked }))}
                                                                />
                                                                <span className="text-sm text-gray-700">{field.label}</span>
                                                            </div>
                                                        )}
                                                        {field.type === 'file' && (
                                                            <div className="mt-1 flex flex-col gap-2">
                                                                <label className="flex items-center justify-center gap-2 cursor-pointer border-2 border-dashed border-gray-200 hover:border-cyan-400 rounded-lg px-3 py-2.5 transition-colors bg-gray-50 hover:bg-cyan-50">
                                                                    <FileText className="h-4 w-4 text-gray-400" />
                                                                    <span className="text-xs text-gray-500">Seleccionar {field.multiple ? 'archivos' : 'archivo'}</span>
                                                                    <Input
                                                                        type="file"
                                                                        multiple={field.multiple}
                                                                        className="hidden"
                                                                        onChange={e => {
                                                                            const files = Array.from(e.target.files || []).map(f => f.name);
                                                                            if (files.length) setFormData(prev => ({
                                                                                ...prev,
                                                                                [field.name]: field.multiple
                                                                                    ? [...(Array.isArray(prev[field.name]) ? prev[field.name] : []), ...files]
                                                                                    : files[0],
                                                                            }));
                                                                        }}
                                                                    />
                                                                </label>
                                                                {Array.isArray(formData[field.name]) && (formData[field.name] as string[]).length > 0 && (
                                                                    <div className="border border-gray-100 rounded-lg bg-white divide-y divide-gray-50">
                                                                        {(formData[field.name] as string[]).map((name, i) => (
                                                                            <div key={i} className="flex items-center justify-between px-3 py-1.5 gap-2">
                                                                                <div className="flex items-center gap-2 min-w-0">
                                                                                    <FileText className="h-3.5 w-3.5 text-cyan-500 flex-shrink-0" />
                                                                                    <span className="text-xs text-gray-600 truncate">{name}</span>
                                                                                </div>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => setFormData(prev => ({
                                                                                        ...prev,
                                                                                        [field.name]: (prev[field.name] as string[]).filter((_, j) => j !== i),
                                                                                    }))}
                                                                                    className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 text-base leading-none"
                                                                                >
                                                                                    ×
                                                                                </button>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                        {field.helperText && (
                                                            <p className="text-xs text-gray-400 mt-1">{field.helperText}</p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Sección: Observaciones */}
                                <div className="rounded-lg border border-gray-200 overflow-hidden">
                                    <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
                                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Observaciones {selectedMotivo.requiere_observacion && <span className="text-red-500">*</span>}
                                        </span>
                                    </div>
                                    <div className="p-4">
                                        <Textarea
                                            value={observaciones}
                                            onChange={e => setObservaciones(e.target.value)}
                                            className={selectedMotivo.requiere_observacion ? 'border-amber-300 focus:border-amber-500' : ''}
                                            placeholder={selectedMotivo.requiere_observacion
                                                ? 'Observaciones obligatorias para este motivo...'
                                                : 'Comentarios adicionales (opcional)...'}
                                            rows={3}
                                        />
                                    </div>
                                </div>

                                {/* Sección: Adjunto */}
                                {selectedMotivo.requiere_adjunto && (
                                    <div className="rounded-lg border border-gray-200 overflow-hidden">
                                        <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
                                            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                Documento adjunto{' '}
                                                {selectedMotivo.adjunto_obligatorio
                                                    ? <span className="text-red-500">* (obligatorio)</span>
                                                    : <span className="text-gray-400">(opcional)</span>}
                                            </span>
                                        </div>
                                        <div className="p-4">
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="file"
                                                    className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100 border rounded-md p-1.5 cursor-pointer"
                                                    onChange={e => setAdjuntoFile(e.target.files?.[0] ?? null)}
                                                />
                                                {adjuntoFile && (
                                                    <span className="text-xs text-green-600 flex items-center gap-1 shrink-0">
                                                        <CheckCircle className="w-3.5 h-3.5" />
                                                        {adjuntoFile.name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Sección: Comité */}
                                {selectedMotivo.requiere_comite && (
                                    <div className="rounded-lg border border-amber-200 bg-amber-50/50 overflow-hidden">
                                        <div className="bg-amber-100/60 px-4 py-2.5 border-b border-amber-200 flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4 text-amber-600" />
                                            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                                                Aprobación de Comité
                                            </span>
                                        </div>
                                        <div className="p-4 space-y-3">
                                            <p className="text-sm text-amber-700">
                                                Al guardar se creará la solicitud y se enviará una notificación por correo electrónico al aprobador para que gestione su aprobación.
                                            </p>
                                            <div>
                                                <Label className="text-xs font-medium text-amber-800">
                                                    Cédula de la persona aprobadora <span className="text-red-500">*</span>
                                                </Label>
                                                <Input
                                                    type="text"
                                                    value={cedulaAprobador}
                                                    onChange={e => setCedulaAprobador(e.target.value)}
                                                    placeholder="Número de identificación del aprobador"
                                                    className="mt-1 border-amber-300 focus-visible:ring-amber-400 bg-white"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Botones */}
                                <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                                    <Button variant="outline" onClick={resetForm}>
                                        Cancelar
                                    </Button>
                                    <Button
                                        onClick={handleSubmitForm}
                                        disabled={createMutation.isPending || !selectedMotivo}
                                        className="bg-cyan-600 hover:bg-cyan-700 text-white"
                                    >
                                        {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        {selectedMotivo?.requiere_comite ? 'Enviar a Comité' : 'Guardar'}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* TAB: EMPLEADOS */}
                <TabsContent value="empleados" className="mt-6">
                    <div className="bg-white rounded-lg border">
                        <div className="flex items-center justify-between p-4 border-b">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-violet-100 rounded flex items-center justify-center">
                                    <Users className="w-5 h-5 text-violet-600" />
                                </div>
                                <span className="text-lg font-semibold text-gray-700">EMPLEADOS</span>
                                <Badge variant="secondary" className="ml-1">{empleados.length}</Badge>
                            </div>
                        </div>

                        <div className="p-4 border-b bg-gray-50">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="relative md:col-span-2">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <Input
                                        placeholder="Buscar por nombre o cargo..."
                                        value={busquedaEmpleado}
                                        onChange={e => setBusquedaEmpleado(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={() => setBusquedaEmpleado('')}
                                    className="flex items-center gap-2"
                                >
                                    <Filter className="w-4 h-4" />
                                    Limpiar filtros
                                </Button>
                            </div>
                        </div>

                        <div className="overflow-x-auto rounded-lg shadow-sm">
                            {empleadosLoading ? (
                                <div className="flex items-center justify-center py-20">
                                    <span className="text-sm text-gray-500">Cargando empleados...</span>
                                </div>
                            ) : empleados.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <div className="p-4 rounded-full bg-gray-50 mb-4">
                                        <Users className="h-10 w-10 text-gray-300" />
                                    </div>
                                    <p className="text-lg font-semibold text-gray-600">No hay empleados registrados</p>
                                    <p className="text-sm text-gray-400 mt-1">Los empleados aparecerán aquí cuando se registren</p>
                                </div>
                            ) : (
                                <Table className="min-w-[800px] w-full text-xs">
                                    <TableHeader className="bg-cyan-50">
                                        <TableRow className="text-left font-semibold text-gray-700">
                                            <TableHead className="px-4 py-3">Nombre</TableHead>
                                            <TableHead className="px-4 py-3">Cargo</TableHead>
                                            <TableHead className="px-4 py-3">Empresa</TableHead>
                                            <TableHead className="px-4 py-3">Sucursal</TableHead>
                                            <TableHead className="px-4 py-3">Fecha Ingreso</TableHead>
                                            <TableHead className="px-4 py-3">Estado</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {empleados.map(emp => (
                                            <TableRow key={emp.id} className="hover:bg-gray-50">
                                                <TableCell className="px-4 py-3 text-sm text-gray-900 font-medium">
                                                    {emp.nombre} {emp.apellido || ''}
                                                </TableCell>
                                                <TableCell className="px-4 py-3 text-sm text-gray-600">{emp.cargo || '-'}</TableCell>
                                                <TableCell className="px-4 py-3 text-sm text-gray-600">{emp.empresa?.razon_social || '-'}</TableCell>
                                                <TableCell className="px-4 py-3 text-sm text-gray-500">{emp.sucursal || '-'}</TableCell>
                                                <TableCell className="px-4 py-3 text-sm text-gray-500">{formatDate(emp.fecha_ingreso)}</TableCell>
                                                <TableCell className="px-4 py-3">
                                                    <Badge variant="default" className="bg-brand-lime/10 text-brand-lime border-brand-lime/20">
                                                        {emp.estado || 'Activo'}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </div>
                    </div>
                </TabsContent>

        </Tabs>

            {/* ================================================================ */}
            {/* MODAL: Detalle de Solicitud */}
            {/* ================================================================ */}
            <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm">
                                <Eye className="h-4 w-4 text-white" />
                            </div>
                            <div>
                                <span className="text-lg">Detalle de Solicitud</span>
                                <p className="text-xs font-normal text-gray-500 mt-0.5">Solicitud #{selectedSolicitud?.id}</p>
                            </div>
                        </DialogTitle>
                    </DialogHeader>
                    {selectedSolicitud && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs text-gray-500">Empleado</Label>
                                    <p className="font-medium text-sm">
                                        {selectedSolicitud.empleado
                                            ? `${selectedSolicitud.empleado.nombre} ${selectedSolicitud.empleado.apellido || ''}`
                                            : '-'}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-xs text-gray-500">Motivo</Label>
                                    <p className="font-medium text-sm">{selectedSolicitud.motivo?.nombre || '-'}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-gray-500">Estado</Label>
                                    <Badge className={`text-xs ${ESTADO_COLORS[selectedSolicitud.estado || 'solicitada']}`}>
                                        {ESTADO_LABELS[selectedSolicitud.estado || 'solicitada']}
                                    </Badge>
                                </div>
                                <div>
                                    <Label className="text-xs text-gray-500">Fecha de Creación</Label>
                                    <p className="text-sm">{formatDate(selectedSolicitud.created_at)}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-gray-500">Sucursal</Label>
                                    <p className="text-sm">{selectedSolicitud.sucursal || '-'}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-gray-500">Requiere Reemplazo</Label>
                                    <p className="text-sm">{selectedSolicitud.requiere_reemplazo ? 'Sí' : 'No'}</p>
                                </div>
                            </div>

                            {/* Datos del formulario */}
                            {selectedSolicitud.datos_formulario && Object.keys(selectedSolicitud.datos_formulario).length > 0 && (
                                <>
                                    <Separator />
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Datos del Formulario</h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            {Object.entries(selectedSolicitud.datos_formulario).map(([key, value]) => (
                                                <div key={key}>
                                                    <Label className="text-xs text-gray-500 capitalize">{key.replace(/_/g, ' ')}</Label>
                                                    <p className="text-sm">{typeof value === 'boolean' ? (value ? 'Sí' : 'No') : String(value || '-')}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            {selectedSolicitud.observaciones && (
                                <>
                                    <Separator />
                                    <div>
                                        <Label className="text-xs text-gray-500">Observaciones</Label>
                                        <p className="text-sm mt-1">{selectedSolicitud.observaciones}</p>
                                    </div>
                                </>
                            )}

                            {/* Botones de acción según estado */}
                            <Separator />
                            <div className="flex flex-wrap gap-2">
                                {(TRANSICIONES_VALIDAS[selectedSolicitud.estado || ''] || []).map(nextEstado => {
                                    const soloViernes = nextEstado === 'aprobado_comite' && !esViernes();
                                    return (
                                        <Button
                                            key={nextEstado}
                                            variant="outline"
                                            size="sm"
                                            className="text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                                            disabled={soloViernes}
                                            title={soloViernes ? 'La aprobación solo está permitida los viernes' : undefined}
                                            onClick={() => {
                                                cambiarEstadoMutation.mutate({ id: selectedSolicitud.id!, estado: nextEstado });
                                                setShowDetailModal(false);
                                            }}
                                        >
                                            {nextEstado === 'rechazada' && <XCircle className="h-3 w-3 mr-1 text-red-500" />}
                                            {nextEstado === 'aprobado_comite' && <CheckCircle className="h-3 w-3 mr-1 text-green-500" />}
                                            {nextEstado === 'congelada' && <Pause className="h-3 w-3 mr-1 text-gray-500" />}
                                            {ESTADO_LABELS[nextEstado]}
                                        </Button>
                                    );
                                })}
                                <Button variant="ghost" size="sm" onClick={() => handleViewTimeline(selectedSolicitud.id!)}>
                                    <Clock className="h-3 w-3 mr-1" /> Ver Timeline
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* ================================================================ */}
            {/* MODAL: Timeline */}
            {/* ================================================================ */}
            <Dialog open={showTimelineModal} onOpenChange={(open) => { setShowTimelineModal(open); if (!open) setTimelineSolicitudId(null); }}>
                <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-sm">
                                <Clock className="h-4 w-4 text-white" />
                            </div>
                            <div>
                                <span className="text-lg">Timeline</span>
                                <p className="text-xs font-normal text-gray-500 mt-0.5">Historial de solicitud #{timelineSolicitudId}</p>
                            </div>
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-0">
                        {timeline.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <div className="p-3 rounded-full bg-gray-50 mb-3">
                                    <Clock className="h-8 w-8 text-gray-300" />
                                </div>
                                <p className="text-sm font-medium text-gray-500">No hay registros en el timeline</p>
                            </div>
                        ) : (
                            <div className="relative pl-6 space-y-4">
                                <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gradient-to-b from-indigo-300 via-purple-300 to-gray-200"></div>
                                {timeline.map((log, index) => (
                                    <div key={log.id || index} className="relative">
                                        <div className={`absolute -left-4 top-1 w-3 h-3 rounded-full border-2 border-white shadow ${index === 0 ? 'bg-gradient-to-br from-indigo-500 to-purple-500' : 'bg-gray-300'}`}></div>
                                        <div className={`rounded-lg p-3 ${index === 0 ? 'bg-indigo-50/50 border border-indigo-100' : 'bg-gray-50'}`}>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium capitalize">{log.accion?.replace(/_/g, ' ')}</span>
                                                <span className="text-xs text-gray-400">
                                                    {log.fecha_accion ? new Date(log.fecha_accion).toLocaleString('es-CO') : '-'}
                                                </span>
                                            </div>
                                            {log.estado_anterior && log.estado_nuevo && (
                                                <div className="flex items-center gap-2 mt-1 text-xs">
                                                    <Badge variant="outline" className="text-[10px]">{ESTADO_LABELS[log.estado_anterior] || log.estado_anterior}</Badge>
                                                    <span>→</span>
                                                    <Badge className={`text-[10px] ${ESTADO_COLORS[log.estado_nuevo]}`}>{ESTADO_LABELS[log.estado_nuevo] || log.estado_nuevo}</Badge>
                                                </div>
                                            )}
                                            {log.observacion && <p className="text-xs text-gray-500 mt-1">{log.observacion}</p>}
                                            {log.usuario && (
                                                <p className="text-xs text-gray-400 mt-1">
                                                    Por: {log.usuario.primer_nombre} {log.usuario.primer_apellido}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default NovedadesPage;

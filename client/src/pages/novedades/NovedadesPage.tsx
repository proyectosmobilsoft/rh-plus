import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
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
    Users,
    FileText,
    Clock,
    Eye,
    Edit,
    XCircle,
    CheckCircle,
    Pause,
    Play,
    Loader2,
    Calendar,
    Building,
    MapPin,
    ChevronDown,
    ChevronUp,
    AlertCircle,
    Upload,
    TrendingUp,
    Send,
    RotateCcw,
    ThumbsUp,
    ThumbsDown,
    Sparkles,
    UserPlus,
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

// ============================================================
// TIPOS DE FORMULARIO POR MOTIVO
// ============================================================

const FORM_FIELDS_BY_MOTIVO: Record<string, { label: string; name: string; type: string; required?: boolean; options?: string[]; helperText?: string }[]> = {
    incapacidades: [
        { label: 'Fecha de inicio', name: 'fecha_inicio', type: 'date', required: true },
        { label: 'Fecha final', name: 'fecha_fin', type: 'date', required: true },
        { label: 'Motivo de incapacidad', name: 'motivo_incapacidad', type: 'textarea', required: true },
    ],
    retiros: [
        { label: 'Fecha de retiro', name: 'fecha_retiro', type: 'date', required: true },
        { label: 'Fecha de solicitud', name: 'fecha_solicitud', type: 'date', required: true },
        { label: 'Motivo del retiro', name: 'motivo_retiro', type: 'textarea', required: true },
        { label: '¿Requiere reemplazo?', name: 'requiere_reemplazo', type: 'checkbox' },
        { label: 'Documento de soporte', name: 'documento_soporte', type: 'file' },
    ],
    aumento_plaza: [
        { label: 'Cargo', name: 'cargo', type: 'text', required: true },
        { label: 'Salario', name: 'salario', type: 'number', required: true },
        { label: 'Auxilio no prestacional', name: 'auxilio', type: 'number' },
        { label: 'Horas laborales', name: 'horas', type: 'number', required: true },
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
        { label: 'Fecha de renuncia', name: 'fecha_renuncia', type: 'date', required: true },
        { label: 'Último día de trabajo', name: 'fecha_finalizacion', type: 'date', required: true },
        { label: 'Motivo de la renuncia', name: 'motivo_renuncia', type: 'textarea', required: true },
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

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

const NovedadesPage: React.FC = () => {
    const queryClient = useQueryClient();

    // Estado de filtros
    const [filtros, setFiltros] = useState<NovedadFiltros>({});
    const [busquedaEmpleado, setBusquedaEmpleado] = useState('');
    const [activeTab, setActiveTab] = useState('solicitudes');

    // Modal de nueva solicitud
    const [showFormModal, setShowFormModal] = useState(false);
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

    // Expanded rows
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

    // ============================================================
    // QUERIES
    // ============================================================

    const { data: motivos = [], isLoading: motivosLoading } = useQuery<NovedadMotivo[]>({
        queryKey: ['novedades-motivos'],
        queryFn: () => novedadesService.getMotivos(),
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
        onError: () => toast.error('Error al cambiar el estado'),
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

    const resetForm = () => {
        setShowFormModal(false);
        setSelectedMotivo(null);
        setSelectedEmpleado(null);
        setFormData({});
        setObservaciones('');
        setSelectedEmpleados([]);
    };

    const handleSubmitForm = () => {
        if (!selectedMotivo) {
            toast.error('Selecciona un motivo de novedad');
            return;
        }

        // Validar campos requeridos
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

        const solicitudData = {
            motivo_id: selectedMotivo.id,
            empleado_id: selectedEmpleado?.id,
            empresa_id: selectedEmpleado?.empresa_id || filtros.empresa_id,
            sucursal: selectedEmpleado?.sucursal,
            datos_formulario: formData,
            observaciones,
            requiere_reemplazo: formData.requiere_reemplazo || formData.genera_reemplazo || false,
            empleados_ids: selectedMotivo.permite_seleccion_multiple ? selectedEmpleados : [],
        };

        createMutation.mutate(solicitudData);
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
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 shadow-lg shadow-cyan-500/25">
                            <ClipboardCheck className="h-7 w-7 text-white" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Solicitud de Novedades</h1>
                        <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
                            <Sparkles className="h-3.5 w-3.5 text-cyan-500" />
                            Gestión de novedades de recurso humano
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            if (!solicitudes.length) {
                                toast.error('No hay datos para exportar');
                                return;
                            }

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
                                'Requiere Reemplazo': s.requiere_reemplazo ? 'Sí' : 'No'
                            }));

                            import('@/utils/exportUtils').then(({ exportToExcel }) => {
                                exportToExcel(dataToExport, `Solicitudes_Novedades_${new Date().toISOString().split('T')[0]}`, 'Solicitudes');
                                toast.success('Exportación generada exitosamente');
                            }).catch(err => {
                                console.error('Error al exportar:', err);
                                toast.error('Error al generar el archivo Excel');
                            });
                        }}
                        className="gap-2 border-gray-200 hover:border-cyan-300 hover:bg-cyan-50 transition-all duration-200"
                    >
                        <Download className="h-4 w-4" />
                        Exportar
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => setShowFormModal(true)}
                        className="gap-2 bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 text-white shadow-md shadow-cyan-500/20 hover:shadow-lg hover:shadow-cyan-500/30 transition-all duration-200"
                    >
                        <Plus className="h-4 w-4" />
                        Nueva Novedad
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                    { label: 'Total', value: solicitudes.length, icon: TrendingUp, gradient: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50', shadow: 'shadow-blue-500/15' },
                    { label: 'Solicitadas', value: stats.solicitada || 0, icon: Send, gradient: 'from-sky-500 to-cyan-600', bg: 'bg-sky-50', shadow: 'shadow-sky-500/15' },
                    { label: 'En Proceso', value: stats.en_proceso || 0, icon: RotateCcw, gradient: 'from-amber-500 to-orange-600', bg: 'bg-amber-50', shadow: 'shadow-amber-500/15' },
                    { label: 'Aprobadas', value: stats.aprobado_comite || 0, icon: ThumbsUp, gradient: 'from-emerald-500 to-green-600', bg: 'bg-emerald-50', shadow: 'shadow-emerald-500/15' },
                    { label: 'Rechazadas', value: stats.rechazada || 0, icon: ThumbsDown, gradient: 'from-rose-500 to-red-600', bg: 'bg-rose-50', shadow: 'shadow-rose-500/15' },
                ].map(stat => (
                    <Card key={stat.label} className={`border-0 ${stat.bg} shadow-md ${stat.shadow} hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 overflow-hidden relative group`}>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-3xl font-extrabold tracking-tight text-gray-800">{stat.value}</p>
                                    <p className="text-xs font-semibold text-gray-500 mt-0.5 uppercase tracking-wider">{stat.label}</p>
                                </div>
                                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                                    <stat.icon className="h-5 w-5 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Filtros */}
            <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
                <CardContent className="p-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">
                            <Filter className="h-3.5 w-3.5" />
                            Filtros
                        </div>
                        <Select
                            value={filtros.motivo_id?.toString() || 'all'}
                            onValueChange={(v) => setFiltros(prev => ({ ...prev, motivo_id: v === 'all' ? undefined : parseInt(v) }))}
                        >
                            <SelectTrigger className="w-48 border-gray-200 hover:border-cyan-300 transition-colors">
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
                            <SelectTrigger className="w-44 border-gray-200 hover:border-cyan-300 transition-colors">
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
                            <SelectTrigger className="w-44 border-gray-200 hover:border-cyan-300 transition-colors">
                                <SelectValue placeholder="Estado" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los estados</SelectItem>
                                {Object.entries(ESTADO_LABELS).map(([key, label]) => (
                                    <SelectItem key={key} value={key}>{label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {Object.values(filtros).some(v => v !== undefined) && (
                            <Button variant="ghost" size="sm" onClick={() => setFiltros({})} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                                <XCircle className="h-3.5 w-3.5 mr-1" />
                                Limpiar
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Tabs: Solicitudes / Empleados */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="bg-gray-100/80 p-1 h-auto">
                    <TabsTrigger value="solicitudes" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-cyan-700 py-2.5 px-4 transition-all duration-200">
                        <FileText className="h-4 w-4" />
                        Solicitudes
                        <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px] font-bold">{solicitudes.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="empleados" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-cyan-700 py-2.5 px-4 transition-all duration-200">
                        <Users className="h-4 w-4" />
                        Empleados
                        <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px] font-bold">{empleados.length}</Badge>
                    </TabsTrigger>
                </TabsList>

                {/* TAB: SOLICITUDES */}
                <TabsContent value="solicitudes">
                    <Card className="border-0 shadow-sm">
                        <CardContent className="p-0">
                            {solicitudesLoading ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <div className="relative">
                                        <div className="h-12 w-12 rounded-full border-4 border-gray-100" />
                                        <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-transparent border-t-cyan-500 animate-spin" />
                                    </div>
                                    <span className="mt-4 text-sm text-gray-500 font-medium">Cargando solicitudes...</span>
                                </div>
                            ) : solicitudes.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <div className="p-4 rounded-full bg-gray-50 mb-4">
                                        <FileText className="h-10 w-10 text-gray-300" />
                                    </div>
                                    <p className="text-lg font-semibold text-gray-600">No hay solicitudes</p>
                                    <p className="text-sm text-gray-400 mt-1">Crea una nueva novedad para comenzar</p>
                                    <Button
                                        size="sm"
                                        onClick={() => setShowFormModal(true)}
                                        className="mt-4 gap-2 bg-gradient-to-r from-cyan-500 to-teal-600 text-white shadow-sm"
                                    >
                                        <Plus className="h-4 w-4" /> Crear primera solicitud
                                    </Button>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100/80 border-b border-gray-200">
                                            <tr>
                                                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                                                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Empleado</th>
                                                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Motivo</th>
                                                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                                                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                                                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sucursal</th>
                                                <th className="px-4 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {solicitudes.map(sol => (
                                                <React.Fragment key={sol.id}>
                                                    <tr
                                                        className="border-b border-gray-100 hover:bg-cyan-50/30 cursor-pointer transition-all duration-150 group"
                                                        onClick={() => toggleRow(sol.id!)}
                                                    >
                                                        <td className="px-4 py-3.5">
                                                            <span className="inline-flex items-center justify-center h-6 w-10 rounded-md bg-gray-100 font-mono text-[11px] font-semibold text-gray-500 group-hover:bg-cyan-100 group-hover:text-cyan-700 transition-colors">#{sol.id}</span>
                                                        </td>
                                                        <td className="px-4 py-3.5">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                                                    {sol.empleado ? sol.empleado.nombre.charAt(0).toUpperCase() : '?'}
                                                                </div>
                                                                <span className="font-medium text-gray-800">{sol.empleado ? `${sol.empleado.nombre} ${sol.empleado.apellido || ''}` : '-'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3.5">
                                                            <Badge variant="outline" className="text-xs font-medium border-gray-200 bg-white">
                                                                {sol.motivo?.nombre || '-'}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-4 py-3.5">
                                                            <Badge className={`text-xs font-semibold ${ESTADO_COLORS[sol.estado || 'solicitada']}`}>
                                                                {ESTADO_LABELS[sol.estado || 'solicitada']}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-4 py-3.5 text-gray-500 text-xs font-medium">{formatDate(sol.created_at)}</td>
                                                        <td className="px-4 py-3.5 text-gray-500 text-xs">{sol.sucursal || '-'}</td>
                                                        <td className="px-4 py-3.5 text-right">
                                                            <div className="flex items-center justify-end gap-0.5">
                                                                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleViewDetail(sol); }}
                                                                    title="Ver detalle"
                                                                    className="text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 transition-colors h-8 w-8 p-0"
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleViewTimeline(sol.id!); }}
                                                                    title="Ver timeline"
                                                                    className="text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors h-8 w-8 p-0"
                                                                >
                                                                    <Clock className="h-4 w-4" />
                                                                </Button>
                                                                {sol.estado === 'solicitada' && (
                                                                    <Button variant="ghost" size="sm"
                                                                        onClick={(e) => { e.stopPropagation(); cancelMutation.mutate(sol.id!); }}
                                                                        title="Cancelar"
                                                                        className="text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors h-8 w-8 p-0"
                                                                    >
                                                                        <XCircle className="h-4 w-4" />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    {/* Row expansion */}
                                                    {expandedRows.has(sol.id!) && (
                                                        <tr className="bg-gray-50/80">
                                                            <td colSpan={7} className="px-6 py-4">
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
                                                                    <div className="flex gap-2">
                                                                        {(TRANSICIONES_VALIDAS[sol.estado || ''] || []).slice(0, 3).map(nextEstado => (
                                                                            <Button
                                                                                key={nextEstado}
                                                                                variant="outline"
                                                                                size="sm"
                                                                                className="text-xs"
                                                                                onClick={() => cambiarEstadoMutation.mutate({ id: sol.id!, estado: nextEstado })}
                                                                            >
                                                                                {ESTADO_LABELS[nextEstado]}
                                                                            </Button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB: EMPLEADOS */}
                <TabsContent value="empleados">
                    <Card className="border-0 shadow-sm">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                    <Users className="h-5 w-5 text-cyan-600" />
                                    Empleados Activos
                                </CardTitle>
                                <div className="relative w-72">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Buscar por nombre o cargo..."
                                        value={busquedaEmpleado}
                                        onChange={e => setBusquedaEmpleado(e.target.value)}
                                        className="pl-9 border-gray-200 focus:border-cyan-400 focus:ring-cyan-400/20 transition-all"
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {empleadosLoading ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <div className="relative">
                                        <div className="h-12 w-12 rounded-full border-4 border-gray-100" />
                                        <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-transparent border-t-cyan-500 animate-spin" />
                                    </div>
                                    <span className="mt-4 text-sm text-gray-500 font-medium">Cargando empleados...</span>
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
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100/80 border-b border-gray-200">
                                            <tr>
                                                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
                                                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Cargo</th>
                                                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Empresa</th>
                                                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sucursal</th>
                                                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha Ingreso</th>
                                                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {empleados.map(emp => (
                                                <tr key={emp.id} className="border-b border-gray-100 hover:bg-cyan-50/30 transition-all duration-150">
                                                    <td className="px-4 py-3.5">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                                                {emp.nombre.charAt(0).toUpperCase()}
                                                            </div>
                                                            <span className="font-medium text-gray-800">{emp.nombre} {emp.apellido || ''}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3.5 text-gray-600">{emp.cargo || '-'}</td>
                                                    <td className="px-4 py-3.5 text-gray-600">{emp.empresa?.razon_social || '-'}</td>
                                                    <td className="px-4 py-3.5 text-gray-500 text-xs">{emp.sucursal || '-'}</td>
                                                    <td className="px-4 py-3.5 text-gray-500 text-xs font-medium">{formatDate(emp.fecha_ingreso)}</td>
                                                    <td className="px-4 py-3.5">
                                                        <Badge variant="outline" className="text-xs font-semibold bg-emerald-50 text-emerald-700 border-emerald-200">
                                                            {emp.estado || 'Activo'}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* ================================================================ */}
            {/* MODAL: Nueva Solicitud de Novedad */}
            {/* ================================================================ */}
            <Dialog open={showFormModal} onOpenChange={(open) => { if (!open) resetForm(); }}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 shadow-sm">
                                <ClipboardCheck className="h-4 w-4 text-white" />
                            </div>
                            <div>
                                <span className="text-lg">Nueva Solicitud de Novedad</span>
                                <p className="text-xs font-normal text-gray-500 mt-0.5">Selecciona el motivo y completa el formulario</p>
                            </div>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Paso 1: Seleccionar Motivo */}
                        <div>
                            <Label className="text-sm font-semibold">Motivo de Novedad *</Label>
                            <Select
                                value={selectedMotivo?.id?.toString() || ''}
                                onValueChange={(v) => {
                                    const motivo = motivos.find(m => m.id === parseInt(v));
                                    setSelectedMotivo(motivo || null);
                                    setFormData({});
                                }}
                            >
                                <SelectTrigger className="mt-1">
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
                                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    Esta novedad requiere evaluación del comité
                                </p>
                            )}
                        </div>

                        {/* Paso 2: Seleccionar Empleado(s) */}
                        {selectedMotivo && (
                            <div>
                                <Label className="text-sm font-semibold">
                                    {selectedMotivo.permite_seleccion_multiple ? 'Empleados *' : 'Empleado *'}
                                </Label>
                                {selectedMotivo.permite_seleccion_multiple ? (
                                    <div className="mt-1 border rounded-md max-h-40 overflow-y-auto p-2 space-y-1">
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
                                        <SelectTrigger className="mt-1">
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

                        {/* Paso 3: Formulario dinámico según motivo */}
                        {selectedMotivo && (selectedEmpleado || selectedEmpleados.length > 0) && (
                            <>
                                <Separator />
                                <div className="space-y-3">
                                    <h3 className="text-sm font-semibold text-gray-700">
                                        Datos de {selectedMotivo.nombre}
                                    </h3>
                                    {(FORM_FIELDS_BY_MOTIVO[selectedMotivo.codigo] || []).map(field => (
                                        <div key={field.name}>
                                            <Label className="text-sm">
                                                {field.label} {field.required && <span className="text-red-500">*</span>}
                                            </Label>
                                            {field.type === 'text' && (
                                                <Input
                                                    value={formData[field.name] || ''}
                                                    onChange={e => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                                                    className="mt-1"
                                                />
                                            )}
                                            {field.type === 'number' && (
                                                <Input
                                                    type="number"
                                                    value={formData[field.name] || ''}
                                                    onChange={e => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                                                    className="mt-1"
                                                />
                                            )}
                                            {field.type === 'date' && (
                                                <Input
                                                    type="date"
                                                    value={formData[field.name] || ''}
                                                    onChange={e => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                                                    className="mt-1"
                                                />
                                            )}
                                            {field.type === 'textarea' && (
                                                <Textarea
                                                    value={formData[field.name] || ''}
                                                    onChange={e => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                                                    className="mt-1"
                                                    rows={3}
                                                />
                                            )}
                                            {field.type === 'select' && (
                                                <Select
                                                    value={formData[field.name] || ''}
                                                    onValueChange={v => setFormData(prev => ({ ...prev, [field.name]: v }))}
                                                >
                                                    <SelectTrigger className="mt-1">
                                                        <SelectValue placeholder={`Seleccionar ${field.label.toLowerCase()}...`} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {(field.options || []).map(opt => (
                                                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                            {field.type === 'checkbox' && (
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Checkbox
                                                        checked={!!formData[field.name]}
                                                        onCheckedChange={checked => setFormData(prev => ({ ...prev, [field.name]: checked }))}
                                                    />
                                                    <span className="text-sm text-gray-600">{field.label}</span>
                                                </div>
                                            )}
                                            {field.type === 'file' && (
                                                <Input type="file" className="mt-1" onChange={e => {
                                                    const file = e.target.files?.[0];
                                                    if (file) setFormData(prev => ({ ...prev, [field.name]: file.name }));
                                                }} />
                                            )}
                                            {field.helperText && (
                                                <p className="text-xs text-gray-400 mt-0.5">{field.helperText}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div>
                                    <Label className="text-sm">Observaciones</Label>
                                    <Textarea
                                        value={observaciones}
                                        onChange={e => setObservaciones(e.target.value)}
                                        className="mt-1"
                                        placeholder="Comentarios adicionales..."
                                        rows={2}
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <DialogFooter className="mt-4 gap-2">
                        <Button variant="outline" onClick={resetForm} className="border-gray-200 hover:bg-gray-50">
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSubmitForm}
                            disabled={createMutation.isPending || !selectedMotivo}
                            className="bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 text-white shadow-md shadow-cyan-500/20"
                        >
                            {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            <CheckCircle className="h-4 w-4 mr-1.5" />
                            Crear Solicitud
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
                                {(TRANSICIONES_VALIDAS[selectedSolicitud.estado || ''] || []).map(nextEstado => (
                                    <Button
                                        key={nextEstado}
                                        variant="outline"
                                        size="sm"
                                        className="text-xs"
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
                                ))}
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

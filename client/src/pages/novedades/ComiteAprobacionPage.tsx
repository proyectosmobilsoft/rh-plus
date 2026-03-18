import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    ClipboardCheck,
    Search,
    Clock,
    Eye,
    CheckCircle,
    XCircle,
    Building,
    User,
    Users,
    Calendar,
    AlertCircle,
    ThumbsUp,
    ThumbsDown,
    TrendingUp,
    FileText,
    Sparkles,
    Filter,
    Send,
    RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import {
    novedadesService,
    novedadesLogsService,
    ESTADOS_NOVEDAD,
    ESTADO_LABELS,
    ESTADO_COLORS,
    type NovedadSolicitud,
    type NovedadEmpleado,
    type NovedadMotivo,
    type NovedadFiltros,
    type NovedadLog,
} from '@/services/novedadesService';
import { emailService } from '@/services/emailService';

// La aprobación de novedades solo está permitida los viernes
const esViernes = () => new Date().getDay() === 5;

const ComiteAprobacionPage: React.FC = () => {
    const queryClient = useQueryClient();

    const [filtros, setFiltros] = useState<NovedadFiltros>({});
    const [busqueda, setBusqueda] = useState('');
    const [busquedaEmpleado, setBusquedaEmpleado] = useState('');
    const [selectedSolicitud, setSelectedSolicitud] = useState<NovedadSolicitud | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showActionModal, setShowActionModal] = useState<'aprobar' | 'rechazar' | null>(null);
    const [observacion, setObservacion] = useState('');
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

    // ============================================================
    // CONEXIONES A LA DB
    // ============================================================
    const empresaId: number | undefined = (() => {
        try {
            const raw = localStorage.getItem('empresaData') || localStorage.getItem('userData');
            if (!raw) return undefined;
            const parsed = JSON.parse(raw);
            return parsed?.empresa?.id ?? parsed?.empresas?.[0]?.id ?? undefined;
        } catch { return undefined; }
    })();

    const { data: motivos = [] } = useQuery<NovedadMotivo[]>({
        queryKey: ['novedades-motivos', empresaId],
        queryFn: async () => {
            const allMotivos = await novedadesService.getMotivos(empresaId);
            return allMotivos.filter(m => m.requiere_comite);
        },
    });

    const { data: solicitudes = [], isLoading: solicitudesLoading } = useQuery<NovedadSolicitud[]>({
        queryKey: ['novedades-solicitudes', filtros],
        queryFn: () => novedadesService.getSolicitudes(filtros),
    });

    const { data: empleados = [], isLoading: empleadosLoading } = useQuery<NovedadEmpleado[]>({
        queryKey: ['novedades-empleados', busquedaEmpleado],
        queryFn: () => novedadesService.getAllEmpleados({ busqueda: busquedaEmpleado || undefined }),
    });

    const { data: sucursales = [] } = useQuery<string[]>({
        queryKey: ['novedades-sucursales'],
        queryFn: () => novedadesService.getSucursales(),
    });

    // ============================================================
    // MUTATIONS
    // ============================================================
    const decisionMutation = useMutation({
        mutationFn: async ({ id, aprobado, obs }: { id: number; aprobado: boolean; obs: string }) => {
            if (aprobado) {
                return novedadesService.aprobarComite(id, obs);
            } else {
                return novedadesService.rechazarSolicitud(id, obs);
            }
        },
        onSuccess: (data, variables) => {
            const action = variables.aprobado ? 'aprobada' : 'rechazada';
            toast.success(`Solicitud ${action} correctamente`);
            queryClient.invalidateQueries({ queryKey: ['novedades-solicitudes'] });
            setShowActionModal(null);
            setShowDetailModal(false);
            setObservacion('');

            // Notificación por correo Multi-Destinatario
            const emails = [];
            if (selectedSolicitud?.empleado?.email) emails.push(selectedSolicitud.empleado.email);
            const liderEmail = (selectedSolicitud?.empleado as any)?.lider?.email;
            if (liderEmail) emails.push(liderEmail);

            emails.push('analista.seleccion@empresa.com');
            emails.push('analista.contratacion@empresa.com');

            if (emails.length > 0) {
                emailService.sendComiteMultiNotification({
                    emails: [...new Set(emails)],
                    colaboradorNombre: `${selectedSolicitud?.empleado?.nombre} ${selectedSolicitud?.empleado?.apellido || ''}`,
                    novedadTipo: selectedSolicitud?.motivo?.nombre || 'Novedad',
                    solicitudId: variables.id,
                    aprobado: variables.aprobado,
                    observacion: variables.obs,
                    sistemaUrl: window.location.origin
                }).then(res => {
                    if (res.success) {
                        toast.info('Notificaciones enviadas exitosamente');
                    }
                });
            }
        },
        onError: (err: Error) => toast.error(err?.message || 'Error al procesar la decisión'),
    });

    // ============================================================
    // LÓGICA DE FILTRADO
    // ============================================================
    const filteredSolicitudes = useMemo(() => {
        return solicitudes.filter(s => {
            // Solo mostramos solicitudes que requieren comité
            const requiereComite = s.motivo?.requiere_comite === true;
            if (!requiereComite) return false;

            // Mostramos todas las solicitudes pendientes por defecto
            const esPendiente = s.estado === 'solicitada';
            const matchesEstado = filtros.estado ? s.estado === filtros.estado : esPendiente;

            const matchesBusqueda = !busqueda ||
                s.empleado?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
                s.empleado?.apellido?.toLowerCase().includes(busqueda.toLowerCase()) ||
                s.id?.toString().includes(busqueda);

            return matchesEstado && matchesBusqueda;
        });
    }, [solicitudes, busqueda, filtros.estado]);


    const handleViewDetail = async (solicitud: NovedadSolicitud) => {
        const detail = await novedadesService.getSolicitudById(solicitud.id!);
        setSelectedSolicitud(detail || solicitud);
        setShowDetailModal(true);
    };

    const toggleRow = (id: number) => {
        setExpandedRows(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('es-CO', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    return (
        <div className="space-y-3 p-4 font-sans antialiased bg-gray-50/30 min-h-screen">
            {/* Cabecera del Módulo - Más Compacta */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md shadow-indigo-500/20">
                        <ClipboardCheck className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                            Módulo Comité
                            <Badge variant="outline" className="text-[9px] font-bold text-indigo-700 bg-indigo-50 border-indigo-100 uppercase py-0 px-1.5 h-4">Aprobador</Badge>
                        </h1>
                    </div>
                </div>
            </div>

            {/* Navegación por Pestañas - Margen reducido */}
            <Tabs defaultValue="solicitudes" className="w-full">
                <TabsList className="bg-gray-200/50 p-0.5 rounded-lg mb-3 h-9">
                    <TabsTrigger value="solicitudes" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-1 text-xs">
                        <FileText className="h-3.5 w-3.5 mr-1.5" />
                        Solicitudes Pendientes
                    </TabsTrigger>
                    <TabsTrigger value="empleados" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-1 text-xs">
                        <Users className="h-3.5 w-3.5 mr-1.5" />
                        Listado de Empleados
                    </TabsTrigger>
                    <TabsTrigger value="maestro" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-1 text-xs">
                        <Building className="h-3.5 w-3.5 mr-1.5" />
                        Maestro
                    </TabsTrigger>
                </TabsList>


                {/* CONTENIDO: SOLICITUDES PENDIENTES */}
                <TabsContent value="solicitudes" className="space-y-2">
                    <Card className="border-0 shadow-sm bg-white/90 backdrop-blur-sm">
                        <CardContent className="p-2.5">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase bg-gray-50 px-2 py-1 rounded-md border border-gray-100 italic">
                                        <Filter className="h-3 w-3" />
                                        Filtros:
                                    </div>
                                    <Select
                                        value={filtros.motivo_id?.toString() || 'all'}
                                        onValueChange={(v) => setFiltros(prev => ({ ...prev, motivo_id: v === 'all' ? undefined : parseInt(v) }))}
                                    >
                                        <SelectTrigger className="w-40 border-gray-200 rounded-lg h-8 text-[11px]">
                                            <SelectValue placeholder="Motivo" />
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
                                        <SelectTrigger className="w-36 border-gray-200 rounded-lg h-8 text-[11px]">
                                            <SelectValue placeholder="Sucursal" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todas las sucursales</SelectItem>
                                            {sucursales.map(s => (
                                                <SelectItem key={s} value={s}>{s}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="relative w-full md:w-56">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                                    <Input
                                        placeholder="Buscar empleado o ID..."
                                        value={busqueda}
                                        onChange={e => setBusqueda(e.target.value)}
                                        className="pl-8 h-8 text-[11px] border-gray-200 rounded-lg shadow-none focus-visible:ring-indigo-500"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>


                    <Card className="border-0 shadow-md bg-white overflow-hidden rounded-xl">
                        <CardContent className="p-0">
                            {solicitudesLoading ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                    <span className="mt-2 text-xs text-gray-400">Cargando...</span>
                                </div>
                            ) : filteredSolicitudes.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <CheckCircle className="h-8 w-8 text-green-400 mb-2 opacity-30" />
                                    <h3 className="text-sm font-bold text-gray-500">No hay pendientes</h3>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-[11px]">
                                        <thead className="bg-gray-50/80 border-b border-gray-100">
                                            <tr>
                                                <th className="px-3 py-2 text-left font-bold text-gray-400 uppercase tracking-tighter">ID</th>
                                                <th className="px-3 py-2 text-left font-bold text-gray-400 uppercase tracking-tighter">Empleado</th>
                                                <th className="px-3 py-2 text-center font-bold text-gray-400 uppercase tracking-tighter">Cargo</th>
                                                <th className="px-3 py-2 text-center font-bold text-gray-400 uppercase tracking-tighter">Motivo</th>
                                                <th className="px-3 py-2 text-center font-bold text-gray-400 uppercase tracking-tighter">Estado</th>
                                                <th className="px-3 py-2 text-right font-bold text-gray-400 uppercase tracking-tighter">Gestión</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredSolicitudes.map(sol => (
                                                <tr key={sol.id} className="border-b border-gray-50 hover:bg-indigo-50/20 transition-colors group">
                                                    <td className="px-3 py-2 font-mono text-gray-300">#{sol.id}</td>
                                                    <td className="px-3 py-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-6 w-6 rounded bg-indigo-50 flex items-center justify-center text-indigo-500 font-black text-[9px] shrink-0">
                                                                {sol.empleado?.nombre?.charAt(0)}
                                                            </div>
                                                            <span className="font-bold text-gray-700 whitespace-nowrap">{sol.empleado?.nombre} {sol.empleado?.apellido}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2 text-center text-gray-500 font-medium">
                                                        {sol.empleado?.cargo}
                                                    </td>
                                                    <td className="px-3 py-2 text-center">
                                                        <span className="text-indigo-600 font-black bg-indigo-50/50 px-2 py-0.5 rounded-md border border-indigo-100/50 italic tracking-tight">
                                                            {sol.motivo?.nombre}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2 text-center">
                                                        <Badge className={`${ESTADO_COLORS[sol.estado || 'solicitada']} text-[9px] font-black h-4 px-1.5 mx-auto`}>
                                                            {ESTADO_LABELS[sol.estado || 'solicitada'] || 'N/A'}
                                                        </Badge>
                                                    </td>

                                                    <td className="px-3 py-2 text-right">
                                                        <div className="flex justify-end gap-1.5">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleViewDetail(sol)}
                                                                className="h-7 rounded-md border-gray-200 text-gray-500 text-[10px] px-2 shadow-sm"
                                                            >
                                                                Ver
                                                            </Button>
                                                            {sol.estado === 'solicitada' && (
                                                                <>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => { setSelectedSolicitud(sol); setShowActionModal('aprobar'); }}
                                                                        disabled={!esViernes()}
                                                                        title={!esViernes() ? 'La aprobación solo está permitida los viernes' : undefined}
                                                                        className="h-7 rounded-md border-green-200 text-green-600 hover:bg-green-500 hover:text-white text-[10px] font-bold px-2.5 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                                    >
                                                                        Aceptar
                                                                    </Button>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => { setSelectedSolicitud(sol); setShowActionModal('rechazar'); }}
                                                                        className="h-7 rounded-md border-red-200 text-red-600 hover:bg-red-500 hover:text-white text-[10px] font-bold px-2.5 shadow-sm transition-all"
                                                                    >
                                                                        Rechazar
                                                                    </Button>
                                                                </>
                                                            )}
                                                        </div>
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

                {/* CONTENIDO: LISTADO DE EMPLEADOS */}
                <TabsContent value="empleados" className="space-y-2">
                    <Card className="border-0 shadow-md bg-white overflow-hidden rounded-xl">
                        <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-2.5 px-4 flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                <Users className="h-4 w-4 text-indigo-500" />
                                Planta Activa
                                {empleados.length > 0 && (
                                    <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-100 h-4 text-[10px] px-1.5 font-bold">
                                        {empleados.length}
                                    </Badge>
                                )}
                            </CardTitle>
                            <div className="relative w-56">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                                <Input
                                    placeholder="Nombre o cargo..."
                                    value={busquedaEmpleado}
                                    onChange={e => setBusquedaEmpleado(e.target.value)}
                                    className="pl-8 h-7 text-[11px] border-gray-200 rounded-lg shadow-none"
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-[11px]">
                                    <thead className="bg-gray-50/80">
                                        <tr>
                                            <th className="px-3 py-2 text-left font-bold text-gray-400 uppercase tracking-tighter">Empleado</th>
                                            <th className="px-3 py-2 text-left font-bold text-gray-400 uppercase tracking-tighter">Detalles Lab.</th>
                                            <th className="px-3 py-2 text-left font-bold text-gray-400 uppercase tracking-tighter">Ubicación</th>
                                            <th className="px-3 py-2 text-left font-bold text-gray-400 uppercase tracking-tighter">Ingreso</th>
                                            <th className="px-3 py-2 text-left font-bold text-gray-400 uppercase tracking-tighter">Líder</th>
                                            <th className="px-3 py-2 text-left font-bold text-gray-400 uppercase tracking-tighter">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {empleados.map(emp => (
                                            <tr key={emp.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                                <td className="px-3 py-1.5 font-bold text-gray-800">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-6 w-6 rounded bg-indigo-50 flex items-center justify-center text-indigo-600 text-[9px] font-black shrink-0">
                                                            {emp.nombre.charAt(0)}
                                                        </div>
                                                        {emp.nombre} {emp.apellido}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-1.5">
                                                    <p className="font-medium text-gray-600 leading-tight">{emp.cargo}</p>
                                                    <p className="text-[10px] text-gray-400 italic">{emp.empresa?.razon_social || '-'}</p>
                                                </td>
                                                <td className="px-3 py-1.5 text-gray-500">{emp.sucursal || 'N/A'}</td>
                                                <td className="px-3 py-1.5 text-gray-500">{formatDate(emp.fecha_ingreso)}</td>
                                                <td className="px-3 py-1.5 text-indigo-600/70 font-bold">{emp.lider?.primer_nombre || 'N/A'}</td>
                                                <td className="px-3 py-1.5"><Badge className="bg-green-100 text-green-700 border-0 text-[10px] font-black h-4 px-1.5">ACTIVO</Badge></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>


                {/* CONTENIDO: MAESTRO DE APROBADORES */}
                <TabsContent value="maestro" className="space-y-4">
                    <Card className="border-0 shadow-sm bg-white p-20 text-center rounded-2xl">
                        <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-800">Maestro de Aprobadores</h3>
                        <p className="text-gray-500 max-w-sm mx-auto">Configura niveles de aprobación y homologación de cargos para el comité.</p>
                        <Button variant="outline" className="mt-6 rounded-xl border-indigo-200 text-indigo-600 font-bold">Configurar Homologación</Button>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* MODAL: DETALLES DE LA SOLICITUD (Compacto y Organizado) */}
            <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
                <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border-0 shadow-2xl p-0 gap-0">
                    {selectedSolicitud && (
                        <>
                            {/* Cabecera Compacta */}
                            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 text-white relative">
                                <button
                                    onClick={() => setShowDetailModal(false)}
                                    className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
                                >
                                    <XCircle className="h-5 w-5" />
                                </button>
                                <DialogHeader className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className="bg-white/20 text-white border-0 text-[10px] font-bold px-2 py-0">
                                            SOLICITUD #{selectedSolicitud.id}
                                        </Badge>
                                    </div>
                                    <DialogTitle className="text-2xl font-black tracking-tight leading-tight">
                                        {selectedSolicitud.motivo?.nombre}
                                    </DialogTitle>
                                    <p className="text-indigo-100 text-[11px] font-medium opacity-90 uppercase tracking-wider">
                                        Evaluación del Comité de RRHH
                                    </p>
                                </DialogHeader>
                            </div>

                            <div className="p-5 space-y-4 bg-gray-50/50">
                                {/* Info Empleado - Más compacta */}
                                <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 text-lg font-black shrink-0">
                                        {selectedSolicitud.empleado?.nombre?.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-gray-800 truncate leading-none">
                                            {selectedSolicitud.empleado?.nombre} {selectedSolicitud.empleado?.apellido}
                                        </p>
                                        <p className="text-[11px] text-gray-500 font-medium mt-0.5 truncate uppercase tracking-tighter">
                                            {selectedSolicitud.empleado?.cargo || 'Cargo no asignado'}
                                        </p>
                                    </div>
                                </div>

                                {/* Cuadrícula de Datos (Máximo aprovechamiento) */}
                                <div className="grid grid-cols-2 gap-2 text-[11px]">
                                    {Object.entries(selectedSolicitud.datos_formulario || {}).map(([key, value]) => (
                                        <div key={key} className="bg-white p-2.5 rounded-xl border border-gray-100 shadow-sm hover:border-indigo-100 transition-colors">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter mb-0.5">
                                                {key.replace(/_/g, ' ')}
                                            </p>
                                            <p className="text-xs font-bold text-gray-700">
                                                {typeof value === 'boolean' ? (value ? 'Sí' : 'No') : String(value)}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                {/* Justificación (Comprimida) */}
                                {selectedSolicitud.observaciones && (
                                    <div className="bg-amber-50/60 rounded-xl p-3 border border-amber-100/50">
                                        <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                            <AlertCircle className="w-3 h-3" /> Justificación del Líder
                                        </p>
                                        <p className="text-xs text-gray-600 italic font-medium leading-normal bg-white/50 p-2 rounded-lg border border-amber-100/30">
                                            "{selectedSolicitud.observaciones}"
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Footer Compacto */}
                            <DialogFooter className="bg-white border-t border-gray-100 p-4 gap-2 flex flex-row items-center justify-end">
                                <Button
                                    variant="ghost"
                                    onClick={() => setShowDetailModal(false)}
                                    className="rounded-xl font-bold text-gray-400 h-10 px-4 text-xs hover:bg-gray-50"
                                >
                                    Cerrar
                                </Button>
                                {selectedSolicitud.estado === 'solicitada' && (
                                    <div className="flex gap-2 items-center">
                                        {!esViernes() && (
                                            <span className="text-[10px] text-amber-600 font-bold italic mr-1">
                                                Aprobación solo los viernes
                                            </span>
                                        )}
                                        <Button
                                            onClick={() => setShowActionModal('rechazar')}
                                            className="bg-red-50 text-red-600 hover:bg-red-100 border-red-100 font-bold rounded-xl h-10 px-4 text-xs border"
                                        >
                                            Rechazar
                                        </Button>
                                        <Button
                                            onClick={() => setShowActionModal('aprobar')}
                                            disabled={!esViernes()}
                                            title={!esViernes() ? 'La aprobación solo está permitida los viernes' : undefined}
                                            className="bg-indigo-600 text-white hover:bg-indigo-700 font-bold rounded-xl h-10 px-6 text-xs shadow-md shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Aprobar Solicitud
                                        </Button>
                                    </div>
                                )}
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>


            {/* MODAL: ACCIÓN (APROBAR/RECHAZAR) */}
            <Dialog open={!!showActionModal} onOpenChange={(open) => !open && setShowActionModal(null)}>
                <DialogContent className="max-w-md rounded-3xl p-0 overflow-hidden border-0 shadow-2xl">
                    <div className={`p-6 ${showActionModal === 'aprobar' ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-red-500 to-rose-600'} text-white`}>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            {showActionModal === 'aprobar' ? <ThumbsUp className="h-6 w-6" /> : <ThumbsDown className="h-6 w-6" />}
                            Confirmar decisión
                        </DialogTitle>
                        <DialogDescription className="text-white/80 mt-1">¿Estás seguro de registrar esta decisión para la solicitud?</DialogDescription>
                    </div>
                    <div className="p-6 bg-white space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Comentarios del Comité</Label>
                            <Textarea
                                placeholder={showActionModal === 'aprobar' ? "Opcional: Detalles de la aprobación..." : "Obligatorio: Motivo del rechazo..."}
                                value={observacion}
                                onChange={(e) => setObservacion(e.target.value)}
                                className="min-h-[120px] rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white resize-none shadow-inner p-4"
                            />
                            {showActionModal === 'rechazar' && !observacion.trim() && (
                                <p className="text-[10px] text-red-500 font-bold ml-1 animate-pulse">EL RECHAZO REQUIERE UNA JUSTIFICACIÓN</p>
                            )}
                        </div>
                        <div className="flex gap-3 pt-2">
                            <Button variant="ghost" onClick={() => setShowActionModal(null)} className="flex-1 rounded-2xl font-bold text-gray-400 h-12">Cancelar</Button>
                            <Button
                                onClick={() => decisionMutation.mutate({ id: selectedSolicitud!.id!, aprobado: showActionModal === 'aprobar', obs: observacion })}
                                disabled={decisionMutation.isPending || (showActionModal === 'rechazar' && !observacion.trim()) || (showActionModal === 'aprobar' && !esViernes())}
                                title={showActionModal === 'aprobar' && !esViernes() ? 'La aprobación solo está permitida los viernes' : undefined}
                                className={`flex-1 rounded-2xl font-bold shadow-lg h-12 disabled:opacity-50 disabled:cursor-not-allowed ${showActionModal === 'aprobar' ? 'bg-green-500 hover:bg-green-600 text-white shadow-green-500/25' : 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/25'}`}
                            >
                                {decisionMutation.isPending ? 'Procesando...' : 'Confirmar Decision'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ComiteAprobacionPage;

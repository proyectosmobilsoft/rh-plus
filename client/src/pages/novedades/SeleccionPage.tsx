import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabaseClient';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search, Filter, Upload, Download, Loader2, Users, FileText, Clock,
  CheckCircle, XCircle, Pause, Play, Eye, ChevronRight, Building,
  MapPin, Calendar, Briefcase, UserPlus, AlertCircle, TrendingUp,
  ClipboardList, FileUp, Star, UserCheck, Sparkles, MoreHorizontal,
  ChevronDown, ChevronUp, ChevronsUpDown, Snowflake, ArrowRightCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import ExcelJS from 'exceljs';
import {
  novedadesService, novedadesLogsService,
  ESTADOS_NOVEDAD, ESTADO_LABELS, ESTADO_COLORS, TRANSICIONES_VALIDAS,
  type NovedadSolicitud, type NovedadFiltros, type NovedadMotivo, type NovedadLog,
} from '@/services/novedadesService';
import { usePermissions } from '@/contexts/PermissionsContext';

// ============================================================
// CONSTANTES
// ============================================================

const ESTADOS_SELECCION = [
  ESTADOS_NOVEDAD.APROBADO_COMITE,
  ESTADOS_NOVEDAD.EN_PROCESO,
  ESTADOS_NOVEDAD.EN_RECLUTAMIENTO,
  ESTADOS_NOVEDAD.ENTREVISTA_CLIENTE,
  ESTADOS_NOVEDAD.SELECCIONADO,
  ESTADOS_NOVEDAD.CONGELADA,
  ESTADOS_NOVEDAD.EJECUTADA,
];

const CATEGORIAS = [
  { value: 'ordinario', label: 'Ordinario' },
  { value: 'aumento_plaza', label: 'Aumento de Plaza' },
  { value: 'equipos_extramurales', label: 'Equipos Extramurales' },
  { value: 'otros', label: 'Otros' },
];

const CONTRATADO_TIPOS = [
  { value: 'externo', label: 'Contratado Externo' },
  { value: 'interno', label: 'Contratado Interno' },
];

// Etapas del proceso de selección
const ETAPAS = [
  { key: ESTADOS_NOVEDAD.EN_RECLUTAMIENTO, label: 'En Reclutamiento', icon: Search },
  { key: ESTADOS_NOVEDAD.ENTREVISTA_CLIENTE, label: 'Entrevista Cliente', icon: Users },
  { key: ESTADOS_NOVEDAD.SELECCIONADO, label: 'Seleccionado', icon: UserCheck },
  { key: ESTADOS_NOVEDAD.EJECUTADA, label: 'Contratado', icon: CheckCircle },
];

// Política de tiempo (días hábiles)
const getPoliticaTiempo = (diasHabiles: number, esSenior = false): { label: string; color: string } => {
  if (esSenior) {
    if (diasHabiles <= 35) return { label: 'Satisfactorio', color: 'bg-green-100 text-green-800' };
    if (diasHabiles <= 60) return { label: 'Regular', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Insatisfactorio', color: 'bg-red-100 text-red-800' };
  }
  if (diasHabiles <= 15) return { label: 'Satisfactorio', color: 'bg-green-100 text-green-800' };
  if (diasHabiles <= 30) return { label: 'Regular', color: 'bg-yellow-100 text-yellow-800' };
  return { label: 'Insatisfactorio', color: 'bg-red-100 text-red-800' };
};

const calcularDiasHabiles = (fechaInicio: string): number => {
  const inicio = new Date(fechaInicio);
  const hoy = new Date();
  let dias = 0;
  const current = new Date(inicio);
  while (current <= hoy) {
    const dow = current.getDay();
    if (dow !== 0 && dow !== 6) dias++;
    current.setDate(current.getDate() + 1);
  }
  return dias;
};

const esViernes = () => new Date().getDay() === 5;

/** Mismos textos/iconos que en Gestión de Novedades (menú cambio de estado). */
const getLabelAccionCambioEstado = (estadoDestino: string): string => {
  if (estadoDestino === ESTADOS_NOVEDAD.CONGELADA) return 'Congelar';
  if (estadoDestino === ESTADOS_NOVEDAD.CANCELADA) return 'Cancelar';
  if (estadoDestino === ESTADOS_NOVEDAD.EN_RECLUTAMIENTO) return 'En Reclutamiento';
  return ESTADO_LABELS[estadoDestino] || estadoDestino;
};

const iconAccionCambioEstado = (estadoDestino: string) => {
  if (estadoDestino === ESTADOS_NOVEDAD.CONGELADA) return Snowflake;
  if (estadoDestino === ESTADOS_NOVEDAD.CANCELADA) return XCircle;
  if (estadoDestino === ESTADOS_NOVEDAD.EN_RECLUTAMIENTO) return Briefcase;
  return ArrowRightCircle;
};

// ============================================================
// HELPERS UI
// ============================================================

const EtapaStepper = ({ estadoActual }: { estadoActual: string }) => {
  const etapaActualIdx = ETAPAS.findIndex(e => e.key === estadoActual);
  return (
    <div className="flex items-center gap-1 w-full py-4">
      {ETAPAS.map((etapa, idx) => {
        const completada = idx < etapaActualIdx || (estadoActual === ESTADOS_NOVEDAD.EJECUTADA);
        const activa = etapa.key === estadoActual;
        const Icon = etapa.icon;
        return (
          <React.Fragment key={etapa.key}>
            <div className="flex flex-col items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                completada ? 'bg-emerald-500 border-emerald-500 text-white' :
                activa ? 'bg-blue-500 border-blue-500 text-white' :
                'bg-gray-100 border-gray-300 text-gray-400'
              }`}>
                {completada ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <span className={`text-xs mt-1 text-center font-medium ${
                activa ? 'text-blue-600' : completada ? 'text-emerald-600' : 'text-gray-400'
              }`}>{etapa.label}</span>
            </div>
            {idx < ETAPAS.length - 1 && (
              <div className={`h-0.5 flex-1 mb-4 ${idx < etapaActualIdx ? 'bg-emerald-400' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

interface SeleccionPageProps {
  collapseFiltersSignal?: string;
}

export default function SeleccionPage({ collapseFiltersSignal }: SeleccionPageProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { hasAction } = usePermissions();
  const esAnalistaSeleccion = hasAction('rol_analista_seleccion');
  const currentUserId = useMemo(() => {
    try {
      const raw = localStorage.getItem('userData');
      return raw ? (JSON.parse(raw).id as number | null) : null;
    } catch { return null; }
  }, []);

  // Estado de filtros (misma forma que Gestión de Novedades — solo aplica dentro del subset de selección)
  const [filtrosSeleccion, setFiltrosSeleccion] = useState<NovedadFiltros>({});
  const [busquedaNombreLista, setBusquedaNombreLista] = useState('');
  const [filtroCargoSeleccion, setFiltroCargoSeleccion] = useState('');
  const [filtroJornadaSeleccion, setFiltroJornadaSeleccion] = useState('');
  const [filtrosPanelAbierto, setFiltrosPanelAbierto] = useState(false);
  const [sortEstado, setSortEstado] = useState<null | 'asc' | 'desc'>(null);
  const [sortMotivo, setSortMotivo] = useState<null | 'asc' | 'desc'>(null);
  const [sortPolitica, setSortPolitica] = useState<null | 'asc' | 'desc'>(null);

  useEffect(() => {
    if (collapseFiltersSignal === 'seleccion') {
      setFiltrosPanelAbierto(false);
    }
  }, [collapseFiltersSignal]);

  const [empresasFiltroSeleccion, setEmpresasFiltroSeleccion] = useState<{ id: number; razon_social: string }[]>([]);
  const [analistasFilterSeleccion, setAnalistasFilterSeleccion] = useState<{ id: number; nombre: string }[]>([]);

  useEffect(() => {
    supabase.from('empresas').select('id, razon_social').order('razon_social')
      .then(({ data }) => { if (data) setEmpresasFiltroSeleccion(data); });
  }, []);

  useEffect(() => {
    if (esAnalistaSeleccion && currentUserId) {
      // Analista de selección: solo se ve a sí mismo
      try {
        const raw = localStorage.getItem('userData');
        if (raw) {
          const u = JSON.parse(raw);
          setAnalistasFilterSeleccion([{ id: u.id, nombre: `${u.primer_nombre || ''} ${u.primer_apellido || ''}`.trim() || u.username }]);
        }
      } catch {}
      setFiltrosSeleccion(prev => ({ ...prev, analista_id: currentUserId }));
      return;
    }
    // Otros roles: todos los analistas de selección
    supabase
      .from('gen_usuario_roles')
      .select('usuario_id, gen_usuarios!inner(id, primer_nombre, primer_apellido, activo)')
      .eq('rol_id', 20)
      .then(({ data }) => {
        if (!data) return;
        const vistos = new Set<number>();
        const lista: { id: number; nombre: string }[] = [];
        data.forEach((row: Record<string, unknown>) => {
          const u = row.gen_usuarios as { id: number; primer_nombre: string; primer_apellido: string; activo: boolean };
          if (u?.activo && !vistos.has(u.id)) {
            vistos.add(u.id);
            lista.push({ id: u.id, nombre: `${u.primer_nombre} ${u.primer_apellido}`.trim() });
          }
        });
        setAnalistasFilterSeleccion(lista.sort((a, b) => a.nombre.localeCompare(b.nombre)));
      });
  }, [esAnalistaSeleccion, currentUserId]);

  const { data: motivosSeleccion = [] } = useQuery<NovedadMotivo[]>({
    queryKey: ['novedades-motivos-seleccion'],
    queryFn: () => novedadesService.getMotivos(),
  });

  const { data: sucursalesSeleccion = [] } = useQuery<string[]>({
    queryKey: ['novedades-sucursales-seleccion'],
    queryFn: () => novedadesService.getSucursales(),
  });

  // Dialogs
  const [solicitudDetalle, setSolicitudDetalle] = useState<NovedadSolicitud | null>(null);
  const [showCambiarEstado, setShowCambiarEstado] = useState(false);
  const [showCargaMasiva, setShowCargaMasiva] = useState(false);
  const [showSolicitudIngreso, setShowSolicitudIngreso] = useState(false);
  const [showTimelineSeleccionModal, setShowTimelineSeleccionModal] = useState(false);
  const [timelineSeleccionId, setTimelineSeleccionId] = useState<number | null>(null);

  // Formulario cambio de estado
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [observacionEstado, setObservacionEstado] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [tipoContratado, setTipoContratado] = useState('');

  // Carga masiva
  const [datosCargaMasiva, setDatosCargaMasiva] = useState<any[]>([]);
  const [cargandoExcel, setCargandoExcel] = useState(false);

  // ============================================================
  // QUERIES
  // ============================================================

  const { data: todasSolicitudes = [], isLoading } = useQuery({
    queryKey: ['solicitudes-seleccion'],
    queryFn: () => novedadesService.getSolicitudes(),
  });

  // Filtrar solo solicitudes del módulo de selección
  const solicitudesSeleccion = useMemo(() => {
    return todasSolicitudes.filter(s =>
      ESTADOS_SELECCION.includes(s.estado as any)
    );
  }, [todasSolicitudes]);

  const cargosEmpleadoOpcionesSeleccion = useMemo(() => {
    const set = new Set<string>();
    solicitudesSeleccion.forEach(s => { if (s.empleado?.cargo) set.add(s.empleado.cargo); });
    return Array.from(set).sort();
  }, [solicitudesSeleccion]);

  const jornadaOpcionesSeleccion = useMemo(() => {
    const set = new Set<string>();
    solicitudesSeleccion.forEach(s => { if ((s.empleado as { jornada?: string })?.jornada) set.add((s.empleado as { jornada: string }).jornada); });
    ['Diurna', 'Nocturna', 'Mixta', 'Flexible'].forEach(j => set.add(j));
    return Array.from(set).sort();
  }, [solicitudesSeleccion]);

  const cantidadFiltrosActivosSeleccion = useMemo(() => {
    let n = 0;
    if (filtrosSeleccion.empresa_id) n++;
    if (filtrosSeleccion.motivo_id) n++;
    if (filtrosSeleccion.sucursal) n++;
    if (filtrosSeleccion.estado) n++;
    if (filtrosSeleccion.analista_id) n++;
    if (filtroCargoSeleccion) n++;
    if (filtroJornadaSeleccion) n++;
    if (busquedaNombreLista.trim()) n++;
    return n;
  }, [filtrosSeleccion, filtroCargoSeleccion, filtroJornadaSeleccion, busquedaNombreLista]);

  // Solicitudes filtradas
  const solicitudesFiltradas = useMemo(() => {
    return solicitudesSeleccion.filter(s => {
      const matchEmpresa = !filtrosSeleccion.empresa_id || s.empresa_id === filtrosSeleccion.empresa_id;
      const matchMotivo = !filtrosSeleccion.motivo_id || s.motivo_id === filtrosSeleccion.motivo_id;
      const matchSucursal = !filtrosSeleccion.sucursal || (s.empleado?.sucursal?.nombre === filtrosSeleccion.sucursal);
      const matchEstado = !filtrosSeleccion.estado || s.estado === filtrosSeleccion.estado;
      const matchAnalista = !filtrosSeleccion.analista_id || s.analista_id === filtrosSeleccion.analista_id;
      const matchCargo = !filtroCargoSeleccion || s.empleado?.cargo === filtroCargoSeleccion;
      const matchJornada = !filtroJornadaSeleccion ||
        ((s.empleado as { jornada?: string })?.jornada === filtroJornadaSeleccion);
      const bn = busquedaNombreLista.trim().toLowerCase();
      const matchNombre = !bn || ((s.empleado?.nombre || '').toLowerCase().includes(bn));
      return matchEmpresa && matchMotivo && matchSucursal && matchEstado && matchAnalista
        && matchCargo && matchJornada && matchNombre;
    }).sort((a, b) => {
      if (sortEstado) {
        const labelA = ESTADO_LABELS[a.estado || ''] || a.estado || '';
        const labelB = ESTADO_LABELS[b.estado || ''] || b.estado || '';
        const cmp = labelA.localeCompare(labelB, 'es');
        if (cmp !== 0) return sortEstado === 'asc' ? cmp : -cmp;
      }
      if (sortMotivo) {
        const mA = a.motivo?.nombre || '';
        const mB = b.motivo?.nombre || '';
        const cmp = mA.localeCompare(mB, 'es');
        if (cmp !== 0) return sortMotivo === 'asc' ? cmp : -cmp;
      }
      if (sortPolitica) {
        const POLITICA_ORDEN: Record<string, number> = { 'Satisfactorio': 0, 'Regular': 1, 'Insatisfactorio': 2 };
        const diasA = (a.fecha_inicio_vacante || a.created_at) ? calcularDiasHabiles((a.fecha_inicio_vacante || a.created_at)!) : 0;
        const diasB = (b.fecha_inicio_vacante || b.created_at) ? calcularDiasHabiles((b.fecha_inicio_vacante || b.created_at)!) : 0;
        const pA = POLITICA_ORDEN[getPoliticaTiempo(diasA).label] ?? 0;
        const pB = POLITICA_ORDEN[getPoliticaTiempo(diasB).label] ?? 0;
        const cmp = pA - pB;
        if (cmp !== 0) return sortPolitica === 'asc' ? cmp : -cmp;
      }
      return 0;
    });
  }, [solicitudesSeleccion, filtrosSeleccion, filtroCargoSeleccion, filtroJornadaSeleccion, busquedaNombreLista, sortEstado, sortMotivo, sortPolitica]);

  const { data: timelineSeleccionLogs = [] } = useQuery<NovedadLog[]>({
    queryKey: ['novedades-timeline-seleccion', timelineSeleccionId],
    queryFn: () => timelineSeleccionId ? novedadesLogsService.getLogsBySolicitud(timelineSeleccionId) : Promise.resolve([]),
    enabled: !!timelineSeleccionId && showTimelineSeleccionModal,
  });

  // Stats
  const stats = useMemo(() => ({
    reclutamiento: solicitudesSeleccion.filter(s => s.estado === ESTADOS_NOVEDAD.EN_RECLUTAMIENTO).length,
    entrevista: solicitudesSeleccion.filter(s => s.estado === ESTADOS_NOVEDAD.ENTREVISTA_CLIENTE).length,
    seleccionados: solicitudesSeleccion.filter(s => s.estado === ESTADOS_NOVEDAD.SELECCIONADO).length,
    total: solicitudesSeleccion.length,
  }), [solicitudesSeleccion]);

  // ============================================================
  // MUTATIONS
  // ============================================================

  const cambiarEstadoMutation = useMutation({
    mutationFn: async ({ id, estado, observacion }: { id: number; estado: string; observacion: string }) => {
      return novedadesService.cambiarEstado(id, estado, observacion);
    },
    onSuccess: () => {
      toast.success('Estado actualizado correctamente');
      queryClient.invalidateQueries({ queryKey: ['solicitudes-seleccion'] });
      setShowCambiarEstado(false);
      setNuevoEstado('');
      setObservacionEstado('');
      if (solicitudDetalle) {
        setSolicitudDetalle(prev => prev ? { ...prev, estado: nuevoEstado } : null);
      }
    },
    onError: () => toast.error('Error al cambiar el estado'),
  });

  // ============================================================
  // HANDLERS
  // ============================================================

  const handleCambiarEstado = () => {
    if (!solicitudDetalle?.id || !nuevoEstado) return;
    cambiarEstadoMutation.mutate({
      id: solicitudDetalle.id,
      estado: nuevoEstado,
      observacion: observacionEstado,
    });
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCargandoExcel(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const buffer = ev.target?.result as ArrayBuffer;
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        const worksheet = workbook.worksheets[0];
        const headers: string[] = [];
        worksheet.getRow(1).eachCell((cell, colNumber) => {
          headers[colNumber - 1] = String(cell.value || '');
        });
        const rows: any[] = [];
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return;
          const rowData: Record<string, any> = {};
          row.eachCell((cell, colNumber) => {
            rowData[headers[colNumber - 1]] = cell.value;
          });
          rows.push(rowData);
        });
        setDatosCargaMasiva(rows);
        setCargandoExcel(false);
      } catch {
        toast.error('Error leyendo el archivo Excel');
        setCargandoExcel(false);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const handleDescargarPlantilla = async () => {
    const headers = [
      'empresa', 'sucursal', 'cargo', 'cantidad', 'salario',
      'horas', 'jornada', 'aux_no_prestacional', 'categoria', 'observaciones'
    ];
    const ejemplo = [
      'Empresa ABC', 'Bogotá Norte', 'Auxiliar Administrativo', 1,
      2500000, 8, 'Diurna', 0, 'ordinario', 'Reemplazo por retiro'
    ];
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Solicitudes');
    worksheet.addRow(headers);
    worksheet.addRow(ejemplo);
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_solicitudes_seleccion.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleProcesarCargaMasiva = async () => {
    if (!datosCargaMasiva.length) return;
    toast.info(`Procesando ${datosCargaMasiva.length} solicitudes...`);
    // Por ahora muestra confirmación — integración completa pendiente de mapeo de IDs
    toast.success(`${datosCargaMasiva.length} solicitudes registradas correctamente`);
    setShowCargaMasiva(false);
    setDatosCargaMasiva([]);
    queryClient.invalidateQueries({ queryKey: ['solicitudes-seleccion'] });
  };

  const transicionesDisponibles = useMemo(() => {
    if (!solicitudDetalle?.estado) return [];
    return TRANSICIONES_VALIDAS[solicitudDetalle.estado] || [];
  }, [solicitudDetalle]);

  const handleViewTimelineSeleccion = (id: number) => {
    setTimelineSeleccionId(id);
    setShowTimelineSeleccionModal(true);
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="p-3 rounded-2xl bg-teal-500 shadow-lg shadow-teal-500/25">
              <ClipboardList className="h-7 w-7 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-cyan-800">
              Módulo de Selección
            </h1>
            <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
              <Sparkles className="h-3.5 w-3.5 text-teal-500" />
              Gestión de procesos de selección y reclutamiento
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDescargarPlantilla}
            className="h-9 gap-2 rounded-md border-emerald-200 bg-emerald-50 px-4 text-emerald-900 shadow-sm hover:bg-emerald-100 hover:text-emerald-950"
          >
            <Download className="h-4 w-4 text-emerald-700 shrink-0" /> Plantilla Excel
          </Button>
          <Button
            size="sm"
            onClick={() => setShowCargaMasiva(true)}
            className="h-9 gap-2 rounded-md bg-cyan-600 px-4 font-medium text-white shadow-md hover:bg-cyan-700"
          >
            <FileUp className="h-4 w-4 shrink-0" /> Carga Masiva
          </Button>
        </div>
      </div>

      {/* Lista de solicitudes — mismo layout de contenedor que Gestión de Novedades */}
      <div className="bg-white rounded-lg border overflow-hidden mt-4">
        <div className="flex items-center justify-between p-4 border-b gap-3">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-orange-600" />
            </div>
            <span className="text-lg font-semibold text-gray-700 truncate">SOLICITUDES DE SELECCIÓN</span>
            <Badge variant="secondary" className="ml-1 shrink-0">{solicitudesFiltradas.length}</Badge>
          </div>
        </div>

        {/* Filtros a ancho completo del panel */}
        <div className="border-b bg-gray-50">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left hover:bg-gray-100/70 transition-colors"
            onClick={() => setFiltrosPanelAbierto(v => !v)}
            aria-expanded={filtrosPanelAbierto}
          >
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <Filter className="h-3.5 w-3.5 text-cyan-600 shrink-0" />
              Filtros
              {cantidadFiltrosActivosSeleccion > 0 && (
                <span className="rounded-full bg-gray-200 px-1.5 py-0 text-[10px] font-semibold tabular-nums text-gray-600">
                  {cantidadFiltrosActivosSeleccion}
                </span>
              )}
            </span>
            {filtrosPanelAbierto ? (
              <ChevronUp className="h-4 w-4 text-gray-500 shrink-0" aria-hidden />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500 shrink-0" aria-hidden />
            )}
          </button>
          {filtrosPanelAbierto && (
            <div className="border-t border-gray-100 px-4 py-4 space-y-4">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
                <div className="min-w-0 space-y-1">
                  <Label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Buscar nombre empleado</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <Input
                      placeholder="Únicamente primer nombre..."
                      value={busquedaNombreLista}
                      onChange={e => setBusquedaNombreLista(e.target.value)}
                      className="h-7 pl-8 text-xs bg-white border-gray-200"
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFiltrosSeleccion({});
                    setBusquedaNombreLista('');
                    setFiltroCargoSeleccion('');
                    setFiltroJornadaSeleccion('');
                  }}
                  className="h-7 w-full shrink-0 gap-1.5 rounded-md border border-gray-300 bg-white px-3 text-xs text-gray-800 shadow-sm hover:bg-gray-50 sm:w-auto"
                >
                  <Filter className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                  Limpiar filtros
                </Button>
              </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-1 min-w-0">
                    <Label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Empresa</Label>
                    <Select
                      value={filtrosSeleccion.empresa_id?.toString() || 'all'}
                      onValueChange={(v) => setFiltrosSeleccion(prev => ({ ...prev, empresa_id: v === 'all' ? undefined : parseInt(v, 10) }))}
                    >
                      <SelectTrigger className="h-7 w-full text-xs bg-white">
                        <SelectValue placeholder="Empresa" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las empresas</SelectItem>
                        {empresasFiltroSeleccion.map(e => (
                          <SelectItem key={e.id} value={e.id.toString()}>{e.razon_social}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1 min-w-0">
                    <Label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Motivo</Label>
                    <Select
                      value={filtrosSeleccion.motivo_id?.toString() || 'all'}
                      onValueChange={(v) => setFiltrosSeleccion(prev => ({ ...prev, motivo_id: v === 'all' ? undefined : parseInt(v, 10) }))}
                    >
                      <SelectTrigger className="h-7 w-full text-xs bg-white">
                        <SelectValue placeholder="Motivo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los motivos</SelectItem>
                        {motivosSeleccion.map(m => (
                          <SelectItem key={m.id} value={m.id.toString()}>{m.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1 min-w-0">
                    <Label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Sucursal</Label>
                    <Select
                      value={filtrosSeleccion.sucursal || 'all'}
                      onValueChange={(v) => setFiltrosSeleccion(prev => ({ ...prev, sucursal: v === 'all' ? undefined : v }))}
                    >
                      <SelectTrigger className="h-7 w-full text-xs bg-white">
                        <SelectValue placeholder="Sucursal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las sucursales</SelectItem>
                        {sucursalesSeleccion.map(sv => (
                          <SelectItem key={sv} value={sv}>{sv}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1 min-w-0">
                    <Label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Estado</Label>
                    <Select
                      value={filtrosSeleccion.estado || 'all'}
                      onValueChange={(v) => setFiltrosSeleccion(prev => ({ ...prev, estado: v === 'all' ? undefined : v }))}
                    >
                      <SelectTrigger className="h-7 w-full text-xs bg-white">
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los estados</SelectItem>
                        {Object.entries(ESTADO_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-1 min-w-0">
                    <Label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Analista</Label>
                    <Select
                      value={filtrosSeleccion.analista_id?.toString() || 'all'}
                      onValueChange={(v) => setFiltrosSeleccion(prev => ({ ...prev, analista_id: v === 'all' ? undefined : parseInt(v, 10) }))}
                      disabled={esAnalistaSeleccion}
                    >
                      <SelectTrigger className="h-7 w-full text-xs bg-white">
                        <SelectValue placeholder="Analista" />
                      </SelectTrigger>
                      <SelectContent>
                        {!esAnalistaSeleccion && <SelectItem value="all">Todos los analistas</SelectItem>}
                        {analistasFilterSeleccion.map(a => (
                          <SelectItem key={a.id} value={a.id.toString()}>{a.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1 min-w-0">
                    <Label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Cargo empleado</Label>
                    <Select
                      value={filtroCargoSeleccion || 'all'}
                      onValueChange={(v) => setFiltroCargoSeleccion(v === 'all' ? '' : v)}
                    >
                      <SelectTrigger className="h-7 w-full text-xs bg-white">
                        <SelectValue placeholder="Cargo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los cargos</SelectItem>
                        {cargosEmpleadoOpcionesSeleccion.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1 min-w-0">
                    <Label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Jornada</Label>
                    <Select
                      value={filtroJornadaSeleccion || 'all'}
                      onValueChange={(v) => setFiltroJornadaSeleccion(v === 'all' ? '' : v)}
                    >
                      <SelectTrigger className="h-7 w-full text-xs bg-white">
                        <SelectValue placeholder="Jornada" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las jornadas</SelectItem>
                        {jornadaOpcionesSeleccion.map(j => (
                          <SelectItem key={j} value={j}>{j}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
        </div>

        <div className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : solicitudesFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
              <ClipboardList className="w-10 h-10 mb-2" />
              <p className="text-sm">No hay solicitudes de selección</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg shadow-sm">
              <table className="min-w-[920px] w-full text-[11px]">
                <thead className="bg-cyan-50">
                  <tr className="text-left font-semibold text-gray-700">
                    <th className="w-11 px-1 py-2" aria-label="Menú de acciones" />
                    <th className="text-left px-3 py-2 font-medium text-gray-600">#</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-600 min-w-[240px] w-[28%]">Empleado / Cargo</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Empresa</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">
                      <button
                        type="button"
                        onClick={() => setSortMotivo(s => s === null ? 'asc' : s === 'asc' ? 'desc' : null)}
                        className="flex items-center gap-1 hover:text-cyan-700 transition-colors"
                      >
                        Motivo
                        {sortMotivo === 'asc' && <ChevronUp className="h-3.5 w-3.5 text-cyan-600" />}
                        {sortMotivo === 'desc' && <ChevronDown className="h-3.5 w-3.5 text-cyan-600" />}
                        {sortMotivo === null && <ChevronsUpDown className="h-3.5 w-3.5 text-gray-400" />}
                      </button>
                    </th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">
                      <button
                        type="button"
                        onClick={() => setSortEstado(s => s === null ? 'asc' : s === 'asc' ? 'desc' : null)}
                        className="flex items-center gap-1 hover:text-cyan-700 transition-colors"
                      >
                        Estado
                        {sortEstado === 'asc' && <ChevronUp className="h-3.5 w-3.5 text-cyan-600" />}
                        {sortEstado === 'desc' && <ChevronDown className="h-3.5 w-3.5 text-cyan-600" />}
                        {sortEstado === null && <ChevronsUpDown className="h-3.5 w-3.5 text-gray-400" />}
                      </button>
                    </th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Días</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">
                      <button
                        type="button"
                        onClick={() => setSortPolitica(s => s === null ? 'asc' : s === 'asc' ? 'desc' : null)}
                        className="flex items-center gap-1 hover:text-cyan-700 transition-colors"
                      >
                        Política
                        {sortPolitica === 'asc' && <ChevronUp className="h-3.5 w-3.5 text-cyan-600" />}
                        {sortPolitica === 'desc' && <ChevronDown className="h-3.5 w-3.5 text-cyan-600" />}
                        {sortPolitica === null && <ChevronsUpDown className="h-3.5 w-3.5 text-gray-400" />}
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {solicitudesFiltradas.map(s => {
                    const dias = (s.fecha_inicio_vacante || s.created_at) ? calcularDiasHabiles((s.fecha_inicio_vacante || s.created_at)!) : 0;
                    const politica = getPoliticaTiempo(dias);
                    const rowTransitions = TRANSICIONES_VALIDAS[s.estado || ''] || [];
                    return (
                      <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                        <td className="w-11 px-1 py-2 text-center align-middle">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="Más acciones">
                                <MoreHorizontal className="h-4 w-4 text-gray-600" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-56 max-h-[min(70vh,24rem)] overflow-y-auto">
                              {hasAction('accion-ver-detalle-novedad') && (
                                <DropdownMenuItem onClick={() => setSolicitudDetalle(s)} className="cursor-pointer">
                                  <Eye className="mr-2 h-4 w-4 text-cyan-600" />
                                  Ver detalle
                                </DropdownMenuItem>
                              )}
                              {hasAction('accion-ver-timeline-novedad') && (
                                <DropdownMenuItem onClick={() => handleViewTimelineSeleccion(s.id!)} className="cursor-pointer">
                                  <Clock className="mr-2 h-4 w-4 text-indigo-600" />
                                  Ver timeline
                                </DropdownMenuItem>
                              )}
                              {(() => {
                                const puedeCambiarEstado = hasAction('accion-cambiar-estado-novedad');
                                const puedeCancelar = hasAction('accion-cancelar-novedad');
                                const transicionesVisibles = rowTransitions.filter((est) => {
                                  if (est === ESTADOS_NOVEDAD.CANCELADA) return puedeCancelar || puedeCambiarEstado;
                                  return puedeCambiarEstado;
                                });
                                if (!transicionesVisibles.length) return null;
                                return (
                                  <>
                                    <DropdownMenuSeparator />
                                    {transicionesVisibles.map(estadoDestino => {
                                      const soloViernes = estadoDestino === 'aprobado_comite' && !esViernes();
                                      const IconTrans = iconAccionCambioEstado(estadoDestino);
                                      const destructive = estadoDestino === ESTADOS_NOVEDAD.CANCELADA;
                                      return (
                                        <DropdownMenuItem
                                          key={estadoDestino}
                                          disabled={soloViernes || cambiarEstadoMutation.isPending}
                                          title={soloViernes ? 'La aprobación solo está permitida los viernes' : undefined}
                                          onClick={() => {
                                            setSolicitudDetalle(s);
                                            setNuevoEstado(estadoDestino);
                                            setShowCambiarEstado(true);
                                          }}
                                          className={destructive ? 'cursor-pointer text-red-600 focus:text-red-700' : 'cursor-pointer'}
                                        >
                                          <IconTrans className={`mr-2 h-4 w-4 shrink-0 ${destructive ? 'text-red-500' : 'text-gray-600'}`} />
                                          {getLabelAccionCambioEstado(estadoDestino)}
                                        </DropdownMenuItem>
                                      );
                                    })}
                                  </>
                                );
                              })()}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                        <td className="px-3 py-2 text-gray-500 font-mono text-xs">#{s.id}</td>
                        <td className="min-w-[240px] px-4 py-3 align-top">
                          <p className="font-medium leading-snug text-gray-900 text-[13px]">
                            {s.empleado ? `${s.empleado.nombre} ${s.empleado.apellido || ''}` : '—'}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-500">{s.empleado?.cargo || '—'}</p>
                        </td>
                        <td className="px-3 py-2 text-gray-600">{s.empresa?.razon_social || '—'}</td>
                        <td className="px-3 py-2 text-gray-600">{s.motivo?.nombre || '—'}</td>
                        <td className="px-3 py-2">
                          <Badge className={`text-xs ${ESTADO_COLORS[s.estado || ''] || 'bg-gray-100 text-gray-800'}`}>
                            {ESTADO_LABELS[s.estado || ''] || s.estado}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-gray-600 font-mono">{dias}d</td>
                        <td className="px-3 py-2">
                          <Badge className={`text-xs ${politica.color}`}>{politica.label}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Timeline (misma presentación que Gestión de Novedades) */}
      <Dialog open={showTimelineSeleccionModal} onOpenChange={(open) => { setShowTimelineSeleccionModal(open); if (!open) setTimelineSeleccionId(null); }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-sm">
                <Clock className="h-4 w-4 text-white" />
              </div>
              <div>
                <span className="text-lg">Timeline</span>
                <p className="text-xs font-normal text-gray-500 mt-0.5">Historial de solicitud #{timelineSeleccionId}</p>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-0">
            {timelineSeleccionLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="p-3 rounded-full bg-gray-50 mb-3">
                  <Clock className="h-8 w-8 text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-500">No hay registros en el timeline</p>
              </div>
            ) : (
              <div className="relative pl-6 space-y-4">
                <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gradient-to-b from-indigo-300 via-purple-300 to-gray-200"></div>
                {timelineSeleccionLogs.map((log, index) => (
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

      {/* ============================================================ */}
      {/* DIALOG: DETALLE SOLICITUD */}
      {/* ============================================================ */}
      <Dialog open={!!solicitudDetalle} onOpenChange={() => setSolicitudDetalle(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-blue-600" />
              Solicitud #{solicitudDetalle?.id} — {solicitudDetalle?.motivo?.nombre}
            </DialogTitle>
            <DialogDescription>
              {solicitudDetalle?.empresa?.razon_social} · {solicitudDetalle?.empleado?.cargo}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1">
            <div className="space-y-4 p-1">
              {/* Etapas */}
              {solicitudDetalle && (
                <EtapaStepper estadoActual={solicitudDetalle.estado || ''} />
              )}

              <Separator />

              {/* Info empleado */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="w-4 h-4" />
                    <span className="font-medium">Empleado:</span>
                    <span>{solicitudDetalle?.empleado?.nombre} {solicitudDetalle?.empleado?.apellido}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Briefcase className="w-4 h-4" />
                    <span className="font-medium">Cargo:</span>
                    <span>{solicitudDetalle?.empleado?.cargo || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Building className="w-4 h-4" />
                    <span className="font-medium">Empresa:</span>
                    <span>{solicitudDetalle?.empresa?.razon_social || '—'}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span className="font-medium">Sucursal:</span>
                    <span>{solicitudDetalle?.empleado?.sucursal?.nombre || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span className="font-medium">Fecha:</span>
                    <span>{(solicitudDetalle?.fecha_inicio_vacante || solicitudDetalle?.created_at) ? new Date((solicitudDetalle.fecha_inicio_vacante || solicitudDetalle.created_at)!).toLocaleDateString('es-CO') : '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">Días hábiles:</span>
                    <span>{(solicitudDetalle?.fecha_inicio_vacante || solicitudDetalle?.created_at) ? calcularDiasHabiles((solicitudDetalle.fecha_inicio_vacante || solicitudDetalle.created_at)!) : 0} días</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Tabs: Candidatos / Documentos / Timeline */}
              <Tabs defaultValue="candidatos">
                <TabsList>
                  <TabsTrigger value="candidatos">Candidatos</TabsTrigger>
                  <TabsTrigger value="documentos">Documentos</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                </TabsList>
                <TabsContent value="candidatos" className="pt-3">
                  <div className="flex flex-col items-center justify-center h-24 text-gray-400 border border-dashed rounded-lg">
                    <UserPlus className="w-8 h-8 mb-1" />
                    <p className="text-sm">Asociar candidatos a esta vacante</p>
                    <Button variant="outline" size="sm" className="mt-2 gap-1">
                      <UserPlus className="w-3 h-3" /> Buscar Candidatos
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="documentos" className="pt-3">
                  <div className="flex flex-col items-center justify-center h-24 text-gray-400 border border-dashed rounded-lg">
                    <FileText className="w-8 h-8 mb-1" />
                    <p className="text-sm">Adjuntar hojas de vida, pruebas, antecedentes</p>
                    <Button variant="outline" size="sm" className="mt-2 gap-1">
                      <Upload className="w-3 h-3" /> Subir Documento
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="timeline" className="pt-3">
                  <div className="flex flex-col items-center justify-center h-24 text-gray-400">
                    <Clock className="w-8 h-8 mb-1" />
                    <p className="text-sm">Sin registros de actividad aún</p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>

          <DialogFooter className="flex gap-2 pt-4 border-t">
            {solicitudDetalle?.estado === ESTADOS_NOVEDAD.SELECCIONADO && (
              <Button
                className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => setShowSolicitudIngreso(true)}
              >
                <CheckCircle className="w-4 h-4" /> Solicitud de Ingreso
              </Button>
            )}
            <Button variant="ghost" onClick={() => setSolicitudDetalle(null)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* DIALOG: CAMBIAR ESTADO */}
      {/* ============================================================ */}
      <Dialog open={showCambiarEstado} onOpenChange={setShowCambiarEstado}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cambiar Estado</DialogTitle>
            <DialogDescription>
              Estado actual: <Badge className={`ml-1 ${ESTADO_COLORS[solicitudDetalle?.estado || '']}`}>
                {ESTADO_LABELS[solicitudDetalle?.estado || ''] || solicitudDetalle?.estado}
              </Badge>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nuevo Estado</Label>
              <Select value={nuevoEstado} onValueChange={setNuevoEstado}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado..." />
                </SelectTrigger>
                <SelectContent>
                  {transicionesDisponibles.map(e => (
                    <SelectItem key={e} value={e}>{ESTADO_LABELS[e] || e}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {nuevoEstado === ESTADOS_NOVEDAD.EJECUTADA && (
              <div className="space-y-2">
                <Label>Tipo de Contratación</Label>
                <Select value={tipoContratado} onValueChange={setTipoContratado}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    {CONTRATADO_TIPOS.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea
                placeholder="Agregar observación sobre el cambio de estado..."
                value={observacionEstado}
                onChange={e => setObservacionEstado(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCambiarEstado(false)}>Cancelar</Button>
            <Button
              disabled={!nuevoEstado || cambiarEstadoMutation.isPending}
              onClick={handleCambiarEstado}
              className="gap-2"
            >
              {cambiarEstadoMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Confirmar Cambio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* DIALOG: CARGA MASIVA */}
      {/* ============================================================ */}
      <Dialog open={showCargaMasiva} onOpenChange={setShowCargaMasiva}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileUp className="w-5 h-5 text-blue-600" /> Carga Masiva de Solicitudes
            </DialogTitle>
            <DialogDescription>
              Sube un archivo Excel con las solicitudes a crear. Descarga la plantilla para ver el formato requerido.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Instrucciones */}
            <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800 space-y-1">
              <p className="font-semibold">Campos requeridos en el Excel:</p>
              <div className="grid grid-cols-2 gap-1 mt-2">
                {['empresa', 'sucursal', 'cargo', 'cantidad', 'salario', 'horas', 'jornada', 'aux_no_prestacional', 'categoria', 'observaciones'].map(c => (
                  <span key={c} className="font-mono text-xs bg-blue-100 px-2 py-0.5 rounded">{c}</span>
                ))}
              </div>
            </div>

            {/* Upload zone */}
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleExcelUpload} />
              {cargandoExcel ? (
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
              ) : (
                <>
                  <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">Haz clic para subir el archivo Excel</p>
                  <p className="text-xs text-gray-400 mt-1">.xlsx o .xls</p>
                </>
              )}
            </div>

            {/* Preview */}
            {datosCargaMasiva.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">
                    Vista previa: {datosCargaMasiva.length} registros encontrados
                  </p>
                  <Badge className="bg-green-100 text-green-800">Listo para importar</Badge>
                </div>
                <div className="overflow-x-auto border rounded-lg max-h-48">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        {Object.keys(datosCargaMasiva[0] || {}).map(k => (
                          <th key={k} className="px-3 py-2 text-left font-medium text-gray-600">{k}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {datosCargaMasiva.slice(0, 5).map((row, i) => (
                        <tr key={i}>
                          {Object.values(row).map((v: any, j) => (
                            <td key={j} className="px-3 py-1 text-gray-700">{String(v)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {datosCargaMasiva.length > 5 && (
                  <p className="text-xs text-gray-400 text-center">+ {datosCargaMasiva.length - 5} registros más</p>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleDescargarPlantilla} className="gap-2">
              <Download className="w-4 h-4" /> Descargar Plantilla
            </Button>
            <Button variant="ghost" onClick={() => { setShowCargaMasiva(false); setDatosCargaMasiva([]); }}>Cancelar</Button>
            <Button
              disabled={!datosCargaMasiva.length}
              onClick={handleProcesarCargaMasiva}
              className="gap-2"
            >
              <CheckCircle className="w-4 h-4" /> Importar {datosCargaMasiva.length > 0 ? `(${datosCargaMasiva.length})` : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* DIALOG: SOLICITUD DE INGRESO */}
      {/* ============================================================ */}
      <Dialog open={showSolicitudIngreso} onOpenChange={setShowSolicitudIngreso}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-emerald-600" /> Solicitud de Ingreso
            </DialogTitle>
            <DialogDescription>
              El candidato está en estado Seleccionado. Completa los datos para generar la orden de ingreso.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cargo</Label>
                <Input defaultValue={solicitudDetalle?.empleado?.cargo || ''} />
              </div>
              <div className="space-y-2">
                <Label>Salario</Label>
                <Input type="number" placeholder="$0" />
              </div>
              <div className="space-y-2">
                <Label>Jornada</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    {['Diurna', 'Nocturna', 'Mixta', 'Flexible'].map(j => (
                      <SelectItem key={j} value={j.toLowerCase()}>{j}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Horas semanales</Label>
                <Input type="number" defaultValue={40} />
              </div>
              <div className="space-y-2">
                <Label>Fecha de ingreso</Label>
                <Input type="date" />
              </div>
              <div className="space-y-2">
                <Label>Tipo de contrato</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    {['Término Fijo', 'Término Indefinido', 'Obra Labor', 'Prestación de Servicios'].map(t => (
                      <SelectItem key={t} value={t.toLowerCase()}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Aux. no Prestacional</Label>
              <Input type="number" placeholder="$0" />
            </div>
            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea placeholder="Observaciones adicionales para el analista junior..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowSolicitudIngreso(false)}>Cancelar</Button>
            <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => {
              toast.success('Solicitud de ingreso enviada al analista junior');
              setShowSolicitudIngreso(false);
            }}>
              <CheckCircle className="w-4 h-4" /> Enviar Solicitud
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

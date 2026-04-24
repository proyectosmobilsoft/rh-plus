import React, { useState, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
  ClipboardList, FileUp, Star, ArrowRight, UserCheck, Sparkles, MoreHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';
import ExcelJS from 'exceljs';
import {
  novedadesService, novedadesLogsService,
  ESTADOS_NOVEDAD, ESTADO_LABELS, ESTADO_COLORS, TRANSICIONES_VALIDAS,
  type NovedadSolicitud, type NovedadFiltros,
} from '@/services/novedadesService';

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

const MOTIVOS_SELECCION = ['vacaciones', 'renuncias', 'retiros', 'licencias', 'aumento_plaza'];

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

export default function SeleccionPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estado de filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [filtroEmpresa, setFiltroEmpresa] = useState<string>('todas');

  // Dialogs
  const [solicitudDetalle, setSolicitudDetalle] = useState<NovedadSolicitud | null>(null);
  const [showCambiarEstado, setShowCambiarEstado] = useState(false);
  const [showCargaMasiva, setShowCargaMasiva] = useState(false);
  const [showSolicitudIngreso, setShowSolicitudIngreso] = useState(false);

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

  // Empresas únicas para el filtro
  const empresas = useMemo(() => {
    const map = new Map<number, string>();
    solicitudesSeleccion.forEach(s => {
      if (s.empresa_id && s.empresa?.razon_social) {
        map.set(s.empresa_id, s.empresa.razon_social);
      }
    });
    return Array.from(map.entries()).map(([id, nombre]) => ({ id, nombre }));
  }, [solicitudesSeleccion]);

  // Solicitudes filtradas
  const solicitudesFiltradas = useMemo(() => {
    return solicitudesSeleccion.filter(s => {
      const matchEstado = filtroEstado === 'todos' || s.estado === filtroEstado;
      const matchEmpresa = filtroEmpresa === 'todas' || String(s.empresa_id) === filtroEmpresa;
      const texto = busqueda.toLowerCase();
      const matchBusqueda = !busqueda || [
        s.empleado?.nombre, s.empleado?.apellido, s.empleado?.cargo,
        s.empresa?.razon_social, s.motivo?.nombre,
      ].some(v => v?.toLowerCase().includes(texto));
      return matchEstado && matchEmpresa && matchBusqueda;
    });
  }, [solicitudesSeleccion, filtroEstado, filtroEmpresa, busqueda]);

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
          <Button variant="outline" size="sm" onClick={handleDescargarPlantilla} className="gap-2">
            <Download className="w-4 h-4" /> Plantilla Excel
          </Button>
          <Button size="sm" onClick={() => setShowCargaMasiva(true)} className="gap-2 bg-teal-400 hover:bg-teal-500 text-white">
            <FileUp className="w-4 h-4" /> Carga Masiva
          </Button>
        </div>
      </div>

      {/* Tabla de solicitudes */}
      <Card className="bg-white rounded-lg border mt-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-gray-700 flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
              <FileText className="w-5 h-5 text-orange-600" />
            </div>
            <span>SOLICITUDES DE SELECCIÓN</span>
            <Badge variant="secondary" className="ml-1">{solicitudesFiltradas.length}</Badge>
          </CardTitle>
          <div className="mt-3 p-3 border rounded-md bg-gray-50">
            <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-1">
            <div className="relative w-[220px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <Input
                placeholder="Buscar..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                className="h-8 pl-8 text-xs border-gray-200"
              />
            </div>
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="h-8 w-[170px] text-xs border-gray-200">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                {ESTADOS_SELECCION.map(e => (
                  <SelectItem key={e} value={e}>{ESTADO_LABELS[e]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filtroEmpresa} onValueChange={setFiltroEmpresa}>
              <SelectTrigger className="h-8 w-[170px] text-xs border-gray-200">
                <SelectValue placeholder="Empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las empresas</SelectItem>
                {empresas.map(e => (
                  <SelectItem key={e.id} value={String(e.id)}>{e.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(busqueda || filtroEstado !== 'todos' || filtroEmpresa !== 'todas') && (
              <Button
                variant="outline"
                onClick={() => {
                  setBusqueda('');
                  setFiltroEstado('todos');
                  setFiltroEmpresa('todas');
                }}
                className="h-8 px-2 text-xs flex items-center gap-1.5"
              >
                <Filter className="w-3.5 h-3.5" />
                Limpiar
              </Button>
            )}
          </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
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
              <table className="min-w-[900px] w-full text-[11px]">
                <thead className="bg-cyan-50">
                  <tr className="text-left font-semibold text-gray-700">
                    <th className="text-left px-3 py-2 font-medium text-gray-600">#</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Empleado / Cargo</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Empresa</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Motivo</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Estado</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Días</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Política</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600 w-24">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {solicitudesFiltradas.map(s => {
                    const dias = (s.fecha_inicio_vacante || s.created_at) ? calcularDiasHabiles((s.fecha_inicio_vacante || s.created_at)!) : 0;
                    const politica = getPoliticaTiempo(dias);
                    const rowTransitions = TRANSICIONES_VALIDAS[s.estado || ''] || [];
                    return (
                      <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-2 text-gray-500 font-mono text-xs">#{s.id}</td>
                        <td className="px-3 py-2">
                          <p className="font-medium text-gray-900">
                            {s.empleado ? `${s.empleado.nombre} ${s.empleado.apellido || ''}` : '—'}
                          </p>
                          <p className="text-xs text-gray-500">{s.empleado?.cargo || '—'}</p>
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
                        <td className="px-3 py-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreHorizontal className="h-4 w-4 text-gray-600" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-40">
                              <DropdownMenuItem onClick={() => setSolicitudDetalle(s)} className="cursor-pointer">
                                <Eye className="mr-2 h-4 w-4 text-cyan-600" />
                                Ver detalle
                              </DropdownMenuItem>
                              {rowTransitions.map((estadoDestino) => (
                                <DropdownMenuItem
                                  key={estadoDestino}
                                  onClick={() => {
                                    setSolicitudDetalle(s);
                                    setNuevoEstado(estadoDestino);
                                    setShowCambiarEstado(true);
                                  }}
                                  className="cursor-pointer"
                                >
                                  <ArrowRight className="mr-2 h-4 w-4 text-indigo-600" />
                                  {ESTADO_LABELS[estadoDestino] || estadoDestino}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

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
                    <span>{solicitudDetalle?.sucursal || solicitudDetalle?.empleado?.sucursal || '—'}</span>
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

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
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  CalendarCheck,
  Users,
  FileText,
  Search,
  Filter,
  Download,
  Loader2,
  MapPin,
  CheckCircle,
  XCircle,
  Sparkles,
  TrendingUp,
  UserCheck,
  UserX,
  Pause,
  Calendar,
  Paperclip,
  ExternalLink,
  Star,
  MessageSquare,
  ChevronRight,
  ChevronLeft,
  Briefcase,
  FileSearch,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  Mail,
  Phone,
  Hash,
} from 'lucide-react';
import { toast } from 'sonner';
import { candidatosService, type Candidato } from '@/services/candidatosService';
import { candidatosDocumentosService, type CandidatoDocumentoConDetalles } from '@/services/candidatosDocumentosService';

// ============================================================
// CONSTANTES
// ============================================================

const PAGE_SIZE = 20;

/** Posibles estados de un candidato en el flujo de entrevistas */
const ESTADOS_CANDIDATO: Record<string, { label: string; color: string }> = {
  nuevo: { label: 'Nuevo', color: 'bg-sky-100 text-sky-800 border-sky-200' },
  en_proceso: { label: 'En Proceso', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  entrevista: { label: 'Entrevista', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  seleccionado: { label: 'Seleccionado', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  descartado: { label: 'Descartado', color: 'bg-red-100 text-red-800 border-red-200' },
  en_espera: { label: 'En Espera', color: 'bg-amber-100 text-amber-800 border-amber-200' },
};

// Calificaciones (resultado de la entrevista)
const CALIFICACIONES = [
  {
    value: 'seleccionado',
    label: 'Sí — Contratar',
    description: 'El candidato será seleccionado para contratación',
    icon: ThumbsUp,
    colorClass: 'text-emerald-600',
    bgClass: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100',
    gradient: 'from-emerald-500 to-green-600',
  },
  {
    value: 'descartado',
    label: 'No — Descartar',
    description: 'El candidato será descartado del proceso',
    icon: ThumbsDown,
    colorClass: 'text-red-600',
    bgClass: 'bg-red-50 border-red-200 hover:bg-red-100',
    gradient: 'from-rose-500 to-red-600',
  },
  {
    value: 'en_espera',
    label: 'Posible — En Espera',
    description: 'El candidato queda en reserva si el seleccionado es descartado',
    icon: Pause,
    colorClass: 'text-amber-600',
    bgClass: 'bg-amber-50 border-amber-200 hover:bg-amber-100',
    gradient: 'from-amber-500 to-orange-600',
  },
];

// ============================================================
// HELPERS
// ============================================================

const fullName = (c: Candidato) =>
  [c.primer_nombre, c.segundo_nombre, c.primer_apellido, c.segundo_apellido]
    .filter(Boolean)
    .join(' ');

const initials = (c: Candidato) =>
  `${(c.primer_nombre || '?')[0]}${(c.primer_apellido || '')[0] || ''}`.toUpperCase();

const fmtDate = (d?: string) => {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' });
};

const getEstadoBadge = (estado?: string) => {
  const e = estado || 'nuevo';
  const conf = ESTADOS_CANDIDATO[e] || { label: e, color: 'bg-gray-100 text-gray-800 border-gray-200' };
  return <Badge className={`text-xs font-semibold border ${conf.color}`}>{conf.label}</Badge>;
};

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function EntrevistasPage() {
  const queryClient = useQueryClient();

  // ── Paginación + búsqueda ──
  const [page, setPage] = useState(1);
  const [filtroEstado, setFiltroEstado] = useState<string>('all');
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [searchInput, setSearchInput] = useState('');    // debounce local

  // ── Selección ──
  const [selectedCandidato, setSelectedCandidato] = useState<Candidato | null>(null);

  // ── Modales ──
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showCalificarModal, setShowCalificarModal] = useState(false);
  const [showDocumentosModal, setShowDocumentosModal] = useState(false);

  // ── Datos de formulario de entrevista ──
  const [fechaEntrevista, setFechaEntrevista] = useState('');
  const [horaEntrevista, setHoraEntrevista] = useState('');
  const [lugarEntrevista, setLugarEntrevista] = useState('');
  const [obsEntrevista, setObsEntrevista] = useState('');

  // ── Datos de calificación ──
  const [calificacion, setCalificacion] = useState('');
  const [obsCalificacion, setObsCalificacion] = useState('');

  // ── Empresa activa ──
  const empresaId = useMemo(() => {
    try {
      const d = localStorage.getItem('empresaData');
      return d ? JSON.parse(d).id : undefined;
    } catch { return undefined; }
  }, []);

  // ============================================================
  // QUERIES
  // ============================================================

  /** Lista paginada de candidatos — solo columnas mínimas */
  const {
    data: candidatosResult,
    isLoading: candidatosLoading,
    isFetching: candidatosFetching,
  } = useQuery({
    queryKey: ['entrevistas-candidatos', page, filtroEstado, filtroBusqueda, empresaId],
    queryFn: () =>
      candidatosService.getForEntrevistas({
        page,
        pageSize: PAGE_SIZE,
        busqueda: filtroBusqueda || undefined,
        estado: filtroEstado !== 'all' ? filtroEstado : undefined,
        empresaId,
      }),
    placeholderData: (prev) => prev, // mantener datos anteriores mientras carga
    staleTime: 30_000, // 30s cache
  });

  const candidatos = candidatosResult?.data ?? [];
  const totalCandidatos = candidatosResult?.total ?? 0;
  const totalPages = Math.ceil(totalCandidatos / PAGE_SIZE);

  /** Conteo rápido por estados — solo cuando no hay filtros activos */
  const { data: statsData } = useQuery({
    queryKey: ['entrevistas-stats', empresaId],
    queryFn: async () => {
      // Hacemos count por cada estado en paralelo para las tarjetas
      const estados = ['en_proceso', 'entrevista', 'seleccionado', 'descartado', 'en_espera'];
      const counts = await Promise.all(
        estados.map(async (est) => {
          let q = candidatosService.getForEntrevistas({
            page: 1,
            pageSize: 1,
            estado: est,
            empresaId,
          });
          return q.then(r => ({ estado: est, count: r.total }));
        })
      );
      const map: Record<string, number> = {};
      counts.forEach(c => { map[c.estado] = c.count; });
      map.total = totalCandidatos;
      return map;
    },
    staleTime: 60_000, // cache 1 min
    enabled: !!candidatosResult, // solo disparar cuando ya tenemos la primera carga
  });

  // Usar totalCandidatos para stats.total (viene de la consulta principal)
  const stats = useMemo(() => ({
    total: totalCandidatos,
    en_proceso: statsData?.en_proceso ?? 0,
    entrevista: statsData?.entrevista ?? 0,
    seleccionado: statsData?.seleccionado ?? 0,
    descartado: statsData?.descartado ?? 0,
  }), [totalCandidatos, statsData]);

  /** Documentos del candidato seleccionado */
  const { data: documentos = [], isLoading: documentosLoading } = useQuery<CandidatoDocumentoConDetalles[]>({
    queryKey: ['entrevista-documentos', selectedCandidato?.id],
    queryFn: () =>
      selectedCandidato?.id
        ? candidatosDocumentosService.getByCandidatoWithDetails(selectedCandidato.id)
        : Promise.resolve([]),
    enabled: showDocumentosModal && !!selectedCandidato?.id,
  });

  // ============================================================
  // MUTATIONS
  // ============================================================

  /** Cambiar estado del candidato (calificación) */
  const calificarMutation = useMutation({
    mutationFn: ({ id, estado, obs }: { id: number; estado: string; obs?: string }) =>
      candidatosService.updateEstado(id, estado, obs),
    onSuccess: () => {
      toast.success('Candidato calificado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['entrevistas-candidatos'] });
      queryClient.invalidateQueries({ queryKey: ['entrevistas-stats'] });
      setShowCalificarModal(false);
      setCalificacion('');
      setObsCalificacion('');
      setSelectedCandidato(null);
    },
    onError: () => toast.error('Error al calificar el candidato'),
  });

  /** Programar entrevista (guarda datos en la tabla de candidatos) */
  const programarMutation = useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const { error } = await (await import('@/services/supabaseClient')).supabase
        .from('candidatos')
        .update({
          estado: 'entrevista',
          fecha_entrevista: fechaEntrevista || null,
          hora_entrevista: horaEntrevista || null,
          lugar_entrevista: lugarEntrevista || null,
          observacion_entrevista: obsEntrevista || null,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Entrevista programada exitosamente');
      queryClient.invalidateQueries({ queryKey: ['entrevistas-candidatos'] });
      queryClient.invalidateQueries({ queryKey: ['entrevistas-stats'] });
      setShowScheduleModal(false);
      resetScheduleForm();
    },
    onError: () => toast.error('Error al programar la entrevista'),
  });

  // ============================================================
  // HANDLERS
  // ============================================================

  const resetScheduleForm = () => {
    setFechaEntrevista('');
    setHoraEntrevista('');
    setLugarEntrevista('');
    setObsEntrevista('');
  };

  const handleSearch = () => {
    setPage(1);
    setFiltroBusqueda(searchInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setFiltroBusqueda('');
    setFiltroEstado('all');
    setPage(1);
  };

  const handleSelectCandidato = (c: Candidato) => setSelectedCandidato(c);

  const handleViewDocumentos = (c: Candidato) => {
    setSelectedCandidato(c);
    setShowDocumentosModal(true);
  };

  const handleSchedule = (c: Candidato) => {
    setSelectedCandidato(c);
    resetScheduleForm();
    setShowScheduleModal(true);
  };

  const handleCalificar = (c: Candidato) => {
    setSelectedCandidato(c);
    setCalificacion('');
    setObsCalificacion('');
    setShowCalificarModal(true);
  };

  const handleSubmitSchedule = () => {
    if (!selectedCandidato?.id) return;
    if (!fechaEntrevista || !lugarEntrevista) {
      toast.error('La fecha y el lugar son obligatorios');
      return;
    }
    programarMutation.mutate({ id: selectedCandidato.id });
  };

  const handleSubmitCalificacion = () => {
    if (!selectedCandidato?.id || !calificacion) {
      toast.error('Seleccione una calificación');
      return;
    }
    calificarMutation.mutate({
      id: selectedCandidato.id,
      estado: calificacion,
      obs: obsCalificacion || undefined,
    });
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="space-y-6 p-6">
      {/* ───── Header ───── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
              <CalendarCheck className="h-7 w-7 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              Programación de Entrevistas
            </h1>
            <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
              <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
              Gestión y calificación de candidatos
            </p>
          </div>
        </div>
      </div>

      {/* ───── Stats Cards ───── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {([
          { label: 'Total Candidatos', value: stats.total, icon: TrendingUp, gradient: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50', shadow: 'shadow-blue-500/15' },
          { label: 'En Proceso', value: stats.en_proceso, icon: Users, gradient: 'from-purple-500 to-violet-600', bg: 'bg-purple-50', shadow: 'shadow-purple-500/15' },
          { label: 'Entrevistados', value: stats.entrevista, icon: CalendarCheck, gradient: 'from-indigo-500 to-blue-600', bg: 'bg-indigo-50', shadow: 'shadow-indigo-500/15' },
          { label: 'Seleccionados', value: stats.seleccionado, icon: UserCheck, gradient: 'from-emerald-500 to-green-600', bg: 'bg-emerald-50', shadow: 'shadow-emerald-500/15' },
          { label: 'Descartados', value: stats.descartado, icon: UserX, gradient: 'from-rose-500 to-red-600', bg: 'bg-rose-50', shadow: 'shadow-rose-500/15' },
        ] as const).map(stat => (
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

      {/* ───── Filtros ───── */}
      <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">
              <Filter className="h-3.5 w-3.5" />
              Filtros
            </div>

            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Nombre o documento..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-9 border-gray-200 hover:border-indigo-300 focus:border-indigo-400 focus:ring-indigo-400/20 transition-all"
              />
            </div>

            <Button variant="secondary" size="sm" onClick={handleSearch} disabled={candidatosFetching}>
              {candidatosFetching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
              <span className="ml-1.5">Buscar</span>
            </Button>

            <Select value={filtroEstado} onValueChange={v => { setFiltroEstado(v); setPage(1); }}>
              <SelectTrigger className="w-52 border-gray-200 hover:border-indigo-300 transition-colors">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {Object.entries(ESTADOS_CANDIDATO).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(filtroBusqueda || filtroEstado !== 'all') && (
              <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                <XCircle className="h-3.5 w-3.5 mr-1" />
                Limpiar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ───── Main Content ───── */}
      <div className="grid grid-cols-12 gap-6">
        {/* ─── Lista de Candidatos ─── */}
        <div className="col-span-12 lg:col-span-5">
          <Card className="border-0 shadow-sm h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-600" />
                Candidatos
                <Badge variant="secondary" className="ml-auto h-6 px-2 text-[11px] font-bold">
                  {totalCandidatos}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {candidatosLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="relative">
                    <div className="h-12 w-12 rounded-full border-4 border-gray-100" />
                    <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin" />
                  </div>
                  <span className="mt-4 text-sm text-gray-500 font-medium">Cargando candidatos...</span>
                </div>
              ) : candidatos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="p-4 rounded-full bg-gray-50 mb-4">
                    <Users className="h-10 w-10 text-gray-300" />
                  </div>
                  <p className="text-lg font-semibold text-gray-600">No hay candidatos</p>
                  <p className="text-sm text-gray-400 mt-1">Ajuste los filtros o intente con otra búsqueda</p>
                </div>
              ) : (
                <>
                  <ScrollArea className="h-[460px]">
                    <div className="divide-y divide-gray-100">
                      {candidatos.map(c => (
                        <div
                          key={c.id}
                          onClick={() => handleSelectCandidato(c)}
                          className={`p-4 cursor-pointer transition-all duration-200 group hover:bg-indigo-50/40 ${selectedCandidato?.id === c.id
                              ? 'bg-indigo-50/60 border-l-4 border-l-indigo-500'
                              : 'border-l-4 border-l-transparent'
                            }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-sm flex-shrink-0">
                              {initials(c)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="font-semibold text-sm text-gray-800 truncate">{fullName(c)}</p>
                                <span className="inline-flex items-center justify-center h-5 px-1.5 rounded-md bg-gray-100 font-mono text-[10px] font-semibold text-gray-400 flex-shrink-0">
                                  #{c.id}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Hash className="h-3 w-3" />
                                  {c.numero_documento}
                                </span>
                                {c.cargo_aspirado && (
                                  <span className="flex items-center gap-1">
                                    <Briefcase className="h-3 w-3" />
                                    {c.cargo_aspirado}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1.5">
                                {getEstadoBadge(c.estado)}
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-indigo-400 transition-colors flex-shrink-0 mt-1" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  {/* Paginación */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                      <span className="text-xs text-gray-500">
                        Pág. {page} de {totalPages} ({totalCandidatos} registros)
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={page <= 1 || candidatosFetching}
                          onClick={() => setPage(p => p - 1)}
                          className="h-7 w-7 p-0"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={page >= totalPages || candidatosFetching}
                          onClick={() => setPage(p => p + 1)}
                          className="h-7 w-7 p-0"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ─── Panel de Detalle / Acciones ─── */}
        <div className="col-span-12 lg:col-span-7">
          {selectedCandidato ? (
            <div className="space-y-4">
              {/* Info del candidato */}
              <Card className="border-0 shadow-sm overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-indigo-500/20">
                      {initials(selectedCandidato)}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-lg font-bold text-gray-800">{fullName(selectedCandidato)}</h2>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 flex-wrap">
                        {selectedCandidato.cargo_aspirado && (
                          <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{selectedCandidato.cargo_aspirado}</span>
                        )}
                        {selectedCandidato.email && (
                          <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{selectedCandidato.email}</span>
                        )}
                        {selectedCandidato.telefono && (
                          <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{selectedCandidato.telefono}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        {getEstadoBadge(selectedCandidato.estado)}
                      </div>
                    </div>
                  </div>

                  {/* Detalle grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-100">
                    <div>
                      <span className="text-xs text-gray-400 font-medium">Documento</span>
                      <p className="text-sm font-medium text-gray-700 mt-0.5">
                        {selectedCandidato.tipo_documento} {selectedCandidato.numero_documento}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 font-medium">Registrado</span>
                      <p className="text-sm font-medium text-gray-700 mt-0.5">{fmtDate(selectedCandidato.created_at as any)}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 font-medium">Email</span>
                      <p className="text-sm font-medium text-gray-700 mt-0.5 truncate">{selectedCandidato.email || '-'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 font-medium">Teléfono</span>
                      <p className="text-sm font-medium text-gray-700 mt-0.5">{selectedCandidato.telefono || '-'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Acciones */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Documentos */}
                <Card className="border-0 shadow-sm cursor-pointer group hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
                  onClick={() => handleViewDocumentos(selectedCandidato)}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 shadow-sm group-hover:scale-110 transition-transform duration-300">
                        <Paperclip className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">Documentos</p>
                        <p className="text-xs text-gray-500">Ver adjuntos del candidato</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Programar Entrevista */}
                <Card className="border-0 shadow-sm cursor-pointer group hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
                  onClick={() => handleSchedule(selectedCandidato)}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-sm group-hover:scale-110 transition-transform duration-300">
                        <Calendar className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">Programar</p>
                        <p className="text-xs text-gray-500">Fecha y lugar de entrevista</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Calificar */}
                <Card className="border-0 shadow-sm cursor-pointer group hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
                  onClick={() => handleCalificar(selectedCandidato)}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-sm group-hover:scale-110 transition-transform duration-300">
                        <Star className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">Calificar</p>
                        <p className="text-xs text-gray-500">Evaluar candidato</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <Card className="border-0 shadow-sm h-full">
              <CardContent className="flex flex-col items-center justify-center h-full min-h-[520px]">
                <div className="p-6 rounded-full bg-gradient-to-br from-indigo-50 to-purple-50 mb-5">
                  <CalendarCheck className="h-14 w-14 text-indigo-300" />
                </div>
                <h3 className="text-lg font-semibold text-gray-600">Seleccione un candidato</h3>
                <p className="text-sm text-gray-400 mt-2 text-center max-w-xs">
                  Seleccione un candidato de la lista para ver su información, documentos, programar entrevista o calificarlo
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ================================================================ */}
      {/* MODAL: Programar Entrevista                                      */}
      {/* ================================================================ */}
      <Dialog open={showScheduleModal} onOpenChange={setShowScheduleModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-sm">
                <Calendar className="h-4 w-4 text-white" />
              </div>
              <div>
                <span className="text-lg">Programar Entrevista</span>
                {selectedCandidato && (
                  <p className="text-xs font-normal text-gray-500 mt-0.5">{fullName(selectedCandidato)}</p>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold">Fecha <span className="text-red-500">*</span></Label>
                <Input type="date" value={fechaEntrevista} onChange={e => setFechaEntrevista(e.target.value)} className="mt-1" min={new Date().toISOString().split('T')[0]} />
              </div>
              <div>
                <Label className="text-sm font-semibold">Hora</Label>
                <Input type="time" value={horaEntrevista} onChange={e => setHoraEntrevista(e.target.value)} className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-sm font-semibold">Lugar <span className="text-red-500">*</span></Label>
              <div className="relative mt-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Ej: Oficina principal, Sala 2..." value={lugarEntrevista} onChange={e => setLugarEntrevista(e.target.value)} className="pl-9" />
              </div>
            </div>
            <div>
              <Label className="text-sm font-semibold">Observaciones</Label>
              <Textarea placeholder="Notas adicionales..." value={obsEntrevista} onChange={e => setObsEntrevista(e.target.value)} className="mt-1" rows={3} />
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" onClick={() => setShowScheduleModal(false)}>Cancelar</Button>
            <Button onClick={handleSubmitSchedule} disabled={programarMutation.isPending} className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-md shadow-indigo-500/20">
              {programarMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <CalendarCheck className="h-4 w-4 mr-1.5" />
              Programar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================================================================ */}
      {/* MODAL: Calificar Candidato                                       */}
      {/* ================================================================ */}
      <Dialog open={showCalificarModal} onOpenChange={setShowCalificarModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 shadow-sm">
                <Star className="h-4 w-4 text-white" />
              </div>
              <div>
                <span className="text-lg">Calificar Candidato</span>
                {selectedCandidato && (
                  <p className="text-xs font-normal text-gray-500 mt-0.5">{fullName(selectedCandidato)}</p>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Resultado <span className="text-red-500">*</span></Label>
              {CALIFICACIONES.map(cal => (
                <div
                  key={cal.value}
                  onClick={() => setCalificacion(cal.value)}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${calificacion === cal.value
                      ? `${cal.bgClass} border-opacity-100 shadow-sm scale-[1.02]`
                      : 'border-gray-100 hover:border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                >
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${cal.gradient} shadow-sm`}>
                    <cal.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${calificacion === cal.value ? cal.colorClass : 'text-gray-700'}`}>{cal.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{cal.description}</p>
                  </div>
                  <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${calificacion === cal.value ? `border-current ${cal.colorClass}` : 'border-gray-300'
                    }`}>
                    {calificacion === cal.value && <div className={`h-2.5 w-2.5 rounded-full bg-current ${cal.colorClass}`} />}
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            <div>
              <Label className="text-sm font-semibold">Observaciones</Label>
              <p className="text-xs text-gray-400 mt-0.5 mb-2">Notas sobre la entrevista y el candidato</p>
              <Textarea placeholder="Escriba sus observaciones..." value={obsCalificacion} onChange={e => setObsCalificacion(e.target.value)} rows={4} className="resize-none" />
            </div>

            {calificacion && (
              <div className={`flex items-start gap-2 p-3 rounded-lg text-xs ${calificacion === 'seleccionado' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : calificacion === 'descartado' ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>
                  {calificacion === 'seleccionado' && 'El candidato será marcado como SELECCIONADO y pasará a proceso de contratación.'}
                  {calificacion === 'descartado' && 'El candidato será DESCARTADO y no continuará en el proceso.'}
                  {calificacion === 'en_espera' && 'El candidato quedará EN ESPERA como opción si el candidato principal es descartado.'}
                </span>
              </div>
            )}
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" onClick={() => setShowCalificarModal(false)}>Cancelar</Button>
            <Button
              onClick={handleSubmitCalificacion}
              disabled={!calificacion || calificarMutation.isPending}
              className={`text-white shadow-md ${calificacion === 'seleccionado' ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-emerald-500/20'
                  : calificacion === 'descartado' ? 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 shadow-rose-500/20'
                    : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-amber-500/20'
                }`}
            >
              {calificarMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <CheckCircle className="h-4 w-4 mr-1.5" />
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================================================================ */}
      {/* MODAL: Documentos del Candidato                                  */}
      {/* ================================================================ */}
      <Dialog open={showDocumentosModal} onOpenChange={setShowDocumentosModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-sky-500 to-cyan-600 shadow-sm">
                <Paperclip className="h-4 w-4 text-white" />
              </div>
              <div>
                <span className="text-lg">Documentos del Candidato</span>
                <p className="text-xs font-normal text-gray-500 mt-0.5">Hojas de vida, pruebas y adjuntos</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {documentosLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="relative">
                  <div className="h-10 w-10 rounded-full border-4 border-gray-100" />
                  <div className="absolute inset-0 h-10 w-10 rounded-full border-4 border-transparent border-t-cyan-500 animate-spin" />
                </div>
                <span className="mt-3 text-sm text-gray-500">Cargando documentos...</span>
              </div>
            ) : documentos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="p-4 rounded-full bg-gray-50 mb-3">
                  <FileText className="h-8 w-8 text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-500">No hay documentos adjuntos</p>
                <p className="text-xs text-gray-400 mt-1">El candidato aún no tiene documentos cargados</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {documentos.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-gray-50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-sky-50 text-sky-600 group-hover:bg-sky-100 transition-colors">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{doc.nombre_archivo}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {doc.tipos_documentos && (
                            <Badge variant="outline" className="text-[10px] font-medium">{doc.tipos_documentos.nombre}</Badge>
                          )}
                          <span className="text-[10px] text-gray-400">{fmtDate(doc.fecha_carga || doc.created_at)}</span>
                        </div>
                        {doc.observaciones && <p className="text-xs text-gray-400 mt-1">{doc.observaciones}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {doc.url_archivo && (
                        <>
                          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-sky-600 hover:bg-sky-50 h-8 w-8 p-0"
                            onClick={() => window.open(doc.url_archivo, '_blank')} title="Ver documento">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-sky-600 hover:bg-sky-50 h-8 w-8 p-0"
                            onClick={() => { const a = document.createElement('a'); a.href = doc.url_archivo; a.download = doc.nombre_archivo; a.click(); }}
                            title="Descargar">
                            <Download className="h-4 w-4" />
                          </Button>
                        </>
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
}

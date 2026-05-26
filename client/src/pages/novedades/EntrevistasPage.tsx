import React, { useState, useMemo, useEffect } from 'react';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  CalendarCheck,
  Users,
  Building,
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
  Clock,
  CalendarX,
  CalendarClock,
  History,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { candidatosService, type Candidato } from '@/services/candidatosService';
import { candidatosDocumentosService, type CandidatoDocumentoConDetalles } from '@/services/candidatosDocumentosService';
import { usePermissions } from '@/contexts/PermissionsContext';
import { entrevistasHistorialService, type EntrevistaHistorial, type AccionEntrevista } from '@/services/entrevistasHistorialService';
import { novedadesService, ESTADOS_NOVEDAD, ESTADO_LABELS, type NovedadSolicitud, type SolicitudCandidato } from '@/services/novedadesService';

// ============================================================
// CONSTANTES
// ============================================================

const DEFAULT_PAGE_SIZE = 5;

/** Posibles estados de un candidato en el flujo de entrevistas */
const ESTADOS_CANDIDATO: Record<string, { label: string; color: string }> = {
  activo: { label: 'Activo', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
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

// Convierte un SolicitudCandidato al shape de Candidato para reutilizar el mismo render de filas
const adaptarSolicitudCandidato = (c: SolicitudCandidato): Candidato => {
  const partes = c.nombre_completo.trim().split(/\s+/);
  return {
    id: c.id,
    tipo_documento: '',
    numero_documento: c.identificacion,
    primer_nombre: partes[0] || '',
    segundo_nombre: partes.length === 4 ? partes[1] : undefined,
    primer_apellido: partes.length >= 3 ? partes[partes.length - 2] : (partes[1] || ''),
    segundo_apellido: partes.length > 2 ? partes[partes.length - 1] : undefined,
    email: c.correo || '',
    telefono: c.celular,
    estado: c.estado || 'activo',
    fecha_entrevista: c.fecha_entrevista,
    hora_entrevista: c.hora_entrevista,
    lugar_entrevista: c.lugar_entrevista,
    cargo_aspirado: c.cargo_aspirado,
    observacion_entrevista: c.observacion_entrevista,
  };
};

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

interface EntrevistasPageProps {
  solicitudEntrevista?: NovedadSolicitud | null;
}

export default function EntrevistasPage({ solicitudEntrevista }: EntrevistasPageProps) {
  const queryClient = useQueryClient();
  const { hasAction } = usePermissions();

  // ── Paginación + búsqueda ──
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
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
  const [cargoEntrevista, setCargoEntrevista] = useState('');
  const [obsEntrevista, setObsEntrevista] = useState('');

  // ── Datos de calificación ──
  const [calificacion, setCalificacion] = useState('');
  const [obsCalificacion, setObsCalificacion] = useState('');
  const [motivoDescarte, setMotivoDescarte] = useState('');

  // ── Modales de aplazar/cancelar ──
  const [showAplazarModal, setShowAplazarModal] = useState(false);
  const [showCancelarModal, setShowCancelarModal] = useState(false);
  const [showHistorialModal, setShowHistorialModal] = useState(false);
  const [motivoAccion, setMotivoAccion] = useState('');
  const [nuevaFechaEntrevista, setNuevaFechaEntrevista] = useState('');
  const [nuevaHoraEntrevista, setNuevaHoraEntrevista] = useState('');
  const [nuevoLugarEntrevista, setNuevoLugarEntrevista] = useState('');

  // ── Candidatos de la solicitud (novedades_solicitudes_candidatos) ──
  const [candidatosSolicitud, setCandidatosSolicitud] = useState<SolicitudCandidato[]>([]);
  const [cargandoCandSol, setCargandoCandSol] = useState(false);

  useEffect(() => {
    if (!solicitudEntrevista?.id) { setCandidatosSolicitud([]); return; }
    setCargandoCandSol(true);
    novedadesService.getCandidatosBySolicitud(solicitudEntrevista.id).then(data => {
      setCandidatosSolicitud(data);
      setCargandoCandSol(false);
    });
  }, [solicitudEntrevista?.id]);

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
    queryKey: ['entrevistas-candidatos', page, pageSize, filtroEstado, filtroBusqueda, empresaId],
    queryFn: () =>
      candidatosService.getForEntrevistas({
        page,
        pageSize,
        busqueda: filtroBusqueda || undefined,
        estado: filtroEstado !== 'all' ? filtroEstado : undefined,
        empresaId,
      }),
    placeholderData: (prev) => prev, // mantener datos anteriores mientras carga
    staleTime: 30_000, // 30s cache
  });

  const candidatos = candidatosResult?.data ?? [];
  const totalCandidatos = candidatosResult?.total ?? 0;
  const totalPages = Math.ceil(totalCandidatos / pageSize);

  // Alias para el panel izquierdo: usa candidatos de la solicitud si viene de una solicitud
  const listaCandidatos = useMemo(
    () => solicitudEntrevista ? candidatosSolicitud.map(adaptarSolicitudCandidato) : candidatos,
    [solicitudEntrevista, candidatosSolicitud, candidatos],
  );
  const listaCargando = solicitudEntrevista ? cargandoCandSol : candidatosLoading;

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

  /** Historial de entrevistas del candidato seleccionado */
  const { data: historial = [], isLoading: historialLoading } = useQuery<EntrevistaHistorial[]>({
    queryKey: ['entrevista-historial', selectedCandidato?.id],
    queryFn: () =>
      selectedCandidato?.id
        ? entrevistasHistorialService.getByCandidato(selectedCandidato.id)
        : Promise.resolve([]),
    enabled: !!selectedCandidato?.id,
  });

  const cancelacionesCount = useMemo(
    () => historial.filter(h => h.accion === 'cancelada' || h.accion === 'aplazada').length,
    [historial]
  );

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
    mutationFn: async ({ id, estado, obs }: { id: number; estado: string; obs?: string }) => {
      if (solicitudEntrevista) {
        // Candidato viene de novedades_solicitudes_candidatos
        const result = await novedadesService.updateCandidatoEstado(id, estado);
        if (!result) throw new Error('Error al actualizar estado del candidato');
        if (estado === 'seleccionado' && solicitudEntrevista.id) {
          await novedadesService.cambiarEstado(
            solicitudEntrevista.id,
            ESTADOS_NOVEDAD.SELECCIONADO,
            obs || 'Candidato seleccionado desde módulo de entrevistas',
          );
        }
        return result;
      }
      return candidatosService.updateEstado(id, estado, obs);
    },
    onSuccess: (result, { id, estado }) => {
      toast.success('Candidato calificado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['entrevistas-candidatos'] });
      queryClient.invalidateQueries({ queryKey: ['entrevistas-stats'] });
      queryClient.invalidateQueries({ queryKey: ['solicitudes-seleccion'] });
      queryClient.invalidateQueries({ queryKey: ['novedades-solicitudes'] });
      // Actualiza el estado en la lista local inmediatamente
      if (solicitudEntrevista) {
        setCandidatosSolicitud(prev => prev.map(c => c.id === id ? { ...c, estado } : c));
      }
      setShowCalificarModal(false);
      setCalificacion('');
      setObsCalificacion('');
      setMotivoDescarte('');
      setSelectedCandidato(null);
    },
    onError: () => toast.error('Error al calificar el candidato'),
  });

  /** Programar entrevista (guarda datos en la tabla de candidatos + historial) */
  const programarMutation = useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const { supabase: sb } = await import('@/services/supabaseClient');
      if (solicitudEntrevista) {
        // Candidato de novedades_solicitudes_candidatos — sin FK a entrevistas_historial
        const { error } = await sb
          .from('novedades_solicitudes_candidatos')
          .update({
            estado: 'entrevista',
            fecha_entrevista: fechaEntrevista || null,
            hora_entrevista: horaEntrevista || null,
            lugar_entrevista: lugarEntrevista || null,
            cargo_aspirado: cargoEntrevista || null,
            observacion_entrevista: obsEntrevista || null,
          })
          .eq('id', id);
        if (error) throw error;
        setCandidatosSolicitud(prev => prev.map(c =>
          c.id === id ? { ...c, estado: 'entrevista', fecha_entrevista: fechaEntrevista || undefined, hora_entrevista: horaEntrevista || undefined, lugar_entrevista: lugarEntrevista || undefined, cargo_aspirado: cargoEntrevista || undefined, observacion_entrevista: obsEntrevista || undefined } : c
        ));
        return;
      }
      const { error } = await sb
        .from('candidatos')
        .update({
          estado: 'entrevista',
          fecha_entrevista: fechaEntrevista || null,
          hora_entrevista: horaEntrevista || null,
          lugar_entrevista: lugarEntrevista || null,
          cargo_aspirado: cargoEntrevista || null,
          observacion_entrevista: obsEntrevista || null,
        })
        .eq('id', id);
      if (error) throw error;

      const isReprogramacion = historial.some(h => h.accion === 'programada' || h.accion === 'reprogramada');
      await entrevistasHistorialService.create({
        candidato_id: id,
        accion: isReprogramacion ? 'reprogramada' : 'programada',
        fecha_entrevista: fechaEntrevista || undefined,
        hora_entrevista: horaEntrevista || undefined,
        lugar_entrevista: lugarEntrevista || undefined,
        observaciones: obsEntrevista || undefined,
      });
    },
    onSuccess: () => {
      toast.success('Entrevista programada exitosamente');
      queryClient.invalidateQueries({ queryKey: ['entrevistas-candidatos'] });
      queryClient.invalidateQueries({ queryKey: ['entrevistas-stats'] });
      queryClient.invalidateQueries({ queryKey: ['entrevista-historial'] });
      setShowScheduleModal(false);
      resetScheduleForm();
    },
    onError: () => toast.error('Error al programar la entrevista'),
  });

  /** Aplazar entrevista */
  const aplazarMutation = useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const { supabase: sb } = await import('@/services/supabaseClient');
      const nuevaFecha = nuevaFechaEntrevista || null;
      const nuevaHora = nuevaHoraEntrevista || null;
      const nuevoLugar = nuevoLugarEntrevista || selectedCandidato?.lugar_entrevista || null;
      if (solicitudEntrevista) {
        const { error } = await sb
          .from('novedades_solicitudes_candidatos')
          .update({ fecha_entrevista: nuevaFecha, hora_entrevista: nuevaHora, lugar_entrevista: nuevoLugar })
          .eq('id', id);
        if (error) throw error;
        setCandidatosSolicitud(prev => prev.map(c =>
          c.id === id ? { ...c, fecha_entrevista: nuevaFecha || undefined, hora_entrevista: nuevaHora || undefined, lugar_entrevista: nuevoLugar || undefined } : c
        ));
        return;
      }
      const { error } = await sb
        .from('candidatos')
        .update({ fecha_entrevista: nuevaFecha, hora_entrevista: nuevaHora, lugar_entrevista: nuevoLugar })
        .eq('id', id);
      if (error) throw error;

      await entrevistasHistorialService.create({
        candidato_id: id,
        accion: 'aplazada',
        fecha_entrevista: nuevaFechaEntrevista || undefined,
        hora_entrevista: nuevaHoraEntrevista || undefined,
        lugar_entrevista: nuevoLugar || undefined,
        motivo: motivoAccion || undefined,
      });
    },
    onSuccess: () => {
      toast.success('Entrevista aplazada exitosamente');
      queryClient.invalidateQueries({ queryKey: ['entrevistas-candidatos'] });
      queryClient.invalidateQueries({ queryKey: ['entrevista-historial'] });
      setShowAplazarModal(false);
      setMotivoAccion('');
      setNuevaFechaEntrevista('');
      setNuevaHoraEntrevista('');
      setNuevoLugarEntrevista('');
    },
    onError: () => toast.error('Error al aplazar la entrevista'),
  });

  /** Cancelar entrevista */
  const cancelarMutation = useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const { supabase: sb } = await import('@/services/supabaseClient');
      if (solicitudEntrevista) {
        const { error } = await sb
          .from('novedades_solicitudes_candidatos')
          .update({ estado: 'activo', fecha_entrevista: null, hora_entrevista: null, lugar_entrevista: null, observacion_entrevista: null })
          .eq('id', id);
        if (error) throw error;
        setCandidatosSolicitud(prev => prev.map(c =>
          c.id === id ? { ...c, estado: 'activo', fecha_entrevista: undefined, hora_entrevista: undefined, lugar_entrevista: undefined } : c
        ));
        return;
      }
      const { error } = await sb
        .from('candidatos')
        .update({ estado: 'en_proceso', fecha_entrevista: null, hora_entrevista: null, lugar_entrevista: null, observacion_entrevista: null })
        .eq('id', id);
      if (error) throw error;

      await entrevistasHistorialService.create({
        candidato_id: id,
        accion: 'cancelada',
        fecha_entrevista: selectedCandidato?.fecha_entrevista || undefined,
        motivo: motivoAccion || undefined,
      });
    },
    onSuccess: () => {
      toast.success('Entrevista cancelada');
      queryClient.invalidateQueries({ queryKey: ['entrevistas-candidatos'] });
      queryClient.invalidateQueries({ queryKey: ['entrevistas-stats'] });
      queryClient.invalidateQueries({ queryKey: ['entrevista-historial'] });
      setShowCancelarModal(false);
      setMotivoAccion('');
      setSelectedCandidato(null);
    },
    onError: () => toast.error('Error al cancelar la entrevista'),
  });

  // ============================================================
  // HANDLERS
  // ============================================================

  const resetScheduleForm = () => {
    setFechaEntrevista('');
    setHoraEntrevista('');
    setLugarEntrevista('');
    setCargoEntrevista('');
    setObsEntrevista('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchInput.trim().length >= 3) {
      setPage(1);
      setFiltroBusqueda(searchInput.trim());
    }
  };

  useEffect(() => {
    const value = searchInput.trim();
    const timeout = setTimeout(() => {
      if (value.length >= 3) {
        setPage(1);
        setFiltroBusqueda(value);
      } else if (value.length === 0) {
        setPage(1);
        setFiltroBusqueda('');
      }
    }, 250);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const handleSelectCandidato = (c: Candidato) => setSelectedCandidato(c);

  const handleViewDocumentos = (c: Candidato) => {
    setSelectedCandidato(c);
    setShowDocumentosModal(true);
  };

  const handleSchedule = async (c: Candidato) => {
    setSelectedCandidato(c);
    resetScheduleForm();
    setShowScheduleModal(true);
    // Buscar el cargo desde la solicitud asociada al candidato
    try {
      const { supabase: sb } = await import('@/services/supabaseClient');
      const { data: sol } = await sb
        .from('hum_solicitudes')
        .select('estructura_datos')
        .eq('candidato_id', c.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      const cargoId = (sol?.estructura_datos as any)?.cargo;
      if (cargoId) {
        const { data: tc } = await sb
          .from('tipos_candidatos')
          .select('nombre')
          .eq('id', Number(cargoId))
          .maybeSingle();
        if (tc?.nombre) setCargoEntrevista(tc.nombre);
      }
    } catch {
      // Si falla, el campo queda vacío
    }
  };

  const handleAplazar = (c: Candidato) => {
    setSelectedCandidato(c);
    setMotivoAccion('');
    setNuevaFechaEntrevista('');
    setNuevaHoraEntrevista('');
    setNuevoLugarEntrevista(c.lugar_entrevista || '');
    setShowAplazarModal(true);
  };

  const handleCancelar = (c: Candidato) => {
    setSelectedCandidato(c);
    setMotivoAccion('');
    setShowCancelarModal(true);
  };

  const handleVerHistorial = (c: Candidato) => {
    setSelectedCandidato(c);
    setShowHistorialModal(true);
  };

  const handleSubmitAplazar = () => {
    if (!selectedCandidato?.id) return;
    if (!nuevaFechaEntrevista) {
      toast.error('Debe indicar la nueva fecha de entrevista');
      return;
    }
    if (!motivoAccion.trim()) {
      toast.error('Debe indicar el motivo del aplazamiento');
      return;
    }
    aplazarMutation.mutate({ id: selectedCandidato.id });
  };

  const handleSubmitCancelar = () => {
    if (!selectedCandidato?.id) return;
    if (!motivoAccion.trim()) {
      toast.error('Debe indicar el motivo de la cancelación');
      return;
    }
    cancelarMutation.mutate({ id: selectedCandidato.id });
  };

  const canCalificar = (c: Candidato): { allowed: boolean; reason: string } => {
    if (c.estado !== 'entrevista') {
      return { allowed: false, reason: 'Debe programar la entrevista antes de calificar' };
    }
    if (!c.fecha_entrevista) {
      return { allowed: false, reason: 'No se ha registrado fecha de entrevista' };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const entrevistaDate = new Date(c.fecha_entrevista + 'T00:00:00');
    if (entrevistaDate > today) {
      return { allowed: false, reason: `La entrevista está programada para ${fmtDate(c.fecha_entrevista)}, aún no se ha realizado` };
    }
    return { allowed: true, reason: '' };
  };

  const handleCalificar = (c: Candidato) => {
    const check = canCalificar(c);
    if (!check.allowed) {
      toast.error(check.reason);
      return;
    }
    setSelectedCandidato(c);
    setCalificacion('');
    setObsCalificacion('');
    setMotivoDescarte('');
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
    if (calificacion === 'descartado' && !motivoDescarte.trim()) {
      toast.error('Ingrese el motivo del descarte');
      return;
    }
    const obs = calificacion === 'descartado'
      ? `Motivo de descarte: ${motivoDescarte}${obsCalificacion ? ` | ${obsCalificacion}` : ''}`
      : obsCalificacion || undefined;
    calificarMutation.mutate({
      id: selectedCandidato.id,
      estado: calificacion,
      obs,
    });
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="space-y-4 p-4">
      {/* ───── Header ───── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="p-3 rounded-2xl bg-teal-500 shadow-lg shadow-teal-500/25">
              <CalendarCheck className="h-7 w-7 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-cyan-800">
              Programación de Entrevistas
            </h1>
            <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
              <Sparkles className="h-3.5 w-3.5 text-teal-500" />
              Gestión y calificación de candidatos
            </p>
          </div>
        </div>
      </div>

      {/* ───── Solicitud info banner ───── */}
      {solicitudEntrevista && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <p className="text-[10px] font-semibold text-purple-600 uppercase tracking-wide mb-1.5">Solicitud #{solicitudEntrevista.id} — {ESTADO_LABELS[solicitudEntrevista.estado || ''] || solicitudEntrevista.estado}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs">
            <div className="flex items-center gap-1.5 text-gray-600 min-w-0">
              <Building className="w-3 h-3 shrink-0 text-purple-400" />
              <span className="font-medium shrink-0">Empresa:</span>
              <span className="truncate">{solicitudEntrevista.empresa?.razon_social || '—'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600 min-w-0">
              <Briefcase className="w-3 h-3 shrink-0 text-purple-400" />
              <span className="font-medium shrink-0">Cargo:</span>
              <span className="truncate">{solicitudEntrevista.empleado?.cargo || '—'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600 min-w-0">
              <FileText className="w-3 h-3 shrink-0 text-purple-400" />
              <span className="font-medium shrink-0">Motivo:</span>
              <span className="truncate">{solicitudEntrevista.motivo?.nombre || '—'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600 min-w-0">
              <Users className="w-3 h-3 shrink-0 text-purple-400" />
              <span className="font-medium shrink-0">Empleado:</span>
              <span className="truncate">{solicitudEntrevista.empleado?.nombre} {solicitudEntrevista.empleado?.apellido}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600 min-w-0">
              <MapPin className="w-3 h-3 shrink-0 text-purple-400" />
              <span className="font-medium shrink-0">Sucursal:</span>
              <span className="truncate">{solicitudEntrevista.empleado?.sucursal?.nombre || '—'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600 min-w-0">
              <Calendar className="w-3 h-3 shrink-0 text-purple-400" />
              <span className="font-medium shrink-0">Fecha:</span>
              <span>{(solicitudEntrevista.fecha_inicio_vacante || solicitudEntrevista.created_at) ? new Date((solicitudEntrevista.fecha_inicio_vacante || solicitudEntrevista.created_at)!).toLocaleDateString('es-CO') : '—'}</span>
            </div>
          </div>
        </div>
      )}

      {/* ───── Main Content ───── */}
      <div className="grid grid-cols-12 gap-6 mt-4">
        {/* ─── Lista de Candidatos ─── */}
        <div className="col-span-12 lg:col-span-5">
          <Card className="border-0 shadow-sm h-full" style={!hasAction('vista-entrevista-listado-candidatos') ? { display: 'none' } : {}}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-cyan-800 flex items-center gap-2">
                <Users className="h-5 w-5 text-teal-600" />
                Candidatos
              </CardTitle>
              <div className="mt-4 flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-1">
              <Select value={filtroEstado} onValueChange={v => { setFiltroEstado(v); setPage(1); }}>
                  <SelectTrigger className="h-8 w-[150px] text-xs border-gray-200">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    {Object.entries(ESTADOS_CANDIDATO).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="relative w-[180px]">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <Input
                    placeholder="Buscar"
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="h-8 pl-8 text-xs border-gray-200"
                  />
                </div>
                {searchInput.trim().length > 0 && searchInput.trim().length < 3 && (
                  <span className="text-[11px] text-gray-400">Escribe 3+ caracteres</span>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {listaCargando ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="relative">
                    <div className="h-12 w-12 rounded-full border-4 border-gray-100" />
                    <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-transparent border-t-teal-500 animate-spin" />
                  </div>
                  <span className="mt-4 text-sm text-gray-500 font-medium">Cargando candidatos...</span>
                </div>
              ) : listaCandidatos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="p-4 rounded-full bg-gray-50 mb-4">
                    <Users className="h-10 w-10 text-gray-300" />
                  </div>
                  <p className="text-lg font-semibold text-gray-600">No hay candidatos</p>
                  <p className="text-sm text-gray-400 mt-1">Ajuste los filtros o intente con otra búsqueda</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto rounded-lg shadow-sm">
                    <Table className="w-full text-[11px]">
                      <TableHeader className="bg-cyan-50">
                        <TableRow className="text-left font-semibold text-gray-700">
                          <TableHead className="px-3 py-2">Candidato</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {listaCandidatos.map(c => (
                          <TableRow
                            key={c.id}
                            onClick={() => handleSelectCandidato(c)}
                            className={`hover:bg-gray-50 cursor-pointer transition-colors ${selectedCandidato?.id === c.id ? 'bg-cyan-100' : ''}`}
                          >
                            <TableCell className="px-3 py-2 text-xs text-gray-900 font-medium">
                              <div className="flex items-start gap-2">
                                <div className="h-6 w-6 rounded-md bg-teal-500 flex items-center justify-center text-white text-[9px] font-bold shadow-sm">
                                  {initials(c)}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="truncate">{fullName(c)}</p>
                                    <div className="shrink-0 flex items-center gap-1.5">
                                      {getEstadoBadge(c.estado)}
                                    </div>
                                  </div>
                                  <p className="text-[10px] text-gray-500 truncate mt-0.5">
                                    #{c.id} · {c.numero_documento || '-'}{c.cargo_aspirado ? ` · ${c.cargo_aspirado}` : ''}
                                  </p>
                                  {c.estado === 'entrevista' && (
                                    <p className="text-[10px] text-cyan-700 truncate mt-0.5">
                                      Entrevista: {fmtDate(c.fecha_entrevista)} {c.hora_entrevista ? `· ${c.hora_entrevista}` : ''}{c.lugar_entrevista ? ` · ${c.lugar_entrevista}` : ''}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Paginación */}
                  {listaCandidatos.length > 0 && (
                    <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 bg-gray-50/50">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-gray-500">Mostrar</span>
                        <Select
                          value={String(pageSize)}
                          onValueChange={(value) => {
                            setPageSize(parseInt(value, 10));
                            setPage(1);
                          }}
                        >
                          <SelectTrigger className="h-7 w-[72px] text-[11px] border-gray-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[5, 10, 20, 30].map(size => (
                              <SelectItem key={size} value={String(size)}>
                                {size}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="text-[11px] text-gray-500">por página</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-gray-500 hidden sm:inline">
                          {totalCandidatos} registros
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page <= 1 || candidatosFetching}
                          onClick={() => setPage(p => p - 1)}
                          className="h-7 w-7 p-0 rounded-md border-gray-200"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="h-7 min-w-[56px] px-2 inline-flex items-center justify-center rounded-md border border-cyan-100 bg-cyan-50 text-[11px] font-semibold text-cyan-700">
                          {page}/{totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page >= totalPages || totalPages === 0 || candidatosFetching}
                          onClick={() => setPage(p => p + 1)}
                          className="h-7 w-7 p-0 rounded-md border-gray-200"
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
            <div className="space-y-3">
              {/* Info del candidato */}
              <Card className="border-0 shadow-sm overflow-hidden">
                <div className="h-1 bg-teal-500" />
                <CardContent className="p-4">
                  {/* Header compacto */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-teal-500 flex items-center justify-center text-white text-sm font-bold shadow-sm flex-shrink-0">
                      {initials(selectedCandidato)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-sm font-bold text-gray-800">{fullName(selectedCandidato)}</h2>
                        {getEstadoBadge(selectedCandidato.estado)}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Hash className="h-3 w-3" />{selectedCandidato.tipo_documento} {selectedCandidato.numero_documento}
                        </span>
                        {selectedCandidato.email && (
                          <span className="flex items-center gap-1 truncate max-w-[180px]">
                            <Mail className="h-3 w-3 flex-shrink-0" />{selectedCandidato.email}
                          </span>
                        )}
                        {selectedCandidato.telefono && (
                          <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{selectedCandidato.telefono}</span>
                        )}
                        {selectedCandidato.cargo_aspirado && (
                          <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{selectedCandidato.cargo_aspirado}</span>
                        )}
                      </div>
                    </div>
                  </div>
                    {hasAction('vista-entrevista-ver-adjuntos') && (
                      <button
                        onClick={() => handleViewDocumentos(selectedCandidato)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-sky-50 hover:border-sky-300 text-gray-700 hover:text-sky-700 text-xs font-medium transition-all shadow-sm"
                      >
                        <Paperclip className="h-3.5 w-3.5 text-sky-500" />
                        Documentos
                      </button>
                    )}
                  </div>

                  {/* Info de entrevista programada */}
                  {selectedCandidato.fecha_entrevista && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-teal-500" />
                          <span className="text-xs font-semibold text-gray-600">Entrevista</span>
                          {(() => {
                            const today = new Date(); today.setHours(0,0,0,0);
                            const entDate = new Date(selectedCandidato.fecha_entrevista + 'T00:00:00');
                            const isPast = entDate <= today;
                            return (
                              <Badge className={`text-[10px] h-4 px-1.5 ${isPast ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                                {isPast ? 'Realizada' : 'Pendiente'}
                              </Badge>
                            );
                          })()}
                          <span className="text-xs text-gray-600 font-medium">{fmtDate(selectedCandidato.fecha_entrevista)}</span>
                          {selectedCandidato.hora_entrevista && <span className="text-xs text-gray-500">{selectedCandidato.hora_entrevista}</span>}
                          {selectedCandidato.lugar_entrevista && (
                            <span className="flex items-center gap-0.5 text-xs text-gray-500">
                              <MapPin className="h-3 w-3" />{selectedCandidato.lugar_entrevista}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="h-6 text-[11px] px-2 text-teal-600 hover:bg-teal-50"
                            onClick={() => handleAplazar(selectedCandidato)}>
                            <CalendarClock className="h-3 w-3 mr-1" />Aplazar
                          </Button>
                          <Button variant="ghost" size="sm" className="h-6 text-[11px] px-2 text-red-600 hover:bg-red-50"
                            onClick={() => handleCancelar(selectedCandidato)}>
                            <CalendarX className="h-3 w-3 mr-1" />Cancelar
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Alerta de cancelaciones frecuentes */}
                  {cancelacionesCount >= 2 && (
                    <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
                      <p className="text-xs text-amber-800">
                        {cancelacionesCount} aplazamiento{cancelacionesCount > 1 ? 's' : ''}/cancelación{cancelacionesCount > 1 ? 'es' : ''} registrada{cancelacionesCount > 1 ? 's' : ''} — revise el historial.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Acciones — fila horizontal compacta */}
              <div className="flex items-center gap-2 flex-wrap">
                {hasAction('vista-entrevista-programar') && (
                  <button
                    onClick={() => handleSchedule(selectedCandidato)}
                    disabled={selectedCandidato.estado === 'entrevista'}
                    title={selectedCandidato.estado === 'entrevista' ? 'Este candidato ya tiene una entrevista programada' : undefined}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all shadow-sm ${
                      selectedCandidato.estado === 'entrevista'
                        ? 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                        : 'border-gray-200 bg-white hover:bg-cyan-50 hover:border-cyan-300 text-gray-700 hover:text-cyan-700'
                    }`}
                  >
                    <Calendar className="h-3.5 w-3.5 text-cyan-500" />
                    Programar entrevista
                  </button>
                )}
                {hasAction('vista-entrevista-calificar') && (() => {
                  const check = canCalificar(selectedCandidato);
                  return (
                    <button
                      onClick={() => handleCalificar(selectedCandidato)}
                      disabled={!check.allowed}
                      title={!check.allowed ? check.reason : undefined}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all shadow-sm ${
                        check.allowed
                          ? 'border-gray-200 bg-white hover:bg-emerald-50 hover:border-emerald-300 text-gray-700 hover:text-emerald-700'
                          : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <Star className={`h-3.5 w-3.5 ${check.allowed ? 'text-emerald-500' : 'text-gray-300'}`} />
                      Calificar
                    </button>
                  );
                })()}
                <button
                  onClick={() => handleVerHistorial(selectedCandidato)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-teal-50 hover:border-teal-300 text-gray-700 hover:text-teal-700 text-xs font-medium transition-all shadow-sm relative"
                >
                  <History className="h-3.5 w-3.5 text-teal-500" />
                  Historial
                  {historial.length > 0 && (
                    <span className="ml-1 h-4 w-4 rounded-full bg-teal-100 text-teal-700 text-[9px] font-bold flex items-center justify-center">
                      {historial.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <Card className="border border-dashed border-cyan-200 bg-cyan-50/30 shadow-sm h-full">
              <CardContent className="flex flex-col items-center justify-start h-full min-h-[520px] pt-14">
                <div className="p-6 rounded-full bg-cyan-50 mb-5">
                  <CalendarCheck className="h-14 w-14 text-teal-300" />
                </div>
                <h3 className="text-lg font-semibold text-cyan-800">Seleccione un candidato</h3>
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
              <div className="p-2 rounded-lg bg-teal-500 shadow-sm">
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
              <Label className="text-sm font-semibold">Cargo</Label>
              <div className="relative mt-1">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={cargoEntrevista}
                  readOnly
                  placeholder="Sin cargo asociado en la vacante"
                  className="pl-9 bg-gray-50 cursor-default"
                />
              </div>
            </div>
            <div>
              <Label className="text-sm font-semibold">Observaciones</Label>
              <Textarea placeholder="Notas adicionales..." value={obsEntrevista} onChange={e => setObsEntrevista(e.target.value)} className="mt-1" rows={3} />
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" onClick={() => setShowScheduleModal(false)}>Cancelar</Button>
            <Button onClick={handleSubmitSchedule} disabled={programarMutation.isPending} className="bg-teal-500 hover:bg-teal-600 text-white shadow-md shadow-teal-500/20">
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
              {calificacion === 'descartado' && (
                <div className="mb-3">
                  <label className="text-xs font-semibold text-red-700 flex items-center gap-1 mb-1">
                    Motivo del descarte <span className="text-red-500">*</span>
                  </label>
                  <Textarea placeholder="Indique el motivo por el cual se descarta al candidato..." value={motivoDescarte} onChange={e => setMotivoDescarte(e.target.value)} rows={2} className="resize-none border-red-200 focus-visible:ring-red-400" />
                </div>
              )}
              <Textarea placeholder="Escriba sus observaciones adicionales..." value={obsCalificacion} onChange={e => setObsCalificacion(e.target.value)} rows={3} className="resize-none" />
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

      {/* ================================================================ */}
      {/* MODAL: Aplazar Entrevista                                        */}
      {/* ================================================================ */}
      <Dialog open={showAplazarModal} onOpenChange={setShowAplazarModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shadow-sm">
                <CalendarClock className="h-4 w-4 text-white" />
              </div>
              <div>
                <span className="text-lg">Aplazar / Posponer Entrevista</span>
                {selectedCandidato && (
                  <p className="text-xs font-normal text-gray-500 mt-0.5">{fullName(selectedCandidato)}</p>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          {cancelacionesCount >= 2 && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                <span className="font-semibold">Atención:</span> Este candidato ya tiene {cancelacionesCount} aplazamiento{cancelacionesCount > 1 ? 's' : ''}/cancelacion{cancelacionesCount > 1 ? 'es' : ''} registrada{cancelacionesCount > 1 ? 's' : ''}.
              </p>
            </div>
          )}

          {selectedCandidato?.fecha_entrevista && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 border border-gray-200">
              <Calendar className="h-4 w-4 text-gray-500" />
              <p className="text-xs text-gray-600">
                Cita actual: <span className="font-semibold">{fmtDate(selectedCandidato.fecha_entrevista)}</span>
                {selectedCandidato.hora_entrevista && <> a las <span className="font-semibold">{selectedCandidato.hora_entrevista}</span></>}
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-semibold">Motivo del aplazamiento <span className="text-red-500">*</span></Label>
              <Textarea
                placeholder="Indique por qué se aplaza la entrevista..."
                value={motivoAccion}
                onChange={e => setMotivoAccion(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>

            <Separator />
            <p className="text-sm font-semibold text-gray-700">Nueva fecha de entrevista</p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold">Fecha <span className="text-red-500">*</span></Label>
                <Input type="date" value={nuevaFechaEntrevista} onChange={e => setNuevaFechaEntrevista(e.target.value)} className="mt-1" min={new Date().toISOString().split('T')[0]} />
              </div>
              <div>
                <Label className="text-sm font-semibold">Hora</Label>
                <Input type="time" value={nuevaHoraEntrevista} onChange={e => setNuevaHoraEntrevista(e.target.value)} className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-sm font-semibold">Lugar</Label>
              <div className="relative mt-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Dejar vacío para mantener el actual..." value={nuevoLugarEntrevista} onChange={e => setNuevoLugarEntrevista(e.target.value)} className="pl-9" />
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" onClick={() => setShowAplazarModal(false)}>Cancelar</Button>
            <Button onClick={handleSubmitAplazar} disabled={aplazarMutation.isPending} className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md shadow-amber-500/20">
              {aplazarMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <CalendarClock className="h-4 w-4 mr-1.5" />
              Aplazar cita
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================================================================ */}
      {/* MODAL: Cancelar Entrevista                                       */}
      {/* ================================================================ */}
      <Dialog open={showCancelarModal} onOpenChange={setShowCancelarModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 shadow-sm">
                <CalendarX className="h-4 w-4 text-white" />
              </div>
              <div>
                <span className="text-lg">Cancelar Entrevista</span>
                {selectedCandidato && (
                  <p className="text-xs font-normal text-gray-500 mt-0.5">{fullName(selectedCandidato)}</p>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          {cancelacionesCount >= 2 && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
              <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">
                <span className="font-semibold">Atención:</span> Este candidato ya acumula {cancelacionesCount} aplazamiento{cancelacionesCount > 1 ? 's' : ''}/cancelacion{cancelacionesCount > 1 ? 'es' : ''}. Considere descartar al candidato si el patrón persiste.
              </p>
            </div>
          )}

          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-700">
              Se cancelará la entrevista y el candidato regresará al estado <span className="font-semibold">En Proceso</span>. Deberá reprogramar la cita si desea entrevistarlo nuevamente.
            </p>
          </div>

          <div>
            <Label className="text-sm font-semibold">Motivo de cancelación <span className="text-red-500">*</span></Label>
            <Textarea
              placeholder="Indique por qué se cancela la entrevista..."
              value={motivoAccion}
              onChange={e => setMotivoAccion(e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" onClick={() => setShowCancelarModal(false)}>Volver</Button>
            <Button onClick={handleSubmitCancelar} disabled={cancelarMutation.isPending} variant="destructive" className="shadow-md shadow-red-500/20">
              {cancelarMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <CalendarX className="h-4 w-4 mr-1.5" />
              Confirmar cancelación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================================================================ */}
      {/* MODAL: Historial / Timeline de Entrevistas                       */}
      {/* ================================================================ */}
      <Dialog open={showHistorialModal} onOpenChange={setShowHistorialModal}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 shadow-sm">
                <History className="h-4 w-4 text-white" />
              </div>
              <div>
                <span className="text-lg">Historial de Entrevistas</span>
                {selectedCandidato && (
                  <p className="text-xs font-normal text-gray-500 mt-0.5">{fullName(selectedCandidato)}</p>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          {cancelacionesCount >= 2 && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                <span className="font-semibold">{cancelacionesCount} aplazamiento{cancelacionesCount > 1 ? 's' : ''}/cancelacion{cancelacionesCount > 1 ? 'es' : ''}</span> registrada{cancelacionesCount > 1 ? 's' : ''} para este candidato.
              </p>
            </div>
          )}

          <div className="space-y-1">
            {historialLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="relative">
                  <div className="h-10 w-10 rounded-full border-4 border-gray-100" />
                  <div className="absolute inset-0 h-10 w-10 rounded-full border-4 border-transparent border-t-violet-500 animate-spin" />
                </div>
                <span className="mt-3 text-sm text-gray-500">Cargando historial...</span>
              </div>
            ) : historial.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="p-4 rounded-full bg-gray-50 mb-3">
                  <History className="h-8 w-8 text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-500">Sin historial</p>
                <p className="text-xs text-gray-400 mt-1">Aún no hay acciones registradas para este candidato</p>
              </div>
            ) : (
              <div className="relative pl-6">
                <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-200" />
                {historial.map((h, idx) => {
                  const accionConfig: Record<string, { color: string; bgColor: string; icon: React.ReactNode }> = {
                    programada: { color: 'text-indigo-600', bgColor: 'bg-indigo-100 border-indigo-300', icon: <CalendarCheck className="h-3 w-3" /> },
                    reprogramada: { color: 'text-blue-600', bgColor: 'bg-blue-100 border-blue-300', icon: <CalendarClock className="h-3 w-3" /> },
                    aplazada: { color: 'text-amber-600', bgColor: 'bg-amber-100 border-amber-300', icon: <CalendarClock className="h-3 w-3" /> },
                    cancelada: { color: 'text-red-600', bgColor: 'bg-red-100 border-red-300', icon: <CalendarX className="h-3 w-3" /> },
                    realizada: { color: 'text-emerald-600', bgColor: 'bg-emerald-100 border-emerald-300', icon: <CheckCircle className="h-3 w-3" /> },
                  };
                  const conf = accionConfig[h.accion] || { color: 'text-gray-600', bgColor: 'bg-gray-100 border-gray-300', icon: <Clock className="h-3 w-3" /> };

                  return (
                    <div key={h.id || idx} className="relative mb-4 last:mb-0">
                      <div className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 ${conf.bgColor} flex items-center justify-center ${conf.color}`}>
                        {conf.icon}
                      </div>
                      <div className="bg-white border border-gray-100 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-1">
                          <Badge className={`text-[10px] font-semibold border ${conf.bgColor} ${conf.color}`}>
                            {entrevistasHistorialService.getAccionLabel(h.accion)}
                          </Badge>
                          <span className="text-[10px] text-gray-400 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {h.created_at ? new Date(h.created_at).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }) : '-'}
                          </span>
                        </div>
                        {h.fecha_entrevista && (
                          <p className="text-xs text-gray-600 mt-1">
                            <span className="font-medium">Fecha:</span> {fmtDate(h.fecha_entrevista)}
                            {h.hora_entrevista && <> a las <span className="font-medium">{h.hora_entrevista}</span></>}
                          </p>
                        )}
                        {h.lugar_entrevista && (
                          <p className="text-xs text-gray-600">
                            <span className="font-medium">Lugar:</span> {h.lugar_entrevista}
                          </p>
                        )}
                        {h.motivo && (
                          <p className="text-xs text-gray-600 mt-1">
                            <span className="font-medium">Motivo:</span> {h.motivo}
                          </p>
                        )}
                        {h.observaciones && (
                          <p className="text-xs text-gray-500 mt-1 italic">{h.observaciones}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ComposedChart,
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  FunnelChart,
  Funnel,
  Cell as FunnelCell
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from '@/services/supabaseClient';
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { Can } from '@/contexts/PermissionsContext';
import { useCompanies } from '@/hooks/useCompanies';
import { useAnalistas } from '@/hooks/useAnalistas';
import { useAuth } from '@/contexts/AuthContext';
import { useLoading } from '@/contexts/LoadingContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SelectWithSearch } from "@/components/ui/select-with-search";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DateRangePicker, DateRange } from "@/components/ui/DateRangePicker";
import {
  Users,
  Building,
  FileText,
  UserCheck,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  CheckCircle2,
  Phone,
  XCircle,
  Activity,
  MapPin,
  Briefcase,
  Award,
  Database,
  Shield,
  Mail,
  QrCode,
  Calendar as CalendarIcon,
  Target,
  Zap,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  ActivitySquare,
  Globe,
  Star,
  Heart,
  TrendingDown,
  Eye,
  DollarSign,
  Info,
  ClipboardList,
  Stethoscope,
  X,
  Lightbulb,
  Rocket,
  Crown,
  Trophy,
  Medal,
  Flame,
  Sparkles,
  Rainbow,
  Palette,
  Music,
  Camera,
  Gamepad2,
  Coffee,
  Pizza,
  IceCream,
  Cake,
  Gift,
  PartyPopper,
  Diamond,
  Gem,
  Ribbon,
  Flag,
  Sword,
  Castle,
  Mountain,
  Flower,
  Leaf,
  Sun,
  Moon,
  Cloud,
  Wind,
  Fish,
  Bird
} from "lucide-react";

// Interfaces para los datos del dashboard
interface DashboardStats {
  totalEmpresas: number;
  totalCandidatos: number;
  totalSolicitudes: number;
  totalUsuarios: number;
  totalPrestadores: number;
  solicitudesHoy: number;
  solicitudesPendientes: number;
  examenesMedicos: number;
  solicitudesContratadas: number;
  solicitudesDescartadas: number;
  promedioTiempoProcesamiento: number;
  promedioEnContactar: number;
  promedioContratadas: number;
  promedioEntregaDocumentos: number;
  promedioEnContactarHoras: number;
  promedioContratadasHoras: number;
  promedioEntregaDocumentosHoras: number;
  promedioEnContactarTiempo: string;
  promedioContratadasTiempo: string;
  promedioEntregaDocumentosTiempo: string;
  cantidadSolicitudesContactadas: number;
  cantidadDocumentosEntregados: number;
  topEmpresas: Array<{ nombre: string; cantidad: number }>;
  solicitudesPorEstado: Array<{ estado: string; cantidad: number }>;
  solicitudesPorMes: Array<{ mes: string; cantidad: number }>;
  candidatosPorCiudad: Array<{ ciudad: string; cantidad: number }>;
  usuariosActivos: number;
  usuariosInactivos: number;
  prestadoresActivos: number;
  prestadoresInactivos: number;
  solicitudes: any[]; // Agregar las solicitudes completas para los modales
}

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: string;
}

const StatCard = ({ title, value, description, icon, trend, color = "brand-lime" }: StatCardProps) => (
  <Card className="hover:shadow-xl transition-all duration-300 border-l-4 hover:scale-105 transform">
    <CardHeader className="pb-2">
      <div className="flex items-center justify-between">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <div className={`p-2 rounded-lg bg-${color}-100 text-${color}-600`}>
          {icon}
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div className={`text-3xl font-bold text-${color}-600 mb-2`}>{value}</div>
      <p className="text-xs text-gray-500 mb-2">{description}</p>
      {trend && (
        <div className="flex items-center text-xs">
          <TrendingUp className={`w-3 h-3 mr-1 ${trend.isPositive ? 'text-green-500' : 'text-red-500'}`} />
          <span className={trend.isPositive ? 'text-green-600' : 'text-red-600'}>
            {trend.isPositive ? '+' : ''}{trend.value}%
          </span>
          <span className="text-gray-500 ml-1">vs mes anterior</span>
        </div>
      )}
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const { user } = useAuth();
  const { startLoading, stopLoading } = useLoading();
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [activeTab, setActiveTab] = useState("overview");
  const [empresaFiltro, setEmpresaFiltro] = useState('todas');
  const [analistaFiltro, setAnalistaFiltro] = useState('todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<any[]>([]);
  const [modalTitle, setModalTitle] = useState('');
  const [modalType, setModalType] = useState<string>('');
  const [solicitudesData, setSolicitudesData] = useState<any[]>([]);

  // Obtener datos de empresas y analistas
  const { data: empresas = [], isLoading: loadingEmpresas } = useCompanies('empresa');
  const { data: analistas = [], isLoading: loadingAnalistas } = useAnalistas();

  // Inicializar filtros basándose en el usuario autenticado
  useEffect(() => {
    // Verificar si el usuario tiene empresa asociada
    const empresaData = localStorage.getItem('empresaData');
    if (empresaData) {
      try {
        const empresa = JSON.parse(empresaData);
        setEmpresaFiltro(empresa.id.toString());
      } catch (error) {
        console.error('Error parsing empresaData:', error);
      }
    }

    // Verificar si el usuario es analista
    if (user && analistas.length > 0) {
      const usuarioEsAnalista = analistas.find(analista => 
        analista.id === user.id || 
        analista.email === user.email ||
        analista.username === user.username
      );
      if (usuarioEsAnalista) {
        setAnalistaFiltro(usuarioEsAnalista.id?.toString() || 'sin-id');
      }
    }
  }, [user, analistas]);

  // Verificar si el usuario tiene empresa asociada para deshabilitar el select
  const tieneEmpresaAsociada = !!localStorage.getItem('empresaData') || false;
  
  // Verificar si el usuario es analista para deshabilitar el select
  const esAnalista = !!(user && analistas.some(analista => 
    analista.id === user.id || 
    analista.email === user.email ||
    analista.username === user.username
  ));

  // Función para calcular tendencia vs mes anterior
  const calcularTendencia = (actual: number, anterior: number) => {
    if (anterior === 0) return actual > 0 ? 100 : 0;
    return Math.round(((actual - anterior) / anterior) * 100);
  };

  // Función para manejar click en card
  const handleCardClick = async (estado: string, titulo: string) => {
    try {
      // Mostrar loading global
      startLoading();
      
      // Refrescar los datos antes de mostrar el modal
      console.log('🔄 Refrescando datos del dashboard...');
      const { data: refreshedStats } = await refetch();
      
      // Usar los datos actualizados del refetch
      const solicitudesActualizadas = refreshedStats?.solicitudes || solicitudesData;
      
      // Debug: Mostrar todos los estados únicos para verificar
      const estadosUnicos = [...new Set(solicitudesActualizadas.map(s => s.estado))];
      console.log('🔍 Estados únicos encontrados en las solicitudes:', estadosUnicos);
      
      let solicitudesFiltradas = [];
      
      switch (estado) {
        case 'asignado':
          solicitudesFiltradas = solicitudesActualizadas.filter(s => s.estado === 'asignado');
          break;
        case 'citado_examenes':
          solicitudesFiltradas = solicitudesActualizadas.filter(s => s.estado?.toLowerCase() === 'citado examenes');
          break;
        case 'contratado':
          solicitudesFiltradas = solicitudesActualizadas.filter(s => s.estado === 'contratado');
          break;
        case 'descartado':
          // Filtrar por múltiples variaciones de estados de descarte
          solicitudesFiltradas = solicitudesActualizadas.filter(s => {
            const estadoOriginal = s.estado;
            const estadoLower = s.estado?.toLowerCase();
            const estadoSinGuiones = s.estado?.replace(/_/g, '').toLowerCase();
            
            const esDescartada = estadoLower === 'descartado' || 
                   estadoLower === 'cancelada' || 
                   estadoLower === 'cancelado' ||
                   estadoLower === 'stand_by' || 
                   estadoLower === 'standby' ||
                   estadoLower === 'stand by' ||
                   estadoSinGuiones === 'standby' ||
                   estadoLower === 'desertada' ||
                   estadoLower === 'desertado';
            
            // Debug: Log para cada solicitud
            console.log('🔍 Verificando solicitud:', {
              id: s.id,
              estadoOriginal: estadoOriginal,
              estadoLower: estadoLower,
              estadoSinGuiones: estadoSinGuiones,
              esDescartada: esDescartada
            });
            
            return esDescartada;
          });
          break;
      }
      
      console.log(`📊 Mostrando ${solicitudesFiltradas.length} solicitudes para estado: ${estado}`);
      setModalData(solicitudesFiltradas);
      setModalTitle(titulo);
      setModalType(estado);
      setModalOpen(true);
    } catch (error) {
      console.error('Error al refrescar datos del dashboard:', error);
    } finally {
      // Ocultar loading global
      stopLoading();
    }
  };

  // Query principal para obtener todas las estadísticas del dashboard
  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ["dashboard-stats", dateRange.from, dateRange.to, empresaFiltro, analistaFiltro],
    queryFn: async (): Promise<DashboardStats> => {
      try {
        // Obtener estadísticas de empresas
        const { data: empresas, error: empresasError } = await supabase
          .from('empresas')
          .select('id, razon_social, activo');

        if (empresasError) throw empresasError;

        // Obtener estadísticas de candidatos
        const { data: candidatos, error: candidatosError } = await supabase
          .from('candidatos')
          .select('id, ciudad_id, activo');

        if (candidatosError) throw candidatosError;

        // Obtener estadísticas de solicitudes con filtros
        let solicitudesQuery = supabase
          .from('hum_solicitudes')
          .select(`
            id, 
            estado, 
            created_at, 
            updated_at,
            empresa_id, 
            analista_id,
            candidato_id,
            estructura_datos,
            empresas!empresa_id(
              razon_social, 
              ciudad
            ),
            candidatos!candidato_id(
              primer_nombre, 
              segundo_nombre,
              primer_apellido, 
              segundo_apellido,
              email,
              numero_documento
            )
          `);
        
        // Aplicar filtro de empresa
        if (empresaFiltro && empresaFiltro !== 'todas') {
          solicitudesQuery = solicitudesQuery.eq('empresa_id', empresaFiltro);
        }
        
        // Aplicar filtro de analista
        if (analistaFiltro && analistaFiltro !== 'todos') {
          solicitudesQuery = solicitudesQuery.eq('analista_id', analistaFiltro);
        }
        
        // Aplicar filtro de fechas
        if (dateRange.from && dateRange.to) {
          const fechaInicio = dateRange.from.toISOString().split('T')[0];
          const fechaFin = dateRange.to.toISOString().split('T')[0];
          solicitudesQuery = solicitudesQuery
            .gte('created_at', fechaInicio)
            .lte('created_at', fechaFin + 'T23:59:59.999Z');
        }
        
        const { data: solicitudes, error: solicitudesError } = await solicitudesQuery;

        if (solicitudesError) throw solicitudesError;

        // Enriquecer solicitudes con tipos_candidatos y analistas
        let solicitudesEnriquecidas = solicitudes || [];
        
        // Obtener IDs de cargos únicos
        const cargoIds = [...new Set(
          solicitudesEnriquecidas
            .map(s => s.estructura_datos?.cargo)
            .filter(cargo => cargo != null)
            .map(cargo => Number(cargo))
            .filter(id => !isNaN(id))
        )];

        // Obtener IDs de analistas únicos
        const analistaIds = [...new Set(
          solicitudesEnriquecidas
            .map(s => s.analista_id)
            .filter(id => id != null)
        )];

        // Obtener tipos de candidatos
        let tiposMap = new Map<number, { id: number; nombre: string }>();
        if (cargoIds.length > 0) {
          try {
            const { data: tipos } = await supabase
              .from('tipos_candidatos')
              .select('id, nombre')
              .in('id', cargoIds);
            (tipos || []).forEach((t: any) => tiposMap.set(t.id, t));
          } catch (error) {
            console.error('Error obteniendo tipos de candidatos:', error);
          }
        }

        // Obtener analistas
        let analistasMap = new Map<number, { id: number; primer_nombre: string; segundo_nombre: string; primer_apellido: string; segundo_apellido: string; email: string }>();
        if (analistaIds.length > 0) {
          try {
            const { data: analistasData, error: analistasError } = await supabase
              .from('gen_usuarios')
              .select('id, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, email')
              .in('id', analistaIds);
            
            if (analistasError) {
              console.error('Error obteniendo analistas:', analistasError);
            } else {
              (analistasData || []).forEach((a: any) => analistasMap.set(a.id, a));
              console.log(`✅ Analistas obtenidos: ${analistasData?.length || 0} de ${analistaIds.length} solicitados`);
            }
          } catch (error) {
            console.error('Error obteniendo analistas:', error);
          }
        }

        // Enriquecer solicitudes con tipos_candidatos y analistas
        solicitudesEnriquecidas = solicitudesEnriquecidas.map((s: any) => {
          const cargoId = s.estructura_datos?.cargo != null ? Number(s.estructura_datos.cargo) : undefined;
          const tipo = cargoId ? tiposMap.get(cargoId) : undefined;
          const analista = s.analista_id ? analistasMap.get(s.analista_id) : undefined;
          return { 
            ...s, 
            tipos_candidatos: tipo,
            gen_usuarios: analista
          };
        });

        // Debug: Log de datos obtenidos
        console.log('Solicitudes enriquecidas:', solicitudesEnriquecidas.slice(0, 2));
        console.log('Tipos map:', tiposMap);
        console.log('Analistas map:', analistasMap);

        // Guardar datos de solicitudes para los modales
        setSolicitudesData(solicitudesEnriquecidas);

        // Obtener estadísticas de usuarios
        const { data: usuarios, error: usuariosError } = await supabase
          .from('gen_usuarios')
          .select('id, activo');

        if (usuariosError) throw usuariosError;

        // Obtener estadísticas de prestadores
        const { data: prestadores, error: prestadoresError } = await supabase
          .from('prestadores')
          .select('id, activo');

        if (prestadoresError) throw prestadoresError;

        // Obtener ciudades para el análisis geográfico
        const { data: ciudades, error: ciudadesError } = await supabase
          .from('ciudades')
          .select('id, nombre');

        if (ciudadesError) throw ciudadesError;

        // Obtener logs de solicitudes para calcular promedios
        let logsQuery = supabase
          .from('hum_solicitudes_logs')
          .select(`
            id,
            solicitud_id,
            estado_anterior,
            estado_nuevo,
            fecha_accion,
            solicitud:hum_solicitudes!solicitud_id(
              id,
              empresa_id,
              analista_id,
              created_at
            )
          `)
          .order('fecha_accion', { ascending: true });

        // Aplicar filtro de fecha al log (fecha_accion)
        if (dateRange.from && dateRange.to) {
          const fechaInicio = dateRange.from.toISOString().split('T')[0];
          const fechaFin = dateRange.to.toISOString().split('T')[0];
          logsQuery = logsQuery
            .gte('fecha_accion', fechaInicio)
            .lte('fecha_accion', fechaFin + 'T23:59:59.999Z');
        }

        const { data: logsRaw, error: logsError } = await logsQuery;

        if (logsError) {
          console.error('Error obteniendo logs:', logsError);
        }

        // Filtrar logs manualmente por empresa y analista ya que el filtro directo por relación no funciona bien
        let logs = logsRaw || [];
        
        if (empresaFiltro && empresaFiltro !== 'todas') {
          logs = logs.filter((log: any) => 
            log.solicitud?.empresa_id?.toString() === empresaFiltro.toString()
          );
        }
        
        if (analistaFiltro && analistaFiltro !== 'todos') {
          logs = logs.filter((log: any) => 
            log.solicitud?.analista_id?.toString() === analistaFiltro.toString()
          );
        }

        // Calcular estadísticas
        const totalEmpresas = empresas?.length || 0;
        const totalCandidatos = candidatos?.length || 0;
        const totalSolicitudes = solicitudes?.length || 0;
        const totalUsuarios = usuarios?.length || 0;
        const totalPrestadores = prestadores?.length || 0;

        // Solicitudes por estado
        const solicitudesPorEstado = solicitudes?.reduce((acc: any, solicitud) => {
          acc[solicitud.estado] = (acc[solicitud.estado] || 0) + 1;
          return acc;
        }, {}) || {};

        const solicitudesPorEstadoArray = Object.entries(solicitudesPorEstado).map(([estado, cantidad]) => ({
          estado: estado.charAt(0).toUpperCase() + estado.slice(1).replace('_', ' '),
          cantidad: cantidad as number
        }));

        // Solicitudes de hoy
        const hoy = new Date().toISOString().slice(0, 10);
        const solicitudesHoy = solicitudes?.filter(s =>
          s.created_at && s.created_at.slice(0, 10) === hoy
        ).length || 0;

        // Solicitudes pendientes (estado asignado)
        const solicitudesPendientes = solicitudes?.filter(s =>
          s.estado === 'asignado'
        ).length || 0;

        // Exámenes médicos (estado citado examenes)
        const examenesMedicos = solicitudes?.filter(s =>
          s.estado?.toLowerCase() === 'citado examenes'
        ).length || 0;

        // Solicitudes contratadas
        const solicitudesContratadas = solicitudes?.filter(s =>
          s.estado === 'contratado'
        ).length || 0;

        // Solicitudes descartadas, canceladas, stand by
        const solicitudesDescartadas = solicitudes?.filter(s => {
          const estadoOriginal = s.estado;
          const estadoLower = s.estado?.toLowerCase();
          const estadoSinGuiones = s.estado?.replace(/_/g, '').toLowerCase();
          
          const esDescartada = estadoLower === 'descartado' || 
                 estadoLower === 'cancelada' || 
                 estadoLower === 'cancelado' ||
                 estadoLower === 'stand_by' || 
                 estadoLower === 'standby' ||
                 estadoLower === 'stand by' ||
                 estadoSinGuiones === 'standby' ||
                 estadoLower === 'desertada' ||
                 estadoLower === 'desertado';
          
          // Debug: Log para solicitudes que coinciden
          if (esDescartada) {
            console.log('✅ Solicitud descartada encontrada en estadísticas:', {
              id: s.id,
              estadoOriginal: estadoOriginal,
              estadoLower: estadoLower,
              estadoSinGuiones: estadoSinGuiones
            });
          }
          
          return esDescartada;
        }).length || 0;
        
        // Debug: Log de todas las solicitudes con sus estados
        console.log('🔍 Todas las solicitudes y sus estados:', solicitudes?.map(s => ({
          id: s.id,
          estado: s.estado,
          estadoLower: s.estado?.toLowerCase()
        })));

        // Top empresas por cantidad de solicitudes
        const empresasPorSolicitudes = solicitudes?.reduce((acc: any, solicitud) => {
          if (solicitud.empresa_id) {
            acc[solicitud.empresa_id] = (acc[solicitud.empresa_id] || 0) + 1;
          }
          return acc;
        }, {}) || {};

        const topEmpresas = Object.entries(empresasPorSolicitudes)
          .map(([empresaId, cantidad]) => {
            const empresa = empresas?.find(e => e.id === parseInt(empresaId));
            return {
              nombre: empresa?.razon_social || 'Empresa Desconocida',
              cantidad: cantidad as number
            };
          })
          .sort((a, b) => b.cantidad - a.cantidad)
          .slice(0, 5);

        // Solicitudes por mes (últimos 6 meses)
        const solicitudesPorMes = [];
        for (let i = 5; i >= 0; i--) {
          const fecha = new Date();
          fecha.setMonth(fecha.getMonth() - i);
          const mes = fecha.toLocaleDateString('es-ES', { month: 'short' });
          const cantidad = solicitudes?.filter(s => {
            const solicitudFecha = new Date(s.created_at);
            return solicitudFecha.getMonth() === fecha.getMonth() &&
              solicitudFecha.getFullYear() === fecha.getFullYear();
          }).length || 0;

          solicitudesPorMes.push({ mes, cantidad });
        }

        // Candidatos por ciudad
        const candidatosPorCiudad = candidatos?.reduce((acc: any, candidato) => {
          if (candidato.ciudad_id) {
            const ciudad = ciudades?.find(c => c.id === candidato.ciudad_id);
            const nombreCiudad = ciudad?.nombre || 'Ciudad Desconocida';
            acc[nombreCiudad] = (acc[nombreCiudad] || 0) + 1;
          }
          return acc;
        }, {}) || {};

        const candidatosPorCiudadArray = Object.entries(candidatosPorCiudad)
          .map(([ciudad, cantidad]) => ({ ciudad, cantidad: cantidad as number }))
          .sort((a, b) => b.cantidad - a.cantidad)
          .slice(0, 8);

        // Usuarios activos/inactivos
        const usuariosActivos = usuarios?.filter(u => u.activo).length || 0;
        const usuariosInactivos = usuarios?.filter(u => !u.activo).length || 0;

        // Prestadores activos/inactivos
        const prestadoresActivos = prestadores?.filter(p => p.activo).length || 0;
        const prestadoresInactivos = prestadores?.filter(p => !p.activo).length || 0;

        // Función auxiliar para formatear tiempo en HH:MM:SS
        const formatearTiempo = (milisegundos: number): { dias: number; horas: number; tiempo: string } => {
          const totalSegundos = Math.floor(milisegundos / 1000);
          const totalMinutos = Math.floor(totalSegundos / 60);
          const totalHoras = Math.floor(totalMinutos / 60);
          const dias = Math.floor(totalHoras / 24);
          
          const horas = totalHoras % 24;
          const minutos = totalMinutos % 60;
          const segundos = totalSegundos % 60;
          
          const tiempoFormateado = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
          
          return { 
            dias, 
            horas: totalHoras, 
            tiempo: tiempoFormateado 
          };
        };

        // Calcular promedio de tiempo de procesamiento (simulado por ahora)
        // Calcular promedios reales basados en logs
        const calcularPromedioEnContactar = () => {
          if (!logs || logs.length === 0) return { dias: 0, horas: 0, tiempo: '00:00:00', cantidad: 0 };
          
          // Contar directamente los logs donde se contactó (cambió a pendiente documentos desde asignado)
          const logsContacto = logs.filter((log: any) => 
            log.estado_anterior?.toLowerCase() === 'asignado' && 
            log.estado_nuevo?.toLowerCase() === 'pendiente documentos'
          );
          
          const cantidadContactadas = logsContacto.length;
          
          // Agrupar logs por solicitud_id
          const logsPorSolicitud = logs.reduce((acc: any, log) => {
            if (!acc[log.solicitud_id]) {
              acc[log.solicitud_id] = [];
            }
            acc[log.solicitud_id].push(log);
            return acc;
          }, {});
          
          const tiemposMs: number[] = [];
          
          // Para cada solicitud, buscar el tiempo entre "asignado" y "pendiente documentos"
          Object.keys(logsPorSolicitud).forEach(solicitudId => {
            const logsOrdenados = logsPorSolicitud[solicitudId].sort((a: any, b: any) => 
              new Date(a.fecha_accion).getTime() - new Date(b.fecha_accion).getTime()
            );
            
            // Buscar cuando cambió a "asignado"
            const logAsignado = logsOrdenados.find((log: any) => 
              log.estado_nuevo?.toLowerCase() === 'asignado'
            );
            
            // Buscar cuando cambió de "asignado" a "pendiente documentos"
            const logPendienteDoc = logsOrdenados.find((log: any) => 
              log.estado_anterior?.toLowerCase() === 'asignado' && 
              log.estado_nuevo?.toLowerCase() === 'pendiente documentos'
            );
            
            if (logAsignado && logPendienteDoc) {
              const fechaAsignado = new Date(logAsignado.fecha_accion);
              const fechaPendienteDoc = new Date(logPendienteDoc.fecha_accion);
              const diferencia = fechaPendienteDoc.getTime() - fechaAsignado.getTime();
              
              if (diferencia > 0) {
                tiemposMs.push(diferencia);
              }
            }
          });
          
          if (tiemposMs.length === 0) return { dias: 0, horas: 0, tiempo: '00:00:00', cantidad: cantidadContactadas };
          
          const promedioMs = tiemposMs.reduce((a, b) => a + b, 0) / tiemposMs.length;
          return { ...formatearTiempo(promedioMs), cantidad: cantidadContactadas };
        };

        const calcularPromedioContratadas = () => {
          if (!solicitudes || solicitudes.length === 0) return { dias: 0, horas: 0, tiempo: '00:00:00' };
          
          const solicitudesContratadas = solicitudes.filter(s => 
            s.estado?.toLowerCase() === 'contratado' && s.updated_at
          );
          
          if (solicitudesContratadas.length === 0) return { dias: 0, horas: 0, tiempo: '00:00:00' };
          
          const tiemposMs = solicitudesContratadas.map(solicitud => {
            const fechaCreacion = new Date(solicitud.created_at);
            const fechaContratado = new Date(solicitud.updated_at);
            return fechaContratado.getTime() - fechaCreacion.getTime();
          }).filter(tiempo => tiempo > 0);
          
          if (tiemposMs.length === 0) return { dias: 0, horas: 0, tiempo: '00:00:00' };
          
          const promedioMs = tiemposMs.reduce((a, b) => a + b, 0) / tiemposMs.length;
          return formatearTiempo(promedioMs);
        };

        const calcularPromedioEntregaDocumentos = () => {
          if (!logs || logs.length === 0) return { dias: 0, horas: 0, tiempo: '00:00:00', cantidad: 0 };
          
          // Contar directamente los logs donde se entregaron documentos (cambió de pendiente documentos a documentos entregados)
          const logsEntregaDocumentos = logs.filter((log: any) => 
            log.estado_anterior?.toLowerCase() === 'pendiente documentos' && 
            log.estado_nuevo?.toLowerCase() === 'documentos entregados'
          );
          
          const cantidadDocumentosEntregados = logsEntregaDocumentos.length;
          
          // Agrupar logs por solicitud_id
          const logsPorSolicitud = logs.reduce((acc: any, log) => {
            if (!acc[log.solicitud_id]) {
              acc[log.solicitud_id] = [];
            }
            acc[log.solicitud_id].push(log);
            return acc;
          }, {});
          
          const tiemposMs: number[] = [];
          
          // Para cada solicitud, buscar el tiempo entre "pendiente documentos" y "documentos entregados"
          Object.keys(logsPorSolicitud).forEach(solicitudId => {
            const logsOrdenados = logsPorSolicitud[solicitudId].sort((a: any, b: any) => 
              new Date(a.fecha_accion).getTime() - new Date(b.fecha_accion).getTime()
            );
            
            // Buscar cuando cambió a "pendiente documentos"
            const logPendienteDoc = logsOrdenados.find((log: any) => 
              log.estado_nuevo?.toLowerCase() === 'pendiente documentos'
            );
            
            // Buscar cuando cambió de "pendiente documentos" a "documentos entregados"
            const logDocumentosEntregados = logsOrdenados.find((log: any) => 
              log.estado_anterior?.toLowerCase() === 'pendiente documentos' && 
              log.estado_nuevo?.toLowerCase() === 'documentos entregados'
            );
            
            if (logPendienteDoc && logDocumentosEntregados) {
              const fechaPendienteDoc = new Date(logPendienteDoc.fecha_accion);
              const fechaDocumentosEntregados = new Date(logDocumentosEntregados.fecha_accion);
              const diferencia = fechaDocumentosEntregados.getTime() - fechaPendienteDoc.getTime();
              
              if (diferencia > 0) {
                tiemposMs.push(diferencia);
              }
            }
          });
          
          if (tiemposMs.length === 0) return { dias: 0, horas: 0, tiempo: '00:00:00', cantidad: cantidadDocumentosEntregados };
          
          const promedioMs = tiemposMs.reduce((a, b) => a + b, 0) / tiemposMs.length;
          return { ...formatearTiempo(promedioMs), cantidad: cantidadDocumentosEntregados };
        };

        const resultadoEnContactar = calcularPromedioEnContactar();
        const resultadoContratadas = calcularPromedioContratadas();
        const resultadoEntregaDocumentos = calcularPromedioEntregaDocumentos();
        
        // Extraer días, horas y tiempo formateado
        const promedioEnContactar = resultadoEnContactar.dias;
        const promedioEnContactarHoras = resultadoEnContactar.horas;
        const promedioEnContactarTiempo = resultadoEnContactar.tiempo;
        const cantidadSolicitudesContactadas = resultadoEnContactar.cantidad;
        const promedioContratadas = resultadoContratadas.dias;
        const promedioContratadasHoras = resultadoContratadas.horas;
        const promedioContratadasTiempo = resultadoContratadas.tiempo;
        const promedioEntregaDocumentos = resultadoEntregaDocumentos.dias;
        const promedioEntregaDocumentosHoras = resultadoEntregaDocumentos.horas;
        const promedioEntregaDocumentosTiempo = resultadoEntregaDocumentos.tiempo;
        const cantidadDocumentosEntregados = resultadoEntregaDocumentos.cantidad;
        
        // Mantener el promedioTiempoProcesamiento para compatibilidad (usar promedio de contratadas)
        const promedioTiempoProcesamiento = promedioContratadas;

        return {
          totalEmpresas,
          totalCandidatos,
          totalSolicitudes,
          totalUsuarios,
          totalPrestadores,
          solicitudesHoy,
          solicitudesPendientes,
          examenesMedicos,
          solicitudesContratadas,
          solicitudesDescartadas,
          promedioTiempoProcesamiento: promedioTiempoProcesamiento,
          promedioEnContactar,
          promedioContratadas,
          promedioEntregaDocumentos,
          promedioEnContactarHoras,
          promedioContratadasHoras,
          promedioEntregaDocumentosHoras,
          promedioEnContactarTiempo,
          promedioContratadasTiempo,
          promedioEntregaDocumentosTiempo,
          cantidadSolicitudesContactadas,
          cantidadDocumentosEntregados,
          topEmpresas,
          solicitudesPorEstado: solicitudesPorEstadoArray,
          solicitudesPorMes,
          candidatosPorCiudad: candidatosPorCiudadArray,
          usuariosActivos,
          usuariosInactivos,
          prestadoresActivos,
          prestadoresInactivos,
          solicitudes: solicitudesEnriquecidas // Agregar las solicitudes completas
        };
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        throw error;
      }
    },
    refetchInterval: 300000, // Refrescar cada 5 minutos
  });

  // Colores para las gráficas
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C80'];

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-4 w-4 bg-gray-200 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error al cargar el dashboard</h3>
              <div className="mt-2 text-sm text-red-700">
                {error instanceof Error ? error.message : 'Error desconocido'}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Can action="vista-dashboard">
      <div className="p-6 space-y-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
        {/* Filtros alineados a la derecha */}
        <div className="flex justify-end">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Selector de rango de fechas moderno */}
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              placeholder="Seleccionar rango de fechas"
              className="w-[320px] min-w-[280px] max-w-[400px]"
              showPresets={true}
            />

            {/* Filtro de Empresa */}
            <SelectWithSearch
              value={empresaFiltro}
              onValueChange={setEmpresaFiltro}
              placeholder="Seleccionar empresa"
              disabled={tieneEmpresaAsociada}
              className={`w-[280px] min-w-[200px] max-w-[400px] ${tieneEmpresaAsociada ? "bg-gray-100" : ""}`}
              options={[
                { value: "todas", label: "Todas las empresas" },
                ...empresas.map((empresa) => ({
                  value: empresa.id.toString(),
                  label: empresa.razon_social || empresa.razonSocial,
                  searchText: `${empresa.razon_social || empresa.razonSocial} ${empresa.nit || ''} ${empresa.email || ''}`
                }))
              ]}
              emptyText="No se encontraron empresas"
            />

            {/* Filtro de Analista */}
            <SelectWithSearch
              value={analistaFiltro}
              onValueChange={setAnalistaFiltro}
              placeholder="Seleccionar analista"
              disabled={!!esAnalista}
              className={`w-[280px] min-w-[200px] max-w-[400px] ${esAnalista ? "bg-gray-100" : ""}`}
              options={[
                { value: "todos", label: "Todos los analistas" },
                ...analistas.map((analista) => ({
                  value: analista.id?.toString() || 'sin-id',
                  label: `${analista.primer_nombre || ''} ${analista.primer_apellido || ''} (${analista.email || ''})`,
                  searchText: `${analista.primer_nombre || ''} ${analista.primer_apellido || ''} ${analista.email || ''} ${analista.username || ''}`
                }))
              ]}
              emptyText="No se encontraron analistas"
            />
          </div>
        </div>

        {/* Separador */}
        <hr className="border-gray-200" />


      {/* Métricas Principales */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div 
          onClick={() => handleCardClick('asignado', 'Solicitudes Pendientes')}
          className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
        >
          <StatCard
            title="Solicitudes Pendientes"
            value={stats?.solicitudesPendientes || 0}
            description="Solicitudes en estado asignado"
            icon={<ClipboardList className="h-5 w-5" />}
            color="blue"
            trend={{ value: calcularTendencia(stats?.solicitudesPendientes || 0, 10), isPositive: true }}
          />
        </div>
        <div 
          onClick={() => handleCardClick('citado_examenes', 'Exámenes Médicos')}
          className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
        >
          <StatCard
            title="Exámenes Médicos"
            value={stats?.examenesMedicos || 0}
            description="Solicitudes citadas para exámenes"
            icon={<Stethoscope className="h-5 w-5" />}
            color="green"
            trend={{ value: calcularTendencia(stats?.examenesMedicos || 0, 8), isPositive: true }}
          />
        </div>
        <div 
          onClick={() => handleCardClick('contratado', 'Solicitudes Contratadas')}
          className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
        >
          <StatCard
            title="Solicitudes Contratadas"
            value={stats?.solicitudesContratadas || 0}
            description="Solicitudes exitosas"
            icon={<Briefcase className="h-5 w-5" />}
            color="purple"
            trend={{ value: calcularTendencia(stats?.solicitudesContratadas || 0, 15), isPositive: true }}
          />
        </div>
        <div 
          onClick={() => handleCardClick('descartado', 'Solicitudes Canceladas/Desertadas')}
          className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
        >
          <StatCard
            title="Solicitudes Canceladas/Desertadas"
            value={stats?.solicitudesDescartadas || 0}
            description="Solicitudes canceladas, desertadas y stand by"
            icon={<XCircle className="h-5 w-5" />}
            color="orange"
            trend={{ value: calcularTendencia(stats?.solicitudesDescartadas || 0, 5), isPositive: true }}
          />
        </div>
      </div>

      {/* Tabs del Dashboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
          <TabsTrigger value="overview" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300">Vista General</TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300">Análisis</TabsTrigger>
          <TabsTrigger value="performance" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300">Rendimiento</TabsTrigger>
          <TabsTrigger value="geography" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300">Geografía</TabsTrigger>
        </TabsList>

        {/* Tab: Vista General */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Gráfica de Solicitudes por Estado */}
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-500" />
                  Estado de Solicitudes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats?.solicitudesPorEstado || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="cantidad"
                      >
                        {stats?.solicitudesPorEstado?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Gráfica de Solicitudes por Mes */}
            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Solicitudes por Mes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats?.solicitudesPorMes || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" />
                      <YAxis />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="cantidad"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Métricas de Rendimiento */}
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Promedio Contratadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {stats?.promedioContratadas || 0} días
                </div>
                <p className="text-sm text-green-500 mb-2 font-mono">
                  {stats?.promedioContratadasTiempo || '00:00:00'} (HH:MM:SS)
                </p>
                {/* Barra de progreso con 3 colores: verde (0-3), amarillo (3.1-4), rojo (≥5) */}
                <div className="relative">
                  <Progress 
                    value={Math.min((stats?.promedioContratadas || 0) / 4 * 100, 100)} 
                    className={`h-2 bg-gray-200 ${
                      (stats?.promedioContratadas || 0) <= 3 
                        ? '[&>div]:bg-green-500' 
                        : (stats?.promedioContratadas || 0) < 4 
                          ? '[&>div]:bg-yellow-500' 
                          : '[&>div]:bg-red-500'
                    }`}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Meta: 4 días Habiles {(stats?.promedioContratadas || 0) >= 4 && 
                    <span className="text-red-600 font-semibold ml-2">⚠️ Meta alcanzada/superada</span>
                  }
                  {(stats?.promedioContratadas || 0) > 3 && (stats?.promedioContratadas || 0) < 4 && 
                    <span className="text-yellow-600 font-semibold ml-2">⚠️ Cerca del límite</span>
                  }
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-blue-500" />
                  Promedio en Contactar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {stats?.promedioEnContactar || 0} días
                </div>
                <p className="text-sm text-blue-500 mb-2 font-mono">
                  {stats?.promedioEnContactarTiempo || '00:00:00'} (HH:MM:SS)
                </p>
                {/* Barra de progreso con 3 colores basado en meta de 1 día */}
                <Progress 
                  value={Math.min((stats?.promedioEnContactar || 0) / 1 * 100, 100)} 
                  className={`h-2 bg-gray-200 ${
                    (stats?.promedioEnContactar || 0) <= 0.5 
                      ? '[&>div]:bg-green-500' 
                      : (stats?.promedioEnContactar || 0) < 1 
                        ? '[&>div]:bg-yellow-500' 
                        : '[&>div]:bg-red-500'
                  }`}
                />
                
                <p className="text-xs text-gray-600 mt-1">
                  Meta: 1 día {(stats?.promedioEnContactar || 0) >= 1 && 
                    <span className="text-red-600 font-semibold ml-2">⚠️ Meta alcanzada/superada</span>
                  }
                  {(stats?.promedioEnContactar || 0) > 0.5 && (stats?.promedioEnContactar || 0) < 1 && 
                    <span className="text-yellow-600 font-semibold ml-2">⚠️ Cerca del límite</span>
                  }
                </p>
                <p className="text-xs text-blue-600 font-medium mt-1">
                  📊 {stats?.cantidadSolicitudesContactadas || 0} solicitudes contactadas
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-orange-500" />
                  Promedio Entrega Documentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600 mb-1">
                  {stats?.promedioEntregaDocumentos || 0} días
                </div>
                <p className="text-sm text-orange-500 mb-2 font-mono">
                  {stats?.promedioEntregaDocumentosTiempo || '00:00:00'} (HH:MM:SS)
                </p>
                {/* Barra de progreso con 3 colores: verde (0-3), amarillo (3.1-4), rojo (≥5) */}
                <Progress 
                  value={Math.min((stats?.promedioEntregaDocumentos || 0) / 5 * 100, 100)} 
                  className={`h-2 bg-gray-200 ${
                    (stats?.promedioEntregaDocumentos || 0) <= 3 
                      ? '[&>div]:bg-green-500' 
                      : (stats?.promedioEntregaDocumentos || 0) < 5 
                        ? '[&>div]:bg-yellow-500' 
                        : '[&>div]:bg-red-500'
                  }`}
                />
                
                <p className="text-xs text-orange-600 font-medium mt-1">
                  📊 {stats?.cantidadDocumentosEntregados || 0} Solicitudes con documentos entregados
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Análisis */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Top Empresas por Solicitudes */}
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-purple-500" />
                  Top Empresas por Solicitudes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats?.topEmpresas || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="nombre" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="cantidad" fill="#8b5cf6" />
                      {stats?.topEmpresas?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Gráfica de Radar - Rendimiento por Categoría */}
            <Card className="border-l-4 border-l-pink-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-pink-500" />
                  Rendimiento por Categoría
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={[
                      { categoria: 'Empresas', valor: 85, fullMark: 100 },
                      { categoria: 'Candidatos', valor: 78, fullMark: 100 },
                      { categoria: 'Solicitudes', valor: 92, fullMark: 100 },
                      { categoria: 'Usuarios', valor: 88, fullMark: 100 },
                      { categoria: 'Prestadores', valor: 75, fullMark: 100 }
                    ]}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="categoria" />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} />
                      <Radar name="Rendimiento" dataKey="valor" stroke="#ec4899" fill="#ec4899" fillOpacity={0.3} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Segunda fila de gráficas */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Gráfica de Embudo - Proceso de Solicitudes */}
            <Card className="border-l-4 border-l-orange-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-orange-500" />
                  Proceso de Solicitudes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <FunnelChart>
                      <Tooltip />
                      <Funnel
                        dataKey="valor"
                        data={[
                          { name: 'Recibidas', valor: 1250, fill: '#f97316' },
                          { name: 'En Revisión', valor: 980, fill: '#eab308' },
                          { name: 'Aprobadas', valor: 856, fill: '#22c55e' },
                          { name: 'Completadas', valor: 720, fill: '#3b82f6' }
                        ]}
                        fill={COLORS[0]}
                        isAnimationActive
                      />
                    </FunnelChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Gráfica de Dispersión - Candidatos por Edad y Ciudad */}
            <Card className="border-l-4 border-l-cyan-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-cyan-500" />
                  Candidatos por Edad y Ciudad
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart>
                      <CartesianGrid />
                      <XAxis type="number" dataKey="edad" name="Edad" />
                      <YAxis type="number" dataKey="ciudad" name="Ciudad" />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                      <Scatter name="Candidatos" data={[
                        { edad: 25, ciudad: 1, fill: '#06b6d4' },
                        { edad: 30, ciudad: 2, fill: '#06b6d4' },
                        { edad: 35, ciudad: 3, fill: '#06b6d4' },
                        { edad: 28, ciudad: 1, fill: '#06b6d4' },
                        { edad: 30, ciudad: 2, fill: '#06b6d4' }
                      ]} fill="#06b6d4" />
                      {[
                        { edad: 25, ciudad: 1, fill: '#06b6d4' },
                        { edad: 30, ciudad: 2, fill: '#06b6d4' },
                        { edad: 35, ciudad: 3, fill: '#06b6d4' },
                        { edad: 28, ciudad: 1, fill: '#06b6d4' },
                        { edad: 30, ciudad: 2, fill: '#06b6d4' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tercera fila de gráficas */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Gráfica de Composed - Solicitudes por Mes con Múltiples Métricas */}
            <Card className="border-l-4 border-l-emerald-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                  Solicitudes por Mes - Múltiples Métricas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={stats?.solicitudesPorMes || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="cantidad" fill="#10b981" opacity={0.8} />
                      <Line type="monotone" dataKey="aprobadas" stroke="#3b82f6" strokeWidth={2} />
                      <Line type="monotone" dataKey="rechazadas" stroke="#ef4444" strokeWidth={2} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Distribución de Usuarios y Prestadores */}
            <Card className="border-l-4 border-l-indigo-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-500" />
                  Distribución de Usuarios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Usuarios Activos</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {stats?.usuariosActivos || 0}
                    </Badge>
                  </div>
                  <Progress value={(stats?.usuariosActivos || 0) / (stats?.totalUsuarios || 1) * 100} className="h-2" />

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Prestadores Activos</span>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {stats?.prestadoresActivos || 0}
                    </Badge>
                  </div>
                  <Progress value={(stats?.prestadoresActivos || 0) / (stats?.totalPrestadores || 1) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Rendimiento */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Gráfica de Línea de Rendimiento */}
            <Card className="border-l-4 border-l-teal-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-teal-500" />
                  Rendimiento del Sistema
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats?.solicitudesPorMes || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="cantidad"
                        stroke="#14b8a6"
                        strokeWidth={3}
                        name="Solicitudes"
                        activeDot={{ r: 8, fill: '#14b8a6' }}
                      />
                      {stats?.solicitudesPorMes?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Gráfica de Área - Tendencias de Crecimiento */}
            <Card className="border-l-4 border-l-rose-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-rose-500" />
                  Tendencias de Crecimiento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[
                      { mes: 'Ene', empresas: 35, candidatos: 650, solicitudes: 120 },
                      { mes: 'Feb', empresas: 38, candidatos: 720, solicitudes: 135 },
                      { mes: 'Mar', empresas: 40, candidatos: 780, solicitudes: 98 },
                      { mes: 'Abr', empresas: 42, candidatos: 820, solicitudes: 156 },
                      { mes: 'May', empresas: 45, candidatos: 870, solicitudes: 178 },
                      { mes: 'Jun', empresas: 45, candidatos: 890, solicitudes: 145 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="empresas" stackId="1" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="candidatos" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="solicitudes" stackId="1" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.6} />
                      {[
                        { dataKey: 'empresas', color: '#f43f5e' },
                        { dataKey: 'candidatos', color: '#8b5cf6' },
                        { dataKey: 'solicitudes', color: '#06b6d4' }
                      ].map((item, index) => (
                        <Cell key={`cell-${index}`} fill={item.color} />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Segunda fila de gráficas */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Gráfica de Barras Apiladas - Distribución por Departamento */}
            <Card className="border-l-4 border-l-violet-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-violet-500" />
                  Distribución por Departamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { departamento: 'Antioquia', solicitudes: 234, candidatos: 189, empresas: 12 },
                      { departamento: 'Cundinamarca', solicitudes: 189, candidatos: 156, empresas: 15 },
                      { departamento: 'Valle del Cauca', solicitudes: 156, candidatos: 123, empresas: 8 },
                      { departamento: 'Atlántico', solicitudes: 123, candidatos: 98, empresas: 6 },
                      { departamento: 'Bolívar', solicitudes: 98, candidatos: 76, empresas: 4 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="departamento" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="solicitudes" stackId="a" fill="#8b5cf6" />
                      <Bar dataKey="candidatos" stackId="a" fill="#06b6d4" />
                      <Bar dataKey="empresas" stackId="a" fill="#f59e0b" />
                      {[
                        { dataKey: 'solicitudes', color: '#8b5cf6' },
                        { dataKey: 'candidatos', color: '#06b6d4' },
                        { dataKey: 'empresas', color: '#f59e0b' }
                      ].map((item, index) => (
                        <Cell key={`cell-${index}`} fill={item.color} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Métricas de Eficiencia */}
            <Card className="border-l-4 border-l-amber-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-500" />
                  Métricas de Eficiencia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Tasa de Aprobación</span>
                      <span className="text-sm font-bold text-green-600">
                        {stats?.totalSolicitudes ? Math.round((stats.solicitudesContratadas / stats.totalSolicitudes) * 100) : 0}%
                      </span>
                    </div>
                    <Progress
                      value={stats?.totalSolicitudes ? (stats.solicitudesContratadas / stats.totalSolicitudes) * 100 : 0}
                      className="h-2 bg-gray-200"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Tasa de Rechazo</span>
                      <span className="text-sm font-bold text-red-600">
                        {stats?.totalSolicitudes ? Math.round((stats.solicitudesDescartadas / stats.totalSolicitudes) * 100) : 0}%
                      </span>
                    </div>
                    <Progress
                      value={stats?.totalSolicitudes ? (stats.solicitudesDescartadas / stats.totalSolicitudes) * 100 : 0}
                      className="h-2 bg-gray-200"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Solicitudes Pendientes</span>
                      <span className="text-sm font-bold text-yellow-600">
                        {stats?.totalSolicitudes ? Math.round((stats.solicitudesPendientes / stats.totalSolicitudes) * 100) : 0}%
                      </span>
                    </div>
                    <Progress
                      value={stats?.totalSolicitudes ? (stats.solicitudesPendientes / stats.totalSolicitudes) * 100 : 0}
                      className="h-2 bg-gray-200"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Geografía */}
        <TabsContent value="geography" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Candidatos por Ciudad */}
            <Card className="border-l-4 border-l-pink-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-pink-500" />
                  Candidatos por Ciudad
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats?.candidatosPorCiudad || []} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="ciudad" type="category" width={100} />
                      <Tooltip />
                      <Bar dataKey="cantidad" fill="#ec4899" />
                      {stats?.candidatosPorCiudad?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                      {stats?.candidatosPorCiudad?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Gráfica de Donut - Distribución por Tipo */}
            <Card className="border-l-4 border-l-cyan-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-cyan-500" />
                  Distribución por Tipo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Empresas', value: stats?.totalEmpresas || 0, fill: '#3b82f6' },
                          { name: 'Candidatos', value: stats?.totalCandidatos || 0, fill: '#10b981' },
                          { name: 'Solicitudes', value: stats?.totalSolicitudes || 0, fill: '#f59e0b' },
                          { name: 'Usuarios', value: stats?.totalUsuarios || 0, fill: '#8b5cf6' }
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={40}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {[
                          { name: 'Empresas', value: stats?.totalEmpresas || 0, fill: '#3b82f6' },
                          { name: 'Candidatos', value: stats?.totalCandidatos || 0, fill: '#10b981' },
                          { name: 'Solicitudes', value: stats?.totalSolicitudes || 0, fill: '#f59e0b' },
                          { name: 'Usuarios', value: stats?.totalUsuarios || 0, fill: '#8b5cf6' }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Segunda fila de gráficas */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Resumen Geográfico */}
            <Card className="border-l-4 border-l-emerald-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-emerald-500" />
                  Resumen Geográfico
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{stats?.totalEmpresas || 0}</div>
                      <div className="text-sm text-blue-600">Empresas</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{stats?.totalCandidatos || 0}</div>
                      <div className="text-sm text-green-600">Candidatos</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-700">Top Ciudades</h4>
                    {stats?.candidatosPorCiudad?.slice(0, 5).map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm font-medium">{item.ciudad}</span>
                        <Badge variant="outline">{item.cantidad}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gráfica de Barras Horizontales - Comparación Regional */}
            <Card className="border-l-4 border-l-rose-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-rose-500" />
                  Comparación Regional
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { region: 'Caribe', solicitudes: 156, candidatos: 123, empresas: 8 },
                      { region: 'Andina', solicitudes: 234, candidatos: 189, empresas: 15 },
                      { region: 'Pacífica', solicitudes: 98, candidatos: 76, empresas: 6 },
                      { region: 'Orinoquía', solicitudes: 67, candidatos: 45, empresas: 4 },
                      { region: 'Amazonía', solicitudes: 34, candidatos: 23, empresas: 2 }
                    ]} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="region" type="category" width={80} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="solicitudes" stackId="a" fill="#f43f5e" />
                      <Bar dataKey="candidatos" stackId="a" fill="#8b5cf6" />
                      <Bar dataKey="empresas" stackId="a" fill="#06b6d4" />
                      {[
                        { dataKey: 'solicitudes', color: '#f43f5e' },
                        { dataKey: 'candidatos', color: '#8b5cf6' },
                        { dataKey: 'empresas', color: '#06b6d4' }
                      ].map((item, index) => (
                        <Cell key={`cell-${index}`} fill={item.color} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer con información adicional */}
        <div className="mt-8 p-6 bg-white rounded-lg border border-gray-200">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Dashboard actualizado en tiempo real • Última actualización: {new Date().toLocaleString('es-ES')}
            </p>
          </div>
        </div>
      </div>

      {/* Modal para mostrar solicitudes */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {modalTitle}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 overflow-y-auto max-h-[75vh]">
            {/* Contenedor con diseño similar a tipos de documentos */}
            <div className="bg-white rounded-lg border">
              {/* Tabla con diseño profesional */}
              <div className="overflow-x-auto rounded-lg shadow-sm">
                <Table className="min-w-[1000px] w-full text-xs">
                  <TableHeader className="bg-cyan-50">
                    <TableRow className="text-left font-semibold text-gray-700">
                      <TableHead className="px-2 py-1 text-teal-600">ID</TableHead>
                      <TableHead className="px-4 py-3">Empresa</TableHead>
                      <TableHead className="px-4 py-3">Candidato</TableHead>
                      <TableHead className="px-4 py-3">Cargo</TableHead>
                      <TableHead className="px-4 py-3">Analista</TableHead>
                      {modalType === 'descartado' && <TableHead className="px-4 py-3">Estado</TableHead>}
                      <TableHead className="px-4 py-3">Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {modalData.length > 0 ? (
                      modalData.map((solicitud) => (
                        <TableRow key={solicitud.id} className="hover:bg-gray-50">
                          <TableCell className="px-2 py-1">
                            <span className="font-bold text-cyan-600">#{solicitud.id}</span>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className="text-sm text-gray-900 font-medium">
                                {solicitud.empresas?.razon_social || 'Sin empresa'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {solicitud.empresas?.ciudad || 'Sin ciudad'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className="text-sm text-gray-900 font-medium">
                                {solicitud.candidatos ? 
                                  `${solicitud.candidatos.primer_nombre || ''} ${solicitud.candidatos.segundo_nombre || ''} ${solicitud.candidatos.primer_apellido || ''} ${solicitud.candidatos.segundo_apellido || ''}`.trim() || 'Sin nombre' 
                                  : 'Sin candidato'
                                }
                              </span>
                              <span className="text-xs text-gray-500">
                                {solicitud.candidatos?.email || 'Sin email'}
                              </span>
                              <span className="text-xs text-gray-400">
                                {solicitud.candidatos?.numero_documento || 'Sin documento'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className="text-sm text-gray-500">
                                {solicitud.tipos_candidatos?.nombre || 
                                 solicitud.estructura_datos?.cargo || 
                                 solicitud.estructura_datos?.datos?.cargo || 
                                 '-'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="flex flex-col">
                              {solicitud.gen_usuarios ? (
                                <>
                                  <span className="text-sm text-gray-900 font-medium">
                                    {`${solicitud.gen_usuarios.primer_nombre || ''} ${solicitud.gen_usuarios.segundo_nombre || ''} ${solicitud.gen_usuarios.primer_apellido || ''} ${solicitud.gen_usuarios.segundo_apellido || ''}`.trim() || 'Sin nombre'}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {solicitud.gen_usuarios.email || 'Sin email'}
                                  </span>
                                </>
                              ) : (
                                <span className="text-sm text-gray-400 italic">
                                  Sin asignar
                                </span>
                              )}
                            </div>
                          </TableCell>
                          {modalType === 'descartado' && (
                            <TableCell className="px-4 py-3">
                              <div className="flex flex-col">
                                <Badge 
                                  className={`text-xs font-medium ${
                                    solicitud.estado === 'asignado' ? 'bg-blue-100 text-blue-800' :
                                    solicitud.estado?.toLowerCase() === 'citado examenes' ? 'bg-yellow-100 text-yellow-800' :
                                    solicitud.estado === 'contratado' ? 'bg-green-100 text-green-800' :
                                    solicitud.estado === 'descartado' || solicitud.estado === 'cancelada' || solicitud.estado === 'stand_by' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {solicitud.estado?.toUpperCase() || 'Sin estado'}
                                </Badge>
                              </div>
                            </TableCell>
                          )}
                          <TableCell className="px-4 py-3">
                            <div className="flex flex-col">
                              <div className="flex items-start gap-4">
                                <div className="flex flex-col">
                                  <span className="text-xs text-gray-600 font-semibold">Solicitud:</span>
                                  <span className="text-sm text-gray-500">
                                    {solicitud.created_at ? 
                                      new Date(solicitud.created_at).toLocaleDateString('es-ES') 
                                      : '-'
                                    }
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    {solicitud.created_at ? 
                                      new Date(solicitud.created_at).toLocaleTimeString('es-ES', { 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                      }) 
                                      : ''
                                    }
                                  </span>
                                </div>
                                {solicitud.estado?.toLowerCase() === 'contratado' && (
                                  <div className="flex flex-col">
                                    <span className="text-xs text-green-600 font-semibold">Contratado:</span>
                                    <span className="text-sm text-green-700">
                                      {solicitud.updated_at ? 
                                        new Date(solicitud.updated_at).toLocaleDateString('es-ES')
                                        : 'Sin fecha'
                                      }
                                    </span>
                                    <span className="text-xs text-green-500">
                                      {solicitud.updated_at ? 
                                        new Date(solicitud.updated_at).toLocaleTimeString('es-ES', { 
                                          hour: '2-digit', 
                                          minute: '2-digit' 
                                        })
                                        : ''
                                      }
                                    </span>
                                  </div>
                                )}
                                {solicitud.estado?.toLowerCase() === 'citado examenes' && (
                                  <div className="flex flex-col">
                                    <span className="text-xs text-blue-600 font-semibold">Fecha citación:</span>
                                    <span className="text-sm text-blue-700">
                                      {solicitud.updated_at ? 
                                        new Date(solicitud.updated_at).toLocaleDateString('es-ES')
                                        : 'Sin fecha'
                                      }
                                    </span>
                                    <span className="text-xs text-blue-500">
                                      {solicitud.updated_at ? 
                                        new Date(solicitud.updated_at).toLocaleTimeString('es-ES', { 
                                          hour: '2-digit', 
                                          minute: '2-digit' 
                                        })
                                        : ''
                                      }
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={modalType === 'descartado' ? 7 : 6} className="h-24 text-center">
                          <div className="flex flex-col items-center justify-center space-y-4">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                              <FileText className="h-8 w-8 text-gray-400" />
                            </div>
                            <div className="space-y-2">
                              <h3 className="text-lg font-semibold text-gray-600">No hay registros</h3>
                              <p className="text-sm text-gray-500 max-w-sm">
                                No se encontraron solicitudes en este estado con los filtros aplicados
                              </p>
                            </div>
                            <div className="flex items-center space-x-2 text-xs text-gray-400">
                              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                              <span>Intenta ajustar los filtros para ver más resultados</span>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Can>
  );
};

export default Dashboard;


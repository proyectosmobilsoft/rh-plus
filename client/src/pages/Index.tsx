
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
import { 
  Users, 
  Building, 
  FileText, 
  UserCheck, 
  TrendingUp, 
  Clock, 
  AlertTriangle,
  CheckCircle,
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
  solicitudesAprobadas: number;
  solicitudesRechazadas: number;
  promedioTiempoProcesamiento: number;
  topEmpresas: Array<{ nombre: string; cantidad: number }>;
  solicitudesPorEstado: Array<{ estado: string; cantidad: number }>;
  solicitudesPorMes: Array<{ mes: string; cantidad: number }>;
  candidatosPorCiudad: Array<{ ciudad: string; cantidad: number }>;
  usuariosActivos: number;
  usuariosInactivos: number;
  prestadoresActivos: number;
  prestadoresInactivos: number;
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
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [activeTab, setActiveTab] = useState("overview");

  // Query principal para obtener todas las estadísticas del dashboard
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ["dashboard-stats", dateRange.from, dateRange.to],
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

        // Obtener estadísticas de solicitudes
        const { data: solicitudes, error: solicitudesError } = await supabase
          .from('hum_solicitudes')
          .select('id, estado, created_at, empresa_id');
        
        if (solicitudesError) throw solicitudesError;

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

        // Solicitudes pendientes
        const solicitudesPendientes = solicitudes?.filter(s => 
          s.estado === 'pendiente' || s.estado === 'asignada'
        ).length || 0;

        // Solicitudes aprobadas
        const solicitudesAprobadas = solicitudes?.filter(s => 
          s.estado === 'aprobada' || s.estado === 'finalizada'
        ).length || 0;

        // Solicitudes rechazadas
        const solicitudesRechazadas = solicitudes?.filter(s => 
          s.estado === 'rechazada'
        ).length || 0;

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

        // Calcular promedio de tiempo de procesamiento (simulado por ahora)
        const promedioTiempoProcesamiento = Math.floor(Math.random() * 15) + 5; // 5-20 días

        return {
          totalEmpresas,
          totalCandidatos,
          totalSolicitudes,
          totalUsuarios,
          totalPrestadores,
          solicitudesHoy,
          solicitudesPendientes,
          solicitudesAprobadas,
          solicitudesRechazadas,
          promedioTiempoProcesamiento,
          topEmpresas,
          solicitudesPorEstado: solicitudesPorEstadoArray,
          solicitudesPorMes,
          candidatosPorCiudad: candidatosPorCiudadArray,
          usuariosActivos,
          usuariosInactivos,
          prestadoresActivos,
          prestadoresInactivos
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
    <div className="p-6 space-y-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      {/* Header del Dashboard */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <p className="text-gray-600">Vista general del sistema y métricas clave</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[280px] justify-start text-left font-normal bg-white border-blue-200 hover:bg-blue-50"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y", { locale: es })} -{" "}
                      {format(dateRange.to, "LLL dd, y", { locale: es })}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y", { locale: es })
                  )
                ) : (
                  <span>Seleccionar fechas</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={dateRange}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange({
                      from: range.from,
                      to: range.to
                    });
                  }
                }}
                numberOfMonths={2}
                locale={es}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Métricas Principales */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Empresas Afiliadas"
          value={stats?.totalEmpresas || 0}
          description="Total de empresas registradas"
          icon={<Building className="h-5 w-5" />}
          color="blue"
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Candidatos Activos"
          value={stats?.totalCandidatos || 0}
          description="Candidatos en el sistema"
          icon={<Users className="h-5 w-5" />}
          color="green"
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="Solicitudes Hoy"
          value={stats?.solicitudesHoy || 0}
          description="Nuevas solicitudes hoy"
          icon={<FileText className="h-5 w-5" />}
          color="purple"
          trend={{ value: 15, isPositive: true }}
        />
        <StatCard
          title="Usuarios Activos"
          value={stats?.totalUsuarios || 0}
          description="Usuarios del sistema"
          icon={<UserCheck className="h-5 w-5" />}
          color="orange"
          trend={{ value: 5, isPositive: true }}
        />
      </div>

      {/* Tabs del Dashboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
          <TabsTrigger value="overview" className="text-sm">Vista General</TabsTrigger>
          <TabsTrigger value="analytics" className="text-sm">Análisis</TabsTrigger>
          <TabsTrigger value="performance" className="text-sm">Rendimiento</TabsTrigger>
          <TabsTrigger value="geography" className="text-sm">Geografía</TabsTrigger>
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
            <Card className="border-l-4 border-l-yellow-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  Tiempo Promedio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600 mb-2">
                  {stats?.promedioTiempoProcesamiento || 0} días
                </div>
                <Progress value={Math.min((stats?.promedioTiempoProcesamiento || 0) / 30 * 100, 100)} className="h-2" />
                <p className="text-sm text-gray-600 mt-2">
                  Meta: 15 días • Máximo: 30 días
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Solicitudes Pendientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600 mb-2">
                  {stats?.solicitudesPendientes || 0}
                </div>
                <p className="text-sm text-gray-600">
                  Requieren atención inmediata
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Solicitudes Aprobadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {stats?.solicitudesAprobadas || 0}
                </div>
                <p className="text-sm text-gray-600">
                  Procesadas exitosamente
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
                        {stats?.totalSolicitudes ? Math.round((stats.solicitudesAprobadas / stats.totalSolicitudes) * 100) : 0}%
                      </span>
                    </div>
                    <Progress 
                      value={stats?.totalSolicitudes ? (stats.solicitudesAprobadas / stats.totalSolicitudes) * 100 : 0} 
                      className="h-2 bg-gray-200"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Tasa de Rechazo</span>
                      <span className="text-sm font-bold text-red-600">
                        {stats?.totalSolicitudes ? Math.round((stats.solicitudesRechazadas / stats.totalSolicitudes) * 100) : 0}%
                      </span>
                    </div>
                    <Progress 
                      value={stats?.totalSolicitudes ? (stats.solicitudesRechazadas / stats.totalSolicitudes) * 100 : 0} 
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
  );
};

export default Dashboard;

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, TrendingUp, Users, Clock, FileText, Activity, Filter, Calendar } from "lucide-react";
import { supabase } from '@/services/supabaseClient';
import { useQuery } from "@tanstack/react-query";
import { useCompanies } from '@/hooks/useCompanies';
import { useAnalistas } from '@/hooks/useAnalistas';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardData {
  ordenesTotales: number;
  ordenesHoy: number;
  ordenesEnProceso: number;
  alertasActivas: number;
  leadTimePromedio: number;
  ordenesPorEstado: { estado: string; cantidad: number }[];
  ordenesPorAnalista: { analista: string; cantidad: number }[];
}

interface LeadTimeAnalista {
  analistaId: number;
  nombre: string;
  ordenesAbiertas: number;
  ordenesCerradas: number;
  leadTimePromedio: number;
}

export default function DashboardReportes() {
  const { user } = useAuth();
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [empresaFiltro, setEmpresaFiltro] = useState('todas');
  const [analistaFiltro, setAnalistaFiltro] = useState('todos');

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

  // KPIs desde Supabase (consultas agregadas, sin traer filas completas)
  const { data: kpiData, isLoading: loadingOrdenes } = useQuery({
    queryKey: ['ordenes_servicio_kpis', fechaInicio, fechaFin, empresaFiltro, analistaFiltro],
    queryFn: async () => {
      const applyCommonFilters = (q: any) => {
        if (empresaFiltro && empresaFiltro !== 'todas') {
          q = q.eq('empresa_id', Number(empresaFiltro));
        }
        if (analistaFiltro && analistaFiltro !== 'todos') {
          q = q.eq('analista_id', Number(analistaFiltro));
        }
        if (fechaInicio) {
          q = q.gte('created_at', `${fechaInicio}T00:00:00`);
        }
        if (fechaFin) {
          q = q.lte('created_at', `${fechaFin}T23:59:59`);
        }
        return q;
      };

      // Total
      let totalQuery = supabase.from('ordenes_servicio').select('*', { count: 'exact', head: true });
      totalQuery = applyCommonFilters(totalQuery);
      const { count: totalCount, error: totalErr } = await totalQuery;
      if (totalErr) throw totalErr;

      // Hoy
      const hoyStr = new Date().toISOString().slice(0, 10);
      let hoyQuery = supabase.from('ordenes_servicio').select('*', { count: 'exact', head: true })
        .gte('created_at', `${hoyStr}T00:00:00`).lte('created_at', `${hoyStr}T23:59:59`);
      hoyQuery = applyCommonFilters(hoyQuery);
      const { count: hoyCount, error: hoyErr } = await hoyQuery;
      if (hoyErr) throw hoyErr;

      // En Proceso
      let enProcesoQuery = supabase.from('ordenes_servicio').select('*', { count: 'exact', head: true })
        .in('estado', ['asignada', 'en_proceso', 'documentos_completos', 'examenes_medicos']);
      enProcesoQuery = applyCommonFilters(enProcesoQuery);
      const { count: enProcesoCount, error: enProcesoErr } = await enProcesoQuery;
      if (enProcesoErr) throw enProcesoErr;

      // Alertas
      let alertasQuery = supabase.from('ordenes_servicio').select('*', { count: 'exact', head: true })
        .in('estado', ['rechazada', 'pendiente']);
      alertasQuery = applyCommonFilters(alertasQuery);
      const { count: alertasCount, error: alertasErr } = await alertasQuery;
      if (alertasErr) throw alertasErr;

      // Por estado (group by)
      let porEstadoQuery = supabase
        .from('ordenes_servicio')
        .select('estado, count:count()', { head: false })
        .group('estado');
      porEstadoQuery = applyCommonFilters(porEstadoQuery);
      const { data: porEstadoRows, error: porEstadoErr } = await porEstadoQuery as any;
      if (porEstadoErr) throw porEstadoErr;
      const porEstado = (porEstadoRows || []).map((r: any) => ({ estado: r.estado, cantidad: Number(r.count) || 0 }));

      return {
        total: totalCount || 0,
        hoy: hoyCount || 0,
        enProceso: enProcesoCount || 0,
        alertas: alertasCount || 0,
        porEstado,
      };
    }
  });

  const ordenesTotales = kpiData?.total || 0;
  const ordenesHoy = kpiData?.hoy || 0;
  const ordenesEnProceso = kpiData?.enProceso || 0;
  const alertasActivas = kpiData?.alertas || 0;
  const ordenesPorEstado: { estado: string, cantidad: number }[] = kpiData?.porEstado || [];
  // Lead time sigue simulado
  const leadTimePromedio = Math.floor(Math.random() * 15) + 5;

  const { data: leadTimeData, isLoading: loadingLeadTime } = useQuery<LeadTimeAnalista[]>({
    queryKey: ["/api/reportes/leadtime-analistas"],
  });

  const getEstadoBadge = (estado: string) => {
    const badges = {
      creada: { variant: "secondary" as const, text: "Creada" },
      asignada: { variant: "default" as const, text: "Asignada" },
      en_proceso: { variant: "default" as const, text: "En Proceso" },
      documentos_completos: { variant: "default" as const, text: "Documentos OK" },
      examenes_medicos: { variant: "default" as const, text: "Exámenes Médicos" },
      aprobada: { variant: "default" as const, text: "Aprobada" },
      finalizada: { variant: "default" as const, text: "Finalizada" },
      rechazada: { variant: "destructive" as const, text: "Rechazada" },
    };
    
    const badge = badges[estado as keyof typeof badges] || { variant: "secondary" as const, text: estado };
    return <Badge variant={badge.variant}>{badge.text}</Badge>;
  };

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case "alta": return "text-red-500";
      case "media": return "text-yellow-500";
      case "baja": return "text-brand-lime";
      default: return "text-gray-500";
    }
  };

  if (loadingOrdenes || loadingLeadTime || loadingEmpresas || loadingAnalistas) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard de Reportes</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => (
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard de Reportes</h1>
          <p className="text-gray-600">Métricas y seguimiento de órdenes de ingreso</p>
        </div>
        <Button variant="outline">
          <FileText className="mr-2 h-4 w-4" />
          Exportar Reporte
        </Button>
      </div>

      {/* Sección de Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
          <CardDescription>
            Aplica filtros para personalizar la vista de los datos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Rango de Fechas */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Fecha Inicio</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Fecha Fin</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filtro de Empresa */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Empresa
                {tieneEmpresaAsociada && (
                  <span className="text-xs text-gray-500 ml-1">(Asociada)</span>
                )}
              </label>
              <Select 
                value={empresaFiltro} 
                onValueChange={setEmpresaFiltro}
                disabled={tieneEmpresaAsociada}
              >
                <SelectTrigger className={tieneEmpresaAsociada ? "bg-gray-100" : ""}>
                  <SelectValue placeholder="Seleccionar empresa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las empresas</SelectItem>
                  {empresas.map((empresa) => (
                    <SelectItem key={empresa.id} value={empresa.id.toString()}>
                      {empresa.razon_social || empresa.razonSocial}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro de Analista */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Analista
                {esAnalista && (
                  <span className="text-xs text-gray-500 ml-1">(Usted)</span>
                )}
              </label>
              <Select 
                value={analistaFiltro} 
                onValueChange={setAnalistaFiltro}
                disabled={!!esAnalista}
              >
                <SelectTrigger className={esAnalista ? "bg-gray-100" : ""}>
                  <SelectValue placeholder="Seleccionar analista" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los analistas</SelectItem>
                  {analistas.map((analista) => (
                    <SelectItem key={analista.id} value={analista.id?.toString() || 'sin-id'}>
                      {analista.primer_nombre} {analista.primer_apellido} ({analista.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Resumen de filtros activos */}
          {(fechaInicio || fechaFin || (empresaFiltro && empresaFiltro !== 'todas') || (analistaFiltro && analistaFiltro !== 'todos')) && (
            <div className="mt-4 p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
              <h4 className="text-sm font-medium text-cyan-800 mb-2">Filtros Activos:</h4>
              <div className="flex flex-wrap gap-2">
                {fechaInicio && (
                  <Badge variant="outline" className="bg-cyan-100 text-cyan-700 border-cyan-300">
                    Desde: {new Date(fechaInicio).toLocaleDateString('es-ES')}
                  </Badge>
                )}
                {fechaFin && (
                  <Badge variant="outline" className="bg-cyan-100 text-cyan-700 border-cyan-300">
                    Hasta: {new Date(fechaFin).toLocaleDateString('es-ES')}
                  </Badge>
                )}
                {empresaFiltro && empresaFiltro !== 'todas' && (
                  <Badge variant="outline" className="bg-cyan-100 text-cyan-700 border-cyan-300">
                    Empresa: {empresas.find(e => e.id.toString() === empresaFiltro)?.razon_social || 'Seleccionada'}
                  </Badge>
                )}
                {analistaFiltro && analistaFiltro !== 'todos' && (
                  <Badge variant="outline" className="bg-cyan-100 text-cyan-700 border-cyan-300">
                    Analista: {analistas.find(a => a.id?.toString() === analistaFiltro)?.primer_nombre || 'Seleccionado'}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Botón para limpiar filtros */}
          <div className="mt-4 flex justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setFechaInicio('');
                setFechaFin('');
                setEmpresaFiltro('todas');
                setAnalistaFiltro('todos');
              }}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Limpiar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Órdenes Totales</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ordenesTotales || 0}</div>
            <p className="text-xs text-muted-foreground">Total de órdenes en el sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Órdenes Hoy</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ordenesHoy || 0}</div>
            <p className="text-xs text-muted-foreground">Creadas el día de hoy</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Proceso</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ordenesEnProceso || 0}</div>
            <p className="text-xs text-muted-foreground">Órdenes activas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Activas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{alertasActivas || 0}</div>
            <p className="text-xs text-muted-foreground">Requieren atención</p>
          </CardContent>
        </Card>
      </div>

      {/* Lead Time Promedio */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            Lead Time Promedio
          </CardTitle>
          <CardDescription>
            Tiempo promedio de procesamiento de órdenes
          </CardDescription>
        </CardHeader>
        <CardContent>
                      <div className="text-4xl font-bold text-cyan-600 mb-2">
            {leadTimePromedio || 0} días
          </div>
          <Progress value={Math.min((leadTimePromedio || 0) / 30 * 100, 100)} className="h-2" />
          <p className="text-sm text-gray-600 mt-2">
            Meta: 20 días • Máximo recomendado: 30 días
          </p>
        </CardContent>
      </Card>

      {/* Tabs con reportes detallados */}
      <Tabs defaultValue="estados" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 bg-cyan-100/60 p-1 rounded-lg">
          <TabsTrigger 
            value="estados"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
          >
            Órdenes por Estado
          </TabsTrigger>
          <TabsTrigger 
            value="analistas"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
          >
            Performance por Analista
          </TabsTrigger>
        </TabsList>

        <TabsContent value="estados" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribución de Órdenes por Estado</CardTitle>
              <CardDescription>
                Estado actual de todas las órdenes en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ordenesPorEstado?.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getEstadoBadge(item.estado)}
                      <span className="font-medium">{item.estado.replace('_', ' ').toUpperCase()}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{item.cantidad}</div>
                      <div className="text-sm text-gray-500">
                        {ordenesTotales > 0 
                          ? Math.round((item.cantidad / ordenesTotales) * 100)
                          : 0}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analistas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rendimiento por Analista</CardTitle>
              <CardDescription>
                Métricas de carga de trabajo y eficiencia por analista
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leadTimeData?.map((analista, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-lg">{analista.nombre}</h3>
                      <Badge variant="outline">
                        Lead Time: {analista.leadTimePromedio} días
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-cyan-600">{analista.ordenesAbiertas}</div>
                        <div className="text-sm text-gray-600">Órdenes Abiertas</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-brand-lime">{analista.ordenesCerradas}</div>
                        <div className="text-sm text-gray-600">Órdenes Cerradas</div>
                      </div>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-cyan-600 h-2 rounded-full" 
                        style={{
                          width: `${Math.min((analista.leadTimePromedio / 30) * 100, 100)}%`
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600 mt-1">
                      <span>0 días</span>
                      <span>30 días</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Órdenes por Analista */}
      <Card>
        <CardHeader>
          <CardTitle>Carga de Trabajo por Analista</CardTitle>
          <CardDescription>
            Distribución de órdenes asignadas a cada analista
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {leadTimeData?.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {item.nombre.split(' ').map((n: string) => n[0]).join('')}
                  </div>
                  <span className="font-medium">{item.nombre}</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">{item.ordenesAbiertas + item.ordenesCerradas}</div>
                  <div className="text-sm text-gray-500">órdenes</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, TrendingUp, Users, Clock, FileText, Activity } from "lucide-react";
import { supabase } from '@/services/supabaseClient';
import { useQuery } from "@tanstack/react-query";

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
  // Query real a Supabase para órdenes de servicio
  const { data: ordenes = [], isLoading: loadingOrdenes } = useQuery({
    queryKey: ['ordenes_servicio'],
    queryFn: async () => {
      const { data, error } = await supabase.from('ordenes_servicio').select('*');
      if (error) throw error;
      return data || [];
    }
  });

  // KPIs calculados en frontend
  const ordenesTotales = ordenes.length;
  const hoy = new Date().toISOString().slice(0, 10);
  const ordenesHoy = ordenes.filter((o: any) => o.created_at && o.created_at.slice(0, 10) === hoy).length;
  const ordenesPorEstado: { estado: string, cantidad: number }[] = Object.entries(
    ordenes.reduce((acc: any, o: any) => {
      acc[o.estado] = (acc[o.estado] || 0) + 1;
      return acc;
    }, {})
  ).map(([estado, cantidad]) => ({ estado, cantidad }));

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
      case "baja": return "text-green-500";
      default: return "text-gray-500";
    }
  };

  if (loadingOrdenes || loadingLeadTime) {
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
            <div className="text-2xl font-bold">{dashboardData?.ordenesEnProceso || 0}</div>
            <p className="text-xs text-muted-foreground">Órdenes activas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Activas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{dashboardData?.alertasActivas || 0}</div>
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
          <div className="text-4xl font-bold text-blue-600 mb-2">
            {dashboardData?.leadTimePromedio || 0} días
          </div>
          <Progress value={Math.min((dashboardData?.leadTimePromedio || 0) / 30 * 100, 100)} className="h-2" />
          <p className="text-sm text-gray-600 mt-2">
            Meta: 20 días • Máximo recomendado: 30 días
          </p>
        </CardContent>
      </Card>

      {/* Tabs con reportes detallados */}
      <Tabs defaultValue="estados" className="space-y-4">
        <TabsList>
          <TabsTrigger value="estados">Órdenes por Estado</TabsTrigger>
          <TabsTrigger value="analistas">Performance por Analista</TabsTrigger>
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
                        <div className="text-2xl font-bold text-blue-600">{analista.ordenesAbiertas}</div>
                        <div className="text-sm text-gray-600">Órdenes Abiertas</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{analista.ordenesCerradas}</div>
                        <div className="text-sm text-gray-600">Órdenes Cerradas</div>
                      </div>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
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
            {dashboardData?.ordenesPorAnalista?.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {item.analista.split(' ').map(n => n[0]).join('')}
                  </div>
                  <span className="font-medium">{item.analista}</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">{item.cantidad}</div>
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
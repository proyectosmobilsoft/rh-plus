
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from '@/services/supabaseClient';
import { startOfMonth, endOfMonth } from "date-fns";
import { Can } from '@/contexts/PermissionsContext';
import { useCompanies } from '@/hooks/useCompanies';
import { useAnalistas } from '@/hooks/useAnalistas';
import { useAuth } from '@/contexts/AuthContext';
import { useLoading } from '@/contexts/LoadingContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SelectWithSearch } from "@/components/ui/select-with-search";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DateRangePicker, DateRange } from "@/components/ui/DateRangePicker";
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Download,
} from "lucide-react";
import { toast } from "sonner";

interface DashboardStats {
  totalSolicitudes: number;
  solicitudesPendientes: number;
  solicitudesContratadas: number;
  solicitudesDescartadas: number;
  promedioContratadasDias: number;
  solicitudesPorMes: Array<{ mes: string; cantidad: number }>;
  solicitudesPorEstado: Array<{ estado: string; cantidad: number }>;
  solicitudes: any[];
}

const ESTADO_COLORS: Record<string, string> = {
  asignado: "bg-blue-100 text-blue-700",
  contratado: "bg-green-100 text-green-700",
  descartado: "bg-red-100 text-red-700",
  cancelado: "bg-red-100 text-red-700",
  "citado examenes": "bg-purple-100 text-purple-700",
  "pendiente documentos": "bg-yellow-100 text-yellow-700",
  "documentos entregados": "bg-teal-100 text-teal-700",
};

const estadoBadge = (estado: string) => {
  const key = estado?.toLowerCase() ?? "";
  const cls = ESTADO_COLORS[key] ?? "bg-gray-100 text-gray-700";
  return (
    <Badge className={`${cls} border-0 text-xs font-medium`}>
      {estado ?? "—"}
    </Badge>
  );
};

const isDescartado = (estado: string) => {
  const s = estado?.toLowerCase();
  return ["descartado", "cancelada", "cancelado", "stand_by", "standby", "stand by", "desertada", "desertado"].includes(s ?? "");
};

const Dashboard = () => {
  const { user } = useAuth();
  const { startLoading, stopLoading } = useLoading();
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [empresaFiltro, setEmpresaFiltro] = useState("todas");
  const [analistaFiltro, setAnalistaFiltro] = useState("todos");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<any[]>([]);
  const [modalTitle, setModalTitle] = useState("");

  const { data: empresas = [] } = useCompanies("empresa");
  const { data: analistas = [] } = useAnalistas();

  useEffect(() => {
    const empresaData = localStorage.getItem("empresaData");
    if (empresaData) {
      try {
        const empresa = JSON.parse(empresaData);
        setEmpresaFiltro(empresa.id.toString());
      } catch (_) {}
    }
    if (user && analistas.length > 0) {
      const esAnalista = analistas.find(
        (a) => a.id === user.id || a.email === user.email || a.username === user.username
      );
      if (esAnalista) setAnalistaFiltro(esAnalista.id?.toString() ?? "sin-id");
    }
  }, [user, analistas]);

  const tieneEmpresaAsociada = !!localStorage.getItem("empresaData");
  const esAnalista = !!(
    user &&
    analistas.some(
      (a) => a.id === user.id || a.email === user.email || a.username === user.username
    )
  );

  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ["dashboard-stats", dateRange.from, dateRange.to, empresaFiltro, analistaFiltro],
    queryFn: async (): Promise<DashboardStats> => {
      let q = supabase
        .from("hum_solicitudes")
        .select(`
          id,
          estado,
          created_at,
          updated_at,
          empresa_id,
          analista_id,
          candidato_id,
          estructura_datos,
          empresas!empresa_id(razon_social),
          candidatos!candidato_id(
            primer_nombre,
            segundo_nombre,
            primer_apellido,
            segundo_apellido,
            numero_documento
          )
        `);

      if (empresaFiltro !== "todas") q = q.eq("empresa_id", empresaFiltro);
      if (analistaFiltro !== "todos") q = q.eq("analista_id", analistaFiltro);
      if (dateRange.from && dateRange.to) {
        q = q
          .gte("created_at", dateRange.from.toISOString().split("T")[0])
          .lte("created_at", dateRange.to.toISOString().split("T")[0] + "T23:59:59.999Z");
      }

      const { data: solicitudesRaw, error: solError } = await q;
      if (solError) throw solError;
      const solicitudes = solicitudesRaw ?? [];

      // Enriquecer con analistas
      const analistaIds = [...new Set(solicitudes.map((s: any) => s.analista_id).filter(Boolean))];
      let analistasMap = new Map<number, any>();
      if (analistaIds.length > 0) {
        const { data: analistasData } = await supabase
          .from("gen_usuarios")
          .select("id, primer_nombre, primer_apellido")
          .in("id", analistaIds);
        (analistasData ?? []).forEach((a: any) => analistasMap.set(a.id, a));
      }

      const solicitudesEnriquecidas = solicitudes.map((s: any) => ({
        ...s,
        gen_usuarios: s.analista_id ? analistasMap.get(s.analista_id) : null,
      }));

      // Métricas
      const totalSolicitudes = solicitudesEnriquecidas.length;
      const solicitudesPendientes = solicitudesEnriquecidas.filter((s: any) => s.estado === "asignado").length;
      const solicitudesContratadas = solicitudesEnriquecidas.filter((s: any) => s.estado === "contratado").length;
      const solicitudesDescartadas = solicitudesEnriquecidas.filter((s: any) => isDescartado(s.estado)).length;

      // Promedio días hasta contratado
      const tiemposContratado = solicitudesEnriquecidas
        .filter((s: any) => s.estado === "contratado" && s.created_at && s.updated_at)
        .map((s: any) => (new Date(s.updated_at).getTime() - new Date(s.created_at).getTime()) / 86400000)
        .filter((d: number) => d > 0);
      const promedioContratadasDias =
        tiemposContratado.length > 0
          ? Math.round(tiemposContratado.reduce((a: number, b: number) => a + b, 0) / tiemposContratado.length)
          : 0;

      // Solicitudes por mes (últimos 6 meses)
      const solicitudesPorMes = [];
      for (let i = 5; i >= 0; i--) {
        const fecha = new Date();
        fecha.setMonth(fecha.getMonth() - i);
        const mes = fecha.toLocaleDateString("es-ES", { month: "short" });
        const cantidad = solicitudesEnriquecidas.filter((s: any) => {
          const f = new Date(s.created_at);
          return f.getMonth() === fecha.getMonth() && f.getFullYear() === fecha.getFullYear();
        }).length;
        solicitudesPorMes.push({ mes, cantidad });
      }

      // Por estado (top 6)
      const byEstado: Record<string, number> = {};
      solicitudesEnriquecidas.forEach((s: any) => {
        const k = s.estado ?? "sin estado";
        byEstado[k] = (byEstado[k] ?? 0) + 1;
      });
      const solicitudesPorEstado = Object.entries(byEstado)
        .map(([estado, cantidad]) => ({ estado, cantidad }))
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 6);

      return {
        totalSolicitudes,
        solicitudesPendientes,
        solicitudesContratadas,
        solicitudesDescartadas,
        promedioContratadasDias,
        solicitudesPorMes,
        solicitudesPorEstado,
        solicitudes: solicitudesEnriquecidas,
      };
    },
    refetchInterval: 300000,
  });

  const handleCardClick = async (filtro: "pendientes" | "contratadas" | "descartadas" | "todas", titulo: string) => {
    startLoading();
    try {
      const { data: refreshed } = await refetch();
      const all = refreshed?.solicitudes ?? stats?.solicitudes ?? [];
      let filtered = all;
      if (filtro === "pendientes") filtered = all.filter((s: any) => s.estado === "asignado");
      else if (filtro === "contratadas") filtered = all.filter((s: any) => s.estado === "contratado");
      else if (filtro === "descartadas") filtered = all.filter((s: any) => isDescartado(s.estado));
      setModalData(filtered);
      setModalTitle(titulo);
      setModalOpen(true);
    } finally {
      stopLoading();
    }
  };

  const nombreCandidato = (s: any) => {
    const c = s.candidatos;
    if (!c) return "—";
    return [c.primer_nombre, c.segundo_nombre, c.primer_apellido, c.segundo_apellido]
      .filter(Boolean)
      .join(" ");
  };

  const nombreAnalista = (s: any) => {
    const a = s.gen_usuarios;
    if (!a) return "—";
    return [a.primer_nombre, a.primer_apellido].filter(Boolean).join(" ");
  };

  const buildExportRows = (rows: any[]) =>
    rows.map((s) => ({
      ID: s.id ?? "—",
      Estado: s.estado ?? "—",
      Empresa: (s.empresas as any)?.razon_social ?? "—",
      Analista: nombreAnalista(s),
      Candidato: nombreCandidato(s),
      Documento: s.candidatos?.numero_documento ?? "—",
      "Fecha Creación": s.created_at ? new Date(s.created_at).toLocaleDateString("es-ES") : "—",
      "Última Actualización": s.updated_at ? new Date(s.updated_at).toLocaleDateString("es-ES") : "—",
    }));

  const handleExportSolicitudes = async (rows?: any[]) => {
    const source = rows ?? stats?.solicitudes ?? [];
    if (!source.length) {
      toast.error("No hay datos para exportar");
      return;
    }
    try {
      const { exportToExcel } = await import("@/utils/exportUtils");
      await exportToExcel(
        buildExportRows(source),
        `Dashboard_Solicitudes_${new Date().toISOString().split("T")[0]}`,
        "Solicitudes"
      );
      toast.success("Exportación generada exitosamente");
    } catch (error) {
      console.error("Error exportando solicitudes:", error);
      toast.error("Error al generar el archivo Excel");
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-8 bg-gray-200 rounded w-16 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-24" />
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
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Error al cargar el dashboard</p>
            <p className="text-sm text-red-600 mt-1">
              {error instanceof Error ? error.message : "Error desconocido"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const cards = [
    {
      label: "Total solicitudes",
      value: stats?.totalSolicitudes ?? 0,
      icon: <FileText className="w-4 h-4" />,
      filtro: "todas" as const,
      color: "text-gray-700",
      bg: "bg-gray-100",
    },
    {
      label: "En proceso",
      value: stats?.solicitudesPendientes ?? 0,
      icon: <Clock className="w-4 h-4" />,
      filtro: "pendientes" as const,
      color: "text-blue-700",
      bg: "bg-blue-100",
    },
    {
      label: "Contratados",
      value: stats?.solicitudesContratadas ?? 0,
      icon: <CheckCircle2 className="w-4 h-4" />,
      filtro: "contratadas" as const,
      color: "text-green-700",
      bg: "bg-green-100",
    },
    {
      label: "Descartados",
      value: stats?.solicitudesDescartadas ?? 0,
      icon: <XCircle className="w-4 h-4" />,
      filtro: "descartadas" as const,
      color: "text-red-700",
      bg: "bg-red-100",
    },
  ];

  return (
    <Can action="vista-dashboard">
      <div className="p-6 space-y-5 min-h-screen bg-gray-50">
        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-3 justify-end">
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            placeholder="Rango de fechas"
            className="w-72"
            showPresets
          />
          <Select
            value={empresaFiltro}
            onValueChange={setEmpresaFiltro}
            disabled={tieneEmpresaAsociada}
          >
            <SelectTrigger className="w-48 bg-white">
              <SelectValue placeholder="Empresa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las empresas</SelectItem>
              {empresas.map((e: any) => (
                <SelectItem key={e.id} value={e.id.toString()}>
                  {e.razon_social}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <SelectWithSearch
            value={analistaFiltro}
            onValueChange={setAnalistaFiltro}
            disabled={esAnalista}
            placeholder="Analista"
            className="w-48 bg-white"
            options={[
              { value: "todos", label: "Todos los analistas" },
              ...analistas.map((a: any) => ({
                value: a.id?.toString() ?? "sin-id",
                label: [a.primer_nombre, a.primer_apellido].filter(Boolean).join(" "),
              })),
            ]}
          />
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => handleExportSolicitudes()}
            disabled={!stats?.solicitudes?.length}
          >
            <Download className="w-4 h-4" />
            Exportar Excel
          </Button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card) => (
            <Card
              key={card.label}
              className="cursor-pointer hover:shadow-md transition-shadow bg-white"
              onClick={() => handleCardClick(card.filtro, card.label)}
            >
              <CardContent className="pt-5 pb-4 px-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {card.label}
                  </span>
                  <span className={`p-1.5 rounded-lg ${card.bg} ${card.color}`}>
                    {card.icon}
                  </span>
                </div>
                <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tiempo promedio + gráfica */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Tiempo promedio */}
          <Card className="bg-white">
            <CardHeader className="pb-2 pt-5 px-5">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wide flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Tiempo promedio hasta contratado
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <p className="text-4xl font-bold text-gray-800">
                {stats?.promedioContratadasDias ?? 0}
                <span className="text-lg font-normal text-gray-400 ml-1">días</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Basado en {stats?.solicitudesContratadas ?? 0} contrataciones
              </p>
            </CardContent>
          </Card>

          {/* Gráfica */}
          <Card className="lg:col-span-2 bg-white">
            <CardHeader className="pb-2 pt-5 px-5">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                Solicitudes últimos 6 meses
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={stats?.solicitudesPorMes ?? []} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                    labelStyle={{ fontSize: 12, fontWeight: 600 }}
                    itemStyle={{ fontSize: 12 }}
                    formatter={(v: any) => [v, "Solicitudes"]}
                  />
                  <Bar dataKey="cantidad" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Estados breakdown */}
        {(stats?.solicitudesPorEstado?.length ?? 0) > 0 && (
          <Card className="bg-white">
            <CardHeader className="pb-2 pt-5 px-5">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                Distribución por estado
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="flex flex-wrap gap-3">
                {stats?.solicitudesPorEstado.map((e) => (
                  <div key={e.estado} className="flex items-center gap-2">
                    {estadoBadge(e.estado)}
                    <span className="text-sm font-semibold text-gray-700">{e.cantidad}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Modal solicitudes */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{modalTitle}</DialogTitle>
            </DialogHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidato</TableHead>
                  <TableHead>Doc.</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Analista</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modalData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                      Sin solicitudes
                    </TableCell>
                  </TableRow>
                ) : (
                  modalData.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{nombreCandidato(s)}</TableCell>
                      <TableCell className="text-gray-500 text-sm">{s.candidatos?.numero_documento ?? "—"}</TableCell>
                      <TableCell className="text-gray-600 text-sm">{(s.empresas as any)?.razon_social ?? "—"}</TableCell>
                      <TableCell className="text-gray-600 text-sm">{nombreAnalista(s)}</TableCell>
                      <TableCell>{estadoBadge(s.estado)}</TableCell>
                      <TableCell className="text-gray-500 text-sm">
                        {s.created_at ? new Date(s.created_at).toLocaleDateString("es-ES") : "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </DialogContent>
        </Dialog>
      </div>
    </Can>
  );
};

export default Dashboard;

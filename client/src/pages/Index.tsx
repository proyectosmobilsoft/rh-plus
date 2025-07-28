
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Link } from "react-router-dom";

// Datos de ejemplo para el gráfico
const mockData = [
  { month: "Ene", candidatos: 65, ordenes: 28 },
  { month: "Feb", candidatos: 59, ordenes: 48 },
  { month: "Mar", candidatos: 80, ordenes: 40 },
  { month: "Abr", candidatos: 81, ordenes: 27 },
  { month: "May", candidatos: 56, ordenes: 33 },
  { month: "Jun", candidatos: 55, ordenes: 30 },
  { month: "Jul", candidatos: 40, ordenes: 20 },
];

interface StatCardProps {
  title: string;
  value: string;
  description: string;
}

const StatCard = ({ title, value, description }: StatCardProps) => (
  <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-brand-lime card-interactive hover-lift animate-fade-in-up">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-brand-lime animate-bounce-in">{value}</div>
      <p className="text-xs text-gray-500">{description}</p>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const [chartPeriod, setChartPeriod] = useState<"day" | "month" | "year">("month");

  // Simular una consulta a la API
  // En un entorno real, reemplazaríamos esto con llamadas reales
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      try {
        // Simular datos mientras la API no esté disponible
        return {
          totalEmpresas: 125,
          totalCandidatos: 1543,
          ordenesHoy: 15
        };
        // Descomentar para usar la API real cuando esté disponible
        // return await api.get<any>("/dashboard/stats");
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        throw error;
      }
    },
    // Desactivar la petición real por ahora
    enabled: false,
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant={chartPeriod === "day" ? "default" : "outline"}
              onClick={() => setChartPeriod("day")}
              className={`period-button ${chartPeriod === "day" ? "selected" : "border-brand-turquoise text-brand-turquoise hover:bg-brand-turquoise/10"}`}
            >
              Día
            </Button>
            <Button 
              size="sm" 
              variant={chartPeriod === "month" ? "default" : "outline"}
              onClick={() => setChartPeriod("month")}
              className={`period-button ${chartPeriod === "month" ? "selected" : "border-brand-turquoise text-brand-turquoise hover:bg-brand-turquoise/10"}`}
            >
              Mes
            </Button>
            <Button 
              size="sm" 
              variant={chartPeriod === "year" ? "default" : "outline"}
              onClick={() => setChartPeriod("year")}
              className={`period-button ${chartPeriod === "year" ? "selected" : "border-brand-turquoise text-brand-turquoise hover:bg-brand-turquoise/10"}`}
            >
              Año
            </Button>
                  </div>
      </div>
    </div>

    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Empresas Afiliadas"
          value={isLoading ? "..." : `${stats?.totalEmpresas || 125}`}
          description="Total de empresas registradas"
        />
        <StatCard
          title="Candidatos"
          value={isLoading ? "..." : `${stats?.totalCandidatos || 1543}`}
          description="Candidatos activos en el sistema"
        />
        <StatCard
          title="Órdenes"
          value={isLoading ? "..." : `${stats?.ordenesHoy || 15}`}
          description="Emitidas hoy"
        />
      </div>

      <Card className="col-span-4 border-l-4 border-l-brand-turquoise">
        <CardHeader>
          <CardTitle className="text-brand-gray">Actividad</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={mockData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="month" tick={{ fill: '#9d9d9d' }} />
                <YAxis tick={{ fill: '#9d9d9d' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #c1d009',
                    borderRadius: '8px'
                  }} 
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="candidatos"
                  stroke="#c1d009"
                  strokeWidth={3}
                  name="Candidatos"
                  activeDot={{ r: 8, fill: '#c1d009' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="ordenes" 
                  stroke="#1fb5ca" 
                  strokeWidth={3}
                  name="Órdenes" 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;

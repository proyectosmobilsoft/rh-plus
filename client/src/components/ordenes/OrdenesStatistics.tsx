import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';
import { Orden } from '@/services/ordenesService';

interface OrdenesStatisticsProps {
  ordenes: Orden[];
}

const OrdenesStatistics: React.FC<OrdenesStatisticsProps> = ({ ordenes }) => {
  // Calculate statistics
  const totalOrdenes = ordenes.length;
  const ordenesPendientes = ordenes.filter(orden => orden.estado?.toUpperCase() === 'PENDIENTE').length;
  const ordenesAprobadas = ordenes.filter(orden => orden.estado?.toUpperCase() === 'APROBADA').length;
  const ordenesAnuladas = ordenes.filter(orden => orden.estado?.toUpperCase() === 'ANULADA').length;
  const ordenesFinalizadas = ordenes.filter(orden => orden.estado?.toUpperCase() === 'FINALIZADA').length;
  
  // Calculate unique companies
  const empresasUnicas = new Set(
    ordenes
      .map(orden => orden.empresaUsuaria || orden.empresa_name)
      .filter(empresa => empresa && empresa.trim() !== '')
  ).size;

  // Calculate high priority orders
  const ordenesAltaPrioridad = ordenes.filter(orden => orden.prioridad?.toLowerCase() === 'alta').length;

  const statistics = [
    {
      title: "Total Órdenes",
      value: totalOrdenes,
      icon: FileText,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50"
    },
    {
      title: "Órdenes Pendientes", 
      value: ordenesPendientes,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50"
    },
    {
      title: "Órdenes Aprobadas",
      value: ordenesAprobadas,
      icon: CheckCircle,
      color: "text-green-600", 
      bgColor: "bg-green-50"
    },
    {
      title: "Prioridad Alta",
      value: ordenesAltaPrioridad,
      icon: TrendingUp,
      color: "text-red-600",
      bgColor: "bg-red-50"
    },
    {
      title: "Empresas Activas",
      value: empresasUnicas,
      icon: XCircle,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
      {statistics.map((stat, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stat.color}`}>
              {stat.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default OrdenesStatistics;
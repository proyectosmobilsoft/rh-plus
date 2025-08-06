import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  BarChart3,
  UserCheck,
  UserX,
  Clock
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface DashboardStats {
  totalCandidatos: number;
  candidatosPendientes: number;
  candidatosAprobados: number;
  candidatosRechazados: number;
}

interface Empresa {
  id: number;
  nombreEmpresa: string;
  email: string;
  nit: string;
  direccion?: string;
  telefono?: string;
  ciudad?: string;
  contactoPrincipal?: string;
  cargoContacto?: string;
}

export default function DashboardEmpresa() {
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Plantillas mock globales (en memoria, igual que en CompanyForm)
  const PLANTILLAS_MOCK = [
    { id: 1, name: "Plantilla de Ingreso", description: "Campos para ingreso de personal" },
    { id: 2, name: "Plantilla de Seguridad", description: "Campos de seguridad industrial" },
    { id: 3, name: "Plantilla de Salud", description: "Campos de salud ocupacional" },
  ];
  // Estado simulado de plantillas asignadas (en memoria)
  const [plantillasAsignadas] = useState<number[]>([1, 3]); // Puedes simular que la empresa tiene asignadas la 1 y la 3

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch empresa profile
        const empresaResponse = await fetch('/api/empresa/profile');
        if (empresaResponse.ok) {
          const empresaData = await empresaResponse.json();
          setEmpresa(empresaData);
        }

        // Fetch dashboard stats
        const statsResponse = await fetch('/api/empresa/dashboard-stats');
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Welcome section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-gray-600">
          Bienvenido/a, {empresa?.contactoPrincipal || empresa?.nombreEmpresa}
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Candidatos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCandidatos}</div>
              <p className="text-xs text-muted-foreground">Candidatos registrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.candidatosPendientes}</div>
              <p className="text-xs text-muted-foreground">En proceso de revisión</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aprobados</CardTitle>
              <UserCheck className="h-4 w-4 text-brand-lime" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-brand-lime">{stats.candidatosAprobados}</div>
              <p className="text-xs text-muted-foreground">Candidatos aprobados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rechazados</CardTitle>
              <UserX className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.candidatosRechazados}</div>
              <p className="text-xs text-muted-foreground">Candidatos rechazados</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Company Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="w-5 h-5" />
            <span>Información de la Empresa</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">NIT</p>
              <p className="text-base">{empresa?.nit}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="text-base">{empresa?.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Ciudad</p>
              <p className="text-base">{empresa?.ciudad || 'No especificada'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Teléfono</p>
              <p className="text-base">{empresa?.telefono || 'No especificado'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Contacto Principal</p>
              <p className="text-base">{empresa?.contactoPrincipal || 'No especificado'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Cargo del Contacto</p>
              <p className="text-base">{empresa?.cargoContacto || 'No especificado'}</p>
            </div>
          </div>
          {/* Plantillas asignadas */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-2">Plantillas asignadas</h3>
            <ul className="list-disc pl-6">
              {plantillasAsignadas.length > 0 ? (
                PLANTILLAS_MOCK.filter(p => plantillasAsignadas.includes(p.id)).map(p => (
                  <li key={p.id} className="mb-1">
                    <span className="font-medium">{p.name}</span> <span className="text-gray-500 text-sm">({p.description})</span>
                  </li>
                ))
              ) : (
                <li className="text-gray-500">No hay plantillas asignadas.</li>
              )}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardCheck, UserCheck, FolderKanban, Users } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import NovedadesPage from './NovedadesPage';
import EntrevistasPage from './EntrevistasPage';
import SeleccionPage from './SeleccionPage';

export default function ContratacionSeleccionPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentTab =
    location.pathname === '/novedades/entrevista'
      ? 'entrevistas'
      : location.pathname === '/seleccion'
        ? 'seleccion'
        : location.pathname === '/novedades/empleados'
          ? 'empleados'
        : 'novedades';

  return (
    <div className="p-4 max-w-full mx-auto space-y-3">

      <Tabs
        value={currentTab}
        onValueChange={(value) => {
          if (value === 'entrevistas') navigate('/novedades/entrevista');
          else if (value === 'seleccion') navigate('/seleccion');
          else if (value === 'empleados') navigate('/novedades/empleados');
          else navigate('/novedades');
        }}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-4 bg-cyan-100/50 p-0.5 rounded-lg h-10">
          <TabsTrigger
            value="novedades"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all duration-200 text-sm"
          >
            <span className="inline-flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4" />
              Gestión de Novedades
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="entrevistas"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all duration-200 text-sm"
          >
            <span className="inline-flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              Entrevistas
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="seleccion"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all duration-200 text-sm"
          >
            <span className="inline-flex items-center gap-2">
              <FolderKanban className="w-4 h-4" />
              Módulo de Selección
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="empleados"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all duration-200 text-sm"
          >
            <span className="inline-flex items-center gap-2">
              <Users className="w-4 h-4" />
              Empleados
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="novedades" className="mt-4">
          <NovedadesPage
            forcedTab="solicitudes"
            hideInternalTabs
            headerTitle="Gestión de Novedades"
            headerDescription="Administración y seguimiento de solicitudes de novedades"
          />
        </TabsContent>
        <TabsContent value="entrevistas" className="mt-4">
          <EntrevistasPage />
        </TabsContent>
        <TabsContent value="seleccion" className="mt-4">
          <SeleccionPage />
        </TabsContent>
        <TabsContent value="empleados" className="mt-4">
          <NovedadesPage
            forcedTab="empleados"
            hideInternalTabs
            headerTitle="Listado de Empleados"
            headerDescription="Consulta consolidada de empleados para el flujo de novedades"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

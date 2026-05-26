import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardCheck, UserCheck, FolderKanban, Users } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import NovedadesPage from './NovedadesPage';
import EntrevistasPage from './EntrevistasPage';
import SeleccionPage from './SeleccionPage';
import { usePermissions } from '@/contexts/PermissionsContext';
import { type NovedadSolicitud } from '@/services/novedadesService';

export default function ContratacionSeleccionPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasAction } = usePermissions();

  const currentTabFromRoute =
    location.pathname === '/novedades/entrevista'
      ? 'entrevistas'
      : location.pathname === '/seleccion'
        ? 'seleccion'
        : location.pathname === '/novedades/empleados'
          ? 'empleados'
        : 'novedades';

  const solicitudEntrevista = ((location.state as { solicitudEntrevista?: NovedadSolicitud } | null)?.solicitudEntrevista) ?? null;

  const canNovedades = hasAction('accion-tab-contratacion-novedades') || hasAction('accion-tab-novedades');
  const canEntrevistas = hasAction('accion-tab-contratacion-entrevistas') || hasAction('vista-entrevistas');
  const canSeleccion = hasAction('accion-tab-contratacion-seleccion') || hasAction('vista-seleccion');
  const canEmpleados = hasAction('accion-tab-contratacion-empleados') || hasAction('accion-tab-empleados');

  const tabsDisponibles = [
    canNovedades ? 'novedades' : null,
    canEntrevistas ? 'entrevistas' : null,
    canSeleccion ? 'seleccion' : null,
    canEmpleados ? 'empleados' : null,
  ].filter(Boolean) as string[];

  const currentTab = tabsDisponibles.includes(currentTabFromRoute)
    ? currentTabFromRoute
    : tabsDisponibles[0];

  React.useEffect(() => {
    if (!currentTab) return;
    if (currentTab === currentTabFromRoute) return;
    if (currentTab === 'entrevistas') navigate('/novedades/entrevista', { replace: true });
    else if (currentTab === 'seleccion') navigate('/seleccion', { replace: true });
    else if (currentTab === 'empleados') navigate('/novedades/empleados', { replace: true });
    else navigate('/novedades', { replace: true });
  }, [currentTab, currentTabFromRoute, navigate]);

  return (
    <div className="p-4 max-w-full mx-auto space-y-3">
      {!currentTab ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          No tienes permisos para visualizar módulos de Contratación y Selección.
        </div>
      ) : (

      <Tabs
        value={currentTab}
        onValueChange={(value) => {
          if (value === 'entrevistas') {
            if (!solicitudEntrevista) return;
            navigate('/novedades/entrevista', { state: location.state });
          } else if (value === 'seleccion') navigate('/seleccion');
          else if (value === 'empleados') navigate('/novedades/empleados');
          else navigate('/novedades');
        }}
        className="w-full"
      >
        <TabsList className={`grid w-full bg-cyan-100/50 p-0.5 rounded-lg h-10 ${tabsDisponibles.length === 1 ? 'grid-cols-1' : tabsDisponibles.length === 2 ? 'grid-cols-2' : tabsDisponibles.length === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
          {canNovedades && (
            <TabsTrigger
              value="novedades"
              className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all duration-200 text-sm"
            >
              <span className="inline-flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4" />
                Gestión de Novedades
              </span>
            </TabsTrigger>
          )}
          {canEntrevistas && (
            <TabsTrigger
              value="entrevistas"
              disabled={!solicitudEntrevista}
              className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all duration-200 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="inline-flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                Entrevistas
              </span>
            </TabsTrigger>
          )}
          {canSeleccion && (
            <TabsTrigger
              value="seleccion"
              className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all duration-200 text-sm"
            >
              <span className="inline-flex items-center gap-2">
                <FolderKanban className="w-4 h-4" />
                Módulo de Selección
              </span>
            </TabsTrigger>
          )}
          {canEmpleados && (
            <TabsTrigger
              value="empleados"
              className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all duration-200 text-sm"
            >
              <span className="inline-flex items-center gap-2">
                <Users className="w-4 h-4" />
                Empleados
              </span>
            </TabsTrigger>
          )}
        </TabsList>

        {canNovedades && (
          <TabsContent value="novedades" className="mt-4">
            <NovedadesPage
              forcedTab="solicitudes"
              hideInternalTabs
              headerTitle="Gestión de Novedades"
              headerDescription="Administración y seguimiento de solicitudes de novedades"
              collapseFiltersSignal={currentTab}
            />
          </TabsContent>
        )}
        {canEntrevistas && (
          <TabsContent value="entrevistas" className="mt-4">
            <EntrevistasPage solicitudEntrevista={solicitudEntrevista} />
          </TabsContent>
        )}
        {canSeleccion && (
          <TabsContent value="seleccion" className="mt-4">
            <SeleccionPage collapseFiltersSignal={currentTab} />
          </TabsContent>
        )}
        {canEmpleados && (
          <TabsContent value="empleados" className="mt-4">
            <NovedadesPage
              forcedTab="empleados"
              hideInternalTabs
              collapseFiltersSignal={currentTab}
              headerTitle="Listado de Empleados"
              headerDescription="Consulta consolidada de empleados para el flujo de novedades"
            />
          </TabsContent>
        )}
      </Tabs>
      )}
    </div>
  );
}

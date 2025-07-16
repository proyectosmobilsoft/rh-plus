import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield, Settings, Eye } from "lucide-react";

interface ViewAction {
  id: number;
  nombre: string;
  displayName: string;
  descripcion: string;
  tipo: string;
  orden: number;
  activo: boolean;
}

interface SystemView {
  id: number;
  nombre: string;
  displayName: string;
  descripcion: string;
  ruta: string;
  modulo: string;
  icono: string;
  orden: number;
  activo: boolean;
  acciones: ViewAction[];
}

const GestionPermisosPage: React.FC = () => {
  const [selectedVistaId, setSelectedVistaId] = useState<number | null>(null);

  // Query para obtener todas las vistas con sus acciones
  const { data: viewsWithActions, isLoading: viewsLoading } = useQuery<SystemView[]>({
    queryKey: ['/api/views-with-actions'],
    select: (data: SystemView[]) => {
      console.log('Views with actions received:', data);
      return data || [];
    }
  });

  const getModuleColor = (modulo: string) => {
    const colors: Record<string, string> = {
      'general': 'bg-brand-lime/10 text-brand-lime border-brand-lime/20',
      'seguridad': 'bg-brand-turquoise/10 text-brand-turquoise border-brand-turquoise/20',
      'registros': 'bg-brand-lime/10 text-brand-lime border-brand-lime/20',
      'empresa': 'bg-brand-turquoise/10 text-brand-turquoise border-brand-turquoise/20',
      'recursos': 'bg-brand-lime/10 text-brand-lime border-brand-lime/20',
      'ordenes': 'bg-brand-turquoise/10 text-brand-turquoise border-brand-turquoise/20',
      'certificados': 'bg-brand-lime/10 text-brand-lime border-brand-lime/20',
      'configuracion': 'bg-brand-gray/10 text-brand-gray border-brand-gray/20',
      'reportes': 'bg-brand-turquoise/10 text-brand-turquoise border-brand-turquoise/20'
    };
    return colors[modulo] || 'bg-brand-gray/10 text-brand-gray border-brand-gray/20';
  };

  const getActionTypeColor = (tipo: string) => {
    const colors: Record<string, string> = {
      'visualizacion': 'bg-blue-100 text-blue-800',
      'creacion': 'bg-green-100 text-green-800',
      'edicion': 'bg-yellow-100 text-yellow-800',
      'eliminacion': 'bg-red-100 text-red-800',
      'exportacion': 'bg-purple-100 text-purple-800',
      'aprobacion': 'bg-orange-100 text-orange-800'
    };
    return colors[tipo] || 'bg-gray-100 text-gray-800';
  };

  if (viewsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando vistas del sistema...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Shield className="h-6 w-6 text-brand-lime" />
          <h1 className="text-3xl font-bold text-gray-800">Explorador de Vistas y Acciones</h1>
        </div>
      </div>

      <div className="text-sm text-gray-600">
        Explore todas las vistas del sistema ZEUS y sus acciones correspondientes.
      </div>

      {/* Selector de vista para explorar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Explorar Vistas y Acciones del Sistema</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">Vista específica:</label>
              <Select 
                onValueChange={(value) => setSelectedVistaId(value === "all" ? null : parseInt(value))} 
                value={selectedVistaId?.toString() || "all"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione una vista..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las vistas</SelectItem>
                  {viewsWithActions?.map((vista) => (
                    <SelectItem key={vista.id} value={vista.id.toString()}>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs px-2 py-1 rounded bg-brand-lime/10 text-brand-lime">
                          {vista.modulo.toUpperCase()}
                        </span>
                        <span className="font-medium">{vista.displayName}</span>
                        <span className="text-xs text-gray-500">
                          ({vista.acciones.length} acciones)
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm text-gray-600">
                Total de vistas: {viewsWithActions?.length || 0}
              </div>
              <div className="text-sm text-gray-600">
                Total de acciones: {viewsWithActions?.reduce((sum, v) => sum + v.acciones.length, 0) || 0}
              </div>
            </div>
            
            <div className="space-y-2">
              {selectedVistaId && viewsWithActions && (
                <div className="text-sm text-brand-lime font-medium">
                  Vista seleccionada: {viewsWithActions.find(v => v.id === selectedVistaId)?.displayName}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exploración de vistas y acciones */}
      {viewsWithActions && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <Eye className="h-5 w-5" />
              <span>
                {selectedVistaId 
                  ? `Acciones disponibles en: ${viewsWithActions.find(v => v.id === selectedVistaId)?.displayName}`
                  : 'Todas las Vistas y Acciones del Sistema'
                }
              </span>
            </CardTitle>
            <div className="text-sm text-gray-600">
              {selectedVistaId 
                ? 'Estas son todas las acciones disponibles en esta vista del sistema.'
                : 'Explore todas las vistas disponibles y sus acciones correspondientes en el sistema ZEUS.'
              }
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {(selectedVistaId 
                ? viewsWithActions.filter(v => v.id === selectedVistaId)
                : viewsWithActions
              )?.map((vista) => (
                <div key={vista.id} className="border rounded-lg p-4 space-y-4">
                  {/* Vista header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Badge className={getModuleColor(vista.modulo)}>
                        {vista.modulo.toUpperCase()}
                      </Badge>
                      <div>
                        <h3 className="font-semibold text-lg">{vista.displayName}</h3>
                        <p className="text-sm text-gray-600">{vista.descripcion}</p>
                        <p className="text-xs text-gray-500">Ruta: {vista.ruta}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-700">
                        {vista.acciones.length} acciones
                      </div>
                      <div className="text-xs text-gray-500">
                        Orden: {vista.orden}
                      </div>
                    </div>
                  </div>

                  {/* Acciones de la vista */}
                  {vista.acciones.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {vista.acciones
                        .sort((a, b) => a.orden - b.orden)
                        .map((accion) => (
                          <div key={accion.id} className="border rounded-md p-3 bg-gray-50">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-sm">{accion.displayName}</h4>
                              <Badge className={getActionTypeColor(accion.tipo)}>
                                {accion.tipo}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600 mb-2">{accion.descripcion}</p>
                            <div className="flex justify-between items-center text-xs text-gray-500">
                              <span>Código: {accion.nombre}</span>
                              <span>Orden: {accion.orden}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      No hay acciones definidas para esta vista
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GestionPermisosPage;
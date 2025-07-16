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
        Sistema completo de permisos con {viewsWithActions?.length || 0} vistas y {viewsWithActions?.reduce((sum, v) => sum + v.acciones.length, 0) || 0} acciones totales organizadas por módulos.
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
            {/* Resumen ejecutivo */}
            <div className="mb-6 p-4 bg-gradient-to-r from-brand-lime/10 to-brand-turquoise/10 rounded-lg border">
              <h3 className="font-semibold text-lg mb-3 text-gray-800">📋 Resumen del Sistema de Permisos ZEUS</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="bg-white/70 rounded-lg p-3">
                  <div className="text-2xl font-bold text-brand-lime">{viewsWithActions?.length || 0}</div>
                  <div className="text-sm text-gray-600">Vistas Totales</div>
                </div>
                <div className="bg-white/70 rounded-lg p-3">
                  <div className="text-2xl font-bold text-brand-turquoise">{viewsWithActions?.reduce((sum, v) => sum + v.acciones.length, 0) || 0}</div>
                  <div className="text-sm text-gray-600">Acciones Totales</div>
                </div>
                <div className="bg-white/70 rounded-lg p-3">
                  <div className="text-2xl font-bold text-brand-gray">{new Set(viewsWithActions?.map(v => v.modulo)).size || 0}</div>
                  <div className="text-sm text-gray-600">Módulos</div>
                </div>
                <div className="bg-white/70 rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-600">{viewsWithActions?.reduce((sum, v) => sum + v.acciones.filter(a => a.tipo === 'visualizacion').length, 0) || 0}</div>
                  <div className="text-sm text-gray-600">Vista/Lectura</div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {(selectedVistaId 
                ? viewsWithActions.filter(v => v.id === selectedVistaId)
                : viewsWithActions
              )?.map((vista) => (
                <div key={vista.id} className="border rounded-lg p-4 space-y-4 hover:shadow-md transition-shadow">
                  {/* Vista header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Badge className={getModuleColor(vista.modulo)}>
                        {vista.modulo.toUpperCase()}
                      </Badge>
                      <div>
                        <h3 className="font-semibold text-lg">{vista.displayName}</h3>
                        <p className="text-sm text-gray-600">{vista.descripcion}</p>
                        <p className="text-xs text-gray-500">Ruta: {vista.ruta} • ID: {vista.id}</p>
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

                  {/* Estadísticas de acciones por tipo */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {['visualizacion', 'creacion', 'edicion', 'eliminacion', 'exportacion', 'aprobacion'].map(tipo => {
                      const count = vista.acciones.filter(a => a.tipo === tipo).length;
                      if (count > 0) {
                        return (
                          <Badge key={tipo} className={getActionTypeColor(tipo)}>
                            {tipo}: {count}
                          </Badge>
                        );
                      }
                      return null;
                    })}
                  </div>

                  {/* Acciones de la vista */}
                  {vista.acciones.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {vista.acciones
                        .sort((a, b) => a.orden - b.orden)
                        .map((accion) => (
                          <div key={accion.id} className="border rounded-md p-3 bg-gray-50/80 hover:bg-gray-100/80 transition-colors">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-sm">{accion.displayName}</h4>
                              <Badge className={getActionTypeColor(accion.tipo)}>
                                {accion.tipo}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600 mb-2">{accion.descripcion}</p>
                            <div className="flex justify-between items-center text-xs text-gray-500">
                              <span>Código: <code className="bg-gray-200 px-1 rounded">{accion.nombre}</code></span>
                              <span>ID: {accion.id}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500 bg-gray-50/50 rounded-lg">
                      ⚠️ No hay acciones definidas para esta vista
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Tabla resumen al final */}
            {!selectedVistaId && (
              <div className="mt-8 border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b">
                  <h3 className="font-semibold text-gray-800">📊 Tabla Resumen de Todas las Acciones por Vista</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left">Vista</th>
                        <th className="px-4 py-2 text-left">Módulo</th>
                        <th className="px-4 py-2 text-center">Total</th>
                        <th className="px-4 py-2 text-center">Ver</th>
                        <th className="px-4 py-2 text-center">Crear</th>
                        <th className="px-4 py-2 text-center">Editar</th>
                        <th className="px-4 py-2 text-center">Eliminar</th>
                        <th className="px-4 py-2 text-center">Otros</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewsWithActions?.map((vista) => {
                        const ver = vista.acciones.filter(a => a.tipo === 'visualizacion').length;
                        const crear = vista.acciones.filter(a => a.tipo === 'creacion').length;
                        const editar = vista.acciones.filter(a => a.tipo === 'edicion').length;
                        const eliminar = vista.acciones.filter(a => a.tipo === 'eliminacion').length;
                        const otros = vista.acciones.filter(a => !['visualizacion', 'creacion', 'edicion', 'eliminacion'].includes(a.tipo)).length;
                        
                        return (
                          <tr key={vista.id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-2 font-medium">{vista.displayName}</td>
                            <td className="px-4 py-2">
                              <Badge className={getModuleColor(vista.modulo)} variant="outline">
                                {vista.modulo}
                              </Badge>
                            </td>
                            <td className="px-4 py-2 text-center font-semibold">{vista.acciones.length}</td>
                            <td className="px-4 py-2 text-center">{ver || '-'}</td>
                            <td className="px-4 py-2 text-center">{crear || '-'}</td>
                            <td className="px-4 py-2 text-center">{editar || '-'}</td>
                            <td className="px-4 py-2 text-center">{eliminar || '-'}</td>
                            <td className="px-4 py-2 text-center">{otros || '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gray-100 font-semibold">
                      <tr>
                        <td className="px-4 py-2">TOTALES</td>
                        <td className="px-4 py-2">{new Set(viewsWithActions?.map(v => v.modulo)).size} módulos</td>
                        <td className="px-4 py-2 text-center">{viewsWithActions?.reduce((sum, v) => sum + v.acciones.length, 0)}</td>
                        <td className="px-4 py-2 text-center">{viewsWithActions?.reduce((sum, v) => sum + v.acciones.filter(a => a.tipo === 'visualizacion').length, 0)}</td>
                        <td className="px-4 py-2 text-center">{viewsWithActions?.reduce((sum, v) => sum + v.acciones.filter(a => a.tipo === 'creacion').length, 0)}</td>
                        <td className="px-4 py-2 text-center">{viewsWithActions?.reduce((sum, v) => sum + v.acciones.filter(a => a.tipo === 'edicion').length, 0)}</td>
                        <td className="px-4 py-2 text-center">{viewsWithActions?.reduce((sum, v) => sum + v.acciones.filter(a => a.tipo === 'eliminacion').length, 0)}</td>
                        <td className="px-4 py-2 text-center">{viewsWithActions?.reduce((sum, v) => sum + v.acciones.filter(a => !['visualizacion', 'creacion', 'edicion', 'eliminacion'].includes(a.tipo)).length, 0)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GestionPermisosPage;
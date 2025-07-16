import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Settings, Shield, Eye, Check, X } from 'lucide-react';

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

interface Perfil {
  id: number;
  nombre: string;
  descripcion: string;
}

interface PermissionConfig {
  vistaId: number;
  acciones: number[];
}

const GestionPermisosPage: React.FC = () => {
  const [selectedPerfilId, setSelectedPerfilId] = useState<number | null>(null);
  const [selectedVistaId, setSelectedVistaId] = useState<number | null>(null);
  const [permissions, setPermissions] = useState<PermissionConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para obtener todos los perfiles
  const { data: perfiles, isLoading: perfilesLoading } = useQuery({
    queryKey: ['/api/perfiles'],
    select: (data: Perfil[]) => data || []
  });

  // Query para obtener todas las vistas con sus acciones
  const { data: viewsWithActions, isLoading: viewsLoading } = useQuery<SystemView[]>({
    queryKey: ['/api/views-with-actions'],
    select: (data: SystemView[]) => data || []
  });

  // Query para obtener permisos del perfil seleccionado
  const { data: currentPermissions, refetch: refetchPermissions } = useQuery({
    queryKey: ['/api/perfiles', selectedPerfilId, 'views'],
    enabled: !!selectedPerfilId,
    select: (data: SystemView[]) => data || []
  });

  // Mutation para actualizar permisos
  const updatePermissionsMutation = useMutation({
    mutationFn: async (data: { perfilId: number; vistas: PermissionConfig[] }) => {
      return await apiRequest(`/api/perfiles/${data.perfilId}/permissions`, {
        method: 'POST',
        body: JSON.stringify({ vistas: data.vistas }),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      toast({
        title: "Permisos actualizados",
        description: "Los permisos se han guardado exitosamente",
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/perfiles', selectedPerfilId, 'views'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudieron guardar los permisos",
        variant: "destructive"
      });
    }
  });

  // Inicializar permisos cuando se selecciona un perfil
  useEffect(() => {
    if (currentPermissions && viewsWithActions) {
      const permissionConfig: PermissionConfig[] = [];
      
      // Para cada vista con permisos actuales
      currentPermissions.forEach((viewWithPermissions) => {
        permissionConfig.push({
          vistaId: viewWithPermissions.id,
          acciones: viewWithPermissions.acciones.map(action => action.id)
        });
      });
      
      setPermissions(permissionConfig);
    } else {
      setPermissions([]);
    }
  }, [currentPermissions, viewsWithActions]);

  const handlePerfilChange = (perfilId: string) => {
    const id = parseInt(perfilId);
    setSelectedPerfilId(id);
    setSelectedVistaId(null); // Reset vista selection
    setPermissions([]);
  };

  const handleViewToggle = (viewId: number, checked: boolean) => {
    setPermissions(prev => {
      if (checked) {
        // Agregar vista sin acciones
        if (!prev.find(p => p.vistaId === viewId)) {
          return [...prev, { vistaId: viewId, acciones: [] }];
        }
        return prev;
      } else {
        // Remover vista y todas sus acciones
        return prev.filter(p => p.vistaId !== viewId);
      }
    });
  };

  const handleActionToggle = (viewId: number, actionId: number, checked: boolean) => {
    setPermissions(prev => {
      return prev.map(permission => {
        if (permission.vistaId === viewId) {
          if (checked) {
            // Agregar acción si no existe
            if (!permission.acciones.includes(actionId)) {
              return {
                ...permission,
                acciones: [...permission.acciones, actionId]
              };
            }
          } else {
            // Remover acción
            return {
              ...permission,
              acciones: permission.acciones.filter(id => id !== actionId)
            };
          }
        }
        return permission;
      });
    });
  };

  const isViewChecked = (viewId: number) => {
    return permissions.some(p => p.vistaId === viewId);
  };

  const isActionChecked = (viewId: number, actionId: number) => {
    const viewPermission = permissions.find(p => p.vistaId === viewId);
    return viewPermission ? viewPermission.acciones.includes(actionId) : false;
  };

  const handleSavePermissions = async () => {
    if (!selectedPerfilId) return;
    
    setIsLoading(true);
    try {
      await updatePermissionsMutation.mutateAsync({
        perfilId: selectedPerfilId,
        vistas: permissions
      });
    } finally {
      setIsLoading(false);
    }
  };

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

  if (perfilesLoading || viewsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando permisos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Shield className="h-6 w-6 text-brand-lime" />
          <h1 className="text-3xl font-bold text-gray-800">Gestión de Permisos Dinámicos</h1>
        </div>
      </div>

      <div className="text-sm text-gray-600">
        Configure qué vistas y acciones puede acceder cada perfil de usuario.
      </div>

      {/* Selector de perfil */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Seleccionar Perfil</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">Perfil a configurar:</label>
              <Select onValueChange={handlePerfilChange} value={selectedPerfilId?.toString() || ""}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un perfil..." />
                </SelectTrigger>
                <SelectContent>
                  {perfiles?.map((perfil) => (
                    <SelectItem key={perfil.id} value={perfil.id.toString()}>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{perfil.nombre}</span>
                        <span className="text-sm text-gray-500">({perfil.descripcion})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Vista específica:</label>
              <Select 
                onValueChange={(value) => setSelectedVistaId(value ? parseInt(value) : null)} 
                value={selectedVistaId?.toString() || ""}
                disabled={!selectedPerfilId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione una vista..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas las vistas</SelectItem>
                  {viewsWithActions?.map((vista) => (
                    <SelectItem key={vista.id} value={vista.id.toString()}>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs px-2 py-1 rounded bg-brand-lime/10 text-brand-lime">
                          {vista.modulo.toUpperCase()}
                        </span>
                        <span className="font-medium">{vista.displayName}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedPerfilId && (
              <div className="space-y-2">
                <div className="text-sm text-gray-600">
                  Permisos configurados: {permissions.length} vistas
                </div>
                <div className="text-sm text-gray-600">
                  Total acciones: {permissions.reduce((sum, p) => sum + p.acciones.length, 0)}
                </div>
              </div>
            )}
            
            {selectedPerfilId && (
              <Button 
                onClick={handleSavePermissions}
                disabled={isLoading || updatePermissionsMutation.isPending}
                className="bg-brand-lime hover:bg-brand-lime/90 shadow-md"
              >
                {isLoading || updatePermissionsMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Guardar Permisos
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Vista específica seleccionada - Mostrar acciones disponibles */}
      {selectedVistaId && viewsWithActions && (
        <Card className="border-brand-lime/30">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <Shield className="h-5 w-5 text-brand-lime" />
              <span>Acciones para: {viewsWithActions.find(v => v.id === selectedVistaId)?.displayName}</span>
            </CardTitle>
            <div className="text-sm text-gray-600">
              Configure las acciones específicas que el perfil puede realizar en esta vista.
            </div>
          </CardHeader>
          <CardContent>
            {(() => {
              const selectedView = viewsWithActions.find(v => v.id === selectedVistaId);
              if (!selectedView || !selectedView.acciones.length) {
                return (
                  <div className="text-center py-8 text-gray-500">
                    No hay acciones disponibles para esta vista
                  </div>
                );
              }
              
              return (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <Checkbox
                      checked={isViewChecked(selectedVistaId)}
                      onCheckedChange={(checked) => 
                        handleViewToggle(selectedVistaId, checked as boolean)
                      }
                    />
                    <span className="font-medium">Permitir acceso a esta vista</span>
                    <Badge className={getModuleColor(selectedView.modulo)}>
                      {selectedView.modulo.toUpperCase()}
                    </Badge>
                  </div>
                  
                  {isViewChecked(selectedVistaId) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pl-6 border-l-2 border-brand-lime/30">
                      {selectedView.acciones
                        .sort((a, b) => a.orden - b.orden)
                        .map((action) => (
                          <div
                            key={action.id}
                            className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 card-interactive"
                          >
                            <Switch
                              checked={isActionChecked(selectedVistaId, action.id)}
                              onCheckedChange={(checked) =>
                                handleActionToggle(selectedVistaId, action.id, checked)
                              }
                            />
                            <div className="flex-1">
                              <div className="text-sm font-medium">{action.displayName}</div>
                              <div className="text-xs text-gray-500">{action.descripcion}</div>
                              <Badge variant="outline" className="text-xs mt-1">
                                {action.tipo}
                              </Badge>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Configuración de permisos */}
      {selectedPerfilId && viewsWithActions && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <Eye className="h-5 w-5" />
              <span>
                {selectedVistaId 
                  ? `Configuración para: ${viewsWithActions.find(v => v.id === selectedVistaId)?.displayName}`
                  : 'Configuración de Todas las Vistas'
                }
              </span>
            </CardTitle>
            <div className="text-sm text-gray-600">
              {selectedVistaId 
                ? 'Configure las acciones específicas para esta vista.'
                : 'Seleccione las vistas a las que el perfil puede acceder y configure las acciones permitidas.'
              }
            </div>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="space-y-4">
              {viewsWithActions
                .filter(view => !selectedVistaId || view.id === selectedVistaId)
                .sort((a, b) => a.orden - b.orden)
                .map((view) => (
                  <AccordionItem key={view.id} value={`view-${view.id}`} className="border rounded-lg">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                      <div className="flex items-center space-x-4 w-full">
                        <Checkbox
                          checked={isViewChecked(view.id)}
                          onCheckedChange={(checked) => 
                            handleViewToggle(view.id, checked as boolean)
                          }
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex items-center space-x-3 flex-1">
                          <Badge className={getModuleColor(view.modulo)}>
                            {view.modulo.toUpperCase()}
                          </Badge>
                          <div className="text-left">
                            <div className="font-medium">{view.displayName}</div>
                            <div className="text-sm text-gray-500">{view.descripcion}</div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {view.acciones.length} acciones
                        </div>
                      </div>
                    </AccordionTrigger>
                    
                    {isViewChecked(view.id) && (
                      <AccordionContent className="px-4 pb-4">
                        <Separator className="mb-4" />
                        <div className="space-y-3">
                          <div className="text-sm font-medium text-gray-700">
                            Acciones disponibles para esta vista:
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {view.acciones
                              .sort((a, b) => a.orden - b.orden)
                              .map((action) => (
                                <div
                                  key={action.id}
                                  className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50"
                                >
                                  <Switch
                                    checked={isActionChecked(view.id, action.id)}
                                    onCheckedChange={(checked) =>
                                      handleActionToggle(view.id, action.id, checked)
                                    }
                                  />
                                  <div className="flex-1">
                                    <div className="text-sm font-medium">{action.displayName}</div>
                                    <div className="text-xs text-gray-500">{action.descripcion}</div>
                                    <Badge variant="outline" className="text-xs mt-1">
                                      {action.tipo}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      </AccordionContent>
                    )}
                  </AccordionItem>
                ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {!selectedPerfilId && (
        <Card>
          <CardContent className="flex items-center justify-center h-40">
            <div className="text-center text-gray-500">
              <Settings className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Seleccione un perfil para configurar sus permisos</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GestionPermisosPage;
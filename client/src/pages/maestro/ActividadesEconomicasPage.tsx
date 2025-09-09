import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from 'sonner';
import { 
  Plus, 
  Building2, 
  Loader2, 
  Edit, 
  Trash2,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Lock,
  FileText
} from "lucide-react";
import { 
  actividadesEconomicasService,
  ActividadEconomica,
  CreateActividadEconomicaData
} from "@/services/actividadesEconomicasService";
import { useLoading } from '@/contexts/LoadingContext';
import { useRegisterView } from '@/hooks/useRegisterView';
import { Can } from '@/contexts/PermissionsContext';

export default function ActividadesEconomicasPage() {
  const [actividades, setActividades] = useState<ActividadEconomica[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("listado");
  
  // Estados para formulario
  const [editingActividad, setEditingActividad] = useState<ActividadEconomica | null>(null);
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  
  // Estados para formulario
  const [formData, setFormData] = useState<CreateActividadEconomicaData>({
    codigo: '',
    nombre: '',
    descripcion: '',
    activo: true
  });

  const { startLoading, stopLoading } = useLoading();
  const { addAction: addListado } = useRegisterView('Actividades Económicas', 'listado', 'Listado de Actividades Económicas');
  const { addAction: addFormulario } = useRegisterView('Actividades Económicas', 'formulario', 'Formulario de Actividad Económica');

  React.useEffect(() => {
    // Listado
    addListado('crear', 'Crear Actividad Económica');
    addListado('editar', 'Editar Actividad Económica');
    addListado('activar', 'Activar Actividad Económica');
    addListado('inactivar', 'Inactivar Actividad Económica');
    addListado('eliminar', 'Eliminar Actividad Económica');

    // Formulario
    addFormulario('guardar', 'Guardar Actividad Económica');
    addFormulario('cancelar', 'Cancelar');
  }, [addListado, addFormulario]);

  // Cargar datos
  useEffect(() => {
    fetchActividades();
  }, []);

  const fetchActividades = async () => {
    try {
      setLoading(true);
      const data = await actividadesEconomicasService.getAll();
      setActividades(data);
    } catch (error) {
      console.error('Error al cargar actividades económicas:', error);
      toast.error('Error al cargar las actividades económicas');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar actividades
  const filteredActividades = actividades.filter(actividad => {
    const matchesSearch = !searchTerm || 
      actividad.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      actividad.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (actividad.descripcion && actividad.descripcion.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && actividad.activo) ||
      (statusFilter === 'inactive' && !actividad.activo);
    
    return matchesSearch && matchesStatus;
  });

  // Manejar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.codigo.trim() || !formData.nombre.trim()) {
      toast.error('Código y nombre son obligatorios');
      return;
    }

    try {
      startLoading();
      
      if (editingActividad) {
        await actividadesEconomicasService.update(editingActividad.id, formData);
        toast.success('Actividad económica actualizada correctamente');
      } else {
        await actividadesEconomicasService.create(formData);
        toast.success('Actividad económica creada correctamente');
      }
      
      setActiveTab("listado");
      setEditingActividad(null);
      resetForm();
      fetchActividades();
    } catch (error: any) {
      console.error('Error al guardar actividad económica:', error);
      toast.error(error.message || 'Error al guardar la actividad económica');
    } finally {
      stopLoading();
    }
  };

  const resetForm = () => {
    setFormData({
      codigo: '',
      nombre: '',
      descripcion: '',
      activo: true
    });
  };

  const handleEdit = (actividad: ActividadEconomica) => {
    setEditingActividad(actividad);
    setFormData({
      codigo: actividad.codigo,
      nombre: actividad.nombre,
      descripcion: actividad.descripcion || '',
      activo: actividad.activo
    });
    setActiveTab("formulario");
  };

  const handleDelete = async (id: number) => {
    try {
      startLoading();
      await actividadesEconomicasService.delete(id);
      toast.success('Actividad económica eliminada correctamente');
      fetchActividades();
    } catch (error: any) {
      console.error('Error al eliminar actividad económica:', error);
      toast.error(error.message || 'Error al eliminar la actividad económica');
    } finally {
      stopLoading();
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      startLoading();
      if (currentStatus) {
        await actividadesEconomicasService.deactivate(id);
        toast.success('Actividad económica desactivada');
      } else {
        await actividadesEconomicasService.activate(id);
        toast.success('Actividad económica activada');
      }
      fetchActividades();
    } catch (error: any) {
      console.error('Error al cambiar estado:', error);
      toast.error(error.message || 'Error al cambiar el estado');
    } finally {
      stopLoading();
    }
  };

  const handleNew = () => {
    setEditingActividad(null);
    resetForm();
    setActiveTab("formulario");
  };

  return (
    <div className="p-4 max-w-full mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-extrabold text-cyan-800 flex items-center gap-2 mb-2">
          <Building2 className="w-8 h-8 text-cyan-600" />
          Gestión de Actividades Económicas
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-cyan-100/60 p-1 rounded-lg">
          <TabsTrigger
            value="listado"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
          >
            Listado de Actividades Económicas
          </TabsTrigger>
          <TabsTrigger
            value="formulario"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
          >
            Registro de Actividad Económica
          </TabsTrigger>
        </TabsList>

        <TabsContent value="listado" className="mt-6">
          {/* Header similar al diseño de perfiles */}
          <div className="bg-white rounded-lg border">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-orange-600" />
                </div>
                <span className="text-lg font-semibold text-gray-700">ACTIVIDADES ECONÓMICAS</span>
              </div>
              <div className="flex space-x-2">
                <Can action="accion-crear-actividad-economica">
                  <Button
                    onClick={handleNew}
                    className="bg-teal-400 hover:bg-teal-500 text-white text-xs px-3 py-1"
                    size="sm"
                  >
                    Adicionar Registro
                  </Button>
                </Can>
              </div>
            </div>

            {/* Filtros */}
            <div className="p-4 border-b bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por código, nombre..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="active">Solo activos</SelectItem>
                    <SelectItem value="inactive">Solo inactivos</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("active");
                  }}
                  className="flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Limpiar filtros
                </Button>
              </div>
            </div>

            {/* Tabla de actividades económicas */}
            <div className="overflow-x-auto rounded-lg shadow-sm">
              <Table className="min-w-[800px] w-full text-xs">
                <TableHeader className="bg-cyan-50">
                  <TableRow className="text-left font-semibold text-gray-700">
                    <TableHead className="px-2 py-1 text-teal-600">Acciones</TableHead>
                    <TableHead className="px-4 py-3">Código</TableHead>
                    <TableHead className="px-4 py-3">Nombre</TableHead>
                    <TableHead className="px-4 py-3">Descripción</TableHead>
                    <TableHead className="px-4 py-3">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        Cargando actividades económicas...
                      </TableCell>
                    </TableRow>
                  ) : filteredActividades.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No hay actividades económicas disponibles.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredActividades.map((actividad) => (
                      <TableRow key={actividad.id} className="hover:bg-gray-50">
                        <TableCell className="px-2 py-1">
                          <div className="flex flex-row gap-1 items-center">
                            <Can action="accion-editar-actividad-economica">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleEdit(actividad)}
                                      aria-label="Editar actividad económica"
                                      className="h-8 w-8"
                                    >
                                      <Edit className="h-4 w-4 text-cyan-600 hover:text-cyan-800 transition-colors" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Editar</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </Can>
                            {actividad.activo ? (
                              <Can action="accion-inactivar-actividad-economica">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            aria-label="Inactivar actividad económica"
                                            className="h-8 w-8"
                                          >
                                            <Lock className="h-4 w-4 text-yellow-600 hover:text-yellow-800 transition-colors" />
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>¿Inactivar actividad económica?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Esta acción inactivará la actividad económica y no podrá ser usada hasta que se reactive. ¿Estás seguro?
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleToggleStatus(actividad.id, actividad.activo)}>
                                              Sí, inactivar
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Inactivar</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </Can>
                            ) : (
                              <>
                                <Can action="accion-eliminar-actividad-economica">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              aria-label="Eliminar actividad económica"
                                              className="h-8 w-8"
                                            >
                                              <Trash2 className="h-4 w-4 text-rose-600 hover:text-rose-800 transition-colors" />
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>¿Eliminar actividad económica?</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                Esta acción eliminará la actividad económica de forma permanente. ¿Estás seguro?
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                              <AlertDialogAction onClick={() => handleDelete(actividad.id)}>
                                                Sí, eliminar
                                              </AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Eliminar</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </Can>
                                <Can action="accion-activar-actividad-economica">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              aria-label="Activar actividad económica"
                                              className="h-8 w-8"
                                            >
                                              <CheckCircle className="h-4 w-4 text-green-600 hover:text-green-800 transition-colors" />
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>¿Activar actividad económica?</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                Esta acción reactivará la actividad económica y estará disponible para su uso. ¿Estás seguro?
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                              <AlertDialogAction onClick={() => handleToggleStatus(actividad.id, actividad.activo)}>
                                                Sí, activar
                                              </AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Activar</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </Can>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-900">{actividad.codigo}</TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-900 font-medium">{actividad.nombre}</TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-500">
                          {actividad.descripcion ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <span className="truncate max-w-xs block">
                                    {actividad.descripcion}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{actividad.descripcion}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <span className="text-gray-400">Sin descripción</span>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-500">
                          <Badge variant={actividad.activo ? "default" : "secondary"}>
                            {actividad.activo ? (
                              <><CheckCircle className="h-3 w-3 mr-1" />Activa</>
                            ) : (
                              <><XCircle className="h-3 w-3 mr-1" />Inactiva</>
                            )}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

          <TabsContent value="formulario" className="mt-6">
            {/* Formulario de registro */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                {editingActividad ? 'Editar Actividad Económica' : 'Nueva Actividad Económica'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="codigo">Código *</Label>
                    <Input
                      id="codigo"
                      value={formData.codigo}
                      onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                      placeholder="Ej: 6201"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre *</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      placeholder="Ej: Desarrollo de software"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Descripción detallada de la actividad económica"
                    rows={3}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="activo"
                    checked={formData.activo}
                    onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="activo">Activa</Label>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setActiveTab("listado");
                      setEditingActividad(null);
                      resetForm();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {editingActividad ? 'Actualizar' : 'Crear'}
                  </Button>
                </div>
              </form>
            </div>
          </TabsContent>
        </Tabs>
    </div>
  );
}

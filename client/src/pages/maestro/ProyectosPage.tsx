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
import { toast } from "sonner";
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
  FileText,
  FolderKanban
} from "lucide-react";
import { 
  proyectosService,
  Proyecto,
  CreateProyectoData
} from "@/services/proyectosService";
import { useLoading } from '@/contexts/LoadingContext';
import { useRegisterView } from '@/hooks/useRegisterView';
import { Can } from '@/contexts/PermissionsContext';

export default function ProyectosPage() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("listado");
  
  // Estados para formulario
  const [editingProyecto, setEditingProyecto] = useState<Proyecto | null>(null);
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  
  // Estados para formulario
  const [formData, setFormData] = useState<CreateProyectoData>({
    codigo: '',
    nombre: '',
    descripcion: '',
    activo: true
  });

  const { startLoading, stopLoading } = useLoading();
  const { addAction: addListado } = useRegisterView('Proyectos', 'listado', 'Listado de Proyectos');
  const { addAction: addFormulario } = useRegisterView('Proyectos', 'formulario', 'Formulario de Proyecto');

  React.useEffect(() => {
    // Listado
    addListado('crear', 'Crear Proyecto');
    addListado('editar', 'Editar Proyecto');
    addListado('activar', 'Activar Proyecto');
    addListado('inactivar', 'Inactivar Proyecto');
    addListado('eliminar', 'Eliminar Proyecto');

    // Formulario
    addFormulario('guardar', 'Guardar Proyecto');
    addFormulario('cancelar', 'Cancelar');
  }, [addListado, addFormulario]);

  // Cargar datos
  useEffect(() => {
    fetchProyectos();
  }, []);

  const fetchProyectos = async () => {
    try {
      setLoading(true);
      const data = await proyectosService.getAll();
      setProyectos(data);
    } catch (error) {
      console.error('Error al cargar proyectos:', error);
      toast.error('Error al cargar los proyectos');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar proyectos
  const filteredProyectos = proyectos.filter(proyecto => {
    const matchesSearch = !searchTerm || 
      proyecto.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proyecto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (proyecto.descripcion && proyecto.descripcion.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && proyecto.activo) ||
      (statusFilter === 'inactive' && !proyecto.activo);
    
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
      
      if (editingProyecto) {
        await proyectosService.update(editingProyecto.id, formData);
        toast.success('Proyecto actualizado correctamente');
      } else {
        await proyectosService.create(formData);
        toast.success('Proyecto creado correctamente');
      }
      
      setActiveTab("listado");
      setEditingProyecto(null);
      resetForm();
      fetchProyectos();
    } catch (error: any) {
      console.error('Error al guardar proyecto:', error);
      toast.error(error.message || 'Error al guardar el proyecto');
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

  const handleEdit = (proyecto: Proyecto) => {
    setEditingProyecto(proyecto);
    setFormData({
      codigo: proyecto.codigo,
      nombre: proyecto.nombre,
      descripcion: proyecto.descripcion || '',
      activo: proyecto.activo
    });
    setActiveTab("formulario");
  };

  const handleDelete = async (id: number) => {
    try {
      startLoading();
      await proyectosService.delete(id);
      toast.success('Proyecto eliminado correctamente');
      fetchProyectos();
    } catch (error: any) {
      console.error('Error al eliminar proyecto:', error);
      toast.error(error.message || 'Error al eliminar el proyecto');
    } finally {
      stopLoading();
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      startLoading();
      if (currentStatus) {
        await proyectosService.deactivate(id);
        toast.success('Proyecto desactivado');
      } else {
        await proyectosService.activate(id);
        toast.success('Proyecto activado');
      }
      fetchProyectos();
    } catch (error: any) {
      console.error('Error al cambiar estado:', error);
      toast.error(error.message || 'Error al cambiar el estado');
    } finally {
      stopLoading();
    }
  };

  const handleNew = () => {
    setEditingProyecto(null);
    resetForm();
    setActiveTab("formulario");
  };

  return (
    <div className="p-4 max-w-full mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-extrabold text-cyan-800 flex items-center gap-2 mb-2">
          <FolderKanban className="w-8 h-8 text-cyan-600" />
          Gestión de Proyectos
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-cyan-100/60 p-1 rounded-lg">
          <TabsTrigger
            value="listado"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
          >
            Listado de Proyectos
          </TabsTrigger>
          <TabsTrigger
            value="formulario"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
          >
            Registro de Proyecto
          </TabsTrigger>
        </TabsList>

        <TabsContent value="listado" className="mt-6">
          {/* Header similar al diseño de perfiles */}
          <div className="bg-white rounded-lg border">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                  <FolderKanban className="w-5 h-5 text-orange-600" />
                </div>
                <span className="text-lg font-semibold text-gray-700">PROYECTOS</span>
              </div>
              <div className="flex space-x-2">
                <Can action="accion-crear-proyecto">
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

            {/* Tabla de proyectos */}
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
                        Cargando proyectos...
                      </TableCell>
                    </TableRow>
                  ) : filteredProyectos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No hay proyectos disponibles.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProyectos.map((proyecto) => (
                      <TableRow key={proyecto.id} className="hover:bg-gray-50">
                        <TableCell className="px-2 py-1">
                          <div className="flex flex-row gap-1 items-center">
                            <Can action="accion-editar-proyecto">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleEdit(proyecto)}
                                      aria-label="Editar proyecto"
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
                            {proyecto.activo ? (
                              <Can action="accion-inactivar-proyecto">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            aria-label="Inactivar proyecto"
                                            className="h-8 w-8"
                                          >
                                            <Lock className="h-4 w-4 text-yellow-600 hover:text-yellow-800 transition-colors" />
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>¿Inactivar proyecto?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Esta acción inactivará el proyecto y no podrá ser usado hasta que se reactive. ¿Estás seguro?
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleToggleStatus(proyecto.id, proyecto.activo)}>
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
                                <Can action="accion-eliminar-proyecto">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              aria-label="Eliminar proyecto"
                                              className="h-8 w-8"
                                            >
                                              <Trash2 className="h-4 w-4 text-rose-600 hover:text-rose-800 transition-colors" />
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>¿Eliminar proyecto?</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                Esta acción eliminará el proyecto de forma permanente. ¿Estás seguro?
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                              <AlertDialogAction onClick={() => handleDelete(proyecto.id)}>
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
                                <Can action="accion-activar-proyecto">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              aria-label="Activar proyecto"
                                              className="h-8 w-8"
                                            >
                                              <CheckCircle className="h-4 w-4 text-green-600 hover:text-green-800 transition-colors" />
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>¿Activar proyecto?</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                Esta acción reactivará el proyecto y estará disponible para su uso. ¿Estás seguro?
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                              <AlertDialogAction onClick={() => handleToggleStatus(proyecto.id, proyecto.activo)}>
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
                        <TableCell className="px-4 py-3 text-sm text-gray-900">{proyecto.codigo}</TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-900 font-medium">{proyecto.nombre}</TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-500">
                          {proyecto.descripcion ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <span className="truncate max-w-xs block">
                                    {proyecto.descripcion}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{proyecto.descripcion}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <span className="text-gray-400">Sin descripción</span>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-500">
                          <Badge variant={proyecto.activo ? "default" : "secondary"}>
                            {proyecto.activo ? (
                              <><CheckCircle className="h-3 w-3 mr-1" />Activo</>
                            ) : (
                              <><XCircle className="h-3 w-3 mr-1" />Inactivo</>
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
              {editingProyecto ? 'Editar Proyecto' : 'Nuevo Proyecto'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigo">Código *</Label>
                  <Input
                    id="codigo"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    placeholder="Ej: PROJ001"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ej: Proyecto de Desarrollo"
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
                  placeholder="Descripción detallada del proyecto"
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
                <Label htmlFor="activo">Activo</Label>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setActiveTab("listado");
                    setEditingProyecto(null);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingProyecto ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

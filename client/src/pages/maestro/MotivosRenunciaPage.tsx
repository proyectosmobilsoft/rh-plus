import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Plus,
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
  motivosRenunciaService,
  MotivoRenuncia,
  CreateMotivoRenunciaData
} from "@/services/motivosRenunciaService";
import { useLoading } from '@/contexts/LoadingContext';
import { useRegisterView } from '@/hooks/useRegisterView';
import { Can } from '@/contexts/PermissionsContext';

export default function MotivosRenunciaPage() {
  const [motivos, setMotivos] = useState<MotivoRenuncia[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("listado");

  const [editingMotivo, setEditingMotivo] = useState<MotivoRenuncia | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("active");

  const [formData, setFormData] = useState<CreateMotivoRenunciaData>({
    codigo: '',
    nombre: '',
    descripcion: '',
    activo: true
  });

  const { startLoading, stopLoading } = useLoading();
  const { addAction: addListado } = useRegisterView('Motivos de Renuncia', 'listado', 'Listado de Motivos de Renuncia');
  const { addAction: addFormulario } = useRegisterView('Motivos de Renuncia', 'formulario', 'Formulario de Motivo de Renuncia');

  React.useEffect(() => {
    addListado('crear', 'Crear Motivo de Renuncia');
    addListado('editar', 'Editar Motivo de Renuncia');
    addListado('activar', 'Activar Motivo de Renuncia');
    addListado('inactivar', 'Inactivar Motivo de Renuncia');
    addListado('eliminar', 'Eliminar Motivo de Renuncia');
    addFormulario('guardar', 'Guardar Motivo de Renuncia');
    addFormulario('cancelar', 'Cancelar');
  }, [addListado, addFormulario]);

  useEffect(() => {
    fetchMotivos();
  }, []);

  const fetchMotivos = async () => {
    try {
      setLoading(true);
      const data = await motivosRenunciaService.getAll();
      setMotivos(data);
    } catch (error) {
      console.error('Error al cargar motivos de renuncia:', error);
      toast.error('Error al cargar los motivos de renuncia');
    } finally {
      setLoading(false);
    }
  };

  const filteredMotivos = motivos.filter(motivo => {
    const matchesSearch = !searchTerm ||
      motivo.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      motivo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (motivo.descripcion && motivo.descripcion.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && motivo.activo) ||
      (statusFilter === 'inactive' && !motivo.activo);

    return matchesSearch && matchesStatus;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.codigo.trim() || !formData.nombre.trim()) {
      toast.error('Código y nombre son obligatorios');
      return;
    }

    try {
      startLoading();

      if (editingMotivo) {
        await motivosRenunciaService.update(editingMotivo.id, formData);
        toast.success('Motivo de renuncia actualizado correctamente');
      } else {
        await motivosRenunciaService.create(formData);
        toast.success('Motivo de renuncia creado correctamente');
      }

      setActiveTab("listado");
      setEditingMotivo(null);
      resetForm();
      fetchMotivos();
    } catch (error: any) {
      console.error('Error al guardar motivo de renuncia:', error);
      toast.error(error.message || 'Error al guardar el motivo de renuncia');
    } finally {
      stopLoading();
    }
  };

  const resetForm = () => {
    setFormData({ codigo: '', nombre: '', descripcion: '', activo: true });
  };

  const handleEdit = (motivo: MotivoRenuncia) => {
    setEditingMotivo(motivo);
    setFormData({
      codigo: motivo.codigo,
      nombre: motivo.nombre,
      descripcion: motivo.descripcion || '',
      activo: motivo.activo
    });
    setActiveTab("formulario");
  };

  const handleDelete = async (id: number) => {
    try {
      startLoading();
      await motivosRenunciaService.delete(id);
      toast.success('Motivo de renuncia eliminado correctamente');
      fetchMotivos();
    } catch (error: any) {
      console.error('Error al eliminar motivo de renuncia:', error);
      toast.error(error.message || 'Error al eliminar el motivo de renuncia');
    } finally {
      stopLoading();
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      startLoading();
      if (currentStatus) {
        await motivosRenunciaService.deactivate(id);
        toast.success('Motivo de renuncia desactivado');
      } else {
        await motivosRenunciaService.activate(id);
        toast.success('Motivo de renuncia activado');
      }
      fetchMotivos();
    } catch (error: any) {
      console.error('Error al cambiar estado:', error);
      toast.error(error.message || 'Error al cambiar el estado');
    } finally {
      stopLoading();
    }
  };

  const handleNew = () => {
    setEditingMotivo(null);
    resetForm();
    setActiveTab("formulario");
  };

  return (
    <div className="p-4 max-w-full mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-extrabold text-cyan-800 flex items-center gap-2 mb-2">
          <FileText className="w-8 h-8 text-cyan-600" />
          Gestión de Motivos de Renuncia
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-cyan-100/60 p-1 rounded-lg">
          <TabsTrigger
            value="listado"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
          >
            Listado de Motivos de Renuncia
          </TabsTrigger>
          <TabsTrigger
            value="formulario"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
          >
            Registro de Motivo de Renuncia
          </TabsTrigger>
        </TabsList>

        <TabsContent value="listado" className="mt-6">
          <div className="bg-white rounded-lg border">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                  <FileText className="w-5 h-5 text-orange-600" />
                </div>
                <span className="text-lg font-semibold text-gray-700">MOTIVOS DE RENUNCIA</span>
              </div>
              <div className="flex space-x-2">
                <Can action="accion-crear-motivo-renuncia">
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
                  onClick={() => { setSearchTerm(""); setStatusFilter("active"); }}
                  className="flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Limpiar filtros
                </Button>
              </div>
            </div>

            {/* Tabla */}
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
                        Cargando motivos de renuncia...
                      </TableCell>
                    </TableRow>
                  ) : filteredMotivos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No hay motivos de renuncia disponibles.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMotivos.map((motivo) => (
                      <TableRow key={motivo.id} className="hover:bg-gray-50">
                        <TableCell className="px-2 py-1">
                          <div className="flex flex-row gap-1 items-center">
                            <Can action="accion-editar-motivo-renuncia">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleEdit(motivo)}
                                      aria-label="Editar motivo de renuncia"
                                      className="h-8 w-8"
                                    >
                                      <Edit className="h-4 w-4 text-cyan-600 hover:text-cyan-800 transition-colors" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent><p>Editar</p></TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </Can>

                            {motivo.activo ? (
                              <Can action="accion-inactivar-motivo-renuncia">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button variant="ghost" size="icon" aria-label="Inactivar" className="h-8 w-8">
                                            <Lock className="h-4 w-4 text-yellow-600 hover:text-yellow-800 transition-colors" />
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>¿Inactivar motivo de renuncia?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Esta acción inactivará el motivo y no podrá ser seleccionado hasta que se reactive. ¿Estás seguro?
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleToggleStatus(motivo.id, motivo.activo)}>
                                              Sí, inactivar
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Inactivar</p></TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </Can>
                            ) : (
                              <>
                                <Can action="accion-eliminar-motivo-renuncia">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" aria-label="Eliminar" className="h-8 w-8">
                                              <Trash2 className="h-4 w-4 text-rose-600 hover:text-rose-800 transition-colors" />
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>¿Eliminar motivo de renuncia?</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                Esta acción eliminará el motivo de forma permanente. ¿Estás seguro?
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                              <AlertDialogAction onClick={() => handleDelete(motivo.id)}>
                                                Sí, eliminar
                                              </AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                      </TooltipTrigger>
                                      <TooltipContent><p>Eliminar</p></TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </Can>
                                <Can action="accion-activar-motivo-renuncia">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" aria-label="Activar" className="h-8 w-8">
                                              <CheckCircle className="h-4 w-4 text-green-600 hover:text-green-800 transition-colors" />
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>¿Activar motivo de renuncia?</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                Esta acción reactivará el motivo y estará disponible para su selección. ¿Estás seguro?
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                              <AlertDialogAction onClick={() => handleToggleStatus(motivo.id, motivo.activo)}>
                                                Sí, activar
                                              </AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                      </TooltipTrigger>
                                      <TooltipContent><p>Activar</p></TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </Can>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-900">{motivo.codigo}</TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-900 font-medium">{motivo.nombre}</TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-500">
                          {motivo.descripcion ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <span className="truncate max-w-xs block">{motivo.descripcion}</span>
                                </TooltipTrigger>
                                <TooltipContent><p>{motivo.descripcion}</p></TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <span className="text-gray-400">Sin descripción</span>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-500">
                          <Badge variant={motivo.activo ? "default" : "secondary"}>
                            {motivo.activo ? (
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
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {editingMotivo ? 'Editar Motivo de Renuncia' : 'Nuevo Motivo de Renuncia'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigo">Código *</Label>
                  <Input
                    id="codigo"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                    placeholder="Ej: VOLUNTARIA"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ej: Renuncia voluntaria"
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
                  placeholder="Descripción detallada del motivo de renuncia"
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
                    setEditingMotivo(null);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingMotivo ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

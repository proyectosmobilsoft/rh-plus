import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Plus, Edit, Trash2, Star, Search, Filter, Layers, Eye, Lock, CheckCircle, Crown } from "lucide-react";
import { TemplateForm } from "@/components/ordenes/TemplateForm";
import { plantillasService, Plantilla } from "@/services/plantillasService";
import { useToast } from "@/hooks/use-toast";
import { useLoading } from "@/contexts/LoadingContext";
import { empresasService } from "@/services/empresasService";
import { empresaService } from "@/services/empresaService";
import { Can } from "@/contexts/PermissionsContext";

const PlantillasPage: React.FC = () => {
  const { toast } = useToast();
  const { startLoading, stopLoading, isLoading } = useLoading();
  const [isCreating, setIsCreating] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Plantilla | null>(null);
  const [templates, setTemplates] = useState<Plantilla[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("listado");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [empresaAutenticada, setEmpresaAutenticada] = useState<string>("");
  
  // Estados para modales de confirmación
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showDefaultModal, setShowDefaultModal] = useState(false);
  const [templateToAction, setTemplateToAction] = useState<Plantilla | null>(null);

  // Obtener nombre de la empresa del localStorage
  React.useEffect(() => {
    const empresaData = localStorage.getItem('empresaData');
    if (empresaData) {
      const empresa = JSON.parse(empresaData);
      setEmpresaAutenticada(empresa.nombre || 'Empresa');
    } else {
      setEmpresaAutenticada('CoreHuman');
    }
  }, []);

  // Cargar plantillas desde Supabase
  React.useEffect(() => {
    const fetchTemplates = async () => {
      setError(null);
      try {
        const data = await plantillasService.getAll();
        setTemplates(data);
      } catch (err: any) {
        setError("Error al cargar las plantillas");
      }
    };
    fetchTemplates();
  }, []);

  // Filtrar plantillas
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = 
      template.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.descripcion?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" ? true :
      statusFilter === "active" ? template.activa : !template.activa;

    return matchesSearch && matchesStatus;
  });

  const startCreating = () => {
    setIsCreating(true);
    setEditingTemplate(null);
    setActiveTab("registro");
  };

  const startEditing = (template: Plantilla) => {
    setEditingTemplate(template);
    setIsCreating(true);
    setActiveTab("registro");
  };

  const resetForm = () => {
    setIsCreating(false);
    setEditingTemplate(null);
    setActiveTab("listado");
  };

  const handleSaved = () => {
    resetForm();
    toast({
      title: "✅ Éxito",
      description: editingTemplate ? "Plantilla actualizada correctamente" : "Plantilla creada correctamente",
      variant: "default"
    });
    // Recargar las plantillas desde Supabase
    plantillasService.getAll()
      .then(setTemplates)
      .catch(() => {
        setError("Error al recargar las plantillas");
        toast({
          title: "❌ Error",
          description: "Error al recargar las plantillas",
          variant: "destructive"
        });
      });
  };

  const handleDelete = async (template: Plantilla) => {
    if (!template.id) return;
    
    setTemplateToAction(template);
    setShowDeleteModal(true);
  };

  const confirmDelete = async (template: Plantilla) => {
    if (!template.id) return;
    
    startLoading();
    try {
      await plantillasService.delete(template.id);
      toast({
        title: "✅ Éxito",
        description: "Plantilla eliminada correctamente",
        variant: "default"
      });
      // Recargar la lista
      const data = await plantillasService.getAll();
      setTemplates(data);
    } catch (err) {
      toast({
        title: "❌ Error",
        description: "Error al eliminar la plantilla",
        variant: "destructive"
      });
    } finally {
      stopLoading();
      setShowDeleteModal(false);
    }
  };

  const handleActivate = async (template: Plantilla) => {
    console.log('🔍 handleActivate llamado con template:', template);
    if (!template.id) return;
    
    setTemplateToAction(template);
    setShowActivateModal(true);
    console.log('✅ Estado actualizado: templateToAction =', template, 'showActivateModal = true');
  };

  const confirmActivate = async (template: Plantilla) => {
    console.log('🔍 confirmActivate llamado con template:', template);
    if (!template.id) {
      console.log('❌ No hay template.id');
      return;
    }
    
    startLoading();
    try {
      console.log('🔄 Llamando a plantillasService.activate con ID:', template.id);
      const success = await plantillasService.activate(template.id);
      console.log('✅ Resultado de activate:', success);
      
      if (success) {
        toast({
          title: "✅ Éxito",
          description: "Plantilla activada correctamente",
          variant: "default"
        });
        // Recargar la lista
        const data = await plantillasService.getAll();
        setTemplates(data);
      } else {
        toast({
          title: "❌ Error",
          description: "Error al activar la plantilla",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error('❌ Error en confirmActivate:', err);
      toast({
        title: "❌ Error",
        description: "Error al activar la plantilla",
        variant: "destructive"
      });
    } finally {
      stopLoading();
      setShowActivateModal(false);
    }
  };

  const handleDeactivate = async (template: Plantilla) => {
    console.log('🔍 handleDeactivate llamado con template:', template);
    if (!template.id) return;
    
    setTemplateToAction(template);
    setShowDeactivateModal(true);
    console.log('✅ Estado actualizado: templateToAction =', template, 'showDeactivateModal = true');
  };

  const confirmDeactivate = async (template: Plantilla) => {
    console.log('🔍 confirmDeactivate llamado con template:', template);
    if (!template.id) {
      console.log('❌ No hay template.id');
      return;
    }
    
    startLoading();
    try {
      console.log('🔄 Llamando a plantillasService.deactivate con ID:', template.id);
      const success = await plantillasService.deactivate(template.id);
      console.log('✅ Resultado de deactivate:', success);
      
      if (success) {
        toast({
          title: "✅ Éxito",
          description: "Plantilla inactivada correctamente",
          variant: "default"
        });
        // Recargar la lista
        const data = await plantillasService.getAll();
        setTemplates(data);
      } else {
        toast({
          title: "❌ Error",
          description: "Error al inactivar la plantilla",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error('❌ Error en confirmDeactivate:', err);
      toast({
        title: "❌ Error",
        description: "Error al inactivar la plantilla",
        variant: "destructive"
      });
    } finally {
      stopLoading();
      setShowDeactivateModal(false);
    }
  };

  const handleSetDefault = async (template: Plantilla) => {
    console.log('🔍 handleSetDefault llamado con template:', template);
    if (!template.id) return;
    
    setTemplateToAction(template);
    setShowDefaultModal(true);
    console.log('✅ Estado actualizado: templateToAction =', template, 'showDefaultModal = true');
  };

  const confirmSetDefault = async (template: Plantilla) => {
    console.log('🔍 confirmSetDefault llamado con template:', template);
    if (!template.id) {
      console.log('❌ No hay template.id');
      return;
    }
    
    startLoading();
    try {
      console.log('🔄 Llamando a plantillasService.setDefault con ID:', template.id);
      const success = await plantillasService.setDefault(template.id);
      console.log('✅ Resultado de setDefault:', success);
      
      if (success) {
        toast({
          title: "✅ Éxito",
          description: "Plantilla establecida como predeterminada correctamente",
          variant: "default"
        });
        // Recargar la lista
        const data = await plantillasService.getAll();
        setTemplates(data);
      } else {
        toast({
          title: "❌ Error",
          description: "Error al establecer como predeterminada",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error('❌ Error en confirmSetDefault:', err);
      toast({
        title: "❌ Error",
        description: "Error al establecer como predeterminada",
        variant: "destructive"
      });
    } finally {
      stopLoading();
      setShowDefaultModal(false);
    }
  };

  return (
    <div className="p-4 max-w-full mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-extrabold text-cyan-800 flex items-center gap-2 mb-2">
          <Layers className="w-8 h-8 text-cyan-600" />
          Gestión de Plantillas
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-cyan-100/60 p-1 rounded-lg">
          <TabsTrigger
            value="listado"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
          >
            Listado de Plantillas
          </TabsTrigger>
          <TabsTrigger
            value="registro"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
          >
            Registro de Plantilla
          </TabsTrigger>
        </TabsList>

        <TabsContent value="listado" className="mt-6">
          {/* Header similar al diseño de empresas */}
          <div className="bg-white rounded-lg border">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                  <Layers className="w-5 h-5 text-orange-600" />
                </div>
                <span className="text-lg font-semibold text-gray-700">PLANTILLAS</span>
            </div>
              <div className="flex space-x-2">
                <Can action="accion-crear-plantilla">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={startCreating}
                          className="bg-teal-400 hover:bg-teal-500 text-white text-xs px-3 py-1"
                          size="sm"
                        >
              <Plus className="h-4 w-4 mr-2" />
                        Adicionar Registro
            </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Crear nueva plantilla</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Can>
              </div>
      </div>

            {/* Filtros */}
            <div className="p-4 border-b bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative md:col-span-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por nombre, descripción..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
            <div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Activas</SelectItem>
                      <SelectItem value="inactive">Inactivas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
            </div>
          </div>

            {/* Tabla */}
            <div className="overflow-x-auto">
          {isLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Cargando plantillas...</p>
                </div>
          ) : error ? (
                <div className="p-8 text-center text-red-500">
                  <p>{error}</p>
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="p-8 text-center">
                  <Layers className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay plantillas configuradas</h3>
                  <p className="text-gray-500 mb-4">
                  Cree la primera plantilla para personalizar los formularios de órdenes
                </p>
                  <Can action="accion-crear-plantilla">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button onClick={startCreating} className="bg-cyan-600 hover:bg-cyan-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primera Plantilla
                </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Crear primera plantilla del sistema</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Can>
                </div>
              ) : (
                <Table className="min-w-[1000px] w-full text-xs">
                  <TableHeader className="bg-cyan-50">
                    <TableRow className="text-left font-semibold text-gray-700">
                      <TableHead className="px-2 py-1 text-teal-600">Acciones</TableHead>
                      <TableHead className="px-4 py-3">Nombre</TableHead>
                      <TableHead className="px-4 py-3">Descripción</TableHead>
                      <TableHead className="px-4 py-3">Empresa</TableHead>
                      <TableHead className="px-4 py-3">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTemplates.map((template) => (
                      <TableRow key={template.id} className="hover:bg-gray-50">
                        <TableCell className="px-2 py-1">
                          <div className="flex flex-row gap-1 items-center">
                            <Can action="accion-editar-plantilla">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => startEditing(template)}
                                      aria-label="Editar plantilla"
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

                            {template.activa ? (
                              <>
                                <Can action="accion-inactivar-plantilla">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              aria-label="Inactivar plantilla"
                                              className="h-8 w-8"
                                            >
                                              <Lock className="h-4 w-4 text-yellow-600 hover:text-yellow-800 transition-colors" />
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>¿Inactivar plantilla?</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                Esta acción inactivará la plantilla y no podrá ser usada hasta que se reactive. ¿Estás seguro?
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                              <AlertDialogAction onClick={() => confirmDeactivate(template)}>
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

                                {!template.es_default && (
                                  <Can action="accion-establecer-predeterminada-plantilla">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                aria-label="Establecer como predeterminada"
                                                className="h-8 w-8"
                                              >
                                                <Crown className="h-4 w-4 text-purple-600 hover:text-purple-800 transition-colors" />
                                              </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                              <AlertDialogHeader>
                                                <AlertDialogTitle>¿Establecer como predeterminada?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                  Esta acción establecerá esta plantilla como predeterminada y removerá el estado de predeterminada de cualquier otra plantilla. ¿Estás seguro?
                                                </AlertDialogDescription>
                                              </AlertDialogHeader>
                                              <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => confirmSetDefault(template)}>
                                                  Sí, establecer
                                                </AlertDialogAction>
                                              </AlertDialogFooter>
                                            </AlertDialogContent>
                                          </AlertDialog>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Establecer como predeterminada</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </Can>
                                )}
                              </>
                            ) : (
                              <>
                                <Can action="accion-eliminar-plantilla">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              aria-label="Eliminar plantilla"
                                              className="h-8 w-8"
                                            >
                                              <Trash2 className="h-4 w-4 text-rose-600 hover:text-rose-800 transition-colors" />
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>¿Eliminar plantilla?</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                Esta acción eliminará la plantilla de forma permanente. ¿Estás seguro?
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                              <AlertDialogAction onClick={() => confirmDelete(template)}>
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

                                <Can action="accion-activar-plantilla">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              aria-label="Activar plantilla"
                                              className="h-8 w-8"
                                            >
                                              <CheckCircle className="h-4 w-4 text-brand-lime hover:text-brand-lime/80 transition-colors" />
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>¿Activar plantilla?</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                Esta acción reactivará la plantilla y estará disponible para su uso. ¿Estás seguro?
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                              <AlertDialogAction onClick={() => confirmActivate(template)}>
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
                        <TableCell className="px-4 py-3 text-sm text-gray-900 font-medium">
                      <div className="flex items-center space-x-2">
                            <span>{template.nombre}</span>
                        {template.es_default && (
                              <Badge variant="secondary" className="flex items-center space-x-1 bg-purple-100 text-purple-800 border-purple-200">
                                <Crown className="h-3 w-3" />
                            <span>Predeterminada</span>
                          </Badge>
                        )}
                      </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-500">
                          {template.descripcion || "Sin descripción"}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-500">
                          {template.empresa_nombre || 'Sin empresa'}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <Badge 
                            variant={template.activa ? "default" : "secondary"}
                            className={template.activa ? "bg-brand-lime/10 text-brand-lime border-brand-lime/20" : "bg-gray-200 text-gray-600 border-gray-300"}
                          >
                            {template.activa ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
          )}
        </div>
            </div>
        </TabsContent>

        <TabsContent value="registro" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-cyan-800">
                {editingTemplate ? "Editar Plantilla" : "Nueva Plantilla"}
              </CardTitle>
              <CardDescription>
                Configure la información y campos de la plantilla
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Can action={editingTemplate ? "accion-actualizar-plantilla" : "accion-crear-plantilla"}>
                <TemplateForm 
                  initialData={editingTemplate}
                  onSaved={handleSaved}
                />
              </Can>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modales de confirmación */}
      
      {/* Modal de eliminación */}
      <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar plantilla?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la plantilla "{templateToAction?.nombre}" de forma permanente. ¿Estás seguro?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertDialogAction 
                    onClick={() => {
                      console.log('🖱️ Botón "Sí, eliminar" clickeado');
                      confirmDelete(templateToAction!);
                    }} 
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Sí, eliminar
                  </AlertDialogAction>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Confirmar eliminación permanente</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de activación */}
      <AlertDialog open={showActivateModal} onOpenChange={setShowActivateModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Activar plantilla?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción reactivará la plantilla "{templateToAction?.nombre}" y estará disponible para su uso. ¿Estás seguro?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertDialogAction 
                    onClick={() => {
                      console.log('🖱️ Botón "Sí, activar" clickeado');
                      confirmActivate(templateToAction!);
                    }} 
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Sí, activar
                  </AlertDialogAction>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Confirmar activación de plantilla</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de inactivación */}
      <AlertDialog open={showDeactivateModal} onOpenChange={setShowDeactivateModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Inactivar plantilla?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción inactivará la plantilla "{templateToAction?.nombre}" y no podrá ser usada hasta que se reactive. ¿Estás seguro?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertDialogAction 
                    onClick={() => {
                      console.log('🖱️ Botón "Sí, inactivar" clickeado');
                      confirmDeactivate(templateToAction!); // Pass the templateToAction directly
                    }} 
                    className="bg-yellow-600 hover:bg-yellow-700"
                  >
                    Sí, inactivar
                  </AlertDialogAction>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Confirmar inactivación de plantilla</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de establecer como predeterminada */}
      <AlertDialog open={showDefaultModal} onOpenChange={setShowDefaultModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Establecer como predeterminada?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción establecerá la plantilla "{templateToAction?.nombre}" como predeterminada y removerá el estado de predeterminada de cualquier otra plantilla. ¿Estás seguro?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertDialogAction 
                    onClick={() => {
                      console.log('🖱️ Botón "Sí, establecer" clickeado');
                      confirmSetDefault(templateToAction!);
                    }} 
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Sí, establecer
                  </AlertDialogAction>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Confirmar establecimiento como predeterminada</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PlantillasPage; 
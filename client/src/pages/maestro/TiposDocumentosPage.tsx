import React, { useState } from 'react';
import { toast } from "sonner";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit, Trash2, Settings, Search, Filter, Eye, FileText, User, Building, CheckCircle, Lock, Save } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

import { useTiposDocumentos } from '@/hooks/useTiposDocumentos';
import { TipoDocumento, DocumentoTipoForm } from '@/types/maestro';
import { useQueryClient } from '@tanstack/react-query';
import { useLoading } from '@/contexts/LoadingContext';
import { Can } from "@/contexts/PermissionsContext";

const documentoTipoSchema = z.object({
  nombre: z.string().min(2, 'Nombre requerido'),
  descripcion: z.string().optional(),
  lleva_fecha_vigencia: z.boolean(),
  fecha_vigencia: z.string().optional(),
});

type DocumentoTipoFormData = z.infer<typeof documentoTipoSchema>;

export default function TiposDocumentosPage() {
  // Estados
  const [activeTab, setActiveTab] = useState("listado");
  const [editingDocumento, setEditingDocumento] = useState<TipoDocumento | null>(null);
  const [showDocumentoDialog, setShowDocumentoDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [showInactivateModal, setShowInactivateModal] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [documentoToAction, setDocumentoToAction] = useState<TipoDocumento | null>(null);

  // Hooks
  
  const queryClient = useQueryClient();
  const { startLoading, stopLoading, isLoading } = useLoading();

  const { 
    tiposDocumentos, 
    tiposDocumentosActivos,
    isLoading: loadingDocumentos, 
    createTipoDocumento, 
    updateTipoDocumento,
    deleteTipoDocumento,
    activateTipoDocumento,
    isCreating: isCreatingDocumento,
    isUpdating: isUpdatingDocumento,
    isDeleting: isDeletingDocumento,
    isActivating: isActivatingDocumento,
    forceRefresh: forceRefreshDocumentos
  } = useTiposDocumentos();

  // Forms
  const documentoForm = useForm<DocumentoTipoFormData>({
    resolver: zodResolver(documentoTipoSchema),
    defaultValues: { 
      nombre: '', 
      descripcion: '', 
      lleva_fecha_vigencia: false,
      fecha_vigencia: ''
    },
  });

  // Filtrar tipos de documentos - mostrar solo activos por defecto
  const filteredTiposDocumentos = tiposDocumentos
    .filter(documento => {
      const matchesSearch = 
        documento.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        documento.descripcion?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" ? true :
        statusFilter === "active" ? documento.activo : !documento.activo;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      // Mostrar documentos activos primero
      if (a.activo !== b.activo) {
        return a.activo ? -1 : 1;
      }
      // Luego ordenar por nombre
      return (a.nombre || "").localeCompare(b.nombre || "");
    });

  // Handlers
  const handleEdit = (documento: TipoDocumento) => {
    setEditingDocumento(documento);
    
    // Convertir fecha si existe y es válida
    let fechaVigencia = '';
    if (documento.fecha_vigencia) {
      try {
        // Si la fecha viene en formato ISO, convertirla a YYYY-MM-DD para el input date
        const fecha = new Date(documento.fecha_vigencia);
        if (!isNaN(fecha.getTime())) {
          fechaVigencia = fecha.toISOString().split('T')[0];
        } else {
          fechaVigencia = documento.fecha_vigencia;
        }
      } catch (error) {
        fechaVigencia = documento.fecha_vigencia;
      }
    }
    
    documentoForm.reset({
      nombre: documento.nombre || '',
      descripcion: documento.descripcion || '',
      lleva_fecha_vigencia: Boolean(documento.lleva_fecha_vigencia),
      fecha_vigencia: fechaVigencia,
    });
    setActiveTab("registro");
  };

  const handleInactivate = (documento: TipoDocumento) => {
    setDocumentoToAction(documento);
    setShowInactivateModal(true);
  };

  const handleActivate = (documento: TipoDocumento) => {
    setDocumentoToAction(documento);
    setShowActivateModal(true);
  };

  const handleDelete = (documento: TipoDocumento) => {
    setDocumentoToAction(documento);
    setShowDeleteModal(true);
  };

  const confirmInactivate = async () => {
    if (!documentoToAction?.id) return;

    startLoading();
    try {
      await deleteTipoDocumento(documentoToAction.id);
      toast.success("Tipo de documento inactivado correctamente");
    } catch (error) {
      toast.error("Error al inactivar el tipo de documento");
    } finally {
      stopLoading();
      setShowInactivateModal(false);
      setDocumentoToAction(null);
    }
  };

  const confirmActivate = async () => {
    if (!documentoToAction?.id) return;

    startLoading();
    try {
      await activateTipoDocumento(documentoToAction.id);
      toast.success("Tipo de documento activado correctamente");
    } catch (error) {
      toast.error("Error al activar el tipo de documento");
    } finally {
      stopLoading();
      setShowActivateModal(false);
      setDocumentoToAction(null);
    }
  };

  const confirmDelete = async () => {
    if (!documentoToAction?.id) return;

    startLoading();
    try {
      deleteTipoDocumento(documentoToAction.id);
      toast.success("Tipo de documento eliminado correctamente");
    } catch (error) {
      toast.error("Error al eliminar el tipo de documento");
    } finally {
      stopLoading();
      setShowDeleteModal(false);
      setDocumentoToAction(null);
    }
  };

  const handleSaved = () => {
    setActiveTab("listado");
    setEditingDocumento(null);
  };

  const handleNewDocumento = () => {
    setEditingDocumento(null);
    documentoForm.reset({ 
      nombre: '', 
      descripcion: '', 
      lleva_fecha_vigencia: false,
      fecha_vigencia: ''
    });
    setActiveTab("registro");
  };



  const onSubmit = async (data: DocumentoTipoFormData) => {
    startLoading();
    try {
      if (editingDocumento) {
        await updateTipoDocumento({ id: editingDocumento.id!, data });
        toast.success("Tipo de documento actualizado exitosamente");
      } else {
        await createTipoDocumento(data);
        toast.success("Tipo de documento creado exitosamente");
      }
      
      // Refrescar la tabla
      queryClient.invalidateQueries({ queryKey: ['tipos-documentos'] });
      
      documentoForm.reset();
      setEditingDocumento(null);
      setActiveTab("listado");
    } catch (error) {
      toast.error("Error al guardar el tipo de documento");
    } finally {
      stopLoading();
    }
  };

  return (
    <div className="p-4 max-w-full mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-extrabold text-cyan-800 flex items-center gap-2 mb-2">
          <FileText className="w-8 h-8 text-cyan-600" />
          Gestión de Tipos de Documentos
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-cyan-100/60 p-1 rounded-lg">
          <TabsTrigger
            value="listado"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
          >
            Listado de Documentos
          </TabsTrigger>
          <TabsTrigger
            value="registro"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
          >
            Registro de Documento
          </TabsTrigger>
        </TabsList>

        <TabsContent value="listado" className="mt-6">
          {/* Header similar al diseño de empresas */}
          <div className="bg-white rounded-lg border">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                  <FileText className="w-5 h-5 text-orange-600" />
                </div>
                <span className="text-lg font-semibold text-gray-700">TIPOS DE DOCUMENTOS</span>
              </div>
              <div className="flex space-x-2">
                <Can action="accion-crear-tipo-documento">
                  <Button
                    onClick={handleNewDocumento}
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

            {/* Tabla de tipos de documentos */}
            <div className="overflow-x-auto rounded-lg shadow-sm">
              <Table className="min-w-[800px] w-full text-xs">
                <TableHeader className="bg-cyan-50">
                  <TableRow className="text-left font-semibold text-gray-700">
                    <TableHead className="px-2 py-1 text-teal-600">Acciones</TableHead>
                    <TableHead className="px-4 py-3">Nombre</TableHead>
                    <TableHead className="px-4 py-3">Descripción</TableHead>
                    <TableHead className="px-4 py-3">Fecha de Vigencia</TableHead>
                    <TableHead className="px-4 py-3">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!isLoading ? (
                    filteredTiposDocumentos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          No hay tipos de documentos disponibles.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTiposDocumentos.map((documento) => (
                        <TableRow key={documento.id} className="hover:bg-gray-50">
                          <TableCell className="px-2 py-1">
                            <div className="flex flex-row gap-1 items-center">
                              {documento.activo && (
                                <Can action="accion-editar-tipo-documento">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => handleEdit(documento)}
                                          aria-label="Editar documento"
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
                              )}

                              {documento.activo ? (
                                <Can action="accion-inactivar-tipo-documento">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => handleInactivate(documento)}
                                          aria-label="Inactivar documento"
                                          className="h-8 w-8"
                                        >
                                          <Lock className="h-4 w-4 text-yellow-600 hover:text-yellow-800 transition-colors" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Inactivar</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </Can>
                              ) : (
                                <>
                                  <Can action="accion-eliminar-tipo-documento">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(documento)}
                                            aria-label="Eliminar documento"
                                            className="h-8 w-8"
                                          >
                                            <Trash2 className="h-4 w-4 text-red-600 hover:text-red-800 transition-colors" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Eliminar</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </Can>
                                  <Can action="accion-activar-tipo-documento">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleActivate(documento)}
                                            aria-label="Activar documento"
                                            className="h-8 w-8"
                                          >
                                            <CheckCircle className="h-4 w-4 text-green-600 hover:text-green-800 transition-colors" />
                                          </Button>
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
                          <TableCell className="px-4 py-3 text-sm text-gray-900 font-medium">{documento.nombre}</TableCell>
                          <TableCell className="px-4 py-3 text-sm text-gray-500">{documento.descripcion || '-'}</TableCell>
                          <TableCell className="px-4 py-3 text-sm text-gray-500">
                            {documento.lleva_fecha_vigencia ? (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                {documento.fecha_vigencia ? new Date(documento.fecha_vigencia).toLocaleDateString('es-ES') : 'Configurar'}
                              </Badge>
                            ) : (
                              <span className="text-gray-400">No aplica</span>
                            )}
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <Badge variant={documento.activo ? "default" : "secondary"} className={documento.activo ? "bg-brand-lime/10 text-brand-lime border-brand-lime/20" : "bg-gray-200 text-gray-600 border-gray-300"}>
                              {documento.activo ? "Activo" : "Inactivo"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        Cargando tipos de documentos...
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="registro" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {editingDocumento ? "Editar Tipo de Documento" : "Crear Nuevo Tipo de Documento"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...documentoForm}>
                <form onSubmit={documentoForm.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={documentoForm.control}
                      name="nombre"
                      render={({ field }) => (
                        <FormItem className="flex flex-col items-start">
                          <FormLabel className="ml-2">Nombre</FormLabel>
                          <FormControl>
                            <Input 
                              autoComplete="off"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={documentoForm.control}
                      name="descripcion"
                      render={({ field }) => (
                        <FormItem className="flex flex-col items-start">
                          <FormLabel className="ml-2">Descripción</FormLabel>
                          <FormControl>
                            <Textarea 
                              autoComplete="off"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-row gap-6 flex-wrap">
                        <FormField
                          control={documentoForm.control}
                          name="lleva_fecha_vigencia"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={Boolean(field.value)}
                                  onCheckedChange={(checked) => field.onChange(checked)}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel 
                                  className="cursor-pointer"
                                  onClick={() => field.onChange(!Boolean(field.value))}
                                >
                                  Lleva fecha de vigencia
                                </FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={documentoForm.control}
                        name="fecha_vigencia"
                        render={({ field }) => (
                          <FormItem className="min-h-[68px] flex flex-col items-start">
                            {documentoForm.watch('lleva_fecha_vigencia') ? (
                              <>
                                <FormLabel className="ml-2">Fecha de vigencia</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Input 
                                      type="date"
                                      autoComplete="off"
                                      className="cursor-pointer w-48"
                                      onClick={(e) => {
                                        try {
                                          e.currentTarget.showPicker?.();
                                        } catch (error) {
                                          // Fallback silencioso si showPicker no está disponible o falla
                                        }
                                      }}
                                      {...field}
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </>
                            ) : (
                              <div className="invisible">
                                <FormLabel className="ml-2">Placeholder</FormLabel>
                                <div className="h-10"></div>
                              </div>
                            )}
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Can action={editingDocumento ? "accion-actualizar-tipo-documento" : "accion-crear-tipo-documento"}>
                      <Button 
                        type="submit" 
                        disabled={isCreatingDocumento || isUpdatingDocumento}
                        className="bg-cyan-600 hover:bg-cyan-700 text-white"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Guardar
                      </Button>
                    </Can>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de confirmación para inactivar */}
      <AlertDialog open={showInactivateModal} onOpenChange={setShowInactivateModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Inactivar tipo de documento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción inactivará el tipo de documento "{documentoToAction?.nombre}" y no podrá ser usado hasta que se reactive. ¿Estás seguro?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmInactivate}>
              Sí, inactivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de confirmación para activar */}
      <AlertDialog open={showActivateModal} onOpenChange={setShowActivateModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Activar tipo de documento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción reactivará el tipo de documento "{documentoToAction?.nombre}" y estará disponible para su uso. ¿Estás seguro?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmActivate}>
              Sí, activar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de confirmación para eliminar */}
      <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar tipo de documento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el tipo de documento "{documentoToAction?.nombre}" de forma permanente. ¿Estás seguro?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}





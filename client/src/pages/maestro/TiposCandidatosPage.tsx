import React, { useState, useEffect } from 'react';
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

import { useTiposCandidatosCrud } from '@/hooks/useTiposCandidatosCrud';
import { useTiposDocumentos } from '@/hooks/useTiposDocumentos';
import { useTiposCandidatosDocumentos } from '@/hooks/useTiposCandidatosDocumentos';
import { TipoCandidato, TipoDocumento, TipoCandidatoForm, DocumentoTipoForm } from '@/types/maestro';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { useLoading } from '@/contexts/LoadingContext';
import { Can } from "@/contexts/PermissionsContext";

const tipoCandidatoSchema = z.object({
  nombre: z.string().min(2, 'Nombre requerido'),
  descripcion: z.string().optional(),
});



export default function TiposCandidatosPage() {
  // Estados
  const [activeTab, setActiveTab] = useState("tipos");
  const [editingTipo, setEditingTipo] = useState<TipoCandidato | null>(null);
  const [editingDocumento, setEditingDocumento] = useState<TipoDocumento | null>(null);
  const [selectedTipo, setSelectedTipo] = useState<TipoCandidato | null>(null);
  const [showDocumentosConfig, setShowDocumentosConfig] = useState(false);
  const [showTipoDialog, setShowTipoDialog] = useState(false);
  const [showDocumentoDialog, setShowDocumentoDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [showInactivateModal, setShowInactivateModal] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tipoToAction, setTipoToAction] = useState<TipoCandidato | null>(null);
  const [loadingDocumentoId, setLoadingDocumentoId] = useState<number | null>(null);
  const [searchDocumentos, setSearchDocumentos] = useState("");
  const [documentosCounts, setDocumentosCounts] = useState<Record<number, number>>({});
  const [selectAllDocumentos, setSelectAllDocumentos] = useState(false);

  // Hooks - TODOS LOS HOOKS DEBEN ESTAR AQUÍ AL INICIO
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { startLoading, stopLoading, isLoading } = useLoading();

  const { 
    tiposCandidatos, 
    tiposCandidatosActivos,
    isLoading: loadingTipos, 
    createTipoCandidato, 
    updateTipoCandidato,
    deleteTipoCandidato,
    activateTipoCandidato,
    isCreating,
    isUpdating,
    isDeleting,
    isActivating
  } = useTiposCandidatosCrud();

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

  const { getDocumentosRequeridos, getByTipoCandidatoWithDetails, updateDocumentosForTipoCandidato } = useTiposCandidatosDocumentos();
  
  // Función para cargar los contadores de documentos asociados
  const loadDocumentosCounts = async () => {
    if (!tiposCandidatos || !tiposCandidatos.length) return;
    
    try {
      const tiposCandidatosIds = tiposCandidatos.map(tipo => tipo.id);
      const { tiposCandidatosDocumentosService } = await import('@/services/tiposCandidatosDocumentosService');
      const counts = await tiposCandidatosDocumentosService.getDocumentosCounts(tiposCandidatosIds);
      setDocumentosCounts(counts);
    } catch (error) {
      console.error('Error al cargar contadores de documentos:', error);
      // En caso de error, establecer contadores en 0
      const counts: Record<number, number> = {};
      tiposCandidatos.forEach(tipo => {
        counts[tipo.id] = 0;
      });
      setDocumentosCounts(counts);
    }
  };
  
  // Usar un ID fijo para evitar cambios en el hook
  const selectedTipoId = selectedTipo?.id || 0;
  const { 
    data: documentosRequeridos = [], 
    isLoading: loadingRequeridos 
  } = getDocumentosRequeridos(selectedTipoId);

  // Obtener todos los documentos asociados (no solo los obligatorios) para mostrar el estado completo
  const { 
    data: documentosAsociados = [], 
    isLoading: loadingAsociados 
  } = getByTipoCandidatoWithDetails(selectedTipoId);

  // Forms - DESPUÉS DE TODOS LOS HOOKS
  const tipoForm = useForm<TipoCandidatoForm>({
    resolver: zodResolver(tipoCandidatoSchema),
    defaultValues: { nombre: '', descripcion: '' },
  });

  // Cargar contadores cuando se cargan los tipos de candidatos
  useEffect(() => {
    loadDocumentosCounts();
  }, [tiposCandidatos]);

  // Invalidar consultas cuando se abre el diálogo de configuración para cargar datos frescos
  useEffect(() => {
    if (showDocumentosConfig && selectedTipo?.id) {
      queryClient.invalidateQueries({ queryKey: ['documentos-requeridos', selectedTipo.id] });
      queryClient.invalidateQueries({ queryKey: ['tipos-candidatos-documentos-detalles', selectedTipo.id] });
    }
  }, [showDocumentosConfig, selectedTipo?.id, queryClient]);

  // Actualizar el estado del checkbox "Seleccionar todos" basado en los documentos asociados
  useEffect(() => {
    if (tiposDocumentosActivos && documentosAsociados) {
      const totalDocumentos = tiposDocumentosActivos.length;
      const documentosSeleccionados = documentosAsociados.length;
      setSelectAllDocumentos(totalDocumentos > 0 && documentosSeleccionados === totalDocumentos);
    }
  }, [tiposDocumentosActivos, documentosAsociados]);



  // Filtrar tipos de candidatos - mostrar solo activos por defecto
  const filteredTiposCandidatos: TipoCandidato[] = (tiposCandidatos?.filter(tipo => {
      const matchesSearch = 
        tipo.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tipo.descripcion?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" ? true :
        statusFilter === "active" ? tipo.activo : !tipo.activo;

      return matchesSearch && matchesStatus;
    }) || [])
    .sort((a, b) => {
      // Mostrar tipos activos primero
      if (a.activo !== b.activo) {
        return a.activo ? -1 : 1;
      }
      // Luego ordenar por nombre
      return (a.nombre || "").localeCompare(b.nombre || "");
    });

  // Handlers
  const handleEdit = (tipo: TipoCandidato) => {
    setEditingTipo(tipo);
    setSelectedTipo(tipo);
    tipoForm.reset({
      nombre: tipo.nombre || '',
      descripcion: tipo.descripcion || '',
    });
    setActiveTab("registro");
  };

  const handleInactivate = (tipo: TipoCandidato) => {
    setTipoToAction(tipo);
    setShowInactivateModal(true);
  };

  const handleActivate = (tipo: TipoCandidato) => {
    setTipoToAction(tipo);
    setShowActivateModal(true);
  };

  const handleDelete = (tipo: TipoCandidato) => {
    setTipoToAction(tipo);
    setShowDeleteModal(true);
  };

  const confirmInactivate = async () => {
    if (!tipoToAction?.id) return;

    startLoading();
    try {
      await deleteTipoCandidato(tipoToAction.id);
      toast({
        title: "✅ Éxito",
        description: "Tipo de cargo inactivado correctamente",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Error al inactivar el tipo de cargo",
        variant: "destructive"
      });
    } finally {
      stopLoading();
      setShowInactivateModal(false);
      setTipoToAction(null);
    }
  };

  const confirmActivate = async () => {
    if (!tipoToAction?.id) return;

    startLoading();
    try {
      await activateTipoCandidato(tipoToAction.id);
      toast({
        title: "✅ Éxito",
        description: "Tipo de cargo activado correctamente",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Error al activar el tipo de cargo",
        variant: "destructive"
      });
    } finally {
      stopLoading();
      setShowActivateModal(false);
      setTipoToAction(null);
    }
  };

  const confirmDelete = async () => {
    if (!tipoToAction?.id) return;

    startLoading();
    try {
      await deleteTipoCandidato(tipoToAction.id);
      toast({
        title: "✅ Éxito",
        description: "Tipo de cargo eliminado correctamente",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Error al eliminar el tipo de cargo",
        variant: "destructive"
      });
    } finally {
      stopLoading();
      setShowDeleteModal(false);
      setTipoToAction(null);
    }
  };

  const handleDeleteDocumento = async (documento: TipoDocumento) => {
    if (!documento.id) return;

    startLoading();
    try {
      await deleteTipoDocumento(documento.id);
      toast({
        title: "✅ Éxito",
        description: "Tipo de documento eliminado correctamente",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Error al eliminar el tipo de documento",
        variant: "destructive"
      });
    } finally {
      stopLoading();
    }
  };

  const handleActivateDocumento = async (documento: TipoDocumento) => {
    if (!documento.id) return;

    startLoading();
    try {
      await activateTipoDocumento(documento.id);
      toast({
        title: "✅ Éxito",
        description: "Tipo de documento activado correctamente",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Error al activar el tipo de documento",
        variant: "destructive"
      });
    } finally {
      stopLoading();
    }
  };

  const handleSaved = () => {
    setActiveTab("tipos");
    setEditingTipo(null);
  };

  const handleNewTipo = () => {
    setEditingTipo(null);
    setSelectedTipo(null);
    tipoForm.reset({ nombre: '', descripcion: '' });
    setActiveTab("registro");
  };

  const handleConfigureTipo = (tipo: TipoCandidato) => {
    setSelectedTipo(tipo);
    setSearchDocumentos(""); // Limpiar búsqueda al abrir modal
    setSelectAllDocumentos(false); // Resetear selección de todos
    setShowDocumentosConfig(true);
  };

  const handleToggleDocumento = async (documentoId: number, selected: boolean) => {
    if (!selectedTipo) return;
    
    setLoadingDocumentoId(documentoId);
    startLoading();
    
    try {
      // Crear una copia de los documentos asociados actuales
      const updatedDocumentos = [...documentosAsociados];
      const existingIndex = updatedDocumentos.findIndex(d => d.tipo_documento_id === documentoId);
      
      if (existingIndex >= 0) {
        if (!selected) {
          // Si se desmarca, eliminar el documento
          updatedDocumentos.splice(existingIndex, 1);
        }
        // Si ya existe y se mantiene marcado, no hacer nada
      } else if (selected) {
        // Si no existe y se marca, agregarlo con requerido = false por defecto
        updatedDocumentos.push({
          tipo_candidato_id: selectedTipo.id,
          tipo_documento_id: documentoId,
          obligatorio: true, // Este campo ahora solo indica si está seleccionado
          requerido: false,  // Nuevo campo: requerido = false por defecto
          orden: updatedDocumentos.length,
        } as any);
      }

      // Preparar la lista para la actualización
      const documentosParaActualizar = updatedDocumentos.map(doc => ({
        tipo_documento_id: doc.tipo_documento_id,
        obligatorio: doc.obligatorio,
        requerido: doc.requerido || false,
        orden: doc.orden
      }));

      await updateDocumentosForTipoCandidato.mutateAsync({
        tipoCandidatoId: selectedTipo.id,
        documentos: documentosParaActualizar,
      });
      
      // Actualizar el contador de documentos
      setDocumentosCounts(prev => ({
        ...prev,
        [selectedTipo.id]: updatedDocumentos.length
      }));

      // Actualizar el estado del checkbox "Seleccionar todos"
      const totalDocumentos = tiposDocumentosActivos?.length || 0;
      setSelectAllDocumentos(totalDocumentos > 0 && updatedDocumentos.length === totalDocumentos);
    } finally {
      stopLoading();
      setLoadingDocumentoId(null);
    }
  };

  const handleToggleRequerido = async (documentoId: number, requerido: boolean) => {
    if (!selectedTipo) return;
    
    setLoadingDocumentoId(documentoId);
    startLoading();
    
    try {
      // Crear una copia de los documentos asociados actuales
      const updatedDocumentos = [...documentosAsociados];
      const existingIndex = updatedDocumentos.findIndex(d => d.tipo_documento_id === documentoId);
      
      if (existingIndex >= 0) {
        // Actualizar solo el campo requerido
        updatedDocumentos[existingIndex].requerido = requerido;
      }

      // Preparar la lista para la actualización
      const documentosParaActualizar = updatedDocumentos.map(doc => ({
        tipo_documento_id: doc.tipo_documento_id,
        obligatorio: doc.obligatorio,
        requerido: doc.requerido || false,
        orden: doc.orden
      }));

      await updateDocumentosForTipoCandidato.mutateAsync({
        tipoCandidatoId: selectedTipo.id,
        documentos: documentosParaActualizar,
      });
    } finally {
      stopLoading();
      setLoadingDocumentoId(null);
    }
  };

  const handleSelectAllDocumentos = async (selectAll: boolean) => {
    if (!selectedTipo || !tiposDocumentosActivos) return;
    
    setSelectAllDocumentos(selectAll);
    startLoading();
    
    try {
      let updatedDocumentos = [...documentosAsociados];
      
      if (selectAll) {
        // Agregar todos los documentos que no estén ya seleccionados
        const documentosToAdd = tiposDocumentosActivos
          .filter(doc => !updatedDocumentos.some(existing => existing.tipo_documento_id === doc.id))
          .map((doc, index) => ({
            tipo_candidato_id: selectedTipo.id,
            tipo_documento_id: doc.id,
            obligatorio: true,
            requerido: false, // Por defecto no requerido
            orden: updatedDocumentos.length + index,
          } as any));
        
        updatedDocumentos = [...updatedDocumentos, ...documentosToAdd];
      } else {
        // Remover todos los documentos
        updatedDocumentos = [];
      }

      // Preparar la lista para la actualización
      const documentosParaActualizar = updatedDocumentos.map(doc => ({
        tipo_documento_id: doc.tipo_documento_id,
        obligatorio: doc.obligatorio,
        requerido: doc.requerido || false,
        orden: doc.orden
      }));

      await updateDocumentosForTipoCandidato.mutateAsync({
        tipoCandidatoId: selectedTipo.id,
        documentos: documentosParaActualizar,
      });
      
      // Actualizar el contador de documentos
      setDocumentosCounts(prev => ({
        ...prev,
        [selectedTipo.id]: updatedDocumentos.length
      }));
    } finally {
      stopLoading();
    }
  };

  const handleTipoSubmit = async (data: TipoCandidatoForm) => {
    startLoading();
    try {
      if (editingTipo) {
        await updateTipoCandidato({ id: editingTipo.id!, data });
      } else {
        await createTipoCandidato(data);
      }
      tipoForm.reset();
      setEditingTipo(null);
      setSelectedTipo(null);
      setActiveTab("tipos");
    } finally {
      stopLoading();
    }
  };



  return (
    <div className="p-4 max-w-full mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-extrabold text-cyan-800 flex items-center gap-2 mb-2">
          <User className="w-8 h-8 text-cyan-600" />
          Gestión de Tipos de Cargos
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-cyan-100/60 p-1 rounded-lg">
          <TabsTrigger
            value="tipos"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
          >
            Listado de Cargos
          </TabsTrigger>
          <TabsTrigger
            value="registro"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
          >
            Registro de Cargos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tipos" className="mt-6">
          {/* Header similar al diseño de empresas */}
          <div className="bg-white rounded-lg border">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                  <User className="w-5 h-5 text-orange-600" />
                </div>
                <span className="text-lg font-semibold text-gray-700">TIPOS DE CARGOS</span>
              </div>
              <div className="flex space-x-2">
                <Can action="accion-crear-tipo-cargo">
                  <Button
                    onClick={handleNewTipo}
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

            {/* Tabla de tipos de candidatos */}
            <div className="overflow-x-auto rounded-lg shadow-sm">
              <Table className="min-w-[800px] w-full text-xs">
                <TableHeader className="bg-cyan-50">
                  <TableRow className="text-left font-semibold text-gray-700">
                    <TableHead className="px-2 py-1 text-teal-600 w-32">Acciones</TableHead>
                    <TableHead className="px-4 py-3 w-1/3">Nombre</TableHead>
                    <TableHead className="px-4 py-3 w-1/3">Descripción</TableHead>
                    <TableHead className="px-4 py-3 w-40 whitespace-nowrap">Documentos Asociados</TableHead>
                    <TableHead className="px-4 py-3 w-24">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!isLoading ? (
                    filteredTiposCandidatos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          No hay tipos de cargos disponibles.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTiposCandidatos.map((tipo) => (
                        <TableRow key={tipo.id} className="hover:bg-gray-50">
                          <TableCell className="px-2 py-1">
                            <div className="flex flex-row gap-1 items-center">
                              {tipo.activo && (
                                <>
                                  <Can action="accion-editar-tipo-cargo">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleEdit(tipo)}
                                            aria-label="Editar tipo"
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

                                  <Can action="accion-configurar-documentos-tipo-cargo">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleConfigureTipo(tipo)}
                                            aria-label="Configurar documentos"
                                            className="h-8 w-8"
                                          >
                                            <Settings className="h-4 w-4 text-blue-600 hover:text-blue-800 transition-colors" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Configurar documentos</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </Can>
                                </>
                              )}

                              {tipo.activo ? (
                                <Can action="accion-inactivar-tipo-cargo">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => handleInactivate(tipo)}
                                          aria-label="Inactivar tipo"
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
                                  <Can action="accion-eliminar-tipo-cargo">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(tipo)}
                                            aria-label="Eliminar tipo"
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
                                  <Can action="accion-activar-tipo-cargo">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleActivate(tipo)}
                                            aria-label="Activar tipo"
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
                          <TableCell className="px-4 py-3 text-sm text-gray-900 font-medium">{tipo.nombre}</TableCell>
                          <TableCell className="px-4 py-3 text-sm text-gray-500">{tipo.descripcion || '-'}</TableCell>
                          <TableCell className="px-4 py-3 text-sm text-gray-500">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {documentosCounts[tipo.id] || 0} documentos
                            </Badge>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <Badge variant={tipo.activo ? "default" : "secondary"} className={tipo.activo ? "bg-brand-lime/10 text-brand-lime border-brand-lime/20" : "bg-gray-200 text-gray-600 border-gray-300"}>
                              {tipo.activo ? "Activo" : "Inactivo"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        Cargando tipos de cargos...
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
                <User className="w-5 h-5" />
                                 {selectedTipo ? "Editar tipo de cargo" : "Crear nuevo tipo de cargo"}
              </CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...tipoForm}>
                  <form onSubmit={tipoForm.handleSubmit(handleTipoSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={tipoForm.control}
                      name="nombre"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre del Cargo</FormLabel>
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
                      control={tipoForm.control}
                      name="descripcion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descripción</FormLabel>
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
                  <div className="flex justify-end">
                    <Can action={editingTipo ? "accion-actualizar-tipo-cargo" : "accion-crear-tipo-cargo"}>
                      <Button
                        type="submit" 
                        disabled={isCreating || isUpdating}
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

      {/* Configuración de Documentos por Tipo */}
      <Dialog open={showDocumentosConfig} onOpenChange={setShowDocumentosConfig}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Configurar Documentos - {selectedTipo?.nombre}
            </DialogTitle>
            <DialogDescription>
              Selecciona qué documentos están asociados a este tipo de cargo y marca cuáles son requeridos
            </DialogDescription>
          </DialogHeader>
          {selectedTipo && (
            <div className="space-y-4">
              {loadingAsociados ? (
                <div className="text-center py-4">Cargando documentos asociados...</div>
              ) : (
                <div className="space-y-4">
                  <div className="text-sm text-gray-600 mb-4">
                    <p className="mb-2">• <strong>Checkbox principal:</strong> Selecciona los documentos asociados a este tipo de cargo</p>
                    <p>• <strong>Checkbox "Requerido":</strong> Marca si el documento es obligatorio (aparece solo cuando el documento está seleccionado)</p>
                  </div>
                  
                  {/* Checkbox para seleccionar todos */}
                  <div className="flex items-center space-x-2 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <Checkbox
                      checked={selectAllDocumentos}
                      onCheckedChange={(checked) => handleSelectAllDocumentos(checked === true)}
                      disabled={isLoading}
                    />
                    <span className="text-sm font-medium text-blue-700">
                      Seleccionar todos los documentos
                    </span>
                  </div>
                  
                  {/* Filtro de búsqueda */}
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Buscar por nombre de documento..."
                      value={searchDocumentos}
                      onChange={(e) => setSearchDocumentos(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <div className="max-h-[60vh] overflow-y-auto border rounded-lg p-4 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {(() => {
                        // Función para normalizar texto (remover tildes y acentos)
                        const normalizeText = (text: string) => {
                          return text
                            .toLowerCase()
                            .normalize('NFD')
                            .replace(/[\u0300-\u036f]/g, '');
                        };
                        
                        const filteredDocumentos = tiposDocumentosActivos.filter(documento => 
                          normalizeText(documento.nombre || '').includes(normalizeText(searchDocumentos))
                        );
                        
                        if (filteredDocumentos.length === 0 && searchDocumentos) {
                          return (
                            <div className="col-span-full text-center py-8 text-gray-500">
                              No se encontraron documentos que coincidan con "{searchDocumentos}"
                            </div>
                          );
                        }
                        
                        return filteredDocumentos.map((documento: TipoDocumento) => {
                          const documentoAsociado = documentosAsociados?.find(
                            (dr: any) => dr.tipo_documento_id === documento.id
                          );
                          const isSelected = documentoAsociado ? true : false;
                          const isRequerido = documentoAsociado?.requerido || false;
                          const isLoading = loadingDocumentoId === documento.id;
                          
                          return (
                            <div 
                              key={documento.id} 
                              className={`flex items-center space-x-3 p-3 border rounded-lg transition-all duration-200 bg-white ${
                                isSelected 
                                  ? 'bg-cyan-50 border-cyan-200' 
                                  : 'border-gray-200'
                              } ${isLoading ? 'opacity-70' : ''}`}
                            >
                              {/* Checkbox principal para seleccionar el documento */}
                              {isLoading ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-600 border-t-transparent" />
                              ) : (
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={(checked) => 
                                    handleToggleDocumento(documento.id, checked === true)
                                  }
                                  disabled={isLoading}
                                />
                              )}
                              
                              {/* Información del documento */}
                              <div className="flex-1">
                                <div className="font-medium text-sm">{documento.nombre}</div>
                                {documento.descripcion && (
                                  <div className="text-xs text-gray-500">{documento.descripcion}</div>
                                )}
                              </div>
                              
                              {/* Checkbox de "Requerido" solo cuando el documento está seleccionado */}
                              {isSelected && (
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    checked={isRequerido}
                                    onCheckedChange={(checked) => 
                                      handleToggleRequerido(documento.id, checked === true)
                                    }
                                    disabled={isLoading}
                                    className="border-cyan-600"
                                  />
                                  <span className="text-xs text-cyan-600 font-medium">Requerido</span>
                                </div>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                  {tiposDocumentosActivos.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No hay tipos de documentos disponibles. Crea algunos en el tab de registro.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de confirmación para inactivar */}
      <AlertDialog open={showInactivateModal} onOpenChange={setShowInactivateModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Inactivar tipo de cargo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción inactivará el tipo de cargo "{tipoToAction?.nombre}" y no podrá ser usado hasta que se reactive. ¿Estás seguro?
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
            <AlertDialogTitle>¿Activar tipo de cargo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción reactivará el tipo de cargo "{tipoToAction?.nombre}" y estará disponible para su uso. ¿Estás seguro?
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
            <AlertDialogTitle>¿Eliminar tipo de cargo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el tipo de cargo "{tipoToAction?.nombre}" de forma permanente. ¿Estás seguro?
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
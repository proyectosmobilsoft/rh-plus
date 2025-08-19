import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { User, Search, Plus, Edit, Trash2, FileText, Download, Eye, Filter, Lock, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { candidatosService, type DocumentoCandidato } from '@/services/candidatosService';
import { useCompanies } from '@/hooks/useCompanies';
import { useCityData } from '@/hooks/useCityData';
import React from 'react';
import { empresasService } from '@/services/empresasService';
import { useLoading } from '@/contexts/LoadingContext';
import { supabase } from '@/services/supabaseClient';
import { useTiposCandidatos } from '@/hooks/useTiposCandidatos';
import { useNavigate } from 'react-router-dom';
import { Can } from "@/contexts/PermissionsContext";

interface Candidato {
  id: number;
  identificacion: string;
  tipoDocumento: string;
  nombre: string;
  apellido: string;
  correo: string;
  tipoCandidatoId?: number;
}

const CandidatosPage = () => {
  const { toast } = useToast();
  const { startLoading, stopLoading } = useLoading();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("candidatos");
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [empresaFilter, setEmpresaFilter] = useState<string>("todas");
  const [ciudadFilter, setCiudadFilter] = useState<string>("todas");
  const [statusFilter, setStatusFilter] = useState<string>("activos");
  
  const [formData, setFormData] = useState<Partial<Candidato>>({
    identificacion: '',
    tipoDocumento: 'CC',
    nombre: '',
    apellido: '',
    correo: '',
    tipoCandidatoId: undefined
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: cityData = {}, isLoading: loadingCities } = useCityData();
  const [selectedDepartamento, setSelectedDepartamento] = useState<string>('');

  // Estados para búsqueda por cédula y documentos
  const [candidatoEncontrado, setCandidatoEncontrado] = useState<any>(null);
  const [documentosCandidato, setDocumentosCandidato] = useState<DocumentoCandidato[]>([]);
  const [modalDocumentosOpen, setModalDocumentosOpen] = useState(false);
  const [buscandoCandidato, setBuscandoCandidato] = useState(false);
  const [modalConfirmacionOpen, setModalConfirmacionOpen] = useState(false);
  const [candidatoAEliminar, setCandidatoAEliminar] = useState<any>(null);

  // Hooks
  const { data: empresasData = [], isLoading: loadingEmpresas } = useCompanies('empresa');
  const { tiposCandidatosActivos, isLoading: loadingTipos } = useTiposCandidatos();

  // Debug: mostrar información de tipos de candidatos
  console.log('🔍 CandidatosPage - Tipos de candidatos activos:', tiposCandidatosActivos);
  console.log('🔍 CandidatosPage - Estado de carga de tipos:', loadingTipos);
  console.log('🔍 CandidatosPage - Total de tipos:', tiposCandidatosActivos.length);

  // Query para obtener candidatos desde Supabase
  const { data: candidatos = [], isLoading, refetch } = useQuery({
    queryKey: ['candidatos'],
    queryFn: candidatosService.getAll,
    staleTime: 0,
    refetchOnWindowFocus: false
  });

  // Función para buscar candidato por cédula
  const buscarCandidatoPorCedula = async () => {
    if (!searchTerm.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa un número de cédula",
        variant: "destructive",
      });
      return;
    }

    setBuscandoCandidato(true);
    try {
      const candidato = await candidatosService.getByDocumento(searchTerm);
      if (candidato) {
        setCandidatoEncontrado(candidato);
        // Obtener documentos del candidato
        const documentos = await candidatosService.getDocumentos(candidato.id!);
        setDocumentosCandidato(documentos);
        setModalDocumentosOpen(true);
      } else {
        toast({
          title: "No encontrado",
          description: "No se encontró ningún candidato con esa cédula",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error buscando candidato:', error);
      toast({
        title: "Error",
        description: "Error al buscar el candidato",
        variant: "destructive",
      });
    } finally {
      setBuscandoCandidato(false);
    }
  };

  // Función para buscar documentos de un candidato específico
  const buscarDocumentosCandidato = async (candidato: any) => {
    setBuscandoCandidato(true);
    try {
      setCandidatoEncontrado(candidato);
      // Obtener documentos del candidato
      const documentos = await candidatosService.getDocumentos(candidato.id);
      setDocumentosCandidato(documentos);
      setModalDocumentosOpen(true);
    } catch (error) {
      console.error('Error buscando documentos:', error);
      toast({
        title: "Error",
        description: "Error al buscar los documentos",
        variant: "destructive",
      });
    } finally {
      setBuscandoCandidato(false);
    }
  };

  // Función para abrir modal de confirmación de eliminación
  const confirmarEliminacion = (candidato: any) => {
    setCandidatoAEliminar(candidato);
    setModalConfirmacionOpen(true);
  };

  // Función para descargar documento
  const descargarDocumento = (documento: DocumentoCandidato) => {
    if (documento.url_archivo) {
      window.open(documento.url_archivo, '_blank');
    } else {
      toast({
        title: "Error",
        description: "No se puede descargar el documento",
        variant: "destructive",
      });
    }
  };

  // Función para obtener el tipo de documento en español
  const getTipoDocumentoLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      'hoja_vida': 'Hoja de Vida',
      'diploma': 'Diploma',
      'certificacion': 'Certificación',
      'fotografia': 'Fotografía',
      'certificado_laboral': 'Certificado Laboral',
      'portafolio': 'Portafolio',
      'otros': 'Otros'
    };
    return tipos[tipo] || tipo;
  };

  // Mutation para crear candidato en Supabase (mantenido para compatibilidad)
  const createCandidatoMutation = useMutation({
    mutationFn: async (data: any) => {
      return candidatosService.create(data);
    },
    onSuccess: async () => {
      await refetch();
      setDialogOpen(false);
      resetForm();
      toast({
        title: "Éxito",
        description: "Candidato creado correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para eliminar candidato en Supabase
  const deleteCandidatoMutation = useMutation({
    mutationFn: async (id: number) => {
      return candidatosService.delete(id);
    },
    onSuccess: async () => {
      await refetch();
      toast({
        title: "Eliminado",
        description: "Candidato eliminado correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Refresca la lista al abrir la página o cambiar de ruta
  React.useEffect(() => {
    refetch();
  }, []);

  // Lookup helpers para empresa y ciudad
  const getEmpresaNombre = (empresa_id: number) => {
    const empresa = empresasData.find((e: any) => e.id === empresa_id);
    return empresa ? empresa.razonSocial : '';
  };

  // Filtrar candidatos usando los campos reales de Supabase
  const filteredCandidatos = candidatos.filter((candidato: any) => {
    const matchesSearch =
      (candidato.primer_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidato.primer_apellido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidato.numero_documento?.includes(searchTerm) ||
      candidato.email?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesEmpresa = empresaFilter === 'todas' || getEmpresaNombre(candidato.empresa_id) === empresaFilter;
    
    const matchesCiudad = ciudadFilter === 'todas' || getCiudadNombre(candidato.ciudad_id) === ciudadFilter;
    
    const matchesStatus = statusFilter === 'todos' ? true :
      statusFilter === 'activos' ? candidato.activo : !candidato.activo;
    
    return matchesSearch && matchesEmpresa && matchesCiudad && matchesStatus;
  });

  // Función para limpiar el formulario
  const resetForm = () => {
    setFormData({
      identificacion: '',
      tipoDocumento: 'CC',
      nombre: '',
      apellido: '',
      correo: '',
      tipoCandidatoId: undefined
    });
    setEditingId(null);
  };

  // Función para manejar envío del formulario
  const handleSubmit = async () => {
    if (formData.identificacion && formData.nombre && formData.apellido && formData.correo && formData.tipoCandidatoId) {
      setIsSubmitting(true);
      
      const candidatoPayload = {
        tipo_documento: formData.tipoDocumento || 'CC',
        numero_documento: formData.identificacion,
        primer_nombre: formData.nombre,
        primer_apellido: formData.apellido,
        email: formData.correo,
        tipo_candidato_id: formData.tipoCandidatoId,
        activo: true, // Por defecto activo
      };
      
      try {
        if (editingId) {
          // Actualizar candidato existente en Supabase
          await candidatosService.update(editingId, candidatoPayload);
          await refetch();
          setActiveTab("candidatos");
          resetForm();
          toast({
            title: "✅ Candidato Actualizado Exitosamente",
            description: `Se ha actualizado el candidato ${candidatoPayload.primer_nombre} ${candidatoPayload.primer_apellido}`,
          });
        } else {
          // Crear nuevo candidato
          await candidatosService.create(candidatoPayload);
          await refetch();
          resetForm();
          toast({
            title: "✅ Candidato Creado Exitosamente",
            description: `Se ha creado el candidato ${candidatoPayload.primer_nombre} ${candidatoPayload.primer_apellido} con el email ${candidatoPayload.email}`,
          });
        }
      } catch (error: any) {
        toast({
          title: "❌ Error",
          description: error.message || "Error al procesar la solicitud",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      let errorMessage = "Por favor complete todos los campos obligatorios";
      let errorTitle = "❌ Campos Incompletos";
      
      if (!formData.tipoCandidatoId) {
        errorMessage = "Por favor seleccione un tipo de candidato";
        errorTitle = "❌ Tipo de Candidato Requerido";
      } else if (!formData.identificacion) {
        errorMessage = "Por favor ingrese el número de documento";
        errorTitle = "❌ Documento Requerido";
      } else if (!formData.nombre) {
        errorMessage = "Por favor ingrese los nombres";
        errorTitle = "❌ Nombres Requeridos";
      } else if (!formData.apellido) {
        errorMessage = "Por favor ingrese los apellidos";
        errorTitle = "❌ Apellidos Requeridos";
      } else if (!formData.correo) {
        errorMessage = "Por favor ingrese el correo electrónico";
        errorTitle = "❌ Correo Requerido";
      } else if (!formData.correo.includes('@')) {
        errorMessage = "Por favor ingrese un correo electrónico válido";
        errorTitle = "❌ Correo Inválido";
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Helper para obtener el departamento a partir del id de ciudad
  const getDepartamentoIdByCiudadId = (ciudad_id: number) => {
    for (const [depId, dep] of Object.entries(cityData as Record<string, any>)) {
      if (dep.ciudades.some((c: any) => c.id === ciudad_id)) {
        return depId;
      }
    }
    return '';
  };

  // Función para abrir modal de edición
  const handleEdit = (candidato: any) => {
    setFormData({
      identificacion: candidato.numero_documento || '',
      tipoDocumento: candidato.tipo_documento || 'CC',
      nombre: candidato.primer_nombre || '',
      apellido: candidato.primer_apellido || '',
      correo: candidato.email || '',
      tipoCandidatoId: candidato.tipo_candidato_id
    });
    setEditingId(candidato.id);
    setActiveTab("registro");
  };

  const getCiudadNombre = (ciudad_id: number) => {
    for (const dep of Object.values(cityData as Record<string, any>)) {
      const ciudad = dep.ciudades.find((c: any) => c.id === ciudad_id);
      if (ciudad) return ciudad.nombre;
    }
    return '';
  };

  // Obtener ciudades únicas para el filtro
  const uniqueCities = [...new Set(candidatos.map((c: any) => getCiudadNombre(c.ciudad_id)).filter(Boolean))].sort();

  // Obtener empresas únicas para el filtro
  const uniqueEmpresas = [...new Set(candidatos.map((c: any) => getEmpresaNombre(c.empresa_id)).filter(Boolean))].sort();

  const handleNewCandidato = () => {
    resetForm();
    setEditingId(null);
    setActiveTab("registro");
  };

  const handleSaved = () => {
    setActiveTab("candidatos");
    setDialogOpen(false);
    resetForm();
    refetch();
  };

  const handleActivate = async (candidato: any) => {
    if (!candidato.id) return;

    try {
      startLoading();
      const success = await candidatosService.activate(candidato.id);
      if (success) {
        toast({
          title: "✅ Éxito",
          description: "Candidato activado correctamente",
          variant: "default"
        });
        await refetch(); // Recargar datos
      } else {
        toast({
          title: "❌ Error",
          description: "No se pudo activar el candidato",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Error al activar el candidato",
        variant: "destructive"
      });
    } finally {
      stopLoading();
    }
  };

  const handleDeactivate = async (candidato: any) => {
    if (!candidato.id) return;

    try {
      startLoading();
      const success = await candidatosService.deactivate(candidato.id);
      if (success) {
        toast({
          title: "✅ Éxito",
          description: "Candidato inactivado correctamente",
          variant: "default"
        });
        await refetch(); // Recargar datos
      } else {
        toast({
          title: "❌ Error",
          description: "No se pudo inactivar el candidato",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Error al inactivar el candidato",
        variant: "destructive"
      });
    } finally {
      stopLoading();
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 max-w-full mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-full mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-extrabold text-cyan-800 flex items-center gap-2 mb-2">
          <User className="w-8 h-8 text-cyan-600" />
          Gestión de Candidatos
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-cyan-100/60 p-1 rounded-lg">
          <TabsTrigger
            value="candidatos"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
          >
            Listado de Candidatos
          </TabsTrigger>
          <TabsTrigger
            value="registro"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
          >
            Registro de Candidato
          </TabsTrigger>
        </TabsList>

        <TabsContent value="candidatos" className="mt-6">
          {/* Header similar al diseño de empresas */}
          <div className="bg-white rounded-lg border">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                  <User className="w-5 h-5 text-orange-600" />
                </div>
                <span className="text-lg font-semibold text-gray-700">CANDIDATOS</span>
              </div>
              <div className="flex space-x-2">
                <Can action="accion-crear-candidato">
                  <Button
                    onClick={handleNewCandidato}
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
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por nombre, cédula o email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={empresaFilter} onValueChange={setEmpresaFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas las empresas</SelectItem>
                    {uniqueEmpresas.map(empresa => (
                      <SelectItem key={empresa} value={empresa}>{empresa}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={ciudadFilter} onValueChange={setCiudadFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por ciudad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas las ciudades</SelectItem>
                    {Object.values(cityData).flatMap((dep: any) => 
                      dep.ciudades.map((ciudad: any) => (
                        <SelectItem key={ciudad.id} value={ciudad.nombre}>
                          {ciudad.nombre}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los estados</SelectItem>
                    <SelectItem value="activos">Solo activos</SelectItem>
                    <SelectItem value="inactivos">Solo inactivos</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setEmpresaFilter("todas");
                    setCiudadFilter("todas");
                    setStatusFilter("activos");
                  }}
                  className="flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Limpiar filtros
                </Button>
              </div>
            </div>

            {/* Tabla de candidatos */}
            <div className="overflow-x-auto rounded-lg shadow-sm">
              <Table className="min-w-[800px] w-full text-xs">
                <TableHeader className="bg-cyan-50">
                  <TableRow className="text-left font-semibold text-gray-700">
                    <TableHead className="px-2 py-1 text-teal-600">Acciones</TableHead>
                    <TableHead className="px-4 py-3">Cédula</TableHead>
                    <TableHead className="px-4 py-3">Nombre Completo</TableHead>
                    <TableHead className="px-4 py-3">Teléfono</TableHead>
                    <TableHead className="px-4 py-3">Email</TableHead>
                    <TableHead className="px-4 py-3">Empresa</TableHead>
                    <TableHead className="px-4 py-3">Ciudad</TableHead>
                    <TableHead className="px-4 py-3">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
                        Cargando candidatos...
                      </TableCell>
                    </TableRow>
                  ) : filteredCandidatos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
                        No hay candidatos disponibles.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCandidatos.map((candidato: any) => (
                      <TableRow key={candidato.id} className="hover:bg-gray-50">
                        <TableCell className="px-2 py-1">
                          <div className="flex flex-row gap-1 items-center">
                            <Can action="accion-editar-candidato">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleEdit(candidato)}
                                      aria-label="Editar candidato"
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
                            {candidato.activo ? (
                              <Can action="accion-inactivar-candidato">
                                <AlertDialog>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <AlertDialogTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            aria-label="Inactivar candidato"
                                            className="h-8 w-8"
                                          >
                                            <Lock className="h-4 w-4 text-yellow-600 hover:text-yellow-800 transition-colors" />
                                          </Button>
                                        </AlertDialogTrigger>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Inactivar</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>¿Inactivar candidato?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Esta acción inactivará el candidato y no podrá ser usado hasta que se reactive. ¿Estás seguro?
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDeactivate(candidato)}>
                                        Sí, inactivar
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </Can>
                            ) : (
                              <>
                                <Can action="accion-eliminar-candidato">
                                  <AlertDialog>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <AlertDialogTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              aria-label="Eliminar candidato"
                                              className="h-8 w-8"
                                            >
                                              <Trash2 className="h-4 w-4 text-rose-600 hover:text-rose-800 transition-colors" />
                                            </Button>
                                          </AlertDialogTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Eliminar</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>¿Eliminar candidato?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Esta acción eliminará el candidato de forma permanente. ¿Estás seguro?
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => confirmarEliminacion(candidato)}>
                                          Sí, eliminar
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </Can>
                                <AlertDialog>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <AlertDialogTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            aria-label="Activar candidato"
                                            className="h-8 w-8"
                                          >
                                            <CheckCircle className="h-4 w-4 text-brand-lime hover:text-brand-lime/80 transition-colors" />
                                          </Button>
                                        </AlertDialogTrigger>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Activar</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>¿Activar candidato?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Esta acción reactivará el candidato y estará disponible para su uso. ¿Estás seguro?
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleActivate(candidato)}>
                                        Sí, activar
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-900 font-medium">{candidato.numero_documento}</TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-900">
                          {`${candidato.primer_nombre} ${candidato.segundo_nombre || ''} ${candidato.primer_apellido} ${candidato.segundo_apellido || ''}`.trim()}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-500">{candidato.telefono || 'No registrado'}</TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-500">{candidato.email}</TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-500">{getEmpresaNombre(candidato.empresa_id)}</TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-500">{getCiudadNombre(candidato.ciudad_id)}</TableCell>
                        <TableCell className="px-4 py-3">
                          <Badge variant={candidato.activo ? "default" : "secondary"} className={candidato.activo ? "bg-brand-lime/10 text-brand-lime border-brand-lime/20" : "bg-gray-200 text-gray-600 border-gray-300"}>
                            {candidato.activo ? "Activo" : "Inactivo"}
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

        <TabsContent value="registro" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              {editingId ? 'Editar Candidato' : 'Registro de Nuevo Candidato'}
            </h2>
          </div>

          {/* Formulario de candidato en el tab de registro */}
          <Can action={editingId ? "accion-actualizar-candidato" : "accion-crear-candidato"}>
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-cyan-800">
                    <User className="h-5 w-5" />
                    <span>Información del Candidato</span>
                  </CardTitle>
                </CardHeader>
                             <CardContent>
                 {isSubmitting && (
                   <div className="mb-4 p-4 bg-cyan-50 border border-cyan-200 rounded-lg">
                     <div className="flex items-center space-x-3">
                       <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-600"></div>
                       <div>
                         <p className="text-sm font-medium text-cyan-800">
                           {editingId ? 'Actualizando candidato...' : 'Creando candidato...'}
                         </p>
                         <p className="text-xs text-cyan-600">Por favor espere, esto puede tomar unos segundos</p>
                       </div>
                     </div>
                   </div>
                 )}
                 
                 <div className="space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                         <div>
                       <label className="block text-sm font-medium mb-1">Tipo de Documento *</label>
                       <Select
                         value={formData.tipoDocumento || 'CC'}
                         onValueChange={(value) => setFormData({ ...formData, tipoDocumento: value })}
                         disabled={isSubmitting}
                       >
                         <SelectTrigger>
                           <SelectValue placeholder="Seleccionar tipo" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
                           <SelectItem value="CE">Cédula de Extranjería</SelectItem>
                           <SelectItem value="TI">Tarjeta de Identidad</SelectItem>
                           <SelectItem value="PP">Pasaporte</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>

                                         <div>
                       <label className="block text-sm font-medium mb-1">Número de Documento *</label>
                       <Input
                         value={formData.identificacion || ''}
                         onChange={(e) => setFormData({ ...formData, identificacion: e.target.value })}
                         placeholder="12345678"
                         disabled={isSubmitting}
                       />
                     </div>
                  </div>

                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                       <label className="block text-sm font-medium mb-1">Nombres *</label>
                       <Input
                         value={formData.nombre || ''}
                         onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                         placeholder="Ana María"
                         disabled={isSubmitting}
                       />
                     </div>

                     <div>
                       <label className="block text-sm font-medium mb-1">Apellidos *</label>
                       <Input
                         value={formData.apellido || ''}
                         onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                         placeholder="García López"
                         disabled={isSubmitting}
                       />
                     </div>
                   </div>

                                     <div>
                     <label className="block text-sm font-medium mb-1">Correo Electrónico *</label>
                     <Input
                       type="email"
                       value={formData.correo || ''}
                       onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                       placeholder="ana.garcia@ejemplo.com"
                       disabled={isSubmitting}
                     />
                   </div>

                                     <div>
                     <label className="block text-sm font-medium mb-1">Tipo de Candidato *</label>
                     <Select
                       value={formData.tipoCandidatoId?.toString() || ''}
                       onValueChange={(value) => setFormData({ ...formData, tipoCandidatoId: parseInt(value) })}
                       disabled={isSubmitting || loadingTipos}
                     >
                       <SelectTrigger>
                         <SelectValue placeholder={
                           loadingTipos 
                             ? "Cargando tipos de candidatos..." 
                             : "Seleccione el tipo de candidato"
                         } />
                       </SelectTrigger>
                       <SelectContent>
                         {loadingTipos ? (
                           <SelectItem value="" disabled>
                             Cargando...
                           </SelectItem>
                         ) : tiposCandidatosActivos.length === 0 ? (
                           <SelectItem value="" disabled>
                             No hay tipos disponibles
                           </SelectItem>
                         ) : (
                           tiposCandidatosActivos.map((tipo) => (
                             <SelectItem key={tipo.id} value={tipo.id.toString()}>
                               {tipo.nombre}
                             </SelectItem>
                           ))
                         )}
                       </SelectContent>
                     </Select>
                   </div>

                  <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-200">
                    <h3 className="font-medium text-cyan-800 mb-2">Información importante:</h3>
                    <ul className="text-sm text-cyan-700 space-y-1">
                      <li>• El usuario para iniciar sesión será el correo electrónico ingresado</li>
                      <li>• La contraseña inicial será el número de documento</li>
                      <li>• El candidato deberá cambiar la contraseña en su primer inicio de sesión</li>
                    </ul>
                  </div>

                                     <div className="flex justify-end space-x-4">
                     <Button 
                       variant="outline" 
                       onClick={handleSaved}
                       disabled={isSubmitting}
                     >
                       Cancelar
                     </Button>
                     <Button 
                       onClick={handleSubmit} 
                       className="bg-cyan-600 hover:bg-cyan-700" 
                       disabled={isSubmitting}
                     >
                       {isSubmitting ? (
                         <div className="flex items-center space-x-2">
                           <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                           <span>{editingId ? 'Actualizando...' : 'Creando candidato...'}</span>
                         </div>
                       ) : (
                         editingId ? 'Actualizar Candidato' : 'Crear Candidato'
                       )}
                     </Button>
                   </div>
                </div>
              </CardContent>
            </Card>
          </div>
          </Can>
        </TabsContent>
      </Tabs>

      {/* Modal de Documentos del Candidato */}
      <Dialog open={modalDocumentosOpen} onOpenChange={setModalDocumentosOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
                              <FileText className="h-5 w-5 text-cyan-600" />
              Documentos del Candidato
            </DialogTitle>
          </DialogHeader>
          
          {candidatoEncontrado && (
            <div className="space-y-6">
              {/* Información del candidato */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Información del Candidato</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Nombre Completo</p>
                      <p className="text-base">
                        {candidatoEncontrado.primer_nombre} {candidatoEncontrado.segundo_nombre || ''} {candidatoEncontrado.primer_apellido} {candidatoEncontrado.segundo_apellido || ''}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Cédula</p>
                      <p className="text-base">{candidatoEncontrado.numero_documento}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Email</p>
                      <p className="text-base">{candidatoEncontrado.email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Teléfono</p>
                      <p className="text-base">{candidatoEncontrado.telefono || 'No registrado'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Separator />

              {/* Lista de documentos */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Documentos Adjuntados</h3>
                  <Badge variant="outline" className="text-sm">
                    {documentosCandidato.length} documento{documentosCandidato.length !== 1 ? 's' : ''}
                  </Badge>
                </div>

                {documentosCandidato.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No hay documentos adjuntados</p>
                    <p className="text-sm text-gray-400 mt-1">El candidato aún no ha subido documentos</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {documentosCandidato.map((documento) => (
                      <Card key={documento.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <FileText className="h-4 w-4 text-cyan-600" />
                                <h4 className="font-medium text-sm">
                                  {getTipoDocumentoLabel(documento.tipo)}
                                </h4>
                              </div>
                              <p className="text-xs text-gray-600 mb-2">
                                {documento.nombre_archivo}
                              </p>
                              <p className="text-xs text-gray-500">
                                Subido: {new Date(documento.created_at).toLocaleDateString('es-ES')}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => descargarDocumento(documento)}
                                className="text-cyan-600 hover:text-cyan-700"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(documento.url_archivo, '_blank')}
                                className="text-brand-lime hover:text-brand-lime/80"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmación de Eliminación */}
      <Dialog open={modalConfirmacionOpen} onOpenChange={setModalConfirmacionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Confirmar Eliminación
            </DialogTitle>
          </DialogHeader>
          {candidatoAEliminar && (
            <div className="py-6">
              <div className="text-center mb-4">
                <p className="text-lg font-medium">¿Estás seguro de que quieres eliminar este candidato?</p>
                <p className="text-sm text-gray-600 mt-2">Esta acción no se puede deshacer.</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h4 className="font-medium text-sm text-gray-700 mb-2">Información del candidato:</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Nombre:</span> {candidatoAEliminar.primer_nombre} {candidatoAEliminar.primer_apellido}</p>
                  <p><span className="font-medium">Cédula:</span> {candidatoAEliminar.numero_documento}</p>
                  <p><span className="font-medium">Email:</span> {candidatoAEliminar.email}</p>
                  <p><span className="font-medium">Empresa:</span> {getEmpresaNombre(candidatoAEliminar.empresa_id)}</p>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setModalConfirmacionOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (candidatoAEliminar) {
                      deleteCandidatoMutation.mutate(candidatoAEliminar.id);
                      setModalConfirmacionOpen(false);
                      setCandidatoAEliminar(null);
                    }
                  }}
                  disabled={deleteCandidatoMutation.isPending}
                >
                  {deleteCandidatoMutation.isPending ? 'Eliminando...' : 'Eliminar Candidato'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CandidatosPage;
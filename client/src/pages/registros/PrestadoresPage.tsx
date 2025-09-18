
import { useState, useEffect } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { useApiData } from '@/hooks/useApiData';
import { 
  Briefcase, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Filter,
  Lock,
  CheckCircle,
  Building2,
  MapPin,
  Phone,
  Mail,
  ChevronsUpDown,
  Check
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { prestadoresService, Prestador } from '@/services/prestadoresService';
import { especialidadesService, Especialidad } from '@/services/especialidadesService';
import { sucursalesService, Sucursal } from '@/services/sucursalesService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { useLoading } from '@/contexts/LoadingContext';
import { useRegisterView } from '@/hooks/useRegisterView';
import { Can } from '@/contexts/PermissionsContext';

const PrestadoresPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { startLoading, stopLoading } = useLoading();
  const { addAction: addPrestadoresListado } = useRegisterView('Prestadores', 'listado', 'Listado de Prestadores');
  const { addAction: addPrestadoresForm } = useRegisterView('Prestadores', 'formulario', 'Registro de Prestador');

  // Registrar acciones para JSON de permisos
  useEffect(() => {
    // Listado
    addPrestadoresListado('editar', 'Editar Prestador');
    addPrestadoresListado('activar', 'Activar Prestador');
    addPrestadoresListado('inactivar', 'Inactivar Prestador');
    addPrestadoresListado('eliminar', 'Eliminar Prestador');
    addPrestadoresListado('exportar', 'Exportar');

    // Formulario
    addPrestadoresForm('crear', 'Crear Prestador');
    addPrestadoresForm('actualizar', 'Actualizar Prestador');
    addPrestadoresForm('cancelar', 'Cancelar');
  }, [addPrestadoresListado, addPrestadoresForm]);
  
  // Estados para tabs
  const [activeTab, setActiveTab] = useState("prestadores");
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [especialidadFilter, setEspecialidadFilter] = useState<string>("all");
  const [sucursalFilter, setSucursalFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("activos");
  
  // Estados para el formulario
  const [formData, setFormData] = useState<Partial<Prestador>>({
    identificacion: '',
    razon_social: '',
    especialidad_id: undefined,
    telefono: '',
    correo: '',
    direccion_laboratorio: '',
    nombre_laboratorio: '',
    contacto_laboratorio: '',
    sucursal_id: undefined,
    activo: true,
  });
  const [editingId, setEditingId] = useState<number | null>(null);

  // Estados para los popovers de selects
  const [openEspecialidad, setOpenEspecialidad] = useState(false);
  const [openSucursal, setOpenSucursal] = useState(false);

  // Query para prestadores
  const { data: prestadores = [], isLoading, refetch } = useQuery({
    queryKey: ['prestadores'],
    queryFn: async () => {
      startLoading();
      try {
        return await prestadoresService.getAll();
      } finally {
        stopLoading();
      }
    },
    staleTime: 0,
    refetchOnWindowFocus: false
  });

  // Query para especialidades
  const { data: especialidades = [] } = useQuery({
    queryKey: ['especialidades'],
    queryFn: async () => {
      startLoading();
      try {
        return await especialidadesService.getAll();
      } finally {
        stopLoading();
      }
    },
    staleTime: 0,
    refetchOnWindowFocus: false
  });

  // Query para sucursales
  const { data: sucursales = [] } = useQuery({
    queryKey: ['sucursales'],
    queryFn: async () => {
      startLoading();
      try {
        return await sucursalesService.getAll();
      } finally {
        stopLoading();
      }
    },
    staleTime: 0,
    refetchOnWindowFocus: false
  });

  // Mutations
  const createPrestadorMutation = useMutation({
    mutationFn: async (data: any) => {
      startLoading();
      try {
        return await prestadoresService.create(data);
      } finally {
        stopLoading();
      }
    },
    onSuccess: async () => { 
      await refetch(); 
      resetForm(); 
      setActiveTab("prestadores");
      toast({ title: 'Éxito', description: 'Prestador registrado correctamente' }); 
    },
    onError: (error: Error) => { toast({ title: 'Error', description: error.message, variant: 'destructive' }); },
  });

  const updatePrestadorMutation = useMutation({
    mutationFn: async ({ id, data }: any) => {
      startLoading();
      try {
        return await prestadoresService.update(id, data);
      } finally {
        stopLoading();
      }
    },
    onSuccess: async () => { 
      await refetch(); 
      resetForm(); 
      setActiveTab("prestadores");
      toast({ title: 'Éxito', description: 'Prestador actualizado correctamente' }); 
    },
    onError: (error: Error) => { toast({ title: 'Error', description: error.message, variant: 'destructive' }); },
  });

  const deletePrestadorMutation = useMutation({
    mutationFn: async (id: number) => {
      startLoading();
      try {
        return await prestadoresService.delete(id);
      } finally {
        stopLoading();
      }
    },
    onSuccess: async () => { await refetch(); toast({ title: 'Éxito', description: 'Prestador eliminado correctamente' }); },
    onError: (error: Error) => { toast({ title: 'Error', description: error.message, variant: 'destructive' }); },
  });

  const activatePrestadorMutation = useMutation({
    mutationFn: async (id: number) => {
      startLoading();
      try {
        return await prestadoresService.activate(id);
      } finally {
        stopLoading();
      }
    },
    onSuccess: async () => { await refetch(); toast({ title: 'Éxito', description: 'Prestador activado correctamente' }); },
    onError: (error: Error) => { toast({ title: 'Error', description: error.message, variant: 'destructive' }); },
  });

  const deactivatePrestadorMutation = useMutation({
    mutationFn: async (id: number) => {
      startLoading();
      try {
        return await prestadoresService.deactivate(id);
      } finally {
        stopLoading();
      }
    },
    onSuccess: async () => { await refetch(); toast({ title: 'Éxito', description: 'Prestador desactivado correctamente' }); },
    onError: (error: Error) => { toast({ title: 'Error', description: error.message, variant: 'destructive' }); },
  });

  const resetForm = () => {
    setFormData({
      identificacion: '',
      razon_social: '',
      especialidad_id: undefined,
      telefono: '',
      correo: '',
      direccion_laboratorio: '',
      nombre_laboratorio: '',
      contacto_laboratorio: '',
      sucursal_id: undefined,
      activo: true,
    });
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.identificacion || !formData.razon_social) {
      toast({ title: 'Error de validación', description: 'Por favor complete los campos requeridos', variant: 'destructive' });
      return;
    }
    
    const submitData = {
      identificacion: formData.identificacion,
      razon_social: formData.razon_social,
      especialidad_id: formData.especialidad_id,
      telefono: formData.telefono,
      correo: formData.correo,
      direccion_laboratorio: formData.direccion_laboratorio,
      nombre_laboratorio: formData.nombre_laboratorio,
      contacto_laboratorio: formData.contacto_laboratorio,
      sucursal_id: formData.sucursal_id,
      activo: true,
    };

    if (editingId) {
      updatePrestadorMutation.mutate({ id: editingId, data: submitData });
    } else {
      createPrestadorMutation.mutate(submitData);
    }
  };

  const handleEdit = (prestador: Prestador) => {
    setFormData({
      identificacion: prestador.identificacion,
      razon_social: prestador.razon_social,
      especialidad_id: prestador.especialidad_id,
      telefono: prestador.telefono,
      correo: prestador.correo,
      direccion_laboratorio: prestador.direccion_laboratorio,
      nombre_laboratorio: prestador.nombre_laboratorio,
      contacto_laboratorio: prestador.contacto_laboratorio,
      sucursal_id: prestador.sucursal_id,
      activo: prestador.activo,
    });
    setEditingId(prestador.id!);
    setActiveTab("registro");
  };

  const handleDelete = async (prestador: Prestador) => {
    if (!prestador.id) return;
    deletePrestadorMutation.mutate(prestador.id);
  };

  const handleActivate = async (prestador: Prestador) => {
    if (!prestador.id) return;
    activatePrestadorMutation.mutate(prestador.id);
  };

  const handleDeactivate = async (prestador: Prestador) => {
    if (!prestador.id) return;
    deactivatePrestadorMutation.mutate(prestador.id);
  };

  const handleNewPrestador = () => {
    resetForm();
    setActiveTab("registro");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Filtrar prestadores
  const filteredPrestadores = prestadores
    .filter(prestador => {
      const matchesSearch = 
        prestador.identificacion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prestador.razon_social?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prestador.especialidad_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prestador.nombre_laboratorio?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesEspecialidad = especialidadFilter === "all" || 
        prestador.especialidad_id?.toString() === especialidadFilter;

      const matchesSucursal = sucursalFilter === "all" || 
        prestador.sucursal_id?.toString() === sucursalFilter;

      const matchesStatus = 
        (statusFilter === "activos" && prestador.activo) ||
        (statusFilter === "inactivos" && !prestador.activo) ||
        statusFilter === "todos";

      return matchesSearch && matchesEspecialidad && matchesSucursal && matchesStatus;
    })
    .sort((a, b) => {
      // Mostrar prestadores activos primero
      if (a.activo !== b.activo) {
        return a.activo ? -1 : 1;
      }
      // Luego ordenar por nombre
      return (a.razon_social || "").localeCompare(b.razon_social || "");
    });

  // Obtener nombre de especialidad seleccionada
  const getEspecialidadName = (id?: number) => {
    if (!id) return "";
    const especialidad = especialidades.find(e => e.id === id);
    return especialidad?.nombre || "";
  };

  // Obtener nombre de sucursal seleccionada
  const getSucursalName = (id?: number) => {
    if (!id) return "";
    const sucursal = sucursales.find(s => s.id === id);
    return sucursal?.nombre || "";
  };

  return (
    <div className="p-4 max-w-full mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-extrabold text-cyan-800 flex items-center gap-2 mb-2">
          <Briefcase className="w-8 h-8 text-cyan-600" />
          Gestión de Prestadores
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-cyan-100/60 p-1 rounded-lg">
          <TabsTrigger
            value="prestadores"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
          >
            Listado de Prestadores
          </TabsTrigger>
          <TabsTrigger
            value="registro"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
          >
            Registro de Prestador
          </TabsTrigger>
        </TabsList>

        <TabsContent value="prestadores" className="mt-6">
          {/* Header similar al diseño de empresas */}
          <div className="bg-white rounded-lg border">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-orange-600" />
                </div>
                <span className="text-lg font-semibold text-gray-700">PRESTADORES</span>
              </div>
                             <div className="flex space-x-2">
                 <TooltipProvider>
                   <Tooltip>
                     <TooltipTrigger asChild>
                       <Can action="accion-crear-prestador">
                         <Button
                           onClick={handleNewPrestador}
                           className="bg-teal-400 hover:bg-teal-500 text-white text-xs px-3 py-1"
                           size="sm"
                         >
                           Adicionar Registro
                         </Button>
                       </Can>
                     </TooltipTrigger>
                     <TooltipContent>
                       <p>Crear un nuevo prestador</p>
                     </TooltipContent>
                   </Tooltip>
                 </TooltipProvider>
               </div>
            </div>

            {/* Filtros */}
            <div className="p-4 border-b bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                 <TooltipProvider>
                   <Tooltip>
                     <TooltipTrigger asChild>
                       <div className="relative">
                         <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                         <Input
                           placeholder="Buscar por identificación, nombre..."
                           value={searchTerm}
                           onChange={(e) => setSearchTerm(e.target.value)}
                           className="pl-10"
                         />
                       </div>
                     </TooltipTrigger>
                     <TooltipContent>
                       <p>Buscar prestadores por identificación, razón social, especialidad o laboratorio</p>
                     </TooltipContent>
                   </Tooltip>
                 </TooltipProvider>

                                 <TooltipProvider>
                   <Tooltip>
                     <TooltipTrigger asChild>
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
                     </TooltipTrigger>
                     <TooltipContent>
                       <p>Filtrar prestadores por estado</p>
                     </TooltipContent>
                   </Tooltip>
                 </TooltipProvider>

                                 <TooltipProvider>
                   <Tooltip>
                     <TooltipTrigger asChild>
                       <Select value={sucursalFilter} onValueChange={setSucursalFilter}>
                         <SelectTrigger>
                           <SelectValue placeholder="Filtrar por sucursal" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="all">Todas las sucursales</SelectItem>
                           {sucursales.map(sucursal => (
                             <SelectItem key={sucursal.id} value={sucursal.id.toString()}>
                               {sucursal.nombre}
                             </SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                     </TooltipTrigger>
                     <TooltipContent>
                       <p>Filtrar prestadores por sucursal</p>
                     </TooltipContent>
                   </Tooltip>
                 </TooltipProvider>

                                 <TooltipProvider>
                   <Tooltip>
                     <TooltipTrigger asChild>
                       <Button
                         variant="outline"
                         onClick={() => {
                           setSearchTerm("");
                           setStatusFilter("activos");
                           setEspecialidadFilter("all");
                           setSucursalFilter("all");
                         }}
                         className="flex items-center gap-2"
                       >
                         <Filter className="w-4 h-4" />
                         Limpiar filtros
                       </Button>
                     </TooltipTrigger>
                     <TooltipContent>
                       <p>Limpiar todos los filtros aplicados</p>
                     </TooltipContent>
                   </Tooltip>
                 </TooltipProvider>
              </div>
            </div>

            {/* Tabla de prestadores */}
            <div className="overflow-x-auto rounded-lg shadow-sm">
              <Table className="min-w-[800px] w-full text-xs">
                <TableHeader className="bg-cyan-50">
                  <TableRow className="text-left font-semibold text-gray-700">
                    <TableHead className="px-2 py-1 text-teal-600">Acciones</TableHead>
                    <TableHead className="px-4 py-3">Identificación</TableHead>
                    <TableHead className="px-4 py-3">Razón Social</TableHead>
                    <TableHead className="px-4 py-3">Especialidad</TableHead>
                    <TableHead className="px-4 py-3">Laboratorio</TableHead>
                    <TableHead className="px-4 py-3">Sucursal</TableHead>
                    <TableHead className="px-4 py-3">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        Cargando prestadores...
                      </TableCell>
                    </TableRow>
                  ) : filteredPrestadores.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        No hay prestadores disponibles.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPrestadores.map((prestador) => (
                      <TableRow key={prestador.id} className="hover:bg-gray-50">
                        <TableCell className="px-2 py-1">
                          <div className="flex flex-row gap-1 items-center">
                               <Can action="accion-editar-prestador">
                                 <TooltipProvider>
                                   <Tooltip>
                                     <TooltipTrigger asChild>
                                       <Button
                                         variant="ghost"
                                         size="icon"
                                         onClick={() => handleEdit(prestador)}
                                         aria-label="Editar prestador"
                                         className="h-8 w-8"
                                       >
                                         <Edit className="h-4 w-4 text-cyan-600 hover:text-cyan-800 transition-colors" />
                                       </Button>
                                     </TooltipTrigger>
                                     <TooltipContent>
                                       <p>Editar prestador</p>
                                     </TooltipContent>
                                   </Tooltip>
                                 </TooltipProvider>
                               </Can>
                               {prestador.activo ? (
                                 <Can action="accion-inactivar-prestador">
                                   <TooltipProvider>
                                     <Tooltip>
                                       <TooltipTrigger asChild>
                                         <AlertDialog>
                                           <AlertDialogTrigger asChild>
                                             <Button
                                               variant="ghost"
                                               size="icon"
                                               aria-label="Inactivar prestador"
                                               className="h-8 w-8"
                                               onClick={() => handleDeactivate(prestador)}
                                             >
                                               <Lock className="h-4 w-4 text-yellow-600 hover:text-yellow-800 transition-colors" />
                                             </Button>
                                           </AlertDialogTrigger>
                                           <AlertDialogContent>
                                             <AlertDialogHeader>
                                               <AlertDialogTitle>¿Inactivar prestador?</AlertDialogTitle>
                                               <AlertDialogDescription>
                                                 Esta acción inactivará el prestador y no podrá ser usado hasta que se reactive. ¿Estás seguro?
                                               </AlertDialogDescription>
                                             </AlertDialogHeader>
                                             <AlertDialogFooter>
                                               <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                               <AlertDialogAction onClick={() => handleDeactivate(prestador)}>
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
                                   <Can action="accion-eliminar-prestador">
                                     <TooltipProvider>
                                       <Tooltip>
                                         <TooltipTrigger asChild>
                                           <AlertDialog>
                                             <AlertDialogTrigger asChild>
                                               <Button
                                                 variant="ghost"
                                                 size="icon"
                                                 aria-label="Eliminar prestador"
                                                 className="h-8 w-8"
                                                 onClick={() => handleDelete(prestador)}
                                               >
                                                 <Trash2 className="h-4 w-4 text-rose-600 hover:text-rose-800 transition-colors" />
                                               </Button>
                                             </AlertDialogTrigger>
                                             <AlertDialogContent>
                                               <AlertDialogHeader>
                                                 <AlertDialogTitle>¿Eliminar prestador?</AlertDialogTitle>
                                                 <AlertDialogDescription>
                                                   Esta acción eliminará el prestador de forma permanente. ¿Estás seguro?
                                                 </AlertDialogDescription>
                                               </AlertDialogHeader>
                                               <AlertDialogFooter>
                                                 <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                 <AlertDialogAction onClick={() => handleDelete(prestador)}>
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
                                   <Can action="accion-activar-prestador">
                                     <TooltipProvider>
                                       <Tooltip>
                                         <TooltipTrigger asChild>
                                           <AlertDialog>
                                             <AlertDialogTrigger asChild>
                                               <Button
                                                 variant="ghost"
                                                 size="icon"
                                                 aria-label="Activar prestador"
                                                 className="h-8 w-8"
                                                 onClick={() => handleActivate(prestador)}
                                               >
                                                 <CheckCircle className="h-4 w-4 text-brand-lime hover:text-brand-lime/80 transition-colors" />
                                               </Button>
                                             </AlertDialogTrigger>
                                             <AlertDialogContent>
                                               <AlertDialogHeader>
                                                 <AlertDialogTitle>¿Activar prestador?</AlertDialogTitle>
                                                 <AlertDialogDescription>
                                                   Esta acción reactivará el prestador y estará disponible para su uso. ¿Estás seguro?
                                                 </AlertDialogDescription>
                                               </AlertDialogHeader>
                                               <AlertDialogFooter>
                                                 <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                 <AlertDialogAction onClick={() => handleActivate(prestador)}>
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
                        <TableCell className="px-4 py-3 text-sm text-gray-900">{prestador.identificacion}</TableCell>
                                                 <TableCell className="px-4 py-3 text-sm text-gray-900">{prestador.razon_social}</TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-500">{prestador.especialidad_nombre || prestador.especialidad || 'N/A'}</TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-500">{prestador.nombre_laboratorio || 'N/A'}</TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-500">{prestador.sucursal_nombre || 'N/A'}</TableCell>
                        <TableCell className="px-4 py-3">
                          <Badge variant={prestador.activo ? "default" : "secondary"} className={prestador.activo ? "bg-brand-lime/10 text-brand-lime border-brand-lime/20" : "bg-gray-200 text-gray-600 border-gray-300"}>
                            {prestador.activo ? "Activo" : "Inactivo"}
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
              {editingId ? 'Editar Prestador' : 'Registro de Nuevo Prestador'}
            </h2>
          </div>

          {/* Formulario de prestador en el tab de registro */}
          <Can action={editingId ? "accion-actualizar-prestador" : "accion-crear-prestador"}>
            <Card>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-3">
                                 {/* Sección 1: Información Personal */}
                 <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                   <div className="flex items-center gap-2 pb-2 border-b">
                     <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                     <h3 className="text-lg font-semibold text-gray-800">Información Personal</h3>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="identificacion" className="text-sm">Identificación *</Label>
                                             <Input
                         id="identificacion"
                         name="identificacion"
                         value={formData.identificacion}
                         onChange={handleInputChange}
                         required
                         className="h-9"
                       />
                    </div>
                    
                    <div className="space-y-2">
                                             <Label htmlFor="razon_social" className="text-sm">Razón Social *</Label>
                       <Input
                         id="razon_social"
                         name="razon_social"
                         value={formData.razon_social}
                         onChange={handleInputChange}
                         required
                         className="h-9"
                       />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="telefono" className="text-sm">Teléfono</Label>
                                             <Input
                         id="telefono"
                         name="telefono"
                         value={formData.telefono}
                         onChange={handleInputChange}
                         className="h-9"
                       />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="correo" className="text-sm">Correo Electrónico</Label>
                                             <Input
                         id="correo"
                         name="correo"
                         type="email"
                         value={formData.correo}
                         onChange={handleInputChange}
                         className="h-9"
                       />
                    </div>
                  </div>
                </div>

                                 {/* Sección 2: Información Profesional */}
                 <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                   <div className="flex items-center gap-2 pb-2 border-b">
                     <div className="w-2 h-2 bg-brand-lime rounded-full"></div>
                     <h3 className="text-lg font-semibold text-gray-800">Información Profesional</h3>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Especialidad</Label>
                      <Popover open={openEspecialidad} onOpenChange={setOpenEspecialidad}>
                        <PopoverTrigger asChild>
                                                     <Button
                             variant="outline"
                             role="combobox"
                             aria-expanded={openEspecialidad}
                             className="w-full justify-between h-9 font-normal"
                           >
                             {formData.especialidad_id ? getEspecialidadName(formData.especialidad_id) : "Seleccionar especialidad..."}
                             <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                           </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Buscar especialidad..." />
                            <CommandList>
                              <CommandEmpty>No se encontró especialidad.</CommandEmpty>
                              <CommandGroup>
                                {especialidades.map((especialidad) => (
                                  <CommandItem
                                    key={especialidad.id}
                                    value={especialidad.nombre}
                                    onSelect={() => {
                                      setFormData(prev => ({ 
                                        ...prev, 
                                        especialidad_id: especialidad.id 
                                      }));
                                      setOpenEspecialidad(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        formData.especialidad_id === especialidad.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {especialidad.nombre}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm">Sucursal</Label>
                      <Popover open={openSucursal} onOpenChange={setOpenSucursal}>
                        <PopoverTrigger asChild>
                                                     <Button
                             variant="outline"
                             role="combobox"
                             aria-expanded={openSucursal}
                             className="w-full justify-between h-9 font-normal"
                           >
                             {formData.sucursal_id ? getSucursalName(formData.sucursal_id) : "Seleccionar sucursal..."}
                             <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                           </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Buscar sucursal..." />
                            <CommandList>
                              <CommandEmpty>No se encontró sucursal.</CommandEmpty>
                              <CommandGroup>
                                {sucursales.map(sucursal => (
                                  <CommandItem
                                    key={sucursal.id}
                                    value={sucursal.nombre}
                                    onSelect={() => {
                                      setFormData(prev => ({ 
                                        ...prev, 
                                        sucursal_id: sucursal.id 
                                      }));
                                      setOpenSucursal(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        formData.sucursal_id === sucursal.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {sucursal.nombre}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>

                                 {/* Sección 3: Información del Laboratorio */}
                 <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                   <div className="flex items-center gap-2 pb-2 border-b">
                     <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                     <h3 className="text-lg font-semibold text-gray-800">Información del Laboratorio</h3>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nombre_laboratorio" className="text-sm">Nombre del Laboratorio</Label>
                                             <Input
                         id="nombre_laboratorio"
                         name="nombre_laboratorio"
                         value={formData.nombre_laboratorio}
                         onChange={handleInputChange}
                         className="h-9"
                       />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="contacto_laboratorio" className="text-sm">Contacto del Laboratorio</Label>
                                             <Input
                         id="contacto_laboratorio"
                         name="contacto_laboratorio"
                         value={formData.contacto_laboratorio}
                         onChange={handleInputChange}
                         className="h-9"
                       />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="direccion_laboratorio" className="text-sm">Dirección del Laboratorio</Label>
                                             <Input
                         id="direccion_laboratorio"
                         name="direccion_laboratorio"
                         value={formData.direccion_laboratorio}
                         onChange={handleInputChange}
                         className="h-9"
                       />
                    </div>
                  </div>
                </div>

                                 {/* Botones de acción */}
                 <div className="flex justify-end space-x-2 pt-4 border-t">
                   <TooltipProvider>
                     <Tooltip>
                       <TooltipTrigger asChild>
                         <Button type="button" variant="outline" onClick={() => setActiveTab("prestadores")}>
                           Cancelar
                         </Button>
                       </TooltipTrigger>
                       <TooltipContent>
                         <p>Cancelar y volver al listado</p>
                       </TooltipContent>
                     </Tooltip>
                   </TooltipProvider>
                   <TooltipProvider>
                     <Tooltip>
                       <TooltipTrigger asChild>
                         <Button type="submit">
                           {editingId ? "Actualizar" : "Guardar"}
                         </Button>
                       </TooltipTrigger>
                       <TooltipContent>
                         <p>{editingId ? "Actualizar prestador" : "Guardar nuevo prestador"}</p>
                       </TooltipContent>
                     </Tooltip>
                   </TooltipProvider>
                 </div>
                </form>
              </CardContent>
            </Card>
          </Can>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PrestadoresPage;

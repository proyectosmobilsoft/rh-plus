import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from 'sonner';
import { 
  Plus, 
  Target, 
  Loader2, 
  Edit, 
  Trash2,
  Search,
  Filter,
  Building2,
  MapPin,
  CheckCircle,
  XCircle,
  Lock
} from "lucide-react";
import { 
  centrosCostoService,
  CentroCosto,
  CreateCentroCostoData
} from "@/services/centrosCostoService";
import { sucursalesService, Sucursal } from "@/services/sucursalesService";
import { useLoading } from '@/contexts/LoadingContext';
import { useRegisterView } from '@/hooks/useRegisterView';
import { Can } from '@/contexts/PermissionsContext';

export default function CentrosCostoPage() {
  const [centrosCosto, setCentrosCosto] = useState<CentroCosto[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("listado");
  
  // Estados para modales
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingCentroCosto, setEditingCentroCosto] = useState<CentroCosto | null>(null);
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [sucursalFilter, setSucursalFilter] = useState<string>("all");

  const { startLoading, stopLoading } = useLoading();
  const { addAction: addCentrosCostoListado } = useRegisterView('Centros de Costos', 'listado', 'Listado de Centros de Costos');
  const { addAction: addCentrosCostoForm } = useRegisterView('Centros de Costos', 'formulario', 'Registro de Centro de Costo');

  // Registrar acciones para JSON de permisos
  useEffect(() => {
    // Listado
    addCentrosCostoListado('editar', 'Editar Centro de Costo');
    addCentrosCostoListado('activar', 'Activar Centro de Costo');
    addCentrosCostoListado('inactivar', 'Inactivar Centro de Costo');
    addCentrosCostoListado('eliminar', 'Eliminar Centro de Costo');
    addCentrosCostoListado('exportar', 'Exportar');

    // Formulario
    addCentrosCostoForm('crear', 'Crear Centro de Costo');
    addCentrosCostoForm('actualizar', 'Actualizar Centro de Costo');
    addCentrosCostoForm('cancelar', 'Cancelar');
  }, [addCentrosCostoListado, addCentrosCostoForm]);

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [centrosCostoData, sucursalesData] = await Promise.all([
        centrosCostoService.getAllIncludingInactive(),
        sucursalesService.getAllIncludingInactive()
      ]);

      setCentrosCosto(centrosCostoData);
      setSucursales(sucursalesData);
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar los datos de centros de costo');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar centros de costo
  const filteredCentrosCosto = centrosCosto
    .filter(centro => {
             const matchesSearch =
         centro.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         centro.codigo?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" ? true :
        statusFilter === "active" ? centro.activo : !centro.activo;

             const matchesSucursal = sucursalFilter === "all" ? true :
         sucursalFilter === "0" ? !centro.sucursal_id :
         centro.sucursal_id?.toString() === sucursalFilter;

             return matchesSearch && matchesStatus && matchesSucursal;
    })
    .sort((a, b) => {
      // Mostrar activos primero
      if (a.activo !== b.activo) {
        return a.activo ? -1 : 1;
      }
      // Luego ordenar por nombre
      return (a.nombre || "").localeCompare(b.nombre || "");
    });

  const handleEdit = (centro: CentroCosto) => {
    setEditingCentroCosto(centro);
    setActiveTab("formulario");
  };

  const handleDelete = async (centro: CentroCosto) => {
    if (!centro.id) return;

    try {
      startLoading();
      const success = await centrosCostoService.delete(centro.id);
      if (success) {
        toast.success('Centro de costo eliminado correctamente');
        await cargarDatos();
      } else {
        toast.error('No se pudo eliminar el centro de costo');
      }
    } catch (error) {
      toast.error('Error al eliminar el centro de costo');
    } finally {
      stopLoading();
    }
  };

  const handleActivate = async (centro: CentroCosto) => {
    if (!centro.id) return;

    try {
      startLoading();
      const success = await centrosCostoService.activate(centro.id);
      if (success) {
        toast.success('Centro de costo activado correctamente');
        await cargarDatos();
      } else {
        toast.error('No se pudo activar el centro de costo');
      }
    } catch (error) {
      toast.error('Error al activar el centro de costo');
    } finally {
      stopLoading();
    }
  };

  const handleDeactivate = async (centro: CentroCosto) => {
    if (!centro.id) return;

    try {
      startLoading();
      const success = await centrosCostoService.deactivate(centro.id);
      if (success) {
        toast.success('Centro de costo inactivado correctamente');
        await cargarDatos();
      } else {
        toast.error('No se pudo inactivar el centro de costo');
      }
    } catch (error) {
      toast.error('Error al inactivar el centro de costo');
    } finally {
      stopLoading();
    }
  };

  const handleSaved = () => {
    setActiveTab("listado");
    setEditingCentroCosto(null);
    cargarDatos();
  };

  const handleNewCentroCosto = () => {
    setEditingCentroCosto(null);
    setActiveTab("formulario");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Cargando centros de costo...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-full mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-extrabold text-cyan-800 flex items-center gap-2 mb-2">
          <Target className="w-8 h-8 text-cyan-600" />
          Gestión de Centros de Costos
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-cyan-100/60 p-1 rounded-lg">
          <TabsTrigger
            value="listado"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
          >
            Listado de Centros de Costos
          </TabsTrigger>
          <TabsTrigger
            value="formulario"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
          >
            Registro de Centro de Costo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="listado" className="mt-6">
          {/* Header similar al diseño de perfiles */}
          <div className="bg-white rounded-lg border">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                  <Target className="w-5 h-5 text-orange-600" />
                </div>
                <span className="text-lg font-semibold text-gray-700">CENTROS DE COSTOS</span>
              </div>
              <div className="flex space-x-2">
                <Can action="accion-crear-centro-costo">
                  <Button
                    onClick={handleNewCentroCosto}
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

                                 <Select value={sucursalFilter} onValueChange={setSucursalFilter}>
                   <SelectTrigger>
                     <SelectValue placeholder="Filtrar por sucursal" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="all">Todas las sucursales</SelectItem>
                     <SelectItem value="0">Sin sucursal</SelectItem>
                     {sucursales.map(sucursal => (
                       <SelectItem key={sucursal.id} value={sucursal.id.toString()}>
                         {sucursal.nombre}
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>

                                 <Button
                   variant="outline"
                   onClick={() => {
                     setSearchTerm("");
                     setStatusFilter("active");
                     setSucursalFilter("all");
                   }}
                   className="flex items-center gap-2"
                 >
                   <Filter className="w-4 h-4" />
                   Limpiar filtros
                 </Button>
              </div>
            </div>

                         {/* Tabla de centros de costo */}
             <div className="overflow-x-auto rounded-lg shadow-sm">
               <Table className="min-w-[800px] w-full text-xs">
                 <TableHeader className="bg-cyan-50">
                   <TableRow className="text-left font-semibold text-gray-700">
                     <TableHead className="px-2 py-1 text-teal-600">Acciones</TableHead>
                     <TableHead className="px-4 py-3">Código</TableHead>
                     <TableHead className="px-4 py-3">Nombre</TableHead>
                     <TableHead className="px-4 py-3">Sucursal</TableHead>
                     <TableHead className="px-4 py-3">Área de Negocios</TableHead>
                     <TableHead className="px-4 py-3">Porcentaje</TableHead>
                     <TableHead className="px-4 py-3">Estado</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {loading ? (
                     <TableRow>
                       <TableCell colSpan={7} className="h-24 text-center">
                         Cargando centros de costo...
                       </TableCell>
                     </TableRow>
                   ) : filteredCentrosCosto.length === 0 ? (
                     <TableRow>
                       <TableCell colSpan={7} className="h-24 text-center">
                         No hay centros de costo disponibles.
                       </TableCell>
                     </TableRow>
                   ) : (
                     filteredCentrosCosto.map((centro) => (
                       <TableRow key={centro.id} className="hover:bg-gray-50">
                         <TableCell className="px-2 py-1">
                           <div className="flex flex-row gap-1 items-center">
                             <Can action="accion-editar-centro-costo">
                               <TooltipProvider>
                                 <Tooltip>
                                   <TooltipTrigger asChild>
                                     <Button
                                       variant="ghost"
                                       size="icon"
                                       onClick={() => handleEdit(centro)}
                                       aria-label="Editar centro de costo"
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
                             {centro.activo ? (
                               <Can action="accion-inactivar-centro-costo">
                                 <TooltipProvider>
                                   <Tooltip>
                                     <TooltipTrigger asChild>
                                       <AlertDialog>
                                         <AlertDialogTrigger asChild>
                                           <Button
                                             variant="ghost"
                                             size="icon"
                                             aria-label="Inactivar centro de costo"
                                             className="h-8 w-8"
                                           >
                                             <Lock className="h-4 w-4 text-yellow-600 hover:text-yellow-800 transition-colors" />
                                           </Button>
                                         </AlertDialogTrigger>
                                         <AlertDialogContent>
                                           <AlertDialogHeader>
                                             <AlertDialogTitle>¿Inactivar centro de costo?</AlertDialogTitle>
                                             <AlertDialogDescription>
                                               Esta acción inactivará el centro de costo y no podrá ser usado hasta que se reactive. ¿Estás seguro?
                                             </AlertDialogDescription>
                                           </AlertDialogHeader>
                                           <AlertDialogFooter>
                                             <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                             <AlertDialogAction onClick={() => handleDeactivate(centro)}>
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
                                 <Can action="accion-eliminar-centro-costo">
                                   <TooltipProvider>
                                     <Tooltip>
                                       <TooltipTrigger asChild>
                                         <AlertDialog>
                                           <AlertDialogTrigger asChild>
                                             <Button
                                               variant="ghost"
                                               size="icon"
                                               aria-label="Eliminar centro de costo"
                                               className="h-8 w-8"
                                             >
                                               <Trash2 className="h-4 w-4 text-rose-600 hover:text-rose-800 transition-colors" />
                                             </Button>
                                           </AlertDialogTrigger>
                                           <AlertDialogContent>
                                             <AlertDialogHeader>
                                               <AlertDialogTitle>¿Eliminar centro de costo?</AlertDialogTitle>
                                               <AlertDialogDescription>
                                                 Esta acción eliminará el centro de costo de forma permanente. ¿Estás seguro?
                                               </AlertDialogDescription>
                                             </AlertDialogHeader>
                                             <AlertDialogFooter>
                                               <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                               <AlertDialogAction onClick={() => handleDelete(centro)}>
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
                                 <Can action="accion-activar-centro-costo">
                                   <TooltipProvider>
                                     <Tooltip>
                                       <TooltipTrigger asChild>
                                         <AlertDialog>
                                           <AlertDialogTrigger asChild>
                                             <Button
                                               variant="ghost"
                                               size="icon"
                                               aria-label="Activar centro de costo"
                                               className="h-8 w-8"
                                             >
                                               <CheckCircle className="h-4 w-4 text-green-600 hover:text-green-800 transition-colors" />
                                             </Button>
                                           </AlertDialogTrigger>
                                           <AlertDialogContent>
                                             <AlertDialogHeader>
                                               <AlertDialogTitle>¿Activar centro de costo?</AlertDialogTitle>
                                               <AlertDialogDescription>
                                                 Esta acción reactivará el centro de costo y estará disponible para su uso. ¿Estás seguro?
                                               </AlertDialogDescription>
                                             </AlertDialogHeader>
                                             <AlertDialogFooter>
                                               <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                               <AlertDialogAction onClick={() => handleActivate(centro)}>
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
                         <TableCell className="px-4 py-3 text-sm text-gray-900">{centro.codigo}</TableCell>
                         <TableCell className="px-4 py-3 text-sm text-gray-900 font-medium">{centro.nombre}</TableCell>
                         <TableCell className="px-4 py-3 text-sm text-gray-500">
                           {centro.sucursal ? (
                             <div className="flex items-center gap-2">
                               <Building2 className="w-4 h-4 text-gray-400" />
                               <span>{centro.sucursal.nombre}</span>
                               {centro.sucursal.codigo && (
                                 <span className="text-xs text-gray-400">({centro.sucursal.codigo})</span>
                               )}
                             </div>
                           ) : (
                             <span className="text-gray-400">Sin sucursal</span>
                           )}
                         </TableCell>
                         <TableCell className="px-4 py-3 text-sm text-gray-500">
                           {centro.area_negocio ? (
                             <span className="text-gray-700">{centro.area_negocio}</span>
                           ) : (
                             <span className="text-gray-400">Sin área</span>
                           )}
                         </TableCell>
                         <TableCell className="px-4 py-3 text-sm text-gray-500">
                           {centro.porcentaje_estructura ? (
                             <span className="text-gray-700 font-medium">{centro.porcentaje_estructura.toFixed(2)}%</span>
                           ) : (
                             <span className="text-gray-400">Sin porcentaje</span>
                           )}
                         </TableCell>
                         <TableCell className="px-4 py-3">
                           <Badge variant={centro.activo ? "default" : "secondary"} className={centro.activo ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-200 text-gray-600 border-gray-300"}>
                             {centro.activo ? "Activo" : "Inactivo"}
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
                   <CentroCostoForm
           editingCentroCosto={editingCentroCosto}
           onSaved={handleSaved}
           sucursales={sucursales}
         />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Componente del formulario
interface CentroCostoFormProps {
  editingCentroCosto: CentroCosto | null;
  onSaved: () => void;
  sucursales: Sucursal[];
}

function CentroCostoForm({ editingCentroCosto, onSaved, sucursales }: CentroCostoFormProps) {
  const [formData, setFormData] = useState<CreateCentroCostoData>({
    codigo: '',
    nombre: '',
    sucursal_id: undefined,
    area_negocio: undefined,
    porcentaje_estructura: undefined,
    activo: true
  });
  const [loading, setLoading] = useState(false);
  const { startLoading, stopLoading } = useLoading();

  useEffect(() => {
    if (editingCentroCosto) {
             setFormData({
         codigo: editingCentroCosto.codigo,
         nombre: editingCentroCosto.nombre,
         sucursal_id: editingCentroCosto.sucursal_id,
         area_negocio: editingCentroCosto.area_negocio || '',
         porcentaje_estructura: editingCentroCosto.porcentaje_estructura,
         activo: editingCentroCosto.activo
       });
         } else {
              setFormData({
         codigo: '',
         nombre: '',
         sucursal_id: undefined,
         area_negocio: undefined,
         porcentaje_estructura: undefined,
         activo: true
       });
     }
  }, [editingCentroCosto]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.codigo || !formData.nombre) {
      toast.error('Por favor complete todos los campos obligatorios');
      return;
    }

    try {
      startLoading();
      setLoading(true);

      if (editingCentroCosto) {
        await centrosCostoService.update(editingCentroCosto.id, formData);
        toast.success('Centro de costo actualizado correctamente');
      } else {
        await centrosCostoService.create(formData);
        toast.success('Centro de costo creado correctamente');
      }

      onSaved();
    } catch (error) {
      console.error('Error guardando centro de costo:', error);
      toast.error('Error al guardar el centro de costo');
    } finally {
      stopLoading();
      setLoading(false);
    }
  };



  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          {editingCentroCosto ? 'Editar Centro de Costo' : 'Nuevo Centro de Costo'}
        </CardTitle>
        <CardDescription>
          {editingCentroCosto 
            ? 'Modifica la información del centro de costo'
            : 'Complete la información para crear un nuevo centro de costo'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código *</Label>
              <Input
                id="codigo"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                placeholder="Ingrese el código"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ingrese el nombre"
                required
              />
            </div>

                         <div className="space-y-2">
               <Label htmlFor="sucursal_id">Sucursal</Label>
               <Select
                 value={formData.sucursal_id?.toString() || '0'}
                 onValueChange={(value) => setFormData({ ...formData, sucursal_id: value === '0' ? undefined : parseInt(value) })}
               >
                 <SelectTrigger>
                   <SelectValue placeholder="Seleccione una sucursal" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="0">Sin sucursal</SelectItem>
                   {sucursales.map(sucursal => (
                     <SelectItem key={sucursal.id} value={sucursal.id.toString()}>
                       {sucursal.nombre}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>

                           <div className="space-y-2">
                <Label htmlFor="area_negocio">Área de Negocios</Label>
                <Select
                  value={formData.area_negocio || '0'}
                  onValueChange={(value) => setFormData({ ...formData, area_negocio: value === '0' ? undefined : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione área de negocio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Sin área de negocio</SelectItem>
                    <SelectItem value="Administración">Administración</SelectItem>
                    <SelectItem value="Comercial">Comercial</SelectItem>
                    <SelectItem value="Finanzas">Finanzas</SelectItem>
                    <SelectItem value="Recursos Humanos">Recursos Humanos</SelectItem>
                    <SelectItem value="Tecnología">Tecnología</SelectItem>
                    <SelectItem value="Operaciones">Operaciones</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Logística">Logística</SelectItem>
                    <SelectItem value="Calidad">Calidad</SelectItem>
                    <SelectItem value="Seguridad">Seguridad</SelectItem>
                    <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                  </SelectContent>
                </Select>
              </div>

             <div className="space-y-2">
               <Label htmlFor="porcentaje_estructura">Porcentaje de Estructura (%)</Label>
               <Input
                 id="porcentaje_estructura"
                 type="number"
                 min="0"
                 max="100"
                 step="0.01"
                 value={formData.porcentaje_estructura || ''}
                 onChange={(e) => setFormData({ ...formData, porcentaje_estructura: e.target.value ? parseFloat(e.target.value) : undefined })}
                 placeholder="0.00"
               />
             </div>

            
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onSaved()}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  {editingCentroCosto ? 'Actualizar' : 'Crear'}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

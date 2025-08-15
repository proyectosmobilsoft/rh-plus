import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Download,
  Globe,
  MapPin,
  Building2,
  Eye,
  CheckCircle,
  Lock,
  Users,
  Settings,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
import { ubicacionesService, Pais, Departamento, Ciudad } from '@/services/ubicacionesService';
import { setupUbicaciones } from '@/services/setupUbicaciones';
import { useLoading } from '@/contexts/LoadingContext';
import { PaisForm } from '@/components/ubicaciones/PaisForm';
import { DepartamentoForm } from '@/components/ubicaciones/DepartamentoForm';
import { CiudadForm } from '@/components/ubicaciones/CiudadForm';

export default function UbicacionesPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("paises");
  const [activeSubTab, setActiveSubTab] = useState("listado");
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPais, setFilterPais] = useState('todos');
  const [filterDepartamento, setFilterDepartamento] = useState('todos');
  const [filterCiudad, setFilterCiudad] = useState('todos');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  // Estado para eliminación forzada por referencias (FK 23503)
  const [forceDeleteOpen, setForceDeleteOpen] = useState(false);
  const [forceDeleteType, setForceDeleteType] = useState<'pais' | 'departamento' | 'ciudad' | null>(null);
  const [forceDeleteItem, setForceDeleteItem] = useState<any>(null);
  const queryClient = useQueryClient();
  const { startLoading, stopLoading } = useLoading();

  // Estados para filtros específicos
  const [filterPaisDepartamento, setFilterPaisDepartamento] = useState('todos');
  const [filterDepartamentoCiudad, setFilterDepartamentoCiudad] = useState('todos');

  // Cargar datos usando React Query
  const { data: paises = [], isLoading: paisesLoading, error: paisesError } = useQuery({
    queryKey: ['paises'],
    queryFn: async () => {
      try {
        console.log('🔄 Ejecutando query de países...');
        const data = await ubicacionesService.getPaises();
        console.log('📊 Países obtenidos:', data?.length || 0, 'registros');
        return data || [];
      } catch (error) {
        console.error('Error cargando países:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const { data: departamentos = [], isLoading: departamentosLoading, error: departamentosError } = useQuery({
    queryKey: ['departamentos'],
    queryFn: async () => {
      try {
        const data = await ubicacionesService.getDepartamentos();
        return data || [];
      } catch (error) {
        console.error('Error cargando departamentos:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const { data: ciudades = [], isLoading: ciudadesLoading, error: ciudadesError } = useQuery({
    queryKey: ['ciudades'],
    queryFn: async () => {
      try {
        const data = await ubicacionesService.getCiudades();
        return data || [];
      } catch (error) {
        console.error('Error cargando ciudades:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Configuración inicial de tablas (solo una vez)
  useEffect(() => {
    const initializeTables = async () => {
      try {
        console.log('🔧 Configurando tablas de ubicaciones...');
        const setupResult = await setupUbicaciones();
        if (!setupResult.success) {
          console.warn('⚠️ Advertencia: No se pudo configurar las tablas completamente');
        }
      } catch (error) {
        console.error('Error configurando tablas:', error);
      }
    };

    initializeTables();
  }, []); // Solo se ejecuta una vez al montar el componente

  // Filtrar datos
  const filteredPaises = paises.filter(pais =>
    pais.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (pais.codigo_iso && pais.codigo_iso?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredDepartamentos = departamentos.filter(dept => {
    const matchesSearch = dept.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (dept.codigo_dane && dept.codigo_dane?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesPais = filterPaisDepartamento === 'todos' ? true : 
      dept.pais_id === parseInt(filterPaisDepartamento);
    
    // Solo mostrar departamentos de países activos
    const pais = paises.find(p => p.id === dept.pais_id);
    const paisActivo = pais?.estado === true;
    
    return matchesSearch && matchesPais && paisActivo;
  });

  const filteredCiudades = ciudades.filter(ciudad => {
    const matchesSearch = ciudad.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ciudad.codigo_dane && ciudad.codigo_dane?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const departamento = departamentos.find(d => d.id === ciudad.departamento_id);
    const matchesDepartamento = filterDepartamentoCiudad === 'todos' ? true : 
      ciudad.departamento_id === parseInt(filterDepartamentoCiudad);
    
    const matchesPais = filterPaisDepartamento === 'todos' ? true : 
      departamento?.pais_id === parseInt(filterPaisDepartamento);
    
    // Solo mostrar ciudades de departamentos activos y países activos
    const pais = paises.find(p => p.id === departamento?.pais_id);
    const departamentoActivo = departamento?.estado === true;
    const paisActivo = pais?.estado === true;
    
    return matchesSearch && matchesDepartamento && matchesPais && departamentoActivo && paisActivo;
  });

  // Obtener países únicos para filtros
  const uniquePaises = [...new Set(paises.map(p => p.id))];
  const uniqueDepartamentos = [...new Set(departamentos.map(d => d.id))];

  const handleEdit = async (item: any, type: 'pais' | 'departamento' | 'ciudad') => {
    try {
      startLoading();
      setEditingItem(item);
      setActiveSubTab("formulario");
    } catch (error) {
      console.error('Error al editar:', error);
              toast.error("Error al cargar los datos para editar");
    } finally {
      stopLoading();
    }
  };

    const handleDelete = async (item: any, type: 'pais' | 'departamento' | 'ciudad') => {
    if (!item.id) {
      console.error('❌ handleDelete: No se encontró ID del item:', item);
      return;
    }

    try {
      startLoading();
      let success = false;
      
      switch (type) {
        case 'pais':
          await ubicacionesService.deletePais(item.id);
          success = true;
          break;
        case 'departamento':
          await ubicacionesService.deleteDepartamento(item.id);
          success = true;
          break;
        case 'ciudad':
          await ubicacionesService.deleteCiudad(item.id);
          success = true;
          break;
        default:
          console.error('❌ Tipo no reconocido:', type);
          return;
      }

      if (success) {
        const message = `${type === 'pais' ? 'País' : type === 'departamento' ? 'Departamento' : 'Ciudad'} eliminado correctamente`;
        toast.success(message);
        
        // Invalidar queries para refrescar datos
        queryClient.invalidateQueries({ queryKey: ['paises'] });
        queryClient.invalidateQueries({ queryKey: ['departamentos'] });
        queryClient.invalidateQueries({ queryKey: ['ciudades'] });
      }
    } catch (error: any) {
      console.error(`❌ Error al eliminar ${type}:`, error);
      if (error?.code === '23503') {
        // Mostrar confirmación de eliminación forzada
        setForceDeleteType(type);
        setForceDeleteItem(item);
        setForceDeleteOpen(true);
      } else {
        toast.error(`Error al eliminar ${type === 'pais' ? 'el país' : type === 'departamento' ? 'el departamento' : 'la ciudad'}`);
      }
    } finally {
      stopLoading();
    }
  };

  const handleForceDelete = async () => {
    if (!forceDeleteItem?.id || !forceDeleteType) {
      setForceDeleteOpen(false);
      return;
    }
    try {
      startLoading();
      switch (forceDeleteType) {
        case 'pais':
          await ubicacionesService.nullifyPrestadoresByPais(forceDeleteItem.id);
          await ubicacionesService.deletePais(forceDeleteItem.id);
          break;
        case 'departamento':
          await ubicacionesService.nullifyPrestadoresByDepartamento(forceDeleteItem.id);
          await ubicacionesService.deleteDepartamento(forceDeleteItem.id);
          break;
        case 'ciudad':
          await ubicacionesService.nullifyPrestadoresByCiudad(forceDeleteItem.id);
          await ubicacionesService.deleteCiudad(forceDeleteItem.id);
          break;
      }
      toast.success(
        `${forceDeleteType === 'pais' ? 'País' : forceDeleteType === 'departamento' ? 'Departamento' : 'Ciudad'} eliminado correctamente`
      );
      // Refrescar datos
      queryClient.invalidateQueries({ queryKey: ['paises'] });
      queryClient.invalidateQueries({ queryKey: ['departamentos'] });
      queryClient.invalidateQueries({ queryKey: ['ciudades'] });
    } catch (e) {
      console.error('❌ Error en eliminación forzada:', e);
      toast.error('No fue posible eliminar el registro por relaciones adicionales.');
    } finally {
      setForceDeleteOpen(false);
      setForceDeleteType(null);
      setForceDeleteItem(null);
      stopLoading();
    }
  };

  const handleActivate = async (item: any, type: 'pais' | 'departamento' | 'ciudad') => {
    if (!item.id) {
      console.error('❌ handleActivate: No se encontró ID del item:', item);
      return;
    }

    console.log(`🔍 handleActivate llamado para ${type} con ID:`, item.id, 'Item completo:', item);

    try {
      startLoading();
      let success = false;
      
      switch (type) {
        case 'pais':
          console.log('🔄 Activando país con ID:', item.id);
          await ubicacionesService.activatePais(item.id);
          success = true;
          console.log('✅ País activado exitosamente');
          break;
        case 'departamento':
          console.log('🔄 Activando departamento con ID:', item.id);
          await ubicacionesService.activateDepartamento(item.id);
          success = true;
          console.log('✅ Departamento activado exitosamente');
          break;
        case 'ciudad':
          console.log('🔄 Activando ciudad con ID:', item.id);
          await ubicacionesService.activateCiudad(item.id);
          success = true;
          console.log('✅ Ciudad activada exitosamente');
          break;
        default:
          console.error('❌ Tipo no reconocido:', type);
          return;
      }

      if (success) {
        const message = `${type === 'pais' ? 'País' : type === 'departamento' ? 'Departamento' : 'Ciudad'} activado correctamente`;
        console.log('🎉 Éxito:', message);
        toast.success(message);
        
        // Invalidar queries para refrescar datos
        console.log('🔄 Invalidando queries...');
        queryClient.invalidateQueries({ queryKey: ['paises'] });
        queryClient.invalidateQueries({ queryKey: ['departamentos'] });
        queryClient.invalidateQueries({ queryKey: ['ciudades'] });
        console.log('✅ Queries invalidados');
      }
    } catch (error) {
      console.error(`❌ Error al activar ${type}:`, error);
      toast.error(`Error al activar ${type === 'pais' ? 'el país' : type === 'departamento' ? 'el departamento' : 'la ciudad'}`);
    } finally {
      stopLoading();
      console.log('🔄 Loading detenido');
    }
  };

  const handleDeactivate = async (item: any, type: 'pais' | 'departamento' | 'ciudad') => {
    if (!item.id) {
      console.error('❌ handleDeactivate: No se encontró ID del item:', item);
      return;
    }

    console.log(`🔍 handleDeactivate llamado para ${type} con ID:`, item.id, 'Item completo:', item);

    try {
      startLoading();
      let success = false;
      
      switch (type) {
        case 'pais':
          console.log('🔄 Desactivando país con ID:', item.id);
          await ubicacionesService.deactivatePais(item.id);
          success = true;
          console.log('✅ País desactivado exitosamente');
          break;
        case 'departamento':
          console.log('🔄 Desactivando departamento con ID:', item.id);
          await ubicacionesService.deactivateDepartamento(item.id);
          success = true;
          console.log('✅ Departamento desactivado exitosamente');
          break;
        case 'ciudad':
          console.log('🔄 Desactivando ciudad con ID:', item.id);
          await ubicacionesService.deactivateCiudad(item.id);
          success = true;
          console.log('✅ Ciudad desactivada exitosamente');
          break;
        default:
          console.error('❌ Tipo no reconocido:', type);
          return;
      }

      if (success) {
        const message = `${type === 'pais' ? 'País' : type === 'departamento' ? 'Departamento' : 'Ciudad'} inactivado correctamente`;
        console.log('🎉 Éxito:', message);
        toast.success(message);
        
        // Invalidar queries para refrescar datos
        console.log('🔄 Invalidando queries...');
        queryClient.invalidateQueries({ queryKey: ['paises'] });
        queryClient.invalidateQueries({ queryKey: ['departamentos'] });
        queryClient.invalidateQueries({ queryKey: ['ciudades'] });
        console.log('✅ Queries invalidados');
      }
    } catch (error) {
      console.error(`❌ Error al inactivar ${type}:`, error);
      toast.error(`Error al inactivar ${type === 'pais' ? 'el país' : type === 'departamento' ? 'el departamento' : 'la ciudad'}`);
    } finally {
      stopLoading();
      console.log('🔄 Loading detenido');
    }
  };

  const handleNewItem = () => {
    setEditingItem(null);
    setActiveSubTab("formulario");
  };

  const handleSaved = () => {
    setActiveSubTab("listado");
    setEditingItem(null);
    // Invalidar queries para refrescar datos
    queryClient.invalidateQueries({ queryKey: ['paises'] });
    queryClient.invalidateQueries({ queryKey: ['departamentos'] });
    queryClient.invalidateQueries({ queryKey: ['ciudades'] });
  };

  const getLoadingState = () => {
    switch (activeTab) {
      case 'paises':
        return paisesLoading;
      case 'departamentos':
        return departamentosLoading;
      case 'ciudades':
        return ciudadesLoading;
      default:
        return false;
    }
  };

  const getErrorState = () => {
    switch (activeTab) {
      case 'paises':
        return paisesError;
      case 'departamentos':
        return departamentosError;
      case 'ciudades':
        return ciudadesError;
      default:
        return null;
    }
  };

  const getFilteredData = () => {
    switch (activeTab) {
      case 'paises':
        return filteredPaises;
      case 'departamentos':
        return filteredDepartamentos;
      case 'ciudades':
        return filteredCiudades;
      default:
        return [];
    }
  };

  const getTableHeaders = () => {
    switch (activeTab) {
      case 'paises':
        return ['Acciones', 'Nombre', 'Código ISO', 'Estado'];
      case 'departamentos':
        return ['Acciones', 'Nombre', 'Código DANE', 'País', 'Estado'];
      case 'ciudades':
        return ['Acciones', 'Nombre', 'Código DANE', 'Departamento', 'País', 'Estado'];
      default:
        return [];
    }
  };

  const renderTableRow = (item: any, index: number) => {
    switch (activeTab) {
             case 'paises':
         return (
           <TableRow key={item.id} className="hover:bg-gray-50">
             <TableCell className="px-2 py-1">
               <div className="flex flex-row gap-1 items-center">
                 <TooltipProvider>
                   <Tooltip>
                     <TooltipTrigger asChild>
                       <Button
                         variant="ghost"
                         size="icon"
                         onClick={() => handleEdit(item, 'pais')}
                         aria-label="Editar país"
                         className="h-8 w-8"
                       >
                         <Edit3 className="h-4 w-4 text-cyan-600 hover:text-cyan-800 transition-colors" />
                       </Button>
                     </TooltipTrigger>
                     <TooltipContent>
                       <p>Editar</p>
                     </TooltipContent>
                   </Tooltip>
                 </TooltipProvider>
                 
                 {item.estado ? (
                   <TooltipProvider>
                     <Tooltip>
                       <TooltipTrigger asChild>
                         <AlertDialog>
                           <AlertDialogTrigger asChild>
                             <Button
                               variant="ghost"
                               size="icon"
                               aria-label="Inactivar país"
                               className="h-8 w-8"
                             >
                               <Lock className="h-4 w-4 text-yellow-600 hover:text-yellow-800 transition-colors" />
                             </Button>
                           </AlertDialogTrigger>
                           <AlertDialogContent>
                             <AlertDialogHeader>
                               <AlertDialogTitle>¿Inactivar país?</AlertDialogTitle>
                               <AlertDialogDescription>
                                Esta acción inactivará el país "{item.nombre}" y no podrá ser usado hasta que se reactive. ¿Estás seguro?
                               </AlertDialogDescription>
                             </AlertDialogHeader>
                             <AlertDialogFooter>
                               <AlertDialogCancel>Cancelar</AlertDialogCancel>
                               <AlertDialogAction onClick={() => handleDeactivate(item, 'pais')}>
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
                 ) : (
                   <TooltipProvider>
                     <Tooltip>
                       <TooltipTrigger asChild>
                         <AlertDialog>
                           <AlertDialogTrigger asChild>
                             <Button
                               variant="ghost"
                               size="icon"
                               aria-label="Activar país"
                               className="h-8 w-8"
                             >
                               <CheckCircle className="h-4 w-4 text-brand-lime hover:text-brand-lime/80 transition-colors" />
                             </Button>
                           </AlertDialogTrigger>
                           <AlertDialogContent>
                             <AlertDialogHeader>
                               <AlertDialogTitle>¿Activar país?</AlertDialogTitle>
                               <AlertDialogDescription>
                                 ¿Estás seguro de que deseas activar el país "{item.nombre}"? 
                                 Una vez activado, aparecerá en las listas de selección.
                               </AlertDialogDescription>
                             </AlertDialogHeader>
                             <AlertDialogFooter>
                               <AlertDialogCancel>Cancelar</AlertDialogCancel>
                               <AlertDialogAction onClick={() => handleActivate(item, 'pais')}>
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
                 )}
                 
                 {!item.estado && (
                   <TooltipProvider>
                     <Tooltip>
                       <TooltipTrigger asChild>
                         <AlertDialog>
                           <AlertDialogTrigger asChild>
                             <Button
                               variant="ghost"
                               size="icon"
                               aria-label="Eliminar país"
                               className="h-8 w-8"
                             >
                               <Trash2 className="h-4 w-4 text-rose-600 hover:text-rose-800 transition-colors" />
                             </Button>
                           </AlertDialogTrigger>
                           <AlertDialogContent>
                             <AlertDialogHeader>
                               <AlertDialogTitle>¿Eliminar país?</AlertDialogTitle>
                               <AlertDialogDescription>
                                 Esta acción eliminará el país "{item.nombre}" de forma permanente.
                                 También se eliminarán sus departamentos y ciudades relacionadas.
                                 Esta acción no se puede deshacer. ¿Estás seguro?
                               </AlertDialogDescription>
                             </AlertDialogHeader>
                             <AlertDialogFooter>
                               <AlertDialogCancel>Cancelar</AlertDialogCancel>
                               <AlertDialogAction onClick={() => handleDelete(item, 'pais')}>
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
                 )}
               </div>
             </TableCell>
             <TableCell className="px-4 py-3 text-sm text-gray-900 font-medium">{item.nombre}</TableCell>
             <TableCell className="px-4 py-3 text-sm text-gray-500">{item.codigo_iso ?? '-'}</TableCell>
             <TableCell className="px-4 py-3 text-sm">
               <Badge variant={item.estado ? "default" : "secondary"} className={item.estado ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                 {item.estado ? "Activo" : "Inactivo"}
               </Badge>
             </TableCell>
           </TableRow>
         );

             case 'departamentos':
         const pais = paises.find(p => p.id === item.pais_id);
         return (
           <TableRow key={item.id} className="hover:bg-gray-50">
             <TableCell className="px-2 py-1">
               <div className="flex flex-row gap-1 items-center">
                 <TooltipProvider>
                   <Tooltip>
                     <TooltipTrigger asChild>
                       <Button
                         variant="ghost"
                         size="icon"
                         onClick={() => handleEdit(item, 'departamento')}
                         aria-label="Editar departamento"
                         className="h-8 w-8"
                       >
                         <Edit3 className="h-4 w-4 text-cyan-600 hover:text-cyan-800 transition-colors" />
                       </Button>
                     </TooltipTrigger>
                     <TooltipContent>
                       <p>Editar</p>
                     </TooltipContent>
                   </Tooltip>
                 </TooltipProvider>
                 
                 {item.estado ? (
                   <TooltipProvider>
                     <Tooltip>
                       <TooltipTrigger asChild>
                         <AlertDialog>
                           <AlertDialogTrigger asChild>
                             <Button
                               variant="ghost"
                               size="icon"
                               aria-label="Inactivar departamento"
                               className="h-8 w-8"
                             >
                               <Lock className="h-4 w-4 text-yellow-600 hover:text-yellow-800 transition-colors" />
                             </Button>
                           </AlertDialogTrigger>
                           <AlertDialogContent>
                             <AlertDialogHeader>
                               <AlertDialogTitle>¿Inactivar departamento?</AlertDialogTitle>
                               <AlertDialogDescription>
                                Esta acción inactivará el departamento "{item.nombre}" y no podrá ser usado hasta que se reactive. ¿Estás seguro?
                               </AlertDialogDescription>
                             </AlertDialogHeader>
                             <AlertDialogFooter>
                               <AlertDialogCancel>Cancelar</AlertDialogCancel>
                               <AlertDialogAction onClick={() => handleDeactivate(item, 'departamento')}>
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
                 ) : (
                   <TooltipProvider>
                     <Tooltip>
                       <TooltipTrigger asChild>
                         <AlertDialog>
                           <AlertDialogTrigger asChild>
                             <Button
                               variant="ghost"
                               size="icon"
                               aria-label="Activar departamento"
                               className="h-8 w-8"
                             >
                               <CheckCircle className="h-4 w-4 text-brand-lime hover:text-brand-lime/80 transition-colors" />
                             </Button>
                           </AlertDialogTrigger>
                           <AlertDialogContent>
                             <AlertDialogHeader>
                               <AlertDialogTitle>¿Activar departamento?</AlertDialogTitle>
                               <AlertDialogDescription>
                                 ¿Estás seguro de que deseas activar el departamento "{item.nombre}"? 
                                 Una vez activado, aparecerá en las listas de selección.
                               </AlertDialogDescription>
                             </AlertDialogHeader>
                             <AlertDialogFooter>
                               <AlertDialogCancel>Cancelar</AlertDialogCancel>
                               <AlertDialogAction onClick={() => handleActivate(item, 'departamento')}>
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
                 )}
                 
                 {!item.estado && (
                   <TooltipProvider>
                     <Tooltip>
                       <TooltipTrigger asChild>
                         <AlertDialog>
                           <AlertDialogTrigger asChild>
                             <Button
                               variant="ghost"
                               size="icon"
                               aria-label="Eliminar departamento"
                               className="h-8 w-8"
                             >
                               <Trash2 className="h-4 w-4 text-rose-600 hover:text-rose-800 transition-colors" />
                             </Button>
                           </AlertDialogTrigger>
                           <AlertDialogContent>
                             <AlertDialogHeader>
                               <AlertDialogTitle>¿Eliminar departamento?</AlertDialogTitle>
                               <AlertDialogDescription>
                                 Esta acción eliminará el departamento "{item.nombre}" de forma permanente.
                                 También se eliminarán sus ciudades relacionadas.
                                 Esta acción no se puede deshacer. ¿Estás seguro?
                               </AlertDialogDescription>
                             </AlertDialogHeader>
                             <AlertDialogFooter>
                               <AlertDialogCancel>Cancelar</AlertDialogCancel>
                               <AlertDialogAction onClick={() => handleDelete(item, 'departamento')}>
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
                 )}
               </div>
             </TableCell>
             <TableCell className="px-4 py-3 text-sm text-gray-900 font-medium">{item.nombre}</TableCell>
             <TableCell className="px-4 py-3 text-sm text-gray-500">{item.codigo_dane ?? '-'}</TableCell>
             <TableCell className="px-4 py-3 text-sm text-gray-500">{pais?.nombre ?? '-'}</TableCell>
             <TableCell className="px-4 py-3 text-sm">
               <Badge variant={item.estado ? "default" : "secondary"} className={item.estado ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                 {item.estado ? "Activo" : "Inactivo"}
               </Badge>
             </TableCell>
           </TableRow>
         );

             case 'ciudades':
         const departamento = departamentos.find(d => d.id === item.departamento_id);
         const paisCiudad = paises.find(p => p.id === departamento?.pais_id);
         return (
           <TableRow key={item.id} className="hover:bg-gray-50">
             <TableCell className="px-2 py-1">
               <div className="flex flex-row gap-1 items-center">
                 <TooltipProvider>
                   <Tooltip>
                     <TooltipTrigger asChild>
                       <Button
                         variant="ghost"
                         size="icon"
                         onClick={() => handleEdit(item, 'ciudad')}
                         aria-label="Editar ciudad"
                         className="h-8 w-8"
                       >
                         <Edit3 className="h-4 w-4 text-cyan-600 hover:text-cyan-800 transition-colors" />
                       </Button>
                     </TooltipTrigger>
                     <TooltipContent>
                       <p>Editar</p>
                     </TooltipContent>
                   </Tooltip>
                 </TooltipProvider>
                 
                 {item.estado ? (
                   <TooltipProvider>
                     <Tooltip>
                       <TooltipTrigger asChild>
                         <AlertDialog>
                           <AlertDialogTrigger asChild>
                             <Button
                               variant="ghost"
                               size="icon"
                               aria-label="Inactivar ciudad"
                               className="h-8 w-8"
                             >
                               <Lock className="h-4 w-4 text-yellow-600 hover:text-yellow-800 transition-colors" />
                             </Button>
                           </AlertDialogTrigger>
                           <AlertDialogContent>
                             <AlertDialogHeader>
                               <AlertDialogTitle>¿Inactivar ciudad?</AlertDialogTitle>
                               <AlertDialogDescription>
                                Esta acción inactivará la ciudad "{item.nombre}" y no podrá ser usada hasta que se reactive. ¿Estás seguro?
                               </AlertDialogDescription>
                             </AlertDialogHeader>
                             <AlertDialogFooter>
                               <AlertDialogCancel>Cancelar</AlertDialogCancel>
                               <AlertDialogAction onClick={() => handleDeactivate(item, 'ciudad')}>
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
                 ) : (
                   <TooltipProvider>
                     <Tooltip>
                       <TooltipTrigger asChild>
                         <AlertDialog>
                           <AlertDialogTrigger asChild>
                             <Button
                               variant="ghost"
                               size="icon"
                               aria-label="Activar ciudad"
                               className="h-8 w-8"
                             >
                               <CheckCircle className="h-4 w-4 text-brand-lime hover:text-brand-lime/80 transition-colors" />
                             </Button>
                           </AlertDialogTrigger>
                           <AlertDialogContent>
                             <AlertDialogHeader>
                               <AlertDialogTitle>¿Activar ciudad?</AlertDialogTitle>
                               <AlertDialogDescription>
                                 ¿Estás seguro de que deseas activar la ciudad "{item.nombre}"? 
                                 Una vez activada, aparecerá en las listas de selección.
                               </AlertDialogDescription>
                             </AlertDialogHeader>
                             <AlertDialogFooter>
                               <AlertDialogCancel>Cancelar</AlertDialogCancel>
                               <AlertDialogAction onClick={() => handleActivate(item, 'ciudad')}>
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
                 )}
                 
                 {!item.estado && (
                   <TooltipProvider>
                     <Tooltip>
                       <TooltipTrigger asChild>
                         <AlertDialog>
                           <AlertDialogTrigger asChild>
                             <Button
                               variant="ghost"
                               size="icon"
                               aria-label="Eliminar ciudad"
                               className="h-8 w-8"
                             >
                               <Trash2 className="h-4 w-4 text-rose-600 hover:text-rose-800 transition-colors" />
                             </Button>
                           </AlertDialogTrigger>
                           <AlertDialogContent>
                             <AlertDialogHeader>
                               <AlertDialogTitle>¿Eliminar ciudad?</AlertDialogTitle>
                               <AlertDialogDescription>
                                 Esta acción eliminará la ciudad "{item.nombre}" de forma permanente. 
                                 Esta acción no se puede deshacer. ¿Estás seguro?
                               </AlertDialogDescription>
                             </AlertDialogHeader>
                             <AlertDialogFooter>
                               <AlertDialogCancel>Cancelar</AlertDialogCancel>
                               <AlertDialogAction onClick={() => handleDelete(item, 'ciudad')}>
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
                 )}
               </div>
             </TableCell>
             <TableCell className="px-4 py-3 text-sm text-gray-900 font-medium">{item.nombre}</TableCell>
             <TableCell className="px-4 py-3 text-sm text-gray-500">{item.codigo_dane ?? '-'}</TableCell>
             <TableCell className="px-4 py-3 text-sm text-gray-500">{departamento?.nombre ?? '-'}</TableCell>
             <TableCell className="px-4 py-3 text-sm text-gray-500">{paisCiudad?.nombre ?? '-'}</TableCell>
             <TableCell className="px-4 py-3 text-sm">
               <Badge variant={item.estado ? "default" : "secondary"} className={item.estado ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                 {item.estado ? "Activo" : "Inactivo"}
               </Badge>
             </TableCell>
           </TableRow>
         );

      default:
        return null;
    }
  };

  const renderFilters = () => {
    switch (activeTab) {
             case 'paises':
         return (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="relative">
               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
               <Input
                 placeholder="Buscar por nombre o código ISO..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="pl-10 md:col-span-2"
               />
             </div>
             <Button
               variant="outline"
               onClick={() => setSearchTerm("")}
               className="flex items-center gap-2"
             >
               <Filter className="w-4 h-4" />
               Limpiar filtros
             </Button>
           </div>
         );

      case 'departamentos':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por nombre o código DANE..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterPaisDepartamento} onValueChange={setFilterPaisDepartamento}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por país" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los países</SelectItem>
                {paises.filter(p => p.estado).map(pais => (
                  <SelectItem key={pais.id} value={pais.id.toString()}>
                    {pais.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setFilterPaisDepartamento("todos");
              }}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Limpiar filtros
            </Button>
          </div>
        );

             case 'ciudades':
         return (
           <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             <div className="relative">
               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
               <Input
                 placeholder="Buscar por nombre o código DANE..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="pl-10"
               />
             </div>
             <Select value={filterPaisDepartamento} onValueChange={setFilterPaisDepartamento}>
               <SelectTrigger>
                 <SelectValue placeholder="Filtrar por país" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="todos">Todos los países</SelectItem>
                 {paises.filter(p => p.estado).map(pais => (
                   <SelectItem key={pais.id} value={pais.id.toString()}>
                     {pais.nombre}
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
             <Select value={filterDepartamentoCiudad} onValueChange={setFilterDepartamentoCiudad}>
               <SelectTrigger>
                 <SelectValue placeholder="Filtrar por departamento" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="todos">Todos los departamentos</SelectItem>
                 {departamentos
                   .filter(dept => {
                     // Solo mostrar departamentos activos
                     if (!dept.estado) return false;
                     // Si hay filtro de país, verificar que coincida
                     if (filterPaisDepartamento !== 'todos') {
                       return dept.pais_id === parseInt(filterPaisDepartamento);
                     }
                     return true;
                   })
                   .map(dept => (
                     <SelectItem key={dept.id} value={dept.id.toString()}>
                       {dept.nombre}
                     </SelectItem>
                   ))}
               </SelectContent>
             </Select>
             <Button
               variant="outline"
               onClick={() => {
                 setSearchTerm("");
                 setFilterPaisDepartamento("todos");
                 setFilterDepartamentoCiudad("todos");
               }}
               className="flex items-center gap-2"
             >
               <Filter className="w-4 h-4" />
               Limpiar filtros
             </Button>
           </div>
         );

      default:
        return null;
    }
  };

  const renderForm = () => {
    switch (activeTab) {
      case 'paises':
        return <PaisForm initialData={editingItem} onSaved={handleSaved} />;
      case 'departamentos':
        return <DepartamentoForm initialData={editingItem} paises={paises} onSaved={handleSaved} />;
      case 'ciudades':
        return <CiudadForm initialData={editingItem} departamentos={departamentos} paises={paises} onSaved={handleSaved} />;
      default:
        return null;
    }
  };

  const getTabIcon = () => {
    switch (activeTab) {
      case 'paises':
        return <Globe className="w-8 h-8 text-cyan-600" />;
      case 'departamentos':
        return <MapPin className="w-8 h-8 text-cyan-600" />;
      case 'ciudades':
        return <Building2 className="w-8 h-8 text-cyan-600" />;
      default:
        return <Globe className="w-8 h-8 text-cyan-600" />;
    }
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'paises':
        return 'Gestión de Países';
      case 'departamentos':
        return 'Gestión de Departamentos';
      case 'ciudades':
        return 'Gestión de Ciudades';
      default:
        return 'Gestión de Ubicaciones';
    }
  };

  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'paises':
        return 'PAÍSES DEL SISTEMA';
      case 'departamentos':
        return 'DEPARTAMENTOS DEL SISTEMA';
      case 'ciudades':
        return 'CIUDADES DEL SISTEMA';
      default:
        return 'UBICACIONES DEL SISTEMA';
    }
  };

  const getHeaderIcon = () => {
    switch (activeTab) {
      case 'paises':
        return <Globe className="w-5 h-5 text-orange-600" />;
      case 'departamentos':
        return <MapPin className="w-5 h-5 text-orange-600" />;
      case 'ciudades':
        return <Building2 className="w-5 h-5 text-orange-600" />;
      default:
        return <Globe className="w-5 h-5 text-orange-600" />;
    }
  };

  return (
    <div className="p-4 max-w-full mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-extrabold text-cyan-800 flex items-center gap-2 mb-2">
          {getTabIcon()}
          {getTabTitle()}
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-cyan-100/60 p-1 rounded-lg">
          <TabsTrigger
            value="paises"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
          >
            <Globe className="w-4 h-4 mr-2" />
            Países
          </TabsTrigger>
          <TabsTrigger
            value="departamentos"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
          >
            <MapPin className="w-4 h-4 mr-2" />
            Departamentos
          </TabsTrigger>
          <TabsTrigger
            value="ciudades"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
          >
            <Building2 className="w-4 h-4 mr-2" />
            Ciudades
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-cyan-100/60 p-1 rounded-lg">
              <TabsTrigger
                value="listado"
                className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
              >
                Listado de {activeTab === 'paises' ? 'Países' : activeTab === 'departamentos' ? 'Departamentos' : 'Ciudades'}
              </TabsTrigger>
              <TabsTrigger
                value="formulario"
                className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
              >
                {editingItem ? 'Editar' : 'Nuevo'} {activeTab === 'paises' ? 'País' : activeTab === 'departamentos' ? 'Departamento' : 'Ciudad'}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="listado" className="mt-6">
              {/* Header similar al diseño de empresas */}
              <div className="bg-white rounded-lg border">
                <div className="flex items-center justify-between p-4 border-b">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                      {getHeaderIcon()}
                    </div>
                    <span className="text-lg font-semibold text-gray-700">{getHeaderTitle()}</span>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleNewItem}
                      className="bg-teal-400 hover:bg-teal-500 text-white text-xs px-3 py-1"
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Registro
                    </Button>
                  </div>
                </div>

                {/* Filtros */}
                <div className="p-4 border-b bg-gray-50">
                  {renderFilters()}
                  
                  {/* Mensaje informativo */}
                  <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-700">
                      <Info className="w-4 h-4 inline mr-2" />
                      {activeTab === 'paises' 
                        ? 'Puedes activar o desactivar países. Los departamentos y ciudades dependen del estado del país.'
                        : activeTab === 'departamentos'
                        ? 'Solo se muestran departamentos de países activos.'
                        : 'Solo se muestran ciudades de departamentos y países activos.'
                      }
                    </p>
                  </div>
                </div>

                {/* Tabla */}
                <div className="overflow-x-auto rounded-lg shadow-sm">
                  {getLoadingState() ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Cargando {activeTab === 'paises' ? 'países' : activeTab === 'departamentos' ? 'departamentos' : 'ciudades'}...</p>
                      </div>
                    </div>
                  ) : getErrorState() ? (
                    <div className="text-center py-8 text-red-500">
                      <p className="font-medium">Error al cargar los datos</p>
                    </div>
                  ) : (
                    <Table className="min-w-[800px] w-full text-xs">
                      <TableHeader className="bg-cyan-50">
                        <TableRow className="text-left font-semibold text-gray-700">
                          {getTableHeaders().map((header, index) => (
                            <TableHead key={index} className="px-4 py-3 text-teal-600">
                              {header}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getFilteredData().length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={getTableHeaders().length} className="h-24 text-center">
                              <div className="text-gray-500">
                                <p className="font-medium mb-2">
                                  No hay {activeTab === 'paises' ? 'países' : activeTab === 'departamentos' ? 'departamentos' : 'ciudades'} disponibles.
                                </p>
                                <p className="text-sm">
                                  {activeTab === 'paises' 
                                    ? 'Todos los países están inactivos o no se encontraron coincidencias con los filtros.'
                                    : activeTab === 'departamentos'
                                    ? 'No hay departamentos activos o todos los países están inactivos.'
                                    : 'No hay ciudades activas o todos los departamentos/países están inactivos.'
                                  }
                                </p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          getFilteredData().map((item, index) => renderTableRow(item, index))
                        )}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="formulario" className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  {editingItem ? 'Editar' : 'Nuevo'} {activeTab === 'paises' ? 'País' : activeTab === 'departamentos' ? 'Departamento' : 'Ciudad'}
                </h2>
              </div>

              {/* Formulario */}
              {renderForm()}
            </TabsContent>

            {/* Confirmación de eliminación forzada por referencias (FK 23503) */}
            <AlertDialog open={forceDeleteOpen} onOpenChange={setForceDeleteOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar con relaciones asociadas?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {forceDeleteType === 'pais'
                      ? `Este país tiene departamentos, ciudades o prestadores asociados. Si continúas, se desasociarán los prestadores y se eliminarán en cascada los departamentos y ciudades relacionados.`
                      : forceDeleteType === 'departamento'
                      ? `Este departamento tiene ciudades o prestadores asociados. Si continúas, se desasociarán los prestadores y se eliminarán en cascada las ciudades relacionadas.`
                      : `Esta ciudad está asociada a prestadores. Si continúas, se desasociarán los prestadores y se eliminará la ciudad.`}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleForceDelete}>Sí, eliminar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
} 
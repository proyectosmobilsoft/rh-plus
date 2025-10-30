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
  Info,
  ChevronsUpDown,
  Check
} from 'lucide-react';
import { MultiSelect, Option as MultiSelectOption } from '@/components/ui/multi-select';
import { toast } from "sonner";

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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ubicacionesService, Pais, Departamento, Ciudad } from '@/services/ubicacionesService';
import { empresasService } from '@/services/empresasService';
import { setupUbicaciones } from '@/services/setupUbicaciones';
import { useLoading } from '@/contexts/LoadingContext';
import { PaisForm } from '@/components/ubicaciones/PaisForm';
import { DepartamentoForm } from '@/components/ubicaciones/DepartamentoForm';
import { CiudadForm } from '@/components/ubicaciones/CiudadForm';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useRegisterView } from "@/hooks/useRegisterView";
import { Can } from "@/contexts/PermissionsContext";
import { obtenerEmpresaSeleccionada } from "@/utils/empresaUtils";
import { handleServiceError, logError } from "@/utils/errorHandler";

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
  const [forceDeleteType, setForceDeleteType] = useState<'pais' | 'departamento' | 'ciudad' | 'regional' | 'sucursal' | null>(null);
  const [forceDeleteItem, setForceDeleteItem] = useState<any>(null);
  const queryClient = useQueryClient();
  const { startLoading, stopLoading } = useLoading();

  // Registro de vistas/acciones para permisos (listados y formularios)
  const { addAction: addPaisListado } = useRegisterView('Paises', 'listado', 'Listado de Paises');
  const { addAction: addPaisForm } = useRegisterView('Paises', 'formulario', 'Formulario de Paises');
  const { addAction: addDeptoListado } = useRegisterView('Departamentos', 'listado', 'Listado de Departamentos');
  const { addAction: addDeptoForm } = useRegisterView('Departamentos', 'formulario', 'Formulario de Departamentos');
  const { addAction: addCiudadListado } = useRegisterView('Ciudades', 'listado', 'Listado de Ciudades');
  const { addAction: addCiudadForm } = useRegisterView('Ciudades', 'formulario', 'Formulario de Ciudades');
  const { addAction: addRegionalListado } = useRegisterView('Regionales', 'listado', 'Listado de Regionales');
  const { addAction: addRegionalForm } = useRegisterView('Regionales', 'formulario', 'Formulario de Regionales');
  const { addAction: addSucursalListado } = useRegisterView('Sucursales', 'listado', 'Listado de Sucursales');
  const { addAction: addSucursalForm } = useRegisterView('Sucursales', 'formulario', 'Formulario de Sucursales');

  useEffect(() => {
    // Paises
    addPaisListado('editar', 'Editar País');
    addPaisListado('activar', 'Activar País');
    addPaisListado('inactivar', 'Inactivar País');
    addPaisListado('eliminar', 'Eliminar País');
    addPaisForm('crear', 'Crear País');
    addPaisForm('actualizar', 'Actualizar País');
    addPaisForm('cancelar', 'Cancelar');

    // Departamentos
    addDeptoListado('editar', 'Editar Departamento');
    addDeptoListado('activar', 'Activar Departamento');
    addDeptoListado('inactivar', 'Inactivar Departamento');
    addDeptoListado('eliminar', 'Eliminar Departamento');
    addDeptoForm('crear', 'Crear Departamento');
    addDeptoForm('actualizar', 'Actualizar Departamento');
    addDeptoForm('cancelar', 'Cancelar');

    // Ciudades
    addCiudadListado('editar', 'Editar Ciudad');
    addCiudadListado('activar', 'Activar Ciudad');
    addCiudadListado('inactivar', 'Inactivar Ciudad');
    addCiudadListado('eliminar', 'Eliminar Ciudad');
    addCiudadForm('crear', 'Crear Ciudad');
    addCiudadForm('actualizar', 'Actualizar Ciudad');
    addCiudadForm('cancelar', 'Cancelar');

    // Regionales
    addRegionalListado('editar', 'Editar Regional');
    addRegionalListado('activar', 'Activar Regional');
    addRegionalListado('inactivar', 'Inactivar Regional');
    addRegionalListado('eliminar', 'Eliminar Regional');
    addRegionalForm('crear', 'Crear Regional');
    addRegionalForm('actualizar', 'Actualizar Regional');
    addRegionalForm('asociar-departamentos', 'Asociar Departamentos');
    addRegionalForm('cancelar', 'Cancelar');

    // Sucursales
    addSucursalListado('editar', 'Editar Sucursal');
    addSucursalListado('activar', 'Activar Sucursal');
    addSucursalListado('inactivar', 'Inactivar Sucursal');
    addSucursalListado('eliminar', 'Eliminar Sucursal');
    addSucursalForm('crear', 'Crear Sucursal');
    addSucursalForm('actualizar', 'Actualizar Sucursal');
    addSucursalForm('cancelar', 'Cancelar');
  }, [
    addPaisListado, addPaisForm,
    addDeptoListado, addDeptoForm,
    addCiudadListado, addCiudadForm,
    addRegionalListado, addRegionalForm,
    addSucursalListado, addSucursalForm
  ]);

  // Estados para filtros específicos
  const [filterPaisDepartamento, setFilterPaisDepartamento] = useState('todos');
  const [filterDepartamentoCiudad, setFilterDepartamentoCiudad] = useState('todos');
  // Búsquedas independientes por tab
  const [searchPaises, setSearchPaises] = useState('');
  const [searchDepartamentos, setSearchDepartamentos] = useState('');
  const [searchRegionales, setSearchRegionales] = useState('');
  const [searchCiudades, setSearchCiudades] = useState('');
  const [searchSucursales, setSearchSucursales] = useState('');
  // Filtros de estado por tab (activos por defecto)
  const [statusPaises, setStatusPaises] = useState<string>('active');
  const [statusDepartamentos, setStatusDepartamentos] = useState<string>('active');
  const [statusRegionales, setStatusRegionales] = useState<string>('active');
  const [statusCiudades, setStatusCiudades] = useState<string>('active');
  const [statusSucursales, setStatusSucursales] = useState<string>('active');
  // Open states para popovers de filtros
  const [openStatusPaises, setOpenStatusPaises] = useState(false);
  const [openPaisDepartamentos, setOpenPaisDepartamentos] = useState(false);
  const [openStatusDepartamentos, setOpenStatusDepartamentos] = useState(false);
  const [openPaisCiudades, setOpenPaisCiudades] = useState(false);
  const [openDeptCiudades, setOpenDeptCiudades] = useState(false);
  const [openStatusCiudades, setOpenStatusCiudades] = useState(false);
  const [openStatusRegionales, setOpenStatusRegionales] = useState(false);
  const [openStatusSucursales, setOpenStatusSucursales] = useState(false);
  // Estado para formulario de regionales
  const [selectedDeptosRegional, setSelectedDeptosRegional] = useState<number[]>([]);
  const [regionalError, setRegionalError] = useState<string | null>(null);

  // Estados para formulario de sucursales
  const [selectedDepartamentoSucursal, setSelectedDepartamentoSucursal] = useState<number | null>(null);
  const [selectedCiudadSucursal, setSelectedCiudadSucursal] = useState<number | null>(null);
  const [openDepartamentoSucursal, setOpenDepartamentoSucursal] = useState(false);
  const [openCiudadSucursal, setOpenCiudadSucursal] = useState(false);
  const [codigoSucursal, setCodigoSucursal] = useState<string>('');
  const [ciudadIdSucursal, setCiudadIdSucursal] = useState<number | null>(null);
  const [selectedEmpresaSucursal, setSelectedEmpresaSucursal] = useState<number | null>(null);

  // Cargar datos usando React Query
  const { data: paises = [], isLoading: paisesLoading, error: paisesError } = useQuery({
    queryKey: ['paises'],
    queryFn: async () => {
      try {
        
        const data = await ubicacionesService.getPaises();
        
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

  // useEffect para inicializar el departamento, ciudad y empresa cuando se está editando una sucursal
  useEffect(() => {
    if (editingItem && activeTab === 'sucursales' && ciudades.length > 0 && editingItem.ciudad_id) {
      try {
        const ciudadSucursal = ciudades.find(c => c.id === editingItem.ciudad_id);
        if (ciudadSucursal?.departamento_id) {
          setSelectedDepartamentoSucursal(ciudadSucursal.departamento_id);
          setSelectedCiudadSucursal(editingItem.ciudad_id);
          setCiudadIdSucursal(editingItem.ciudad_id);
        }
        // Inicializar empresa_id si existe
        if ((editingItem as any).empresa_id) {
          setSelectedEmpresaSucursal((editingItem as any).empresa_id);
        }
      } catch (error) {
        
        setSelectedDepartamentoSucursal(null);
        setSelectedCiudadSucursal(null);
        setCiudadIdSucursal(null);
      }
    } else if (!editingItem || activeTab !== 'sucursales') {
      // Limpiar el estado cuando no se está editando o no estamos en la pestaña de sucursales
      setSelectedDepartamentoSucursal(null);
      setSelectedCiudadSucursal(null);
      setCiudadIdSucursal(null);
      setSelectedEmpresaSucursal(null);
    }
  }, [editingItem, activeTab, ciudades]);


  // Sucursales
  const { data: sucursales = [], isLoading: sucursalesLoading, error: sucursalesError } = useQuery({
    queryKey: ['sucursales'],
    queryFn: async () => {
      const data = await ubicacionesService.getSucursales();
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Cargar empresas para el selector de empresa en sucursales
  const { data: empresas = [], isLoading: empresasLoading } = useQuery({
    queryKey: ['empresas'],
    queryFn: async () => {
      try {
        const data = await empresasService.getAll();
        return data || [];
      } catch (error) {
        console.error('Error cargando empresas:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });


  // Cargar regionales y sus asociaciones
  const { data: regionales = [], isLoading: regionalesLoading, error: regionalesError } = useQuery({
    queryKey: ['regionales'],
    queryFn: async () => {
      const data = await ubicacionesService.getRegionales();
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: regionalesDepartamentos = [], isLoading: regDepLoading } = useQuery({
    queryKey: ['regionales_departamentos'],
    queryFn: async () => {
      const data = await ubicacionesService.getRegionalesDepartamentos();
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Configuración inicial de tablas (solo una vez)
  useEffect(() => {
    const initializeTables = async () => {
      try {
        
        const setupResult = await setupUbicaciones();
        if (!setupResult.success) {
          
        }
      } catch (error) {
        console.error('Error configurando tablas:', error);
      }
    };

    initializeTables();
  }, []); // Solo se ejecuta una vez al montar el componente

  // useEffect para generar código autoincrementable para nuevas sucursales
  useEffect(() => {
    
    
    if (activeTab === 'sucursales' && !editingItem && sucursales.length >= 0) {
      try {
        // Generar código autoincrementable basado en el número de sucursales existentes
        const siguienteNumero = sucursales.length + 1;
        const codigoGenerado = `S${siguienteNumero.toString().padStart(3, '0')}`;
        
        
        
        // Actualizar el estado del código
        setCodigoSucursal(codigoGenerado);
      } catch (error) {
        
      }
    } else if (editingItem && editingItem.codigo) {
      // Si estamos editando, usar el código existente
      
      setCodigoSucursal(editingItem.codigo);
    } else {
      // Limpiar el código si no estamos en sucursales
      
      setCodigoSucursal('');
    }
  }, [activeTab, editingItem, sucursales]);

  // Filtrar datos
  const filteredPaises = paises.filter(pais => {
    const matchesSearch = pais.nombre.toLowerCase().includes(searchPaises.toLowerCase()) ||
      (pais.codigo_iso && pais.codigo_iso?.toLowerCase().includes(searchPaises.toLowerCase()));
    // Tratar undefined/null como activos por defecto para evitar filtrar todo por error
    const isActive = pais.estado !== false; // true o undefined/null => activo
    const matchesStatus = statusPaises === 'all' ? true : statusPaises === 'active' ? isActive : pais.estado === false;
    return matchesSearch && matchesStatus;
  });

  const filteredDepartamentos = departamentos.filter(dept => {
    const matchesSearch = dept.nombre.toLowerCase().includes(searchDepartamentos.toLowerCase()) ||
      (dept.codigo_dane && dept.codigo_dane?.toLowerCase().includes(searchDepartamentos.toLowerCase()));
    
    const matchesPais = filterPaisDepartamento === 'todos' ? true : 
      dept.pais_id === parseInt(filterPaisDepartamento);
    
    // Solo mostrar departamentos de países activos
    const pais = paises.find(p => p.id === dept.pais_id);
    const paisActivo = pais?.estado === true;
    
    return matchesSearch && matchesPais && paisActivo;
  });

  const filteredCiudades = ciudades.filter(ciudad => {
    const matchesSearch = ciudad.nombre.toLowerCase().includes(searchCiudades.toLowerCase()) ||
      (ciudad.codigo_dane && ciudad.codigo_dane?.toLowerCase().includes(searchCiudades.toLowerCase()));
    
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

  // Filtrar regionales
  const filteredRegionales = (regionales || []).filter(reg => {
    const matchesSearch = (reg.nombre || '').toLowerCase().includes(searchRegionales.toLowerCase());
    const matchesStatus = statusRegionales === 'all' ? true : statusRegionales === 'active' ? reg.activo === true : reg.activo === false;
    return matchesSearch && matchesStatus;
  });

  // Filtrar sucursales
  const empresaUsuario = obtenerEmpresaSeleccionada();
  const filteredSucursales = (sucursales || []).filter(s => {
    const q = searchSucursales.toLowerCase();
    const matchSearch = (
      (s.nombre || '').toLowerCase().includes(q) ||
      (s.codigo || '').toLowerCase().includes(q) ||
      (s.direccion || '').toLowerCase().includes(q) ||
      (s.telefono || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q) ||
      (s.ciudades?.nombre || '').toLowerCase().includes(q)
    );
    const matchStatus = (statusSucursales === 'all' ? true : statusSucursales === 'active' ? s.activo === true : s.activo === false);
    // Si el usuario tiene empresa, solo mostrar sucursales de esa empresa
    const matchEmpresa = empresaUsuario ? s.empresa_id === empresaUsuario.id : true;
    return matchSearch && matchStatus && matchEmpresa;
  });

  // Obtener países únicos para filtros
  const uniquePaises = [...new Set(paises.map(p => p.id))];
  const uniqueDepartamentos = [...new Set(departamentos.map(d => d.id))];

  const handleEdit = async (item: any, type: 'pais' | 'departamento' | 'ciudad' | 'regional' | 'sucursal') => {
    try {
      startLoading();
      setEditingItem(item);
      setActiveSubTab("formulario");
      if (type === 'regional') {
        // Inicializar multi-select con asociaciones
        const current = regionalesDepartamentos
          .filter(rd => rd.regional_id === item.id)
          .map(rd => rd.departamento_id);
        setSelectedDeptosRegional(current);
      }
    } catch (error) {
      console.error('Error al editar:', error);
              toast.error("Error al cargar los datos para editar");
    } finally {
      stopLoading();
    }
  };

    const handleDelete = async (item: any, type: 'pais' | 'departamento' | 'ciudad' | 'regional' | 'sucursal') => {
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
        case 'regional':
          await ubicacionesService.deleteRegional(item.id);
          success = true;
          break;
        case 'sucursal':
          await ubicacionesService.deleteSucursal(item.id);
          success = true;
          break;
        default:
          console.error('❌ Tipo no reconocido:', type);
          return;
      }

      if (success) {
        const message = `${type === 'pais' ? 'País' : type === 'departamento' ? 'Departamento' : type === 'ciudad' ? 'Ciudad' : type === 'regional' ? 'Regional' : 'Sucursal'} eliminado correctamente`;
        toast.success(message);
        
        // Invalidar queries para refrescar datos
        queryClient.invalidateQueries({ queryKey: ['paises'] });
        queryClient.invalidateQueries({ queryKey: ['departamentos'] });
        queryClient.invalidateQueries({ queryKey: ['ciudades'] });
        queryClient.invalidateQueries({ queryKey: ['regionales'] });
        queryClient.invalidateQueries({ queryKey: ['regionales_departamentos'] });
        queryClient.invalidateQueries({ queryKey: ['sucursales'] });
      }
    } catch (error: any) {
      console.error(`❌ Error al eliminar ${type}:`, error);
      if (error?.code === '23503') {
        // Mostrar confirmación de eliminación forzada
        setForceDeleteType(type);
        setForceDeleteItem(item);
        setForceDeleteOpen(true);
      } else {
        toast.error(`Error al eliminar ${type === 'pais' ? 'el país' : type === 'departamento' ? 'el departamento' : type === 'ciudad' ? 'la ciudad' : type === 'regional' ? 'la regional' : 'la sucursal'}`);
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

  const handleActivate = async (item: any, type: 'pais' | 'departamento' | 'ciudad' | 'regional' | 'sucursal') => {
    if (!item.id) {
      console.error('❌ handleActivate: No se encontró ID del item:', item);
      return;
    }

    

    try {
      startLoading();
      let success = false;
      
      switch (type) {
        case 'pais':
          
          await ubicacionesService.activatePais(item.id);
          success = true;
          
          break;
        case 'departamento':
          
          await ubicacionesService.activateDepartamento(item.id);
          success = true;
          
          break;
        case 'ciudad':
          
          await ubicacionesService.activateCiudad(item.id);
          success = true;
          
          break;
        case 'regional':
          
          await ubicacionesService.activateRegional(item.id);
          success = true;
          
          break;
        case 'sucursal':
          
          await ubicacionesService.activateSucursal(item.id);
          success = true;
          
          break;
        default:
          console.error('❌ Tipo no reconocido:', type);
          return;
      }

      if (success) {
        const message = `${type === 'pais' ? 'País' : type === 'departamento' ? 'Departamento' : type === 'ciudad' ? 'Ciudad' : type === 'regional' ? 'Regional' : 'Sucursal'} activado correctamente`;
        
        toast.success(message);
        
        // Invalidar queries para refrescar datos
        
        queryClient.invalidateQueries({ queryKey: ['paises'] });
        queryClient.invalidateQueries({ queryKey: ['departamentos'] });
        queryClient.invalidateQueries({ queryKey: ['ciudades'] });
        queryClient.invalidateQueries({ queryKey: ['regionales'] });
        queryClient.invalidateQueries({ queryKey: ['sucursales'] });
        
      }
    } catch (error) {
      console.error(`❌ Error al activar ${type}:`, error);
      toast.error(`Error al activar ${type === 'pais' ? 'el país' : type === 'departamento' ? 'el departamento' : type === 'ciudad' ? 'la ciudad' : type === 'regional' ? 'la regional' : 'la sucursal'}`);
    } finally {
      stopLoading();
      
    }
  };

  const handleDeactivate = async (item: any, type: 'pais' | 'departamento' | 'ciudad' | 'regional' | 'sucursal') => {
    if (!item.id) {
      console.error('❌ handleDeactivate: No se encontró ID del item:', item);
      return;
    }

    

    try {
      startLoading();
      let success = false;
      
      switch (type) {
        case 'pais':
          
          await ubicacionesService.deactivatePais(item.id);
          success = true;
          
          break;
        case 'departamento':
          
          await ubicacionesService.deactivateDepartamento(item.id);
          success = true;
          
          break;
        case 'ciudad':
          
          await ubicacionesService.deactivateCiudad(item.id);
          success = true;
          
          break;
        case 'regional':
          
          await ubicacionesService.deactivateRegional(item.id);
          success = true;
          
          break;
        case 'sucursal':
          
          await ubicacionesService.deactivateSucursal(item.id);
          success = true;
          
          break;
        default:
          console.error('❌ Tipo no reconocido:', type);
          return;
      }

      if (success) {
        const message = `${type === 'pais' ? 'País' : type === 'departamento' ? 'Departamento' : type === 'ciudad' ? 'Ciudad' : type === 'regional' ? 'Regional' : 'Sucursal'} inactivado correctamente`;
        
        toast.success(message);
        
        // Invalidar queries para refrescar datos
        
        queryClient.invalidateQueries({ queryKey: ['paises'] });
        queryClient.invalidateQueries({ queryKey: ['departamentos'] });
        queryClient.invalidateQueries({ queryKey: ['ciudades'] });
        queryClient.invalidateQueries({ queryKey: ['regionales'] });
        queryClient.invalidateQueries({ queryKey: ['sucursales'] });
        
      }
    } catch (error) {
      console.error(`❌ Error al inactivar ${type}:`, error);
      toast.error(`Error al inactivar ${type === 'pais' ? 'el país' : type === 'departamento' ? 'el departamento' : type === 'ciudad' ? 'la ciudad' : type === 'regional' ? 'la regional' : 'la sucursal'}`);
    } finally {
      stopLoading();
      
    }
  };

  const handleNewItem = () => {
    setEditingItem(null);
    setCodigoSucursal('');
    setSelectedDepartamentoSucursal(null);
    setSelectedCiudadSucursal(null);
    setCiudadIdSucursal(null);
    setActiveSubTab("formulario");

    // Generar código automáticamente para nuevas sucursales
    if (activeTab === 'sucursales') {
      try {
        const siguienteNumero = sucursales.length + 1;
        const codigoGenerado = `S${siguienteNumero.toString().padStart(3, '0')}`;
        
        setCodigoSucursal(codigoGenerado);
      } catch (error) {
        
      }
    }
  };

  const handleSaved = () => {
    setActiveSubTab("listado");
    setEditingItem(null);
    // Invalidar queries para refrescar datos
    queryClient.invalidateQueries({ queryKey: ['paises'] });
    queryClient.invalidateQueries({ queryKey: ['departamentos'] });
    queryClient.invalidateQueries({ queryKey: ['ciudades'] });
    queryClient.invalidateQueries({ queryKey: ['regionales'] });
    queryClient.invalidateQueries({ queryKey: ['regionales_departamentos'] });
    queryClient.invalidateQueries({ queryKey: ['sucursales'] });
  };

  const getLoadingState = () => {
    switch (activeTab) {
      case 'paises':
        return paisesLoading;
      case 'departamentos':
        return departamentosLoading;
      case 'regionales':
        return regionalesLoading || regDepLoading;
      case 'ciudades':
        return ciudadesLoading;
      case 'sucursales':
        return sucursalesLoading;
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
      case 'regionales':
        return regionalesError;
      case 'ciudades':
        return ciudadesError;
      case 'sucursales':
        return sucursalesError;
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
      case 'regionales':
        return filteredRegionales;
      case 'ciudades':
        return filteredCiudades;
      case 'sucursales':
        return filteredSucursales;
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
      case 'regionales':
        return ['Acciones', 'Nombre', 'Departamentos', 'Estado'];
      case 'ciudades':
        return ['Acciones', 'Nombre', 'Código DANE', 'Departamento', 'País', 'Regional', 'Estado'];
      case 'sucursales':
        return ['Acciones', 'Código', 'Nombre', 'Dirección', 'Ciudad', 'Teléfono', 'Empresa', 'Estado'];
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
                 <Can action="accion-editar-pais">
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
                 </Can>
                 
                 {item.estado ? (
                   <Can action="accion-inactivar-pais">
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
                   </Can>
                 ) : (
                   <Can action="accion-activar-pais">
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
                   </Can>
                 )}
                 
                 {!item.estado && (
                   <Can action="accion-eliminar-pais">
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
                   </Can>
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
                 <Can action="accion-editar-departamento">
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
                 </Can>
                 
                 {item.estado ? (
                   <Can action="accion-inactivar-departamento">
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
                   </Can>
                 ) : (
                   <Can action="accion-activar-departamento">
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
                   </Can>
                 )}
                 
                 {!item.estado && (
                   <Can action="accion-eliminar-departamento">
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
                   </Can>
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
         const regAsoc = (regionales || []).find(r => regionalesDepartamentos.some(rd => rd.departamento_id === departamento?.id && rd.regional_id === r.id));
         return (
           <TableRow key={item.id} className="hover:bg-gray-50">
             <TableCell className="px-2 py-1">
               <div className="flex flex-row gap-1 items-center">
                 <Can action="accion-editar-ciudad">
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
                 </Can>
                 
                 {item.estado ? (
                   <Can action="accion-inactivar-ciudad">
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
                   </Can>
                 ) : (
                   <Can action="accion-activar-ciudad">
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
                   </Can>
                 )}
                 
                 {!item.estado && (
                   <Can action="accion-eliminar-ciudad">
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
                   </Can>
                 )}
               </div>
             </TableCell>
             <TableCell className="px-4 py-3 text-sm text-gray-900 font-medium">{item.nombre}</TableCell>
             <TableCell className="px-4 py-3 text-sm text-gray-500">{item.codigo_dane ?? '-'}</TableCell>
             <TableCell className="px-4 py-3 text-sm text-gray-500">{departamento?.nombre ?? '-'}</TableCell>
             <TableCell className="px-4 py-3 text-sm text-gray-500">{paisCiudad?.nombre ?? '-'}</TableCell>
             <TableCell className="px-4 py-3 text-sm text-gray-500">{regAsoc?.nombre ?? '-'}</TableCell>
             <TableCell className="px-4 py-3 text-sm">
               <Badge variant={item.estado ? "default" : "secondary"} className={item.estado ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                 {item.estado ? "Activo" : "Inactivo"}
               </Badge>
             </TableCell>
           </TableRow>
         );

      case 'regionales':
        const asociados = regionalesDepartamentos.filter(rd => rd.regional_id === item.id).map(rd => rd.departamento_id);
        const asociadosNombres = departamentos.filter(d => asociados.includes(d.id)).map(d => d.nombre);
        return (
          <TableRow key={item.id} className="hover:bg-gray-50">
            <TableCell className="px-2 py-1">
              <div className="flex flex-row gap-1 items-center">
                <Can action="accion-editar-regional">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(item, 'regional')}
                          aria-label="Editar regional"
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
                </Can>

                {item.activo ? (
                  <Can action="accion-inactivar-regional">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Inactivar regional"
                                className="h-8 w-8"
                              >
                                <Lock className="h-4 w-4 text-yellow-600 hover:text-yellow-800 transition-colors" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Inactivar regional?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción inactivará la regional "{item.nombre}" y no podrá ser usada hasta que se reactive. ¿Estás seguro?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeactivate(item, 'regional')}>
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
                  <Can action="accion-activar-regional">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Activar regional"
                                className="h-8 w-8"
                              >
                                <CheckCircle className="h-4 w-4 text-brand-lime hover:text-brand-lime/80 transition-colors" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Activar regional?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  ¿Estás seguro de que deseas activar la regional "{item.nombre}"?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleActivate(item, 'regional')}>
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
                )}

                {!item.activo && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Eliminar regional"
                              className="h-8 w-8"
                            >
                              <Trash2 className="h-4 w-4 text-rose-600 hover:text-rose-800 transition-colors" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar regional?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción eliminará la regional "{item.nombre}" y sus asociaciones de forma permanente. ¿Estás seguro?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(item, 'regional')}>
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
            <TableCell className="px-4 py-3 text-sm text-gray-500">
              {asociadosNombres.length === 0 ? '-' : asociadosNombres.join(', ')}
            </TableCell>
            <TableCell className="px-4 py-3 text-sm">
              <Badge variant={item.activo ? "default" : "secondary"} className={item.activo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                {item.activo ? 'Activo' : 'Inactivo'}
              </Badge>
            </TableCell>
          </TableRow>
        );

      case 'sucursales':
        return (
          <TableRow key={item.id} className="hover:bg-gray-50">
            <TableCell className="px-2 py-1">
              <div className="flex flex-row gap-1 items-center">
                <Can action="accion-editar-sucursal">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(item, 'sucursal')}
                          aria-label="Editar sucursal"
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
                </Can>
                {item.activo ? (
                  <Can action="accion-inactivar-sucursal">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" aria-label="Inactivar sucursal" className="h-8 w-8">
                                <Lock className="h-4 w-4 text-yellow-600 hover:text-yellow-800 transition-colors" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Inactivar sucursal?</AlertDialogTitle>
                                <AlertDialogDescription>Esta acción inactivará la sucursal "{item.nombre}". ¿Estás seguro?</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeactivate(item, 'sucursal')}>Sí, inactivar</AlertDialogAction>
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
                  <Can action="accion-activar-sucursal">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" aria-label="Activar sucursal" className="h-8 w-8">
                                <CheckCircle className="h-4 w-4 text-brand-lime hover:text-brand-lime/80 transition-colors" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Activar sucursal?</AlertDialogTitle>
                                <AlertDialogDescription>¿Deseas activar la sucursal "{item.nombre}"?</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleActivate(item, 'sucursal')}>Sí, activar</AlertDialogAction>
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
                )}

                {!item.activo && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Eliminar sucursal" className="h-8 w-8">
                              <Trash2 className="h-4 w-4 text-rose-600 hover:text-rose-800 transition-colors" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar sucursal?</AlertDialogTitle>
                              <AlertDialogDescription>Esta acción eliminará la sucursal de forma permanente. ¿Estás seguro?</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(item, 'sucursal')}>Sí, eliminar</AlertDialogAction>
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
            <TableCell className="px-4 py-3 text-sm text-gray-500">{item.codigo ?? '-'}</TableCell>
            <TableCell className="px-4 py-3 text-sm text-gray-900 font-medium">{item.nombre}</TableCell>
            <TableCell className="px-4 py-3 text-sm text-gray-500">{item.direccion ?? '-'}</TableCell>
            <TableCell className="px-4 py-3 text-sm text-gray-500">{item.ciudades?.nombre ?? '-'}</TableCell>
            <TableCell className="px-4 py-3 text-sm text-gray-500">{item.telefono ?? '-'}</TableCell>
            <TableCell className="px-4 py-3 text-sm text-gray-500">{item.empresas?.razon_social ?? '-'}</TableCell>
            <TableCell className="px-4 py-3 text-sm">
              <Badge variant={item.activo ? "default" : "secondary"} className={item.activo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                {item.activo ? 'Activo' : 'Inactivo'}
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
           <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
             <div className="relative">
               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
               <Input
                 placeholder="Buscar por nombre o código ISO..."
                 value={searchPaises}
                 onChange={(e) => setSearchPaises(e.target.value)}
                 className="pl-10 h-9 text-sm"
               />
             </div>
             <Popover open={openStatusPaises} onOpenChange={setOpenStatusPaises}>
               <PopoverTrigger asChild>
                 <Button type="button" variant="outline" role="combobox" className="h-9 justify-between text-sm">
                   {statusPaises === 'active' ? 'Solo activos' : statusPaises === 'inactive' ? 'Solo inactivos' : 'Todos'}
                   <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                 </Button>
               </PopoverTrigger>
               <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                 <Command>
                   <CommandInput placeholder="Buscar estado..." className="h-8 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none" />
                   <CommandList>
                     <CommandEmpty>Sin opciones</CommandEmpty>
                     <CommandGroup>
                       {[
                         { key: 'active', label: 'Solo activos' },
                         { key: 'inactive', label: 'Solo inactivos' },
                         { key: 'all', label: 'Todos' },
                       ].map(opt => (
                         <CommandItem value={opt.key} key={opt.key} onSelect={() => { setStatusPaises(opt.key); setOpenStatusPaises(false); }} className="cursor-pointer">
                           <Check className={cn('mr-2 h-4 w-4', statusPaises === opt.key ? 'opacity-100' : 'opacity-0')} />
                           {opt.label}
                         </CommandItem>
                       ))}
                     </CommandGroup>
                   </CommandList>
                 </Command>
               </PopoverContent>
             </Popover>
             <Button
               variant="outline"
               onClick={() => { setSearchPaises(""); setStatusPaises('active'); }}
               className="flex items-center gap-2 h-9 text-sm"
             >
               <Filter className="w-4 h-4" />
               Limpiar filtros
             </Button>
           </div>
         );

      case 'departamentos':
        return (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por nombre o código DANE..."
                value={searchDepartamentos}
                onChange={(e) => setSearchDepartamentos(e.target.value)}
                className="pl-10 h-9 text-sm"
              />
            </div>
            <Popover open={openPaisDepartamentos} onOpenChange={setOpenPaisDepartamentos}>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" role="combobox" className="h-9 justify-between text-sm">
                  {filterPaisDepartamento === 'todos' ? 'Todos los países' : (paises.find(p => p.id === parseInt(filterPaisDepartamento))?.nombre || 'País')}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Buscar país..." className="h-8 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none" />
                  <CommandList>
                    <CommandEmpty>Sin opciones</CommandEmpty>
                    <CommandGroup>
                      <CommandItem value="todos" onSelect={() => { setFilterPaisDepartamento('todos'); setOpenPaisDepartamentos(false); }} className="cursor-pointer">
                        <Check className={cn('mr-2 h-4 w-4', filterPaisDepartamento === 'todos' ? 'opacity-100' : 'opacity-0')} />
                        Todos los países
                      </CommandItem>
                      {paises.filter(p => p.estado).map(pais => (
                        <CommandItem value={pais.id.toString()} key={pais.id} onSelect={() => { setFilterPaisDepartamento(pais.id.toString()); setOpenPaisDepartamentos(false); }} className="cursor-pointer">
                          <Check className={cn('mr-2 h-4 w-4', filterPaisDepartamento === pais.id.toString() ? 'opacity-100' : 'opacity-0')} />
                          {pais.nombre}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <Popover open={openStatusDepartamentos} onOpenChange={setOpenStatusDepartamentos}>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" role="combobox" className="h-9 justify-between text-sm">
                  {statusDepartamentos === 'active' ? 'Solo activos' : statusDepartamentos === 'inactive' ? 'Solo inactivos' : 'Todos'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Buscar estado..." className="h-8 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none" />
                  <CommandList>
                    <CommandEmpty>Sin opciones</CommandEmpty>
                    <CommandGroup>
                      {[
                        { key: 'active', label: 'Solo activos' },
                        { key: 'inactive', label: 'Solo inactivos' },
                        { key: 'all', label: 'Todos' },
                      ].map(opt => (
                        <CommandItem value={opt.key} key={opt.key} onSelect={() => { setStatusDepartamentos(opt.key); setOpenStatusDepartamentos(false); }} className="cursor-pointer">
                          <Check className={cn('mr-2 h-4 w-4', statusDepartamentos === opt.key ? 'opacity-100' : 'opacity-0')} />
                          {opt.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <Button
              variant="outline"
              onClick={() => {
                setSearchDepartamentos("");
                setFilterPaisDepartamento("todos");
                setStatusDepartamentos('active');
              }}
              className="flex items-center gap-2 h-9 text-sm"
            >
              <Filter className="w-4 h-4" />
              Limpiar filtros
            </Button>
          </div>
        );

             case 'ciudades':
         return (
           <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
             <div className="relative">
               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
               <Input
                 placeholder="Buscar por nombre o código DANE..."
                 value={searchCiudades}
                 onChange={(e) => setSearchCiudades(e.target.value)}
                 className="pl-10 h-9 text-sm"
               />
             </div>
             <Popover open={openPaisCiudades} onOpenChange={setOpenPaisCiudades}>
               <PopoverTrigger asChild>
                 <Button type="button" variant="outline" role="combobox" className="h-9 justify-between text-sm">
                   {filterPaisDepartamento === 'todos' ? 'Todos los países' : (paises.find(p => p.id === parseInt(filterPaisDepartamento))?.nombre || 'País')}
                   <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                 </Button>
               </PopoverTrigger>
               <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                 <Command>
                   <CommandInput placeholder="Buscar país..." className="h-8 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none" />
                   <CommandList>
                     <CommandEmpty>Sin opciones</CommandEmpty>
                     <CommandGroup>
                       <CommandItem value="todos" onSelect={() => { setFilterPaisDepartamento('todos'); setOpenPaisCiudades(false); }} className="cursor-pointer">
                         <Check className={cn('mr-2 h-4 w-4', filterPaisDepartamento === 'todos' ? 'opacity-100' : 'opacity-0')} />
                         Todos los países
                       </CommandItem>
                       {paises.filter(p => p.estado).map(pais => (
                         <CommandItem value={pais.id.toString()} key={pais.id} onSelect={() => { setFilterPaisDepartamento(pais.id.toString()); setOpenPaisCiudades(false); }} className="cursor-pointer">
                           <Check className={cn('mr-2 h-4 w-4', filterPaisDepartamento === pais.id.toString() ? 'opacity-100' : 'opacity-0')} />
                           {pais.nombre}
                         </CommandItem>
                       ))}
                     </CommandGroup>
                   </CommandList>
                 </Command>
               </PopoverContent>
             </Popover>
             <Popover open={openDeptCiudades} onOpenChange={setOpenDeptCiudades}>
               <PopoverTrigger asChild>
                 <Button type="button" variant="outline" role="combobox" className="h-9 justify-between text-sm">
                   {filterDepartamentoCiudad === 'todos' ? 'Departamento' : (departamentos.find(d => d.id === parseInt(filterDepartamentoCiudad))?.nombre || 'Departamento')}
                   <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                 </Button>
               </PopoverTrigger>
               <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                 <Command>
                   <CommandInput placeholder="Buscar departamento..." className="h-8 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none" />
                   <CommandList>
                     <CommandEmpty>Sin opciones</CommandEmpty>
                     <CommandGroup>
                       <CommandItem value="todos" onSelect={() => { setFilterDepartamentoCiudad('todos'); setOpenDeptCiudades(false); }} className="cursor-pointer">
                         <Check className={cn('mr-2 h-4 w-4', filterDepartamentoCiudad === 'todos' ? 'opacity-100' : 'opacity-0')} />
                         Departamentos
                       </CommandItem>
                       {departamentos
                         .filter(dept => {
                           if (!dept.estado) return false;
                           if (filterPaisDepartamento !== 'todos') {
                             return dept.pais_id === parseInt(filterPaisDepartamento);
                           }
                           return true;
                         })
                         .map(dept => (
                           <CommandItem value={dept.id.toString()} key={dept.id} onSelect={() => { setFilterDepartamentoCiudad(dept.id.toString()); setOpenDeptCiudades(false); }} className="cursor-pointer">
                             <Check className={cn('mr-2 h-4 w-4', filterDepartamentoCiudad === dept.id.toString() ? 'opacity-100' : 'opacity-0')} />
                             {dept.nombre}
                           </CommandItem>
                         ))}
                     </CommandGroup>
                   </CommandList>
                 </Command>
               </PopoverContent>
             </Popover>
             <Popover open={openStatusCiudades} onOpenChange={setOpenStatusCiudades}>
               <PopoverTrigger asChild>
                 <Button type="button" variant="outline" role="combobox" className="h-9 justify-between text-sm">
                   {statusCiudades === 'active' ? 'Solo activos' : statusCiudades === 'inactive' ? 'Solo inactivos' : 'Todos'}
                   <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                 </Button>
               </PopoverTrigger>
               <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                 <Command>
                   <CommandInput placeholder="Buscar estado..." className="h-8 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none" />
                   <CommandList>
                     <CommandEmpty>Sin opciones</CommandEmpty>
                     <CommandGroup>
                       {[
                         { key: 'active', label: 'Solo activos' },
                         { key: 'inactive', label: 'Solo inactivos' },
                         { key: 'all', label: 'Todos' },
                       ].map(opt => (
                         <CommandItem value={opt.key} key={opt.key} onSelect={() => { setStatusCiudades(opt.key); setOpenStatusCiudades(false); }} className="cursor-pointer">
                           <Check className={cn('mr-2 h-4 w-4', statusCiudades === opt.key ? 'opacity-100' : 'opacity-0')} />
                           {opt.label}
                         </CommandItem>
                       ))}
                     </CommandGroup>
                   </CommandList>
                 </Command>
               </PopoverContent>
             </Popover>
             <Button
               variant="outline"
               onClick={() => {
                 setSearchCiudades("");
                 setFilterPaisDepartamento("todos");
                 setFilterDepartamentoCiudad("todos");
                 setStatusCiudades('active');
               }}
               className="flex items-center gap-2 h-9 text-sm"
             >
               <Filter className="w-4 h-4" />
               Limpiar filtros
             </Button>
           </div>
         );

      case 'regionales':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por nombre..."
                value={searchRegionales}
                onChange={(e) => setSearchRegionales(e.target.value)}
                className="pl-10 h-9 text-sm"
              />
            </div>
            <Popover open={openStatusRegionales} onOpenChange={setOpenStatusRegionales}>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" role="combobox" className="h-9 justify-between text-sm">
                  {statusRegionales === 'active' ? 'Solo activos' : statusRegionales === 'inactive' ? 'Solo inactivos' : 'Todos'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Buscar estado..." className="h-8 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none" />
                  <CommandList>
                    <CommandEmpty>Sin opciones</CommandEmpty>
                    <CommandGroup>
                      {[
                        { key: 'active', label: 'Solo activos' },
                        { key: 'inactive', label: 'Solo inactivos' },
                        { key: 'all', label: 'Todos' },
                      ].map(opt => (
                        <CommandItem value={opt.key} key={opt.key} onSelect={() => { setStatusRegionales(opt.key); setOpenStatusRegionales(false); }} className="cursor-pointer">
                          <Check className={cn('mr-2 h-4 w-4', statusRegionales === opt.key ? 'opacity-100' : 'opacity-0')} />
                          {opt.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <Button
              variant="outline"
              onClick={() => { setSearchRegionales(""); setStatusRegionales('active'); }}
              className="flex items-center gap-2 h-9 text-sm"
            >
              <Filter className="w-4 h-4" />
              Limpiar filtros
            </Button>
          </div>
        );

      case 'sucursales':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por código, nombre, dirección, teléfono o email..."
                value={searchSucursales}
                onChange={(e) => setSearchSucursales(e.target.value)}
                className="pl-10 h-9 text-sm"
              />
            </div>
            <Popover open={openStatusSucursales} onOpenChange={setOpenStatusSucursales}>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" role="combobox" className="h-9 justify-between text-sm">
                  {statusSucursales === 'active' ? 'Solo activos' : statusSucursales === 'inactive' ? 'Solo inactivos' : 'Todos'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Buscar estado..." className="h-8 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none" />
                  <CommandList>
                    <CommandEmpty>Sin opciones</CommandEmpty>
                    <CommandGroup>
                      {[
                        { key: 'active', label: 'Solo activos' },
                        { key: 'inactive', label: 'Solo inactivos' },
                        { key: 'all', label: 'Todos' },
                      ].map(opt => (
                        <CommandItem value={opt.key} key={opt.key} onSelect={() => { setStatusSucursales(opt.key); setOpenStatusSucursales(false); }} className="cursor-pointer">
                          <Check className={cn('mr-2 h-4 w-4', statusSucursales === opt.key ? 'opacity-100' : 'opacity-0')} />
                          {opt.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <Button
              variant="outline"
              onClick={() => { setSearchSucursales(""); setStatusSucursales('active'); }}
              className="flex items-center gap-2 h-9 text-sm"
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
        return (
          <Can action={editingItem ? "accion-actualizar-pais" : "accion-crear-pais"}>
            <PaisForm initialData={editingItem} onSaved={handleSaved} />
          </Can>
        );
      case 'departamentos':
        return (
          <Can action={editingItem ? "accion-actualizar-departamento" : "accion-crear-departamento"}>
            <DepartamentoForm initialData={editingItem} paises={paises} onSaved={handleSaved} />
          </Can>
        );
      case 'regionales': {
        // Opciones para multiselect
        const deptOptions: MultiSelectOption[] = departamentos.map(d => ({ id: d.id, value: String(d.id), label: d.nombre }));
        const onSubmitRegional = async (e: React.FormEvent) => {
          e.preventDefault();
          try {
            startLoading();
            // Validación: departamentos únicos por regional
            const ocupados = new Map<number, number>();
            regionalesDepartamentos.forEach(rd => {
              ocupados.set(rd.departamento_id, rd.regional_id);
            });
            const conflictos = selectedDeptosRegional.filter(depId => ocupados.has(depId) && ocupados.get(depId) !== (editingItem?.id || null));
            if (conflictos.length > 0) {
              const nombres = departamentos.filter(d => conflictos.includes(d.id)).map(d => d.nombre).join(', ');
              toast.error(`Los siguientes departamentos ya están asociados a otra regional: ${nombres}`);
              setRegionalError(`Los siguientes departamentos ya están asociados a otra regional: ${nombres}`);
              stopLoading();
              return;
            }
            setRegionalError(null);
            let regionalId: number | null = null;
            if (editingItem?.id) {
              const updated = await ubicacionesService.updateRegional(editingItem.id, { nombre: (document.getElementById('regional-nombre') as HTMLInputElement)?.value });
              regionalId = updated?.id || editingItem.id;
            } else {
              const created = await ubicacionesService.createRegional({ nombre: (document.getElementById('regional-nombre') as HTMLInputElement)?.value });
              regionalId = created?.id || null;
            }
            if (regionalId) {
              await ubicacionesService.setDepartamentosForRegional(regionalId, selectedDeptosRegional);
            }
            toast.success('Regional guardada correctamente');
            setEditingItem(null);
            setSelectedDeptosRegional([]);
            handleSaved();
          } catch (err: any) {
            logError('UbicacionesPage - Regional', err);
            const errorMessage = handleServiceError(err, 'Error al guardar la regional', 'la regional');
            toast.error(errorMessage);
            // Si es un error de departamento duplicado, también actualizar el estado de error
            if (err?.code === '23505' || errorMessage.includes('departamento')) {
              setRegionalError(errorMessage);
            } else {
              setRegionalError(null);
            }
          } finally {
            stopLoading();
          }
        };
        return (
          <Can action={editingItem ? "accion-actualizar-regional" : "accion-crear-regional"}>
            <form onSubmit={onSubmitRegional} className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1">
                <label className="block text-sm font-medium mb-1">Nombre de la Regional *</label>
                <Input id="regional-nombre" defaultValue={editingItem?.nombre || ''} placeholder="Ej: Región Andina" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Departamentos asociados</label>
                <MultiSelect
                  options={deptOptions}
                  selected={selectedDeptosRegional}
                  onSelectionChange={setSelectedDeptosRegional}
                  placeholder="Seleccionar departamentos..."
                  emptyText="No hay departamentos"
                />
                {regionalError && (
                  <div className="mt-3">
                    <Alert variant="destructive">
                      <AlertTitle>No se puede guardar</AlertTitle>
                      <AlertDescription>{regionalError}</AlertDescription>
                    </Alert>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleSaved}>Cancelar</Button>
              <Button type="submit">Guardar</Button>
            </div>
          </form>
          </Can>
        );
      }
      case 'ciudades':
        return (
          <Can action={editingItem ? "accion-actualizar-ciudad" : "accion-crear-ciudad"}>
            <CiudadForm initialData={editingItem} departamentos={departamentos} paises={paises} onSaved={handleSaved} />
          </Can>
        );
      case 'sucursales': {
        const onSubmitSucursal = async (e: React.FormEvent) => {
          e.preventDefault();
          try {
            startLoading();
            // Usar la empresa del usuario si está autenticado con empresa
            const empresaUsuario = obtenerEmpresaSeleccionada();
            const payload = {
              codigo: codigoSucursal || undefined,
              nombre: (document.getElementById('suc-nombre') as HTMLInputElement)?.value || '',
              direccion: (document.getElementById('suc-direccion') as HTMLInputElement)?.value || undefined,
              telefono: (document.getElementById('suc-telefono') as HTMLInputElement)?.value || undefined,
              email: (document.getElementById('suc-email') as HTMLInputElement)?.value || undefined,
              ciudad_id: ciudadIdSucursal,
              empresa_id: empresaUsuario ? empresaUsuario.id : selectedEmpresaSucursal,
            };
            
            
            if (editingItem?.id) {
              await ubicacionesService.updateSucursal(editingItem.id, payload);
            } else {
              await ubicacionesService.createSucursal(payload);
            }
            toast.success('Sucursal guardada correctamente');
            setEditingItem(null);
            setCodigoSucursal('');
            setSelectedDepartamentoSucursal(null);
            setSelectedCiudadSucursal(null);
            setCiudadIdSucursal(null);
            setSelectedEmpresaSucursal(null);
            handleSaved();
          } catch (err) {
            logError('UbicacionesPage - Sucursal', err);
            const errorMessage = handleServiceError(err, 'Error al guardar la sucursal', 'la sucursal');
            toast.error(errorMessage);
          } finally {
            stopLoading();
          }
        };
        return (
          <Can action={editingItem ? "accion-actualizar-sucursal" : "accion-crear-sucursal"}>
            <form onSubmit={onSubmitSucursal} className="space-y-6">
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Código</label>
                <Input 
                  id="suc-codigo" 
                  value={codigoSucursal} 
                  className="text-sm bg-gray-50 border-gray-300 text-gray-700 font-mono cursor-not-allowed" 
                  readOnly
                  placeholder="Se genera automáticamente"
                />
              </div>
              <div className="col-span-4">
                <label className="block text-sm font-medium mb-1">Nombre *</label>
                <Input id="suc-nombre" defaultValue={editingItem?.nombre || ''} />
              </div>
              <div className="col-span-3">
                <label className="block text-sm font-medium mb-1">Empresa / Cliente</label>
                <Select 
                  value={empresaUsuario ? empresaUsuario.id.toString() : (selectedEmpresaSucursal ? selectedEmpresaSucursal.toString() : undefined)} 
                  onValueChange={(value) => setSelectedEmpresaSucursal(value ? parseInt(value) : null)}
                  disabled={!!empresaUsuario}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {empresas.map(empresa => (
                      <SelectItem key={empresa.id} value={empresa.id.toString()}>
                        {empresa.razon_social}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-3">
                <label className="block text-sm font-medium mb-1">Departamento *</label>
                <Popover open={openDepartamentoSucursal} onOpenChange={setOpenDepartamentoSucursal}>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" role="combobox" className="w-full justify-between">
                      {(() => {
                        const selectedDepto = departamentos.find(d => d.id === selectedDepartamentoSucursal);
                        return selectedDepto ? selectedDepto.nombre : 'Seleccionar departamento';
                      })()}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar departamento..." className="h-9 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none" />
                      <CommandList>
                        <CommandEmpty>No se encontraron departamentos.</CommandEmpty>
                        <CommandGroup>
                          {departamentos.filter(d => d.estado).map((d) => (
                            <CommandItem
                              key={d.id}
                              onSelect={() => {
                                setSelectedDepartamentoSucursal(d.id);
                                setSelectedCiudadSucursal(null);
                                setCiudadIdSucursal(null);
                                setOpenDepartamentoSucursal(false);
                              }}
                              className="cursor-pointer"
                            >
                              <Check className={cn('mr-2 h-4 w-4', selectedDepartamentoSucursal === d.id ? 'opacity-100' : 'opacity-0')} />
                              {d.nombre}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-3">
                <label className="block text-sm font-medium mb-1">Ciudad *</label>
                <Popover open={openCiudadSucursal} onOpenChange={setOpenCiudadSucursal}>
                  <PopoverTrigger asChild>
                    <Button 
                      type="button" 
                      variant="outline" 
                      role="combobox" 
                      className="w-full justify-between"
                      disabled={!selectedDepartamentoSucursal}
                    >
                      {(() => {
                        const ciudadId = selectedCiudadSucursal || editingItem?.ciudad_id;
                        const sc = ciudades.find(c => c.id === ciudadId);
                        return sc ? sc.nombre : selectedDepartamentoSucursal ? 'Seleccionar ciudad' : 'Seleccione un departamento primero';
                      })()}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar ciudad..." className="h-9 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none" />
                      <CommandList>
                        <CommandEmpty>No se encontraron ciudades.</CommandEmpty>
                        <CommandGroup>
                          {ciudades
                            .filter(c => c.departamento_id === selectedDepartamentoSucursal)
                            .map((c) => (
                            <CommandItem
                              key={c.id}
                              onSelect={() => {
                                setSelectedCiudadSucursal(c.id);
                                setCiudadIdSucursal(c.id);
                                setOpenCiudadSucursal(false);
                              }}
                              className="cursor-pointer"
                            >
                              <Check className={cn('mr-2 h-4 w-4', (selectedCiudadSucursal || editingItem?.ciudad_id) === c.id ? 'opacity-100' : 'opacity-0')} />
                              {c.nombre}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="col-span-3">
                <label className="block text-sm font-medium mb-1">Dirección</label>
                <Input id="suc-direccion" defaultValue={editingItem?.direccion || ''} />
              </div>
              <div className="col-span-3">
                <label className="block text-sm font-medium mb-1">Teléfono</label>
                <Input id="suc-telefono" defaultValue={editingItem?.telefono || ''} />
              </div>
              <div className="col-span-3">
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input id="suc-email" defaultValue={editingItem?.email || ''} />
              </div>
              <div className="col-span-3">
                {/* Espacio vacío para alineación */}
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleSaved}>Cancelar</Button>
              <Button type="submit">Guardar</Button>
            </div>
          </form>
          </Can>
        );
      }
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
      case 'regionales':
        return <Users className="w-8 h-8 text-cyan-600" />;
      case 'ciudades':
        return <Building2 className="w-8 h-8 text-cyan-600" />;
      case 'sucursales':
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
      case 'regionales':
        return 'Gestión de Regionales';
      case 'ciudades':
        return 'Gestión de Ciudades';
      case 'sucursales':
        return 'Gestión de Sucursales';
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
      case 'regionales':
        return 'REGIONALES DEL SISTEMA';
      case 'ciudades':
        return 'CIUDADES DEL SISTEMA';
      case 'sucursales':
        return 'SUCURSALES DEL SISTEMA';
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
      case 'regionales':
        return <Users className="w-5 h-5 text-orange-600" />;
      case 'ciudades':
        return <Building2 className="w-5 h-5 text-orange-600" />;
      case 'sucursales':
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
        <TabsList className="grid w-full grid-cols-5 bg-cyan-100/60 p-1 rounded-lg">
          <Can action="vista-paises">
            <TabsTrigger
              value="paises"
              className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300 flex items-center justify-center w-full h-full py-2 px-3"
            >
              <Globe className="w-4 h-4 mr-2" />
              Países
            </TabsTrigger>
          </Can>
          <Can action="vista-departamentos">
            <TabsTrigger
              value="departamentos"
              className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300 flex items-center justify-center w-full h-full py-2 px-3"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Departamentos
            </TabsTrigger>
          </Can>
          <Can action="vista-regionales">
            <TabsTrigger
              value="regionales"
              className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300 flex items-center justify-center w-full h-full py-2 px-3"
            >
              <Users className="w-4 h-4 mr-2" />
              Regionales
            </TabsTrigger>
          </Can>
          <Can action="vista-ciudades">
            <TabsTrigger
              value="ciudades"
              className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300 flex items-center justify-center w-full h-full py-2 px-3"
            >
              <Building2 className="w-4 h-4 mr-2" />
              Ciudades
            </TabsTrigger>
          </Can>
          <Can action="vista-sucursales">
            <TabsTrigger
              value="sucursales"
              className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300 flex items-center justify-center w-full h-full py-2 px-3"
            >
              <Building2 className="w-4 h-4 mr-2" />
              Sucursales
            </TabsTrigger>
          </Can>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {(() => {
            const getPermissionForTab = (tab: string) => {
              switch (tab) {
                case 'paises': return 'vista-paises';
                case 'departamentos': return 'vista-departamentos';
                case 'regionales': return 'vista-regionales';
                case 'ciudades': return 'vista-ciudades';
                case 'sucursales': return 'vista-sucursales';
                default: return 'vista-paises';
              }
            };

            return (
              <Can action={getPermissionForTab(activeTab)}>
                <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-cyan-100/60 p-1 rounded-lg">
              <TabsTrigger
                value="listado"
                      className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300 flex items-center justify-center w-full h-full py-2 px-3"
              >
                Listado de {activeTab === 'paises' ? 'Países' : activeTab === 'departamentos' ? 'Departamentos' : activeTab === 'regionales' ? 'Regionales' : activeTab === 'ciudades' ? 'Ciudades' : 'Sucursales'}
              </TabsTrigger>
              <TabsTrigger
                value="formulario"
                      className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300 flex items-center justify-center w-full h-full py-2 px-3"
              >
                {editingItem ? 'Editar' : 'Nuevo'} {activeTab === 'paises' ? 'País' : activeTab === 'departamentos' ? 'Departamento' : activeTab === 'regionales' ? 'Regional' : activeTab === 'ciudades' ? 'Ciudad' : 'Sucursal'}
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
                    <Can action="accion-crear-ubicacion">
                      <Button
                        onClick={handleNewItem}
                        className="bg-teal-400 hover:bg-teal-500 text-white text-xs px-3 py-1"
                        size="sm"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Registro
                      </Button>
                    </Can>
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
                        : activeTab === 'regionales'
                        ? 'Configura regionales y selecciona los departamentos asociados.'
                        : activeTab === 'ciudades'
                        ? 'Solo se muestran ciudades de departamentos y países activos.'
                        : 'Gestiona sucursales y asigna su ciudad correspondiente.'
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
                        <p className="mt-4 text-gray-600">Cargando {activeTab === 'paises' ? 'países' : activeTab === 'departamentos' ? 'departamentos' : activeTab === 'regionales' ? 'regionales' : activeTab === 'ciudades' ? 'ciudades' : 'sucursales'}...</p>
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
                                  No hay {activeTab === 'paises' ? 'países' : activeTab === 'departamentos' ? 'departamentos' : activeTab === 'regionales' ? 'regionales' : activeTab === 'ciudades' ? 'ciudades' : 'sucursales'} disponibles.
                                </p>
                                <p className="text-sm">
                                  {activeTab === 'paises' 
                                    ? 'Todos los países están inactivos o no se encontraron coincidencias con los filtros.'
                                    : activeTab === 'departamentos'
                                    ? 'No hay departamentos activos o todos los países están inactivos.'
                                    : activeTab === 'regionales'
                                    ? 'No hay regionales activas o todos los departamentos están inactivos.'
                                    : activeTab === 'ciudades'
                                    ? 'No hay ciudades activas o todos los departamentos/países están inactivos.'
                                    : 'No hay sucursales activas o todos los departamentos/países están inactivos.'
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
                  {editingItem ? 'Editar' : 'Nuevo'} {activeTab === 'paises' ? 'País' : activeTab === 'departamentos' ? 'Departamento' : activeTab === 'regionales' ? 'Regional' : activeTab === 'ciudades' ? 'Ciudad' : 'Sucursal'}
                </h2>
              </div>

              {/* Formulario envuelto en Card */}
              <Card>
                <CardContent className="pt-6">
                  {renderForm()}
                </CardContent>
              </Card>
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
              </Can>
            );
          })()}
        </TabsContent>
      </Tabs>
    </div>
  );
} 


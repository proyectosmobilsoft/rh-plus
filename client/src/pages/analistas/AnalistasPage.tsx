import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Download,
  UserCheck,
  BarChart3,
  Users,
  Eye,
  CheckCircle,
  Lock,
  User,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { analystsService, Analyst } from '@/services/analystsService';
import { testConnection, testAnalistas } from '@/services/testConnection';
import { empresasService } from '@/services/empresasService';
import { asociacionPrioridadService, AnalistaPrioridad } from '@/services/asociacionPrioridadService';
import { supabase } from '@/services/supabaseClient';
import { useLoading } from '@/contexts/LoadingContext';
import { useToast } from '@/hooks/use-toast';
import { AnalistaForm } from '@/components/analistas/AnalistaForm';

export default function AnalistasPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("analistas");
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEmpresa, setFilterEmpresa] = useState('todas');
  const [filterSucursal, setFilterSucursal] = useState('todas');
  const [filterEstado, setFilterEstado] = useState('activo');
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [selectedAnalista, setSelectedAnalista] = useState<any>(null);
  const [analistaParaConfigurar, setAnalistaParaConfigurar] = useState<any>(null);
  const queryClient = useQueryClient();
  const { startLoading, stopLoading } = useLoading();
  const { toast } = useToast();

  // Usar React Query para cargar analistas con prioridades
  const { data: analistasConPrioridades = [], isLoading, error } = useQuery({
    queryKey: ['analistas-prioridades'],
    queryFn: async () => {
      try {
        // Primero probar la conexión
        console.log('🔍 Iniciando test de conexión...');
        const connectionTest = await testConnection();
        console.log('Resultado test conexión:', connectionTest);
        
        if (!connectionTest.success) {
          throw new Error('No se pudo conectar a Supabase');
        }
        
        // Cargar analistas con sus prioridades
        console.log('🔍 Cargando analistas con prioridades...');
        const data = await asociacionPrioridadService.getAnalistasWithPriorities();
        console.log('Analistas con prioridades cargados:', data);
        
        return data || [];
      } catch (error) {
        console.error('Error cargando analistas con prioridades:', error);
        toast({
          title: "❌ Error",
          description: "Error al cargar analistas de Supabase",
          variant: "destructive"
        });
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Cargar empresas para el filtro
  const { data: empresas = [] } = useQuery({
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

  // Cargar sucursales para el filtro
  const { data: sucursales = [] } = useQuery({
    queryKey: ['sucursales'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('gen_sucursales')
          .select('id, nombre')
          .order('nombre');
        
        if (error) {
          console.error('Error cargando sucursales:', error);
          return [];
        }
        
        return data || [];
      } catch (error) {
        console.error('Error cargando sucursales:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Los datos ya vienen mapeados del servicio de asociación de prioridades
  const analistasMapeados = analistasConPrioridades;

  // Aplicar filtros usando useMemo para mejor rendimiento
  const filteredAnalistas = React.useMemo(() => {
    let filtered = analistasMapeados;

    // Filtro de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(analista =>
        analista.usuario_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        analista.usuario_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (analista.empresa_nombre && analista.empresa_nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (analista.empresa_nit && analista.empresa_nit.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filtro por empresa
    if (filterEmpresa !== 'todas') {
      filtered = filtered.filter(analista => analista.empresa_id === parseInt(filterEmpresa));
    }

    // Filtro por sucursal
    if (filterSucursal !== 'todas') {
      filtered = filtered.filter(analista => analista.sucursal_id === parseInt(filterSucursal));
    }

    // Filtro por estado (no aplicable directamente, ya que no tenemos campo activo en AnalistaPrioridad)
    // Se podría implementar consultando la tabla gen_usuarios si es necesario

    return filtered;
  }, [analistasMapeados, searchTerm, filterEmpresa, filterSucursal, filterEstado]);

  const handleEliminarAnalista = (analista: AnalistaPrioridad) => {
    setSelectedAnalista(analista);
    setShowDeleteModal(true);
  };

  const confirmEliminarAnalista = async () => {
    if (!selectedAnalista) return;
    
    try {
      startLoading();
      await analystsService.remove(selectedAnalista.usuario_id);
      toast({
        title: "✅ Éxito",
        description: "Analista eliminado correctamente",
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: ['analistas-prioridades'] });
      setShowDeleteModal(false);
      setSelectedAnalista(null);
    } catch (error: any) {
      console.error('Error eliminando analista:', error);
      toast({
        title: "❌ Error",
        description: error.message || "Error al eliminar analista",
        variant: "destructive"
      });
    } finally {
      stopLoading();
    }
  };

  const handleActivateAnalista = (analista: AnalistaPrioridad) => {
    setSelectedAnalista(analista);
    setShowActivateModal(true);
  };

  const confirmActivateAnalista = async () => {
    if (!selectedAnalista) return;
    
    try {
      startLoading();
      await analystsService.activate(selectedAnalista.usuario_id);
      toast({
        title: "✅ Éxito",
        description: "Analista activado correctamente",
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: ['analistas-prioridades'] });
      setShowActivateModal(false);
      setSelectedAnalista(null);
    } catch (error: any) {
      console.error('Error activando analista:', error);
      toast({
        title: "❌ Error",
        description: error.message || "Error al activar analista",
        variant: "destructive"
      });
    } finally {
      stopLoading();
    }
  };

  const handleDeactivateAnalista = (analista: AnalistaPrioridad) => {
    setSelectedAnalista(analista);
    setShowDeactivateModal(true);
  };

  const confirmDeactivateAnalista = async () => {
    if (!selectedAnalista) return;
    
    try {
      startLoading();
      await analystsService.deactivate(selectedAnalista.usuario_id);
      toast({
        title: "✅ Éxito",
        description: "Analista desactivado correctamente",
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: ['analistas-prioridades'] });
      setShowDeactivateModal(false);
      setSelectedAnalista(null);
    } catch (error: any) {
      console.error('Error desactivando analista:', error);
      toast({
        title: "❌ Error",
        description: error.message || "Error al desactivar analista",
        variant: "destructive"
      });
    } finally {
      stopLoading();
    }
  };

  const handleExportarExcel = async () => {
    try {
      // Importar xlsx dinámicamente para evitar problemas de SSR
      const XLSX = await import('xlsx');
      
      const fecha = new Date().toLocaleDateString('es-ES');
      const fechaHora = new Date().toLocaleString('es-ES');
      
                    // Preparar los datos para Excel con diseño limpio
       const excelData = [
         // Fila de título principal
         ['ANALISTAS DEL SISTEMA'],
         [], // Fila vacía
                 // Headers de la tabla (SIN ICONOS)
        [
          'Analista',
          'Email', 
          'Nivel 1',
          'Nivel 2',
          'Nivel 3',
          'Solicitudes',
          'Cliente',
          'NIT',
          'Sucursal'
        ],
         // Datos de los analistas (SIN ICONOS en estados)
         ...filteredAnalistas.map(analista => [
           analista.usuario_nombre || 'No especificado',
           analista.usuario_email || 'No especificado',
           analista.nivel_prioridad_1 ? 'Sí' : 'No',
           analista.nivel_prioridad_2 ? 'Sí' : 'No',
           analista.nivel_prioridad_3 ? 'Sí' : 'No',
           analista.cantidad_solicitudes || 0,
           analista.empresa_nombre || 'Sin asignar',
           analista.empresa_nit || '-',
           analista.empresa_direccion || '-'
         ])
       ];

      // Crear el workbook y worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(excelData);

      // Configurar el ancho de las columnas
      const colWidths = [
        { wch: 25 }, // Analista
        { wch: 30 }, // Email
        { wch: 10 }, // Nivel 1
        { wch: 10 }, // Nivel 2
        { wch: 10 }, // Nivel 3
        { wch: 12 }, // Solicitudes
        { wch: 30 }, // Cliente
        { wch: 15 }, // NIT
        { wch: 25 }  // Sucursal
      ];
      ws['!cols'] = colWidths;

       // Estilo para el título principal (primera fila) - VERDE CLARO
       if (ws['A1']) {
         ws['A1'].s = {
           font: { bold: true, size: 16, color: { rgb: "000000" } },
           fill: { fgColor: { rgb: "90EE90" } }, // Verde claro como en la imagen
           alignment: { horizontal: "center", vertical: "center" }
         };
       }

       // Estilo para los headers (fila 3) - VERDE CLARO COMO EL TÍTULO
       const headerRow = 3;
       const headerCols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
       headerCols.forEach(col => {
         const cellRef = col + headerRow;
         if (ws[cellRef]) {
           ws[cellRef].s = {
             font: { bold: true, size: 12, color: { rgb: "000000" } },
             fill: { fgColor: { rgb: "90EE90" } }, // Verde claro igual al título
             alignment: { horizontal: "center", vertical: "center" },
             border: {
               top: { style: "thin", color: { rgb: "C0C0C0" } },
               bottom: { style: "thin", color: { rgb: "C0C0C0" } },
               left: { style: "thin", color: { rgb: "C0C0C0" } },
               right: { style: "thin", color: { rgb: "C0C0C0" } }
             }
           };
         }
       });

       // Estilo para las filas de datos (TODAS BLANCAS SIN COLORES ALTERNADOS)
       const dataStartRow = 4;
       const dataEndRow = dataStartRow + filteredAnalistas.length - 1;
       
       for (let row = dataStartRow; row <= dataEndRow; row++) {
         headerCols.forEach(col => {
           const cellRef = col + row;
           if (ws[cellRef]) {
             ws[cellRef].s = {
               font: { size: 11, color: { rgb: "000000" } }, // Texto negro
               fill: { fgColor: { rgb: "FFFFFF" } }, // Fondo blanco
               alignment: { horizontal: "left" }, // Alineación a la izquierda como en la imagen
               border: {
                 top: { style: "thin", color: { rgb: "C0C0C0" } },
                 bottom: { style: "thin", color: { rgb: "C0C0C0" } },
                 left: { style: "thin", color: { rgb: "C0C0C0" } },
                 right: { style: "thin", color: { rgb: "C0C0C0" } }
               }
             };
           }
         });
       }

                    // Mergear celdas para mejor presentación
       ws['!merges'] = [
         { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } } // Mergear título principal (9 columnas)
       ];

      // Agregar la hoja al workbook
      XLSX.utils.book_append_sheet(wb, ws, "Analistas");

      // Generar el archivo Excel como buffer
      const excelBuffer = XLSX.write(wb, { 
        bookType: 'xlsx', 
        type: 'array',
        compression: true 
      });

      // Crear blob con el buffer
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });

      // Crear URL para el blob
      const url = URL.createObjectURL(blob);
      
      // Crear nombre del archivo
      const fileName = `analistas_${new Date().toISOString().split('T')[0]}.xlsx`;

             // Descargar el archivo directamente
       const link = document.createElement('a');
       link.href = url;
       link.download = fileName;
       link.style.display = 'none';
       document.body.appendChild(link);
       link.click();
       document.body.removeChild(link);
       
       // Limpiar la URL después de un tiempo
       setTimeout(() => {
         URL.revokeObjectURL(url);
       }, 5000);
       
       toast({
         title: "✅ Éxito",
         description: `Archivo Excel "${fileName}" descargado correctamente`,
         variant: "default"
       });
      
    } catch (error) {
      console.error('Error exportando analistas a Excel:', error);
      toast({
        title: "❌ Error",
        description: "Error al exportar la lista de analistas a Excel",
        variant: "destructive"
      });
    }
  };

  const handleNewAnalista = (analista?: any) => {
    console.log('handleNewAnalista llamado con:', analista);
    if (analista) {
      console.log('Configurando analista:', analista);
      setAnalistaParaConfigurar(analista);
    }
    setActiveTab("registro");
  };

  const handleEdit = (analista: AnalistaPrioridad) => {
    // TODO: Implementar edición inline o navegación
    navigate(`/analistas/${analista.usuario_id}/editar`, { replace: true });
    window.location.reload();
  };

  const handleView = (analista: AnalistaPrioridad) => {
    toast({
      title: "ℹ️ Información",
      description: "Vista de detalles no implementada aún",
      variant: "default"
    });
  };

  const getNivelBadge = (nivel: string) => {
    const badges = {
      alto: <Badge variant="destructive">Alto</Badge>,
      medio: <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Medio</Badge>,
      bajo: <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Bajo</Badge>,
    };
    return badges[nivel as keyof typeof badges] || <Badge variant="outline">{nivel}</Badge>;
  };

  const getEstadoBadge = (estado: string) => {
    const badges = {
      activo: <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Activo</Badge>,
      inactivo: <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Inactivo</Badge>,
    };
    return badges[estado as keyof typeof badges] || <Badge variant="outline">{estado}</Badge>;
  };

  // Función para determinar el color del badge según el valor de la prioridad
  const getPrioridadBadgeClass = (valor: string) => {
    switch (valor) {
      case 'cliente':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'sucursal':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'solicitudes':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };



  return (
    <div className="p-4 max-w-full mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-extrabold text-cyan-800 flex items-center gap-2 mb-2">
          <Users className="w-8 h-8 text-cyan-600" />
          Gestión de Analistas
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                 <TabsList className="grid w-full grid-cols-2 bg-cyan-100/60 p-1 rounded-lg">
           <TabsTrigger
             value="analistas"
             className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
           >
             Listado de Analistas
           </TabsTrigger>
                       <TabsTrigger
              value="registro"
              disabled
              className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300 opacity-50 cursor-not-allowed"
            >
              Asociación Prioridad de Analista
            </TabsTrigger>
         </TabsList>

        <TabsContent value="analistas" className="mt-6">
          {/* Header similar al diseño de empresas */}
          <div className="bg-white rounded-lg border">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                  <Users className="w-5 h-5 text-orange-600" />
                </div>
                <span className="text-lg font-semibold text-gray-700">ANALISTAS DEL SISTEMA</span>
              </div>
                             <div className="flex space-x-2">
                 <Button
                   onClick={handleExportarExcel}
                   variant="outline"
                   className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200 text-xs px-3 py-1"
                   size="sm"
                 >
                   <Download className="w-4 h-4 mr-1" />
                   Exportar Excel
                 </Button>
               </div>
            </div>

            {/* Filtros */}
            <div className="p-4 border-b bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por nombre, email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={filterEmpresa} onValueChange={setFilterEmpresa}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todos los clientes</SelectItem>
                    {empresas.map(empresa => (
                      <SelectItem key={empresa.id} value={empresa.id.toString()}>
                        {empresa.razon_social || empresa.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterSucursal} onValueChange={setFilterSucursal}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por sucursal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas las sucursales</SelectItem>
                    {sucursales.map(sucursal => (
                      <SelectItem key={sucursal.id} value={sucursal.id.toString()}>
                        {sucursal.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterEstado} onValueChange={setFilterEstado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los estados</SelectItem>
                    <SelectItem value="activo">Solo activos</SelectItem>
                    <SelectItem value="inactivo">Solo inactivos</SelectItem>
                  </SelectContent>
                </Select>

                                 <Button
                   variant="outline"
                   onClick={() => {
                     setSearchTerm("");
                     setFilterEmpresa("todas");
                     setFilterSucursal("todas");
                     setFilterEstado("activo");
                   }}
                   className="flex items-center gap-2"
                 >
                  <Filter className="w-4 h-4" />
                  Limpiar filtros
                </Button>
              </div>
            </div>

            {/* Tabla de Analistas */}
            <div className="overflow-x-auto rounded-lg shadow-sm">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando analistas...</p>
                  </div>
                </div>
              ) : (
                <Table className="min-w-[1000px] w-full text-xs">
                  <TableHeader>
                    <TableRow className="bg-gray-100 border-b border-gray-200 h-12">
                      <TableHead className="text-left text-xs font-semibold text-gray-700 py-1 px-2 border-r border-gray-200 w-20">Acciones</TableHead>
                      <TableHead className="text-left text-xs font-semibold text-gray-700 py-1 px-2 border-r border-gray-200">Analista</TableHead>
                      <TableHead className="text-left text-xs font-semibold text-gray-700 py-1 px-2 border-r border-gray-200">Solicitudes</TableHead>
                      <TableHead className="text-left text-xs font-semibold text-gray-700 py-1 px-2 border-r border-gray-200">Prioridad 1</TableHead>
                      <TableHead className="text-left text-xs font-semibold text-gray-700 py-1 px-2 border-r border-gray-200">Prioridad 2</TableHead>
                      <TableHead className="text-left text-xs font-semibold text-gray-700 py-1 px-2 border-r border-gray-200">Prioridad 3</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAnalistas.map((analista, index) => (
                      <TableRow key={`${analista.usuario_id}-${analista.empresa_id || 'sin-empresa'}-${index}`} className="hover:bg-gray-50 border-b border-gray-200">
                        <TableCell className="py-1 px-2 border-r border-gray-200 w-20">
                          <div className="flex gap-1 justify-center">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleNewAnalista(analista)}
                                    aria-label="Configurar prioridades"
                                    className="h-8 w-8"
                                  >
                                    <UserCheck className="h-4 w-4 text-blue-600" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Configurar prioridades</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                        
                        <TableCell className="py-1 px-2 font-medium text-gray-900 border-r border-gray-200">
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {analista.usuario_nombre || 'No especificado'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {analista.usuario_email || 'Sin email'}
                            </span>
                          </div>
                        </TableCell>
                        
                        <TableCell className="py-1 px-2 text-center border-r border-gray-200">
                          <div className="flex flex-col items-center">
                            <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200">
                              {analista.cantidad_solicitudes || 0}
                            </Badge>
                            <span className="text-xs text-gray-500 mt-1">asignadas</span>
                          </div>
                        </TableCell>
                        
                        <TableCell className="py-1 px-2 text-center border-r border-gray-200">
                          <div className="space-y-1">
                            {analista.nivel_prioridad_1 ? (
                              <Badge variant="outline" className={getPrioridadBadgeClass(analista.nivel_prioridad_1)}>
                                {analista.nivel_prioridad_1 === 'cliente' ? 'Cliente' : 
                                 analista.nivel_prioridad_1 === 'sucursal' ? 'Sucursal' : 
                                 analista.nivel_prioridad_1 === 'solicitudes' ? 'Solicitudes' : 
                                 analista.nivel_prioridad_1}
                              </Badge>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                            {analista.nivel_prioridad_1 === 'cliente' && analista.empresa_nombre && (
                              <div className="text-xs text-gray-500">{analista.empresa_nombre}</div>
                            )}
                            {analista.nivel_prioridad_1 === 'sucursal' && analista.sucursal_nombre && (
                              <div className="text-xs text-gray-500">{analista.sucursal_nombre}</div>
                            )}
                            {analista.nivel_prioridad_1 === 'solicitudes' && (
                              <div className="text-xs text-gray-500">{analista.cantidad_solicitudes || 0} solicitudes</div>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell className="py-1 px-2 text-center border-r border-gray-200">
                          <div className="space-y-1">
                            {analista.nivel_prioridad_2 ? (
                              <Badge variant="outline" className={getPrioridadBadgeClass(analista.nivel_prioridad_2)}>
                                {analista.nivel_prioridad_2 === 'cliente' ? 'Cliente' : 
                                 analista.nivel_prioridad_2 === 'sucursal' ? 'Sucursal' : 
                                 analista.nivel_prioridad_2 === 'solicitudes' ? 'Solicitudes' : 
                                 analista.nivel_prioridad_2}
                              </Badge>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                            {analista.nivel_prioridad_2 === 'cliente' && analista.empresa_nombre && (
                              <div className="text-xs text-gray-500">{analista.empresa_nombre}</div>
                            )}
                            {analista.nivel_prioridad_2 === 'sucursal' && analista.sucursal_nombre && (
                              <div className="text-xs text-gray-500">{analista.sucursal_nombre}</div>
                            )}
                            {analista.nivel_prioridad_2 === 'solicitudes' && (
                              <div className="text-xs text-gray-500">{analista.cantidad_solicitudes || 0} solicitudes</div>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell className="py-1 px-2 text-center border-r border-gray-200">
                          <div className="space-y-1">
                            {analista.nivel_prioridad_3 ? (
                              <Badge variant="outline" className={getPrioridadBadgeClass(analista.nivel_prioridad_3)}>
                                {analista.nivel_prioridad_3 === 'cliente' ? 'Cliente' : 
                                 analista.nivel_prioridad_3 === 'sucursal' ? 'Sucursal' : 
                                 analista.nivel_prioridad_3 === 'solicitudes' ? 'Solicitudes' : 
                                 analista.nivel_prioridad_3}
                              </Badge>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                            {analista.nivel_prioridad_3 === 'cliente' && analista.empresa_nombre && (
                              <div className="text-xs text-gray-500">{analista.empresa_nombre}</div>
                            )}
                            {analista.nivel_prioridad_3 === 'sucursal' && analista.sucursal_nombre && (
                              <div className="text-xs text-gray-500">{analista.sucursal_nombre}</div>
                            )}
                            {analista.nivel_prioridad_3 === 'solicitudes' && (
                              <div className="text-xs text-gray-500">{analista.cantidad_solicitudes || 0} solicitudes</div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              
              {!isLoading && filteredAnalistas.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                                       <p className="font-medium">
                    {searchTerm || filterEmpresa !== 'todas' || filterSucursal !== 'todas' || filterEstado !== 'activo'
                      ? "No se encontraron analistas con los filtros aplicados"
                      : "No hay analistas registrados"
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="registro" className="mt-6">
          <div className="bg-white rounded-lg border">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                  <Plus className="w-5 h-5 text-blue-600" />
                </div>
                                 <span className="text-lg font-semibold text-gray-700">ASOCIACIÓN PRIORIDAD DE ANALISTA</span>
              </div>
            </div>
                         <div className="p-6">
               <AnalistaForm 
                 analistaSeleccionado={analistaParaConfigurar}
                 onSuccess={() => {
                   setActiveTab("analistas");
                   setAnalistaParaConfigurar(null);
                   queryClient.invalidateQueries({ queryKey: ['analistas'] });
                 }} 
               />
             </div>
          </div>
                 </TabsContent>
       </Tabs>

       {/* Modal de Confirmación para Activar Analista */}
       <AlertDialog open={showActivateModal} onOpenChange={setShowActivateModal}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle className="flex items-center gap-2">
               <CheckCircle className="w-5 h-5 text-green-600" />
               Activar Analista
             </AlertDialogTitle>
             <AlertDialogDescription>
               ¿Estás seguro de que deseas activar al analista{" "}
               <span className="font-semibold">
                 {selectedAnalista?.usuario_nombre}
               </span>
               ? Esta acción permitirá que el analista acceda nuevamente al sistema.
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel onClick={() => {
               setShowActivateModal(false);
               setSelectedAnalista(null);
             }}>
               Cancelar
             </AlertDialogCancel>
             <AlertDialogAction
               onClick={confirmActivateAnalista}
               className="bg-green-600 hover:bg-green-700"
             >
               <CheckCircle className="w-4 h-4 mr-2" />
               Activar
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>

               {/* Modal de Confirmación para Desactivar Analista */}
        <AlertDialog open={showDeactivateModal} onOpenChange={setShowDeactivateModal}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-orange-600" />
                Desactivar Analista
              </AlertDialogTitle>
              <AlertDialogDescription>
                ¿Estás seguro de que deseas desactivar al analista{" "}
                <span className="font-semibold">
                  {selectedAnalista?.usuario_nombre}
                </span>
                ? Esta acción impedirá que el analista acceda al sistema temporalmente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setShowDeactivateModal(false);
                setSelectedAnalista(null);
              }}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeactivateAnalista}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Lock className="w-4 h-4 mr-2" />
                Desactivar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Modal de Confirmación para Eliminar Analista */}
        <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-600" />
                Eliminar Analista
              </AlertDialogTitle>
              <AlertDialogDescription>
                              ¿Estás seguro de que deseas eliminar al analista{" "}
              <span className="font-semibold">
                {selectedAnalista?.usuario_nombre}
              </span>
              ? Esta acción es irreversible y no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setShowDeleteModal(false);
                setSelectedAnalista(null);
              }}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmEliminarAnalista}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Filter,
  Download,
  UserCheck,
  Users,
  Settings
} from 'lucide-react';
import { toast } from "sonner";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { asociacionPrioridadService, AnalistaPrioridad } from '@/services/asociacionPrioridadService';
import { empresasService } from '@/services/empresasService';
import { supabase } from '@/services/supabaseClient';
import { useLoading } from '@/contexts/LoadingContext';
import { AnalistaForm } from '@/components/analistas/AnalistaForm';
import { useRegisterView } from '@/hooks/useRegisterView';
import { Can } from '@/contexts/PermissionsContext';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

export default function AnalistasSeleccionPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("analistas");
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEmpresa, setFilterEmpresa] = useState('todas');
  const [filterSucursal, setFilterSucursal] = useState('todas');
  const [filterEstado, setFilterEstado] = useState('activo');
  const [analistaParaConfigurar, setAnalistaParaConfigurar] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const queryClient = useQueryClient();
  const { startLoading, stopLoading } = useLoading();
  const { addAction: addAnalistasListado } = useRegisterView('AnalistasSeleccion', 'listado', 'Listado de Analistas Selección');
  const { addAction: addAnalistasForm } = useRegisterView('AnalistasSeleccion', 'formulario', 'Formulario de Analista Selección');

  React.useEffect(() => {
    addAnalistasListado('configurar', 'Configurar Prioridades');
    addAnalistasListado('exportar', 'Exportar Analistas');
    addAnalistasForm('guardar', 'Guardar Prioridades');
    addAnalistasForm('cancelar', 'Cancelar');
  }, [addAnalistasListado, addAnalistasForm]);

  const { data: analistasConPrioridades = [], isLoading } = useQuery({
    queryKey: ['analistas-seleccion-prioridades'],
    queryFn: async () => {
      try {
        const data = await asociacionPrioridadService.getAnalistasSeleccionWithPriorities();
        return data || [];
      } catch (error) {
        console.error('Error cargando analistas selección con prioridades:', error);
        toast.error("Error al cargar analistas de Selección");
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const { data: empresas = [] } = useQuery({
    queryKey: ['empresas'],
    queryFn: async () => {
      try {
        return (await empresasService.getAll()) || [];
      } catch {
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: sucursales = [] } = useQuery({
    queryKey: ['sucursales'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('gen_sucursales').select('id, nombre').order('nombre');
        if (error) return [];
        return data || [];
      } catch {
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const filteredAnalistas = React.useMemo(() => {
    let filtered = analistasConPrioridades;
    if (searchTerm) {
      filtered = filtered.filter(a =>
        a.usuario_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.usuario_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.empresa_nombre && a.empresa_nombre.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    if (filterEmpresa !== 'todas') {
      filtered = filtered.filter(a => a.empresa_id === parseInt(filterEmpresa));
    }
    if (filterSucursal !== 'todas') {
      filtered = filtered.filter(a => a.sucursal_id === parseInt(filterSucursal));
    }
    return filtered;
  }, [analistasConPrioridades, searchTerm, filterEmpresa, filterSucursal, filterEstado]);

  const totalPages = Math.max(1, Math.ceil(filteredAnalistas.length / pageSize));
  const paginatedAnalistas = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAnalistas.slice(start, start + pageSize);
  }, [filteredAnalistas, currentPage]);

  React.useEffect(() => { setCurrentPage(1); }, [searchTerm, filterEmpresa, filterSucursal, filterEstado]);
  React.useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const handleExportarExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      const excelData = [
        ['ANALISTAS DE SELECCIÓN'],
        [],
        ['Analista', 'Email', 'Nivel 1', 'Nivel 2', 'Nivel 3', 'Solicitudes', 'Cliente', 'NIT', 'Sucursal'],
        ...filteredAnalistas.map(a => [
          a.usuario_nombre || 'No especificado',
          a.usuario_email || 'No especificado',
          a.nivel_prioridad_1 ? 'Sí' : 'No',
          a.nivel_prioridad_2 ? 'Sí' : 'No',
          a.nivel_prioridad_3 ? 'Sí' : 'No',
          a.cantidad_solicitudes || 0,
          a.empresa_nombre || 'Sin asignar',
          a.empresa_nit || '-',
          a.empresa_direccion || '-',
        ]),
      ];
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(excelData);
      ws['!cols'] = [25, 30, 10, 10, 10, 12, 30, 15, 25].map(wch => ({ wch }));
      ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }];
      XLSX.utils.book_append_sheet(wb, ws, "AnalistasSeleccion");
      const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array', compression: true });
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analistas_seleccion_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      toast.success("Archivo Excel descargado correctamente");
    } catch {
      toast.error("Error al exportar la lista de analistas a Excel");
    }
  };

  const handleNewAnalista = (analista?: any) => {
    if (analista) setAnalistaParaConfigurar(analista);
    setActiveTab("registro");
  };

  const getPrioridadBadgeClass = (valor: string) => {
    switch (valor) {
      case 'cliente': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'sucursal': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'solicitudes': return 'bg-orange-50 text-orange-700 border-orange-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="p-4 max-w-full mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-extrabold text-cyan-800 flex items-center gap-2 mb-2">
          <Users className="w-8 h-8 text-cyan-600" />
          Gestión de Analistas Selección
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-cyan-100/60 p-1 rounded-lg">
          <TabsTrigger
            value="analistas"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
          >
            Listado de Analistas Selección
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
          <div className="bg-white rounded-lg border">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                  <Users className="w-5 h-5 text-orange-600" />
                </div>
                <span className="text-lg font-semibold text-gray-700">ANALISTAS DE SELECCIÓN</span>
              </div>
              <div className="flex space-x-2">
                <Can action="accion-exportar">
                  <Button
                    onClick={handleExportarExcel}
                    variant="outline"
                    className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200 text-xs px-3 py-1"
                    size="sm"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Exportar Excel
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
                    placeholder="Buscar por nombre, email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterEmpresa} onValueChange={setFilterEmpresa}>
                  <SelectTrigger><SelectValue placeholder="Filtrar por cliente" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todos los clientes</SelectItem>
                    {empresas.map((empresa: any) => (
                      <SelectItem key={empresa.id} value={empresa.id.toString()}>
                        {empresa.razon_social || empresa.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterSucursal} onValueChange={setFilterSucursal}>
                  <SelectTrigger><SelectValue placeholder="Filtrar por sucursal" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas las sucursales</SelectItem>
                    {sucursales.map((sucursal: any) => (
                      <SelectItem key={sucursal.id} value={sucursal.id.toString()}>
                        {sucursal.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterEstado} onValueChange={setFilterEstado}>
                  <SelectTrigger><SelectValue placeholder="Filtrar por estado" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los estados</SelectItem>
                    <SelectItem value="activo">Solo activos</SelectItem>
                    <SelectItem value="inactivo">Solo inactivos</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => { setSearchTerm(""); setFilterEmpresa("todas"); setFilterSucursal("todas"); setFilterEstado("activo"); }}
                  className="flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Limpiar filtros
                </Button>
              </div>
            </div>

            {/* Tabla */}
            <div className="overflow-x-auto rounded-lg shadow-sm">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto" />
                    <p className="mt-4 text-gray-600">Cargando analistas de selección...</p>
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
                    {paginatedAnalistas.map((analista, index) => (
                      <TableRow key={`${analista.usuario_id}-${analista.empresa_id || 'sin-empresa'}-${index}`} className="hover:bg-gray-50 border-b border-gray-200">
                        <TableCell className="py-1 px-2 border-r border-gray-200 w-20">
                          <div className="flex gap-1 justify-center">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Can action="accion-configurar-analista">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleNewAnalista(analista)}
                                      aria-label="Configurar prioridades"
                                      className="h-8 w-8"
                                    >
                                      <UserCheck className="h-4 w-4 text-blue-600" />
                                    </Button>
                                  </Can>
                                </TooltipTrigger>
                                <TooltipContent><p>Configurar prioridades</p></TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                        <TableCell className="py-1 px-2 font-medium text-gray-900 border-r border-gray-200">
                          <div className="flex flex-col">
                            <span className="font-medium">{analista.usuario_nombre || 'No especificado'}</span>
                            <span className="text-xs text-muted-foreground">{analista.usuario_email || 'Sin email'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-1 px-2 text-center border-r border-gray-200">
                          <div className="flex flex-col items-center">
                            <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200">
                              {analista.cantidad_asignadas ?? analista.cantidad_solicitudes ?? 0}
                            </Badge>
                            <span className="text-xs text-gray-500 mt-1">asignadas</span>
                          </div>
                        </TableCell>
                        {[analista.nivel_prioridad_1, analista.nivel_prioridad_2, analista.nivel_prioridad_3].map((nivel, i) => (
                          <TableCell key={i} className="py-1 px-2 text-center border-r border-gray-200">
                            <div className="space-y-1">
                              {nivel ? (
                                <Badge variant="outline" className={getPrioridadBadgeClass(nivel)}>
                                  {nivel === 'cliente' ? 'Cliente' :
                                   nivel === 'sucursal' ? 'Sucursal' :
                                   nivel === 'solicitudes' ? `Solicitudes (${analista.cantidad_configurada || 0})` :
                                   nivel}
                                </Badge>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                              {nivel === 'cliente' && (analista.empresa_ids || []).length > 0 && (
                                <div className="text-xs text-gray-500 space-y-0.5">
                                  {(analista.empresa_ids || []).map((empId) => {
                                    const empresa = (empresas as any[]).find((e: any) => e.id === empId);
                                    return empresa ? <div key={empId}>{empresa.razon_social}</div> : null;
                                  })}
                                </div>
                              )}
                              {nivel === 'sucursal' && (analista.sucursal_ids || []).length > 0 && (
                                <div className="text-xs text-gray-500 space-y-0.5">
                                  {(analista.sucursal_ids || []).map((sucId) => {
                                    const suc = (sucursales as any[]).find((s: any) => s.id === sucId);
                                    return suc ? <div key={sucId}>{suc.nombre}</div> : null;
                                  })}
                                </div>
                              )}
                            </div>
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {!isLoading && filteredAnalistas.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="font-medium">
                    {searchTerm || filterEmpresa !== 'todas' || filterSucursal !== 'todas'
                      ? "No se encontraron analistas con los filtros aplicados"
                      : "No hay analistas de selección registrados"}
                  </p>
                </div>
              )}

              {!isLoading && filteredAnalistas.length > 0 && (
                <div className="flex flex-col gap-3 p-4 border-t bg-gray-50">
                  <div className="text-xs text-gray-600 text-center">
                    Mostrando {Math.min((currentPage - 1) * pageSize + 1, filteredAnalistas.length)} - {Math.min(currentPage * pageSize, filteredAnalistas.length)} de {filteredAnalistas.length} analistas
                  </div>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => { e.preventDefault(); if (currentPage > 1) setCurrentPage(p => p - 1); }}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            href="#"
                            isActive={currentPage === page}
                            onClick={(e) => { e.preventDefault(); setCurrentPage(page); }}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => { e.preventDefault(); if (currentPage < totalPages) setCurrentPage(p => p + 1); }}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
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
                <span className="text-lg font-semibold text-gray-700">ASOCIACIÓN PRIORIDAD DE ANALISTA SELECCIÓN</span>
              </div>
            </div>
            <div className="p-6">
              <AnalistaForm
                analistaSeleccionado={analistaParaConfigurar}
                onSuccess={() => {
                  setActiveTab("analistas");
                  setAnalistaParaConfigurar(null);
                  queryClient.invalidateQueries({ queryKey: ['analistas-seleccion-prioridades'] });
                }}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

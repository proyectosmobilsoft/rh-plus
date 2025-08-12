
import { useState, useEffect } from 'react';
import { FileText, Plus, Filter, Users, Building, DollarSign, CheckCircle, Clock, AlertCircle, Loader2 } from "lucide-react";
import { toast } from 'sonner';

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogDescription } from "@/components/ui/dialog";
import { Solicitud, solicitudesService } from '@/services/solicitudesService';
import SolicitudesList from '@/components/solicitudes/SolicitudesList';
import PlantillasSelector from '@/components/solicitudes/PlantillasSelector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plantilla } from '@/services/plantillasService';
import { empresasService, Empresa } from '@/services/empresasService';

const ExpedicionOrdenPage = () => {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estadoFilter, setEstadoFilter] = useState<string | undefined>(undefined);
  const [empresaFilter, setEmpresaFilter] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState("listado");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | undefined>(undefined);
  const [empresaData, setEmpresaData] = useState<any>(null);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);

  // Estados disponibles para el filtro
  const estadosDisponibles = [
    { value: 'PENDIENTE', label: 'Pendiente' },
    { value: 'ASIGNADO', label: 'Asignado' },
    { value: 'EN_PROCESO', label: 'En Proceso' },
    { value: 'APROBADA', label: 'Aprobada' },
    { value: 'RECHAZADA', label: 'Rechazada' }
  ];

  // Obtener datos de la empresa del localStorage
  useEffect(() => {
    const empresaDataFromStorage = localStorage.getItem('empresaData');
    if (empresaDataFromStorage) {
      try {
        const parsedData = JSON.parse(empresaDataFromStorage);
        setEmpresaData(parsedData);
      } catch (error) {
        console.error('Error al parsear datos de empresa:', error);
        toast.error('Error al cargar datos de la empresa');
      }
    }
  }, []);

  // Cargar lista de empresas para el filtro
  useEffect(() => {
    const fetchEmpresas = async () => {
      try {
        const empresasData = await empresasService.getAll();
        setEmpresas(empresasData);
      } catch (error) {
        console.error('Error al cargar empresas:', error);
        toast.error('Error al cargar la lista de empresas');
      }
    };
    
    fetchEmpresas();
  }, []);

  // Fetch solicitudes when component mounts or filter changes
  useEffect(() => {
    fetchSolicitudes();
  }, [estadoFilter, empresaFilter]);

  const fetchSolicitudes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let data;
      if (estadoFilter) {
        data = await solicitudesService.getByStatus(estadoFilter);
      } else {
        data = await solicitudesService.getAll();
      }
      setSolicitudes(data);
    } catch (error) {
      console.error("Error fetching solicitudes:", error);
      setError('Error al cargar las solicitudes');
      toast.error('Error al cargar las solicitudes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedSolicitud(undefined);
    setActiveTab("registro");
  };

  const handleEdit = async (solicitud: Solicitud) => {
    setSelectedSolicitud(solicitud);
    setActiveTab("registro");
  };

  const handleDelete = async (id: number) => {
    try {
      await solicitudesService.delete(id);
      toast.success('Solicitud eliminada correctamente');
      fetchSolicitudes(); // Refresh the list
    } catch (error) {
      toast.error('Error al eliminar la solicitud');
      console.error(error);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await solicitudesService.update(id, { estado: 'APROBADA' });
      toast.success('Solicitud aprobada correctamente');
      fetchSolicitudes(); // Refresh the list
    } catch (error) {
      toast.error('Error al aprobar la solicitud');
      console.error(error);
    }
  };

  const handleView = async (solicitud: Solicitud) => {
    // Implementar vista de detalles si es necesario
    toast.info('Vista de detalles no implementada aún');
  };

  const handlePlantillaSelect = (plantilla: Plantilla) => {
    // Aquí puedes manejar la selección de plantilla si es necesario
    console.log('Plantilla seleccionada:', plantilla);
  };

  // Filtrado de solicitudes
  const solicitudesFiltradas = solicitudes.filter(solicitud => {
    const matchesSearch =
      (solicitud.nombres?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (solicitud.apellidos?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (solicitud.cargo?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (solicitud.empresa_usuaria?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (solicitud.numero_documento?.toLowerCase() || '').includes(searchTerm.toLowerCase());

    const matchesEmpresa = !empresaFilter || empresaFilter === 'all' || 
      solicitud.empresas?.id?.toString() === empresaFilter;

    return matchesSearch && matchesEmpresa;
  });

  return (
    <div className="p-4 max-w-full mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-extrabold text-cyan-800 flex items-center gap-2 mb-2">
          <FileText className="w-8 h-8 text-cyan-600" />
          Gestión de Solicitudes
        </h1>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-cyan-100/60 p-1 rounded-lg">
          <TabsTrigger
            value="listado"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
          >
            Listado de Solicitudes
          </TabsTrigger>
          <TabsTrigger
            value="registro"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
          >
            Registro de Solicitud
          </TabsTrigger>
        </TabsList>

        <TabsContent value="listado" className="mt-6">
          {/* Header similar a usuarios */}
          <div className="bg-white rounded-lg border">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                  <FileText className="w-5 h-5 text-orange-600" />
                </div>
                <span className="text-lg font-semibold text-gray-700">SOLICITUDES</span>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={handleCreate}
                  className="bg-teal-400 hover:bg-teal-500 text-white text-xs px-3 py-1"
                  size="sm"
                >
                  Adicionar Solicitud
                </Button>
              </div>
            </div>

            {/* Filtros y búsqueda */}
            <div className="flex flex-wrap items-center gap-4 p-3 bg-cyan-50 rounded-lg mb-4 shadow-sm">
              <div className="flex-1 min-w-[200px]">
                <Input
                  placeholder="Buscar por nombre, cargo, empresa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select 
                  value={estadoFilter || 'all'} 
                  onValueChange={(value) => setEstadoFilter(value === 'all' ? undefined : value)}
                >
                  <SelectTrigger className="w-[180px] h-9">
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {estadosDisponibles.map((estado) => (
                      <SelectItem key={estado.value} value={estado.value}>
                        {estado.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select 
                  value={empresaFilter || 'all'} 
                  onValueChange={(value) => setEmpresaFilter(value === 'all' ? undefined : value)}
                >
                  <SelectTrigger className="w-[200px] h-9">
                    <SelectValue placeholder="Filtrar por empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las empresas</SelectItem>
                    {empresas.map((empresa) => (
                      <SelectItem key={empresa.id} value={empresa.id.toString()}>
                        {empresa.razon_social}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tabla de solicitudes */}
            <div className="relative overflow-x-auto rounded-lg shadow-sm">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-20">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-10 w-10 animate-spin text-cyan-600" />
                    <span className="text-cyan-700 font-semibold">Cargando solicitudes...</span>
                  </div>
                </div>
              )}
              {error ? (
                <div className="text-center py-6 text-destructive">
                  Error al cargar las solicitudes. Por favor intente nuevamente.
                </div>
              ) : (
                <SolicitudesList
                  solicitudes={solicitudesFiltradas}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onView={handleView}
                  onApprove={handleApprove}
                  isLoading={isLoading}
                />
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="registro" className="mt-6">
          {!empresaData ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Error al cargar datos de empresa</h3>
                  <p className="text-gray-600">
                    No se pudieron cargar los datos de la empresa desde el almacenamiento local.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <PlantillasSelector
              empresaId={empresaData.id}
              onPlantillaSelect={handlePlantillaSelect}
              selectedSolicitud={selectedSolicitud}
              onSave={() => {
                setActiveTab("listado");
                fetchSolicitudes();
              }}
              onCancel={() => {
                setActiveTab("listado");
              }}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExpedicionOrdenPage;


import { useState, useEffect } from 'react';
import { FileText, Plus, Filter, Users, Building, DollarSign, CheckCircle, Clock, AlertCircle, Loader2, Download, Calendar, Info } from "lucide-react";
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

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
import { Can, usePermissions } from '@/contexts/PermissionsContext';
import { validacionDocumentosService } from '@/services/validacionDocumentosService';
import SeleccionarCiudadModal from '@/components/solicitudes/SeleccionarCiudadModal';

const ExpedicionOrdenPage = () => {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estadoFilter, setEstadoFilter] = useState<string | undefined>(undefined);
  const [empresaFilter, setEmpresaFilter] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState("registro");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | undefined>(undefined);
  const [empresaData, setEmpresaData] = useState<any>(null);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [readOnlyView, setReadOnlyView] = useState(false);
  
  // Estado para el modal informativo de fechas
  const [showDateInfoModal, setShowDateInfoModal] = useState(false);
  
  // Estados para el modal de selección de ciudad
  const [showSeleccionarCiudadModal, setShowSeleccionarCiudadModal] = useState(false);
  const [solicitudParaValidar, setSolicitudParaValidar] = useState<{id: number, observacion: string, candidatoNombre: string} | null>(null);
  
  const { hasAction } = usePermissions();

  // Estados disponibles para el filtro
  const estadosDisponibles = [
    { value: 'PENDIENTE', label: 'Pendiente' },
    { value: 'PENDIENTE ASIGNACION', label: 'Pendiente Asignación' },
    { value: 'ASIGNADO', label: 'Asignado' },
    { value: 'pendiente documentos', label: 'Pendiente Documentos' },
    { value: 'EN_PROCESO', label: 'En Proceso' },
    { value: 'APROBADA', label: 'Aprobada' },
    { value: 'RECHAZADA', label: 'Rechazada' }
  ];

  // Función para verificar si estamos en el período especial (del 25 al final del mes)
  const isInSpecialPeriod = () => {
    const today = new Date();
    const dayOfMonth = today.getDate();
    return dayOfMonth >= 25;
  };

  // Función para obtener el primer día hábil del mes siguiente
  const getFirstBusinessDayOfNextMonth = () => {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    
    // Buscar el primer día hábil (lunes a viernes)
    while (nextMonth.getDay() === 0 || nextMonth.getDay() === 6) {
      nextMonth.setDate(nextMonth.getDate() + 1);
    }
    
    return nextMonth;
  };

  // Función para formatear fecha en español
  const formatDateSpanish = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

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
    return () => {
      // Limpieza al salir de la pantalla
      try { setIsLoading(false); } catch { }
    };
  }, [estadoFilter, empresaFilter]);

  // Auto-refresh solicitudes every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing solicitudes...');
      fetchSolicitudes();
    }, 30000); // 30 seconds

    return () => {
      clearInterval(interval);
    };
  }, [estadoFilter, empresaFilter]); // Re-create interval when filters change

  // Mostrar modal informativo si el usuario tiene permisos y está en el período especial
  useEffect(() => {
    const hasPermission = hasAction('ordenes_create');
    const inSpecialPeriod = isInSpecialPeriod();
    console.log('🔍 Modal check - hasPermission:', hasPermission, 'inSpecialPeriod:', inSpecialPeriod);
    
    if (hasPermission && inSpecialPeriod) {
      console.log('✅ Mostrando modal informativo de fechas especiales');
      setShowDateInfoModal(true);
    }
  }, [hasAction]);

  // Mostrar modal cuando se cambie al tab de registro y se cumplan las condiciones
  useEffect(() => {
    const hasPermission = hasAction('ordenes_create');
    const inSpecialPeriod = isInSpecialPeriod();
    console.log('🔍 Tab check - activeTab:', activeTab, 'hasPermission:', hasPermission, 'inSpecialPeriod:', inSpecialPeriod);
    
    if (activeTab === 'registro' && hasPermission && inSpecialPeriod) {
      console.log('✅ Mostrando modal informativo al cambiar a tab de registro');
      setShowDateInfoModal(true);
    }
  }, [activeTab, hasAction]);

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
    setReadOnlyView(false);
    setActiveTab("registro");
  };

  const handleEdit = async (solicitud: Solicitud) => {
    setSelectedSolicitud(solicitud);
    setReadOnlyView(false);
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

  const handleStandBy = async (id: number, observacion: string) => {
    setIsLoading(true);
    try {
      const success = await solicitudesService.putStandBy(id, observacion);
      if (success) {
        toast.success('Solicitud puesta en Stand By exitosamente');
        fetchSolicitudes(); // Recargar la lista
      } else {
        toast.error('Error al cambiar el estado a Stand By');
      }
    } catch (error) {
      console.error('Error al cambiar estado a Stand By:', error);
      toast.error('Error al cambiar el estado a Stand By');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReactivate = async (id: number) => {
    console.log('🔍 ExpedicionOrdenPage.handleReactivate llamado con ID:', id);
    console.log('🔍 Activando loading local...');
    setIsLoading(true);
    try {
      console.log('🔍 Llamando a solicitudesService.reactivate...');
      const success = await solicitudesService.reactivate(id);
      console.log('🔍 Resultado de reactivate:', success);
      if (success) {
        toast.success('Solicitud reactivada exitosamente');
        console.log('🔍 Recargando lista de solicitudes...');
        fetchSolicitudes(); // Recargar la lista
        console.log('🔍 Solicitud reactivada exitosamente');
      } else {
        toast.error('Error al reactivar la solicitud');
        console.log('❌ Error al reactivar la solicitud');
      }
    } catch (error) {
      console.error('Error al reactivar solicitud:', error);
      toast.error('Error al reactivar la solicitud');
    } finally {
      console.log('🔍 Desactivando loading local...');
      setIsLoading(false);
    }
  };

  const handleContact = async (id: number, observacion: string) => {
    setIsLoading(true);
    try {
      const success = await solicitudesService.contact(id, observacion);
      if (success) {
        toast.success('Solicitud marcada como contactada');
        fetchSolicitudes(); // Recargar la lista
      } else {
        toast.error('Error al marcar como contactada');
      }
    } catch (error) {
      console.error('Error al contactar solicitud:', error);
      toast.error('Error al contactar la solicitud');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    setIsLoading(true);
    try {
      const success = await solicitudesService.approve(id, 'Solicitud aprobada por el usuario');
      if (success) {
        toast.success('Solicitud aprobada exitosamente');
        fetchSolicitudes(); // Recargar la lista
      } else {
        toast.error('Error al aprobar la solicitud');
      }
    } catch (error) {
      console.error('Error al aprobar solicitud:', error);
      toast.error('Error al aprobar la solicitud');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeserto = async (id: number, observacion: string) => {
    setIsLoading(true);
    try {
      const success = await solicitudesService.updateStatus(id, 'DESERTO', observacion);
      if (success) {
        toast.success('Solicitud marcada como deserto exitosamente');
        fetchSolicitudes(); // Recargar la lista
      } else {
        toast.error('Error al marcar como deserto');
      }
    } catch (error) {
      console.error('Error al marcar como deserto:', error);
      toast.error('Error al marcar como deserto');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async (id: number, observacion: string) => {
    setIsLoading(true);
    try {
      const success = await solicitudesService.updateStatus(id, 'CANCELADA', observacion);
      if (success) {
        toast.success('Solicitud cancelada exitosamente');
        fetchSolicitudes(); // Recargar la lista
      } else {
        toast.error('Error al cancelar la solicitud');
      }
    } catch (error) {
      console.error('Error al cancelar la solicitud:', error);
      toast.error('Error al cancelar la solicitud');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssign = async (id: number, analistaId: number) => {
    setIsLoading(true);
    try {
      const success = await solicitudesService.assignAnalyst(id, analistaId, 'Analista asignado por el usuario');
      if (success) {
        toast.success('Analista asignado exitosamente');
        fetchSolicitudes(); // Recargar la lista
      } else {
        toast.error('Error al asignar el analista');
      }
    } catch (error) {
      console.error('Error al asignar analista:', error);
      toast.error('Error al asignar el analista');
    } finally {
      setIsLoading(false);
    }
  };

  const handleView = async (solicitud: Solicitud) => {
    setSelectedSolicitud(solicitud);
    setReadOnlyView(true);
    setActiveTab("registro");
  };

  const handleValidateDocuments = async (id: number, observacion: string) => {
    setIsLoading(true);
    try {
      // Obtener información del candidato para mostrar en el modal si es necesario
      const candidato = await validacionDocumentosService.getCandidatoInfo(id);
      const candidatoNombre = candidato ? `${candidato.nombres} ${candidato.apellidos}` : 'el candidato';

      // Intentar validar documentos y enviar email
      const resultado = await validacionDocumentosService.validarDocumentosYEnviarEmail(id, observacion);

      if (resultado.success) {
        await fetchSolicitudes();
        toast.success(resultado.message);
      } else {
        // Si no hay prestadores en la ciudad del candidato, mostrar modal de selección
        setSolicitudParaValidar({
          id,
          observacion,
          candidatoNombre
        });
        setShowSeleccionarCiudadModal(true);
      }
    } catch (error) {
      console.error('Error validando documentos:', error);
      toast.error('Error al validar documentos. Por favor intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReturnDocuments = async (id: number, observacion: string) => {
    setIsLoading(true);
    try {
      await solicitudesService.returnDocuments(id, observacion);
      await fetchSolicitudes();
      toast.success('Documentos devueltos exitosamente. Se envió un correo al candidato.');
    } catch (error) {
      console.error('Error devolviendo documentos:', error);
      toast.error('Error al devolver documentos. Por favor intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Función para manejar el éxito de la validación desde el modal de selección de ciudad
  const handleValidacionExitosa = async (message: string) => {
    await fetchSolicitudes();
    toast.success(message);
    setShowSeleccionarCiudadModal(false);
    setSolicitudParaValidar(null);
  };

  // Función para cerrar el modal de selección de ciudad
  const handleCerrarModalCiudad = () => {
    setShowSeleccionarCiudadModal(false);
    setSolicitudParaValidar(null);
  };

  const handlePlantillaSelect = (plantilla: Plantilla) => {
    // Aquí puedes manejar la selección de plantilla si es necesario
    console.log('Plantilla seleccionada:', plantilla);
  };

  const handleExportToExcel = () => {
    try {
      // Preparar los datos para exportar - exactamente como se muestran en el listado
      const datosParaExportar = solicitudesFiltradas.map((solicitud) => {
        // Función helper para obtener valor de display
        const getDisplayValue = (value: string | undefined, defaultValue: string = 'No especificado') => {
          return value && value.trim() !== '' ? value : defaultValue;
        };

        // Función para formatear fecha
        const formatDate = (dateString: string | undefined) => {
          if (!dateString) return 'No especificada';
          try {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-ES', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            });
          } catch (error) {
            return 'Fecha inválida';
          }
        };

        // Función para formatear hora
        const formatDateTime = (dateString: string | undefined) => {
          if (!dateString) return 'No especificada';
          try {
            const date = new Date(dateString);
            return date.toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit'
            });
          } catch (error) {
            return 'Hora inválida';
          }
        };

        // Obtener número de documento (igual que en el listado)
        const numeroDocumento =
          solicitud.estructura_datos?.numero_documento ||
          solicitud.estructura_datos?.documento ||
          solicitud.estructura_datos?.cedula ||
          solicitud.estructura_datos?.identificacion ||
          getDisplayValue(solicitud.candidatos?.numero_documento, 'Sin número');

        // Obtener email (igual que en el listado)
        const email =
          solicitud.estructura_datos?.email ||
          solicitud.estructura_datos?.correo_electronico ||
          solicitud.estructura_datos?.correo ||
          'Sin Email';

        // Obtener empresa (igual que en el listado)
        const empresaNombre = getDisplayValue(solicitud.empresas?.razon_social, 'Sin empresa');
        const empresaCiudad = getDisplayValue(solicitud.empresas?.ciudad, 'Sin ciudad');

        // Obtener analista (igual que en el listado)
        const analistaNombre = solicitud.analista?.nombre || 'Sin asignar';
        const analistaEmail = solicitud.analista?.email || 'Sin email';

        // Obtener estado formateado (igual que en el listado)
        const formatEstado = (estado: string) => {
          return estado.charAt(0).toUpperCase() + estado.slice(1).toLowerCase();
        };
        const estadoFormateado = formatEstado(solicitud.estado || 'Sin estado');

        return {
          'CONSECUTIVO': `#${solicitud.id}`,
          'DOCUMENTO': numeroDocumento,
          'EMAIL': email,
          'EMPRESA': empresaNombre,
          'CIUDAD EMPRESA': empresaCiudad,
          'ANALISTA ASIGNADO': analistaNombre,
          'EMAIL ANALISTA': analistaEmail,
          'ESTADO': estadoFormateado,
          'FECHA MODIFICACIÓN': formatDate(solicitud.updated_at),
          'HORA MODIFICACIÓN': formatDateTime(solicitud.updated_at)
        };
      });

      // Crear el libro de trabajo
      const wb = XLSX.utils.book_new();

      // Crear la hoja de trabajo
      const ws = XLSX.utils.json_to_sheet(datosParaExportar);

      // Configurar el ancho de las columnas
      const colWidths = [
        { wch: 12 },  // CONSECUTIVO
        { wch: 15 },  // DOCUMENTO
        { wch: 25 },  // EMAIL
        { wch: 30 },  // EMPRESA
        { wch: 20 },  // CIUDAD EMPRESA
        { wch: 20 },  // ANALISTA ASIGNADO
        { wch: 25 },  // EMAIL ANALISTA
        { wch: 18 },  // ESTADO
        { wch: 15 },  // FECHA MODIFICACIÓN
        { wch: 15 }   // HORA MODIFICACIÓN
      ];
      ws['!cols'] = colWidths;

      // Aplicar formato a los headers (mayúsculas, negrita, fondo pálido)
      const headerRange = XLSX.utils.decode_range(ws['!ref'] || 'A1:J1');
      for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!ws[cellAddress]) continue;

        // Aplicar formato al header
        ws[cellAddress].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "F0F0F0" } }, // Fondo gris pálido
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          }
        };
      }

      // Aplicar formato a las filas de datos
      const dataRange = XLSX.utils.decode_range(ws['!ref'] || 'A1:J1');
      for (let row = 1; row <= dataRange.e.r; row++) {
        for (let col = dataRange.s.c; col <= dataRange.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
          if (!ws[cellAddress]) continue;

          // Aplicar formato a las celdas de datos
          ws[cellAddress].s = {
            alignment: { vertical: "center" },
            border: {
              top: { style: "thin", color: { rgb: "CCCCCC" } },
              bottom: { style: "thin", color: { rgb: "CCCCCC" } },
              left: { style: "thin", color: { rgb: "CCCCCC" } },
              right: { style: "thin", color: { rgb: "CCCCCC" } }
            }
          };
        }
      }

      // Agregar la hoja al libro
      XLSX.utils.book_append_sheet(wb, ws, 'Solicitudes');

      // Generar el nombre del archivo con fecha y hora
      const fechaActual = new Date();
      const fechaFormateada = fechaActual.toISOString().split('T')[0];
      const horaFormateada = fechaActual.toTimeString().split(' ')[0].replace(/:/g, '-');
      const nombreArchivo = `Solicitudes_${fechaFormateada}_${horaFormateada}.xlsx`;

      // Descargar el archivo
      XLSX.writeFile(wb, nombreArchivo);

      toast.success(`Archivo Excel exportado exitosamente: ${nombreArchivo}`);
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      toast.error('Error al exportar el archivo Excel');
    }
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
            value="registro"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
          >
            Registro de Solicitud
          </TabsTrigger>
          <TabsTrigger
            value="listado"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
          >
            Listado de Solicitudes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="registro" className="mt-6">
          <PlantillasSelector
            empresaId={empresaData?.id}
            onPlantillaSelect={handlePlantillaSelect}
            selectedSolicitud={selectedSolicitud}
            onSave={async () => {
              // Pequeño delay para que el usuario vea el mensaje de éxito
              await new Promise(resolve => setTimeout(resolve, 500));
              setActiveTab("listado");
              fetchSolicitudes();
            }}
            onCancel={() => {
              setActiveTab("listado");
            }}
            readOnly={readOnlyView}
          />
        </TabsContent>

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
                <Can action="ordenes_create">
                  <Button
                    onClick={handleCreate}
                    className="bg-teal-400 hover:bg-teal-500 text-white text-xs px-3 py-1"
                    size="sm"
                  >
                    Adicionar Solicitud
                  </Button>
                </Can>
                <Can action="exportar-solicitudes">
                  <Button
                    onClick={handleExportToExcel}
                    className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1"
                    size="sm"
                    disabled={solicitudesFiltradas.length === 0}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Exportar Excel
                  </Button>
                </Can>
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
                  onView={handleView}
                  onApprove={handleApprove}
                  onContact={handleContact}
                  onStandBy={handleStandBy}
                  onReactivate={handleReactivate}
                  onDeserto={handleDeserto}
                  onCancel={handleCancel}
                  onAssign={handleAssign}
                  onValidateDocuments={handleValidateDocuments}
                  onReturnDocuments={handleReturnDocuments}
                  isLoading={isLoading}
                />
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal informativo de fechas especiales */}
      <Dialog open={showDateInfoModal} onOpenChange={setShowDateInfoModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-700">
              <Calendar className="h-5 w-5" />
              Información Importante sobre Fechas
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Período especial de fechas de solicitud
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <Info className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <p className="text-sm text-amber-800 font-medium">
                  Período Especial de Fechas
                </p>
                <p className="text-sm text-amber-700">
                  Las solicitudes creadas desde el día 25 hasta el final del mes 
                  tendrán como fecha de solicitud el <strong>primer día hábil del mes siguiente</strong>.
                </p>
                <div className="mt-3 p-3 bg-white border border-amber-300 rounded">
                  <p className="text-xs text-amber-600 font-medium mb-1">
                    Próxima fecha de solicitud:
                  </p>
                  <p className="text-sm font-semibold text-amber-800">
                    {formatDateSpanish(getFirstBusinessDayOfNextMonth())}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
              <p>
                <strong>Nota:</strong> Esta regla se aplica automáticamente al crear 
                nuevas solicitudes durante este período.
              </p>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button 
              onClick={() => setShowDateInfoModal(false)}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              Entendido
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de selección de ciudad para prestadores médicos */}
      {solicitudParaValidar && (
        <SeleccionarCiudadModal
          isOpen={showSeleccionarCiudadModal}
          onClose={handleCerrarModalCiudad}
          solicitudId={solicitudParaValidar.id}
          observacion={solicitudParaValidar.observacion}
          candidatoNombre={solicitudParaValidar.candidatoNombre}
          onSuccess={handleValidacionExitosa}
        />
      )}
    </div>
  );
};

export default ExpedicionOrdenPage;

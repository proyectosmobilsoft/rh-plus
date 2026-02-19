
import { useState, useEffect } from 'react';
import { FileText, Plus, Filter, Users, Building, DollarSign, CheckCircle, Clock, AlertCircle, Loader2, Download, Calendar, Info, Check } from "lucide-react";
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
import { isNonBusinessDay } from '@/services/holidaysService';
import { Can, usePermissions } from '@/contexts/PermissionsContext';
import { validacionDocumentosService } from '@/services/validacionDocumentosService';
import SeleccionarCiudadModal from '@/components/solicitudes/SeleccionarCiudadModal';
import { ubicacionesService } from '@/services/ubicacionesService';
import { centrosCostoService } from '@/services/centrosCostoService';
import { supabase } from '@/services/supabaseClient';
import { tiposCandidatosService } from '@/services/tiposCandidatosService';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { X } from 'lucide-react';

interface TipoCandidato {
  id: number;
  nombre: string;
  descripcion?: string;
  activo?: boolean;
}

const ExpedicionOrdenPage = () => {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estadoFilter, setEstadoFilter] = useState<string | undefined>(undefined);
  const [empresaFilter, setEmpresaFilter] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState("registro");
  
  // Filtros individuales (inputs)
  const [solicitudIdFilter, setSolicitudIdFilter] = useState<string>("");
  const [numeroDocumentoFilter, setNumeroDocumentoFilter] = useState<string>("");
  const [nombreCandidatoFilter, setNombreCandidatoFilter] = useState<string>("");
  const [cargoFilter, setCargoFilter] = useState<string | undefined>(undefined);

  // Filtros aplicados (se usan para las consultas al backend)
  const [appliedSolicitudId, setAppliedSolicitudId] = useState<number | undefined>(undefined);
  const [appliedNumeroDocumento, setAppliedNumeroDocumento] = useState<string | undefined>(undefined);
  const [appliedNombreCandidato, setAppliedNombreCandidato] = useState<string | undefined>(undefined);
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 100;
  
  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | undefined>(undefined);
  const [empresaData, setEmpresaData] = useState<any>(null);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [cargos, setCargos] = useState<TipoCandidato[]>([]);
  const [readOnlyView, setReadOnlyView] = useState(false);
  
  // Estado para el modal informativo de fechas
  const [showDateInfoModal, setShowDateInfoModal] = useState(false);
  
  // Estados para el modal de selección de ciudad
  const [showSeleccionarCiudadModal, setShowSeleccionarCiudadModal] = useState(false);
  const [solicitudParaValidar, setSolicitudParaValidar] = useState<{id: number, observacion: string, candidatoNombre: string} | null>(null);
  
  const { hasAction } = usePermissions();

  // Estados disponibles para el filtro - deben coincidir exactamente con los estados en la base de datos
  const estadosDisponibles = [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'pendiente asignacion', label: 'Pendiente Asignación' },
    { value: 'asignado', label: 'Asignado' },
    { value: 'pendiente documentos', label: 'Pendiente Documentos' },
    { value: 'en_proceso', label: 'En Proceso' },
    { value: 'stand by', label: 'Stand By' },
    { value: 'aprobada', label: 'Aprobada' },
    { value: 'rechazada', label: 'Rechazada' },
    { value: 'deserto', label: 'Deserto' },
    { value: 'cancelada', label: 'Cancelada' },
    { value: 'descartado', label: 'Descartado' },
    { value: 'documentos entregados', label: 'Documentos Entregados' },
    { value: 'citado examenes', label: 'Citado Exámenes' },
    { value: 'firma contrato', label: 'Firma Contrato' },
    { value: 'documentos devueltos', label: 'Documentos Devueltos' },
    { value: 'contratado', label: 'Contratado' },
    { value: 'validacion cliente', label: 'Validación Cliente' }
  ];

  // Función para verificar si estamos en el período especial (del 25 al final del mes)
  const isInSpecialPeriod = () => {
    const today = new Date();
    const dayOfMonth = today.getDate();
    return dayOfMonth >= 25;
  };

  // Función para obtener el primer día hábil del mes siguiente (excluye fines de semana y festivos)
  const getFirstBusinessDayOfNextMonth = () => {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    // Avanzar hasta el primer día que no sea no hábil (ni fin de semana ni festivo)
    while (isNonBusinessDay(nextMonth)) {
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

  // Cargar lista de cargos para el filtro
  useEffect(() => {
    const fetchCargos = async () => {
      try {
        const cargosData = await tiposCandidatosService.getAll();
        setCargos(cargosData);
      } catch (error) {
        console.error('Error al cargar cargos:', error);
        toast.error('Error al cargar la lista de cargos');
      }
    };

    fetchCargos();
  }, []);

  // Resetear página a 1 cuando cambien los filtros aplicados
  useEffect(() => {
    setCurrentPage(1);
  }, [estadoFilter, empresaFilter, appliedSolicitudId, appliedNumeroDocumento, appliedNombreCandidato, cargoFilter]);

  // Fetch solicitudes when component mounts or filters/pagination change
  useEffect(() => {
    fetchSolicitudes();
    return () => {
      // Limpieza al salir de la pantalla
      try { setIsLoading(false); } catch { }
    };
  }, [currentPage, estadoFilter, empresaFilter, appliedSolicitudId, appliedNumeroDocumento, appliedNombreCandidato, cargoFilter]);

  // Auto-refresh solicitudes cada 60 segundos (respeta filtros y paginación actuales)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchSolicitudes();
    }, 60000); // 60 segundos

    return () => {
      clearInterval(interval);
    };
  }, [currentPage, estadoFilter, empresaFilter, appliedSolicitudId, appliedNumeroDocumento, appliedNombreCandidato, cargoFilter]);

  // Mostrar modal informativo si el usuario tiene permisos y está en el período especial
  useEffect(() => {
    const hasPermission = hasAction('ordenes_create');
    const inSpecialPeriod = isInSpecialPeriod();
    
    if (hasPermission && inSpecialPeriod) {
      setShowDateInfoModal(true);
    }
  }, [hasAction]);

  // Mostrar modal cuando se cambie al tab de registro y se cumplan las condiciones
  useEffect(() => {
    const hasPermission = hasAction('ordenes_create');
    const inSpecialPeriod = isInSpecialPeriod();
    
    if (activeTab === 'registro' && hasPermission && inSpecialPeriod) {
      setShowDateInfoModal(true);
    }
  }, [activeTab, hasAction]);

  const fetchSolicitudes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Preparar filtros para la paginación
      const empresaId = empresaFilter && empresaFilter !== 'all' ? Number(empresaFilter) : undefined;

      // Filtros aplicados
      const solicitudId = appliedSolicitudId;
      const numeroDocumento = appliedNumeroDocumento;

      // Nombre candidato: solo se envía al backend si tiene más de 3 caracteres
      const nombreCandidato =
        appliedNombreCandidato && appliedNombreCandidato.trim().length > 3
          ? appliedNombreCandidato.trim()
          : undefined;
      const cargoId = cargoFilter && cargoFilter !== 'all' ? Number(cargoFilter) : undefined;

      // Usar paginación server-side
      const result = await solicitudesService.getPaginated({
        page: currentPage,
        pageSize: pageSize,
        empresaId,
        estado: estadoFilter,
        solicitudId,
        numeroDocumento,
        nombreCandidato,
        cargoId,
      });

      setSolicitudes(result.data);
      setTotalRecords(result.total);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error("Error fetching solicitudes:", error);
      setError('Error al cargar las solicitudes');
      toast.error('Error al cargar las solicitudes');
      setSolicitudes([]);
      setTotalRecords(0);
      setTotalPages(0);
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
    setIsLoading(true);
    try {
      const success = await solicitudesService.reactivate(id);
      if (success) {
        toast.success('Solicitud reactivada exitosamente');
        fetchSolicitudes(); // Recargar la lista
      } else {
        toast.error('Error al reactivar la solicitud');
      }
    } catch (error) {
      console.error('Error al reactivar solicitud:', error);
      toast.error('Error al reactivar la solicitud');
    } finally {
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
      const success = await solicitudesService.updateStatus(id, 'deserto', observacion);
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

  const handleDescartado = async (id: number, observacion: string) => {
    setIsLoading(true);
    try {
      const success = await solicitudesService.updateStatus(id, 'descartado', observacion);
      if (success) {
        toast.success('Solicitud marcada como descartada exitosamente');
        fetchSolicitudes(); // Recargar la lista
      } else {
        toast.error('Error al marcar como descartada');
      }
    } catch (error) {
      console.error('Error al marcar como descartada:', error);
      toast.error('Error al marcar como descartada');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async (id: number, observacion: string) => {
    setIsLoading(true);
    try {
      const success = await solicitudesService.updateStatus(id, 'cancelada', observacion);
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

  const handleContract = async (id: number, observacion: string) => {
    setIsLoading(true);
    try {
      const success = await solicitudesService.contract(id, observacion);
      if (success) {
        toast.success('Solicitud marcada como contratada exitosamente');
        fetchSolicitudes(); // Recargar la lista
      } else {
        toast.error('Error al marcar como contratada');
      }
    } catch (error) {
      console.error('Error al marcar como contratada:', error);
      toast.error('Error al marcar como contratada');
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
        // Mostrar mensaje de error
        toast.warning(resultado.message);
        
        // Solo mostrar modal de selección de ciudad si el problema es de prestadores
        // (no si falta candidato o email)
        if (candidato && candidato.email && resultado.message.includes('prestadores')) {
          setSolicitudParaValidar({
            id,
            observacion,
            candidatoNombre
          });
          setShowSeleccionarCiudadModal(true);
        }
      }
    } catch (error) {
      console.error('Error validando documentos:', error);
      toast.error('Error al validar documentos. Por favor intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCiteExams = async (id: number, observacion: string) => {
    setIsLoading(true);
    try {
      // Obtener información del candidato para mostrar en el modal si es necesario
      const candidato = await validacionDocumentosService.getCandidatoInfo(id);
      const candidatoNombre = candidato ? `${candidato.nombres} ${candidato.apellidos}` : 'el candidato';

      // Intentar citar a exámenes y enviar email
      const resultado = await validacionDocumentosService.citarAExamenesYEnviarEmail(id, observacion);

      if (resultado.success) {
        await fetchSolicitudes();
        toast.success(resultado.message);
      } else {
        // Mostrar mensaje de error
        toast.warning(resultado.message);
        
        // Solo mostrar modal de selección de ciudad si el problema es de prestadores
        // (no si falta candidato o email)
        if (candidato && candidato.email && resultado.message.includes('prestadores')) {
          setSolicitudParaValidar({
            id,
            observacion,
            candidatoNombre
          });
          setShowSeleccionarCiudadModal(true);
        }
      }
    } catch (error) {
      console.error('Error citando a exámenes:', error);
      toast.error('Error al citar a exámenes. Por favor intente nuevamente.');
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
  };

  const handleExportToExcel = async () => {
    try {
      // Función para formatear títulos de columnas: separar palabras en mayúsculas
      const formatColumnTitle = (title: string): string => {
        // Si ya tiene espacios, mantenerlo pero en mayúsculas
        if (title.includes(' ')) {
          return title.toUpperCase();
        }
        
        // Primero reemplazar guiones bajos y guiones con espacios
        let formatted = title.replace(/[_-]/g, ' ');
        
        // Palabras del sistema que conocemos
        const palabrasSistema = [
          'AREA', 'DE', 'NEGOCIO', 'COSTO', 'CENTRO', 'SUCURSAL', 'CIUDAD', 
          'CARGO', 'DOCUMENTO', 'FECHA', 'FECHA', 'ESTADO', 'EMPRESA',
          'ANALISTA', 'ASIGNADO', 'MODIFICACION', 'SOLICITUD', 'EMAIL'
        ];
        const palabrasComunes = ['DE', 'LA', 'EL', 'DEL', 'LOS', 'LAS', 'A', 'EN', 'PARA', 'CON', 'POR', 'SIN'];
        
        const todasLasPalabras = [...palabrasSistema, ...palabrasComunes].sort((a, b) => b.length - a.length);
        
        // Si todo está en mayúsculas sin espacios (ej: "AREADENEGOCIO")
        if (formatted.toUpperCase() === formatted && !formatted.includes(' ')) {
          // Intentar encontrar palabras conocidas en el título
          formatted = formatted.toUpperCase();
          
          for (const palabra of todasLasPalabras) {
            // Buscar la palabra en el título y agregar espacio después si existe
            const regex = new RegExp(`(${palabra})(?=[A-Z])`, 'g');
            if (regex.test(formatted)) {
              formatted = formatted.replace(regex, `$1 `);
            }
          }
          
          // Si aún no tiene espacios separados, hacer separación por transición de mayúsculas
          if (!formatted.includes(' ')) {
            // Separar cuando hay una letra minúscula seguida de mayúscula
            formatted = formatted.replace(/([a-z])([A-Z])/g, '$1 $2');
            // Separar cuando hay una letra mayúscula seguida de otra mayúscula y luego minúscula
            formatted = formatted.replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');
          }
        } else {
          // Si tiene mezcla de mayúsculas y minúsculas, separar por transiciones
          formatted = formatted.replace(/([a-z])([A-Z])/g, '$1 $2');
          formatted = formatted.replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');
        }
        
        return formatted.toUpperCase().trim().replace(/\s+/g, ' '); // Normalizar espacios múltiples
      };

      // Función helper para obtener valor de display
      const getDisplayValue = (value: any, defaultValue: string = 'No especificado') => {
        if (value === null || value === undefined) return defaultValue;
        if (typeof value === 'boolean') return value ? 'Sí' : 'No';
        const strValue = String(value);
        return strValue.trim() !== '' ? strValue : defaultValue;
      };

      // Función para obtener nombre de cargo por ID
      const obtenerNombreCargo = async (cargoId: any): Promise<string> => {
        if (!cargoId) return '';
        if (typeof cargoId === 'string' && isNaN(Number(cargoId))) return cargoId;
        const id = Number(cargoId);
        if (isNaN(id)) return '';
        try {
          const { data } = await supabase
            .from('tipos_candidatos')
            .select('nombre')
            .eq('id', id)
            .single();
          return data?.nombre || '';
        } catch {
          return '';
        }
      };

      // Función para obtener nombre de ciudad por ID
      const obtenerNombreCiudad = async (ciudadId: any): Promise<string> => {
        if (!ciudadId) return '';
        const id = Number(ciudadId);
        if (isNaN(id)) return '';
        try {
          const { data } = await supabase
            .from('ciudades')
            .select('nombre')
            .eq('id', id)
            .single();
          return data?.nombre || '';
        } catch {
          return '';
        }
      };

      // Función para obtener nombre de sucursal por ID
      const obtenerNombreSucursal = async (sucursalId: any): Promise<string> => {
        if (!sucursalId) return '';
        const id = Number(sucursalId);
        if (isNaN(id)) return '';
        try {
          const { data } = await supabase
            .from('gen_sucursales')
            .select('nombre')
            .eq('id', id)
            .single();
          return data?.nombre || '';
        } catch {
          return '';
        }
      };

      // Función para obtener nombre de centro de costo por ID
      const obtenerNombreCentroCosto = async (centroCostoId: any): Promise<string> => {
        if (!centroCostoId) return '';
        const id = Number(centroCostoId);
        if (isNaN(id)) return '';
        try {
          const { data } = await supabase
            .from('centros_costo')
            .select('nombre')
            .eq('id', id)
            .single();
          return data?.nombre || '';
        } catch {
          return '';
        }
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

      // Recolectar todos los campos únicos de todas las solicitudes para las columnas
      // Usamos un Map con información completa del campo para mantener el orden y tipo
      const camposEstructuraMap = new Map<string, { label: string; tipo: string; order: number; seccion: string }>();
      
      // Primero, recolectar campos de las secciones (formulario estructurado)
      solicitudesFiltradas.forEach((solicitud) => {
        if (solicitud.estructura_datos && solicitud.estructura_datos.secciones) {
          solicitud.estructura_datos.secciones.forEach((seccion: any) => {
            const seccionTitulo = seccion.titulo || 'Sin título';
            if (seccion.campos && Array.isArray(seccion.campos)) {
              seccion.campos.forEach((campo: any, index: number) => {
                if (campo.nombre) {
                  const nombreCampo = campo.nombre;
                  const label = campo.label || campo.nombre || `Campo ${index}`;
                  const tipo = campo.tipo || 'text';
                  const order = campo.order !== undefined ? campo.order : index * 1000 + (campo.order || 0);
                  
                  // Si el campo ya existe, mantener el que tenga menor order (prioridad)
                  if (!camposEstructuraMap.has(nombreCampo) || 
                      camposEstructuraMap.get(nombreCampo)!.order > order) {
                    camposEstructuraMap.set(nombreCampo, {
                      label,
                      tipo,
                      order,
                      seccion: seccionTitulo
                    });
                  }
                }
              });
            }
          });
        }
      });

      // También recolectar cualquier campo adicional que esté directamente en estructura_datos
      // pero que no esté en las secciones (para compatibilidad con estructuras antiguas)
      solicitudesFiltradas.forEach((solicitud) => {
        const estructuraDatos = solicitud.estructura_datos;
        if (estructuraDatos) {
          Object.keys(estructuraDatos).forEach((key) => {
            // Ignorar propiedades especiales como 'secciones'
            if (key !== 'secciones' && !camposEstructuraMap.has(key)) {
              // Solo agregar si parece ser un campo de datos (no es un objeto complejo)
              const valor = estructuraDatos[key];
              if (valor !== null && 
                  valor !== undefined && 
                  (typeof valor === 'string' || typeof valor === 'number' || typeof valor === 'boolean')) {
                camposEstructuraMap.set(key, {
                  label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
                  tipo: typeof valor === 'boolean' ? 'checkbox' : typeof valor === 'number' ? 'number' : 'text',
                  order: 999999, // Al final
                  seccion: 'Campos adicionales'
                });
              }
            }
          });
        }
      });

      console.log('📊 Campos encontrados para exportación:', Array.from(camposEstructuraMap.entries()).map(([key, info]) => ({ key, ...info })));

      // Ordenar los campos por order y convertir a array para mantener el orden
      const camposOrdenados = Array.from(camposEstructuraMap.entries())
        .sort((a, b) => {
          // Primero por order, luego por nombre del campo
          if (a[1].order !== b[1].order) {
            return a[1].order - b[1].order;
          }
          return a[0].localeCompare(b[0]);
        });

      // Preparar los datos para exportar - incluyendo todos los campos de estructura_datos
      const datosParaExportar = await Promise.all(solicitudesFiltradas.map(async (solicitud) => {
        // Campos básicos de la solicitud
        const numeroDocumento =
          solicitud.estructura_datos?.numero_documento ||
          solicitud.estructura_datos?.documento ||
          solicitud.estructura_datos?.cedula ||
          solicitud.estructura_datos?.identificacion ||
          getDisplayValue(solicitud.candidatos?.numero_documento, 'Sin número');

        const email =
          solicitud.estructura_datos?.email ||
          solicitud.estructura_datos?.correo_electronico ||
          solicitud.estructura_datos?.correo ||
          'Sin Email';

        const empresaNombre = getDisplayValue(solicitud.empresas?.razon_social, 'Sin empresa');
        const empresaCiudad = getDisplayValue(solicitud.empresas?.ciudad, 'Sin ciudad');

        const analistaNombre = solicitud.analista?.nombre || 'Sin asignar';
        const analistaEmail = solicitud.analista?.email || 'Sin email';

        const formatEstado = (estado: string) => {
          return estado.charAt(0).toUpperCase() + estado.slice(1).toLowerCase();
        };
        const estadoFormateado = formatEstado(solicitud.estado || 'Sin estado');

        // Objeto base con campos del sistema
        const fila: Record<string, any> = {
          'CONSECUTIVO': `#${solicitud.id}`,
          'DOCUMENTO': numeroDocumento,
          'EMAIL': email,
          'EMPRESA': empresaNombre,
          'CIUDAD EMPRESA': empresaCiudad,
          'ANALISTA ASIGNADO': analistaNombre,
          'EMAIL ANALISTA': analistaEmail,
          'ESTADO': estadoFormateado,
          'FECHA SOLICITUD': formatDate(solicitud.fecha_solicitud),
          'FECHA MODIFICACIÓN': formatDate(solicitud.updated_at),
          'HORA MODIFICACIÓN': formatDateTime(solicitud.updated_at)
        };

        // Agregar todos los campos de estructura_datos en el orden correcto
        for (const [nombreCampo, infoCampo] of camposOrdenados) {
          // Obtener el valor - puede estar directamente en estructura_datos o anidado
          let valor = solicitud.estructura_datos?.[nombreCampo];
          
          // Si no se encuentra directamente, buscar con variaciones del nombre
          if (valor === null || valor === undefined || valor === '') {
            // Intentar variaciones comunes del nombre del campo
            const variaciones = [
              nombreCampo.toLowerCase(),
              nombreCampo.toUpperCase(),
              nombreCampo,
              nombreCampo.replace(/_/g, ''),
              nombreCampo.replace(/-/g, '_'),
            ];
            
            for (const variacion of variaciones) {
              if (solicitud.estructura_datos?.[variacion] !== undefined) {
                valor = solicitud.estructura_datos[variacion];
                break;
              }
            }
          }
          
          // Formatear el valor según el tipo de campo
          if (valor !== null && valor !== undefined && valor !== '') {
            switch (infoCampo.tipo) {
              case 'checkbox':
                valor = valor === true || valor === 'true' || valor === '1' || valor === 1 ? 'Sí' : 'No';
                break;
              case 'date':
                if (valor && typeof valor === 'string') {
                  valor = formatDate(valor);
                } else if (valor && typeof valor === 'object' && 'toISOString' in valor) {
                  // Si es un objeto Date
                  valor = formatDate((valor as Date).toISOString());
                }
                break;
              case 'select':
              case 'text':
              case 'number':
              case 'email':
              case 'textarea':
              default:
                // Mantener el valor tal cual, pero convertirlo a string
                if (Array.isArray(valor)) {
                  valor = valor.join(', ');
                } else if (typeof valor === 'object') {
                  valor = JSON.stringify(valor);
                } else {
                  valor = String(valor);
                }
                break;
            }
          }
          
          // Formatear el nombre de columna separando palabras
          const nombreColumna = formatColumnTitle(infoCampo.label);
          
          // Si el campo es uno de los que necesita conversión de ID a nombre
          const nombreCampoLower = nombreCampo.toLowerCase().replace(/[_-]/g, '');
          const labelLower = infoCampo.label.toLowerCase().replace(/[_\s]/g, '');
          
          // Detectar cargo por nombre de campo o label
          if (nombreCampoLower.includes('cargo') || labelLower.includes('cargo')) {
            if (valor && !isNaN(Number(valor))) {
              const nombreCargo = await obtenerNombreCargo(valor);
              fila[nombreColumna] = nombreCargo || getDisplayValue(valor, '');
            } else {
              fila[nombreColumna] = getDisplayValue(valor, '');
            }
          } 
          // Detectar ciudad por nombre de campo o label (excluyendo ciudad_id de candidato)
          else if ((nombreCampoLower.includes('ciudad') || labelLower.includes('ciudad')) && 
                   !nombreCampoLower.includes('ciudad_id') && !labelLower.includes('candidato')) {
            if (valor && !isNaN(Number(valor))) {
              const nombreCiudad = await obtenerNombreCiudad(valor);
              fila[nombreColumna] = nombreCiudad || getDisplayValue(valor, '');
            } else {
              fila[nombreColumna] = getDisplayValue(valor, '');
            }
          } 
          // Detectar sucursal por nombre de campo o label
          else if (nombreCampoLower.includes('sucursal') || labelLower.includes('sucursal')) {
            if (valor && !isNaN(Number(valor))) {
              const nombreSucursal = await obtenerNombreSucursal(valor);
              fila[nombreColumna] = nombreSucursal || getDisplayValue(valor, '');
            } else {
              fila[nombreColumna] = getDisplayValue(valor, '');
            }
          } 
          // Detectar centro de costo por nombre de campo o label (varias variaciones)
          else if (nombreCampoLower.includes('centrocosto') || nombreCampoLower.includes('centrodecosto') ||
                   labelLower.includes('centrocosto') || labelLower.includes('centrodecosto') ||
                   labelLower.includes('centrode costo') || labelLower.includes('centro de costo')) {
            if (valor && !isNaN(Number(valor))) {
              const nombreCentroCosto = await obtenerNombreCentroCosto(valor);
              fila[nombreColumna] = nombreCentroCosto || getDisplayValue(valor, '');
            } else {
              fila[nombreColumna] = getDisplayValue(valor, '');
            }
          } 
          else {
            fila[nombreColumna] = getDisplayValue(valor, '');
          }
        }

        // Debug: Log para la primera solicitud
        if (solicitudesFiltradas.indexOf(solicitud) === 0) {
          console.log('🔍 Primera solicitud estructura_datos:', JSON.stringify(solicitud.estructura_datos, null, 2));
          console.log('🔍 Campos a exportar:', Object.keys(fila));
        }

        return fila;
      }));

      // Crear el libro de trabajo
      const wb = XLSX.utils.book_new();

      // Primero, obtener el orden de las columnas que queremos
      const columnHeadersOrdenados: string[] = [];
      if (datosParaExportar.length > 0) {
        const primeraFila = datosParaExportar[0];
        const camposSistema = [
          'CONSECUTIVO',
          'DOCUMENTO',
          'EMAIL',
          'EMPRESA',
          'CIUDAD EMPRESA',
          'ANALISTA ASIGNADO',
          'EMAIL ANALISTA',
          'ESTADO',
          'FECHA SOLICITUD',
          'FECHA MODIFICACIÓN',
          'HORA MODIFICACIÓN'
        ];
        
        // Agregar campos del sistema en orden
        camposSistema.forEach(campo => {
          if (primeraFila.hasOwnProperty(campo)) {
            columnHeadersOrdenados.push(campo);
          }
        });
        
        // Agregar campos de estructura_datos en orden
        camposOrdenados.forEach(([nombreCampo, infoCampo]) => {
          const nombreColumna = formatColumnTitle(infoCampo.label);
          if (primeraFila.hasOwnProperty(nombreColumna) && !columnHeadersOrdenados.includes(nombreColumna)) {
            columnHeadersOrdenados.push(nombreColumna);
          }
        });
        
        // Agregar cualquier campo adicional que no esté en las listas anteriores
        Object.keys(primeraFila).forEach(campo => {
          if (!columnHeadersOrdenados.includes(campo)) {
            columnHeadersOrdenados.push(campo);
          }
        });
      }

      // Reorganizar los datos para que estén en el orden correcto
      const datosOrdenados = datosParaExportar.map(fila => {
        const filaOrdenada: Record<string, any> = {};
        columnHeadersOrdenados.forEach(columna => {
          filaOrdenada[columna] = fila[columna];
        });
        return filaOrdenada;
      });

      // Crear la hoja de trabajo con los datos ordenados
      const ws = XLSX.utils.json_to_sheet(datosOrdenados);

      // Obtener número de columnas dinámicamente
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      const numCols = range.e.c + 1;

      // Calcular el ancho óptimo de cada columna basado en el contenido
      const calcularAnchoColumna = (header: string, index: number): number => {
        // Anchos mínimos y máximos
        const MIN_WIDTH = 10;
        const MAX_WIDTH = 50;
        
        // Calcular ancho del header
        const headerWidth = header.length;
        
        // Calcular ancho máximo del contenido en esa columna
        let maxContentWidth = headerWidth;
        datosOrdenados.forEach((fila) => {
          const valor = fila[header];
          if (valor !== null && valor !== undefined) {
            const valorStr = String(valor);
            // Contar caracteres, pero considerar que algunos caracteres (como ñ, acentos) pueden tomar más espacio
            const valorLength = valorStr.length;
            // Si es muy largo, limitar el cálculo para no hacer columnas gigantes
            const maxVal = Math.min(valorLength, 100);
            if (maxVal > maxContentWidth) {
              maxContentWidth = maxVal;
            }
          }
        });
        
        // Calcular ancho óptimo: header + padding + margen
        // Usamos el máximo entre header y contenido, más un padding
        const width = Math.max(headerWidth, maxContentWidth) + 3; // +3 para padding
        
        // Aplicar límites
        const finalWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, width));
        
        return finalWidth;
      };

      // Configurar el ancho de las columnas basado en el contenido real
      const colWidths: { wch: number }[] = [];
      
      // Anchos preferidos para campos comunes (pueden ser sobrescritos si el contenido es mayor)
      const anchosPreferidos: Record<string, number> = {
        'CONSECUTIVO': 12,
        'DOCUMENTO': 18,
        'EMAIL': 30,
        'EMPRESA': 35,
        'CIUDAD EMPRESA': 20,
        'ANALISTA ASIGNADO': 25,
        'EMAIL ANALISTA': 30,
        'ESTADO': 18,
        'FECHA SOLICITUD': 18,
        'FECHA MODIFICACIÓN': 20,
        'HORA MODIFICACIÓN': 18
      };

      // Configurar ancho para cada columna usando el orden correcto
      columnHeadersOrdenados.forEach((header, index) => {
        // Si tiene un ancho preferido, usarlo como mínimo
        const anchoPreferido = anchosPreferidos[header];
        const anchoCalculado = calcularAnchoColumna(header, index);
        
        // Usar el mayor entre el preferido y el calculado
        const anchoFinal = anchoPreferido 
          ? Math.max(anchoPreferido, anchoCalculado)
          : anchoCalculado;
        
        colWidths.push({ wch: anchoFinal });
      });

      // Asegurar que tenemos anchos para todas las columnas
      while (colWidths.length < numCols) {
        colWidths.push({ wch: 15 });
      }

      ws['!cols'] = colWidths;

      // Función para detectar si una columna contiene principalmente números
      const esColumnaNumerica = (header: string, index: number): boolean => {
        // Validar primero si es teléfono o celular (NO debe ser numérica)
        const headerLower = header.toLowerCase().replace(/\s+/g, '');
        if (headerLower.includes('telefono') || 
            headerLower.includes('teléfono') || 
            headerLower.includes('celular') ||
            headerLower.includes('phone')) {
          return false;
        }
        
        // Nombres de columnas que típicamente contienen números
        // NOTA: TELEFONO y CELULAR están explícitamente excluidos arriba
        const columnasNumericasPorNombre = [
          'CONSECUTIVO', 'DOCUMENTO', 'ID',
          'SALARIO', 'SALARIO_BASICO', 'SALARIO_MENSUAL', 'AUXILIO_TRANSPORTE',
          'PORCENTAJE', 'CANTIDAD', 'TOTAL', 'PRECIO', 'COSTO'
        ];
        
        const headerUpper = header.toUpperCase();
        // Verificar si el nombre del header sugiere que es numérico
        if (columnasNumericasPorNombre.some(nombre => headerUpper.includes(nombre))) {
          return true;
        }
        
        // Verificar el contenido: si la mayoría de valores no vacíos son números, es numérica
        let valoresNumericos = 0;
        let valoresTotales = 0;
        
        datosOrdenados.forEach((fila) => {
          const valor = fila[header];
          if (valor !== null && valor !== undefined && valor !== '') {
            valoresTotales++;
            const valorStr = String(valor).trim();
            // Verificar si es un número (entero o decimal)
            if (/^-?\d+(\.\d+)?$/.test(valorStr) || /^-?\d+,\d+$/.test(valorStr)) {
              valoresNumericos++;
            }
          }
        });
        
        // Si al menos el 80% de los valores son números, consideramos la columna numérica
        return valoresTotales > 0 && (valoresNumericos / valoresTotales) >= 0.8;
      };

      // Aplicar formato a los headers (mayúsculas, negrita, fondo gris pálido)
      for (let col = 0; col < numCols; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        // Asegurar que la celda existe - si no, crearla
        if (!ws[cellAddress]) {
          ws[cellAddress] = { v: columnHeadersOrdenados[col] || '', t: 's' };
        }
        
        const headerName = columnHeadersOrdenados[col] || '';

        // Aplicar formato al header con fondo gris pálido
        // Usando exactamente el mismo patrón que AnalistasPage (con 'size' no 'sz')
        ws[cellAddress].s = {
          font: { 
            bold: true,
            size: 11,
            color: { rgb: "000000" }
          },
          fill: { 
            fgColor: { rgb: "D3D3D3" } // Gris claro (lightgray)
          },
          alignment: { 
            horizontal: "center", 
            vertical: "center"
          },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          }
        };
      }

      // Aplicar formato a las filas de datos
      for (let row = 1; row <= range.e.r; row++) {
        for (let col = 0; col < numCols; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
          if (!ws[cellAddress]) continue;

          const headerName = columnHeadersOrdenados[col] || '';
          let cellValue = ws[cellAddress].v;
          
          // Validar si es una columna de teléfono o celular (no debe recibir formato numérico)
          const headerNameLower = headerName.toLowerCase().replace(/\s+/g, '');
          const esTelefonoOCelular = headerNameLower.includes('telefono') || 
                                     headerNameLower.includes('teléfono') || 
                                     headerNameLower.includes('celular') ||
                                     headerNameLower.includes('phone');
          
          // Determinar si esta columna es numérica (excluyendo teléfonos y celulares)
          const esNumerica = !esTelefonoOCelular && esColumnaNumerica(headerName, col);
          
          // Si es una columna numérica (que no sea teléfono/celular) y el valor es un número, convertirlo y formatearlo
          if (esNumerica && cellValue !== null && cellValue !== undefined && cellValue !== '') {
            const numValue = typeof cellValue === 'number' ? cellValue : 
                            parseFloat(String(cellValue).replace(/,/g, '').replace('.', '.'));
            
            if (!isNaN(numValue)) {
              // Establecer el valor numérico
              ws[cellAddress].v = numValue;
              ws[cellAddress].t = 'n'; // Tipo numérico
              
              // Aplicar formato numérico con separadores de miles
              // La propiedad z contiene el formato de número de Excel
              if (numValue % 1 === 0) {
                // Es un entero - formato sin decimales con separadores de miles
                ws[cellAddress].z = '#,##0';
              } else {
                // Tiene decimales - formato con 2 decimales y separadores de miles
                ws[cellAddress].z = '#,##0.00';
              }
              
              // Formato de estilo para números (alineación a la derecha)
              // La celda ya existe y tiene v, t y z asignados arriba
              ws[cellAddress].s = {
                alignment: { 
                  vertical: "center",
                  horizontal: "right" // Números alineados a la derecha
                },
                border: {
                  top: { style: "thin", color: { rgb: "CCCCCC" } },
                  bottom: { style: "thin", color: { rgb: "CCCCCC" } },
                  left: { style: "thin", color: { rgb: "CCCCCC" } },
                  right: { style: "thin", color: { rgb: "CCCCCC" } }
                }
              };
            } else {
              // No es número válido, aplicar estilo normal de texto
              ws[cellAddress].s = {
                alignment: { 
                  vertical: "center",
                  horizontal: "left"
                },
                border: {
                  top: { style: "thin", color: { rgb: "CCCCCC" } },
                  bottom: { style: "thin", color: { rgb: "CCCCCC" } },
                  left: { style: "thin", color: { rgb: "CCCCCC" } },
                  right: { style: "thin", color: { rgb: "CCCCCC" } }
                }
              };
            }
          } else {
            // Formato base para celdas de texto
            ws[cellAddress].s = {
              alignment: { 
                vertical: "center",
                horizontal: "left"
              },
              border: {
                top: { style: "thin", color: { rgb: "CCCCCC" } },
                bottom: { style: "thin", color: { rgb: "CCCCCC" } },
                left: { style: "thin", color: { rgb: "CCCCCC" } },
                right: { style: "thin", color: { rgb: "CCCCCC" } }
              }
            };
          }
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
      // Nota: XLSX Community Edition puede tener limitaciones con estilos avanzados
      // Los estilos básicos (fill, font, alignment, border) deberían funcionar
      XLSX.writeFile(wb, nombreArchivo);

      toast.success(`Archivo Excel exportado exitosamente: ${nombreArchivo}`);
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      toast.error('Error al exportar el archivo Excel');
    }
  };

  // Los filtros ahora se aplican en el servidor, no necesitamos filtrado adicional
  const solicitudesFiltradas = solicitudes;

  // Funciones para limpiar filtros individuales
  const clearSolicitudIdFilter = () => {
    setSolicitudIdFilter("");
    setAppliedSolicitudId(undefined);
    setCurrentPage(1);
  };

  const clearNombreCandidatoFilter = () => {
    setNombreCandidatoFilter("");
    setAppliedNombreCandidato(undefined);
    setCurrentPage(1);
  };

  const clearCargoFilter = () => {
    setCargoFilter(undefined);
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setSolicitudIdFilter("");
    setNombreCandidatoFilter("");
    setNumeroDocumentoFilter("");
    setAppliedSolicitudId(undefined);
    setAppliedNumeroDocumento(undefined);
    setAppliedNombreCandidato(undefined);
    setCargoFilter(undefined);
    setEstadoFilter(undefined);
    setEmpresaFilter(undefined);
    setCurrentPage(1);
  };

  // Función para renderizar el paginador
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pagesToShow: (number | string)[] = [];
    const maxPagesToShow = 7;

    if (totalPages <= maxPagesToShow) {
      // Mostrar todas las páginas
      for (let i = 1; i <= totalPages; i++) {
        pagesToShow.push(i);
      }
    } else {
      // Lógica para mostrar páginas con elipsis
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pagesToShow.push(i);
        }
        pagesToShow.push("ellipsis");
        pagesToShow.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pagesToShow.push(1);
        pagesToShow.push("ellipsis");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pagesToShow.push(i);
        }
      } else {
        pagesToShow.push(1);
        pagesToShow.push("ellipsis");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pagesToShow.push(i);
        }
        pagesToShow.push("ellipsis");
        pagesToShow.push(totalPages);
      }
    }

    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
              className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
          {pagesToShow.map((page, index) => (
            <PaginationItem key={index}>
              {page === "ellipsis" ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  onClick={() => setCurrentPage(page as number)}
                  isActive={currentPage === page}
                  className="cursor-pointer"
                >
                  {page}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext
              onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
              className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

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

            {/* Filtros individuales */}
            <div className="p-4 bg-cyan-50 rounded-lg mb-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold text-gray-700">Filtros</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-2  mb-3">
                {/* Filtro por ID de solicitud - más pequeño */}
                <div className="relative">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    ID
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder=""
                      value={solicitudIdFilter}
                      onChange={(e) => {
                        setSolicitudIdFilter(e.target.value);
                      }}
                      className="w-full pr-6 h-8 text-xs"
                    />
                    {solicitudIdFilter && (
                      <button
                        onClick={clearSolicitudIdFilter}
                        className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Filtro por número de documento */}
                <div className="relative">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Documento
                  </label>
                  <div className="relative">
                    <Input
                      placeholder=""
                      value={numeroDocumentoFilter}
                      onChange={(e) => {
                        setNumeroDocumentoFilter(e.target.value);
                      }}
                      className="w-full pr-6 h-8 text-xs"
                    />
                    {numeroDocumentoFilter && (
                      <button
                        onClick={() => {
                          setNumeroDocumentoFilter("");
                          setAppliedNumeroDocumento(undefined);
                          setCurrentPage(1);
                        }}
                        className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Filtro por nombre de candidato - más pequeño */}
                <div className="relative">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Nombre
                  </label>
                  <div className="relative">
                    <Input
                      placeholder=""
                      value={nombreCandidatoFilter}
                      onChange={(e) => {
                        setNombreCandidatoFilter(e.target.value);
                      }}
                      className="w-full pr-6 h-8 text-xs"
                    />
                    {nombreCandidatoFilter && (
                      <button
                        onClick={clearNombreCandidatoFilter}
                        className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Filtro por cargo */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Cargo
                  </label>
                  <Select
                    value={cargoFilter || 'all'}
                    onValueChange={(value) => {
                      setCargoFilter(value === 'all' ? undefined : value);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-full h-9">
                      <SelectValue placeholder="" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all"></SelectItem>
                      {cargos.map((cargo) => (
                        <SelectItem key={cargo.id} value={cargo.id.toString()}>
                          {cargo.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro por estado */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <Select
                    value={estadoFilter || 'all'}
                    onValueChange={(value) => {
                      setEstadoFilter(value === 'all' ? undefined : value);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-full h-9">
                      <SelectValue placeholder="" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all"></SelectItem>
                      {estadosDisponibles.map((estado) => (
                        <SelectItem key={estado.value} value={estado.value}>
                          {estado.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro por empresa */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Empresa
                  </label>
                  <Select
                    value={empresaFilter || 'all'}
                    onValueChange={(value) => {
                      setEmpresaFilter(value === 'all' ? undefined : value);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-full h-9">
                      <SelectValue placeholder="" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all"></SelectItem>
                      {empresas.map((empresa) => (
                        <SelectItem key={empresa.id} value={empresa.id.toString()}>
                          {empresa.razon_social}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2"></div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={async () => {
                      setIsApplyingFilters(true);
                      try {
                        // Aplicar filtros actuales
                        // ID
                        const rawId = solicitudIdFilter.trim();
                        setAppliedSolicitudId(rawId ? Number(rawId) : undefined);
                        // Número de documento
                        const rawDoc = numeroDocumentoFilter.trim();
                        setAppliedNumeroDocumento(rawDoc || undefined);
                        // Nombre candidato (se validará longitud en fetch)
                        const rawNombre = nombreCandidatoFilter.trim();
                        setAppliedNombreCandidato(rawNombre || undefined);
                        // Resetear a primera página
                        setCurrentPage(1);
                        // Pequeño delay para que se vea la animación
                        await new Promise(resolve => setTimeout(resolve, 300));
                      } finally {
                        setIsApplyingFilters(false);
                      }
                    }}
                    disabled={isApplyingFilters || isLoading}
                    className="text-xs h-7 bg-cyan-600 hover:bg-cyan-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {isApplyingFilters || isLoading ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Aplicando...
                      </>
                    ) : (
                      <>
                        <Check className="h-3 w-3 mr-1" />
                        Aplicar filtros
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-xs h-7"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Limpiar todos
                  </Button>
                </div>
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
                <>
                  <SolicitudesList
                    solicitudes={solicitudesFiltradas}
                    onEdit={handleEdit}
                    onView={handleView}
                    onApprove={handleApprove}
                    onContact={handleContact}
                    onStandBy={handleStandBy}
                    onReactivate={handleReactivate}
                    onDeserto={handleDeserto}
                    onDescartado={handleDescartado}
                    onCancel={handleCancel}
                    onContract={handleContract}
                    onAssign={handleAssign}
                    onValidateDocuments={handleValidateDocuments}
                    onReturnDocuments={handleReturnDocuments}
                    onCiteExams={handleCiteExams}
                    isLoading={isLoading}
                  />
                  
                  {/* Información de paginación y contador */}
                  <div className="flex items-center justify-between p-4 border-t bg-gray-50">
                    <div className="text-sm text-gray-600">
                      Mostrando <span className="font-semibold">{solicitudesFiltradas.length}</span> de{' '}
                      <span className="font-semibold">{totalRecords}</span> solicitudes
                      {totalPages > 0 && (
                        <>
                          {' '}(Página <span className="font-semibold">{currentPage}</span> de{' '}
                          <span className="font-semibold">{totalPages}</span>)
                        </>
                      )}
                    </div>
                    {renderPagination()}
                  </div>
                </>
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


import React, { useState, useEffect, useRef } from 'react';
import { FileText, CheckCircle, AlertCircle, ArrowLeft, Clock, User, Phone, Pause, Play, Edit, Plus, XCircle, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { plantillasService, Plantilla, verificarEstructuraDB } from '@/services/plantillasService';
import { solicitudesService, Solicitud } from '@/services/solicitudesService';
import { solicitudesLogsService } from '@/services/solicitudesLogsService';
import type { SolicitudLog as SolicitudLogDto } from '@/services/solicitudesLogsService';
import FormRenderer from '@/components/FormRenderer';
import { toast } from 'sonner';
import { useLoading } from '@/contexts/LoadingContext';
import useSystemColors from '@/hooks/useSystemColors';
import { useAuth } from '@/contexts/AuthContext';
import { canCreateSolicitud } from '@/utils/empresaValidation';
import ModalSinEmpresa from './ModalSinEmpresa';

interface PlantillasSelectorProps {
  empresaId?: number | null; // Opcional: si no hay empresa, mostrar todas las plantillas
  onPlantillaSelect: (plantilla: Plantilla) => void;
  selectedSolicitud?: Solicitud; // Para edición
  onSave?: () => void; // Callback cuando se guarda exitosamente
  onCancel?: () => void; // Callback cuando se cancela
  readOnly?: boolean; // Nuevo: modo solo lectura
}

export default function PlantillasSelector({
  empresaId,
  onPlantillaSelect,
  selectedSolicitud,
  onSave,
  onCancel,
  readOnly = false
}: PlantillasSelectorProps) {
  const { startLoading, stopLoading } = useLoading();
  const { user } = useAuth();
  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlantilla, setSelectedPlantilla] = useState<Plantilla | null>(null);
  const [estructuraFormulario, setEstructuraFormulario] = useState<any>(null);
  const [isLoadingEstructura, setIsLoadingEstructura] = useState(false);
  const [initialFormData, setInitialFormData] = useState<Record<string, any>>({});
  const [logs, setLogs] = useState<SolicitudLogDto[]>([]);
  const [logsLoading, setLogsLoading] = useState<boolean>(false);
  const [showModalSinEmpresa, setShowModalSinEmpresa] = useState(false);
  
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { getEstadoBadgeClasses } = useSystemColors();

  const getEstadoTextClassFromSystem = (estado?: string) => {
    if (!estado) return 'text-gray-700';
    const badge = getEstadoBadgeClasses(estado);
    const textClass = badge.split(' ').find((c) => c.startsWith('text-')) || 'text-gray-700';
    return textClass;
  };
  const getEstadoDotBgFromSystem = (estado?: string) => {
    if (!estado) return 'bg-gray-500';
    const badge = getEstadoBadgeClasses(estado);
    const bgClass = badge.split(' ').find((c) => c.startsWith('bg-')) || 'bg-gray-500';
    return bgClass.replace('bg-opacity-15', '').replace('/20', '');
  };

  useEffect(() => {
    fetchPlantillas();
  }, [empresaId]);

  // Cargar datos para edición
  useEffect(() => {
    if (selectedSolicitud && selectedSolicitud.plantilla_id) {
      loadSolicitudForEdit();
    }
  }, [selectedSolicitud]);

  // Cargar timeline cuando hay una solicitud seleccionada con ID
  useEffect(() => {
    const loadLogs = async () => {
      if (!selectedSolicitud?.id) {
        setLogs([]);
        return;
      }
      try {
        setLogsLoading(true);
        const data = await solicitudesLogsService.getLogsBySolicitud(selectedSolicitud.id);
        setLogs(data || []);
      } catch (err) {
        console.error('Error cargando logs de la solicitud:', err);
        setLogs([]);
      } finally {
        setLogsLoading(false);
      }
    };
    loadLogs();
  }, [selectedSolicitud?.id]);

  const formatDateTime = (date?: string | Date | null) => {
    if (!date) return '—';
    const d: Date = typeof date === 'string' ? new Date(date) : (date as Date);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString();
  };

  const mapAccionBadgeClass = (accion: string) => {
    switch ((accion || '').toUpperCase()) {
      case 'CREAR':
      case 'CREADO':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'ACTUALIZAR':
      case 'ACTUALIZADO':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'APROBAR':
      case 'APROBADO':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'CANCELAR':
      case 'CANCELADA':
      case 'CANCELADO':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'CONTACTAR':
      case 'CONTACTADO':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'REACTIVAR':
      case 'REACTIVADA':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'ASIGNAR':
      case 'ASIGNADO':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const mapAccionLabel = (accion: string) => {
    const normalized = (accion || '').toUpperCase();
    switch (normalized) {
      case 'CREAR':
      case 'CREADO':
        return 'Creación';
      case 'ACTUALIZAR':
      case 'ACTUALIZADO':
        return 'Actualización';
      case 'APROBAR':
      case 'APROBADO':
        return 'Aprobación';
      case 'CANCELAR':
      case 'CANCELADA':
      case 'CANCELADO':
        return 'Cancelación';
      case 'CONTACTAR':
      case 'CONTACTADO':
        return 'Contacto';
      case 'REACTIVAR':
      case 'REACTIVADA':
        return 'Reactivación';
      case 'ASIGNAR':
      case 'ASIGNADO':
        return 'Asignación';
      default:
        // Capitaliza genéricamente
        return (accion || 'Acción').toLowerCase().replace(/(^|\s)\S/g, (t) => t.toUpperCase());
    }
  };

  const getAccionIcon = (accion: string) => {
    const normalized = (accion || '').toUpperCase();
    switch (normalized) {
      case 'CREAR':
      case 'CREADO':
        return <Plus className="h-4 w-4 text-emerald-600" />;
      case 'ACTUALIZAR':
      case 'ACTUALIZADO':
        return <Edit className="h-4 w-4 text-blue-600" />;
      case 'APROBAR':
      case 'APROBADO':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'CANCELAR':
      case 'CANCELADA':
      case 'CANCELADO':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'CONTACTAR':
      case 'CONTACTADO':
        return <Phone className="h-4 w-4 text-cyan-600" />;
      case 'REACTIVAR':
      case 'REACTIVADA':
        return <Play className="h-4 w-4 text-purple-600" />;
      case 'ASIGNAR':
      case 'ASIGNADO':
        return <User className="h-4 w-4 text-cyan-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getAccionDotColor = (accion: string) => {
    const normalized = (accion || '').toUpperCase();
    switch (normalized) {
      case 'CREAR':
      case 'CREADO':
        return 'bg-emerald-500';
      case 'ACTUALIZAR':
      case 'ACTUALIZADO':
        return 'bg-blue-500';
      case 'APROBAR':
      case 'APROBADO':
        return 'bg-green-500';
      case 'CANCELAR':
      case 'CANCELADA':
      case 'CANCELADO':
        return 'bg-red-500';
      case 'CONTACTAR':
      case 'CONTACTADO':
        return 'bg-cyan-500';
      case 'REACTIVAR':
      case 'REACTIVADA':
        return 'bg-purple-500';
      case 'ASIGNAR':
      case 'ASIGNADO':
        return 'bg-teal-500';
      default:
        return 'bg-gray-400';
    }
  };

  // Colores por ESTADO (para texto y punto)
  const getEstadoTextColor = (estado?: string) => {
    const e = (estado || '').toUpperCase();
    switch (e) {
      case 'PENDIENTE':
      case 'pendiente documentos':
        return 'text-purple-600';
      case 'ASIGNADO':
        return 'text-blue-600';
      case 'STANDBY':
      case 'STAND BY':
        return 'text-gray-600';
      case 'APROBADO':
      case 'FINALIZADO':
        return 'text-green-600';
      case 'CANCELADO':
      case 'RECHAZADO':
        return 'text-red-600';
      default:
        return 'text-cyan-600';
    }
  };
  const getEstadoDotBg = (estado?: string) => {
    const e = (estado || '').toUpperCase();
    switch (e) {
      case 'PENDIENTE':
      case 'pendiente documentos':
        return 'bg-purple-500';
      case 'ASIGNADO':
        return 'bg-blue-500';
      case 'STANDBY':
      case 'STAND BY':
        return 'bg-gray-500';
      case 'APROBADO':
      case 'FINALIZADO':
        return 'bg-green-500';
      case 'CANCELADO':
      case 'RECHAZADO':
        return 'bg-red-500';
      default:
        return 'bg-cyan-500';
    }
  };

  const fetchPlantillas = async () => {
    setIsLoading(true);
    setError(null);
    startLoading(); // Iniciar loading global
    try {
      console.log('🚀 Iniciando carga de plantillas para empresa ID:', empresaId);

      // Primero verificamos la estructura de la base de datos
      console.log('🔍 Verificando estructura de la base de datos...');
      const estructuraDB = await verificarEstructuraDB();
      console.log('📊 Estructura DB:', estructuraDB);

      // Si hay empresaId, obtener solo plantillas de esa empresa
      // Si no hay empresaId, mostrar todas las plantillas activas (usuario sin empresa asociada)
      let data;
      if (empresaId) {
        data = await plantillasService.getByEmpresa(empresaId, true); // Skip global loading, lo manejamos aquí
      } else {
        console.log('📋 No hay empresaId proporcionado, mostrando todas las plantillas activas');
        data = await plantillasService.getAllActivas();
      }
      
      console.log('📦 Plantillas recibidas:', data);
      console.log('📊 Cantidad de plantillas:', data?.length || 0);
      setPlantillas(data);
      setIsLoading(false);
      
      // Detener loading global después de que React haya renderizado las plantillas
      setTimeout(() => {
        stopLoading();
      }, 100);
    } catch (error) {
      console.error('❌ Error al cargar plantillas:', error);
      setError('Error al cargar las plantillas');
      setIsLoading(false);
      stopLoading(); // Detener loading global en caso de error
      toast.error("No se pudieron cargar las plantillas de la empresa");
    }
  };

  const loadSolicitudForEdit = async () => {
    console.log('🔍 PlantillasSelector - Cargando solicitud para editar:', selectedSolicitud);

    if (!selectedSolicitud || !selectedSolicitud.plantilla_id) return;

    try {
      setIsLoadingEstructura(true);

      // Obtener la plantilla utilizada en la solicitud
      const plantilla = await plantillasService.getById(selectedSolicitud.plantilla_id);
      console.log('🔍 PlantillasSelector - Plantilla obtenida para edición:', plantilla);

      if (plantilla) {
        setSelectedPlantilla(plantilla);
        setEstructuraFormulario(plantilla.estructura_formulario);

        // Cargar los datos guardados de la solicitud
        console.log('🔍 PlantillasSelector - Datos de estructura_datos:', selectedSolicitud.estructura_datos);
        if (selectedSolicitud.estructura_datos) {
          setInitialFormData(selectedSolicitud.estructura_datos);
          console.log('🔍 PlantillasSelector - Datos iniciales establecidos:', selectedSolicitud.estructura_datos);
        }

        onPlantillaSelect(plantilla);
      }
    } catch (error) {
      console.error('Error cargando solicitud para editar:', error);
      toast.error('Error al cargar los datos de la solicitud');
    } finally {
      setIsLoadingEstructura(false);
    }
  };

  const handlePlantillaSelect = async (plantilla: Plantilla) => {
    console.log('🎯 Plantilla seleccionada:', plantilla);
    setSelectedPlantilla(plantilla);
    setIsLoadingEstructura(true);

    try {
      // Obtener la plantilla completa con la estructura del formulario
      const plantillaCompleta = await plantillasService.getById(plantilla.id);

      if (plantillaCompleta) {
        console.log('📋 Plantilla completa obtenida:', plantillaCompleta);
        console.log('🏗️ Estructura del formulario:', plantillaCompleta.estructura_formulario);

        if (plantillaCompleta.estructura_formulario) {
          console.log('🔍 Estructura del formulario completa:', JSON.stringify(plantillaCompleta.estructura_formulario, null, 2));
          setEstructuraFormulario(plantillaCompleta.estructura_formulario);
          onPlantillaSelect(plantillaCompleta);

          // Solo resetear datos iniciales si no estamos editando
          if (!selectedSolicitud) {
            setInitialFormData({});
          }
        } else {
          console.warn('⚠️ La plantilla no tiene estructura de formulario definida');
          setEstructuraFormulario(null);
          toast.warning("Esta plantilla no tiene estructura de formulario configurada");
        }
      } else {
        console.error('❌ No se pudo obtener la plantilla completa');
        setEstructuraFormulario(null);
        toast.error("No se pudo obtener la información completa de la plantilla");
      }
    } catch (error) {
      console.error('❌ Error al obtener estructura del formulario:', error);
      setEstructuraFormulario(null);
      toast.error("Error al cargar la estructura del formulario");
    } finally {
      setIsLoadingEstructura(false);
    }
  };

  const handleFormSave = async (formData: Record<string, any>) => {
    console.log('🔍 PlantillasSelector - Datos recibidos del formulario:', formData);
    console.log('🔍 PlantillasSelector - Plantilla seleccionada:', selectedPlantilla);
    console.log('🔍 PlantillasSelector - Solicitud existente:', selectedSolicitud);

    if (!selectedPlantilla) {
      toast.error('No hay plantilla seleccionada');
      return;
    }

    // Validar si el usuario puede crear solicitudes (tiene empresa asociada)
    const validation = canCreateSolicitud(user);
    if (!validation.canCreate) {
      console.warn('❌ Usuario no puede crear solicitud:', validation.errorMessage);
      console.log('🔍 Mostrando modal sin empresa, estado actual:', showModalSinEmpresa);
      
      // Mostrar modal inmediatamente
      setShowModalSinEmpresa(true);
      console.log('🔍 Estado del modal después de setShowModalSinEmpresa(true):', showModalSinEmpresa);
      
      // También mostrar toast como fallback
      toast.error('No puedes crear solicitudes sin tener una empresa asociada');
      
      return;
    }

    // Activar loading global
    startLoading();
    console.log('🔍 PlantillasSelector - Loading global activado');

    try {
      if (selectedSolicitud?.id) {
        // Actualizar solicitud existente
        console.log('🔍 PlantillasSelector - Actualizando solicitud ID:', selectedSolicitud.id);
        await solicitudesService.updateWithTemplate(selectedSolicitud.id, formData);
        toast.success('Solicitud actualizada correctamente');
        console.log('🔍 PlantillasSelector - Solicitud actualizada exitosamente');
      } else {
        // Crear nueva solicitud
        console.log('🔍 PlantillasSelector - Creando nueva solicitud');
        await solicitudesService.createWithTemplate(
          validation.empresaId || empresaId,
          selectedPlantilla.id,
          selectedPlantilla.nombre,
          formData
        );
        toast.success('Solicitud creada correctamente');
        console.log('🔍 PlantillasSelector - Solicitud creada exitosamente');
      }

      // Llamar callback de éxito
      if (onSave) {
        onSave();
      }
    } catch (error) {
      console.error('Error guardando solicitud:', error);
      toast.error('Error al guardar la solicitud');
    } finally {
      // Detener loading global siempre
      stopLoading();
      console.log('🔍 PlantillasSelector - Loading global detenido');
    }
  };

  const handleFormCancel = () => {
    setSelectedPlantilla(null);
    setEstructuraFormulario(null);
    setInitialFormData({});

    if (onCancel) {
      onCancel();
    }
  };

  const handleContactAdmin = () => {
    // Aquí puedes implementar la lógica para contactar al administrador
    // Por ejemplo, abrir un modal de contacto, enviar un email, etc.
    toast.info('Funcionalidad de contacto con administrador en desarrollo');
    setShowModalSinEmpresa(false);
  };

  const handleCloseModalSinEmpresa = () => {
    setShowModalSinEmpresa(false);
  };

  // Debug: Monitorear cambios en el estado del modal
  useEffect(() => {
    console.log('🔍 useEffect ejecutado - Estado del modal cambió:', showModalSinEmpresa);
    if (showModalSinEmpresa) {
      console.log('🔍 MODAL DEBERÍA ESTAR VISIBLE AHORA');
    }
  }, [showModalSinEmpresa]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando plantillas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error al cargar plantillas</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button 
          onClick={() => {
            setError(null);
            setIsLoading(true);
            startLoading();
            fetchPlantillas();
          }} 
          variant="outline"
        >
          Intentar nuevamente
        </Button>
      </div>
    );
  }

  if (plantillas.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay plantillas disponibles</h3>
        <p className="text-gray-600">
          La empresa no tiene plantillas de solicitudes asignadas.
        </p>
      </div>
    );
  }

  // Si hay una plantilla seleccionada, mostrar el renderizador
  if (selectedPlantilla) {
    return (
      <div className="space-y-6">

        {/* Renderizador del Formulario */}
        <div>
          {isLoadingEstructura ? (
            <div className="border rounded-lg p-6 bg-white flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Cargando estructura del formulario...</p>
              </div>
            </div>
          )
            : estructuraFormulario ? (
              <div className="border rounded-lg p-6 bg-white space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">Formulario de Solicitud</h4>
                    <p className="text-sm text-gray-600">Plantilla: {selectedPlantilla?.nombre || 'Cargando...'}</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedPlantilla(null);
                      setEstructuraFormulario(null);
                    }}
                    className="flex items-center gap-1.5"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Cambiar Plantilla
                  </Button>
                </div>
                <FormRenderer
                  estructura={estructuraFormulario}
                  hideFieldLabels={true}
                  initialData={initialFormData}
                  onSave={readOnly ? undefined : handleFormSave}
                  onCancel={onCancel}
                  showButtons={!readOnly}
                  readOnly={readOnly}
                />
                {/* Timeline estilo imagen de referencia */}
                <div className="lg:pl-6 lg:border-l lg:border-gray-200">
                  <div className="bg-white rounded-lg border border-gray-200">
                    <div className="p-4 border-b flex items-center gap-2">
                      <Clock className="h-4 w-4 text-cyan-600" />
                      <span className="font-semibold text-gray-800">Historial de la solicitud</span>
                    </div>
                    <div className="p-4 max-h-[60vh] overflow-y-auto bg-gray-50">
                      {logsLoading ? (
                        <div className="flex items-center justify-center py-6 text-gray-500 text-sm">Cargando historial...</div>
                      ) : logs.length === 0 ? (
                        <div className="text-gray-500 text-sm">Sin registros de historial</div>
                      ) : (
                        <div ref={containerRef} className="relative py-8 overflow-x-auto">
                          {/* Timeline horizontal simplificado */}
                          <div className="flex items-start relative min-w-max">
                            {/* Línea conectora horizontal en la parte superior */}
                            <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-300 z-0"></div>
                            
                            {logs.slice().reverse().map((log, idx) => {
                              const estadoTexto = (log.estado_nuevo || log.estado_anterior || 'N/A') as string;
                              const estadoTextColor = getEstadoTextClassFromSystem(estadoTexto);
                              const estadoDot = getEstadoDotBgFromSystem(estadoTexto);
                              const isLast = idx === logs.length - 1;
                              
                              return (
                                <div key={log.id} className="relative z-10 flex flex-col items-center mx-2 w-72 flex-shrink-0">
                                  {/* Icono del estado */}
                                  <div className="relative">
                                    <div className={`w-8 h-8 rounded-full border-4 border-white shadow-lg ${estadoDot} flex items-center justify-center`}>
                                      <div className="w-3 h-3 rounded-full bg-white"></div>
                                    </div>
                                  </div>
                                  
                                  {/* Contenido de la tarjeta */}
                                  <div className="mt-6 w-64 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                                    <div className="text-center">
                                      {/* Estado */}
                                      <div className={`text-sm font-bold uppercase tracking-wide ${estadoTextColor} mb-2`}>
                                        {estadoTexto}
                                      </div>
                                      
                                      {/* Información */}
                                      <div className="space-y-1 text-xs text-gray-600">
                                        <div className="flex items-center justify-center gap-1">
                                          <Clock className="h-3 w-3" />
                                          <span>{formatDateTime(log.fecha_accion)}</span>
                                        </div>
                                        
                                        {log.usuario && (
                                          <div className="flex items-center justify-center gap-1">
                                            <User className="h-3 w-3" />
                                            <span>{`${log.usuario.primer_nombre || ''} ${log.usuario.primer_apellido || ''}`.trim() || log.usuario.username}</span>
                                          </div>
                                        )}
                                        
                                        {log.observacion && (
                                          <div className="mt-2 p-2 bg-gray-50 rounded text-left">
                                            <div className="text-xs text-gray-500 mb-1">Observación:</div>
                                            <div className="text-xs text-gray-700 line-clamp-3">{log.observacion}</div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border rounded-lg p-6 bg-white text-center py-8 text-gray-500">
                <>
                  <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">No hay estructura definida</p>
                  <p className="text-sm">Esta plantilla no tiene estructura de formulario configurada</p>
                </>
              </div>
            )}
        </div>
      </div>
    );
  }

  // Si no hay plantilla seleccionada, mostrar la lista de plantillas
  return (
    <>
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Plantillas de Solicitudes</h2>
            <p className="text-gray-600">
              Selecciona una plantilla para crear una nueva solicitud
            </p>
            {!empresaId && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Nota:</strong> Al no tener una empresa asociada, se muestran todas las plantillas disponibles del sistema.
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {plantillas.map((plantilla) => (
              <Card
                key={plantilla.id}
                className={`h-56 bg-white shadow-md border border-gray-200 transition-all duration-200 ease-in-out flex flex-col ${plantilla.activa ? 'hover:border-blue-500 hover:shadow-lg hover:scale-[1.02] cursor-pointer group' : 'opacity-70'}`}
                onClick={plantilla.activa ? () => handlePlantillaSelect(plantilla) : undefined}
              >
                <CardHeader className="pb-2 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <FileText className="h-5 w-5 text-blue-600 group-hover:text-blue-700 transition-colors" />
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={plantilla.activa ? "default" : "destructive"}
                        className={`text-xs font-medium px-2 py-0.5 ${plantilla.activa ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}`}
                      >
                        {plantilla.activa ? "Activa" : "Inactiva"}
                      </Badge>
                    </div>
                  </div>
                  <CardTitle className="text-sm font-semibold text-gray-900 mt-2 truncate" title={plantilla.nombre}>
                    {plantilla.nombre}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="pt-0 flex flex-col flex-grow">
                  {/* Información de la empresa */}
                  <div className="mb-3 p-2 bg-gray-50 rounded-md border flex-shrink-0">
                    <div className="flex items-center gap-1 mb-1">
                      <Building className="h-3 w-3 text-gray-500" />
                      <span className="text-xs font-medium text-gray-600">Empresa:</span>
                    </div>
                    <p className="text-xs text-gray-700 font-medium truncate" title={plantilla.empresa_nombre || 'Sin empresa'}>
                      {plantilla.empresa_nombre || 'Sin empresa'}
                    </p>
                  </div>
                  
                  {/* Descripción */}
                  <div className="flex-grow mb-3">
                    {plantilla.descripcion ? (
                      <p className="text-xs text-gray-700 truncate" title={plantilla.descripcion}>
                        {plantilla.descripcion}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400 italic">Sin descripción</p>
                    )}
                  </div>
                  
                  {/* Botón */}
                  <div className="flex-shrink-0">
                    <Button
                      className="w-full bg-cyan-600 text-white hover:bg-cyan-700 flex items-center justify-center text-xs px-2 py-1.5 h-8"
                      disabled={!plantilla.activa}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Seleccionar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Modal de advertencia para usuarios sin empresa */}
      {console.log('🔍 Renderizando modal, showModalSinEmpresa:', showModalSinEmpresa)}
      
      {/* Modal de prueba simple */}
      {showModalSinEmpresa && console.log('🔍 RENDERIZANDO MODAL DE PRUEBA')}
      {showModalSinEmpresa && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center" 
          style={{ zIndex: 9999 }}
        >
          <div className="bg-white p-8 rounded-lg max-w-md mx-4 shadow-2xl">
            <h2 className="text-xl font-bold mb-4 text-red-600">⚠️ ADVERTENCIA</h2>
            <p className="mb-6 text-gray-700">
              No puedes crear solicitudes sin tener una empresa asociada a tu cuenta.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={handleCloseModalSinEmpresa}
                className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
              >
                Entendido
              </button>
              <button 
                onClick={handleContactAdmin}
                className="bg-orange-500 text-white px-6 py-2 rounded hover:bg-orange-600"
              >
                Contactar Admin
              </button>
            </div>
          </div>
        </div>
      )}
      
      <ModalSinEmpresa
        isOpen={showModalSinEmpresa}
        onClose={handleCloseModalSinEmpresa}
        onContactAdmin={handleContactAdmin}
      />
    </>
  );
} 



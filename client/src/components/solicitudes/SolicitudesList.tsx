import React, { useState, useEffect } from 'react';
import { Edit, Pause, CheckCircle, Phone, Play, XCircle, Eye, X, Ban, User, Building2, FileText, Clock, Code, DollarSign, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Solicitud } from '@/services/solicitudesService';
import { useLoading } from '@/contexts/LoadingContext';
import { Can } from '@/contexts/PermissionsContext';
import { useRegisterView } from '@/hooks/useRegisterView';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { solicitudesLogsService, type SolicitudLog } from '@/services/solicitudesLogsService';
// import SolicitudForm from '@/components/solicitudes/SolicitudForm';

interface SolicitudesListProps {
  solicitudes: Solicitud[];
  onEdit: (solicitud: Solicitud) => void;
  onView: (solicitud: Solicitud) => void;
  onApprove: (id: number) => void;
  onContact: (id: number, observacion: string) => void;
  onStandBy: (id: number, observacion: string) => void;
  onReactivate: (id: number) => void;
  onDeserto: (id: number, observacion: string) => void;
  onCancel: (id: number, observacion: string) => void;
  onAssign: (id: number, analistaId: number) => void;
  isLoading?: boolean;
}

const SolicitudesList: React.FC<SolicitudesListProps> = ({
  solicitudes,
  onEdit,
  onView,
  onApprove,
  onContact,
  onStandBy,
  onReactivate,
  onDeserto,
  onCancel,
  onAssign,
  isLoading = false
}) => {
  const { startLoading, stopLoading } = useLoading();
  const { addAction } = useRegisterView('Solicitudes', 'listado', 'Listado de Solicitudes');
  useEffect(() => {
    addAction('editar', 'Editar Solicitud');
    addAction('aprobar', 'Aprobar Solicitud');
    addAction('contactar', 'Marcar Contactado');
    addAction('standby', 'Poner en Stand By');
    addAction('reactivar', 'Reactivar Solicitud');
    addAction('deserto', 'Marcar Deserto');
    addAction('visualizar', 'Visualizar Solicitud');
    addAction('cancelar', 'Cancelar Solicitud');
  }, [addAction]);
  const [confirmApproveOpen, setConfirmApproveOpen] = useState(false);
  const [confirmContactOpen, setConfirmContactOpen] = useState(false);
  const [confirmStandByOpen, setConfirmStandByOpen] = useState(false);
  const [confirmReactivateOpen, setConfirmReactivateOpen] = useState(false);
  const [confirmDesertoOpen, setConfirmDesertoOpen] = useState(false);
  const [selectedSolicitudId, setSelectedSolicitudId] = useState<number | null>(null);
  const [contactingSolicitudId, setContactingSolicitudId] = useState<number | null>(null);
  const [standByObservacion, setStandByObservacion] = useState('');
  const [contactObservacion, setContactObservacion] = useState('');
  const [desertoObservacion, setDesertoObservacion] = useState('');
  const [cancelObservacion, setCancelObservacion] = useState('');
  const [solicitudesStandBy, setSolicitudesStandBy] = useState<Map<number, string>>(new Map());
  const [reactivatingSolicitudId, setReactivatingSolicitudId] = useState<number | null>(null);
  const [desertoSolicitudId, setDesertoSolicitudId] = useState<number | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedSolicitudForView, setSelectedSolicitudForView] = useState<Solicitud | null>(null);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logs, setLogs] = useState<SolicitudLog[]>([]);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [cancelingSolicitudId, setCancelingSolicitudId] = useState<number | null>(null);
  const [confirmAssignOpen, setConfirmAssignOpen] = useState(false);
  const [assigningSolicitudId, setAssigningSolicitudId] = useState<number | null>(null);
  const [suggestedAnalyst, setSuggestedAnalyst] = useState<{analista_id: number, analista_nombre: string} | null>(null);

  // Detener loading global cuando se complete una operación de Contacto
  useEffect(() => {
    if (contactingSolicitudId) {
      console.log('🔍 useEffect de contacto ejecutado, contactingSolicitudId:', contactingSolicitudId);
      const solicitud = solicitudes.find(s => s.id === contactingSolicitudId);
      console.log('🔍 Solicitud encontrada:', solicitud?.id, 'Estado:', solicitud?.estado);

      if (solicitud && solicitud.estado === 'PENDIENTE DOCUMENTOS') {
        console.log('🔍 Operación de Contacto completada, limpiando estado...');
        setContactingSolicitudId(null);
        stopLoading(); // Detener loading global cuando se complete la operación de Contacto
        console.log('🔍 Loading global detenido por operación de Contacto');
      } else if (solicitud) {
        console.log('🔍 Solicitud aún no en estado PENDIENTE DOCUMENTOS, esperando...');
        console.log('🔍 Estado actual:', solicitud.estado, 'Esperando: PENDIENTE DOCUMENTOS');
      } else {
        console.log('🔍 Solicitud no encontrada, puede que se haya recargado la lista');
      }
    }
  }, [contactingSolicitudId, stopLoading, solicitudes.length]);

  // Timeout de seguridad para detener loading global si no se completa en 10 segundos
  useEffect(() => {
    if (contactingSolicitudId) {
      const timeoutId = setTimeout(() => {
        console.log('⚠️ Timeout de seguridad: Deteniendo loading global por operación de Contacto');
        setContactingSolicitudId(null);
        stopLoading();
      }, 10000); // 10 segundos

      return () => clearTimeout(timeoutId);
    }
  }, [contactingSolicitudId, stopLoading]);

  // Detener loading global cuando se complete una operación de Stand By
  useEffect(() => {
    // Si hay solicitudes que cambiaron a STAND BY, detener el loading
    const solicitudesEnStandBy = solicitudes.filter(s => isStandBy(s.estado));
    if (solicitudesEnStandBy.length > 0) {
      // Verificar si alguna solicitud acaba de cambiar a STAND BY
      const solicitudesNuevasEnStandBy = solicitudesEnStandBy.filter(s =>
        !solicitudesStandBy.has(s.id!)
      );

      if (solicitudesNuevasEnStandBy.length > 0) {
        stopLoading(); // Detener loading global cuando se complete Stand By
      }
    }
  }, [stopLoading, solicitudes.length]);

  // Detener loading global cuando se complete una reactivación
  useEffect(() => {
    // Si hay solicitudes que ya no están en STAND BY y teníamos un reactivatingSolicitudId,
    // significa que la reactivación se completó
    if (reactivatingSolicitudId) {
      console.log('🔍 useEffect de reactivación ejecutado, reactivatingSolicitudId:', reactivatingSolicitudId);
      const solicitud = solicitudes.find(s => s.id === reactivatingSolicitudId);
      console.log('🔍 Solicitud encontrada:', solicitud?.id, 'Estado:', solicitud?.estado);

      // Verificar si la solicitud ya no está en STAND BY (reactivación completada)
      if (solicitud && !isStandBy(solicitud.estado)) {
        console.log('🔍 Reactivación completada, limpiando estado...');
        setReactivatingSolicitudId(null);
        stopLoading(); // Detener loading global cuando se complete la reactivación
        console.log('🔍 Loading global detenido por reactivación');
      } else if (solicitud) {
        console.log('🔍 Solicitud aún en Stand By, esperando reactivación...');
      } else {
        console.log('🔍 Solicitud no encontrada, puede que se haya recargado la lista');
      }
    }
  }, [solicitudes, reactivatingSolicitudId, stopLoading]);

  // Timeout de seguridad para detener loading global en reactivación si no se completa en 10 segundos
  useEffect(() => {
    if (reactivatingSolicitudId) {
      const timeoutId = setTimeout(() => {
        console.log('⚠️ Timeout de seguridad: Deteniendo loading global por operación de Reactivación');
        setReactivatingSolicitudId(null);
        stopLoading();
      }, 10000); // 10 segundos

      return () => clearTimeout(timeoutId);
    }
  }, [reactivatingSolicitudId, stopLoading]);

  // Timeout de seguridad para detener loading global en cancelación si no se completa en 10 segundos
  useEffect(() => {
    if (cancelingSolicitudId) {
      const timeoutId = setTimeout(() => {
        console.log('⚠️ Timeout de seguridad: Deteniendo loading global por operación de Cancelación');
        setCancelingSolicitudId(null);
        stopLoading();
      }, 10000); // 10 segundos

      return () => clearTimeout(timeoutId);
    }
  }, [cancelingSolicitudId, stopLoading]);

  // Limpiar estados de solicitudes que ya no están en STAND BY
  useEffect(() => {
    setSolicitudesStandBy(prev => {
      const newMap = new Map<number, string>();
      solicitudes.forEach(solicitud => {
        if (isStandBy(solicitud.estado)) {
          if (prev.has(solicitud.id!)) {
            newMap.set(solicitud.id!, prev.get(solicitud.id!)!);
          } else {
            newMap.set(solicitud.id!, 'PENDIENTE');
          }
        }
      });
      // Evitar re-renders innecesarios: si el contenido no cambió, retorna prev
      if (newMap.size === prev.size) {
        let equal = true;
        for (const [k, v] of newMap) {
          if (prev.get(k) !== v) { equal = false; break; }
        }
        if (equal) return prev;
      }
      return newMap;
    });
  }, [solicitudes]);

  // Detener loading global cuando se complete una operación de Deserto
  useEffect(() => {
    if (desertoSolicitudId) {
      console.log('🔍 useEffect de deserto ejecutado, desertoSolicitudId:', desertoSolicitudId);
      const solicitud = solicitudes.find(s => s.id === desertoSolicitudId);
      console.log('🔍 Solicitud encontrada:', solicitud?.id, 'Estado:', solicitud?.estado);

      if (solicitud && isDeserto(solicitud.estado)) {
        console.log('🔍 Operación de Deserto completada, limpiando estado...');
        setDesertoSolicitudId(null);
        stopLoading(); // Detener loading global cuando se complete la operación de Deserto
        console.log('🔍 Loading global detenido por operación de Deserto');
      } else if (solicitud) {
        console.log('🔍 Solicitud aún no en estado Deserto, esperando...');
      } else {
        console.log('🔍 Solicitud no encontrada, puede que se haya recargado la lista');
      }
    }
  }, [solicitudes, desertoSolicitudId, stopLoading]);

  // Detener loading global cuando se complete una operación de Cancelación
  useEffect(() => {
    if (cancelingSolicitudId) {
      console.log('🔍 useEffect de cancelación ejecutado, cancelingSolicitudId:', cancelingSolicitudId);
      const solicitud = solicitudes.find(s => s.id === cancelingSolicitudId);
      console.log('🔍 Solicitud encontrada:', solicitud?.id, 'Estado:', solicitud?.estado);

      if (solicitud && solicitud.estado === 'CANCELADA') {
        console.log('🔍 Operación de Cancelación completada, limpiando estado...');
        setCancelingSolicitudId(null);
        stopLoading(); // Detener loading global cuando se complete la operación de Cancelación
        console.log('🔍 Loading global detenido por operación de Cancelación');
      } else if (solicitud) {
        console.log('🔍 Solicitud aún no en estado Cancelada, esperando...');
      } else {
        console.log('🔍 Solicitud no encontrada, puede que se haya recargado la lista');
      }
    }
  }, [solicitudes, cancelingSolicitudId, stopLoading]);

  // Asegurar que al salir de la pantalla se libere el loading global y se limpien diálogos
  useEffect(() => {
    return () => {
      try { stopLoading(); } catch { }
      setConfirmApproveOpen(false);
      setConfirmContactOpen(false);
      setConfirmStandByOpen(false);
      setConfirmReactivateOpen(false);
      setConfirmDesertoOpen(false);
      setViewModalOpen(false);
      setConfirmCancelOpen(false);
    };
  }, [stopLoading]);

  const getStatusBadge = (estado: string) => {
    const formatEstado = (estado: string) => {
      return estado.charAt(0).toUpperCase() + estado.slice(1).toLowerCase();
    };

    switch (estado?.toUpperCase()) {
      case 'PENDIENTE':
        return <Badge className="bg-yellow-300 hover:bg-yellow-400 text-yellow-900 border-yellow-500">Pendiente</Badge>;
      case 'PENDIENTE ASIGNACION':
        return <Badge className="bg-amber-300 hover:bg-amber-400 text-amber-900 border-amber-500">Pendiente Asignación</Badge>;
      case 'ASIGNADO':
        return <Badge className="bg-blue-300 hover:bg-blue-400 text-blue-900 border-blue-500">Asignado</Badge>;
      case 'PENDIENTE DOCUMENTOS':
        return <Badge className="bg-yellow-300 hover:bg-yellow-400 text-yellow-900 border-yellow-500">Pendiente Documentos</Badge>;
      case 'STAND BY':
        return <Badge className="bg-gray-300 hover:bg-gray-400 text-gray-900 border-gray-500">Stand By</Badge>;
      case 'APROBADA':
        return <Badge className="bg-green-300 hover:bg-green-400 text-green-900 border-green-500">Aprobada</Badge>;
      case 'RECHAZADA':
        return <Badge className="bg-red-300 hover:bg-red-400 text-red-900 border-red-500">Rechazada</Badge>;
      case 'EN_PROCESO':
        return <Badge className="bg-indigo-300 hover:bg-indigo-400 text-indigo-900 border-indigo-500">En Proceso</Badge>;
      case 'DESERTO':
        return <Badge className="bg-red-300 hover:bg-red-400 text-red-900 border-red-500">Deserto</Badge>;
      case 'CANCELADA':
        return <Badge className="bg-red-300 hover:bg-red-400 text-red-900 border-red-500">Cancelada</Badge>;
      default:
        return <Badge variant="outline">{formatEstado(estado || 'Sin estado')}</Badge>;
    }
  };

  // Función para obtener el color de fondo pálido de la fila según el estado
  const getRowBackgroundColor = (estado: string) => {
    switch (estado?.toUpperCase()) {
      case 'PENDIENTE':
        return 'bg-yellow-100';
      case 'PENDIENTE ASIGNACION':
        return 'bg-amber-100'; // Cambiado a amber para mejor diferenciación
      case 'ASIGNADO':
        return 'bg-blue-100';
      case 'PENDIENTE DOCUMENTOS':
        return 'bg-yellow-100';
      case 'STAND BY':
        return 'bg-gray-100';
      case 'APROBADA':
        return 'bg-green-100';
      case 'RECHAZADA':
        return 'bg-red-100';
      case 'EN_PROCESO':
        return 'bg-indigo-100';
      case 'DESERTO':
        return 'bg-red-100';
      case 'CANCELADA':
        return 'bg-red-100';
      default:
        return '';
    }
  };

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

  // Función para verificar si la solicitud está en STAND BY
  const isStandBy = (estado: string) => estado?.toUpperCase() === 'STAND BY';

  // Función para verificar si la solicitud está en estado DESERTO
  const isDeserto = (estado: string) => estado?.toUpperCase() === 'DESERTO';

  // Función para verificar si la solicitud está en estado CANCELADA
  const isCancelada = (estado: string) => estado?.toUpperCase() === 'CANCELADA';

  const getDisplayValue = (value: string | undefined, defaultValue: string = 'No especificado') => {
    return value && value.trim() !== '' ? value : defaultValue;
  };

  // Función para renderizar la plantilla en modo de solo lectura
  const renderPlantilla = (estructura: any, datos: any) => {
    console.log('🔍 renderPlantilla llamado con:', { estructura, datos });

    if (!estructura || !estructura.secciones) {
      console.log('❌ No hay estructura o secciones:', { estructura });
      return (
        <div className="text-center py-4 text-gray-500">
          <p>No hay estructura de plantilla disponible</p>
          <p className="text-xs mt-1">Estructura recibida: {JSON.stringify(estructura)}</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {estructura.secciones.map((seccion: any, seccionIndex: number) => {
          if (!seccion || typeof seccion !== 'object') return null;

          const titulo = seccion.titulo || `Sección ${seccionIndex}`;
          const icono = seccion.icono || 'FileText';
          const campos = seccion.campos || [];

          return (
            <div key={seccionIndex} className="mb-6 p-4 border rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 shadow-sm w-full">
              {/* Título de la sección */}
              <h4 className="text-base font-bold text-gray-700 mb-4 flex items-center gap-2">
                {icono === 'Users' && <User className="w-5 h-5 text-blue-600" />}
                {icono === 'Building' && <Building2 className="w-5 h-5 text-green-600" />}
                {icono === 'DollarSign' && <DollarSign className="w-5 h-5 text-orange-600" />}
                {icono === 'FileText' && <FileText className="w-5 h-5 text-gray-600" />}
                {icono === 'Clock' && <Clock className="w-5 h-5 text-red-600" />}
                {String(titulo)}
              </h4>

              {/* Campos de la sección con grid dinámico */}
              <div className="grid gap-4 grid-cols-12 w-full">
                {Array.isArray(campos) && campos
                  .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
                  .map((campo: any, campoIndex: number) => {
                    if (!campo || typeof campo !== 'object') return null;

                    const fieldName = campo.nombre || `campo_${campoIndex}`;
                    const value = datos[fieldName] || '';
                    const label = campo.label || campo.nombre || `Campo ${campoIndex}`;
                    const tipo = campo.tipo || 'text';
                    const required = campo.required || false;
                    const placeholder = campo.placeholder || `Ingrese ${label.toLowerCase()}`;

                    // Calcular el ancho del campo
                    let fieldWidth = 'col-span-12';
                    if (campo.colspan) {
                      const span = Math.min(Math.max(parseInt(campo.colspan), 1), 12);
                      fieldWidth = `col-span-${span}`;
                    } else if (campo.dimension) {
                      const span = Math.min(Math.max(campo.dimension, 1), 12);
                      fieldWidth = `col-span-${span}`;
                    }

                    return (
                      <div key={campoIndex} className={`space-y-2 ${fieldWidth}`}>
                        {/* Label del campo */}
                        <div className="flex items-center gap-2">
                          <label className="font-medium text-sm text-gray-700">
                            {String(label)}
                            {required && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {String(tipo)}
                          </span>
                        </div>

                        {/* Campo en modo de solo lectura */}
                        <div className="ml-2">
                          {tipo === 'text' && (
                            <input
                              type="text"
                              value={value}
                              disabled
                              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700"
                            />
                          )}

                          {tipo === 'textarea' && (
                            <textarea
                              value={value}
                              disabled
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 resize-none"
                            />
                          )}

                          {tipo === 'date' && (
                            <input
                              type="text"
                              value={value}
                              disabled
                              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700"
                            />
                          )}

                          {tipo === 'select' && (
                            <input
                              type="text"
                              value={value}
                              disabled
                              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700"
                            />
                          )}

                          {tipo === 'checkbox' && (
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={value}
                                disabled
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded"
                              />
                              <span className="text-sm text-gray-600">
                                {String(label)}
                              </span>
                            </div>
                          )}

                          {tipo === 'number' && (
                            <input
                              type="text"
                              value={value}
                              disabled
                              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700"
                            />
                          )}

                          {tipo === 'email' && (
                            <input
                              type="text"
                              value={value}
                              disabled
                              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700"
                            />
                          )}

                          {/* Información adicional del campo */}
                          <div className="mt-1 text-xs text-gray-500">
                            {required && <span className="text-red-500">Campo requerido</span>}
                            {!required && <span className="text-gray-400">Campo opcional</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const handleStandByClick = (id: number | undefined) => {
    if (id) {
      setSelectedSolicitudId(id);
      setStandByObservacion('');
      setConfirmStandByOpen(true);
    }
  };

  const handleApproveClick = (id: number | undefined) => {
    if (id) {
      setSelectedSolicitudId(id);
      setConfirmApproveOpen(true);
    }
  };

  const handleContactClick = (id: number | undefined) => {
    if (id) {
      setSelectedSolicitudId(id);
      setContactingSolicitudId(id);
      setConfirmContactOpen(true);
    }
  };

  const handleApproveConfirm = () => {
    if (selectedSolicitudId) {
      onApprove(selectedSolicitudId);
      setConfirmApproveOpen(false);
      setSelectedSolicitudId(null);
    }
  };

  const handleContactConfirm = async () => {
    if (selectedSolicitudId && contactObservacion.trim()) {
      console.log('🔍 handleContactConfirm llamado para solicitud ID:', selectedSolicitudId);
      console.log('🔍 Llamando a startLoading()...');
      startLoading(); // Activar loading global
      console.log('🔍 Llamando a onContact con ID:', selectedSolicitudId, 'y observación:', contactObservacion);
      onContact(selectedSolicitudId, contactObservacion);
      console.log('🔍 onContact ejecutado');

      setConfirmContactOpen(false);
      setSelectedSolicitudId(null);
      setContactObservacion('');
      // NO limpiar contactingSolicitudId aquí, se limpiará cuando se complete la operación
      // El loading se detendrá cuando se complete la operación en el componente padre
    }
  };

  // Cargar timeline cuando se abra el modal y exista una solicitud seleccionada
  useEffect(() => {
    const cargarLogs = async () => {
      if (viewModalOpen && selectedSolicitudForView?.id) {
        try {
          setLogsLoading(true);
          const data = await solicitudesLogsService.getLogsBySolicitud(selectedSolicitudForView.id);
          setLogs(data);
        } catch (e) {
          console.warn('No se pudieron cargar los logs de la solicitud:', e);
          setLogs([]);
        } finally {
          setLogsLoading(false);
        }
      } else if (!viewModalOpen) {
        setLogs([]);
      }
    };
    cargarLogs();
  }, [viewModalOpen, selectedSolicitudForView?.id]);

  const mapAccionLabel = (accion?: string) => {
    if (!accion) return 'Acción';
    switch (accion) {
      case 'CREAR_SOLICITUD': return 'Creación de solicitud';
      case 'ASIGNAR_ANALISTA': return 'Asignación de analista';
      case 'CAMBIAR_ESTADO': return 'Cambio de estado';
      case 'CONTACTAR': return 'Marcado como contactado';
      case 'PUT_STANDBY': return 'Puesta en Stand By';
      case 'REACTIVAR': return 'Reactivación';
      case 'EDITAR_SOLICITUD': return 'Edición de solicitud';
      case 'APROBAR_SOLICITUD': return 'Aprobación';
      case 'RECHAZAR_SOLICITUD': return 'Rechazo';
      case 'ELIMINAR_SOLICITUD': return 'Eliminación';
      default: return accion;
    }
  };

  const mapAccionBadgeClass = (accion?: string) => {
    switch (accion) {
      case 'CREAR_SOLICITUD': return 'bg-green-50 text-green-700 border-green-200';
      case 'ASIGNAR_ANALISTA': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'CAMBIAR_ESTADO': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'CONTACTAR': return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'PUT_STANDBY': return 'bg-gray-50 text-gray-700 border-gray-200';
      case 'REACTIVAR': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'APROBAR_SOLICITUD': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'RECHAZAR_SOLICITUD': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const handleStandByConfirm = () => {
    if (selectedSolicitudId && standByObservacion.trim()) {
      const solicitud = solicitudes.find(s => s.id === selectedSolicitudId);
      if (solicitud) {
        startLoading(); // Activar loading global
        onStandBy(selectedSolicitudId, standByObservacion.trim());
        setConfirmStandByOpen(false);
        setSelectedSolicitudId(null);
        setStandByObservacion('');
      }
    }
  };

  const handleDesertoClick = (id: number | undefined) => {
    if (id) {
      setSelectedSolicitudId(id);
      setDesertoSolicitudId(id);
      setConfirmDesertoOpen(true);
    }
  };

  const handleDesertoConfirm = () => {
    if (selectedSolicitudId && desertoObservacion.trim()) {
      console.log('🔍 handleDesertoConfirm llamado para solicitud ID:', selectedSolicitudId);
      console.log('🔍 Llamando a startLoading()...');
      startLoading(); // Activar loading global
      console.log('🔍 Llamando a onDeserto con ID:', selectedSolicitudId, 'y observación:', desertoObservacion);
      onDeserto(selectedSolicitudId, desertoObservacion);
      console.log('🔍 onDeserto ejecutado');

      setConfirmDesertoOpen(false);
      setSelectedSolicitudId(null);
      setDesertoObservacion('');
      // NO limpiar desertoSolicitudId aquí, se limpiará cuando se complete la operación
      // El loading se detendrá cuando se complete la operación en el componente padre
    }
  };

  const handleReactivate = (id: number) => {
    console.log('🔍 handleReactivate llamado con ID:', id);
    console.log('🔍 Estado actual de reactivatingSolicitudId:', reactivatingSolicitudId);
    setReactivatingSolicitudId(id);
    console.log('🔍 reactivatingSolicitudId establecido a:', id);
    setConfirmReactivateOpen(true);
    console.log('🔍 Diálogo de confirmación abierto');

    // Verificar que el estado se estableció correctamente
    setTimeout(() => {
      console.log('🔍 Verificación: reactivatingSolicitudId después de setState:', reactivatingSolicitudId);
    }, 0);
  };

  const handleReactivateConfirm = () => {
    console.log('🔍 handleReactivateConfirm llamado');
    if (reactivatingSolicitudId) {
      console.log('🔍 reactivatingSolicitudId válido:', reactivatingSolicitudId);
      console.log('🔍 Llamando a startLoading()...');
      startLoading(); // Activar loading global
      console.log('🔍 Llamando a onReactivate con ID:', reactivatingSolicitudId);
      onReactivate(reactivatingSolicitudId);
      console.log('🔍 onReactivate ejecutado');

      setConfirmReactivateOpen(false);
      // NO limpiar reactivatingSolicitudId aquí, se limpiará cuando se complete la operación
      // El loading se detendrá cuando se complete la operación en el useEffect
      console.log('🔍 reactivatingSolicitudId mantenido para monitoreo:', reactivatingSolicitudId);
    } else {
      console.log('❌ reactivatingSolicitudId es null o undefined');
      // Si no hay ID válido, detener el loading para evitar que se quede colgado
      stopLoading();
    }
  };

  const handleViewClick = (solicitud: Solicitud) => {
    setSelectedSolicitudForView(solicitud);
    setViewModalOpen(true);
  };

  const handleCancelClick = (id: number | undefined) => {
    if (id) {
      setSelectedSolicitudId(id);
      setCancelingSolicitudId(id);
      setConfirmCancelOpen(true);
    }
  };

  const handleCancelConfirm = () => {
    if (selectedSolicitudId && cancelObservacion.trim()) {
      console.log('🔍 handleCancelConfirm llamado para solicitud ID:', selectedSolicitudId);
      console.log('🔍 Llamando a startLoading()...');
      startLoading(); // Activar loading global
      console.log('🔍 Llamando a onCancel con ID:', selectedSolicitudId, 'y observación:', cancelObservacion);
      onCancel(selectedSolicitudId, cancelObservacion);
      console.log('🔍 onCancel ejecutado');

      setConfirmCancelOpen(false);
      setSelectedSolicitudId(null);
      setCancelingSolicitudId(null);
      setCancelObservacion('');
      // NO limpiar cancelingSolicitudId aquí, se limpiará cuando se complete la operación
      // El loading se detendrá cuando se complete la operación en el componente padre
    }
  };

  const handleAssignClick = async (id: number | undefined) => {
    if (id) {
      setSelectedSolicitudId(id);
      setAssigningSolicitudId(id);
      
      // Obtener la solicitud para acceder a la empresa
      const solicitud = solicitudes.find(s => s.id === id);
      if (solicitud && solicitud.empresa_id) {
        try {
          // Importar el servicio de solicitudes
          const { solicitudesService } = await import('@/services/solicitudesService');
          const suggested = await solicitudesService.getSuggestedAnalyst(solicitud.empresa_id);
          setSuggestedAnalyst(suggested);
        } catch (error) {
          console.error('Error obteniendo analista sugerido:', error);
          setSuggestedAnalyst(null);
        }
      }
      
      setConfirmAssignOpen(true);
    }
  };

  const handleAssignConfirm = () => {
    if (selectedSolicitudId && suggestedAnalyst) {
      console.log('🔍 handleAssignConfirm llamado para solicitud ID:', selectedSolicitudId);
      console.log('🔍 Analista a asignar:', suggestedAnalyst);
      console.log('🔍 Llamando a startLoading()...');
      startLoading(); // Activar loading global
      
      // Llamar a la función de asignación
      onAssign(selectedSolicitudId, suggestedAnalyst.analista_id);
      
      setConfirmAssignOpen(false);
      setSelectedSolicitudId(null);
      setAssigningSolicitudId(null);
      setSuggestedAnalyst(null);
    }
  };

  if (solicitudes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <p>No hay solicitudes disponibles.</p>
        <p className="text-sm">Crea una nueva solicitud para comenzar.</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-left w-20"></TableHead>
              <TableHead className="text-center w-24">Consecutivo</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead className="w-64">Empresa</TableHead>
              <TableHead>Analista Asignado</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Modificación</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {solicitudes.map((solicitud) => (
              <TableRow
                key={solicitud.id}
                className={`${getRowBackgroundColor(solicitud.estado)}`}
              >
                <TableCell>
                  <div className="flex justify-start items-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-transparent">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-48">
                        {/* Botón Editar - solo visible cuando esté en estado ASIGNADO */}
                        {solicitud.estado === 'ASIGNADO' && !isDeserto(solicitud.estado) && !isCancelada(solicitud.estado) && (
                          <Can action="accion-editar-solicitud">
                            <DropdownMenuItem onClick={() => onEdit(solicitud)} className="cursor-pointer">
                              <Edit className="h-4 w-4 mr-2 text-purple-600" />
                              Editar
                            </DropdownMenuItem>
                          </Can>
                        )}

                        {/* Botón Visualizar - siempre visible */}
                        <Can action="accion-visualizar-solicitud">
                          <DropdownMenuItem onClick={() => { handleViewClick(solicitud); onView(solicitud); }} className="cursor-pointer">
                            <Eye className="h-4 w-4 mr-2 text-blue-600" />
                            Visualizar
                          </DropdownMenuItem>
                        </Can>

                        {/* Botón Asignar Solicitud - solo visible en estado PENDIENTE ASIGNACION */}
                        {solicitud.estado === 'PENDIENTE ASIGNACION' && !isStandBy(solicitud.estado) && !isDeserto(solicitud.estado) && !isCancelada(solicitud.estado) && (
                          <Can action="accion-asignar-solicitud">
                            <DropdownMenuItem onClick={() => handleAssignClick(solicitud.id)} className="cursor-pointer">
                              <User className="h-4 w-4 mr-2 text-blue-600" />
                              Asignar Solicitud
                            </DropdownMenuItem>
                          </Can>
                        )}

                        {/* Botón Aprobar - solo visible en estado PENDIENTE */}
                        {solicitud.estado === 'PENDIENTE' && !isStandBy(solicitud.estado) && !isDeserto(solicitud.estado) && !isCancelada(solicitud.estado) && (
                          <Can action="accion-aprobar-solicitud">
                            <DropdownMenuItem onClick={() => handleApproveClick(solicitud.id)} className="cursor-pointer">
                              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                              Aprobar solicitud
                            </DropdownMenuItem>
                          </Can>
                        )}

                        {/* Botón Contactado - solo visible en estado ASIGNADO */}
                        {solicitud.estado === 'ASIGNADO' && !isStandBy(solicitud.estado) && !isDeserto(solicitud.estado) && !isCancelada(solicitud.estado) && (
                          <Can action="accion-contactar-solicitud">
                            <DropdownMenuItem
                              onClick={() => handleContactClick(solicitud.id)}
                              disabled={contactingSolicitudId === solicitud.id}
                              className="cursor-pointer"
                            >
                              <Phone className="h-4 w-4 mr-2 text-blue-600" />
                              {contactingSolicitudId === solicitud.id ? 'Procesando...' : 'Contactado'}
                            </DropdownMenuItem>
                          </Can>
                        )}

                        {/* Botón Stand By / Reactivar */}
                        {!isDeserto(solicitud.estado) && !isCancelada(solicitud.estado) && isStandBy(solicitud.estado) && (
                          <Can action="accion-reactivar-solicitud">
                            <DropdownMenuItem
                              onClick={() => handleReactivate(solicitud.id!)}
                              disabled={reactivatingSolicitudId === solicitud.id}
                              className="cursor-pointer"
                            >
                              <Play className="h-4 w-4 mr-2 text-green-600" />
                              {reactivatingSolicitudId === solicitud.id ? 'Procesando...' : 'Reactivar solicitud'}
                            </DropdownMenuItem>
                          </Can>
                        )}

                        {!isDeserto(solicitud.estado) && !isCancelada(solicitud.estado) && !isStandBy(solicitud.estado) && (
                          <Can action="accion-standby-solicitud">
                            <DropdownMenuItem onClick={() => handleStandByClick(solicitud.id)} className="cursor-pointer">
                              <Pause className="h-4 w-4 mr-2 text-gray-600" />
                              Stand By
                            </DropdownMenuItem>
                          </Can>
                        )}

                        {/* Botón Deserto */}
                        {!isDeserto(solicitud.estado) && !isCancelada(solicitud.estado) && (
                          <Can action="accion-deserto-solicitud">
                            <DropdownMenuItem onClick={() => handleDesertoClick(solicitud.id)} className="cursor-pointer">
                              <Ban className="h-4 w-4 mr-2 text-red-600" />
                              Marcar como Deserto
                            </DropdownMenuItem>
                          </Can>
                        )}

                        {/* Botón Cancelar */}
                        {solicitud.estado === 'ASIGNADO' && !isDeserto(solicitud.estado) && !isCancelada(solicitud.estado) && (
                          <Can action="accion-cancelar-solicitud">
                            <DropdownMenuItem onClick={() => handleCancelClick(solicitud.id)} className="cursor-pointer">
                              <X className="h-4 w-4 mr-2 text-red-600" />
                              Cancelar
                            </DropdownMenuItem>
                          </Can>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>

                <TableCell className="text-center">
                  <span className="font-bold text-red-600">#{solicitud.id}</span>
                </TableCell>

                <TableCell>
                  <div className="flex flex-col">
                    <span>
                      {
                        // Intentar obtener el número de documento del JSON de la plantilla primero
                        solicitud.estructura_datos?.numero_documento ||
                        solicitud.estructura_datos?.documento ||
                        solicitud.estructura_datos?.cedula ||
                        solicitud.estructura_datos?.identificacion ||
                        getDisplayValue(solicitud.candidatos?.numero_documento, 'Sin número')
                      }
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {
                        // Intentar obtener el email del JSON de la plantilla
                        solicitud.estructura_datos?.email ||
                        solicitud.estructura_datos?.correo_electronico ||
                        solicitud.estructura_datos?.correo ||
                        getDisplayValue(solicitud.candidatos?.email, 'Sin Email')
                      }
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{getDisplayValue(solicitud.empresas?.razon_social, 'Sin empresa')}</span>
                    <span className="text-sm text-muted-foreground">
                      {getDisplayValue(solicitud.empresas?.ciudad, 'Sin ciudad')}
                    </span>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex flex-col">
                    {solicitud.analista ? (
                      <>
                        <span className="font-medium text-blue-600">
                          {solicitud.analista.nombre}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {solicitud.analista.email || 'Sin email'}
                        </span>
                      </>
                    ) : (
                      <span className="text-sm text-muted-foreground italic">
                        Sin asignar
                      </span>
                    )}
                  </div>
                </TableCell>

                <TableCell>{getStatusBadge(solicitud.estado)}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm">{formatDate(solicitud.updated_at)}</span>
                    <span className="text-xs text-muted-foreground">{formatDateTime(solicitud.updated_at)}</span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Confirmación de aprobación */}
      <AlertDialog open={confirmApproveOpen} onOpenChange={setConfirmApproveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Aprobar solicitud?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas aprobar esta solicitud? Esta acción cambiará el estado a "APROBADA".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApproveConfirm}
              className="bg-green-600 hover:bg-green-700"
            >
              Aprobar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmación de contacto */}
      <AlertDialog open={confirmContactOpen} onOpenChange={setConfirmContactOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Marcar como contactado?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas marcar esta solicitud como contactada?
              <br />
              <span className="text-sm text-muted-foreground">
                Esta acción cambiará el estado de la solicitud a "PENDIENTE DOCUMENTOS".
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4">
            <label htmlFor="contactObservacion" className="block text-sm font-medium text-gray-700 mb-2">
              Observación (requerida)
            </label>
            <Textarea
              id="contactObservacion"
              value={contactObservacion}
              onChange={(e) => setContactObservacion(e.target.value)}
              placeholder="Ingrese detalles del contacto realizado..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={4}
              required
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setConfirmContactOpen(false);
              setContactingSolicitudId(null);
              setContactObservacion('');
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleContactConfirm}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!contactObservacion.trim()}
            >
              Confirmar Contacto
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmación de Stand By */}
      <AlertDialog open={confirmStandByOpen} onOpenChange={setConfirmStandByOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Marcar como Stand By?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas marcar esta solicitud como Stand By?
              <br />
              <span className="text-sm text-muted-foreground">
                Esta acción pausará la solicitud hasta que se reanude.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4">
            <label htmlFor="observacion" className="block text-sm font-medium text-gray-700 mb-2">
              Observación (requerida)
            </label>
            <Textarea
              id="observacion"
              value={standByObservacion}
              onChange={(e) => setStandByObservacion(e.target.value)}
              placeholder="Ingrese la razón del Stand By..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={4}
              required
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStandByConfirm}
              className="bg-gray-600 hover:bg-gray-700"
              disabled={!standByObservacion.trim()}
            >
              Marcar como Stand By
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmación de Reactivación */}
      <AlertDialog open={confirmReactivateOpen} onOpenChange={setConfirmReactivateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Reactivar solicitud?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas reactivar esta solicitud?
              <br />
              <span className="text-sm text-muted-foreground">
                Esta acción restaurará la solicitud al estado que tenía antes de ponerla en Stand By.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setConfirmReactivateOpen(false);
              setReactivatingSolicitudId(null);
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleReactivateConfirm}>
              Reactivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmación de Deserto */}
      <AlertDialog open={confirmDesertoOpen} onOpenChange={setConfirmDesertoOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Marcar como Deserto?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas marcar esta solicitud como Deserto?
              <br />
              <span className="text-sm text-muted-foreground">
                Esta acción marcará la solicitud como abandonada y deshabilitará todas las acciones futuras.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4">
            <label htmlFor="desertoObservacion" className="block text-sm font-medium text-gray-700 mb-2">
              Observación (requerida)
            </label>
            <Textarea
              id="desertoObservacion"
              value={desertoObservacion}
              onChange={(e) => setDesertoObservacion(e.target.value)}
              placeholder="Ingrese la razón por la cual se marca como deserto..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              rows={4}
              required
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDesertoObservacion('');
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDesertoConfirm}
              className="bg-red-600 hover:bg-red-700"
              disabled={!desertoObservacion.trim()}
            >
              Marcar como Deserto
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Visualización de Solicitud */}
      <AlertDialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <AlertDialogContent className="sm:max-w-[96vw] w-[96vw] h-[92vh] overflow-hidden relative p-0">
          {/* Botón X en la esquina superior derecha */}
          <button
            aria-label="Cerrar"
            className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            onClick={() => {
              setViewModalOpen(false);
              setSelectedSolicitudForView(null);
            }}
          >
            <XCircle className="w-5 h-5" />
          </button>

          <div className="h-full flex flex-col">
            <div className="px-6 pt-6 pb-4 border-b bg-white/80 backdrop-blur">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-2xl font-bold text-gray-800">
                  Solicitud #{selectedSolicitudForView?.id} - Plantilla
                </AlertDialogTitle>
                <AlertDialogDescription className="text-gray-600">
                  Visualización de la plantilla asociada a la solicitud
                </AlertDialogDescription>
              </AlertDialogHeader>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  {selectedSolicitudForView ? (
                    selectedSolicitudForView.estructura_datos ? (
                      <div className="bg-white rounded-lg border border-gray-200 p-6">
                        {renderPlantilla(selectedSolicitudForView.estructura_datos, selectedSolicitudForView.estructura_datos)}
                        {/* Timeline */}
                        <div className="lg:pl-6 lg:border-l lg:border-gray-200">
                          <div className="bg-white rounded-lg border border-gray-200">
                            <div className="p-4 border-b flex items-center gap-2">
                              <Clock className="h-4 w-4 text-cyan-600" />
                              <span className="font-semibold text-gray-800">Historial de la solicitud</span>
                            </div>
                            <div className="p-4 max-h-[70vh] overflow-y-auto">
                              {logsLoading ? (
                                <div className="flex items-center justify-center py-10 text-gray-500 text-sm">Cargando historial...</div>
                              ) : logs.length === 0 ? (
                                <div className="text-gray-500 text-sm">Sin registros de historial</div>
                              ) : (
                                <div className="ml-2 border-l-2 border-cyan-200 pl-4 space-y-4">
                                  {logs.map((log) => (
                                    <div key={log.id} className="relative">
                                      <span className="absolute -left-[9px] top-1 h-3 w-3 rounded-full bg-cyan-600 border-2 border-white"></span>
                                      <div className="flex items-center justify-between">
                                        <Badge variant="outline" className={`text-xs ${mapAccionBadgeClass(log.accion)}`}>
                                          {mapAccionLabel(log.accion)}
                                        </Badge>
                                        <span className="text-[11px] text-gray-500">{formatDateTime(log.fecha_accion)}</span>
                                      </div>
                                      {(log.estado_anterior || log.estado_nuevo) && (
                                        <div className="mt-1 text-xs text-gray-600">
                                          {log.estado_anterior ? <span>De <strong>{log.estado_anterior}</strong> </span> : null}
                                          {log.estado_nuevo ? <span>→ A <strong>{log.estado_nuevo}</strong></span> : null}
                                        </div>
                                      )}
                                      {log.usuario && (
                                        <div className="mt-1 text-xs text-gray-500">Por: {`${log.usuario.primer_nombre || ''} ${log.usuario.primer_apellido || ''}`.trim() || log.usuario.username}</div>
                                      )}
                                      {log.observacion && (
                                        <div className="mt-2 text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded px-3 py-2 whitespace-pre-line">{log.observacion}</div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p className="font-medium">No hay plantilla disponible</p>
                        <p className="text-sm">Esta solicitud no tiene estructura de plantilla configurada</p>
                      </div>
                    )
                  ) : null}
                </div>


              </div>
            </div>

            <div className="px-6 py-4 border-t bg-white/80 backdrop-blur">
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => {
                  setViewModalOpen(false);
                  setSelectedSolicitudForView(null);
                  setLogs([]);
                }} className="px-6 py-2">
                  Cerrar
                </AlertDialogCancel>
              </AlertDialogFooter>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmación de Cancelación */}
      <AlertDialog open={confirmCancelOpen} onOpenChange={setConfirmCancelOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar solicitud?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas cancelar esta solicitud?
              <br />
              <span className="text-sm text-muted-foreground">
                Esta acción marcará la solicitud como cancelada y deshabilitará todas las acciones futuras.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4">
            <label htmlFor="cancelObservacion" className="block text-sm font-medium text-gray-700 mb-2">
              Observación (requerida)
            </label>
            <Textarea
              id="cancelObservacion"
              value={cancelObservacion}
              onChange={(e) => setCancelObservacion(e.target.value)}
              placeholder="Ingrese la razón por la cual se cancela la solicitud..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              rows={4}
              required
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setConfirmCancelOpen(false);
              setCancelingSolicitudId(null);
              setCancelObservacion('');
            }}>
              No Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelConfirm}
              className="bg-red-600 hover:bg-red-700"
              disabled={!cancelObservacion.trim()}
            >
              Sí, Cancelar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmación de Asignación de Analista */}
      <AlertDialog open={confirmAssignOpen} onOpenChange={setConfirmAssignOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Asignar analista a la solicitud?</AlertDialogTitle>
            <AlertDialogDescription>
              Se asignará la siguiente solicitud al analista sugerido:
              <br />
              <br />
              {suggestedAnalyst ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold text-blue-800">
                      {suggestedAnalyst.analista_nombre}
                    </span>
                  </div>
                  <p className="text-sm text-blue-600 mt-1">
                    ID: {suggestedAnalyst.analista_id}
                  </p>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600 font-medium">
                    No se pudo obtener un analista sugerido
                  </p>
                </div>
              )}
              <br />
              <span className="text-sm text-muted-foreground">
                Esta acción cambiará el estado de la solicitud a "ASIGNADO".
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setConfirmAssignOpen(false);
              setAssigningSolicitudId(null);
              setSuggestedAnalyst(null);
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAssignConfirm}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!suggestedAnalyst}
            >
              Asignar Analista
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SolicitudesList; 
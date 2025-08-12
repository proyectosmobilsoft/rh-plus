import React, { useState, useEffect } from 'react';
import { Edit, Pause, CheckCircle, Phone, Play, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Solicitud } from '@/services/solicitudesService';
import { useLoading } from '@/contexts/LoadingContext';

interface SolicitudesListProps {
  solicitudes: Solicitud[];
  onEdit: (solicitud: Solicitud) => void;
  onView: (solicitud: Solicitud) => void;
  onApprove: (id: number) => void;
  onContact: (id: number) => void;
  onStandBy: (id: number, observacion: string) => void;
  onReactivate: (id: number) => void;
  onDeserto: (id: number) => void;
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
  isLoading = false
}) => {
  const { startLoading, stopLoading } = useLoading();
  const [confirmApproveOpen, setConfirmApproveOpen] = useState(false);
  const [confirmContactOpen, setConfirmContactOpen] = useState(false);
  const [confirmStandByOpen, setConfirmStandByOpen] = useState(false);
  const [confirmReactivateOpen, setConfirmReactivateOpen] = useState(false);
  const [confirmDesertoOpen, setConfirmDesertoOpen] = useState(false);
  const [selectedSolicitudId, setSelectedSolicitudId] = useState<number | null>(null);
  const [contactingSolicitudId, setContactingSolicitudId] = useState<number | null>(null);
  const [standByObservacion, setStandByObservacion] = useState('');
  const [solicitudesStandBy, setSolicitudesStandBy] = useState<Map<number, string>>(new Map());
  const [reactivatingSolicitudId, setReactivatingSolicitudId] = useState<number | null>(null);
  const [desertoSolicitudId, setDesertoSolicitudId] = useState<number | null>(null);

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
  }, [solicitudes, contactingSolicitudId, stopLoading]);

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
  }, [solicitudes, solicitudesStandBy, stopLoading]);

  // Detener loading global cuando se complete una reactivación
  useEffect(() => {
    // Si hay solicitudes que ya no están en STAND BY y teníamos un reactivatingSolicitudId,
    // significa que la reactivación se completó
    if (reactivatingSolicitudId) {
      console.log('🔍 useEffect de reactivación ejecutado, reactivatingSolicitudId:', reactivatingSolicitudId);
      const solicitud = solicitudes.find(s => s.id === reactivatingSolicitudId);
      console.log('🔍 Solicitud encontrada:', solicitud?.id, 'Estado:', solicitud?.estado);
      
      if (solicitud && !isStandBy(solicitud.estado)) {
        console.log('🔍 Reactivación completada, limpiando estado...');
        setReactivatingSolicitudId(null);
        stopLoading(); // Detener loading global cuando se complete la reactivación
        console.log('🔍 Loading global detenido');
      } else if (solicitud) {
        console.log('🔍 Solicitud aún en Stand By, esperando...');
      } else {
        console.log('🔍 Solicitud no encontrada, puede que se haya recargado la lista');
      }
    }
  }, [solicitudes, reactivatingSolicitudId, stopLoading]);

  // Limpiar estados de solicitudes que ya no están en STAND BY
  useEffect(() => {
    setSolicitudesStandBy(prev => {
      const newMap = new Map();
      solicitudes.forEach(solicitud => {
        if (isStandBy(solicitud.estado)) {
          // Si la solicitud está en STAND BY, guardar su estado anterior
          if (prev.has(solicitud.id!)) {
            newMap.set(solicitud.id!, prev.get(solicitud.id!)!);
          } else {
            // Si es nueva en STAND BY, guardar un estado por defecto
            newMap.set(solicitud.id!, 'PENDIENTE');
          }
        }
      });
      return newMap;
    });
  }, [solicitudes, solicitudesStandBy]);

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

  const getStatusBadge = (estado: string) => {
    const formatEstado = (estado: string) => {
      return estado.charAt(0).toUpperCase() + estado.slice(1).toLowerCase();
    };

    switch (estado?.toUpperCase()) {
      case 'PENDIENTE':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white border-0">Pendiente</Badge>;
      case 'ASIGNADO':
        return <Badge className="bg-blue-500 hover:bg-blue-600 text-white border-0">Asignado</Badge>;
      case 'PENDIENTE DOCUMENTOS':
        return <Badge className="bg-orange-500 hover:bg-orange-600 text-white border-0">Pendiente Documentos</Badge>;
      case 'STAND BY':
        return <Badge className="bg-gray-500 hover:bg-gray-600 text-white border-0">Stand By</Badge>;
      case 'APROBADA':
        return <Badge className="bg-green-500 hover:bg-green-600 text-white border-0">Aprobada</Badge>;
      case 'RECHAZADA':
        return <Badge className="bg-red-500 hover:bg-red-600 text-white border-0">Rechazada</Badge>;
      case 'EN_PROCESO':
        return <Badge className="bg-indigo-500 hover:bg-indigo-600 text-white border-0">En Proceso</Badge>;
      case 'DESERTO':
        return <Badge className="bg-red-400 hover:bg-red-500 text-white border-0">Deserto</Badge>;
      default:
        return <Badge variant="outline">{formatEstado(estado || 'Sin estado')}</Badge>;
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

  const getDisplayValue = (value: string | undefined, defaultValue: string = 'No especificado') => {
    return value && value.trim() !== '' ? value : defaultValue;
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

  const handleContactConfirm = () => {
    if (selectedSolicitudId) {
      console.log('🔍 handleContactConfirm llamado para solicitud ID:', selectedSolicitudId);
      console.log('🔍 Llamando a startLoading()...');
      startLoading(); // Activar loading global
      console.log('🔍 Llamando a onContact con ID:', selectedSolicitudId);
      onContact(selectedSolicitudId);
      console.log('🔍 onContact ejecutado');
      
      setConfirmContactOpen(false);
      setSelectedSolicitudId(null);
      // NO limpiar contactingSolicitudId aquí, se limpiará cuando se complete la operación
      // El loading se detendrá cuando se complete la operación en el componente padre
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
    if (selectedSolicitudId) {
      console.log('🔍 handleDesertoConfirm llamado para solicitud ID:', selectedSolicitudId);
      console.log('🔍 Llamando a startLoading()...');
      startLoading(); // Activar loading global
      console.log('🔍 Llamando a onDeserto con ID:', selectedSolicitudId);
      onDeserto(selectedSolicitudId);
      console.log('🔍 onDeserto ejecutado');
      
      setConfirmDesertoOpen(false);
      setSelectedSolicitudId(null);
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
      // El loading se detendrá cuando se complete la operación en el componente padre
    } else {
      console.log('❌ reactivatingSolicitudId es null o undefined');
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
              <TableHead className="text-center">Acciones</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Analista Asignado</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Modificación</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
                         {solicitudes.map((solicitud) => (
               <TableRow 
                 key={solicitud.id}
                 className={isDeserto(solicitud.estado) ? 'bg-red-50' : ''}
               >
                                   <TableCell>
                   <div className="flex justify-center items-center space-x-1">
                                          <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onEdit(solicitud)}
                              aria-label="Editar solicitud"
                              className={`h-8 w-8 ${(isStandBy(solicitud.estado) || isDeserto(solicitud.estado)) ? 'opacity-30 cursor-not-allowed' : ''}`}
                              disabled={isStandBy(solicitud.estado) || isDeserto(solicitud.estado)}
                            >
                              <Edit className="h-4 w-4 text-green-600" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {isDeserto(solicitud.estado) 
                                ? 'No disponible en Deserto' 
                                : isStandBy(solicitud.estado) 
                                  ? 'No disponible en Stand By' 
                                  : 'Editar'
                              }
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                                          {solicitud.estado === 'PENDIENTE' && !isStandBy(solicitud.estado) && !isDeserto(solicitud.estado) && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleApproveClick(solicitud.id)}
                                aria-label="Aprobar solicitud"
                                className="h-8 w-8"
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Aprobar solicitud</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}

                                          {/* Botón de Contactado - visible en todos los estados pero solo habilitado en ASIGNADO */}
                                          <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleContactClick(solicitud.id)}
                              aria-label="Marcar como contactado"
                              className={`h-8 w-8 ${contactingSolicitudId === solicitud.id ? 'opacity-50 cursor-not-allowed' : ''} ${(solicitud.estado !== 'ASIGNADO' || isStandBy(solicitud.estado) || isDeserto(solicitud.estado)) ? 'opacity-30 cursor-not-allowed' : ''}`}
                              disabled={contactingSolicitudId === solicitud.id || solicitud.estado !== 'ASIGNADO' || isStandBy(solicitud.estado) || isDeserto(solicitud.estado)}
                            >
                              <Phone className="h-4 w-4 text-blue-600" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {contactingSolicitudId === solicitud.id 
                                ? 'Procesando...' 
                                : isDeserto(solicitud.estado)
                                  ? 'No disponible en Deserto'
                                  : isStandBy(solicitud.estado)
                                    ? 'No disponible en Stand By'
                                    : solicitud.estado === 'ASIGNADO' 
                                      ? 'Contactado' 
                                      : 'Solo disponible para solicitudes asignadas'
                              }
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                                         <TooltipProvider>
                       <Tooltip>
                         <TooltipTrigger asChild>
                           {isStandBy(solicitud.estado) ? (
                             <Button
                               variant="ghost"
                               size="icon"
                               onClick={() => handleReactivate(solicitud.id!)}
                               aria-label="Reactivar solicitud"
                               className={`h-8 w-8 ${reactivatingSolicitudId === solicitud.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                               disabled={reactivatingSolicitudId === solicitud.id || isDeserto(solicitud.estado)}
                             >
                               <Play className="h-4 w-4 text-green-600" />
                             </Button>
                           ) : (
                             <Button
                               variant="ghost"
                               size="icon"
                               onClick={() => handleStandByClick(solicitud.id)}
                               aria-label="Marcar como Stand By"
                               className="h-8 w-8"
                               disabled={isDeserto(solicitud.estado)}
                             >
                               <Pause className="h-4 w-4 text-gray-600" />
                             </Button>
                           )}
                         </TooltipTrigger>
                         <TooltipContent>
                           <p>
                             {isDeserto(solicitud.estado)
                               ? 'No disponible en Deserto'
                               : isStandBy(solicitud.estado) 
                                 ? reactivatingSolicitudId === solicitud.id
                                   ? 'Procesando...'
                                   : 'Reactivar solicitud'
                                 : 'Stand By'
                             }
                           </p>
                         </TooltipContent>
                       </Tooltip>
                     </TooltipProvider>

                     {/* Botón de Deserto - solo visible cuando NO esté en estado Deserto */}
                     {!isDeserto(solicitud.estado) && (
                       <TooltipProvider>
                         <Tooltip>
                           <TooltipTrigger asChild>
                             <Button
                               variant="ghost"
                               size="icon"
                               onClick={() => handleDesertoClick(solicitud.id)}
                               aria-label="Marcar como Deserto"
                               className="h-8 w-8"
                             >
                               <XCircle className="h-4 w-4 text-red-600" />
                             </Button>
                           </TooltipTrigger>
                           <TooltipContent>
                             <p>Marcar como Deserto</p>
                           </TooltipContent>
                         </Tooltip>
                       </TooltipProvider>
                     )}
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex flex-col">
                    <span>
                      {getDisplayValue(solicitud.candidatos?.tipo_documento, 'Sin tipo')}: {getDisplayValue(solicitud.candidatos?.numero_documento, 'Sin número')}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {getDisplayValue(solicitud.lugar_expedicion, 'Sin lugar de expedición')}
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
         <AlertDialogContent>
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
           <AlertDialogFooter>
             <AlertDialogCancel onClick={() => {
               setConfirmContactOpen(false);
               setContactingSolicitudId(null);
             }}>
               Cancelar
             </AlertDialogCancel>
             <AlertDialogAction
               onClick={handleContactConfirm}
               className="bg-blue-600 hover:bg-blue-700"
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
         <AlertDialogContent>
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
           <AlertDialogFooter>
             <AlertDialogCancel>Cancelar</AlertDialogCancel>
             <AlertDialogAction 
               onClick={handleDesertoConfirm}
               className="bg-red-600 hover:bg-red-700"
             >
               Marcar como Deserto
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>
    </>
  );
};

export default SolicitudesList; 
import React, { useState, useEffect } from 'react';
import { Clock, User, FileText, AlertCircle, CheckCircle, XCircle, Phone, Pause, Play, Edit, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { solicitudesLogsService, SolicitudLog, ACCIONES_SOLICITUDES } from '@/services/solicitudesLogsService';
import { formatDateTime, formatDate } from '@/lib/utils';

interface SolicitudLogsProps {
  solicitudId: number;
  solicitudEstado?: string;
}

const SolicitudLogs: React.FC<SolicitudLogsProps> = ({ solicitudId, solicitudEstado }) => {
  const [logs, setLogs] = useState<SolicitudLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargarLogs();
  }, [solicitudId]);

  const cargarLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const logsData = await solicitudesLogsService.getLogsBySolicitud(solicitudId);
      setLogs(logsData);
    } catch (err) {
      setError('Error al cargar los logs de la solicitud');
      console.error('Error al cargar logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getAccionIcon = (accion: string) => {
    switch (accion) {
      case ACCIONES_SOLICITUDES.CREAR:
        return <Plus className="h-4 w-4 text-green-600" />;
      case ACCIONES_SOLICITUDES.CAMBIAR_ESTADO:
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
      case ACCIONES_SOLICITUDES.ASIGNAR_ANALISTA:
        return <User className="h-4 w-4 text-purple-600" />;
      case ACCIONES_SOLICITUDES.EDITAR:
        return <Edit className="h-4 w-4 text-orange-600" />;
      case ACCIONES_SOLICITUDES.APROBAR:
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case ACCIONES_SOLICITUDES.RECHAZAR:
        return <XCircle className="h-4 w-4 text-red-600" />;
      case ACCIONES_SOLICITUDES.CONTACTAR:
        return <Phone className="h-4 w-4 text-blue-600" />;
      case ACCIONES_SOLICITUDES.STAND_BY:
        return <Pause className="h-4 w-4 text-gray-600" />;
      case ACCIONES_SOLICITUDES.REACTIVAR:
        return <Play className="h-4 w-4 text-green-600" />;
      case ACCIONES_SOLICITUDES.ELIMINAR:
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getAccionLabel = (accion: string) => {
    switch (accion) {
      case ACCIONES_SOLICITUDES.CREAR:
        return 'Crear Solicitud';
      case ACCIONES_SOLICITUDES.CAMBIAR_ESTADO:
        return 'Cambiar Estado';
      case ACCIONES_SOLICITUDES.ASIGNAR_ANALISTA:
        return 'Asignar Analista';
      case ACCIONES_SOLICITUDES.EDITAR:
        return 'Editar Solicitud';
      case ACCIONES_SOLICITUDES.APROBAR:
        return 'Aprobar Solicitud';
      case ACCIONES_SOLICITUDES.RECHAZAR:
        return 'Rechazar Solicitud';
      case ACCIONES_SOLICITUDES.CONTACTAR:
        return 'Contactar Solicitud';
      case ACCIONES_SOLICITUDES.STAND_BY:
        return 'Stand By';
      case ACCIONES_SOLICITUDES.REACTIVAR:
        return 'Reactivar Solicitud';
      case ACCIONES_SOLICITUDES.ELIMINAR:
        return 'Eliminar Solicitud';
      default:
        return accion;
    }
  };

  const getAccionBadgeVariant = (accion: string) => {
    switch (accion) {
      case ACCIONES_SOLICITUDES.CREAR:
      case ACCIONES_SOLICITUDES.APROBAR:
      case ACCIONES_SOLICITUDES.REACTIVAR:
        return 'default';
      case ACCIONES_SOLICITUDES.CAMBIAR_ESTADO:
      case ACCIONES_SOLICITUDES.ASIGNAR_ANALISTA:
        return 'secondary';
      case ACCIONES_SOLICITUDES.EDITAR:
        return 'outline';
      case ACCIONES_SOLICITUDES.CONTACTAR:
        return 'secondary';
      case ACCIONES_SOLICITUDES.STAND_BY:
        return 'outline';
      case ACCIONES_SOLICITUDES.RECHAZAR:
      case ACCIONES_SOLICITUDES.ELIMINAR:
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Historial de Acciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Cargando historial...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Historial de Acciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-red-600">{error}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Historial de Acciones
          {logs.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {logs.length} acciones
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mb-4 opacity-50" />
            <p>No hay acciones registradas para esta solicitud</p>
            <p className="text-sm">Las acciones se registrarán automáticamente</p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                <div className="flex-shrink-0 mt-1">
                  {getAccionIcon(log.accion)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={getAccionBadgeVariant(log.accion)}>
                      {getAccionLabel(log.accion)}
                    </Badge>
                    
                    {log.estado_anterior && log.estado_nuevo && (
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">{log.estado_anterior}</span>
                        <span className="mx-1">→</span>
                        <span className="font-medium">{log.estado_nuevo}</span>
                      </div>
                    )}
                  </div>
                  
                  {log.observacion && (
                    <p className="text-sm text-foreground mb-2">
                      {log.observacion}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{log.usuario?.nombre || `Usuario ${log.usuario_id}`}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatDateTime(log.fecha_accion)}</span>
                      <span className="text-xs">({formatDate(log.fecha_accion)})</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SolicitudLogs;

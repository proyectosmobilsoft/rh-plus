import { useState, useCallback } from 'react';
import { solicitudesLogsService, SolicitudLog, ACCIONES_SOLICITUDES } from '@/services/solicitudesLogsService';
import { useAuth } from '@/contexts/AuthContext';

export const useSolicitudesLogs = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Función para crear un log de acción
  const crearLog = useCallback(async (params: Omit<SolicitudLog, 'id' | 'fecha_accion'>): Promise<boolean> => {
    if (!user?.id) {
      console.error('Usuario no autenticado para crear log');
      return false;
    }

    setIsLoading(true);
    try {
      const success = await solicitudesLogsService.crearLog({
        ...params,
        usuario_id: user.id
      });
      return !!success; // Convertir a boolean
    } catch (error) {
      console.error('Error al crear log:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Función para crear log de creación de solicitud
  const logCrearSolicitud = useCallback(async (solicitudId: number, observacion?: string): Promise<boolean> => {
    return crearLog({
      solicitud_id: solicitudId,
      accion: ACCIONES_SOLICITUDES.CREAR,
      observacion: observacion || 'Solicitud creada exitosamente'
    });
  }, [crearLog]);

  // Función para crear log de cambio de estado
  const logCambiarEstado = useCallback(async (
    solicitudId: number, 
    estadoAnterior: string, 
    estadoNuevo: string, 
    observacion?: string
  ): Promise<boolean> => {
    return crearLog({
      solicitud_id: solicitudId,
      accion: ACCIONES_SOLICITUDES.CAMBIAR_ESTADO,
      estado_anterior: estadoAnterior,
      estado_nuevo: estadoNuevo,
      observacion: observacion || `Estado cambiado de "${estadoAnterior}" a "${estadoNuevo}"`
    });
  }, [crearLog]);

  // Función para crear log de asignación de analista
  const logAsignarAnalista = useCallback(async (
    solicitudId: number, 
    analistaId: number, 
    observacion?: string
  ): Promise<boolean> => {
    return crearLog({
      solicitud_id: solicitudId,
      accion: ACCIONES_SOLICITUDES.ASIGNAR_ANALISTA,
      observacion: observacion || `Analista asignado (ID: ${analistaId})`
    });
  }, [crearLog]);

  // Función para crear log de edición
  const logEditarSolicitud = useCallback(async (
    solicitudId: number, 
    observacion?: string
  ): Promise<boolean> => {
    return crearLog({
      solicitud_id: solicitudId,
      accion: ACCIONES_SOLICITUDES.EDITAR,
      observacion: observacion || 'Solicitud editada'
    });
  }, [crearLog]);

  // Función para crear log de aprobación
  const logAprobarSolicitud = useCallback(async (
    solicitudId: number, 
    observacion?: string
  ): Promise<boolean> => {
    return crearLog({
      solicitud_id: solicitudId,
      accion: ACCIONES_SOLICITUDES.APROBAR,
      estado_nuevo: 'APROBADA',
      observacion: observacion || 'Solicitud aprobada'
    });
  }, [crearLog]);

  // Función para crear log de rechazo
  const logRechazarSolicitud = useCallback(async (
    solicitudId: number, 
    observacion?: string
  ): Promise<boolean> => {
    return crearLog({
      solicitud_id: solicitudId,
      accion: ACCIONES_SOLICITUDES.RECHAZAR,
      estado_nuevo: 'RECHAZADA',
      observacion: observacion || 'Solicitud rechazada'
    });
  }, [crearLog]);

  // Función para crear log de contacto
  const logContactarSolicitud = useCallback(async (
    solicitudId: number, 
    estadoAnterior: string,
    observacion?: string
  ): Promise<boolean> => {
    return crearLog({
      solicitud_id: solicitudId,
      accion: ACCIONES_SOLICITUDES.CONTACTAR,
      estado_anterior: estadoAnterior,
      estado_nuevo: 'PENDIENTE DOCUMENTOS',
      observacion: observacion || 'Solicitud marcada como contactada'
    });
  }, [crearLog]);

  // Función para crear log de Stand By
  const logStandBySolicitud = useCallback(async (
    solicitudId: number, 
    estadoAnterior: string,
    observacion: string
  ): Promise<boolean> => {
    return crearLog({
      solicitud_id: solicitudId,
      accion: ACCIONES_SOLICITUDES.STAND_BY,
      estado_anterior: estadoAnterior,
      estado_nuevo: 'STAND BY',
      observacion: `Solicitud puesta en Stand By: ${observacion}`
    });
  }, [crearLog]);

  // Función para crear log de reactivación
  const logReactivarSolicitud = useCallback(async (
    solicitudId: number, 
    estadoAnterior: string,
    estadoNuevo: string,
    observacion?: string
  ): Promise<boolean> => {
    return crearLog({
      solicitud_id: solicitudId,
      accion: ACCIONES_SOLICITUDES.REACTIVAR,
      estado_anterior: estadoAnterior,
      estado_nuevo: estadoNuevo,
      observacion: observacion || `Solicitud reactivada de Stand By a "${estadoNuevo}"`
    });
  }, [crearLog]);

  // Función para crear log de eliminación
  const logEliminarSolicitud = useCallback(async (
    solicitudId: number, 
    estadoAnterior: string,
    observacion?: string
  ): Promise<boolean> => {
    return crearLog({
      solicitud_id: solicitudId,
      accion: ACCIONES_SOLICITUDES.ELIMINAR,
      estado_anterior: estadoAnterior,
      observacion: observacion || 'Solicitud eliminada'
    });
  }, [crearLog]);

  return {
    isLoading,
    crearLog,
    logCrearSolicitud,
    logCambiarEstado,
    logAsignarAnalista,
    logEditarSolicitud,
    logAprobarSolicitud,
    logRechazarSolicitud,
    logContactarSolicitud,
    logStandBySolicitud,
    logReactivarSolicitud,
    logEliminarSolicitud
  };
};

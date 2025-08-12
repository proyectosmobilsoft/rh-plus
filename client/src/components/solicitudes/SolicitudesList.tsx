import React, { useState } from 'react';
import { Edit, Trash2, Eye, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Solicitud } from '@/services/solicitudesService';

interface SolicitudesListProps {
  solicitudes: Solicitud[];
  onEdit: (solicitud: Solicitud) => void;
  onDelete: (id: number) => void;
  onView: (solicitud: Solicitud) => void;
  onApprove: (id: number) => void;
  isLoading?: boolean;
}

const SolicitudesList: React.FC<SolicitudesListProps> = ({
  solicitudes,
  onEdit,
  onDelete,
  onView,
  onApprove,
  isLoading = false
}) => {
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmApproveOpen, setConfirmApproveOpen] = useState(false);
  const [selectedSolicitudId, setSelectedSolicitudId] = useState<number | null>(null);

  const getStatusBadge = (estado: string) => {
    switch (estado?.toUpperCase()) {
      case 'PENDIENTE':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
      case 'ASIGNADO':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">Asignado</Badge>;
      case 'APROBADA':
        return <Badge variant="default" className="bg-green-100 text-green-800">Aprobada</Badge>;
      case 'RECHAZADA':
        return <Badge variant="destructive" className="bg-red-100 text-red-800">Rechazada</Badge>;
      case 'EN_PROCESO':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">En Proceso</Badge>;
      default:
        return <Badge variant="outline">{estado || 'Sin estado'}</Badge>;
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

  // Función para mostrar datos con valores por defecto
  const getDisplayValue = (value: string | undefined, defaultValue: string = 'No especificado') => {
    return value && value.trim() !== '' ? value : defaultValue;
  };

  const handleDeleteClick = (id: number | undefined) => {
    if (id) {
      setSelectedSolicitudId(id);
      setConfirmDeleteOpen(true);
    }
  };

  const handleApproveClick = (id: number | undefined) => {
    if (id) {
      setSelectedSolicitudId(id);
      setConfirmApproveOpen(true);
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedSolicitudId) {
      onDelete(selectedSolicitudId);
      setConfirmDeleteOpen(false);
      setSelectedSolicitudId(null);
    }
  };

  const handleApproveConfirm = () => {
    if (selectedSolicitudId) {
      onApprove(selectedSolicitudId);
      setConfirmApproveOpen(false);
      setSelectedSolicitudId(null);
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
              <TableRow key={solicitud.id}>
                <TableCell>
                  <div className="flex justify-center items-center space-x-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onView(solicitud)}
                            aria-label="Ver solicitud"
                            className="h-8 w-8"
                          >
                            <Eye className="h-4 w-4 text-blue-600" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Ver detalles</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(solicitud)}
                            aria-label="Editar solicitud"
                            className="h-8 w-8"
                          >
                            <Edit className="h-4 w-4 text-green-600" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Editar</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {solicitud.estado === 'PENDIENTE' && (
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
                            <p>Aprobar</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(solicitud.id)}
                            aria-label="Eliminar solicitud"
                            className="h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Eliminar</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
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
                    <span className="text-sm font-medium">
                      {formatDateTime(solicitud.updated_at)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(solicitud.updated_at)}
                    </span>
                  </div>
                </TableCell>
                
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Confirmación de eliminación */}
      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar solicitud?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedSolicitudId && (() => {
                const solicitud = solicitudes.find(s => s.id === selectedSolicitudId);
                const nombre = solicitud?.candidatos?.primer_nombre 
                  ? `${solicitud.candidatos.primer_nombre} ${solicitud.candidatos.primer_apellido || ''}`.trim()
                  : 'Sin nombre';
                return (
                  <>
                    ¿Estás seguro de que deseas eliminar la solicitud de{" "}
                    <strong>{nombre}</strong>?
                    <br />
                    Esta acción no se puede deshacer.
                  </>
                );
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmación de aprobación */}
      <AlertDialog open={confirmApproveOpen} onOpenChange={setConfirmApproveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Aprobar solicitud?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas aprobar esta solicitud? Esta acción cambiará el estado a "Aprobada".
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
    </>
  );
};

export default SolicitudesList; 
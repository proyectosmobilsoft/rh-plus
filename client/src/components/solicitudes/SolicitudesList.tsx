import React, { useState } from 'react';
import { Edit, Trash2, Eye, CheckCircle, Clock, AlertCircle } from 'lucide-react';
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
      case 'APROBADA':
        return <Badge variant="default" className="bg-green-100 text-green-800">Aprobada</Badge>;
      case 'RECHAZADA':
        return <Badge variant="destructive" className="bg-red-100 text-red-800">Rechazada</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  const getPriorityBadge = (prioridad: string) => {
    switch (prioridad?.toLowerCase()) {
      case 'alta':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Alta</Badge>;
      case 'media':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Media</Badge>;
      case 'baja':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Baja</Badge>;
      default:
        return <Badge variant="outline">Sin prioridad</Badge>;
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
              <TableHead>ID</TableHead>
              <TableHead>Trabajador</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Ciudad</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Prioridad</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {solicitudes.map((solicitud) => (
              <TableRow key={solicitud.id}>
                <TableCell className="font-medium">#{solicitud.id}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{solicitud.nombres} {solicitud.apellidos}</span>
                    <span className="text-sm text-muted-foreground">{solicitud.celular}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{solicitud.tipoDocumento}: {solicitud.numeroDocumento}</span>
                    <span className="text-sm text-muted-foreground">{solicitud.lugarExpedicion}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{solicitud.empresaUsuaria || 'Sin empresa'}</span>
                    <span className="text-sm text-muted-foreground">{solicitud.ciudadPrestacionServicio}</span>
                  </div>
                </TableCell>
                <TableCell>{solicitud.cargo}</TableCell>
                <TableCell>{solicitud.ciudad}</TableCell>
                <TableCell>{getStatusBadge(solicitud.estado)}</TableCell>
                <TableCell>{getPriorityBadge(solicitud.prioridad || 'media')}</TableCell>
                <TableCell>{formatDate(solicitud.fechaCreacion || solicitud.created_at)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onView(solicitud)}
                            aria-label="Ver solicitud"
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
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteClick(solicitud.id)}
                                aria-label="Eliminar solicitud"
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar solicitud?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  ¿Estás seguro de que deseas eliminar la solicitud de{" "}
                                  <strong>{solicitud.nombres} {solicitud.apellidos}</strong>?
                                  Esta acción no se puede deshacer.
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
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Eliminar</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
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
              Esta acción no se puede deshacer. La solicitud será eliminada permanentemente.
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
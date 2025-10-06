import React, { useState } from 'react';
import { Eye, Edit, Trash2, CheckCircle, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Orden } from '@/services/ordenesService';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface OrdenesListProps {
  ordenes: Orden[];
  onEdit: (orden: Orden) => void;
  onDelete: (id: number) => void;
  onView: (orden: Orden) => void;
  onApprove: (id: number) => void;
}

const OrdenesList: React.FC<OrdenesListProps> = ({ 
  ordenes, 
  onEdit, 
  onDelete, 
  onView, 
  onApprove 
}) => {
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmApproveOpen, setConfirmApproveOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  const getStatusBadge = (estado: string) => {
    switch (estado?.toUpperCase()) {
      case 'PENDIENTE':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
      case 'APROBADA':
        return <Badge variant="default" className="bg-green-100 text-green-800">Aprobada</Badge>;
      case 'ANULADA':
        return <Badge variant="destructive" className="bg-red-100 text-red-800">Anulada</Badge>;
      case 'FINALIZADA':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Finalizada</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
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
      setSelectedOrderId(id);
      setConfirmDeleteOpen(true);
    }
  };

  const handleApproveClick = (id: number | undefined) => {
    if (id) {
      setSelectedOrderId(id);
      setConfirmApproveOpen(true);
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedOrderId) {
      onDelete(selectedOrderId);
      setConfirmDeleteOpen(false);
      setSelectedOrderId(null);
    }
  };

  const handleApproveConfirm = () => {
    if (selectedOrderId) {
      onApprove(selectedOrderId);
      setConfirmApproveOpen(false);
      setSelectedOrderId(null);
    }
  };

  if (ordenes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <p>No hay órdenes disponibles.</p>
        <p className="text-sm">Crea una nueva orden para comenzar.</p>
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
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ordenes.map((orden) => (
              <TableRow key={orden.id}>
                <TableCell className="font-medium">#{orden.id}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{orden.nombres} {orden.apellidos}</span>
                    <span className="text-sm text-muted-foreground">{orden.celular}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{orden.tipoDocumento}: {orden.numeroDocumento}</span>
                    <span className="text-sm text-muted-foreground">{orden.lugarExpedicion}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{orden.empresaUsuaria || orden.empresa_name || 'Sin empresa'}</span>
                    <span className="text-sm text-muted-foreground">{orden.ciudadPrestacionServicio}</span>
                  </div>
                </TableCell>
                <TableCell>{orden.cargo}</TableCell>
                <TableCell>{orden.ciudad}</TableCell>
                <TableCell>{getStatusBadge(orden.estado)}</TableCell>
                <TableCell>{formatDate(orden.fechaCreacion || orden.fecha_orden || orden.fecha)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menú</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView(orden)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(orden)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      {orden.estado !== 'APROBADA' && (
                        <DropdownMenuItem onClick={() => handleApproveClick(orden.id)}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Aprobar
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        onClick={() => handleDeleteClick(orden.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente la orden seleccionada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Approve Confirmation Dialog */}
      <AlertDialog open={confirmApproveOpen} onOpenChange={setConfirmApproveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aprobar Orden</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro que desea aprobar esta orden? Esta acción cambiará el estado a "Aprobada".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleApproveConfirm} className="bg-green-600 hover:bg-green-700">
              Aprobar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default OrdenesList;


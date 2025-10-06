
import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FileText } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Orden } from '@/services/ordenesService';

interface CertificadosListProps {
  ordenes: Orden[];
  onCreateCertificate: (orden: Orden) => void;
}

const CertificadosList = ({ ordenes, onCreateCertificate }: CertificadosListProps) => {
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'dd MMM yyyy', { locale: es });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  return (
    <div className="border rounded-lg shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead className="w-[80px] font-semibold">N° Orden</TableHead>
            <TableHead className="font-semibold">Fecha</TableHead>
            <TableHead className="font-semibold">Empresa</TableHead>
            <TableHead className="font-semibold">Aspirante</TableHead>
            <TableHead className="text-right font-semibold">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ordenes.length > 0 ? (
            ordenes.map((orden) => (
              <TableRow key={orden.id} className="hover:bg-gray-50 transition-colors">
                <TableCell className="font-medium">{orden.id || 'N/A'}</TableCell>
                <TableCell>{formatDate(orden.fechaCreacion)}</TableCell>
                <TableCell>{orden.empresa_name || 'N/A'}</TableCell>
                <TableCell>
                  {orden.aspirante_name || 'N/A'}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    onClick={() => onCreateCertificate(orden)}
                    className="bg-primary hover:bg-primary/90 h-8"
                    size="icon"
                    title="Crear Certificado"
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                No hay órdenes aprobadas disponibles para certificación.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default CertificadosList;



import { useState, useEffect } from 'react';
import { FileText } from "lucide-react";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog";
import CertificadosList from '@/components/certificados/CertificadosList';
import CertificadoForm from '@/components/certificados/CertificadoForm';
import { Orden, ordenesService } from '@/services/ordenesService';

const ExpedicionCertificadosPage = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedOrden, setSelectedOrden] = useState<Orden | undefined>(undefined);
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch approved orders when component mounts
  useEffect(() => {
    fetchApprovedOrders();
  }, []);

  const fetchApprovedOrders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Get all orders and filter for approved ones
      const data = await ordenesService.getAll();
      // Filter for approved orders
      const approvedOrders = data.filter(orden => orden.estado === 'APROBADA');
      console.log("Fetched approved orders:", approvedOrders);
      setOrdenes(approvedOrders);
    } catch (error) {
      console.error("Error fetching approved orders:", error);
      setError('Error al cargar las órdenes aprobadas');
      toast.error('Error al cargar las órdenes aprobadas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCertificate = (orden: Orden) => {
    setSelectedOrden(orden);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedOrden(undefined);
  };

  const handleFormSubmit = async (data: any) => {
    try {
      // API call is now handled inside the CertificadoForm component
      toast.success('Certificado guardado correctamente');
      setIsFormOpen(false);
      fetchApprovedOrders(); // Refresh the list
    } catch (error) {
      toast.error('Error al guardar el certificado');
      console.error(error);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Expedición de Certificados</h1>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="dashboard-card bg-white">
          <div className="mb-4">
            <h2 className="text-xl font-medium text-primary-foreground">Órdenes Aprobadas</h2>
            <p className="text-muted-foreground mt-1">
              Seleccione una orden para generar su certificado médico.
            </p>
          </div>
          
          {isLoading ? (
            <div className="text-center py-6">Cargando órdenes aprobadas...</div>
          ) : error ? (
            <div className="text-center py-6 text-destructive">
              Error al cargar las órdenes. Por favor intente nuevamente.
            </div>
          ) : (
            <CertificadosList
              ordenes={ordenes}
              onCreateCertificate={handleCreateCertificate}
            />
          )}
        </div>
      </div>

      {/* Certificate Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-primary">
              Expedición de Certificado
            </DialogTitle>
          </DialogHeader>
          {selectedOrden && (
            <CertificadoForm
              orden={selectedOrden}
              onSubmit={handleFormSubmit}
              onCancel={handleFormClose}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpedicionCertificadosPage;


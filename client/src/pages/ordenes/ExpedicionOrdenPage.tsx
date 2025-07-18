
import { useState, useEffect } from 'react';
import { FileText, Plus, Filter } from "lucide-react";
import { toast } from 'sonner';

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogDescription } from "@/components/ui/dialog";
import { Orden, ordenesService } from '@/services/ordenesService';
import OrdenForm from '@/components/ordenes/OrdenForm';
import OrdenesList from '@/components/ordenes/OrdenesList';
import OrdenPDF from '@/components/ordenes/OrdenPDF';
import OrdenesStatistics from '@/components/ordenes/OrdenesStatistics';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ExpedicionOrdenPage = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPDFOpen, setIsPDFOpen] = useState(false);
  const [selectedOrden, setSelectedOrden] = useState<Orden | undefined>(undefined);
  const [ordenParaPDF, setOrdenParaPDF] = useState<Orden | undefined>(undefined);
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estadoFilter, setEstadoFilter] = useState<string | null>(null);

  // Fetch orders when component mounts or filter changes
  useEffect(() => {
    fetchOrdenes(estadoFilter);
  }, [estadoFilter]);

  const fetchOrdenes = async (estado: string | null = null) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await ordenesService.getAll(estado);
      setOrdenes(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError('Error al cargar las órdenes');
      toast.error('Error al cargar las órdenes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedOrden(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = async (orden: Orden) => {
    try {
      if (orden.id) {
        setIsLoading(true);
        // Fetch full order details with associated services
        const fullOrder = await ordenesService.getById(orden.id);
        setIsLoading(false);
        
        if (fullOrder) {
          console.log("Full order details:", fullOrder);
          setSelectedOrden(fullOrder);
          setIsFormOpen(true);
        } else {
          toast.error('Error al cargar los detalles de la orden');
        }
      }
    } catch (error) {
      setIsLoading(false);
      console.error("Error fetching order details:", error);
      toast.error('Error al cargar los detalles de la orden');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await ordenesService.delete(id);
      toast.success('Orden anulada correctamente');
      fetchOrdenes(estadoFilter); // Refresh the list with current filter
    } catch (error) {
      toast.error('Error al anular la orden');
      console.error(error);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await ordenesService.approve(id);
      toast.success('Orden aprobada correctamente');
      fetchOrdenes(estadoFilter); // Refresh the list with current filter
    } catch (error) {
      toast.error('Error al aprobar la orden');
      console.error(error);
    }
  };

  const handleView = async (orden: Orden) => {
    try {
      setIsLoading(true);
      // If the order has an ID, fetch the complete data for PDF
      if (orden.id) {
        const fullOrder = await ordenesService.getById(orden.id);
        setIsLoading(false);
        
        if (fullOrder) {
          setOrdenParaPDF(fullOrder);
          setIsPDFOpen(true);
        } else {
          toast.error('Error al cargar los detalles para el PDF');
        }
      } else {
        setOrdenParaPDF(orden);
        setIsPDFOpen(true);
      }
    } catch (error) {
      setIsLoading(false);
      console.error("Error preparing PDF view:", error);
      toast.error('Error al preparar la vista del PDF');
    }
  };

  const handleFormSubmit = async (data: Orden) => {
    try {
      // Generate a unique order number if creating new order
      if (!data.id) {
        data.numeroOrden = `ORD-${Date.now()}`;
      }
      
      if (data.id) {
        // Update existing orden
        await ordenesService.update(data);
        toast.success('Orden actualizada correctamente');
      } else {
        // Create new orden
        await ordenesService.create(data);
        toast.success('Orden creada correctamente');
      }
      setIsFormOpen(false);
      fetchOrdenes(estadoFilter); // Refresh the list with current filter
    } catch (error) {
      toast.error('Error al guardar la orden');
      console.error(error);
    }
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Expedición de Órdenes</h1>
          </div>
          <Button onClick={handleCreate} className="flex items-center gap-1 bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            <span>Nueva Orden</span>
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Statistics Dashboard */}
        <OrdenesStatistics ordenes={ordenes} />
        
        <div className="dashboard-card bg-white">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-medium text-primary-foreground">Listado</h2>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select 
                value={estadoFilter || 'all'} 
                onValueChange={(value) => setEstadoFilter(value === 'all' ? null : value)}
              >
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                  <SelectItem value="APROBADA">Aprobada</SelectItem>
                  <SelectItem value="ANULADA">Anulada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {isLoading ? (
            <div className="text-center py-6">Cargando órdenes...</div>
          ) : error ? (
            <div className="text-center py-6 text-destructive">
              Error al cargar las órdenes. Por favor intente nuevamente.
            </div>
          ) : (
            <OrdenesList
              ordenes={ordenes}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={handleView}
              onApprove={handleApprove}
            />
          )}
        </div>
      </div>

      {/* Order Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-primary">
              {selectedOrden ? 'Editar' : 'Nueva'} Orden
            </DialogTitle>
            <DialogDescription>
              Complete el formulario para {selectedOrden ? 'actualizar' : 'crear'} la orden de servicio.
            </DialogDescription>
          </DialogHeader>
          <OrdenForm
            orden={selectedOrden}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
          />
        </DialogContent>
      </Dialog>

      {/* PDF Preview Dialog */}
      <Dialog open={isPDFOpen} onOpenChange={setIsPDFOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-primary">
              Vista Previa de Orden #{ordenParaPDF?.id}
            </DialogTitle>
            <DialogDescription>
              Vista previa antes de imprimir o descargar.
            </DialogDescription>
          </DialogHeader>
          {ordenParaPDF && <OrdenPDF orden={ordenParaPDF} />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpedicionOrdenPage;


import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ordenesService } from "@/services/ordenesService";
import { Label } from "@/components/ui/label";

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  time: string;
  especialistaId?: number;
}

export const AppointmentModal = ({ isOpen, onClose, date, time, especialistaId }: AppointmentModalProps) => {
  const [approvedOrders, setApprovedOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<string>("");
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [observacion, setObservacion] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Load approved orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await ordenesService.getAllOrdenes();
        // Filter for approved orders only
        const approvedData = data.filter(order => order.estado === "Aprobado");
        setApprovedOrders(approvedData);
      } catch (error) {
        console.error("Error fetching orders:", error);
        toast.error("Error al cargar las órdenes aprobadas");
      }
    };

    fetchOrders();
  }, []);

  // Load order details when an order is selected
  useEffect(() => {
    if (selectedOrder) {
      const fetchOrderDetails = async () => {
        try {
          setIsLoading(true);
          const details = await ordenesService.getOrdenById(parseInt(selectedOrder));
          setOrderDetails(details);
          setSelectedServices([]);
        } catch (error) {
          console.error("Error fetching order details:", error);
          toast.error("Error al cargar los detalles de la orden");
        } finally {
          setIsLoading(false);
        }
      };

      fetchOrderDetails();
    } else {
      setOrderDetails(null);
      setSelectedServices([]);
    }
  }, [selectedOrder]);

  const handleServiceToggle = (serviceId: number) => {
    setSelectedServices(prev => {
      if (prev.includes(serviceId)) {
        return prev.filter(id => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
  };

  const handleSaveAppointment = async () => {
    if (!selectedOrder) {
      toast.error("Debe seleccionar una orden");
      return;
    }

    if (selectedServices.length === 0) {
      toast.error("Debe seleccionar al menos un servicio");
      return;
    }

    setIsLoading(true);
    
    try {
      // Prepare appointment data
      const appointmentData = {
        ordenId: parseInt(selectedOrder),
        fecha: `${format(date, "yyyy-MM-dd")}T${time}:00`,
        servicios: selectedServices,
        observacion: observacion,
        especialistaId: especialistaId || 1, // Default to ID 1 if not provided
      };
      
      // Mock API call - replace with actual API when available
      console.log("Saving appointment:", appointmentData);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast.success("Cita médica guardada exitosamente");
      onClose();
    } catch (error) {
      console.error("Error saving appointment:", error);
      toast.error("Error al guardar la cita médica");
    } finally {
      setIsLoading(false);
    }
  };

  const formattedDate = format(date, "EEEE d 'de' MMMM 'de' yyyy", { locale: es });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Agendar Cita Médica</DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="grid gap-1">
            <label className="text-sm font-medium">Fecha y Hora</label>
            <div className="text-sm">
              {formattedDate} - {time}
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Orden</label>
            <Select 
              value={selectedOrder} 
              onValueChange={setSelectedOrder}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione una orden aprobada" />
              </SelectTrigger>
              <SelectContent>
                {approvedOrders.map((order) => (
                  <SelectItem key={order.id} value={order.id.toString()}>
                    Orden #{order.id} - {order.estado}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading && (
            <div className="text-center py-4">
              <p>Cargando detalles de la orden...</p>
            </div>
          )}

          {orderDetails && !isLoading && (
            <div className="space-y-4">
              <div className="border rounded-md p-4">
                <h4 className="font-medium mb-2">Información de la Orden</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>ID: <span className="font-medium">{orderDetails.id}</span></div>
                  <div>Total: <span className="font-medium">${orderDetails.total}</span></div>
                </div>
              </div>

              <div className="border rounded-md p-4">
                <h4 className="font-medium mb-2">Servicios</h4>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {orderDetails.servicios && orderDetails.servicios.map((servicio: any) => (
                    <div key={servicio.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`service-${servicio.id}`}
                        checked={selectedServices.includes(servicio.id)}
                        onCheckedChange={() => handleServiceToggle(servicio.id)}
                      />
                      <Label htmlFor={`service-${servicio.id}`} className="text-sm">
                        {servicio.descripcion} - {servicio.codigo}
                      </Label>
                    </div>
                  ))}
                  {orderDetails.servicios?.length === 0 && (
                    <p className="text-sm text-muted-foreground">No hay servicios disponibles</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <label className="text-sm font-medium">Observación</label>
            <Textarea
              placeholder="Ingrese una observación para la cita"
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button 
            onClick={handleSaveAppointment}
            disabled={isLoading || selectedServices.length === 0}
          >
            {isLoading ? "Guardando..." : "Guardar Cita"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


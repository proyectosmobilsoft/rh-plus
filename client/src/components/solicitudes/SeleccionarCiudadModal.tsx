import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { validacionDocumentosService } from '@/services/validacionDocumentosService';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface SeleccionarCiudadModalProps {
  isOpen: boolean;
  onClose: () => void;
  solicitudId: number;
  observacion: string;
  candidatoNombre: string;
  onSuccess: (message: string) => void;
}

interface Ciudad {
  id: number;
  nombre: string;
  departamento: string;
}

const SeleccionarCiudadModal: React.FC<SeleccionarCiudadModalProps> = ({
  isOpen,
  onClose,
  solicitudId,
  observacion,
  candidatoNombre,
  onSuccess
}) => {
  const [ciudades, setCiudades] = useState<Ciudad[]>([]);
  const [ciudadSeleccionada, setCiudadSeleccionada] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCiudades, setIsLoadingCiudades] = useState(false);
  const { toast } = useToast();

  // Cargar ciudades al abrir el modal
  useEffect(() => {
    if (isOpen) {
      cargarCiudades();
    }
  }, [isOpen]);

  const cargarCiudades = async () => {
    setIsLoadingCiudades(true);
    try {
      const ciudadesData = await validacionDocumentosService.getCiudadesDisponibles();
      setCiudades(ciudadesData);
    } catch (error) {
      console.error('Error cargando ciudades:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las ciudades disponibles',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingCiudades(false);
    }
  };

  const handleConfirmar = async () => {
    if (!ciudadSeleccionada) {
      toast({
        title: 'Error',
        description: 'Por favor seleccione una ciudad',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const ciudadId = parseInt(ciudadSeleccionada);
      const resultado = await validacionDocumentosService.validarDocumentosYEnviarEmail(
        solicitudId,
        observacion,
        ciudadId
      );

      if (resultado.success) {
        onSuccess(resultado.message);
        onClose();
      } else {
        toast({
          title: 'Error',
          description: resultado.message,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error validando documentos:', error);
      toast({
        title: 'Error',
        description: 'Error al validar documentos. Por favor intente nuevamente.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelar = () => {
    setCiudadSeleccionada('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Seleccionar Ciudad para Exámenes Médicos</DialogTitle>
          <DialogDescription>
            No se encontraron prestadores médicos en la ciudad de <strong>{candidatoNombre}</strong>. 
            Por favor seleccione una ciudad donde el candidato pueda realizar sus exámenes médicos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="ciudad">Ciudad</Label>
            {isLoadingCiudades ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Cargando ciudades...</span>
              </div>
            ) : (
              <Select value={ciudadSeleccionada} onValueChange={setCiudadSeleccionada}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione una ciudad" />
                </SelectTrigger>
                <SelectContent>
                  {ciudades.map((ciudad) => (
                    <SelectItem key={ciudad.id} value={ciudad.id.toString()}>
                      {ciudad.nombre} - {ciudad.departamento}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancelar}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirmar}
            disabled={isLoading || !ciudadSeleccionada || isLoadingCiudades}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Procesando...
              </>
            ) : (
              'Confirmar y Enviar Email'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SeleccionarCiudadModal;

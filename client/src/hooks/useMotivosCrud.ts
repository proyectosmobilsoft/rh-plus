
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motivosService } from '@/services/motivosService';
import { UpdateMotivoData } from '@/types/maestro';
import { toast } from 'sonner';

export const useMotivosCrud = () => {
  
  const queryClient = useQueryClient();

  // Query para obtener todos los motivos
  const { 
    data: motivos = [], 
    isLoading,
    error 
  } = useQuery({
    queryKey: ['motivos-all'],
    queryFn: motivosService.getAll,
  });

  // Query para obtener solo los activos
  const { 
    data: motivosActivos = [] 
  } = useQuery({
    queryKey: ['motivos-activos'],
    queryFn: motivosService.getActive,
  });

  // Mutation para crear
  const createMutation = useMutation({
    mutationFn: motivosService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['motivos-all'] });
      queryClient.invalidateQueries({ queryKey: ['motivos-activos'] });
      toast.success("Motivo creado correctamente");
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al crear el motivo");
    },
  });

  // Mutation para actualizar
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateMotivoData }) => 
      motivosService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['motivos-all'] });
      queryClient.invalidateQueries({ queryKey: ['motivos-activos'] });
      toast.success("Motivo actualizado correctamente");
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al actualizar el motivo");
    },
  });

  // Mutation para eliminar
  const deleteMutation = useMutation({
    mutationFn: motivosService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['motivos-all'] });
      queryClient.invalidateQueries({ queryKey: ['motivos-activos'] });
      toast.success("Motivo eliminado correctamente");
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al eliminar el motivo");
    },
  });

  // Mutation para activar
  const activateMutation = useMutation({
    mutationFn: motivosService.activate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['motivos-all'] });
      queryClient.invalidateQueries({ queryKey: ['motivos-activos'] });
      toast.success("Motivo activado correctamente");
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al activar el motivo");
    },
  });

  return {
    motivos,
    motivosActivos,
    isLoading,
    error,
    createMotivo: createMutation.mutateAsync,
    updateMotivo: ({ id, data }: { id: number; data: UpdateMotivoData }) => 
      updateMutation.mutateAsync({ id, data }),
    deleteMotivo: deleteMutation.mutateAsync,
    activateMotivo: activateMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isActivating: activateMutation.isPending,
  };
};

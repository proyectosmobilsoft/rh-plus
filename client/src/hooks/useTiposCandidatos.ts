import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { tiposCandidatosService } from '@/services/tiposCandidatosService';
import { 
  TipoCandidato, 
  CreateTipoCandidatoData, 
  UpdateTipoCandidatoData 
} from '@/types/maestro';

export const useTiposCandidatos = () => {
  const queryClient = useQueryClient();

  const {
    data: tiposCandidatos = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['tipos-candidatos'],
    queryFn: () => tiposCandidatosService.getAll(),
  });

  const {
    data: tiposCandidatosActivos = [],
    isLoading: loadingActivos,
    error: errorActivos,
    refetch: refetchActivos
  } = useQuery({
    queryKey: ['tipos-candidatos-activos'],
    queryFn: () => tiposCandidatosService.getActive(),
  });

  const createTipoCandidato = useMutation({
    mutationFn: (data: CreateTipoCandidatoData) => tiposCandidatosService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-candidatos'] });
      queryClient.invalidateQueries({ queryKey: ['tipos-candidatos-activos'] });
      toast.success('Tipo de candidato creado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al crear tipo de candidato: ${error.message}`);
    },
  });

  const updateTipoCandidato = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTipoCandidatoData }) =>
      tiposCandidatosService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-candidatos'] });
      queryClient.invalidateQueries({ queryKey: ['tipos-candidatos-activos'] });
      toast.success('Tipo de candidato actualizado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar tipo de candidato: ${error.message}`);
    },
  });

  const deleteTipoCandidato = useMutation({
    mutationFn: (id: number) => tiposCandidatosService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-candidatos'] });
      queryClient.invalidateQueries({ queryKey: ['tipos-candidatos-activos'] });
      toast.success('Tipo de candidato eliminado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar tipo de candidato: ${error.message}`);
    },
  });

  const activateTipoCandidato = useMutation({
    mutationFn: (id: number) => tiposCandidatosService.activate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-candidatos'] });
      queryClient.invalidateQueries({ queryKey: ['tipos-candidatos-activos'] });
      toast.success('Tipo de candidato activado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al activar tipo de candidato: ${error.message}`);
    },
  });

  return {
    // Data
    tiposCandidatos,
    tiposCandidatosActivos,
    
    // Loading states
    isLoading,
    loadingActivos,
    
    // Error states
    error,
    errorActivos,
    
    // Actions
    createTipoCandidato: createTipoCandidato.mutate,
    updateTipoCandidato: updateTipoCandidato.mutate,
    deleteTipoCandidato: deleteTipoCandidato.mutate,
    activateTipoCandidato: activateTipoCandidato.mutate,
    
    // Mutation states
    isCreating: createTipoCandidato.isPending,
    isUpdating: updateTipoCandidato.isPending,
    isDeleting: deleteTipoCandidato.isPending,
    isActivating: activateTipoCandidato.isPending,
    
    // Refetch functions
    refetch,
    refetchActivos,
  };
}; 
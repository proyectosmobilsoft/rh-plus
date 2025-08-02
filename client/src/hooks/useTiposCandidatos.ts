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
    queryFn: async () => {
      console.log('🔍 useTiposCandidatos - Ejecutando query para obtener todos los tipos...');
      const data = await tiposCandidatosService.getAll();
      console.log('🔍 useTiposCandidatos - Datos obtenidos:', data);
      return data;
    },
    staleTime: 1000 * 30, // 30 segundos
    gcTime: 1000 * 60 * 2, // 2 minutos
  });

  const {
    data: tiposCandidatosActivos = [],
    isLoading: loadingActivos,
    error: errorActivos,
    refetch: refetchActivos
  } = useQuery({
    queryKey: ['tipos-candidatos-activos'],
    queryFn: async () => {
      console.log('🔍 useTiposCandidatos - Ejecutando query para obtener tipos activos...');
      const data = await tiposCandidatosService.getActive();
      console.log('🔍 useTiposCandidatos - Tipos activos obtenidos:', data);
      return data;
    },
    staleTime: 1000 * 30, // 30 segundos
    gcTime: 1000 * 60 * 2, // 2 minutos
  });

  // Log cuando cambian los datos
  console.log('🔍 useTiposCandidatos - Estado actual:', {
    tiposCandidatos: tiposCandidatos.length,
    tiposCandidatosActivos: tiposCandidatosActivos.length,
    isLoading,
    loadingActivos,
    error: error?.message,
    errorActivos: errorActivos?.message
  });

  const createTipoCandidato = useMutation({
    mutationFn: (data: CreateTipoCandidatoData) => tiposCandidatosService.create(data),
    onSuccess: async () => {
      console.log('🔍 useTiposCandidatos - Tipo creado exitosamente, invalidando cache...');
      // Pequeño delay para asegurar que la BD se actualice
      await new Promise(resolve => setTimeout(resolve, 100));
      // Invalidar todas las queries relacionadas con tipos de candidatos
      queryClient.invalidateQueries({ queryKey: ['tipos-candidatos'] });
      queryClient.invalidateQueries({ queryKey: ['tipos-candidatos-activos'] });
      // Forzar refetch inmediato
      queryClient.refetchQueries({ queryKey: ['tipos-candidatos'] });
      queryClient.refetchQueries({ queryKey: ['tipos-candidatos-activos'] });
      console.log('🔍 useTiposCandidatos - Cache invalidado y refetch ejecutado');
      toast.success('Tipo de candidato creado exitosamente');
    },
    onError: (error: Error) => {
      console.error('🔍 useTiposCandidatos - Error al crear tipo:', error);
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
    
    // Cache management
    invalidateCache: () => {
      console.log('🔍 useTiposCandidatos - Invalidando cache manualmente...');
      queryClient.invalidateQueries({ queryKey: ['tipos-candidatos'] });
      queryClient.invalidateQueries({ queryKey: ['tipos-candidatos-activos'] });
      queryClient.refetchQueries({ queryKey: ['tipos-candidatos'] });
      queryClient.refetchQueries({ queryKey: ['tipos-candidatos-activos'] });
    },
    
    // Force refresh
    forceRefresh: async () => {
      console.log('🔍 useTiposCandidatos - Forzando refresh inmediato...');
      await refetch();
      await refetchActivos();
    },
  };
}; 
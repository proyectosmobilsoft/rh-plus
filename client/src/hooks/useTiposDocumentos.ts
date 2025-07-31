import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { tiposDocumentosService } from '@/services/tiposDocumentosService';
import { 
  TipoDocumento, 
  CreateTipoDocumentoData, 
  UpdateTipoDocumentoData 
} from '@/types/maestro';

export const useTiposDocumentos = () => {
  const queryClient = useQueryClient();

  const {
    data: tiposDocumentos = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['tipos-documentos'],
    queryFn: () => tiposDocumentosService.getAll(),
  });

  const {
    data: tiposDocumentosActivos = [],
    isLoading: loadingActivos,
    error: errorActivos,
    refetch: refetchActivos
  } = useQuery({
    queryKey: ['tipos-documentos-activos'],
    queryFn: () => tiposDocumentosService.getActive(),
  });

  const {
    data: tiposDocumentosRequeridos = [],
    isLoading: loadingRequeridos,
    error: errorRequeridos,
    refetch: refetchRequeridos
  } = useQuery({
    queryKey: ['tipos-documentos-requeridos'],
    queryFn: () => tiposDocumentosService.getRequired(),
  });

  const createTipoDocumento = useMutation({
    mutationFn: (data: CreateTipoDocumentoData) => tiposDocumentosService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-documentos'] });
      queryClient.invalidateQueries({ queryKey: ['tipos-documentos-activos'] });
      queryClient.invalidateQueries({ queryKey: ['tipos-documentos-requeridos'] });
      toast.success('Tipo de documento creado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al crear tipo de documento: ${error.message}`);
    },
  });

  const updateTipoDocumento = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTipoDocumentoData }) =>
      tiposDocumentosService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-documentos'] });
      queryClient.invalidateQueries({ queryKey: ['tipos-documentos-activos'] });
      queryClient.invalidateQueries({ queryKey: ['tipos-documentos-requeridos'] });
      toast.success('Tipo de documento actualizado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar tipo de documento: ${error.message}`);
    },
  });

  const deleteTipoDocumento = useMutation({
    mutationFn: (id: number) => tiposDocumentosService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-documentos'] });
      queryClient.invalidateQueries({ queryKey: ['tipos-documentos-activos'] });
      queryClient.invalidateQueries({ queryKey: ['tipos-documentos-requeridos'] });
      toast.success('Tipo de documento eliminado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar tipo de documento: ${error.message}`);
    },
  });

  const activateTipoDocumento = useMutation({
    mutationFn: (id: number) => tiposDocumentosService.activate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-documentos'] });
      queryClient.invalidateQueries({ queryKey: ['tipos-documentos-activos'] });
      queryClient.invalidateQueries({ queryKey: ['tipos-documentos-requeridos'] });
      toast.success('Tipo de documento activado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al activar tipo de documento: ${error.message}`);
    },
  });

  return {
    // Data
    tiposDocumentos,
    tiposDocumentosActivos,
    tiposDocumentosRequeridos,
    
    // Loading states
    isLoading,
    loadingActivos,
    loadingRequeridos,
    
    // Error states
    error,
    errorActivos,
    errorRequeridos,
    
    // Actions
    createTipoDocumento: createTipoDocumento.mutate,
    updateTipoDocumento: updateTipoDocumento.mutate,
    deleteTipoDocumento: deleteTipoDocumento.mutate,
    activateTipoDocumento: activateTipoDocumento.mutate,
    
    // Mutation states
    isCreating: createTipoDocumento.isPending,
    isUpdating: updateTipoDocumento.isPending,
    isDeleting: deleteTipoDocumento.isPending,
    isActivating: activateTipoDocumento.isPending,
    
    // Refetch functions
    refetch,
    refetchActivos,
    refetchRequeridos,
  };
}; 
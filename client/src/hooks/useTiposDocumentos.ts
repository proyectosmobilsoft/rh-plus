import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from "sonner";
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
    queryFn: async () => {
      console.log('🔍 useTiposDocumentos - Ejecutando query para obtener todos los tipos de documentos...');
      const data = await tiposDocumentosService.getAll();
      console.log('🔍 useTiposDocumentos - Datos obtenidos:', data);
      return data;
    },
    staleTime: 0, // Siempre considerar como stale
    gcTime: 1000 * 60 * 1, // 1 minuto
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const {
    data: tiposDocumentosActivos = [],
    isLoading: loadingActivos,
    error: errorActivos,
    refetch: refetchActivos
  } = useQuery({
    queryKey: ['tipos-documentos-activos'],
    queryFn: async () => {
      console.log('🔍 useTiposDocumentos - Ejecutando query para obtener tipos de documentos activos...');
      const data = await tiposDocumentosService.getActive();
      console.log('🔍 useTiposDocumentos - Tipos activos obtenidos:', data);
      return data;
    },
    staleTime: 0, // Siempre considerar como stale
    gcTime: 1000 * 60 * 1, // 1 minuto
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });



  // Log cuando cambian los datos
  console.log('🔍 useTiposDocumentos - Estado actual:', {
    tiposDocumentos: tiposDocumentos.length,
    tiposDocumentosActivos: tiposDocumentosActivos.length,
    isLoading,
    loadingActivos,
    error: error?.message,
    errorActivos: errorActivos?.message
  });

  const createTipoDocumento = useMutation({
    mutationFn: (data: CreateTipoDocumentoData) => tiposDocumentosService.create(data),
    onSuccess: async () => {
      console.log('🔍 useTiposDocumentos - Tipo de documento creado exitosamente, invalidando cache...');
      // Pequeño delay para asegurar que la BD se actualice
      await new Promise(resolve => setTimeout(resolve, 100));
      // Invalidar todas las queries relacionadas con tipos de documentos
      queryClient.invalidateQueries({ queryKey: ['tipos-documentos'] });
      queryClient.invalidateQueries({ queryKey: ['tipos-documentos-activos'] });
      // Forzar refetch inmediato
      queryClient.refetchQueries({ queryKey: ['tipos-documentos'] });
      queryClient.refetchQueries({ queryKey: ['tipos-documentos-activos'] });
      console.log('🔍 useTiposDocumentos - Cache invalidado y refetch ejecutado');
      toast.success('Tipo de documento creado exitosamente');
    },
    onError: (error: Error) => {
      console.error('🔍 useTiposDocumentos - Error al crear tipo de documento:', error);
      toast.error(`Error al crear tipo de documento: ${error.message}`);
    },
  });

  const updateTipoDocumento = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTipoDocumentoData }) =>
      tiposDocumentosService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-documentos'] });
      queryClient.invalidateQueries({ queryKey: ['tipos-documentos-activos'] });
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
    
    // Loading states
    isLoading,
    loadingActivos,
    
    // Error states
    error,
    errorActivos,
    
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
    
    // Cache management
    invalidateCache: () => {
      console.log('🔍 useTiposDocumentos - Invalidando cache manualmente...');
      queryClient.invalidateQueries({ queryKey: ['tipos-documentos'] });
      queryClient.invalidateQueries({ queryKey: ['tipos-documentos-activos'] });
      queryClient.refetchQueries({ queryKey: ['tipos-documentos'] });
      queryClient.refetchQueries({ queryKey: ['tipos-documentos-activos'] });
    },
    
    // Force refresh
    forceRefresh: async () => {
      console.log('🔍 useTiposDocumentos - Forzando refresh inmediato...');
      await refetch();
      await refetchActivos();
    },
  };
}; 


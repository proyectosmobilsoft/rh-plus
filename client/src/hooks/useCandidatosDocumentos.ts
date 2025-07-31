import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { candidatosDocumentosService } from '@/services/candidatosDocumentosService';
import { 
  CandidatoDocumento, 
  CandidatoDocumentoConDetalles,
  CreateCandidatoDocumentoData,
  UpdateCandidatoDocumentoData 
} from '@/services/candidatosDocumentosService';

export const useCandidatosDocumentos = (candidatoId?: number) => {
  const queryClient = useQueryClient();

  // Obtener documentos de un candidato
  const getByCandidato = (id: number) => {
    return useQuery({
      queryKey: ['candidatos-documentos', id],
      queryFn: () => candidatosDocumentosService.getByCandidato(id),
      enabled: !!id,
    });
  };

  // Obtener documentos con detalles
  const getByCandidatoWithDetails = (id: number) => {
    return useQuery({
      queryKey: ['candidatos-documentos-detalles', id],
      queryFn: () => candidatosDocumentosService.getByCandidatoWithDetails(id),
      enabled: !!id,
    });
  };

  // Obtener documentos vencidos
  const getDocumentosVencidos = (diasAnticipacion: number = 30) => {
    return useQuery({
      queryKey: ['documentos-vencidos', diasAnticipacion],
      queryFn: () => candidatosDocumentosService.getDocumentosVencidos(diasAnticipacion),
    });
  };

  // Crear documento
  const createMutation = useMutation({
    mutationFn: (data: CreateCandidatoDocumentoData) => 
      candidatosDocumentosService.create(data),
    onSuccess: () => {
      if (candidatoId) {
        queryClient.invalidateQueries({ queryKey: ['candidatos-documentos', candidatoId] });
        queryClient.invalidateQueries({ queryKey: ['candidatos-documentos-detalles', candidatoId] });
      }
    },
  });

  // Actualizar documento
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCandidatoDocumentoData }) =>
      candidatosDocumentosService.update(id, data),
    onSuccess: () => {
      if (candidatoId) {
        queryClient.invalidateQueries({ queryKey: ['candidatos-documentos', candidatoId] });
        queryClient.invalidateQueries({ queryKey: ['candidatos-documentos-detalles', candidatoId] });
      }
    },
  });

  // Eliminar documento
  const deleteMutation = useMutation({
    mutationFn: (id: number) => candidatosDocumentosService.delete(id),
    onSuccess: () => {
      if (candidatoId) {
        queryClient.invalidateQueries({ queryKey: ['candidatos-documentos', candidatoId] });
        queryClient.invalidateQueries({ queryKey: ['candidatos-documentos-detalles', candidatoId] });
      }
    },
  });

  // Subir archivo
  const uploadFileMutation = useMutation({
    mutationFn: ({ file, candidatoId, tipoDocumentoId }: { 
      file: File; 
      candidatoId: number; 
      tipoDocumentoId: number 
    }) => candidatosDocumentosService.uploadFile(file, candidatoId, tipoDocumentoId),
  });

  // Eliminar archivo
  const deleteFileMutation = useMutation({
    mutationFn: (urlArchivo: string) => candidatosDocumentosService.deleteFile(urlArchivo),
  });

  return {
    // Queries
    getByCandidato,
    getByCandidatoWithDetails,
    getDocumentosVencidos,
    
    // Mutations
    createMutation,
    updateMutation,
    deleteMutation,
    uploadFileMutation,
    deleteFileMutation,
  };
}; 
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { tiposCandidatosDocumentosService } from '@/services/tiposCandidatosDocumentosService';
import { tiposCandidatosService } from '@/services/tiposCandidatosService';
import { tiposDocumentosService } from '@/services/tiposDocumentosService';
import { 
  TipoCandidatoDocumento, 
  TipoCandidatoDocumentoConDetalles,
  CreateTipoCandidatoDocumentoData,
  UpdateTipoCandidatoDocumentoData 
} from '@/types/maestro';

export const useTiposCandidatosDocumentos = () => {
  const queryClient = useQueryClient();

  // Obtener documentos por tipo de candidato
  const getByTipoCandidato = (tipoCandidatoId: number) => {
    return useQuery({
      queryKey: ['tipos-candidatos-documentos', tipoCandidatoId],
      queryFn: () => tiposCandidatosDocumentosService.getByTipoCandidato(tipoCandidatoId),
      enabled: !!tipoCandidatoId,
    });
  };

  // Obtener documentos con detalles por tipo de candidato
  const getByTipoCandidatoWithDetails = (tipoCandidatoId: number) => {
    return useQuery({
      queryKey: ['tipos-candidatos-documentos-detalles', tipoCandidatoId],
      queryFn: () => tiposCandidatosDocumentosService.getByTipoCandidatoWithDetails(tipoCandidatoId),
      enabled: !!tipoCandidatoId,
    });
  };

  // Obtener documentos requeridos para un tipo de candidato específico
  const getDocumentosRequeridos = (tipoCandidatoId: number) => {
    return useQuery({
      queryKey: ['documentos-requeridos', tipoCandidatoId],
      queryFn: async () => {
        const documentos = await tiposCandidatosDocumentosService.getByTipoCandidatoWithDetails(tipoCandidatoId);
        return documentos.filter(doc => doc.obligatorio).sort((a, b) => a.orden - b.orden);
      },
      enabled: !!tipoCandidatoId,
    });
  };

  // Crear relación
  const createMutation = useMutation({
    mutationFn: (data: CreateTipoCandidatoDocumentoData) => 
      tiposCandidatosDocumentosService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-candidatos-documentos'] });
      queryClient.invalidateQueries({ queryKey: ['documentos-requeridos'] });
    },
  });

  // Actualizar relación
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTipoCandidatoDocumentoData }) =>
      tiposCandidatosDocumentosService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-candidatos-documentos'] });
      queryClient.invalidateQueries({ queryKey: ['documentos-requeridos'] });
    },
  });

  // Eliminar relación
  const deleteMutation = useMutation({
    mutationFn: (id: number) => tiposCandidatosDocumentosService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-candidatos-documentos'] });
      queryClient.invalidateQueries({ queryKey: ['documentos-requeridos'] });
    },
  });

  // Actualizar documentos para un tipo de candidato (operación bulk)
  const updateDocumentosForTipoCandidato = useMutation({
    mutationFn: ({ tipoCandidatoId, documentos }: { 
      tipoCandidatoId: number; 
      documentos: Array<{ tipo_documento_id: number; obligatorio: boolean; orden: number }> 
    }) => tiposCandidatosDocumentosService.updateDocumentosForTipoCandidato(tipoCandidatoId, documentos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-candidatos-documentos'] });
      queryClient.invalidateQueries({ queryKey: ['documentos-requeridos'] });
    },
  });

  return {
    getByTipoCandidato,
    getByTipoCandidatoWithDetails,
    getDocumentosRequeridos,
    createMutation,
    updateMutation,
    deleteMutation,
    updateDocumentosForTipoCandidato,
  };
}; 
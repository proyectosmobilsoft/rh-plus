import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tiposCandidatosService } from '@/services/tiposCandidatosService';
import { TipoCandidato, CreateTipoCandidatoData, UpdateTipoCandidatoData } from '@/types/maestro';
import { useToast } from '@/hooks/use-toast';

export const useTiposCandidatosCrud = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para obtener todos los tipos de candidatos
  const { 
    data: tiposCandidatos = [], 
    isLoading,
    error 
  } = useQuery({
    queryKey: ['tipos-candidatos-all'],
    queryFn: tiposCandidatosService.getAll,
  });

  // Query para obtener solo los activos
  const { 
    data: tiposCandidatosActivos = [] 
  } = useQuery({
    queryKey: ['tipos-candidatos-activos'],
    queryFn: tiposCandidatosService.getActive,
  });

  // Mutation para crear
  const createMutation = useMutation({
    mutationFn: tiposCandidatosService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-candidatos-all'] });
      queryClient.invalidateQueries({ queryKey: ['tipos-candidatos-activos'] });
      toast({
        title: "Éxito",
        description: "Tipo de candidato creado correctamente",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al crear el tipo de candidato",
        variant: "destructive",
      });
    },
  });

  // Mutation para actualizar
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTipoCandidatoData }) => 
      tiposCandidatosService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-candidatos-all'] });
      queryClient.invalidateQueries({ queryKey: ['tipos-candidatos-activos'] });
      toast({
        title: "Éxito",
        description: "Tipo de candidato actualizado correctamente",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar el tipo de candidato",
        variant: "destructive",
      });
    },
  });

  // Mutation para eliminar
  const deleteMutation = useMutation({
    mutationFn: tiposCandidatosService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-candidatos-all'] });
      queryClient.invalidateQueries({ queryKey: ['tipos-candidatos-activos'] });
      toast({
        title: "Éxito",
        description: "Tipo de candidato eliminado correctamente",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al eliminar el tipo de candidato",
        variant: "destructive",
      });
    },
  });

  // Mutation para activar
  const activateMutation = useMutation({
    mutationFn: tiposCandidatosService.activate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-candidatos-all'] });
      queryClient.invalidateQueries({ queryKey: ['tipos-candidatos-activos'] });
      toast({
        title: "Éxito",
        description: "Tipo de candidato activado correctamente",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al activar el tipo de candidato",
        variant: "destructive",
      });
    },
  });

  return {
    tiposCandidatos,
    tiposCandidatosActivos,
    isLoading,
    error,
    createTipoCandidato: createMutation.mutateAsync,
    updateTipoCandidato: ({ id, data }: { id: number; data: UpdateTipoCandidatoData }) => 
      updateMutation.mutateAsync({ id, data }),
    deleteTipoCandidato: deleteMutation.mutateAsync,
    activateTipoCandidato: activateMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isActivating: activateMutation.isPending,
  };
};

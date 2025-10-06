import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { modulosService, Modulo, ModuloConPermisos, CreateModuloData, UpdateModuloData, CreateModuloPermisoData, UpdateModuloPermisoData } from '@/services/modulosService';
import { useLoading } from '@/contexts/LoadingContext';
import { toast } from 'sonner';

export const useModulos = () => {
  const queryClient = useQueryClient();
  const { startLoading, stopLoading } = useLoading();
  

  const modulosQuery = useQuery({
    queryKey: ['modulos'],
    queryFn: modulosService.getModulos,
  });

  const modulosConPermisosQuery = useQuery({
    queryKey: ['modulos-con-permisos'],
    queryFn: modulosService.getModulosConPermisos,
  });

  const createModuloMutation = useMutation({
    mutationFn: async (data: CreateModuloData) => {
      startLoading();
      try {
        return await modulosService.createModulo(data);
      } finally {
        stopLoading();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modulos'] });
      queryClient.invalidateQueries({ queryKey: ['modulos-con-permisos'] });
      toast.success('Módulo creado correctamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al crear el módulo');
    },
  });

  const updateModuloMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateModuloData }) => {
      startLoading();
      try {
        return await modulosService.updateModulo(id, data);
      } finally {
        stopLoading();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modulos'] });
      queryClient.invalidateQueries({ queryKey: ['modulos-con-permisos'] });
      toast.success('Módulo actualizado correctamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al actualizar el módulo');
    },
  });

  const activateModuloMutation = useMutation({
    mutationFn: async (id: number) => {
      startLoading();
      try {
        return await modulosService.activateModulo(id);
      } finally {
        stopLoading();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modulos'] });
      queryClient.invalidateQueries({ queryKey: ['modulos-con-permisos'] });
      toast.success('Módulo activado correctamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al activar el módulo');
    },
  });

  const deactivateModuloMutation = useMutation({
    mutationFn: async (id: number) => {
      startLoading();
      try {
        return await modulosService.deactivateModulo(id);
      } finally {
        stopLoading();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modulos'] });
      queryClient.invalidateQueries({ queryKey: ['modulos-con-permisos'] });
      toast.success('Módulo desactivado correctamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al desactivar el módulo');
    },
  });

  const deleteModuloMutation = useMutation({
    mutationFn: async (id: number) => {
      startLoading();
      try {
        return await modulosService.deleteModulo(id);
      } finally {
        stopLoading();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modulos'] });
      queryClient.invalidateQueries({ queryKey: ['modulos-con-permisos'] });
      toast.success('Módulo eliminado correctamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al eliminar el módulo');
    },
  });

  const createModuloPermisoMutation = useMutation({
    mutationFn: async (data: CreateModuloPermisoData) => {
      startLoading();
      try {
        return await modulosService.createModuloPermiso(data);
      } finally {
        stopLoading();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modulos-con-permisos'] });
      toast.success('Permiso creado correctamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al crear el permiso');
    },
  });

  const updateModuloPermisoMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateModuloPermisoData }) => {
      startLoading();
      try {
        return await modulosService.updateModuloPermiso(id, data);
      } finally {
        stopLoading();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modulos-con-permisos'] });
      toast.success('Permiso actualizado correctamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al actualizar el permiso');
    },
  });

  const deleteModuloPermisoMutation = useMutation({
    mutationFn: async (id: number) => {
      startLoading();
      try {
        return await modulosService.deleteModuloPermiso(id);
      } finally {
        stopLoading();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modulos-con-permisos'] });
      toast.success('Permiso eliminado correctamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al eliminar el permiso');
    },
  });

  return {
    // Queries
    modulos: modulosQuery.data || [],
    modulosConPermisos: modulosConPermisosQuery.data || [],
    isLoading: modulosQuery.isLoading || modulosConPermisosQuery.isLoading,
    isError: modulosQuery.isError || modulosConPermisosQuery.isError,
    refetch: () => {
      modulosQuery.refetch();
      modulosConPermisosQuery.refetch();
    },

    // Mutations
    createModulo: createModuloMutation.mutate,
    updateModulo: updateModuloMutation.mutate,
    activateModulo: activateModuloMutation.mutate,
    deactivateModulo: deactivateModuloMutation.mutate,
    deleteModulo: deleteModuloMutation.mutate,
    createModuloPermiso: createModuloPermisoMutation.mutate,
    updateModuloPermiso: updateModuloPermisoMutation.mutate,
    deleteModuloPermiso: deleteModuloPermisoMutation.mutate,

    // Mutation states
    isCreating: createModuloMutation.isPending,
    isUpdating: updateModuloMutation.isPending,
    isActivating: activateModuloMutation.isPending,
    isDeactivating: deactivateModuloMutation.isPending,
    isDeleting: deleteModuloMutation.isPending,
    isCreatingPermiso: createModuloPermisoMutation.isPending,
    isUpdatingPermiso: updateModuloPermisoMutation.isPending,
    isDeletingPermiso: deleteModuloPermisoMutation.isPending,
  };
};





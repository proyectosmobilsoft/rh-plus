import { useQuery } from '@tanstack/react-query';
import { analystsService } from '@/services/analystsService';

export function useAnalistas() {
  return useQuery({
    queryKey: ['analistas'],
    queryFn: async () => {
      try {
        const data = await analystsService.getAll();
        return data || [];
      } catch (error) {
        console.error('Error cargando analistas:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}


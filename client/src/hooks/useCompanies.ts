import { useQuery } from "@tanstack/react-query";
import { Company } from "@/types/company";
import { empresasService } from '@/services/empresasService';

export function useCompanies(entityType: 'empresa' | 'prestador') {
  return useQuery({
    queryKey: ['companies', entityType],
    queryFn: async () => {
      try {
        const allEmpresas = await empresasService.getAll();
        console.log('Empresas normalizadas:', allEmpresas);
        // Mostrar todas las empresas activas
        const filtradas = allEmpresas.filter((empresa: any) => empresa.active !== false);
        console.log('Empresas después del filtro:', filtradas);
        return filtradas;
      } catch (error) {
        console.error('Error fetching companies:', error);
        return [];
      }
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0
  });
}
import { useQuery } from "@tanstack/react-query";
import { Company } from "@/types/company";

export function useCompanies(entityType: 'empresa' | 'prestador') {
  return useQuery({
    queryKey: ['companies', entityType],
    queryFn: async () => {
      try {
        const response = await fetch('/api/empresas');
        if (!response.ok) {
          throw new Error('Error al obtener empresas');
        }
        const data = await response.json();
        
        // Mapear los datos recibidos al formato esperado por el frontend
        return data.map((empresa: any): Company => ({
          id: empresa.id.toString(),
          name: empresa.razon_social,
          nit: empresa.nit,
          address: empresa.direccion,
          city: empresa.ciudad,
          phone: empresa.telefono,
          email: empresa.email,
          contactPerson: empresa.representante_legal,
          contactPhone: empresa.telefono,
          contactEmail: empresa.email,
          sector: empresa.actividad_economica,
          employeeCount: empresa.numero_empleados,
          active: empresa.activo,
          createdAt: empresa.created_at,
          updatedAt: empresa.updated_at,
          tipo_documento: empresa.tipo_documento,
          regimen_tributario: empresa.regimen_tributario
        }));
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
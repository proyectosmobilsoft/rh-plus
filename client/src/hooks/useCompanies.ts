import { useQuery } from "@tanstack/react-query";
import { Company } from "@/types/company";

export function useCompanies(entityType: 'empresa' | 'prestador') {
  return useQuery({
    queryKey: ['companies', entityType],
    queryFn: async () => {
      const tipoEmpresa = entityType === 'empresa' ? 'afiliada' : 'prestador';
      
     /* const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('tipo_empresa', tipoEmpresa)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching companies:', error);
        throw error;
      }

      if (!data) return [];

      return data.map((empresa: CompanyRow): Company => ({
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
      }));*/
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0
  });
}
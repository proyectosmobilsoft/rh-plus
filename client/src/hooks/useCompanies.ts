import { useApiData } from '@/hooks/useApiData';

export function useCompanies(entityType: 'empresa' | 'prestador') {
  // Usa useApiData igual que en analistas
  const { data: empresas = [], isLoading, fetchData } = useApiData<any[]>(
    'empresas',
    [],
    { showSuccessToast: false }
  );

  // Mapea los datos para que coincidan con la tabla
  const empresasMapeadas = empresas.map((e: any) => ({
    id: e.id,
    razonSocial: e.razon_social || '',
    direccion: e.direccion || '',
    ciudad: e.ciudad || '',
    correoElectronico: e.email || '',
    telefono: e.telefono || '',
    representanteLegal: e.representante_legal || '',
    nit: e.nit || '',
    active: e.activo !== false
  }));

  console.log('Empresas mapeadas para la tabla:', empresasMapeadas);
  return { data: empresasMapeadas, isLoading, fetchData };
}
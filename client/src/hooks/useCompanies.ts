import { empresasService } from '@/services/empresasService';
import { useEffect, useState } from 'react';

export function useCompanies(entityType: 'empresa' | 'prestador') {
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await empresasService.getAll();
      setEmpresas(data || []);
    } catch (error) {
      // Puedes mostrar un toast de error si lo deseas
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
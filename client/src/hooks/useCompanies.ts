import { empresasService } from '@/services/empresasService';
import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabaseClient';

export function useCompanies(entityType: 'empresa' | 'prestador') {
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('🔄 Fetching empresas...');
      
      // Intentar obtener empresas directamente de Supabase primero
      const { data: directData, error: directError } = await supabase
        .from('empresas')
        .select('*')
        .order('razon_social');
      
      if (directError) {
        console.error('❌ Error directo de Supabase:', directError);
        throw new Error(`Error de Supabase: ${directError.message}`);
      }
      
      console.log('✅ Datos directos de Supabase:', directData);
      
      if (directData && directData.length > 0) {
        // Usar los datos directos de Supabase
        setEmpresas(directData);
        console.log('📊 Empresas cargadas directamente:', directData.length);
      } else {
        // Intentar con el servicio como fallback
        console.log('⚠️ No hay datos directos, intentando con servicio...');
        const serviceData = await empresasService.getAll();
        console.log('🔧 Datos del servicio:', serviceData);
        setEmpresas(serviceData || []);
      }
    } catch (error) {
      console.error('❌ Error fetching empresas:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const empresasMapeadas = empresas.map((e: any) => ({
    id: e.id,
    razonSocial: e.razon_social || e.razonSocial || '',
    direccion: e.direccion || '',
    ciudad: e.ciudad || '',
    correoElectronico: e.email || '',
    telefono: e.telefono || '',
    representanteLegal: e.representante_legal || e.representanteLegal || '',
    nit: e.nit || '',
    active: e.activo !== false
  }));

  console.log('🎯 Empresas mapeadas para la tabla:', empresasMapeadas);
  return { data: empresasMapeadas, isLoading, error, fetchData };
}
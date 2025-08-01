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
    razonSocial: e.razon_social || e.razonSocial || e.nombre || '',
    direccion: e.direccion || e.address || '',
    ciudad: e.ciudad || e.city || '',
    email: e.email || e.correoElectronico || '',
    telefono: e.telefono || e.phone || '',
    representanteLegal: e.representante_legal || e.representanteLegal || e.contactPerson || '',
    nit: e.nit || '',
    active: e.activo !== false && e.active !== false,
    // Campos nuevos de la BD
    actividad_economica_id: e.actividad_economica_id,
    regimen_tributario_id: e.regimen_tributario_id,
    numero_empleados: e.numero_empleados,
    tipo_empresa: e.tipo_empresa,
    tipo_documento: e.tipo_documento,
    documento_contrato: e.documento_contrato,
    documento_camara_comercio: e.documento_camara_comercio,
    documento_rut: e.documento_rut,
    // Campos de la BD con nombres originales
    razon_social: e.razon_social,
    representante_legal: e.representante_legal,
    created_at: e.created_at,
    updated_at: e.updated_at,
    activo: e.activo
  }));

  console.log('🎯 Empresas mapeadas para la tabla:', empresasMapeadas);
  return { data: empresasMapeadas, isLoading, error, fetchData };
}
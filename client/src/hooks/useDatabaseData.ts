import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabaseClient';

interface DatabaseDataHook {
  data: any[];
  isLoading: boolean;
  error: string | null;
}

export const useDatabaseData = (tableName: string): DatabaseDataHook => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tableName) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log(`🔄 Cargando datos de la tabla: ${tableName}`);
        
        // Determinar el campo de ordenamiento según la tabla
        const orderField = tableName === 'empresas' ? 'razon_social' : 'nombre';
        
        const { data: tableData, error: tableError } = await supabase
          .from(tableName)
          .select('*')
          .order(orderField);

        if (tableError) {
          console.error(`❌ Error al cargar ${tableName}:`, tableError);
          setError(`Error al cargar datos: ${tableError.message}`);
          return;
        }

        console.log(`✅ Datos cargados de ${tableName}:`, tableData?.length || 0);
        setData(tableData || []);
      } catch (err: any) {
        console.error(`❌ Error en useDatabaseData para ${tableName}:`, err);
        setError(`Error inesperado: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [tableName]);

  return { data, isLoading, error };
};

// Hook específico para departamentos
export const useDepartamentos = () => useDatabaseData('departamentos');

// Hook específico para ciudades
export const useCiudades = () => useDatabaseData('ciudades');

// Hook específico para empresas
export const useEmpresas = () => useDatabaseData('empresas');

// Hook específico para módulos
export const useModulos = () => useDatabaseData('gen_modulos');

// Hook específico para sucursales
export const useSucursales = () => useDatabaseData('gen_sucursales');

// Hook específico para centros de costo
export const useCentrosCosto = () => useDatabaseData('centros_costo');

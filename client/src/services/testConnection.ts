import { supabase } from './supabaseClient';

export const testConnection = async () => {
  try {
    console.log('🔍 Probando conexión a Supabase...');
    console.log('URL:', import.meta.env.VITE_SUPABASE_URL || 'https://vlmeifyldcgfmhppynir.supabase.co');
    
    // Probar conexión básica
    const { data, error } = await supabase
      .from('gen_usuarios')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Error de conexión:', error);
      throw error;
    }
    
    console.log('✅ Conexión exitosa a Supabase');
    console.log('📊 Datos recibidos:', data);
    
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error en test de conexión:', error);
    return { success: false, error };
  }
};

export const testAnalistas = async () => {
  try {
    console.log('🔍 Probando carga de analistas...');
    
    const { data, error } = await supabase
      .from('gen_usuarios')
      .select('*')
      .eq('rol_id', 4); // ID del rol de analista
    
    if (error) {
      console.error('❌ Error cargando analistas:', error);
      throw error;
    }
    
    console.log('✅ Analistas cargados exitosamente');
    console.log('📊 Cantidad de analistas:', data?.length || 0);
    console.log('📋 Datos de analistas:', data);
    
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error en test de analistas:', error);
    return { success: false, error };
  }
}; 


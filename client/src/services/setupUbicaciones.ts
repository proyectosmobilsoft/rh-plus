import { supabase } from './supabaseClient';

export const setupUbicaciones = async () => {
  try {
    console.log('🔧 Verificando tablas de ubicaciones...');

    // Verificar si las tablas existen intentando hacer una consulta
    const { data: paisesTest, error: paisesError } = await supabase
      .from('paises')
      .select('id')
      .limit(1);

    if (paisesError) {
      console.log('⚠️ Las tablas de ubicaciones no existen. Por favor, créelas manualmente en Supabase:');
      console.log('📋 Tablas necesarias:');
      console.log('   - paises (id, nombre, codigo_iso, created_at, updated_at)');
      console.log('   - departamentos (id, nombre, codigo_dane, pais_id, created_at, updated_at)');
      console.log('   - ciudades (id, nombre, codigo_dane, departamento_id, created_at, updated_at)');
      return { success: false, error: 'Tablas no encontradas' };
    }

    console.log('✅ Tablas de ubicaciones verificadas');

    // Insertar datos de ejemplo si las tablas están vacías
    await insertDatosEjemplo();

    console.log('✅ Configuración de ubicaciones completada');
    return { success: true };
  } catch (error) {
    console.error('❌ Error verificando ubicaciones:', error);
    return { success: false, error };
  }
};

const insertDatosEjemplo = async () => {
  try {
    // Verificar si ya hay datos
    const { data: paisesExistentes } = await supabase.from('paises').select('id').limit(1);
    if (paisesExistentes && paisesExistentes.length > 0) {
      console.log('📊 Datos de ejemplo ya existen');
      return;
    }

    console.log('📊 Insertando datos de ejemplo...');

    // Insertar países de ejemplo
    const paisesEjemplo = [
      { nombre: 'Colombia', codigo_iso: 'CO' },
      { nombre: 'México', codigo_iso: 'MX' },
      { nombre: 'Argentina', codigo_iso: 'AR' }
    ];

    const { data: paisesInsertados, error: paisesError } = await supabase
      .from('paises')
      .insert(paisesEjemplo)
      .select();

    if (paisesError) {
      console.error('Error insertando países:', paisesError);
      return;
    }

    console.log('✅ Países de ejemplo insertados');

    // Insertar departamentos de ejemplo para Colombia
    const colombiaId = paisesInsertados.find(p => p.nombre === 'Colombia')?.id;
    if (colombiaId) {
      const departamentosEjemplo = [
        { nombre: 'Antioquia', codigo_dane: '05', pais_id: colombiaId },
        { nombre: 'Cundinamarca', codigo_dane: '25', pais_id: colombiaId },
        { nombre: 'Valle del Cauca', codigo_dane: '76', pais_id: colombiaId }
      ];

      const { data: departamentosInsertados, error: departamentosError } = await supabase
        .from('departamentos')
        .insert(departamentosEjemplo)
        .select();

      if (departamentosError) {
        console.error('Error insertando departamentos:', departamentosError);
        return;
      }

      console.log('✅ Departamentos de ejemplo insertados');

      // Insertar ciudades de ejemplo
      const antioquiaId = departamentosInsertados.find(d => d.nombre === 'Antioquia')?.id;
      const cundinamarcaId = departamentosInsertados.find(d => d.nombre === 'Cundinamarca')?.id;

      if (antioquiaId && cundinamarcaId) {
        const ciudadesEjemplo = [
          { nombre: 'Medellín', codigo_dane: '05001', departamento_id: antioquiaId },
          { nombre: 'Bello', codigo_dane: '05088', departamento_id: antioquiaId },
          { nombre: 'Bogotá', codigo_dane: '25001', departamento_id: cundinamarcaId },
          { nombre: 'Soacha', codigo_dane: '25754', departamento_id: cundinamarcaId }
        ];

        const { error: ciudadesError } = await supabase
          .from('ciudades')
          .insert(ciudadesEjemplo);

        if (ciudadesError) {
          console.error('Error insertando ciudades:', ciudadesError);
          return;
        }

        console.log('✅ Ciudades de ejemplo insertadas');
      }
    }

    console.log('✅ Datos de ejemplo insertados correctamente');
  } catch (error) {
    console.error('Error insertando datos de ejemplo:', error);
  }
}; 


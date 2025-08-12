// Script de prueba para el sistema de asignación automática de analistas
// Ejecutar con: node scripts/test_asignacion_analistas.js

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase (ajustar según tu configuración)
const supabaseUrl = process.env.SUPABASE_URL || 'TU_SUPABASE_URL';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'TU_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAsignacionAnalistas() {
  try {
    console.log('🧪 Iniciando prueba de asignación automática de analistas...\n');

    // 1. Verificar que existe la columna analista_id
    console.log('1️⃣ Verificando columna analista_id...');
    const { data: columnInfo, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'hum_solicitudes')
      .eq('column_name', 'analista_id');

    if (columnError) {
      console.error('❌ Error verificando columna:', columnError);
      return;
    }

    if (columnInfo && columnInfo.length > 0) {
      console.log('✅ Columna analista_id existe:', columnInfo[0]);
    } else {
      console.log('❌ Columna analista_id no encontrada');
      return;
    }

    // 2. Verificar que hay analistas con prioridades configuradas
    console.log('\n2️⃣ Verificando analistas con prioridades...');
    const { data: analistas, error: analistasError } = await supabase
      .from('analista_prioridades')
      .select('*')
      .limit(5);

    if (analistasError) {
      console.error('❌ Error obteniendo analistas:', analistasError);
      return;
    }

    if (analistas && analistas.length > 0) {
      console.log(`✅ Se encontraron ${analistas.length} analistas con prioridades configuradas`);
      console.log('📋 Primer analista:', {
        usuario_id: analistas[0].usuario_id,
        nivel_prioridad_1: analistas[0].nivel_prioridad_1,
        nivel_prioridad_2: analistas[0].nivel_prioridad_2,
        nivel_prioridad_3: analistas[0].nivel_prioridad_3
      });
    } else {
      console.log('❌ No hay analistas con prioridades configuradas');
      return;
    }

    // 3. Verificar que hay empresas disponibles
    console.log('\n3️⃣ Verificando empresas disponibles...');
    const { data: empresas, error: empresasError } = await supabase
      .from('empresas')
      .select('id, razon_social')
      .limit(3);

    if (empresasError) {
      console.error('❌ Error obteniendo empresas:', empresasError);
      return;
    }

    if (empresas && empresas.length > 0) {
      console.log(`✅ Se encontraron ${empresas.length} empresas`);
      console.log('📋 Primera empresa:', empresas[0]);
    } else {
      console.log('❌ No hay empresas disponibles');
      return;
    }

    // 4. Crear una solicitud de prueba
    console.log('\n4️⃣ Creando solicitud de prueba...');
    const empresaId = empresas[0].id;
    const solicitudData = {
      empresa_id: empresaId,
      estado: 'PENDIENTE',
      fecha_solicitud: new Date().toISOString(),
      // Otros campos requeridos según tu esquema
    };

    const { data: solicitudCreada, error: createError } = await supabase
      .from('hum_solicitudes')
      .insert(solicitudData)
      .select('*')
      .single();

    if (createError) {
      console.error('❌ Error creando solicitud:', createError);
      return;
    }

    console.log('✅ Solicitud creada:', solicitudCreada);

    // 5. Verificar asignación automática de analista
    console.log('\n5️⃣ Verificando asignación automática...');
    if (solicitudCreada.analista_id) {
      console.log('✅ Analista asignado automáticamente:', solicitudCreada.analista_id);
      
      // Obtener información del analista
      const { data: analista, error: analistaError } = await supabase
        .from('gen_usuarios')
        .select('primer_nombre, primer_apellido, username')
        .eq('id', solicitudCreada.analista_id)
        .single();

      if (!analistaError && analista) {
        const nombreAnalista = `${analista.primer_nombre || ''} ${analista.primer_apellido || ''}`.trim() || analista.username;
        console.log('👤 Nombre del analista:', nombreAnalista);
      }
    } else {
      console.log('⚠️ No se asignó analista automáticamente');
    }

    // 6. Verificar cambio de estado
    console.log('\n6️⃣ Verificando cambio de estado...');
    if (solicitudCreada.estado) {
      if (solicitudCreada.estado === 'ASIGNADO') {
        console.log('✅ Estado de solicitud correctamente cambiado a: ASIGNADO');
      } else {
        console.log('⚠️ Estado de solicitud no es ASIGNADO:', solicitudCreada.estado);
      }
    } else {
      console.log('⚠️ No se asignó analista a la solicitud de prueba');
      console.log('📊 Estado de solicitud:', solicitudCreada.estado);
    }

    // 7. Verificar conteo real de solicitudes
    console.log('\n7️⃣ Verificando conteo real de solicitudes...');
    if (solicitudCreada.analista_id) {
      const { count: solicitudesReales, error: countError } = await supabase
        .from('hum_solicitudes')
        .select('*', { count: 'exact', head: true })
        .eq('analista_id', solicitudCreada.analista_id);

      if (countError) {
        console.error('❌ Error contando solicitudes:', countError);
      } else {
        console.log(`📊 Solicitudes reales asignadas al analista: ${solicitudesReales}`);
        
        // Comparar con el campo manual (debería ser diferente ahora)
        const { data: prioridad, error: prioridadError } = await supabase
          .from('analista_prioridades')
          .select('cantidad_solicitudes')
          .eq('usuario_id', solicitudCreada.analista_id)
          .eq('empresa_id', empresaId)
          .single();

        if (!prioridadError && prioridad) {
          console.log(`📊 Campo manual cantidad_solicitudes: ${prioridad.cantidad_solicitudes}`);
          if (prioridad.cantidad_solicitudes !== solicitudesReales) {
            console.log('⚠️ Diferencia detectada: El campo manual no refleja la realidad');
          }
        }
      }
    }

    // 8. Limpiar datos de prueba
    console.log('\n8️⃣ Limpiando datos de prueba...');
    const { error: deleteError } = await supabase
      .from('hum_solicitudes')
      .delete()
      .eq('id', solicitudCreada.id);

    if (deleteError) {
      console.error('❌ Error eliminando solicitud de prueba:', deleteError);
    } else {
      console.log('✅ Solicitud de prueba eliminada');
    }

    console.log('\n🎉 Prueba completada exitosamente!');

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

// Función para mostrar el estado actual de las tablas
async function mostrarEstadoTablas() {
  console.log('\n📊 Estado actual de las tablas...\n');

  try {
    // Contar solicitudes
    const { count: solicitudesCount } = await supabase
      .from('hum_solicitudes')
      .select('*', { count: 'exact', head: true });

    console.log(`📋 Solicitudes totales: ${solicitudesCount || 0}`);

    // Contar solicitudes con analista asignado
    const { count: solicitudesConAnalista } = await supabase
      .from('hum_solicitudes')
      .select('*', { count: 'exact', head: true })
      .not('analista_id', 'is', null);

    console.log(`👤 Solicitudes con analista asignado: ${solicitudesConAnalista || 0}`);

    // Contar analistas con prioridades
    const { count: analistasCount } = await supabase
      .from('analista_prioridades')
      .select('*', { count: 'exact', head: true });

    console.log(`🔧 Analistas con prioridades configuradas: ${analistasCount || 0}`);

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
  }
}

// Ejecutar pruebas
if (require.main === module) {
  testAsignacionAnalistas()
    .then(() => mostrarEstadoTablas())
    .then(() => {
      console.log('\n🏁 Script completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error fatal:', error);
      process.exit(1);
    });
}

module.exports = {
  testAsignacionAnalistas,
  mostrarEstadoTablas
};

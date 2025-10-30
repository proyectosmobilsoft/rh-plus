import { supabase } from './supabaseClient';
import { asociacionPrioridadService, AnalistaPrioridad } from './asociacionPrioridadService';
import { obtenerEmpresaSeleccionada } from '@/utils/empresaUtils';

export interface AnalistaAsignado {
  analista_id: number;
  analista_nombre: string;
  prioridad_nivel: number;
  prioridad_tipo: string;
  empresa_id?: number;
  sucursal_id?: number;
}

export const analistaAsignacionService = {
  /**
   * Asigna automáticamente un analista a una solicitud basándose en las prioridades configuradas
   * Reglas:
   *  - El analista debe tener una asociación (cualquier prioridad) con la misma empresa del usuario autenticado
   *  - Solo se consideran entradas cuya empresa coincida; prioridades de otras empresas no aplican
   */
  asignarAnalistaAutomatico: async (
    empresaId: number,
    sucursalId?: number
  ): Promise<AnalistaAsignado | null> => {
    try {
      console.log('🔍 Iniciando asignación automática de analista...');
      console.log('Empresa ID (solicitud):', empresaId);
      console.log('Sucursal ID:', sucursalId);

      // Empresa seleccionada por el usuario autenticado (con fallback al parámetro)
      const empresaSel = obtenerEmpresaSeleccionada();
      const empresaUsuarioId = empresaSel?.id || empresaId;
      console.log('Empresa del usuario autenticado usada para filtro:', empresaUsuarioId);

      // Obtener todos los analistas con sus prioridades
      const analistas = await asociacionPrioridadService.getAnalistasWithPriorities();
      
      if (!analistas || analistas.length === 0) {
        console.log('❌ No se encontraron analistas disponibles');
        return null;
      }

      console.log('📊 Analistas disponibles:', analistas.length);
      
      // Log detallado de todos los analistas antes del filtro
      console.log('🔍 Analistas antes del filtro:');
      analistas.forEach((analista, index) => {
        console.log(`  ${index + 1}. ${analista.usuario_nombre} (ID: ${analista.usuario_id}) - Empresa: ${analista.empresa_id} - Prioridades: ${analista.nivel_prioridad_1 || 'N/A'}, ${analista.nivel_prioridad_2 || 'N/A'}, ${analista.nivel_prioridad_3 || 'N/A'}`);
      });

      // Verificar que el analista cumple TODAS las prioridades configuradas, con énfasis en que
      // nivel_prioridad_1 debe coincidir exactamente ('cliente' con empresa, 'sucursal' con empresa+sucursal).
      const cumpleTodasLasPrioridades = (analista: AnalistaPrioridad): boolean => {
        const empresaIds = analista.empresa_ids || [];
        const sucursalIds = analista.sucursal_ids || [];
        const empresaIdLegacy = analista.empresa_id;
        const sucursalIdLegacy = analista.sucursal_id;

        const coincideEmpresa = empresaIds.includes(empresaId) || empresaIdLegacy === empresaId;
        const coincideSucursal = sucursalId
          ? (sucursalIds.includes(sucursalId) || sucursalIdLegacy === sucursalId)
          : false;

        // 1) Prioridad 1 es obligatoria y debe coincidir con la solicitud
        const p1 = analista.nivel_prioridad_1;
        if (p1 === 'cliente') {
          if (!coincideEmpresa) {
            console.log(`  ❌ P1 'cliente' NO coincide empresa para ${analista.usuario_nombre}`);
            return false;
          }
        } else if (p1 === 'sucursal') {
          if (!coincideEmpresa || !sucursalId || !coincideSucursal) {
            console.log(`  ❌ P1 'sucursal' NO coincide empresa/sucursal para ${analista.usuario_nombre}`);
            return false;
          }
        } else {
          // Si P1 no es 'cliente' ni 'sucursal', no consideramos elegible según la regla solicitada
          console.log(`  ❌ P1 '${p1}' no es aceptada para ${analista.usuario_nombre}`);
          return false;
        }

        // 2) Si existen P2/P3 configuradas, también deben cumplirse
        const revisarNivel = (nivel: number, tipo: string | null | undefined): boolean => {
          if (!tipo) return true; // sin restricción en ese nivel
          if (tipo === 'cliente') {
            return coincideEmpresa;
          }
          if (tipo === 'sucursal') {
            // Debe existir sucursal en la solicitud y coincidir con configuración
            return !!sucursalId && coincideEmpresa && coincideSucursal;
          }
          if (tipo === 'solicitudes') {
            // Aún exigimos que pertenezca a la empresa (regla de negocio existente)
            return coincideEmpresa;
          }
          return false;
        };

        const p2 = analista.nivel_prioridad_2;
        const p3 = analista.nivel_prioridad_3;
        const okP2 = revisarNivel(2, p2);
        if (!okP2) {
          console.log(`  ❌ P2 '${p2}' NO cumple para ${analista.usuario_nombre}`);
          return false;
        }
        const okP3 = revisarNivel(3, p3);
        if (!okP3) {
          console.log(`  ❌ P3 '${p3}' NO cumple para ${analista.usuario_nombre}`);
          return false;
        }

        console.log(`  ✅ ${analista.usuario_nombre} cumple TODAS las prioridades configuradas (P1='${p1}', P2='${p2}', P3='${p3}')`);
        return true;
      };

      // Filtrar analistas: deben pertenecer a la empresa de la solicitud y tener al menos una prioridad que aplique
      // IMPORTANTE: Se verifica en orden jerárquico (1, 2, 3) y se guarda el nivel que realmente aplica
      const analistasElegibles: Array<AnalistaPrioridad & { nivel_prioridad_aplicable?: number; tipo_prioridad_aplicable?: string }> = [];
      
      analistas.forEach(analista => {
        // Verificar si el analista tiene prioridades configuradas
        const tienePrioridades = analista.nivel_prioridad_1 || analista.nivel_prioridad_2 || analista.nivel_prioridad_3;
        if (!tienePrioridades) {
          console.log(`❌ Analista ${analista.usuario_nombre} (ID: ${analista.usuario_id}) no tiene prioridades configuradas`);
          return;
        }

      // Requiere que el analista cumpla TODAS sus prioridades configuradas
      if (cumpleTodasLasPrioridades(analista)) {
        analistasElegibles.push({
          ...analista,
          nivel_prioridad_aplicable: 1,
          tipo_prioridad_aplicable: analista.nivel_prioridad_1 || ''
        });
      } else {
        console.log(`❌ Analista ${analista.usuario_nombre} no es elegible - No cumple todas las prioridades`);
      }
      });

      if (analistasElegibles.length === 0) {
        console.log('❌ No se encontraron analistas elegibles para la solicitud');
        console.log(`   Empresa ID: ${empresaId}`);
        if (sucursalId) {
          console.log(`   Sucursal ID: ${sucursalId}`);
        }
        return null;
      }

      console.log('✅ Analistas elegibles encontrados:', analistasElegibles.length);
      
      // Log detallado de cada analista elegible
      analistasElegibles.forEach(analista => {
        const asignadas = analista.cantidad_asignadas ?? analista.cantidad_solicitudes ?? 0;
        const limite = analista.cantidad_configurada ?? 0;
        console.log(`📋 ${analista.usuario_nombre}: ${asignadas}/${limite} (${limite === 0 ? 'Sin límite' : `${limite - asignadas} disponibles`})`);
      });

      // Filtrar analistas que no hayan alcanzado su límite configurado
      const analistasDisponibles = analistasElegibles.filter(analista => {
        const asignadas = analista.cantidad_asignadas ?? analista.cantidad_solicitudes ?? 0;
        const limite = analista.cantidad_configurada ?? 0;
        
        // Si no tiene límite configurado (0), permitir asignación
        if (limite === 0) return true;
        
        // Verificar si aún puede recibir más solicitudes
        const puedeRecibir = asignadas < limite;
        
        console.log(`📊 Analista ${analista.usuario_nombre}: ${asignadas}/${limite} solicitudes ${puedeRecibir ? '✅' : '❌'}`);
        
        return puedeRecibir;
      });

      if (analistasDisponibles.length === 0) {
        console.log('❌ No hay analistas disponibles que no hayan alcanzado su límite');
        return null;
      }

      // Ordenar analistas disponibles por prioridad aplicable (1 > 2 > 3) y por menor cantidad de asignadas
      const analistasOrdenados = analistasDisponibles.sort((a, b) => {
        // Usar el nivel de prioridad que realmente aplica (no solo el primero configurado)
        const prioridadA = (a as any).nivel_prioridad_aplicable || 999;
        const prioridadB = (b as any).nivel_prioridad_aplicable || 999;
        
        // Primero ordenar por nivel de prioridad (1 es mejor que 2, 2 es mejor que 3)
        if (prioridadA !== prioridadB) return prioridadA - prioridadB;
        
        // Si tienen el mismo nivel de prioridad, ordenar por menor cantidad de solicitudes asignadas
        const asignadasA = a.cantidad_asignadas ?? a.cantidad_solicitudes ?? 0;
        const asignadasB = b.cantidad_asignadas ?? b.cantidad_solicitudes ?? 0;
        return asignadasA - asignadasB;
      });

      const mejorAnalista = analistasOrdenados[0];
      if (!mejorAnalista) return null;

      // Obtener el nivel y tipo de prioridad que realmente aplicó
      const prioridadNivel = (mejorAnalista as any).nivel_prioridad_aplicable || 0;
      const prioridadTipo = (mejorAnalista as any).tipo_prioridad_aplicable || '';

      const analistaAsignado: AnalistaAsignado = {
        analista_id: mejorAnalista.usuario_id,
        analista_nombre: mejorAnalista.usuario_nombre,
        prioridad_nivel: prioridadNivel,
        prioridad_tipo: prioridadTipo,
        empresa_id: mejorAnalista.empresa_id,
        sucursal_id: mejorAnalista.sucursal_id
      };

      console.log('✅ Analista asignado:', analistaAsignado);
      console.log(`📊 Detalles: ${mejorAnalista.usuario_nombre} - ${mejorAnalista.cantidad_asignadas}/${mejorAnalista.cantidad_configurada} solicitudes`);
      return analistaAsignado;

    } catch (error) {
      console.error('❌ Error en asignación automática de analista:', error);
      return null;
    }
  },

  /**
   * Obtiene el analista asignado a una solicitud específica
   */
  getAnalistaAsignado: async (solicitudId: number): Promise<AnalistaAsignado | null> => {
    try {
      const { data: solicitud, error } = await supabase
        .from('hum_solicitudes')
        .select('analista_id, empresas(id, razon_social)')
        .eq('id', solicitudId)
        .single();

      if (error || !solicitud?.analista_id) {
        return null;
      }

      const { data: analista, error: analistaError } = await supabase
        .from('gen_usuarios')
        .select('id, primer_nombre, primer_apellido, username')
        .eq('id', solicitud.analista_id)
        .single();

      if (analistaError || !analista) {
        return null;
      }

      return {
        analista_id: analista.id,
        analista_nombre: `${analista.primer_nombre || ''} ${analista.primer_apellido || ''}`.trim() || analista.username,
        prioridad_nivel: 0,
        prioridad_tipo: '',
        empresa_id: solicitud.empresas?.[0]?.id
      };

    } catch (error) {
      console.error('Error al obtener analista asignado:', error);
      return null;
    }
  }
};


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

      // Función auxiliar para verificar si una prioridad específica aplica a esta solicitud
      const verificarPrioridad = (
        analista: AnalistaPrioridad,
        nivel: number,
        tipoPrioridad: string | null
      ): boolean => {
        if (!tipoPrioridad) return false;

        switch (tipoPrioridad) {
          case 'cliente':
            // Verificar si la empresa de la solicitud está en los IDs del analista
            const empresaIds = analista.empresa_ids || [];
            const empresaIdLegacy = analista.empresa_id;
            const tieneEmpresa = empresaIds.includes(empresaId) || empresaIdLegacy === empresaId;
            if (!tieneEmpresa) {
              console.log(`  ❌ Analista ${analista.usuario_nombre} - Prioridad ${nivel}: 'cliente' - Empresa ${empresaId} NO coincide`);
              return false;
            }

            // Si el analista tiene sucursales configuradas, y la solicitud trae sucursal, validar también sucursal
            if (sucursalId) {
              const sucursalIdsCfg = analista.sucursal_ids || [];
              const sucursalIdLegacyCfg = analista.sucursal_id;
              const restringePorSucursal = (sucursalIdsCfg && sucursalIdsCfg.length > 0) || !!sucursalIdLegacyCfg;
              if (restringePorSucursal) {
                const coincideSucursal = sucursalIdsCfg.includes(sucursalId) || sucursalIdLegacyCfg === sucursalId;
                if (!coincideSucursal) {
                  console.log(`  ❌ Analista ${analista.usuario_nombre} - Prioridad ${nivel}: 'cliente' - Empresa coincide pero Sucursal ${sucursalId} NO está en su configuración`);
                  return false;
                }
              }
            }
            console.log(`  ✅ Analista ${analista.usuario_nombre} - Prioridad ${nivel}: 'cliente' - Empresa ${empresaId}${sucursalId ? ' y Sucursal ' + sucursalId : ''} aplican`);
            return true;

          case 'sucursal':
            // Verificar empresa Y sucursal
            const empresaIdsSuc = analista.empresa_ids || [];
            const empresaIdLegacySuc = analista.empresa_id;
            const tieneEmpresaSuc = empresaIdsSuc.includes(empresaId) || empresaIdLegacySuc === empresaId;
            
            if (!tieneEmpresaSuc) {
              console.log(`  ❌ Analista ${analista.usuario_nombre} - Prioridad ${nivel}: 'sucursal' - Empresa ${empresaId} NO coincide`);
              return false;
            }
            
            if (!sucursalId) {
              console.log(`  ❌ Analista ${analista.usuario_nombre} - Prioridad ${nivel}: 'sucursal' - La solicitud no tiene sucursal_id`);
              return false;
            }
            
            const sucursalIds = analista.sucursal_ids || [];
            const sucursalIdLegacy = analista.sucursal_id;
            const tieneSucursal = sucursalIds.includes(sucursalId) || sucursalIdLegacy === sucursalId;
            
            if (tieneSucursal) {
              console.log(`  ✅ Analista ${analista.usuario_nombre} - Prioridad ${nivel}: 'sucursal' - Empresa ${empresaId} y Sucursal ${sucursalId} coinciden`);
            } else {
              console.log(`  ❌ Analista ${analista.usuario_nombre} - Prioridad ${nivel}: 'sucursal' - Empresa ${empresaId} coincide pero Sucursal ${sucursalId} NO coincide con ${JSON.stringify(sucursalIds)} o ${sucursalIdLegacy}`);
            }
            return tieneSucursal;

          case 'solicitudes':
            // Verificar si la empresa de la solicitud está en los IDs del analista
            const empresaIdsSol = analista.empresa_ids || [];
            const empresaIdLegacySol = analista.empresa_id;
            const tieneEmpresaSol = empresaIdsSol.includes(empresaId) || empresaIdLegacySol === empresaId;
            if (!tieneEmpresaSol) {
              console.log(`  ❌ Analista ${analista.usuario_nombre} - Prioridad ${nivel}: 'solicitudes' - Empresa ${empresaId} NO coincide`);
              return false;
            }
            // Si el analista tiene sucursales configuradas, y la solicitud trae sucursal, validar también sucursal
            if (sucursalId) {
              const sucursalIdsCfg = analista.sucursal_ids || [];
              const sucursalIdLegacyCfg = analista.sucursal_id;
              const restringePorSucursal = (sucursalIdsCfg && sucursalIdsCfg.length > 0) || !!sucursalIdLegacyCfg;
              if (restringePorSucursal) {
                const coincideSucursal = sucursalIdsCfg.includes(sucursalId) || sucursalIdLegacyCfg === sucursalId;
                if (!coincideSucursal) {
                  console.log(`  ❌ Analista ${analista.usuario_nombre} - Prioridad ${nivel}: 'solicitudes' - Empresa coincide pero Sucursal ${sucursalId} NO está en su configuración`);
                  return false;
                }
              }
            }
            console.log(`  ✅ Analista ${analista.usuario_nombre} - Prioridad ${nivel}: 'solicitudes' - Empresa ${empresaId}${sucursalId ? ' y Sucursal ' + sucursalId : ''} aplican`);
            return true;

          default:
            console.log(`  ❌ Analista ${analista.usuario_nombre} - Prioridad ${nivel}: '${tipoPrioridad}' - Tipo de prioridad desconocido`);
            return false;
        }
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

        // Verificar prioridades en orden jerárquico (1, 2, 3)
        // Se toma la primera prioridad que aplica (empresa/sucursal coincide según tipo)
        let nivelAplicable: number | undefined;
        let tipoAplicable: string | undefined;

        if (analista.nivel_prioridad_1 && verificarPrioridad(analista, 1, analista.nivel_prioridad_1)) {
          nivelAplicable = 1;
          tipoAplicable = analista.nivel_prioridad_1;
        } else if (analista.nivel_prioridad_2 && verificarPrioridad(analista, 2, analista.nivel_prioridad_2)) {
          nivelAplicable = 2;
          tipoAplicable = analista.nivel_prioridad_2;
        } else if (analista.nivel_prioridad_3 && verificarPrioridad(analista, 3, analista.nivel_prioridad_3)) {
          nivelAplicable = 3;
          tipoAplicable = analista.nivel_prioridad_3;
        }

        if (nivelAplicable && tipoAplicable) {
          console.log(`✅ Analista ${analista.usuario_nombre} es elegible - Prioridad ${nivelAplicable} ('${tipoAplicable}') aplica`);
          analistasElegibles.push({
            ...analista,
            nivel_prioridad_aplicable: nivelAplicable,
            tipo_prioridad_aplicable: tipoAplicable
          });
        } else {
          console.log(`❌ Analista ${analista.usuario_nombre} no es elegible - Ninguna de sus prioridades aplica a esta solicitud`);
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


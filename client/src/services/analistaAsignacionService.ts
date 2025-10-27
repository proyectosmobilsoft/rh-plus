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

      // Filtrar analistas: deben pertenecer a la empresa de la solicitud
      const analistasElegibles = analistas.filter(analista => {
        // Verificar si el analista tiene prioridades configuradas
        const tienePrioridades = analista.nivel_prioridad_1 || analista.nivel_prioridad_2 || analista.nivel_prioridad_3;
        if (!tienePrioridades) return false;

        // Verificar si la empresa de la solicitud está en los IDs del analista (array o legacy)
        const empresaIds = analista.empresa_ids || [];
        const empresaIdLegacy = analista.empresa_id;
        const tieneEmpresa = empresaIds.includes(empresaId) || empresaIdLegacy === empresaId;
        
        if (!tieneEmpresa) {
          console.log(`❌ Analista ${analista.usuario_nombre} (ID: ${analista.usuario_id}) no tiene empresa ${empresaId} en su lista de empresas`);
          return false;
        }

        // Verificar tipos de prioridad válidos dentro de esta asociación
        const prioridades = [
          { nivel: 1, valor: analista.nivel_prioridad_1 },
          { nivel: 2, valor: analista.nivel_prioridad_2 },
          { nivel: 3, valor: analista.nivel_prioridad_3 }
        ];

        return prioridades.some(prioridad => {
          if (!prioridad.valor) return false;
          switch (prioridad.valor) {
            case 'cliente':
              // Empresa ya coincide
              return true;
            case 'sucursal':
              // Verificar si la sucursal de la solicitud está en los IDs del analista
              if (!sucursalId) return false;
              const sucursalIds = analista.sucursal_ids || [];
              const sucursalIdLegacy = analista.sucursal_id;
              return sucursalIds.includes(sucursalId) || sucursalIdLegacy === sucursalId;
            case 'solicitudes':
              // Debe ser de la misma empresa
              return true;
            default:
              return false;
          }
        });
      });

      if (analistasElegibles.length === 0) {
        console.log('❌ No se encontraron analistas elegibles para la empresa de la solicitud');
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

      // Ordenar analistas disponibles por prioridad y por menor cantidad de asignadas
      const analistasOrdenados = analistasDisponibles.sort((a, b) => {
        const prioridadA = a.nivel_prioridad_1 ? 1 : a.nivel_prioridad_2 ? 2 : a.nivel_prioridad_3 ? 3 : 4;
        const prioridadB = b.nivel_prioridad_1 ? 1 : b.nivel_prioridad_2 ? 2 : b.nivel_prioridad_3 ? 3 : 4;
        if (prioridadA !== prioridadB) return prioridadA - prioridadB;
        const asignadasA = a.cantidad_asignadas ?? a.cantidad_solicitudes ?? 0;
        const asignadasB = b.cantidad_asignadas ?? b.cantidad_solicitudes ?? 0;
        return asignadasA - asignadasB;
      });

      const mejorAnalista = analistasOrdenados[0];
      if (!mejorAnalista) return null;

      let prioridadNivel = 0;
      let prioridadTipo = '';
      if (mejorAnalista.nivel_prioridad_1) { prioridadNivel = 1; prioridadTipo = mejorAnalista.nivel_prioridad_1; }
      else if (mejorAnalista.nivel_prioridad_2) { prioridadNivel = 2; prioridadTipo = mejorAnalista.nivel_prioridad_2; }
      else if (mejorAnalista.nivel_prioridad_3) { prioridadNivel = 3; prioridadTipo = mejorAnalista.nivel_prioridad_3; }

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


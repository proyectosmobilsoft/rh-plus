import { supabase } from '@/services/supabaseClient';
import { analistaAsignacionService } from './analistaAsignacionService';
import { solicitudesLogsService, ACCIONES_SISTEMA, getUsuarioActual } from './solicitudesLogsService';
import { candidatosService, type Candidato } from './candidatosService';
import { toast } from 'sonner';

// Función helper para convertir null a undefined
const getUsuarioId = (): number | undefined => {
  const usuarioId = getUsuarioActual();
  return usuarioId || undefined;
};

export interface Solicitud {
  id?: number;
  empresa_id?: number;
  candidato_id?: number;
  plantilla_id?: number;
  estado: string;
  previous_state?: string; // Estado anterior antes de Stand By
  fecha_solicitud?: string;
  fecha_programada?: string;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  analista_id?: number; // Nuevo campo para el analista asignado
  // Nuevos campos para manejo de estructura JSON
  estructura_datos?: Record<string, any>; // Los datos del formulario en formato JSON
  plantilla_nombre?: string; // Nombre de la plantilla utilizada
  nombres?: string;
  apellidos?: string;
  tipo_documento?: string;
  numero_documento?: string;
  lugar_expedicion?: string;
  celular?: string;
  direccion?: string;
  empresa_usuaria?: string;
  ciudad_prestacion_servicio?: string;
  departamento_prestacion_servicio?: string;
  cargo?: string;
  salario?: string;
  ciudad?: string;
  fecha_ingreso?: string;
  tipo_contrato?: string;
  salario_basico?: string;
  auxilio_transporte?: string;
  viaje_rotativo?: boolean;
  vehiculo_transportel?: string;
  vehiculo_alimentacion?: string;
  salario_mensual?: string;
  jornada_laboral?: string;
  pagos_auxilios?: string;
  especificaciones_adicionales?: string;
  prioridad?: string;
  observaciones?: string;
  notas_internas?: string;
  centro_trabajo?: string;
  area_funcional?: string;
  tipo_examen?: string;
  examen_medico_realizar?: string;
  departamento?: string;
  cumple_horario?: boolean;
  especifique?: string;
  // Relaciones
  candidatos?: {
    id: number;
    primer_nombre: string;
    segundo_nombre?: string;
    primer_apellido: string;
    segundo_apellido?: string;
    tipo_documento: string;
    numero_documento: string;
    telefono?: string;
    direccion?: string;
    ciudad_id?: number;
    ciudades?: {
      nombre: string;
    };
  };
  empresas?: {
    id: number;
    razon_social: string;
    nit: string;
    ciudad?: string;
  };
  // Relación con analista asignado
  analista?: {
    id: number;
    nombre: string;
    email?: string;
  };
}

export const solicitudesService = {
  getAll: async (): Promise<Solicitud[]> => {
    try {
      const { data, error } = await supabase
        .from('hum_solicitudes')
        .select(`
          *,
          candidatos!candidato_id (
            primer_nombre,
            segundo_nombre,
            primer_apellido,
            segundo_apellido,
            tipo_documento,
            numero_documento,
            telefono,
            direccion,
            ciudad_id,
            ciudades!ciudad_id ( nombre )
          ),
          empresas!empresa_id (
            razon_social,
            nit,
            ciudad
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching solicitudes:', error);
        throw error;
      }

      // Obtener información de analistas por separado para evitar problemas de relación
      const solicitudesConAnalistas = await Promise.all(
        (data || []).map(async (solicitud) => {
          let analista = undefined;
          
          if (solicitud.analista_id) {
            try {
              const { data: analistaData, error: analistaError } = await supabase
                .from('gen_usuarios')
                .select('id, primer_nombre, primer_apellido, username, email')
                .eq('id', solicitud.analista_id)
                .single();
              
              if (!analistaError && analistaData) {
                analista = {
                  id: analistaData.id,
                  nombre: `${analistaData.primer_nombre || ''} ${analistaData.primer_apellido || ''}`.trim() || analistaData.username,
                  email: analistaData.email
                };
              }
            } catch (error) {
              console.warn(`Error obteniendo analista ${solicitud.analista_id}:`, error);
            }
          }

          return {
            ...solicitud,
            analista
          };
        })
      );

      return solicitudesConAnalistas;
    } catch (error) {
      console.error('Error in solicitudesService.getAll:', error);
      throw error;
    }
  },

  getByStatus: async (estado: string): Promise<Solicitud[]> => {
    try {
      const { data, error } = await supabase
        .from('hum_solicitudes')
        .select(`
          *,
          candidatos!candidato_id (
            primer_nombre,
            segundo_nombre,
            primer_apellido,
            segundo_apellido,
            tipo_documento,
            numero_documento,
            telefono,
            direccion,
            ciudad_id,
            ciudades!ciudad_id ( nombre )
          ),
          empresas!empresa_id (
            razon_social,
            nit,
            ciudad
          )
        `)
        .eq('estado', estado)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching solicitudes by status:', error);
        throw error;
      }

      // Obtener información de analistas por separado
      const solicitudesConAnalistas = await Promise.all(
        (data || []).map(async (solicitud) => {
          let analista = undefined;
          
          if (solicitud.analista_id) {
            try {
              const { data: analistaData, error: analistaError } = await supabase
                .from('gen_usuarios')
                .select('id, primer_nombre, primer_apellido, username, email')
                .eq('id', solicitud.analista_id)
                .single();
              
              if (!analistaError && analistaData) {
                analista = {
                  id: analistaData.id,
                  nombre: `${analistaData.primer_nombre || ''} ${analistaData.primer_apellido || ''}`.trim() || analistaData.username,
                  email: analistaData.email
                };
              }
            } catch (error) {
              console.warn(`Error obteniendo analista ${solicitud.analista_id}:`, error);
            }
          }

          return {
            ...solicitud,
            analista
          };
        })
      );

      return solicitudesConAnalistas;
    } catch (error) {
      console.error('Error in solicitudesService.getByStatus:', error);
      throw error;
    }
  },

  getById: async (id: number): Promise<Solicitud | null> => {
    try {
      const { data, error } = await supabase
        .from('hum_solicitudes')
        .select(`
          *,
          candidatos!candidato_id (
            primer_nombre,
            segundo_nombre,
            primer_apellido,
            segundo_apellido,
            tipo_documento,
            numero_documento,
            telefono,
            direccion,
            ciudad_id,
            ciudades!ciudad_id ( nombre )
          ),
          empresas!empresa_id (
            razon_social,
            nit,
            ciudad
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching solicitud by ID:', error);
        throw error;
      }

      if (!data) return null;

      // Obtener información del analista por separado
      let analista = undefined;
      
      if (data.analista_id) {
        try {
          const { data: analistaData, error: analistaError } = await supabase
            .from('gen_usuarios')
            .select('id, primer_nombre, primer_apellido, username, email')
            .eq('id', data.analista_id)
            .single();
          
          if (!analistaError && analistaData) {
            analista = {
              id: analistaData.id,
              nombre: `${analistaData.primer_nombre || ''} ${analistaData.primer_apellido || ''}`.trim() || analistaData.username,
              email: analistaData.email
            };
          }
        } catch (error) {
          console.warn(`Error obteniendo analista ${data.analista_id}:`, error);
        }
      }

      const solicitudTransformada = {
        ...data,
        analista
      };

      return solicitudTransformada;
    } catch (error) {
      console.error('Error in solicitudesService.getById:', error);
      throw error;
    }
  },

  create: async (solicitud: Omit<Solicitud, 'id' | 'created_at' | 'updated_at'>): Promise<Solicitud> => {
    try {
      console.log('🔍 Creando solicitud con asignación automática de analista...');
      
      // Asignar analista automáticamente si no se especifica uno
      let analistaId = solicitud.analista_id;
      let estadoFinal = solicitud.estado;
      
      if (!analistaId && solicitud.empresa_id) {
        console.log('🔄 Asignando analista automáticamente...');
        const analistaAsignado = await analistaAsignacionService.asignarAnalistaAutomatico(solicitud.empresa_id);
        
        if (analistaAsignado) {
          analistaId = analistaAsignado.analista_id;
          estadoFinal = 'ASIGNADO'; // Cambiar estado a ASIGNADO cuando se asigna analista
          console.log('✅ Analista asignado automáticamente:', analistaAsignado.analista_nombre);
          console.log('🔄 Estado de solicitud cambiado a: ASIGNADO');
        } else {
          console.log('⚠️ No se pudo asignar analista automáticamente');
        }
      }

      // Si viene estructura_datos, intentar crear candidato con documento y email (obligatorios)
      let candidatoIdFinal = solicitud.candidato_id;
      if (!candidatoIdFinal && solicitud.estructura_datos) {
        const d = solicitud.estructura_datos as Record<string, any>;
        const numeroDocumento = d.numero_documento || d.documento || d.cedula || d.identificacion;
        const email = d.email || d.correo_electronico || d.correo;
        if (numeroDocumento && email) {
          const candidatoPayload: Partial<Candidato> = {
            numero_documento: String(numeroDocumento),
            email: String(email)
          };
          // Opcionales si existen en el JSON
          const map: Record<string, keyof Candidato> = {
            tipo_documento: 'tipo_documento',
            primer_nombre: 'primer_nombre',
            segundo_nombre: 'segundo_nombre',
            primer_apellido: 'primer_apellido',
            segundo_apellido: 'segundo_apellido',
            telefono: 'telefono',
            direccion: 'direccion',
            ciudad: 'ciudad',
            empresa_id: 'empresa_id'
          };
          for (const key in map) {
            const v = (d as any)[key];
            if (v !== undefined && v !== null && v !== '') {
              (candidatoPayload as any)[map[key]] = v;
            }
          }
          try {
            const creado = await candidatosService.create(candidatoPayload);
            if (creado?.id) {
              candidatoIdFinal = creado.id;
              console.log('✅ Candidato creado desde solicitud. ID:', creado.id);
            }
          } catch (e: any) {
            // Si el usuario ya existe (username/email duplicado), informar y asociar candidato existente por documento
            if (e?.code === '23505' || String(e?.message || '').includes('usuarios_username_key')) {
              toast.info('Este candidato ya está registrado en el sistema', { position: 'bottom-right' });
              try {
                const existente = await candidatosService.getByDocumento(String(numeroDocumento));
                if (existente?.id) {
                  candidatoIdFinal = existente.id;
                  console.log('🔗 Asociado candidato existente ID:', existente.id);
                }
              } catch (lookupErr) {
                console.warn('No se pudo obtener candidato existente por documento:', lookupErr);
              }
            } else {
              console.warn('No se pudo crear candidato desde solicitud:', e);
            }
          }
        } else {
          console.warn('No se creó candidato: faltan documento y/o email en estructura_datos');
        }
      }

      // Preparar datos de la solicitud
      const solicitudData = {
        ...solicitud,
        candidato_id: candidatoIdFinal,
        analista_id: analistaId,
        estado: estadoFinal, // Usar el estado final (ASIGNADO si se asignó analista)
        fecha_solicitud: solicitud.fecha_solicitud || new Date().toISOString()
      };

      console.log('📝 Datos de la solicitud a crear:', solicitudData);

      const { data, error } = await supabase
        .from('hum_solicitudes')
        .insert(solicitudData)
        .select(`
          *,
          candidatos!candidato_id (
            primer_nombre,
            segundo_nombre,
            primer_apellido,
            segundo_apellido,
            tipo_documento,
            numero_documento,
            telefono,
            direccion,
            ciudad_id,
            ciudades!ciudad_id ( nombre )
          ),
          empresas!empresa_id (
            razon_social,
            nit,
            ciudad
          )
        `)
        .single();

      if (error) {
        console.error('Error creating solicitud:', error);
        throw error;
      }

      // Obtener información del analista por separado
      let analista = undefined;
      
      if (data.analista_id) {
        try {
          const { data: analistaData, error: analistaError } = await supabase
            .from('gen_usuarios')
            .select('id, primer_nombre, primer_apellido, username, email')
            .eq('id', data.analista_id)
            .single();
          
          if (!analistaError && analistaData) {
            analista = {
              id: analistaData.id,
              nombre: `${analistaData.primer_nombre || ''} ${analistaData.primer_apellido || ''}`.trim() || analistaData.username,
              email: analistaData.email
            };
          }
        } catch (error) {
          console.warn(`Error obteniendo analista ${data.analista_id}:`, error);
        }
      }

      const solicitudTransformada = {
        ...data,
        analista
      };

      // Crear log de la acción
      try {
        await solicitudesLogsService.crearLog({
          solicitud_id: solicitudTransformada.id!,
          usuario_id: getUsuarioId(),
          accion: ACCIONES_SISTEMA.CREAR_SOLICITUD,
          estado_nuevo: solicitudTransformada.estado,
          observacion: `Solicitud creada para empresa ${solicitud.empresa_id}`
        });

        // Si se asignó analista automáticamente, crear log adicional
        if (analistaId && !solicitud.analista_id) {
          await solicitudesLogsService.crearLog({
            solicitud_id: solicitudTransformada.id!,
            usuario_id: getUsuarioId(),
            accion: ACCIONES_SISTEMA.ASIGNAR_ANALISTA,
            estado_anterior: solicitud.estado,
            estado_nuevo: 'ASIGNADO',
            observacion: `Analista ${analista?.nombre || analistaId} asignado automáticamente`
          });
        }
      } catch (logError) {
        console.warn('No se pudo crear el log de la acción:', logError);
      }

      console.log('✅ Solicitud creada exitosamente con analista:', solicitudTransformada.analista?.nombre || 'Sin asignar');
      console.log('📊 Estado final de la solicitud:', solicitudTransformada.estado);
      return solicitudTransformada;
    } catch (error) {
      console.error('Error in solicitudesService.create:', error);
      throw error;
    }
  },

  update: async (id: number, updates: Partial<Solicitud>): Promise<Solicitud> => {
    try {
      // Obtener el estado anterior para el log
      const solicitudAnterior = await supabase
        .from('hum_solicitudes')
        .select('estado, observaciones')
        .eq('id', id)
        .single();

      const { data, error } = await supabase
        .from('hum_solicitudes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating solicitud:', error);
        throw error;
      }

      // Crear log de la acción
      try {
        await solicitudesLogsService.crearLog({
          solicitud_id: id,
          usuario_id: getUsuarioId(),
          accion: ACCIONES_SISTEMA.EDITAR_SOLICITUD,
          estado_anterior: solicitudAnterior.data?.estado,
          estado_nuevo: data.estado,
          observacion: 'Solicitud actualizada'
        });
      } catch (logError) {
        console.warn('No se pudo crear el log de la acción:', logError);
      }

      return data;
    } catch (error) {
      console.error('Error in solicitudesService.update:', error);
      throw error;
    }
  },

  delete: async (id: number): Promise<void> => {
    try {
      // Obtener información de la solicitud antes de eliminar para el log
      const solicitudAnterior = await supabase
        .from('hum_solicitudes')
        .select('estado, empresa_id, candidato_id')
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from('hum_solicitudes')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting solicitud:', error);
        throw error;
      }

      // Crear log de la acción
      try {
        await solicitudesLogsService.crearLog({
          solicitud_id: id,
          usuario_id: getUsuarioId(),
          accion: ACCIONES_SISTEMA.ELIMINAR_SOLICITUD,
          estado_anterior: solicitudAnterior.data?.estado,
          observacion: 'Solicitud eliminada del sistema'
        });
      } catch (logError) {
        console.warn('No se pudo crear el log de la acción:', logError);
      }
    } catch (error) {
      console.error('Error in solicitudesService.delete:', error);
      throw error;
    }
  },

  // Filtrar por prioridad
  getByPriority: async (prioridad: string): Promise<Solicitud[]> => {
    try {
      const { data, error } = await supabase
        .from('hum_solicitudes')
        .select('*')
        .eq('prioridad', prioridad)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching solicitudes by priority:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in solicitudesService.getByPriority:', error);
      throw error;
    }
  },

  // Buscar solicitudes
  search: async (searchTerm: string): Promise<Solicitud[]> => {
    try {
      const { data, error } = await supabase
        .from('hum_solicitudes')
        .select('*')
        .or(`nombres.ilike.%${searchTerm}%,apellidos.ilike.%${searchTerm}%,cargo.ilike.%${searchTerm}%,empresa_usuaria.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error searching solicitudes:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in solicitudesService.search:', error);
      throw error;
    }
  },

  // Obtener estadísticas
  getStatistics: async () => {
    try {
      const { data, error } = await supabase
        .from('hum_solicitudes')
        .select('estado, prioridad');

      if (error) {
        console.error('Error fetching solicitudes statistics:', error);
        throw error;
      }

      const total = data?.length || 0;
      const pendientes = data?.filter((s: any) => s.estado === 'PENDIENTE').length || 0;
      const aprobadas = data?.filter((s: any) => s.estado === 'APROBADA').length || 0;
      const rechazadas = data?.filter((s: any) => s.estado === 'RECHAZADA').length || 0;
      const altaPrioridad = data?.filter((s: any) => s.prioridad === 'alta').length || 0;

      return {
        total,
        pendientes,
        aprobadas,
        rechazadas,
        altaPrioridad,
        porcentajeAprobacion: total > 0 ? Math.round((aprobadas / total) * 100) : 0
      };
    } catch (error) {
      console.error('Error in solicitudesService.getStatistics:', error);
      throw error;
    }
  },

  // Crear solicitud con estructura de plantilla
  createWithTemplate: async (
    empresaId: number,
    plantillaId: number,
    plantillaNombre: string,
    estructuraDatos: Record<string, any>,
    candidatoId?: number
  ): Promise<Solicitud> => {
    try {
      console.log('🔍 Creando solicitud con plantilla y asignación automática de analista...');
      
      // Asignar analista automáticamente
      console.log('🔄 Asignando analista automáticamente...');
      const analistaAsignado = await analistaAsignacionService.asignarAnalistaAutomatico(empresaId);
      
      let analistaId: number | undefined;
      let estadoFinal = 'PENDIENTE'; // Estado por defecto
      
      if (analistaAsignado) {
        analistaId = analistaAsignado.analista_id;
        estadoFinal = 'ASIGNADO'; // Cambiar estado a ASIGNADO cuando se asigna analista
        console.log('✅ Analista asignado automáticamente:', analistaAsignado.analista_nombre);
        console.log('🔄 Estado de solicitud cambiado a: ASIGNADO');
      } else {
        console.log('⚠️ No se pudo asignar analista automáticamente');
        console.log('🔄 Estado de solicitud se mantiene como: PENDIENTE');
      }

      // Crear candidato si no viene candidatoId y el JSON trae documento y email
      let candidatoIdFinal = candidatoId;
      const d = estructuraDatos || {};
      if (!candidatoIdFinal && d) {
        const numeroDocumento = d.numero_documento || d.documento || d.cedula || d.identificacion;
        const email = d.email || d.correo_electronico || d.correo;
        if (numeroDocumento && email) {
          const candidatoPayload: Partial<Candidato> = {
            numero_documento: String(numeroDocumento),
            email: String(email)
          };
          const map: Record<string, keyof Candidato> = {
            tipo_documento: 'tipo_documento',
            primer_nombre: 'primer_nombre',
            segundo_nombre: 'segundo_nombre',
            primer_apellido: 'primer_apellido',
            segundo_apellido: 'segundo_apellido',
            telefono: 'telefono',
            direccion: 'direccion',
            ciudad: 'ciudad',
            empresa_id: 'empresa_id'
          };
          for (const key in map) {
            const v = (d as any)[key];
            if (v !== undefined && v !== null && v !== '') {
              (candidatoPayload as any)[map[key]] = v;
            }
          }
          try {
            const creado = await candidatosService.create(candidatoPayload);
            if (creado?.id) {
              candidatoIdFinal = creado.id;
              console.log('✅ Candidato creado desde solicitud (plantilla). ID:', creado.id);
            }
          } catch (e: any) {
            if (e?.code === '23505' || String(e?.message || '').includes('usuarios_username_key')) {
              toast.info('Este candidato ya está registrado en el sistema', { position: 'bottom-right' });
              try {
                const existente = await candidatosService.getByDocumento(String(numeroDocumento));
                if (existente?.id) {
                  candidatoIdFinal = existente.id;
                  console.log('🔗 Asociado candidato existente ID:', existente.id);
                }
              } catch (lookupErr) {
                console.warn('No se pudo obtener candidato existente por documento:', lookupErr);
              }
            } else {
              console.warn('No se pudo crear candidato desde solicitud (plantilla):', e);
            }
          }
        } else {
          console.warn('No se creó candidato (plantilla): faltan documento y/o email');
        }
      }

      const solicitudData = {
        empresa_id: empresaId,
        plantilla_id: plantillaId,
        plantilla_nombre: plantillaNombre,
        estructura_datos: estructuraDatos,
        candidato_id: candidatoIdFinal,
        analista_id: analistaId,
        estado: estadoFinal, // Usar el estado final (ASIGNADO si se asignó analista)
        fecha_solicitud: new Date().toISOString()
        // created_by se omite por ahora hasta implementar autenticación de usuarios
      };

      console.log('📝 Datos de la solicitud a crear:', solicitudData);

      const { data, error } = await supabase
        .from('hum_solicitudes')
        .insert(solicitudData)
        .select(`
          *,
          candidatos!candidato_id (
            primer_nombre,
            segundo_nombre,
            primer_apellido,
            segundo_apellido,
            tipo_documento,
            numero_documento,
            telefono,
            direccion,
            ciudad_id,
            ciudades!ciudad_id ( nombre )
          ),
          empresas!empresa_id (
            razon_social,
            nit,
            ciudad
          )
        `)
        .single();

      if (error) {
        console.error('Error creating solicitud with template:', error);
        throw error;
      }

      // Obtener información del analista por separado
      let analista = undefined;
      
      if (data.analista_id) {
        try {
          const { data: analistaData, error: analistaError } = await supabase
            .from('gen_usuarios')
            .select('id, primer_nombre, primer_apellido, username, email')
            .eq('id', data.analista_id)
            .single();
          
          if (!analistaError && analistaData) {
            analista = {
              id: analistaData.id,
              nombre: `${analistaData.primer_nombre || ''} ${analistaData.primer_apellido || ''}`.trim() || analistaData.username,
              email: analistaData.email
            };
          }
        } catch (error) {
          console.warn(`Error obteniendo analista ${data.analista_id}:`, error);
        }
      }

      const solicitudTransformada = {
        ...data,
        analista
      };

      // Crear log de la acción
      try {
        await solicitudesLogsService.crearLog({
          solicitud_id: solicitudTransformada.id!,
          usuario_id: getUsuarioId(),
          accion: ACCIONES_SISTEMA.CREAR_SOLICITUD,
          estado_nuevo: solicitudTransformada.estado,
          observacion: `Solicitud creada con plantilla "${plantillaNombre}" para empresa ${empresaId}`
        });

        // Si se asignó analista automáticamente, crear log adicional
        if (analistaId) {
          await solicitudesLogsService.crearLog({
            solicitud_id: solicitudTransformada.id!,
            usuario_id: getUsuarioId(),
            accion: ACCIONES_SISTEMA.ASIGNAR_ANALISTA,
            estado_anterior: 'PENDIENTE',
            estado_nuevo: 'ASIGNADO',
            observacion: `Analista ${analista?.nombre || analistaId} asignado automáticamente`
          });
        }
      } catch (logError) {
        console.warn('No se pudo crear el log de la acción:', logError);
      }

      console.log('✅ Solicitud con plantilla creada exitosamente con analista:', solicitudTransformada.analista?.nombre || 'Sin asignar');
      console.log('📊 Estado final de la solicitud:', solicitudTransformada.estado);
      return solicitudTransformada;
    } catch (error) {
      console.error('Error in solicitudesService.createWithTemplate:', error);
      throw error;
    }
  },

  // Actualizar solicitud con estructura de plantilla
  updateWithTemplate: async (
    id: number,
    estructuraDatos: Record<string, any>
  ): Promise<Solicitud> => {
    try {
      // Obtener el estado anterior para el log
      const solicitudAnterior = await supabase
        .from('hum_solicitudes')
        .select('estado, estructura_datos')
        .eq('id', id)
        .single();

      const { data, error } = await supabase
        .from('hum_solicitudes')
        .update({
          estructura_datos: estructuraDatos,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating solicitud with template:', error);
        throw error;
      }

      // Crear log de la acción
      try {
        await solicitudesLogsService.crearLog({
          solicitud_id: id,
          usuario_id: getUsuarioId(),
          accion: ACCIONES_SISTEMA.EDITAR_SOLICITUD,
          estado_anterior: solicitudAnterior.data?.estado,
          estado_nuevo: data.estado,
          observacion: 'Estructura de plantilla actualizada'
        });
      } catch (logError) {
        console.warn('No se pudo crear el log de la acción:', logError);
      }

      return data;
    } catch (error) {
      console.error('Error in solicitudesService.updateWithTemplate:', error);
      throw error;
    }
  },

  updateStatus: async function(id: number, newStatus: string, observacion?: string): Promise<boolean> {
    console.log('🔍 updateStatus llamado con:', id, newStatus, observacion);
    try {
      // Obtener el estado anterior para el log
      console.log('🔍 Obteniendo estado anterior...');
      const solicitudAnterior = await supabase
        .from('hum_solicitudes')
        .select('estado, observaciones')
        .eq('id', id)
        .single();

      console.log('🔍 Solicitud anterior:', solicitudAnterior);

      const updateData: any = { 
        estado: newStatus,
        updated_at: new Date().toISOString()
      };

      // Si se proporciona una observación, agregarla a la columna observaciones
      if (observacion) {
        updateData.observaciones = observacion;
      }

      console.log('🔍 Datos a actualizar:', updateData);
      console.log('🔍 Ejecutando update en base de datos...');

      const { error } = await supabase
        .from('hum_solicitudes')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Error updating solicitud status:', error);
        return false;
      }

      console.log('🔍 Update exitoso en base de datos');

      // Crear log de la acción
      try {
        console.log('🔍 Creando log de cambio de estado...');
        await solicitudesLogsService.crearLog({
          solicitud_id: id,
          usuario_id: getUsuarioId(),
          accion: ACCIONES_SISTEMA.CAMBIAR_ESTADO,
          estado_anterior: solicitudAnterior.data?.estado,
          estado_nuevo: newStatus,
          observacion: observacion || `Estado cambiado a ${newStatus}`
        });
        console.log('🔍 Log de cambio de estado creado exitosamente');
      } catch (logError) {
        console.warn('No se pudo crear el log de la acción:', logError);
      }

      console.log('🔍 updateStatus completado exitosamente');
      return true;
    } catch (error) {
      console.error('Error updating solicitud status:', error);
      return false;
    }
  },

  // Nuevos métodos para acciones específicas con logs automáticos

  // Poner en Stand By
  async putStandBy(id: number, observacion: string): Promise<boolean> {
    try {
      // Obtener el estado actual antes de cambiarlo
      const { data: solicitudActual, error: fetchError } = await supabase
        .from('hum_solicitudes')
        .select('estado')
        .eq('id', id)
        .single();

      if (fetchError || !solicitudActual) {
        console.error('Error obteniendo estado actual de la solicitud:', fetchError);
        return false;
      }

      const estadoAnterior = solicitudActual.estado;
      console.log('🔍 Estado anterior de la solicitud:', estadoAnterior);

      // Actualizar estado a STAND BY y guardar el estado anterior
      const { error } = await supabase
        .from('hum_solicitudes')
        .update({
          estado: 'STAND BY',
          previous_state: estadoAnterior,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Error putting solicitud in Stand By:', error);
        return false;
      }

      // Crear log de la acción
      try {
        await solicitudesLogsService.crearLog({
          solicitud_id: id,
          usuario_id: getUsuarioId(),
          accion: ACCIONES_SISTEMA.PUT_STANDBY,
          estado_anterior: estadoAnterior,
          estado_nuevo: 'STAND BY',
          observacion: `Solicitud puesta en Stand By: ${observacion}`
        });
      } catch (logError) {
        console.warn('No se pudo crear el log adicional de Stand By:', logError);
      }

      console.log('✅ Solicitud puesta en Stand By exitosamente. Estado anterior guardado:', estadoAnterior);
      return true;
    } catch (error) {
      console.error('Error putting solicitud in Stand By:', error);
      return false;
    }
  },

  // Reactivar solicitud
  async reactivate(id: number): Promise<boolean> {
    console.log('🔍 solicitudesService.reactivate llamado con ID:', id);
    try {
      // Obtener el estado anterior desde la base de datos
      const { data: solicitud, error: fetchError } = await supabase
        .from('hum_solicitudes')
        .select('previous_state, estado')
        .eq('id', id)
        .single();

      if (fetchError || !solicitud) {
        console.error('Error obteniendo solicitud para reactivar:', fetchError);
        return false;
      }

      if (!solicitud.previous_state) {
        console.error('No hay estado anterior guardado para reactivar la solicitud');
        return false;
      }

      const estadoAnterior = solicitud.previous_state;
      console.log('🔍 Estado anterior encontrado en BD:', estadoAnterior);

      // Actualizar estado al estado anterior y limpiar previous_state
      const { error } = await supabase
        .from('hum_solicitudes')
        .update({
          estado: estadoAnterior,
          previous_state: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Error reactivando solicitud:', error);
        return false;
      }

      // Crear log de la acción
      try {
        console.log('🔍 Creando log de reactivación...');
        await solicitudesLogsService.crearLog({
          solicitud_id: id,
          usuario_id: getUsuarioId(),
          accion: ACCIONES_SISTEMA.REACTIVAR,
          estado_anterior: 'STAND BY',
          estado_nuevo: estadoAnterior,
          observacion: `Solicitud reactivada al estado: ${estadoAnterior}`
        });
        console.log('🔍 Log de reactivación creado exitosamente');
      } catch (logError) {
        console.warn('No se pudo crear el log adicional de reactivación:', logError);
      }

      console.log('✅ Solicitud reactivada exitosamente al estado:', estadoAnterior);
      return true;
    } catch (error) {
      console.error('Error reactivating solicitud:', error);
      return false;
    }
  },

  // Contactar solicitud
  async contact(id: number, observacion?: string): Promise<boolean> {
    try {
      const success = await this.updateStatus(id, 'PENDIENTE DOCUMENTOS', observacion);
      
      if (success) {
        // Log adicional específico para contacto
        try {
          await solicitudesLogsService.crearLog({
            solicitud_id: id,
            usuario_id: getUsuarioId(),
            accion: ACCIONES_SISTEMA.CONTACTAR,
            estado_nuevo: 'PENDIENTE DOCUMENTOS',
            observacion: observacion || 'Solicitud contactada'
          });
        } catch (logError) {
          console.warn('No se pudo crear el log adicional de contacto:', logError);
        }
      }

      return success;
    } catch (error) {
      console.error('Error contacting solicitud:', error);
      return false;
    }
  },

  // Aprobar solicitud
  async approve(id: number, observacion?: string): Promise<boolean> {
    try {
      const success = await this.updateStatus(id, 'APROBADA', observacion);
      
      if (success) {
        return success;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Error approving solicitud:', error);
      return false;
    }
  },

  // Rechazar solicitud
  async reject(id: number, observacion?: string): Promise<boolean> {
    try {
      const success = await this.updateStatus(id, 'RECHAZADA', observacion);
      
      if (success) {
        // Log adicional específico para rechazo
        try {
          await solicitudesLogsService.crearLog({
            solicitud_id: id,
            usuario_id: getUsuarioId(),
            accion: ACCIONES_SISTEMA.RECHAZAR_SOLICITUD,
            estado_nuevo: 'RECHAZADA',
            observacion: observacion || 'Solicitud rechazada'
          });
        } catch (logError) {
          console.warn('No se pudo crear el log adicional de rechazo:', logError);
        }
      }

      return success;
    } catch (error) {
      console.error('Error rejecting solicitud:', error);
      return false;
    }
  },

  // Asignar analista manualmente
  async assignAnalyst(id: number, analistaId: number, observacion?: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('hum_solicitudes')
        .update({
          analista_id: analistaId,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Error assigning analyst:', error);
        return false;
      }

      // Crear log de la acción
      try {
        await solicitudesLogsService.crearLog({
          solicitud_id: id,
          usuario_id: getUsuarioId(),
          accion: ACCIONES_SISTEMA.ASIGNAR_ANALISTA,
          estado_nuevo: 'ASIGNADO',
          observacion: observacion || `Analista ${analistaId} asignado manualmente`
        });
      } catch (logError) {
        console.warn('No se pudo crear el log de la asignación:', logError);
      }

      return true;
    } catch (error) {
      console.error('Error in assignAnalyst:', error);
      return false;
    }
  },

  // Asignar prioridad
  async assignPriority(id: number, prioridad: string, observacion?: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('hum_solicitudes')
        .update({
          prioridad: prioridad,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Error assigning priority:', error);
        return false;
      }

      // Crear log de la acción
      try {
        await solicitudesLogsService.crearLog({
          solicitud_id: id,
          usuario_id: getUsuarioId(),
          accion: ACCIONES_SISTEMA.ASIGNAR_PRIORIDAD,
          observacion: observacion || `Prioridad asignada: ${prioridad}`
        });
      } catch (logError) {
        console.warn('No se pudo crear el log de la prioridad:', logError);
      }

      return true;
    } catch (error) {
      console.error('Error in assignPriority:', error);
      return false;
    }
  },

  // Actualizar observaciones
  async updateObservations(id: number, observaciones: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('hum_solicitudes')
        .update({
          observaciones: observaciones,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating observations:', error);
        return false;
      }

      // Crear log de la acción
      try {
        await solicitudesLogsService.crearLog({
          solicitud_id: id,
          usuario_id: getUsuarioId(),
          accion: ACCIONES_SISTEMA.ACTUALIZAR_OBSERVACIONES,
          observacion: `Observaciones actualizadas: ${observaciones}`
        });
      } catch (logError) {
        console.warn('No se pudo crear el log de las observaciones:', logError);
      }

      return true;
    } catch (error) {
      console.error('Error in updateObservations:', error);
      return false;
    }
  }
}; 
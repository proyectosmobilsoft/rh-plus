import { supabase } from './supabaseClient';
import { emailService } from './emailService';

export interface PrestadorInfo {
  id: number;
  nombre: string;
  direccion_laboratorio?: string;
  telefono?: string;
  contacto_laboratorio?: string;
  ciudad_nombre?: string;
  departamento_nombre?: string;
  horarios?: Array<{
    dia_semana: string;
    hora_inicio: string;
    hora_fin: string;
  }>;
}

export interface CandidatoInfo {
  id: number;
  nombres?: string;
  apellidos?: string;
  email?: string;
  ciudad_nombre?: string;
  departamento_nombre?: string;
}

// Función para convertir hora de 24h a 12h
const convertirA12Horas = (hora24: string): string => {
  const [hora, minutos] = hora24.split(':');
  const horaNum = parseInt(hora, 10);
  const minutosStr = minutos || '00';
  
  if (horaNum === 0) {
    return `12:${minutosStr} AM`;
  } else if (horaNum < 12) {
    return `${horaNum}:${minutosStr} AM`;
  } else if (horaNum === 12) {
    return `12:${minutosStr} PM`;
  } else {
    return `${horaNum - 12}:${minutosStr} PM`;
  }
};

// Función para formatear nombre del día
const formatearDiaSemana = (dia: string): string => {
  const diasMap: Record<string, string> = {
    'lunes': 'Lunes',
    'martes': 'Martes',
    'miercoles': 'Miércoles',
    'jueves': 'Jueves',
    'viernes': 'Viernes',
    'sabado': 'Sábado',
    'domingo': 'Domingo'
  };
  return diasMap[dia.toLowerCase()] || dia;
};

export const validacionDocumentosService = {
  // Obtener información del candidato de una solicitud
  async getCandidatoInfo(solicitudId: number): Promise<CandidatoInfo | null> {
    const { data, error } = await supabase
      .from('hum_solicitudes')
      .select(`
        candidatos:candidato_id(
          id,
          primer_nombre,
          segundo_nombre,
          primer_apellido,
          segundo_apellido,
          email,
          ciudades:ciudad_id(nombre, departamentos:departamento_id(nombre))
        )
      `)
      .eq('id', solicitudId)
      .single();

    if (error) {
      console.error('Error obteniendo información del candidato:', error);
      return null;
    }

    if (!data?.candidatos) return null;

    // Concatenar nombres y apellidos
    const nombres = [data.candidatos.primer_nombre, data.candidatos.segundo_nombre]
      .filter(Boolean)
      .join(' ');
    const apellidos = [data.candidatos.primer_apellido, data.candidatos.segundo_apellido]
      .filter(Boolean)
      .join(' ');

    return {
      id: data.candidatos.id,
      nombres,
      apellidos,
      email: data.candidatos.email,
      ciudad_nombre: data.candidatos.ciudades?.nombre,
      departamento_nombre: data.candidatos.ciudades?.departamentos?.nombre,
    };
  },

  // Obtener prestadores por ciudad
  async getPrestadoresByCiudad(ciudadId: number): Promise<PrestadorInfo[]> {
    // Primero obtener las sucursales que están en la ciudad especificada
    const { data: sucursales, error: sucursalesError } = await supabase
      .from('gen_sucursales')
      .select('id')
      .eq('ciudad_id', ciudadId)
      .eq('activo', true);

    if (sucursalesError) {
      console.error('Error obteniendo sucursales por ciudad:', sucursalesError);
      return [];
    }

    if (!sucursales || sucursales.length === 0) {
      return [];
    }

    // Obtener los IDs de las sucursales
    const sucursalIds = sucursales.map(s => s.id);

    // Ahora buscar prestadores que estén asociados a esas sucursales
    const { data, error } = await supabase
      .from('prestadores')
      .select(`
        id,
        nombre_laboratorio,
        direccion_laboratorio,
        telefono,
        contacto_laboratorio,
        sucursales:sucursal_id(
          nombre,
          ciudades:ciudad_id(nombre, departamentos:departamento_id(nombre))
        )
      `)
      .eq('activo', true)
      .in('sucursal_id', sucursalIds);

    if (error) {
      console.error('Error obteniendo prestadores por sucursales:', error);
      return [];
    }

    // Obtener horarios para cada prestador
    const prestadoresConHorarios = await Promise.all(
      (data || []).map(async (prestador) => {
        // Obtener horarios del prestador
        const { data: horarios, error: horariosError } = await supabase
          .from('prestadores_horarios')
          .select('dia_semana, hora_inicio, hora_fin')
          .eq('prestador_id', prestador.id)
          .order('dia_semana');

        if (horariosError) {
          console.warn(`Error obteniendo horarios para prestador ${prestador.id}:`, horariosError);
        }

        return {
          id: prestador.id,
          nombre: prestador.nombre_laboratorio || prestador.sucursales?.nombre || 'Sin nombre',
          direccion_laboratorio: prestador.direccion_laboratorio,
          telefono: prestador.telefono,
          contacto_laboratorio: prestador.contacto_laboratorio,
          ciudad_nombre: prestador.sucursales?.ciudades?.nombre,
          departamento_nombre: prestador.sucursales?.ciudades?.departamentos?.nombre,
          horarios: horarios || [],
        };
      })
    );

    return prestadoresConHorarios;
  },

  // Obtener ciudades que tienen prestadores registrados
  async getCiudadesDisponibles(): Promise<Array<{id: number, nombre: string, departamento: string}>> {
    try {
      // Primero obtener todas las sucursales activas con sus ciudades
      const { data: sucursales, error: sucursalesError } = await supabase
        .from('gen_sucursales')
        .select(`
          id,
          ciudades:ciudad_id(
            id,
            nombre,
            departamentos:departamento_id(nombre)
          )
        `)
        .eq('activo', true);

      if (sucursalesError) {
        console.error('Error obteniendo sucursales:', sucursalesError);
        return [];
      }

      if (!sucursales || sucursales.length === 0) {
        return [];
      }

      // Obtener los IDs de las sucursales
      const sucursalIds = sucursales.map(s => s.id);

      // Buscar prestadores que estén asociados a esas sucursales
      const { data: prestadores, error: prestadoresError } = await supabase
        .from('prestadores')
        .select(`
          sucursal_id,
          sucursales:sucursal_id(
            ciudades:ciudad_id(
              id,
              nombre,
              departamentos:departamento_id(nombre)
            )
          )
        `)
        .eq('activo', true)
        .in('sucursal_id', sucursalIds)
        .not('sucursal_id', 'is', null);

      if (prestadoresError) {
        console.error('Error obteniendo prestadores:', prestadoresError);
        return [];
      }

      if (!prestadores || prestadores.length === 0) {
        return [];
      }

      // Crear un mapa de ciudades únicas que tienen prestadores
      const ciudadesConPrestadores = new Map<number, {id: number, nombre: string, departamento: string}>();

      prestadores.forEach(prestador => {
        const ciudad = prestador.sucursales?.ciudades;
        if (ciudad && ciudad.id) {
          ciudadesConPrestadores.set(ciudad.id, {
            id: ciudad.id,
            nombre: ciudad.nombre,
            departamento: ciudad.departamentos?.nombre || 'Sin departamento'
          });
        }
      });

      // Convertir el mapa a array y ordenar por nombre
      return Array.from(ciudadesConPrestadores.values()).sort((a, b) => 
        a.nombre.localeCompare(b.nombre)
      );

    } catch (error) {
      console.error('Error obteniendo ciudades con prestadores:', error);
      return [];
    }
  },

  // Enviar email con información de prestadores
  async enviarEmailPrestadores(
    candidato: CandidatoInfo, 
    prestadores: PrestadorInfo[], 
    ciudadSeleccionada?: string,
    esCiudadAlternativa: boolean = false
  ): Promise<boolean> {
    if (!candidato.email) {
      throw new Error('El candidato no tiene email registrado');
    }

    if (prestadores.length === 0) {
      throw new Error('No hay prestadores disponibles para la ciudad seleccionada');
    }

    const ciudadInfo = ciudadSeleccionada || `${candidato.ciudad_nombre}, ${candidato.departamento_nombre}`;
    
    // Generar HTML del email
    const prestadoresHtml = prestadores.map(prestador => {
      // Generar HTML de horarios si existen
      const horariosHtml = prestador.horarios && prestador.horarios.length > 0 
        ? `
          <div style="margin-top: 15px;">
            <h4 style="color: #374151; margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">🕒 Horarios de Atención:</h4>
            <div style="background-color: #f3f4f6; padding: 10px; border-radius: 6px;">
              ${prestador.horarios.map(horario => `
                <div style="display: flex; justify-content: space-between; margin: 3px 0; font-size: 13px;">
                  <span style="color: #6b7280; font-weight: 500;">${formatearDiaSemana(horario.dia_semana)}:</span>
                  <span style="color: #374151;">${convertirA12Horas(horario.hora_inicio)} - ${convertirA12Horas(horario.hora_fin)}</span>
                </div>
              `).join('')}
            </div>
          </div>
        `
        : '';

      return `
        <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f9f9f9;">
          <h3 style="color: #2563eb; margin: 0 0 10px 0; font-size: 18px;">${prestador.nombre}</h3>
          ${prestador.direccion_laboratorio ? `<p style="margin: 5px 0; color: #374151;"><strong>Dirección:</strong> ${prestador.direccion_laboratorio}</p>` : ''}
          ${prestador.telefono ? `<p style="margin: 5px 0; color: #374151;"><strong>Teléfono:</strong> ${prestador.telefono}</p>` : ''}
          ${prestador.contacto_laboratorio ? `<p style="margin: 5px 0; color: #374151;"><strong>Contacto:</strong> ${prestador.contacto_laboratorio}</p>` : ''}
          ${prestador.ciudad_nombre ? `<p style="margin: 5px 0; color: #6b7280; font-size: 14px;"><strong>📍 Ubicación:</strong> ${prestador.ciudad_nombre}${prestador.departamento_nombre ? `, ${prestador.departamento_nombre}` : ''}</p>` : ''}
          ${horariosHtml}
        </div>
      `;
    }).join('');

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Información de Exámenes Médicos</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Información de Exámenes Médicos</h1>
        </div>
        
        <div style="background-color: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px; margin-bottom: 20px;">
            Hola <strong>${candidato.nombres} ${candidato.apellidos}</strong>,
          </p>
          
          <p style="font-size: 16px; margin-bottom: 20px;">
            Sus documentos han sido validados exitosamente. A continuación encontrará la información de las entidades médicas 
            disponibles en <strong>${ciudadInfo}</strong> para realizar sus exámenes médicos:
          </p>
          
          ${esCiudadAlternativa ? `
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-bottom: 20px;">
            <p style="margin: 0; color: #92400e; font-weight: 500;">
              <strong>ℹ️ Información importante:</strong> No se encontraron prestadores médicos disponibles en su ciudad de residencia 
              (${candidato.ciudad_nombre}, ${candidato.departamento_nombre}), por lo que se han seleccionado prestadores en 
              <strong>${prestadores.length > 0 ? `${prestadores[0].ciudad_nombre}, ${prestadores[0].departamento_nombre}` : ciudadInfo}</strong> para que pueda realizar sus exámenes médicos.
            </p>
          </div>
          ` : ''}
          
          <div style="margin: 30px 0;">
            ${prestadoresHtml}
          </div>
          
          <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb; margin-top: 30px;">
            <h3 style="color: #2563eb; margin: 0 0 10px 0;">Instrucciones:</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li>Contacte directamente con la entidad médica de su preferencia</li>
              <li>Programe su cita para los exámenes médicos</li>
              <li>Presente su documento de identidad al momento de la cita</li>
              <li>Conserve los resultados de los exámenes para su entrega</li>
            </ul>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 30px; text-align: center;">
            Si tiene alguna pregunta, no dude en contactarnos.
          </p>
        </div>
      </body>
      </html>
    `;

    try {
      await emailService.sendEmail({
        to: candidato.email,
        subject: 'Información de Exámenes Médicos - Documentos Validados',
        html: emailHtml
      });
      
      return true;
    } catch (error) {
      console.error('Error enviando email:', error);
      throw error;
    }
  },

  // Validar documentos y enviar email
  async validarDocumentosYEnviarEmail(
    solicitudId: number, 
    observacion: string, 
    ciudadId?: number
  ): Promise<{success: boolean, message: string}> {
    try {
      // 1. Obtener información del candidato
      const candidato = await this.getCandidatoInfo(solicitudId);
      if (!candidato) {
        throw new Error('No se pudo obtener la información del candidato');
      }

      // 2. Determinar la ciudad a usar
      let ciudadIdParaBuscar = ciudadId;
      if (!ciudadIdParaBuscar && candidato.ciudad_nombre) {
        // Buscar el ID de la ciudad del candidato
        const { data: ciudadData } = await supabase
          .from('ciudades')
          .select('id')
          .eq('nombre', candidato.ciudad_nombre)
          .single();
        
        ciudadIdParaBuscar = ciudadData?.id;
      }

      if (!ciudadIdParaBuscar) {
        throw new Error('No se pudo determinar la ciudad del candidato');
      }

      // 3. Buscar prestadores en esa ciudad
      const prestadores = await this.getPrestadoresByCiudad(ciudadIdParaBuscar);

      if (prestadores.length === 0) {
        return {
          success: false,
          message: 'No hay prestadores disponibles en la ciudad del candidato. Debe seleccionar otra ciudad.'
        };
      }

      // 4. Enviar email con información de prestadores
      const esCiudadAlternativa = ciudadId !== undefined && candidato.ciudad_nombre && 
        prestadores.length > 0 && prestadores[0].ciudad_nombre !== candidato.ciudad_nombre;
      
      await this.enviarEmailPrestadores(candidato, prestadores, undefined, esCiudadAlternativa);

      // 5. Solo después del envío exitoso del email, actualizar estado de la solicitud
      const { error: updateError } = await supabase
        .from('hum_solicitudes')
        .update({ 
          estado: 'citado examenes',
          updated_at: new Date().toISOString()
        })
        .eq('id', solicitudId);

      if (updateError) {
        throw new Error('Error actualizando el estado de la solicitud');
      }

      // 6. Registrar log
      const { data: { user } } = await supabase.auth.getUser();
      const { error: logError } = await supabase
        .from('hum_solicitudes_logs')
        .insert({
          solicitud_id: solicitudId,
          accion: 'validar_documentos',
          observacion: observacion,
          usuario_id: user?.id || null, // Usar null si no hay usuario autenticado
          estado_nuevo: 'citado examenes'
        });

      if (logError) {
        console.warn('Error registrando log:', logError);
      }

      return {
        success: true,
        message: `Documentos validados exitosamente. Se envió un email a ${candidato.email} con información de ${prestadores.length} prestadores médicos.`
      };

    } catch (error) {
      console.error('Error en validacionDocumentosYEnviarEmail:', error);
      throw error;
    }
  }
};

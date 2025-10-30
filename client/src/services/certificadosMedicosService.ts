import { supabase } from "@/services/supabaseClient";

export interface CertificadoMedico {
  id?: number;
  solicitud_id: number;
  candidato_id: number;
  restriccion_macro?: string;
  resumen_restriccion?: string;
  remision: boolean;
  requiere_medicacion: boolean;
  elementos_proteccion_personal?: string;
  recomendaciones_generales?: string;
  observaciones?: string;
  concepto_medico: 'apto' | 'no-apto' | 'apto-con-restricciones';
  created_at?: string;
  created_by?: number;
  updated_at?: string;
}

export interface CertificadoMedicoFormData {
  solicitud_id: number;
  candidato_id: number;
  restriccion_macro?: string;
  resumen_restriccion?: string;
  remision?: boolean;
  requiere_medicacion?: boolean;
  elementos_proteccion_personal?: string;
  recomendaciones_generales?: string;
  observaciones?: string;
  concepto_medico: 'apto' | 'no-apto' | 'apto-con-restricciones';
}

export const certificadosMedicosService = {
  // Crear un nuevo certificado médico
  create: async (data: CertificadoMedicoFormData): Promise<CertificadoMedico> => {
    try {
      const { data: certificado, error } = await supabase
        .from('certificados_medicos')
        .insert([data])
        .select()
        .single();

      if (error) {
        console.error('Error creating certificado médico:', error);
        throw error;
      }

      return certificado;
    } catch (error) {
      console.error('Error in certificadosMedicosService.create:', error);
      throw error;
    }
  },

  // Obtener certificado médico por ID de solicitud
  getBySolicitudId: async (solicitudId: number): Promise<CertificadoMedico | null> => {
    try {
      const { data, error } = await supabase
        .from('certificados_medicos')
        .select('id, solicitud_id, candidato_id, restriccion_macro, resumen_restriccion, remision, requiere_medicacion, elementos_proteccion_personal, recomendaciones_generales, observaciones, concepto_medico, created_at, created_by, updated_at, documento_concepto_medico, adjunto_aprobacion_certificado')
        .eq('solicitud_id', solicitudId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No se encontró el certificado
          return null;
        }
        console.error('Error fetching certificado médico:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in certificadosMedicosService.getBySolicitudId:', error);
      throw error;
    }
  },

  // Actualizar certificado médico
  update: async (id: number, data: Partial<CertificadoMedico>): Promise<CertificadoMedico> => {
    try {
      const { data: certificado, error } = await supabase
        .from('certificados_medicos')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating certificado médico:', error);
        throw error;
      }

      return certificado;
    } catch (error) {
      console.error('Error in certificadosMedicosService.update:', error);
      throw error;
    }
  },

  // Eliminar certificado médico
  delete: async (id: number): Promise<void> => {
    try {
      const { error } = await supabase
        .from('certificados_medicos')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting certificado médico:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in certificadosMedicosService.delete:', error);
      throw error;
    }
  },

  // Obtener todos los certificados médicos
  getAll: async (): Promise<CertificadoMedico[]> => {
    try {
      const { data, error } = await supabase
        .from('certificados_medicos')
        .select(`
          *,
          candidatos!candidato_id (
            id,
            primer_nombre,
            segundo_nombre,
            primer_apellido,
            segundo_apellido,
            numero_documento,
            tipo_documento,
            email,
            telefono
          ),
          hum_solicitudes!solicitud_id (
            id,
            estado,
            cargo,
            empresa_id,
            empresas!empresa_id (
              razon_social
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching certificados médicos:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in certificadosMedicosService.getAll:', error);
      throw error;
    }
  }
};


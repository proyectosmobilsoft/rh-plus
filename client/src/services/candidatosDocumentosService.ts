import { supabase } from './supabaseClient';

export interface CandidatoDocumento {
  id: number;
  candidato_id: number;
  tipo_documento_id: number;
  nombre_archivo: string;
  url_archivo: string;
  fecha_vigencia?: string;
  observaciones?: string;
  fecha_carga: string;
  created_at: string;
  updated_at: string;
}

export interface CandidatoDocumentoConDetalles extends CandidatoDocumento {
  tipos_documentos: {
    id: number;
    nombre: string;
    descripcion?: string;
    activo: boolean;
  };
}

export interface CreateCandidatoDocumentoData {
  candidato_id: number;
  tipo_documento_id: number;
  nombre_archivo: string;
  url_archivo: string;
  fecha_vigencia?: string;
  observaciones?: string;
}

export interface UpdateCandidatoDocumentoData {
  nombre_archivo?: string;
  url_archivo?: string;
  fecha_vigencia?: string;
  observaciones?: string;
}

export const candidatosDocumentosService = {
  // Obtener todos los documentos de un candidato
  getByCandidato: async (candidatoId: number): Promise<CandidatoDocumento[]> => {
    const { data, error } = await supabase
      .from('candidatos_documentos')
      .select('*')
      .eq('candidato_id', candidatoId)
      .order('fecha_carga', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Obtener documentos de un candidato con detalles del tipo de documento
  getByCandidatoWithDetails: async (candidatoId: number): Promise<CandidatoDocumentoConDetalles[]> => {
    const { data, error } = await supabase
      .from('candidatos_documentos')
      .select(`
        *,
        tipos_documentos (
          id,
          nombre,
          descripcion,
          activo
        )
      `)
      .eq('candidato_id', candidatoId)
      .order('fecha_carga', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Obtener un documento específico
  getById: async (id: number): Promise<CandidatoDocumento | null> => {
    const { data, error } = await supabase
      .from('candidatos_documentos')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Crear un nuevo documento
  create: async (documento: CreateCandidatoDocumentoData): Promise<CandidatoDocumento | null> => {
    const { data, error } = await supabase
      .from('candidatos_documentos')
      .insert([documento])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Actualizar un documento
  update: async (id: number, documento: UpdateCandidatoDocumentoData): Promise<CandidatoDocumento | null> => {
    const { data, error } = await supabase
      .from('candidatos_documentos')
      .update({ ...documento, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Eliminar un documento
  delete: async (id: number): Promise<boolean> => {
    const { error } = await supabase
      .from('candidatos_documentos')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  },

  // Eliminar todos los documentos de un candidato
  deleteByCandidato: async (candidatoId: number): Promise<boolean> => {
    const { error } = await supabase
      .from('candidatos_documentos')
      .delete()
      .eq('candidato_id', candidatoId);
    
    if (error) throw error;
    return true;
  },

  // Verificar si un candidato tiene un documento específico
  exists: async (candidatoId: number, tipoDocumentoId: number): Promise<boolean> => {
    const { data, error } = await supabase
      .from('candidatos_documentos')
      .select('id')
      .eq('candidato_id', candidatoId)
      .eq('tipo_documento_id', tipoDocumentoId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    return !!data;
  },

  // Obtener documentos vencidos o próximos a vencer
  getDocumentosVencidos: async (diasAnticipacion: number = 30): Promise<CandidatoDocumentoConDetalles[]> => {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + diasAnticipacion);
    
    const { data, error } = await supabase
      .from('candidatos_documentos')
      .select(`
        *,
        tipos_documentos (
          id,
          nombre,
          descripcion,
          activo
        )
      `)
      .not('fecha_vigencia', 'is', null)
      .lte('fecha_vigencia', fechaLimite.toISOString().split('T')[0])
      .order('fecha_vigencia', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  // Subir archivo a Supabase Storage
  uploadFile: async (file: File, candidatoId: number, tipoDocumentoId: number): Promise<string> => {
    const fileName = `${candidatoId}_${tipoDocumentoId}_${Date.now()}_${file.name}`;
    const filePath = `candidatos/${candidatoId}/${fileName}`;
    
    const { data, error } = await supabase.storage
      .from('documentos')
      .upload(filePath, file);
    
    if (error) throw error;
    
    // Obtener URL pública del archivo
    const { data: urlData } = supabase.storage
      .from('documentos')
      .getPublicUrl(filePath);
    
    return urlData.publicUrl;
  },

  // Eliminar archivo de Supabase Storage
  deleteFile: async (urlArchivo: string): Promise<boolean> => {
    // Extraer la ruta del archivo de la URL
    const urlParts = urlArchivo.split('/');
    const filePath = urlParts.slice(urlParts.indexOf('documentos') + 1).join('/');
    
    const { error } = await supabase.storage
      .from('documentos')
      .remove([filePath]);
    
    if (error) throw error;
    return true;
  }
}; 
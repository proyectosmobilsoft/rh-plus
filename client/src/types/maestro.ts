// Tipos de Candidatos
export interface TipoCandidato {
  id: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTipoCandidatoData {
  nombre: string;
  descripcion?: string;
  activo?: boolean;
}

export interface UpdateTipoCandidatoData {
  nombre?: string;
  descripcion?: string;
  activo?: boolean;
}

// Tipos de Documentos
export interface TipoDocumento {
  id: number;
  nombre: string;
  descripcion?: string;
  requerido: boolean;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTipoDocumentoData {
  nombre: string;
  descripcion?: string;
  requerido?: boolean;
  activo?: boolean;
}

export interface UpdateTipoDocumentoData {
  nombre?: string;
  descripcion?: string;
  requerido?: boolean;
  activo?: boolean;
}

// Relación entre Tipos de Candidatos y Documentos
export interface TipoCandidatoDocumento {
  id: number;
  tipo_candidato_id: number;
  tipo_documento_id: number;
  obligatorio: boolean;
  orden: number;
  created_at: string;
  updated_at: string;
}

export interface CreateTipoCandidatoDocumentoData {
  tipo_candidato_id: number;
  tipo_documento_id: number;
  obligatorio?: boolean;
  orden?: number;
}

export interface UpdateTipoCandidatoDocumentoData {
  obligatorio?: boolean;
  orden?: number;
}

// Tipos con detalles para consultas relacionadas
export interface TipoCandidatoDocumentoConDetalles extends TipoCandidatoDocumento {
  tipos_documentos: {
    id: number;
    nombre: string;
    descripcion?: string;
    requerido: boolean;
    activo: boolean;
  };
}

// Formularios
export interface TipoCandidatoForm {
  nombre: string;
  descripcion?: string;
}

export interface DocumentoTipoForm {
  nombre: string;
  descripcion?: string;
  requerido: boolean;
} 
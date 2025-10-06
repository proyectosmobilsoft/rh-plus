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
  lleva_fecha_vigencia?: boolean;
  fecha_vigencia?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTipoDocumentoData {
  nombre: string;
  descripcion?: string;
  lleva_fecha_vigencia?: boolean;
  fecha_vigencia?: string;
  activo?: boolean;
}

export interface UpdateTipoDocumentoData {
  nombre?: string;
  descripcion?: string;
  lleva_fecha_vigencia?: boolean;
  fecha_vigencia?: string;
  activo?: boolean;
}

// Relación entre Tipos de Candidatos y Documentos
export interface TipoCandidatoDocumento {
  id: number;
  tipo_candidato_id: number;
  tipo_documento_id: number;
  obligatorio: boolean;  // Indica si el documento está seleccionado para este tipo de cargo
  requerido: boolean;    // Indica si el documento es requerido/obligatorio para este tipo de cargo
  orden: number;
  created_at: string;
  updated_at: string;
}

export interface CreateTipoCandidatoDocumentoData {
  tipo_candidato_id: number;
  tipo_documento_id: number;
  obligatorio?: boolean;
  requerido?: boolean;
  orden?: number;
}

export interface UpdateTipoCandidatoDocumentoData {
  obligatorio?: boolean;
  requerido?: boolean;
  orden?: number;
}

// Tipos con detalles para consultas relacionadas
export interface TipoCandidatoDocumentoConDetalles extends TipoCandidatoDocumento {
  tipos_documentos: {
    id: number;
    nombre: string;
    descripcion?: string;
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
  lleva_fecha_vigencia: boolean;
  fecha_vigencia?: string;
} 


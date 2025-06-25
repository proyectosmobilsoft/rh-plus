
import { api } from './api';

export interface DocumentoInfo {
  name: string | null;
  url: string | null;
  tipo_documento: string | null;
}

export interface Empresa {
  Id?: number;
  empresaId?: number;
  EmpresaId?: number;
  id?: number; // API response field
  nit?: string;
  NIT?: string;
  dv?: string;
  DV?: string;
  razonSocial?: string;
  RazonSocial?: string;
  razon_social?: string; // API response field
  nombreComercial?: string;
  NombreComercial?: string;
  nombre_comercial?: string; // API response field
  direccion?: string;
  Direccion?: string;
  telefono?: string;
  Telefono?: string;
  correoElectronico?: string;
  CorreoElectronico?: string;
  correo_electronico?: string; // API response field
  sectorEconomico?: string;
  SectorEconomico?: string;
  sector_economico?: string; // API response field
  numeroEmpleados?: number;
  NumeroEmpleados?: number;
  numero_empleados?: number; // API response field
  representanteLegal?: string;
  RepresentanteLegalNombre?: string;
  representante_legal_nombre?: string; // API response field
  representanteLegalDocumento?: string;
  RepresentanteLegalDocumento?: string;
  representante_legal_documento?: string; // API response field
  representanteLegalCorreo?: string;
  RepresentanteLegalCorreo?: string;
  representante_legal_correo?: string; // API response field
  representanteLegalTelefono?: string;
  RepresentanteLegalTelefono?: string;
  representante_legal_telefono?: string; // API response field
  fechaRegistro?: string;
  FechaRegistro?: string;
  fecha_registro?: string; // API response field
  tipoDocumento?: string;
  TipoDocumentoId?: string | null;
  tipo_documento?: string; // API response field
  regimen?: string;
  RegimenId?: string | null;
  ciudad?: string;
  CiudadId?: string | null;
  documentos?: {
    contrato?: File | null;
    camaraComercio?: File | null;
    rut?: File | null;
  };
  documentosInfo?: {
    contrato?: DocumentoInfo | null;
    camaraComercio?: DocumentoInfo | null;
    rut?: DocumentoInfo | null;
  };
}

// Normalize empresa data from API to local format
export const normalizeEmpresa = (empresa: any): Empresa => {
  // Process documentos if they exist in the API response
  const documentosInfo = {
    contrato: {
      name: empresa?.contrato_name || null,
      url: empresa?.contrato_url || null,
      tipo_documento: 'contrato'
    },
    camaraComercio: {
      name: empresa?.camaraComercio_name || null,
      url: empresa?.camaraComercio_url || null,
      tipo_documento: 'camara_comercio'
    },
    rut: {
      name: empresa?.rut_name || null,
      url: empresa?.rut_url || null,
      tipo_documento: 'rut'
    }
  };

  return {
    Id: empresa.id || empresa.EmpresaId || empresa.empresaId,
    empresaId: empresa.id || empresa.EmpresaId || empresa.empresaId,
    nit: empresa.nit || empresa.NIT || '',
    dv: empresa.dv || empresa.DV || '',
    razonSocial: empresa.razon_social || empresa.RazonSocial || empresa.razonSocial || '',
    nombreComercial: empresa.nombre_comercial || empresa.NombreComercial || empresa.nombreComercial || '',
    direccion: empresa.direccion || empresa.Direccion || '',
    telefono: empresa.telefono || empresa.Telefono || '',
    correoElectronico: empresa.correo_electronico || empresa.CorreoElectronico || empresa.correoElectronico || '',
    sectorEconomico: empresa.sector_economico || empresa.SectorEconomico || empresa.sectorEconomico || '',
    numeroEmpleados: empresa.numero_empleados || empresa.NumeroEmpleados || empresa.numeroEmpleados,
    representanteLegal: empresa.representante_legal_nombre || empresa.RepresentanteLegalNombre || empresa.representanteLegal || '',
    representanteLegalDocumento: empresa.representante_legal_documento || empresa.RepresentanteLegalDocumento || empresa.representanteLegalDocumento || '',
    representanteLegalCorreo: empresa.representante_legal_correo || empresa.RepresentanteLegalCorreo || empresa.representanteLegalCorreo || '',
    representanteLegalTelefono: empresa.representante_legal_telefono || empresa.RepresentanteLegalTelefono || empresa.representanteLegalTelefono || '',
    fechaRegistro: empresa.fecha_registro || empresa.FechaRegistro || empresa.fechaRegistro || '',
    tipoDocumento: empresa.tipo_documento || empresa.TipoDocumentoId || empresa.tipoDocumento,
    regimen: empresa.regimen || empresa.RegimenId || empresa.regimen,
    ciudad: empresa.ciudad || empresa.CiudadId || empresa.ciudad,
    documentosInfo
  };
};

// Prepare empresa data for API with document info
const prepareEmpresaForAPI = (empresa: Empresa) => {
  // Create a new object with the documented properties in the format the API expects
  return {
    ...empresa,
    documentos: {
      contrato: empresa.documentosInfo?.contrato ? {
        name: empresa.documentosInfo.contrato.name,
        url: empresa.documentosInfo.contrato.url,
        tipo_documento: 'contrato'
      } : { name: null, url: null, tipo_documento: 'contrato' },
      
      camaraComercio: empresa.documentosInfo?.camaraComercio ? {
        name: empresa.documentosInfo.camaraComercio.name,
        url: empresa.documentosInfo.camaraComercio.url,
        tipo_documento: 'camara_comercio'
      } : { name: null, url: null, tipo_documento: 'camara_comercio' },
      
      rut: empresa.documentosInfo?.rut ? {
        name: empresa.documentosInfo.rut.name,
        url: empresa.documentosInfo.rut.url,
        tipo_documento: 'rut'
      } : { name: null, url: null, tipo_documento: 'rut' }
    }
  };
};

export const empresasService = {
  getAll: async () => {
    const response = await api.post<{ filas: any[], mensaje: string, status: boolean }>('/empresas');
    // Map API response to local format
    return response.filas ? response.filas.map(normalizeEmpresa) : [];
  },
  
  create: async (empresa: Omit<Empresa, 'Id'>) => {
    // Prepare data with document info
    const empresaForAPI = prepareEmpresaForAPI(empresa);
    return api.post<{ mensaje: string, status: boolean }>('/empresas/guardar', empresaForAPI);
  },
  
  update: async (empresa: Empresa) => {
    // Prepare data with document info
    const empresaForAPI = prepareEmpresaForAPI(empresa);
    return api.post<{ mensaje: string, status: boolean }>('/empresas/editar', empresaForAPI);
  },
  
  delete: async (id: number) => {
    return api.post<{ mensaje: string, status: boolean }>('/empresas/eliminar', { id });
  }
};

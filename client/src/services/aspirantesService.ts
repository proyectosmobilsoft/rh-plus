import { api } from './api';

export interface Aspirante {
  id: number;
  nombres: string;
  apellidos: string;
  numeroDocumento: string;
  tipoDocumento: string;
  telefono?: string;
  correoElectronico?: string;
  direccion?: string;
  fechaNacimiento?: string;
  sexo?: string;
  estadoCivil?: string;
  cargoAspirado?: string;
  eps?: string;
  arl?: string;
  fondoPension?: string;
  experiencia?: any[];
  educacion?: any[];
  
  // Original API fields for compatibility
  numero_documento?: string;
  tipo_documento?: string;
  correo_electronico?: string;
  fecha_nacimiento?: string;
  estado_civil?: string;
  cargo_aspirado?: string;
  fondo_pension?: string;
}

export const aspirantesService = {
  getAll: async () => {
    try {
      const response = await api.post<{ filas: any[], mensaje: string, status: boolean }>('/aspirantes');
      console.log('API Response getAll aspirantes:', response);
      if (response && response.filas && Array.isArray(response.filas)) {
        // Map the API response to match our Typescript interface
        return response.filas.map(aspirante => ({
          id: aspirante.id,
          nombres: aspirante.nombres,
          apellidos: aspirante.apellidos,
          numeroDocumento: aspirante.numero_documento,
          tipoDocumento: aspirante.tipo_documento,
          telefono: aspirante.telefono,
          correoElectronico: aspirante.correo_electronico,
          direccion: aspirante.direccion,
          fechaNacimiento: aspirante.fecha_nacimiento,
          sexo: aspirante.sexo,
          estadoCivil: aspirante.estado_civil,
          cargoAspirado: aspirante.cargo_aspirado,
          eps: aspirante.eps,
          arl: aspirante.arl,
          fondoPension: aspirante.fondo_pension,
          experiencia: aspirante.experiencia,
          educacion: aspirante.educacion,
          // Keep original API fields for compatibility
          numero_documento: aspirante.numero_documento,
          tipo_documento: aspirante.tipo_documento,
          correo_electronico: aspirante.correo_electronico,
          fecha_nacimiento: aspirante.fecha_nacimiento,
          estado_civil: aspirante.estado_civil,
          cargo_aspirado: aspirante.cargo_aspirado,
          fondo_pension: aspirante.fondo_pension
        })) as Aspirante[];
      }
      return [];
    } catch (error) {
      console.error("Error fetching aspirantes:", error);
      throw error;
    }
  },
  
  getById: async (id: number) => {
    try {
      const response = await api.post<{ filas: any[], mensaje: string, status: boolean }>(`/aspirantes`, { id });
      console.log('API Response getById aspirante:', response);
      if (response && response.filas && Array.isArray(response.filas) && response.filas.length > 0) {
        const aspirante = response.filas[0];
        return {
          id: aspirante.id,
          nombres: aspirante.nombres,
          apellidos: aspirante.apellidos,
          numeroDocumento: aspirante.numero_documento,
          tipoDocumento: aspirante.tipo_documento,
          telefono: aspirante.telefono,
          correoElectronico: aspirante.correo_electronico,
          direccion: aspirante.direccion,
          fechaNacimiento: aspirante.fecha_nacimiento,
          sexo: aspirante.sexo,
          estadoCivil: aspirante.estado_civil,
          cargoAspirado: aspirante.cargo_aspirado,
          eps: aspirante.eps,
          arl: aspirante.arl,
          fondoPension: aspirante.fondo_pension,
          experiencia: aspirante.experiencia,
          educacion: aspirante.educacion
        } as Aspirante;
      }
      return null;
    } catch (error) {
      console.error(`Error fetching aspirante by ID ${id}:`, error);
      throw error;
    }
  },
  
  getDetailById: async (id: number) => {
    try {
      const response = await api.post<{ filas: any[], mensaje: string, status: boolean }>(`/aspirantes/by`, { id });
      console.log('API Response getDetailById aspirante:', response);
      if (response && response.filas && Array.isArray(response.filas)) {
        // Handle the specific structure from the API
        if (response.filas.length >= 2 && Array.isArray(response.filas[0]) && Array.isArray(response.filas[1])) {
          return {
            educacion: response.filas[0] || [],
            experiencia: response.filas[1] || []
          };
        }
        // Fallback for other structure
        return {
          experiencia: response.filas.filter(item => item.tipo === 'experiencia') || [],
          educacion: response.filas.filter(item => item.tipo === 'educacion') || []
        };
      }
      return { experiencia: [], educacion: [] };
    } catch (error) {
      console.error(`Error fetching aspirante details by ID ${id}:`, error);
      throw error;
    }
  }
};



import { api } from "./api";

export interface Cita {
  id?: number;
  aspiranteId: number;
  aspiranteNombre?: string;
  especialistaId?: number;
  especialistaNombre?: string;
  especialidadId?: number;
  especialidadNombre?: string;
  fecha: string;
  hora: string;
  observacion?: string;
  estado?: "programada" | "en espera" | "atendida" | "cancelada";
}

export const agendaMedicaService = {
  getAll: async () => {
    try {
      const response = await api.post<{ filas: any[], mensaje: string, status: boolean }>('/citas');
      console.log('API Response getAll citas:', response);
      
      if (response && response.filas && Array.isArray(response.filas)) {
        return response.filas as Cita[];
      }
      
      return [];
    } catch (error) {
      console.error("Error fetching citas:", error);
      throw error;
    }
  },
  
  getById: async (id: number) => {
    try {
      const response = await api.post<{ filas: any[], mensaje: string, status: boolean }>('/citas', { id });
      console.log('API Response getById cita:', response);
      
      if (response && response.filas && Array.isArray(response.filas) && response.filas.length > 0) {
        return response.filas[0] as Cita;
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching cita by ID ${id}:`, error);
      throw error;
    }
  },
  
  guardar: async (cita: Cita) => {
    try {
      const response = await api.post<{ filas: any[], mensaje: string, status: boolean }>('/citas/guardar', cita);
      console.log('API Response guardar cita:', response);
      
      return response;
    } catch (error) {
      console.error("Error saving cita:", error);
      throw error;
    }
  },
  
  actualizar: async (cita: Cita) => {
    try {
      const response = await api.post<{ filas: any[], mensaje: string, status: boolean }>('/citas/actualizar', cita);
      console.log('API Response actualizar cita:', response);
      
      return response;
    } catch (error) {
      console.error(`Error updating cita ID ${cita.id}:`, error);
      throw error;
    }
  },
  
  cancelar: async (id: number) => {
    try {
      const response = await api.post<{ filas: any[], mensaje: string, status: boolean }>('/citas/cancelar', { id });
      console.log('API Response cancelar cita:', response);
      
      return response;
    } catch (error) {
      console.error(`Error canceling cita ID ${id}:`, error);
      throw error;
    }
  }
};

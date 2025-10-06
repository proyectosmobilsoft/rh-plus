
import { api } from './api';
import { OrdenServicio } from './ordenesService';

export const serviciosService = {
  getAll: async () => {
    try {
      const response = await api.post<{ filas: any[], mensaje: string, status: boolean }>('/servicios');
      
      if (response && response.filas && Array.isArray(response.filas)) {
        // Transform API response to match the OrdenServicio interface
        return response.filas.map((servicio: any) => ({
          id: servicio.id,
          codigo: servicio.codigo,
          descripcion: servicio.descripcion,
          precio: servicio.precio,
          estado: servicio.estado
        })) as OrdenServicio[];
      }
      return [];
    } catch (error) {
      console.error("Error fetching servicios:", error);
      throw error;
    }
  }
};


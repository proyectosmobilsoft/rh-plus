
import { api } from './api';

export interface OrdenServicio {
  id: number;
  codigo: string;
  descripcion: string;
  precio: number;
  estado: string;
}

export interface Orden {
  id?: number;
  numeroOrden?: string;
  
  // Relaciones
  clienteId?: number;
  candidatoId?: number;
  analistaId?: number;
  empresaId?: number;
  
  // Información del trabajador
  nombres: string;
  apellidos: string;
  tipoDocumento: string;
  numeroDocumento: string;
  lugarExpedicion?: string;
  celular?: string;
  direccion?: string;
  
  // Información de la empresa usuaria
  empresaUsuaria?: string;
  ciudadPrestacionServicio?: string;
  departamentoPrestacionServicio?: string;
  
  // Información del trabajo
  cargo: string;
  salario?: string;
  ciudad: string;
  fechaIngreso?: string;
  tipoContrato?: string;
  
  // Especificaciones para el ingreso
  salarioBasico?: string;
  auxilioTransporte?: string;
  viajeRotativo?: boolean;
  
  // Vehículo de transporte y alimentación
  vehiculoTransporte?: string;
  vehiculoAlimentacion?: string;
  
  // Salario mensual
  salarioMensual?: string;
  
  // Jornada laboral
  jornadaLaboral?: string;
  
  // Pagos adicionales
  pagosAuxilios?: string;
  
  // Especificaciones adicionales
  especificacionesAdicionales?: string;
  
  // Estado y seguimiento
  estado: string;
  prioridad?: string;
  
  // Fechas de seguimiento
  fechaCreacion?: string;
  fechaAsignacion?: string;
  fechaInicioExamenes?: string;
  fechaFinalizacion?: string;
  fechaVencimiento?: string;
  
  // Metadatos
  observaciones?: string;
  notasInternas?: string;
  leadTime?: number;
  
  // Campos adicionales para el examen médico
  centroTrabajo?: string;
  areaFuncional?: string;
  tipoExamen?: string;
  examenMedicoRealizar?: string;
  
  // Información adicional de ubicación
  departamento?: string;
  
  // Campos de cumplimiento
  cumpleHorario?: boolean;
  especifique?: string;
  
  // Legacy fields for compatibility
  servicios?: OrdenServicio[];
  tipoOrden?: string;
  total?: number;
  firma?: string;
  fecha?: string;
  fecha_orden?: string;
  empresa_name?: string;
  aspirante_name?: string;
  tipo_documento?: string;
  numero_documento?: string;
  correo_electronico?: string;
  telefono?: string;
  type_order?: string;
}

export const ordenesService = {
  getAll: async (estado?: string) => {
    try {
      // Instead of using a different endpoint for filtered orders,
      // we'll use the main /orden endpoint and filter the results in memory
      const response = await api.post<{ filas: any[], mensaje: string, status: boolean }>('/orden');
      console.log('API Response getAll ordenes:', response);
      
      if (response && response.filas && Array.isArray(response.filas)) {
        // Map the response to our interface
        const ordenes = response.filas.map((orden: any) => ({
          id: orden.id,
          empresaId: orden.empresaId,
          aspiranteId: orden.aspiranteId,
          servicios: orden.servicios,
          tipoOrden: orden.tipoOrden,
          estado: orden.estado,
          total: orden.total,
          firma: orden.firma,
          fechaCreacion: orden.fechaCreacion,
          fecha: orden.fecha,
          // Map snake_case fields
          fecha_orden: orden.fecha_orden,
          empresa_name: orden.empresa_name,
          aspirante_name: orden.aspirante_name,
          tipo_documento: orden.tipo_documento,
          numero_documento: orden.numero_documento,
          correo_electronico: orden.correo_electronico,
          telefono: orden.telefono,
          type_order: orden.type_order
        }));
        
        // If estado is provided, filter the results
        if (estado) {
          return ordenes.filter((orden) => orden.estado === estado);
        }
        
        return ordenes;
      }
      
      return [];
    } catch (error) {
      console.error("Error fetching ordenes:", error);
      throw error;
    }
  },
  
  getById: async (id: number) => {
    try {
      const response = await api.post<{ filas: any[], mensaje: string, status: boolean }>('/orden', { id });
      console.log('API Response getById orden:', response);
      
      if (response && response.filas && Array.isArray(response.filas) && response.filas.length > 0) {
        const orden = response.filas[0];
        return {
          id: orden.id,
          empresaId: orden.empresaId,
          aspiranteId: orden.aspiranteId,
          servicios: orden.servicios,
          tipoOrden: orden.tipoOrden,
          estado: orden.estado,
          total: orden.total,
          firma: orden.firma,
          fechaCreacion: orden.fechaCreacion,
          fecha: orden.fecha,
          // Map snake_case fields
          fecha_orden: orden.fecha_orden,
          empresa_name: orden.empresa_name,
          aspirante_name: orden.aspirante_name,
          tipo_documento: orden.tipo_documento,
          numero_documento: orden.numero_documento,
          correo_electronico: orden.correo_electronico,
          telefono: orden.telefono,
          type_order: orden.type_order
        } as Orden;
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching orden by ID ${id}:`, error);
      throw error;
    }
  },
  
  // Alias for getById for AppointmentModal to use
  getOrdenById: async (id: number) => {
    return ordenesService.getById(id);
  },
  
  create: async (orden: Orden) => {
    try {
      const response = await api.post<{ mensaje: string, status: boolean }>('/orden/guardar', orden);
      console.log('API Response create orden:', response);
      return response;
    } catch (error) {
      console.error("Error creating orden:", error);
      throw error;
    }
  },
  
  update: async (orden: Orden) => {
    try {
      const response = await api.post<{ mensaje: string, status: boolean }>('/orden/actualizar', orden);
      console.log('API Response update orden:', response);
      return response;
    } catch (error) {
      console.error(`Error updating orden ID ${orden.id}:`, error);
      throw error;
    }
  },
  
  delete: async (id: number) => {
    try {
      const response = await api.post<{ mensaje: string, status: boolean }>('/orden/eliminar', { id });
      console.log('API Response delete orden:', response);
      return response;
    } catch (error) {
      console.error(`Error deleting orden ID ${id}:`, error);
      throw error;
    }
  },
  
  approve: async (id: number) => {
    try {
      const response = await api.post<{ mensaje: string, status: boolean }>('/orden/aprobar', { id });
      console.log('API Response approve orden:', response);
      return response;
    } catch (error) {
      console.error(`Error approving orden ID ${id}:`, error);
      throw error;
    }
  }
};




import { api } from './api';

export interface Certificado {
  id?: number;
  ordenId: number;
  aspiranteId: number;
  empresaId: number;
  conceptoMedico: string;  // Required field
  paraclinicosTenidos?: string;
  remision: string;  // Required field
  reubicacion: string;  // Required field
  elementosProteccion?: string;
  observaciones?: string;
  vigilanciaEpidemiologica: {
    cardiovascular: boolean;
    respiratorio: boolean;
    ergonomico: boolean;
    biologicos: boolean;
    dermatologico: boolean;
    visual: boolean;
    estilosVida: boolean;
    psicosocial: boolean;
  };
  otros?: string;
  archivo?: string;
  fecha?: string;
}

export const certificadosService = {
  guardar: async (certificado: Certificado) => {
    try {
      console.log('Guardando certificado:', certificado);
      const response = await api.post<{ mensaje: string, status: boolean }>('/certificado/guardar', certificado);
      return response;
    } catch (error) {
      console.error("Error guardando certificado:", error);
      throw error;
    }
  }
};

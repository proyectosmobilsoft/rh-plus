import { supabase } from './supabaseClient';
import QRCode from 'qrcode';

function getBaseUrl(): string {
  // Prioriza variables de entorno si existen
  const envUrl = (import.meta as any).env?.VITE_PUBLIC_APP_URL || (import.meta as any).env?.VITE_APP_URL;
  if (envUrl && typeof envUrl === 'string') {
    try {
      const url = new URL(envUrl);
      return url.origin;
    } catch {
      // si no es URL válida, sigue con origin
    }
  }
  // Fallback al origin del navegador
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  // Último recurso
  return 'https://localhost';
}

export interface QRCodeData {
  id?: number;
  candidato_id: number;
  qr_data: string;
  qr_image_url?: string;
  qr_size: number;
  fecha_generacion?: string;
  fecha_vencimiento?: string;
  activo?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface QRConfiguracion {
  id?: number;
  periodo_renovacion: number;
  tamanio_qr: number;
  formato_imagen: string;
  calidad_imagen: number;
  color_fondo: string;
  color_qr: string;
  margen: number;
  created_at?: string;
  updated_at?: string;
}

// Configuración por defecto
const DEFAULT_CONFIG: QRConfiguracion = {
  periodo_renovacion: 30,
  tamanio_qr: 300,
  formato_imagen: 'PNG',
  calidad_imagen: 0.8,
  color_fondo: '#FFFFFF',
  color_qr: '#000000',
  margen: 4
};

export const qrService = {
  // Obtener configuración de QR
  getConfiguracion: async (): Promise<QRConfiguracion> => {
    try {
      const { data, error } = await supabase
        .from('qr_configuracion')
        .select('*')
        .limit(1)
        .single();
      
      if (error) {
        console.warn('Error al obtener configuración QR:', error);
        return DEFAULT_CONFIG;
      }
      
      return data || DEFAULT_CONFIG;
    } catch (error) {
      console.warn('Error al obtener configuración QR:', error);
      return DEFAULT_CONFIG;
    }
  },

  // Actualizar configuración de QR
  updateConfiguracion: async (config: Partial<QRConfiguracion>): Promise<QRConfiguracion | null> => {
    try {
      const { data, error } = await supabase
        .from('qr_configuracion')
        .update(config)
        .eq('id', 1)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error al actualizar configuración QR:', error);
      throw error;
    }
  },

  // Generar código QR
  generateQR: async (candidato: any, config: QRConfiguracion): Promise<QRCodeData> => {
    try {
      // Crear datos del candidato para el QR
      const qrData = {
        id: candidato.id,
        tipo_documento: candidato.tipo_documento,
        numero_documento: candidato.numero_documento,
        nombre_completo: `${candidato.primer_nombre} ${candidato.segundo_nombre || ''} ${candidato.primer_apellido} ${candidato.segundo_apellido || ''}`.trim(),
        email: candidato.email,
        telefono: candidato.telefono,
        empresa_id: candidato.empresa_id,
        fecha_generacion: new Date().toISOString(),
        fecha_vencimiento: new Date(Date.now() + config.periodo_renovacion * 24 * 60 * 60 * 1000).toISOString()
      };

      // Crear URL para la página pública
      const baseUrl = getBaseUrl();
      const qrUrl = `${baseUrl}/qr/${btoa(JSON.stringify(qrData))}`;

      // Generar QR como imagen con la URL
      const qrImageUrl = await QRCode.toDataURL(qrUrl, {
        width: config.tamanio_qr,
        margin: config.margen,
        color: {
          dark: config.color_qr,
          light: config.color_fondo
        },
        errorCorrectionLevel: 'M'
      });

      // Guardar en la base de datos
      const qrCodeData: Partial<QRCodeData> = {
        candidato_id: candidato.id,
        qr_data: JSON.stringify(qrData),
        qr_image_url: qrImageUrl,
        qr_size: config.tamanio_qr,
        fecha_vencimiento: qrData.fecha_vencimiento,
        activo: true
      };

      const { data, error } = await supabase
        .from('qr_codes')
        .insert([qrCodeData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error al generar QR:', error);
      throw error;
    }
  },

  // Obtener QR por candidato
  getQRByCandidato: async (candidatoId: number): Promise<QRCodeData | null> => {
    try {
      const { data, error } = await supabase
        .from('qr_codes')
        .select('*')
        .eq('candidato_id', candidatoId)
        .eq('activo', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.warn('Error al obtener QR por candidato:', error);
        return null;
      }

      // Si no hay datos, retornar null
      if (!data || data.length === 0) {
        return null;
      }

      return data[0];
    } catch (error) {
      console.warn('Error al obtener QR por candidato:', error);
      return null;
    }
  },

  // Obtener todos los QR
  getAllQR: async (): Promise<QRCodeData[]> => {
    try {
      const { data, error } = await supabase
        .from('qr_codes')
        .select(`
          *,
          candidatos (
            id,
            tipo_documento,
            numero_documento,
            primer_nombre,
            segundo_nombre,
            primer_apellido,
            segundo_apellido,
            email,
            telefono,
            empresa_id,
            activo
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error al obtener todos los QR:', error);
      return [];
    }
  },

  // Descargar QR como imagen
  downloadQR: async (qrCode: QRCodeData): Promise<void> => {
    try {
      // Crear un enlace temporal para descargar
      const link = document.createElement('a');
      link.href = qrCode.qr_image_url!;
      link.download = `QR_${qrCode.candidato_id}_${new Date().toISOString().split('T')[0]}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error al descargar QR:', error);
      throw new Error('Error al descargar el código QR');
    }
  },

  // Eliminar QR
  deleteQR: async (qrId: number): Promise<void> => {
    try {
      const { error } = await supabase
        .from('qr_codes')
        .delete()
        .eq('id', qrId);

      if (error) throw error;
    } catch (error) {
      console.error('Error al eliminar QR:', error);
      throw error;
    }
  },

  // Regenerar QR
  regenerateQR: async (candidato: any, config: QRConfiguracion): Promise<QRCodeData> => {
    try {
      // Primero eliminar el QR existente
      const existingQR = await qrService.getQRByCandidato(candidato.id);
      if (existingQR) {
        await qrService.deleteQR(existingQR.id!);
      }

      // Generar nuevo QR
      return await qrService.generateQR(candidato, config);
    } catch (error) {
      console.error('Error al regenerar QR:', error);
      throw error;
    }
  },

  // Verificar si un QR está vencido
  isQRExpired: (qrCode: QRCodeData): boolean => {
    if (!qrCode.fecha_vencimiento) return false;
    return new Date(qrCode.fecha_vencimiento) < new Date();
  },

  // Obtener QR vencidos
  getExpiredQR: async (): Promise<QRCodeData[]> => {
    try {
      const { data, error } = await supabase
        .from('qr_codes')
        .select('*')
        .lt('fecha_vencimiento', new Date().toISOString())
        .eq('activo', true);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error al obtener QR vencidos:', error);
      return [];
    }
  },

  // Visualizar QR con información completa
  viewQR: async (qrCode: QRCodeData, candidato: any, empresa?: any): Promise<void> => {
    try {
      // Crear URL para la página pública con base configurable
      const baseUrl = getBaseUrl();
      const qrUrl = `${baseUrl}/qr/${btoa(qrCode.qr_data)}`;
      
      // Abrir en una nueva ventana
      window.open(qrUrl, '_blank', 'width=900,height=800,scrollbars=yes,resizable=yes');
      
    } catch (error) {
      console.error('Error al visualizar QR:', error);
      throw new Error('Error al abrir la vista del código QR');
    }
  }
}; 


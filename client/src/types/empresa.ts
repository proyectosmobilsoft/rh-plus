import { z } from "zod";

export const createEmpresaSchema = z.object({
  // Campos básicos de la empresa
  razon_social: z.string().min(1, "La razón social es requerida"),
  nit: z.string().min(1, "El NIT es requerido"),
  direccion: z.string().min(1, "La dirección es requerida"),
  telefono: z.string().min(1, "El teléfono es requerido"),
  email: z.string().email("Correo electrónico inválido"),
  representante_legal: z.string().min(1, "El representante legal es requerido"),
  
  // Campos de ubicación y actividad
  ciudad: z.string().min(1, "La ciudad es requerida"),
  ciudad_nombre: z.string().optional(),
  actividad_economica: z.string().min(1, "La actividad económica es requerida"),
  actividad_nombre: z.string().optional(),
  
  // Campos de régimen tributario
  regimen_tributario: z.number().min(1, "El régimen tributario es requerido"),
  
  // Campos de documentos (base64)
  documento_contrato_base64: z.string().optional(),
  documento_camara_comercio_base64: z.string().optional(),
  documento_rut_base64: z.string().optional(),
  logo_base64: z.string().optional(),
  
  // Campos de configuración
  tipo_empresa: z.string().default("prestador"),
  activo: z.boolean().default(true),
  
  // Plantillas seleccionadas
  plantillas_seleccionadas: z.array(z.number()).optional(),
  
  // Campos opcionales para compatibilidad
  tipo_documento: z.string().min(1, "El tipo de documento es requerido"),
  nit_base: z.string().optional(),
  nit_verification: z.string().optional(),
  numero_empleados: z.number().min(1, "El número de empleados es requerido"),
  documento_contrato: z.string().optional(),
  documento_camara_comercio: z.string().optional(),
  documento_rut: z.string().optional(),
  documentos: z.array(z.object({
    tipo: z.string(),
    archivo: z.any(),
    nombre: z.string()
  })).optional()
});

export type CreateEmpresaDTO = z.infer<typeof createEmpresaSchema>;

export interface DocumentoEmpresa {
  id: number;
  empresa_id: number;
  tipo: string;
  nombre_archivo: string;
  url_archivo: string;
  fecha_carga: string;
}
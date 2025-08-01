export interface Company {
    id?: number;
    razonSocial?: string;
    direccion?: string;
    ciudad?: string;
    correoElectronico?: string;
    telefono?: string;
    representanteLegal?: string;
    name: string;
    nit: string;
    address: string;
    city: string;
    phone: string;
    email: string;
    contactPerson: string;
    contactPhone: string;
    contactEmail: string;
    sector: string;
    employeeCount: number;
    active: boolean;
    createdAt: string;
    updatedAt: string;
    tipo_documento?: string;
    // Campos nuevos que coinciden con la BD
    actividad_economica_id?: string;
    regimen_tributario_id?: string | number;
    numero_empleados?: number;
    tipo_empresa?: string;
    documento_contrato?: string;
    documento_camara_comercio?: string;
    documento_rut?: string;
    // Campos de la BD con nombres diferentes
    razon_social?: string;
    representante_legal?: string;
    created_at?: string;
    updated_at?: string;
    activo?: boolean;
}
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
    regimen_tributario?: string;
  }
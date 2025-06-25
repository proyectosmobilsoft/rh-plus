export interface Company {
    id: string;
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
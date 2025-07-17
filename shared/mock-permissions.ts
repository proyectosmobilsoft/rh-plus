// Mock data para el sistema de permisos granulares
export interface SystemView {
  id: string;
  name: string;
  description: string;
  module: string;
  route: string;
  icon: string;
  order: number;
}

export interface ViewAction {
  id: string;
  name: string;
  description: string;
  viewId: string;
  type: 'read' | 'create' | 'update' | 'delete' | 'custom';
}

export interface UserProfile {
  id: string;
  name: string;
  description: string;
  type: 'admin' | 'empresa' | 'candidato' | 'coordinador' | 'supervisor';
  permissions: {
    viewPermissions: { [viewId: string]: boolean };
    actionPermissions: { [actionId: string]: boolean };
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Company {
  id: string;
  name: string;
  nit: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  contactPerson: string;
  isActive: boolean;
  createdAt: Date;
}

export interface CompanyUser {
  id: string;
  companyId: string;
  email: string;
  tempPassword: string;
  profileId: string;
  mustChangePassword: boolean;
  isActive: boolean;
  createdAt: Date;
}

// Vistas del sistema con módulos organizados
export const mockSystemViews: SystemView[] = [
  // Módulo Dashboard
  {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Panel principal con estadísticas y resumen',
    module: 'Dashboard',
    route: '/dashboard',
    icon: 'Home',
    order: 1
  },
  
  // Módulo Seguridad
  {
    id: 'usuarios',
    name: 'Usuarios',
    description: 'Gestión de usuarios del sistema',
    module: 'Seguridad',
    route: '/usuarios',
    icon: 'Users',
    order: 2
  },
  {
    id: 'perfiles',
    name: 'Perfiles',
    description: 'Gestión de perfiles y roles',
    module: 'Seguridad',
    route: '/perfiles',
    icon: 'Shield',
    order: 3
  },
  {
    id: 'permisos',
    name: 'Gestión de Permisos',
    description: 'Control granular de permisos por perfil',
    module: 'Seguridad',
    route: '/permisos',
    icon: 'Lock',
    order: 4
  },
  
  // Módulo Registros
  {
    id: 'candidatos',
    name: 'Candidatos',
    description: 'Gestión de candidatos y postulaciones',
    module: 'Registros',
    route: '/candidatos',
    icon: 'User',
    order: 5
  },
  {
    id: 'empresas',
    name: 'Empresas Afiliadas',
    description: 'Gestión de empresas clientes',
    module: 'Registros',
    route: '/empresas',
    icon: 'Building',
    order: 6
  },
  {
    id: 'prestadores',
    name: 'Prestadores',
    description: 'Gestión de prestadores de servicios',
    module: 'Registros',
    route: '/prestadores',
    icon: 'UserCheck',
    order: 7
  },
  
  // Módulo Operaciones
  {
    id: 'ordenes',
    name: 'Expedición de Órdenes',
    description: 'Creación y gestión de órdenes médicas',
    module: 'Operaciones',
    route: '/ordenes',
    icon: 'FileText',
    order: 8
  },
  {
    id: 'certificados',
    name: 'Expedición de Certificados',
    description: 'Generación y gestión de certificados médicos',
    module: 'Operaciones',
    route: '/certificados',
    icon: 'Award',
    order: 9
  },
  
  // Módulo Maestro
  {
    id: 'maestro',
    name: 'Maestro de Datos',
    description: 'Configuración de tipos de candidatos y documentos',
    module: 'Maestro',
    route: '/maestro',
    icon: 'Database',
    order: 10
  },
  
  // Módulo Reportes
  {
    id: 'reportes',
    name: 'Reportes',
    description: 'Generación de reportes y estadísticas',
    module: 'Reportes',
    route: '/reportes',
    icon: 'BarChart',
    order: 11
  },
  
  // Módulo Analistas
  {
    id: 'analistas',
    name: 'Analistas',
    description: 'Gestión de analistas y asignaciones',
    module: 'Recursos',
    route: '/analistas',
    icon: 'UserCog',
    order: 12
  }
];

// Acciones disponibles por vista
export const mockViewActions: ViewAction[] = [
  // Dashboard
  { id: 'dashboard_view', name: 'Ver Dashboard', description: 'Ver panel principal', viewId: 'dashboard', type: 'read' },
  
  // Usuarios
  { id: 'usuarios_view', name: 'Ver Usuarios', description: 'Listar usuarios', viewId: 'usuarios', type: 'read' },
  { id: 'usuarios_create', name: 'Crear Usuario', description: 'Crear nuevos usuarios', viewId: 'usuarios', type: 'create' },
  { id: 'usuarios_edit', name: 'Editar Usuario', description: 'Modificar usuarios existentes', viewId: 'usuarios', type: 'update' },
  { id: 'usuarios_delete', name: 'Eliminar Usuario', description: 'Eliminar usuarios', viewId: 'usuarios', type: 'delete' },
  { id: 'usuarios_activate', name: 'Activar/Desactivar', description: 'Cambiar estado de usuarios', viewId: 'usuarios', type: 'custom' },
  
  // Perfiles
  { id: 'perfiles_view', name: 'Ver Perfiles', description: 'Listar perfiles', viewId: 'perfiles', type: 'read' },
  { id: 'perfiles_create', name: 'Crear Perfil', description: 'Crear nuevos perfiles', viewId: 'perfiles', type: 'create' },
  { id: 'perfiles_edit', name: 'Editar Perfil', description: 'Modificar perfiles existentes', viewId: 'perfiles', type: 'update' },
  { id: 'perfiles_delete', name: 'Eliminar Perfil', description: 'Eliminar perfiles', viewId: 'perfiles', type: 'delete' },
  
  // Permisos
  { id: 'permisos_view', name: 'Ver Permisos', description: 'Consultar permisos', viewId: 'permisos', type: 'read' },
  { id: 'permisos_manage', name: 'Gestionar Permisos', description: 'Asignar/revocar permisos', viewId: 'permisos', type: 'custom' },
  
  // Candidatos
  { id: 'candidatos_view', name: 'Ver Candidatos', description: 'Listar candidatos', viewId: 'candidatos', type: 'read' },
  { id: 'candidatos_create', name: 'Crear Candidato', description: 'Registrar nuevos candidatos', viewId: 'candidatos', type: 'create' },
  { id: 'candidatos_edit', name: 'Editar Candidato', description: 'Modificar información de candidatos', viewId: 'candidatos', type: 'update' },
  { id: 'candidatos_delete', name: 'Eliminar Candidato', description: 'Eliminar candidatos', viewId: 'candidatos', type: 'delete' },
  { id: 'candidatos_approve', name: 'Aprobar Candidato', description: 'Aprobar o rechazar candidatos', viewId: 'candidatos', type: 'custom' },
  
  // Empresas
  { id: 'empresas_view', name: 'Ver Empresas', description: 'Listar empresas', viewId: 'empresas', type: 'read' },
  { id: 'empresas_create', name: 'Crear Empresa', description: 'Registrar nuevas empresas', viewId: 'empresas', type: 'create' },
  { id: 'empresas_edit', name: 'Editar Empresa', description: 'Modificar información de empresas', viewId: 'empresas', type: 'update' },
  { id: 'empresas_delete', name: 'Eliminar Empresa', description: 'Eliminar empresas', viewId: 'empresas', type: 'delete' },
  { id: 'empresas_users', name: 'Gestionar Usuarios', description: 'Crear usuarios para empresas', viewId: 'empresas', type: 'custom' },
  
  // Prestadores
  { id: 'prestadores_view', name: 'Ver Prestadores', description: 'Listar prestadores', viewId: 'prestadores', type: 'read' },
  { id: 'prestadores_create', name: 'Crear Prestador', description: 'Registrar nuevos prestadores', viewId: 'prestadores', type: 'create' },
  { id: 'prestadores_edit', name: 'Editar Prestador', description: 'Modificar prestadores', viewId: 'prestadores', type: 'update' },
  { id: 'prestadores_delete', name: 'Eliminar Prestador', description: 'Eliminar prestadores', viewId: 'prestadores', type: 'delete' },
  
  // Órdenes
  { id: 'ordenes_view', name: 'Ver Órdenes', description: 'Listar órdenes médicas', viewId: 'ordenes', type: 'read' },
  { id: 'ordenes_create', name: 'Crear Orden', description: 'Generar nuevas órdenes', viewId: 'ordenes', type: 'create' },
  { id: 'ordenes_edit', name: 'Editar Orden', description: 'Modificar órdenes existentes', viewId: 'ordenes', type: 'update' },
  { id: 'ordenes_delete', name: 'Anular Orden', description: 'Anular órdenes', viewId: 'ordenes', type: 'delete' },
  
  // Certificados
  { id: 'certificados_view', name: 'Ver Certificados', description: 'Listar certificados', viewId: 'certificados', type: 'read' },
  { id: 'certificados_create', name: 'Crear Certificado', description: 'Generar certificados', viewId: 'certificados', type: 'create' },
  { id: 'certificados_edit', name: 'Editar Certificado', description: 'Modificar certificados', viewId: 'certificados', type: 'update' },
  { id: 'certificados_delete', name: 'Eliminar Certificado', description: 'Eliminar certificados', viewId: 'certificados', type: 'delete' },
  
  // Maestro
  { id: 'maestro_view', name: 'Ver Configuración', description: 'Ver configuración de maestros', viewId: 'maestro', type: 'read' },
  { id: 'maestro_manage', name: 'Gestionar Maestros', description: 'Configurar tipos y documentos', viewId: 'maestro', type: 'custom' },
  
  // Reportes
  { id: 'reportes_view', name: 'Ver Reportes', description: 'Consultar reportes', viewId: 'reportes', type: 'read' },
  { id: 'reportes_generate', name: 'Generar Reportes', description: 'Crear nuevos reportes', viewId: 'reportes', type: 'create' },
  { id: 'reportes_export', name: 'Exportar Reportes', description: 'Exportar reportes a archivos', viewId: 'reportes', type: 'custom' },
  
  // Analistas
  { id: 'analistas_view', name: 'Ver Analistas', description: 'Listar analistas', viewId: 'analistas', type: 'read' },
  { id: 'analistas_create', name: 'Crear Analista', description: 'Registrar nuevos analistas', viewId: 'analistas', type: 'create' },
  { id: 'analistas_edit', name: 'Editar Analista', description: 'Modificar analistas', viewId: 'analistas', type: 'update' },
  { id: 'analistas_delete', name: 'Eliminar Analista', description: 'Eliminar analistas', viewId: 'analistas', type: 'delete' }
];

// Perfiles predefinidos
export const mockUserProfiles: UserProfile[] = [
  {
    id: 'admin_general',
    name: 'Administrador General',
    description: 'Acceso completo a todo el sistema',
    type: 'admin',
    permissions: {
      viewPermissions: Object.fromEntries(mockSystemViews.map(v => [v.id, true])),
      actionPermissions: Object.fromEntries(mockViewActions.map(a => [a.id, true]))
    },
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  },
  {
    id: 'coordinador',
    name: 'Coordinador',
    description: 'Coordinación de operaciones y gestión de candidatos',
    type: 'coordinador',
    permissions: {
      viewPermissions: {
        dashboard: true,
        candidatos: true,
        ordenes: true,
        certificados: true,
        reportes: true,
        analistas: true
      },
      actionPermissions: {
        dashboard_view: true,
        candidatos_view: true,
        candidatos_create: true,
        candidatos_edit: true,
        candidatos_approve: true,
        ordenes_view: true,
        ordenes_create: true,
        ordenes_edit: true,
        certificados_view: true,
        certificados_create: true,
        reportes_view: true,
        reportes_generate: true,
        analistas_view: true,
        analistas_create: true,
        analistas_edit: true
      }
    },
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  },
  {
    id: 'empresa_basico',
    name: 'Empresa Básica',
    description: 'Acceso básico para empresas clientes',
    type: 'empresa',
    permissions: {
      viewPermissions: {
        dashboard: true,
        candidatos: true,
        ordenes: true
      },
      actionPermissions: {
        dashboard_view: true,
        candidatos_view: true,
        candidatos_create: true,
        candidatos_edit: true,
        ordenes_view: true,
        ordenes_create: true
      }
    },
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  },
  {
    id: 'supervisor',
    name: 'Supervisor',
    description: 'Supervisión de prestadores y analistas',
    type: 'supervisor',
    permissions: {
      viewPermissions: {
        dashboard: true,
        candidatos: true,
        prestadores: true,
        ordenes: true,
        certificados: true,
        analistas: true,
        reportes: true
      },
      actionPermissions: {
        dashboard_view: true,
        candidatos_view: true,
        candidatos_edit: true,
        candidatos_approve: true,
        prestadores_view: true,
        prestadores_create: true,
        prestadores_edit: true,
        ordenes_view: true,
        ordenes_edit: true,
        certificados_view: true,
        certificados_create: true,
        certificados_edit: true,
        analistas_view: true,
        analistas_edit: true,
        reportes_view: true,
        reportes_generate: true
      }
    },
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  }
];

// Empresas mock
export const mockCompanies: Company[] = [
  {
    id: 'emp_001',
    name: 'Tecnología Avanzada S.A.S.',
    nit: '900123456-7',
    email: 'contacto@tecnoavanzada.com',
    phone: '3001234567',
    address: 'Calle 100 #15-23',
    city: 'Bogotá',
    contactPerson: 'María Rodriguez',
    isActive: true,
    createdAt: new Date('2025-01-01')
  },
  {
    id: 'emp_002',
    name: 'Constructora del Valle Ltda.',
    nit: '890234567-8',
    email: 'info@constructoravalle.com',
    phone: '3002345678',
    address: 'Avenida 6N #25-45',
    city: 'Cali',
    contactPerson: 'Carlos Méndez',
    isActive: true,
    createdAt: new Date('2025-01-01')
  },
  {
    id: 'emp_003',
    name: 'Servicios Médicos Integrales',
    nit: '800345678-9',
    email: 'servicios@medintegrales.com',
    phone: '3003456789',
    address: 'Carrera 45 #67-89',
    city: 'Medellín',
    contactPerson: 'Ana Jiménez',
    isActive: true,
    createdAt: new Date('2025-01-01')
  }
];

// Usuarios de empresas mock
export const mockCompanyUsers: CompanyUser[] = [
  {
    id: 'user_001',
    companyId: 'emp_001',
    email: 'usuario@tecnoavanzada.com',
    tempPassword: 'TempPass123!',
    profileId: 'empresa_basico',
    mustChangePassword: true,
    isActive: true,
    createdAt: new Date('2025-01-01')
  },
  {
    id: 'user_002',
    companyId: 'emp_002',
    email: 'admin@constructoravalle.com',
    tempPassword: 'TempPass456!',
    profileId: 'empresa_basico',
    mustChangePassword: true,
    isActive: true,
    createdAt: new Date('2025-01-01')
  }
];

// Función para obtener acciones por vista
export const getActionsByView = (viewId: string): ViewAction[] => {
  return mockViewActions.filter(action => action.viewId === viewId);
};

// Función para obtener vistas por módulo
export const getViewsByModule = () => {
  return mockSystemViews.reduce((acc, view) => {
    if (!acc[view.module]) {
      acc[view.module] = [];
    }
    acc[view.module].push(view);
    return acc;
  }, {} as Record<string, SystemView[]>);
};

// Función para validar permisos
export const hasPermission = (profile: UserProfile, viewId: string, actionId?: string): boolean => {
  const hasViewPermission = profile.permissions.viewPermissions[viewId] === true;
  if (!actionId) return hasViewPermission;
  
  const hasActionPermission = profile.permissions.actionPermissions[actionId] === true;
  return hasViewPermission && hasActionPermission;
};

// Función para generar contraseña temporal
export const generateTempPassword = (): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};
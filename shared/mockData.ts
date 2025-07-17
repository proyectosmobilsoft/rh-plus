// Mock data centralizado para toda la aplicación
// No requiere conexión a base de datos

export interface MockEmpresa {
  id: number;
  nombre: string;
  nit: string;
  email: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  activo: boolean;
}

export interface MockUsuario {
  id: number;
  identificacion: string;
  primerNombre: string;
  segundoNombre?: string;
  primerApellido: string;
  segundoApellido?: string;
  telefono?: string;
  email: string;
  username: string;
  password: string;
  activo: boolean;
  fechaCreacion: string;
  perfiles: Array<{
    id: number;
    nombre: string;
    descripcion?: string;
  }>;
}

export interface MockCandidato {
  id: number;
  identificacion: string;
  tipoDocumento: string;
  nombre: string;
  apellido: string;
  telefono: string;
  correo: string;
  empresa: string;
  ciudad: string;
  direccion: string;
  empresaId?: number;
  estado?: string;
  fechaRegistro?: string;
  progreso?: number;
}

export interface MockPerfil {
  id: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  permisos?: string;
  fechaCreacion?: string;
}

export interface MockAnalista {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  regional: string;
  clienteAsignado: string;
  nivelPrioridad: string;
  estado: number;
  fechaIngreso: string;
}

// DATOS MOCK - EMPRESAS
export const empresas: MockEmpresa[] = [
  {
    id: 1,
    nombre: "Empresa ABC",
    nit: "900123456-1",
    email: "info@empresaabc.com",
    telefono: "3101234567",
    direccion: "Calle 123 #45-67",
    ciudad: "Bogotá",
    activo: true
  },
  {
    id: 2,
    nombre: "Industrial XYZ",
    nit: "900789123-2",
    email: "contacto@industrialxyz.com",
    telefono: "3209876543",
    direccion: "Carrera 45 #23-89",
    ciudad: "Medellín",
    activo: true
  },
  {
    id: 3,
    nombre: "Servicios 123",
    nit: "900456789-3",
    email: "admin@servicios123.com",
    telefono: "3112345678",
    direccion: "Avenida 67 #12-34",
    ciudad: "Cali",
    activo: true
  },
  {
    id: 4,
    nombre: "Tecnología Avanzada",
    nit: "900654321-4",
    email: "info@tecavanzada.com",
    telefono: "3156789012",
    direccion: "Diagonal 89 #56-78",
    ciudad: "Barranquilla",
    activo: true
  },
  {
    id: 5,
    nombre: "Construcciones del Norte",
    nit: "900987654-5",
    email: "construcciones@norte.com",
    telefono: "3187654321",
    direccion: "Transversal 34 #67-90",
    ciudad: "Bucaramanga",
    activo: true
  }
];

// DATOS MOCK - PERFILES
export const perfiles: MockPerfil[] = [
  {
    id: 1,
    nombre: "Administrador",
    descripcion: "Perfil con acceso completo al sistema",
    activo: true,
    permisos: JSON.stringify([
      {"viewId": "001", "viewName": "Dashboard", "actions": ["dashboard_view", "dashboard_export"]},
      {"viewId": "002", "viewName": "Usuarios", "actions": ["usuarios_view", "usuarios_create", "usuarios_edit", "usuarios_delete"]},
      {"viewId": "003", "viewName": "Perfiles", "actions": ["perfiles_view", "perfiles_create", "perfiles_edit", "perfiles_delete"]},
      {"viewId": "004", "viewName": "Candidatos", "actions": ["candidatos_view", "candidatos_create", "candidatos_edit", "candidatos_delete"]},
      {"viewId": "005", "viewName": "Empresas", "actions": ["empresas_view", "empresas_create", "empresas_edit", "empresas_delete"]}
    ]),
    fechaCreacion: "2025-01-01T00:00:00.000Z"
  },
  {
    id: 2,
    nombre: "Coordinador",
    descripcion: "Perfil para coordinadores de procesos",
    activo: true,
    permisos: JSON.stringify([
      {"viewId": "001", "viewName": "Dashboard", "actions": ["dashboard_view"]},
      {"viewId": "004", "viewName": "Candidatos", "actions": ["candidatos_view", "candidatos_edit"]},
      {"viewId": "005", "viewName": "Empresas", "actions": ["empresas_view"]}
    ]),
    fechaCreacion: "2025-01-01T00:00:00.000Z"
  },
  {
    id: 3,
    nombre: "Analista",
    descripcion: "Perfil para analistas de recursos humanos",
    activo: true,
    permisos: JSON.stringify([
      {"viewId": "001", "viewName": "Dashboard", "actions": ["dashboard_view"]},
      {"viewId": "004", "viewName": "Candidatos", "actions": ["candidatos_view", "candidatos_create"]}
    ]),
    fechaCreacion: "2025-01-01T00:00:00.000Z"
  }
];

// DATOS MOCK - USUARIOS
export const usuarios: MockUsuario[] = [
  {
    id: 1,
    identificacion: "12345678",
    primerNombre: "Admin",
    primerApellido: "Sistema",
    email: "admin@sistema.com",
    username: "admin",
    password: "admin123",
    activo: true,
    fechaCreacion: "2025-01-01T00:00:00.000Z",
    perfiles: [perfiles[0]] // Administrador
  },
  {
    id: 2,
    identificacion: "87654321",
    primerNombre: "María",
    segundoNombre: "Isabel",
    primerApellido: "González",
    segundoApellido: "López",
    telefono: "3101234567",
    email: "maria@empresa.com",
    username: "mgonzalez",
    password: "temp123",
    activo: true,
    fechaCreacion: "2025-01-02T00:00:00.000Z",
    perfiles: [perfiles[1]] // Coordinador
  },
  {
    id: 3,
    identificacion: "11223344",
    primerNombre: "Carlos",
    primerApellido: "Rodríguez",
    telefono: "3209876543",
    email: "carlos@empresa.com",
    username: "crodriguez",
    password: "temp123",
    activo: true,
    fechaCreacion: "2025-01-03T00:00:00.000Z",
    perfiles: [perfiles[2]] // Analista
  },
  {
    id: 4,
    identificacion: "55667788",
    primerNombre: "Ana",
    segundoNombre: "Lucía",
    primerApellido: "Martínez",
    segundoApellido: "Jiménez",
    telefono: "3112345678",
    email: "ana@empresa.com",
    username: "amartinez",
    password: "temp123",
    activo: true,
    fechaCreacion: "2025-01-04T00:00:00.000Z",
    perfiles: [perfiles[1]] // Coordinador
  },
  {
    id: 5,
    identificacion: "1001882274",
    primerNombre: "Jhon",
    segundoNombre: "jairo",
    primerApellido: "ravelo",
    segundoApellido: "Mora",
    telefono: "3005342964",
    email: "jhon@gmail.com",
    username: "ravelo",
    password: "M0rj7j7**",
    activo: true,
    fechaCreacion: "2025-01-17T21:17:28.356Z",
    perfiles: [perfiles[0]] // Administrador
  }
];

// DATOS MOCK - CANDIDATOS
export const candidatos: MockCandidato[] = [
  {
    id: 1,
    identificacion: "1234567890",
    tipoDocumento: "CC",
    nombre: "Juan",
    apellido: "Pérez",
    telefono: "3101234567",
    correo: "juan@ejemplo.com",
    empresa: "Empresa ABC",
    ciudad: "Bogotá",
    direccion: "Calle 123",
    empresaId: 1,
    estado: "activo",
    fechaRegistro: "2025-01-10T00:00:00.000Z",
    progreso: 75
  },
  {
    id: 2,
    identificacion: "0987654321",
    tipoDocumento: "CE",
    nombre: "María",
    apellido: "González",
    telefono: "3209876543",
    correo: "maria@ejemplo.com",
    empresa: "Industrial XYZ",
    ciudad: "Medellín",
    direccion: "Carrera 45",
    empresaId: 2,
    estado: "pendiente",
    fechaRegistro: "2025-01-11T00:00:00.000Z",
    progreso: 40
  },
  {
    id: 3,
    identificacion: "5678901234",
    tipoDocumento: "TI",
    nombre: "Carlos",
    apellido: "Rodríguez",
    telefono: "3112345678",
    correo: "carlos@ejemplo.com",
    empresa: "Servicios 123",
    ciudad: "Cali",
    direccion: "Avenida 67",
    empresaId: 3,
    estado: "completado",
    fechaRegistro: "2025-01-12T00:00:00.000Z",
    progreso: 100
  },
  {
    id: 4,
    identificacion: "1122334455",
    tipoDocumento: "CC",
    nombre: "Ana",
    apellido: "Martínez",
    telefono: "3156789012",
    correo: "ana@ejemplo.com",
    empresa: "Tecnología Avanzada",
    ciudad: "Barranquilla",
    direccion: "Diagonal 89",
    empresaId: 4,
    estado: "activo",
    fechaRegistro: "2025-01-13T00:00:00.000Z",
    progreso: 60
  },
  {
    id: 5,
    identificacion: "9988776655",
    tipoDocumento: "CC",
    nombre: "Luis",
    apellido: "Ramírez",
    telefono: "3187654321",
    correo: "luis@ejemplo.com",
    empresa: "Construcciones del Norte",
    ciudad: "Bucaramanga",
    direccion: "Transversal 34",
    empresaId: 5,
    estado: "inactivo",
    fechaRegistro: "2025-01-14T00:00:00.000Z",
    progreso: 20
  }
];

// DATOS MOCK - ANALISTAS
export const analistas: MockAnalista[] = [
  {
    id: 1,
    nombre: "Pedro",
    apellido: "García",
    email: "pedro@empresa.com",
    telefono: "3101111111",
    regional: "Bogotá",
    clienteAsignado: "Empresa ABC",
    nivelPrioridad: "alto",
    estado: 1,
    fechaIngreso: "2025-01-01"
  },
  {
    id: 2,
    nombre: "Sandra",
    apellido: "López",
    email: "sandra@empresa.com",
    telefono: "3202222222",
    regional: "Medellín",
    clienteAsignado: "Industrial XYZ",
    nivelPrioridad: "medio",
    estado: 1,
    fechaIngreso: "2025-01-02"
  },
  {
    id: 3,
    nombre: "Andrés",
    apellido: "Moreno",
    email: "andres@empresa.com",
    telefono: "3113333333",
    regional: "Cali",
    clienteAsignado: "Servicios 123",
    nivelPrioridad: "bajo",
    estado: 1,
    fechaIngreso: "2025-01-03"
  },
  {
    id: 4,
    nombre: "Carmen",
    apellido: "Ruiz",
    email: "carmen@empresa.com",
    telefono: "3154444444",
    regional: "Barranquilla",
    clienteAsignado: "Tecnología Avanzada",
    nivelPrioridad: "alto",
    estado: 1,
    fechaIngreso: "2025-01-04"
  }
];

// FUNCIONES HELPER PARA SIMULACIÓN DE API
export const getMockData = {
  // Usuarios
  getAllUsers: () => usuarios,
  getUserById: (id: number) => usuarios.find(u => u.id === id),
  getUserByUsername: (username: string) => usuarios.find(u => u.username === username),
  
  // Perfiles
  getAllPerfiles: () => perfiles,
  getPerfilById: (id: number) => perfiles.find(p => p.id === id),
  
  // Candidatos
  getAllCandidatos: () => candidatos,
  getCandidatoById: (id: number) => candidatos.find(c => c.id === id),
  getCandidatosByEmpresa: (empresaId: number) => candidatos.filter(c => c.empresaId === empresaId),
  
  // Empresas
  getAllEmpresas: () => empresas,
  getEmpresaById: (id: number) => empresas.find(e => e.id === id),
  
  // Analistas
  getAllAnalistas: () => analistas,
  getAnalistaById: (id: number) => analistas.find(a => a.id === id)
};

// Contadores para IDs automáticos
export let nextUserId = Math.max(...usuarios.map(u => u.id)) + 1;
export let nextCandidatoId = Math.max(...candidatos.map(c => c.id)) + 1;
export let nextEmpresaId = Math.max(...empresas.map(e => e.id)) + 1;
export let nextPerfilId = Math.max(...perfiles.map(p => p.id)) + 1;
export let nextAnalistaId = Math.max(...analistas.map(a => a.id)) + 1;

// Funciones para incrementar IDs
export const getNextId = {
  user: () => nextUserId++,
  candidato: () => nextCandidatoId++,
  empresa: () => nextEmpresaId++,
  perfil: () => nextPerfilId++,
  analista: () => nextAnalistaId++
};
import bcrypt from "bcrypt";
import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://clffvmueangquavnaokd.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsZmZ2bXVlYW5ncXVhdm5hb2tkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NTgzMTcsImV4cCI6MjA2OTAzNDMxN30.NyUOwOMmJgpWqz5FRSV52EELCaEMkrHTLWd5JDw3ZiU';
const supabase = createClient(supabaseUrl, supabaseKey);

import {
  users,
  candidatos,
  perfiles,
  userPerfiles,
  empresas,
  clientes,
  tiposCandidatos,
  documentosTipo,
  tiposCandidatosDocumentos,
  candidatosDocumentos,
  menuNodes,
  menuPermissions,
  menuActions,
  perfilMenus,
  perfilAcciones,
  analistas,
  systemViews,
  viewActions,
  profileViewPermissions,
  profileActionPermissions,
  empresaOrderTemplates,
  type User,
  type InsertUser,
  type UserPerfil,
  type InsertUserPerfil,
  type Candidato,
  type InsertCandidato,
  type Perfil,
  type InsertPerfil,
  type CreateCandidatoFromPerfil,
  type Empresa,
  type InsertEmpresa,
  type CreateEmpresa,
  type Cliente,
  type InsertCliente,
  type CreateCliente,
  type TipoCandidato,
  type InsertTipoCandidato,
  type DocumentoTipo,
  type InsertDocumentoTipo,
  type TipoCandidatoDocumento,
  type InsertTipoCandidatoDocumento,
  type CandidatoDocumento,
  type InsertCandidatoDocumento,
  type MenuNode,
  type InsertMenuNode,
  type MenuPermission,
  type InsertMenuPermission,
  type MenuAction,
  type InsertMenuAction,
  type PerfilMenu,
  type InsertPerfilMenu,
  type PerfilAccion,
  type SystemView,
  type InsertSystemView,
  type ViewAction,
  type InsertViewAction,
  type ProfileViewPermission,
  type InsertProfileViewPermission,
  type ProfileActionPermission,
  type InsertProfileActionPermission,
  type ViewWithActions,
  type ProfilePermissions,
  type InsertPerfilAccion,
  type Analista,
  type InsertAnalista,
  // Nuevos imports para reportes
  ordenes,
  ordenesHistorial,
  notificaciones,
  alertas,
  metricas,
  type Orden,
  type InsertOrden,
  type OrdenHistorial,
  type InsertOrdenHistorial,
  type Notificacion,
  type InsertNotificacion,
  type Alerta,
  type InsertAlerta,
  type Metrica,
  type InsertMetrica,
  passwordResetTokens,
  type PasswordResetToken,
  type InsertPasswordResetToken,
  type EmpresaOrderTemplate,
  type InsertEmpresaOrderTemplate,
  type TemplateFieldConfig,
} from "@shared/schema";

export interface IStorage {
  // Admin user operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  deleteUser(id: number): Promise<void>;
  
  // User-Profile relationship operations
  getUserPerfiles(userId: number): Promise<Perfil[]>;
  createUserPerfil(userPerfil: InsertUserPerfil): Promise<UserPerfil>;
  deleteUserPerfiles(userId: number): Promise<void>;
  createUserWithPerfiles(userData: InsertUser, perfilIds: number[]): Promise<{ user: User; perfiles: Perfil[] }>;

  // Perfil operations
  getAllPerfiles(): Promise<Perfil[]>;
  getPerfilById(id: number): Promise<Perfil | undefined>;
  getPerfilByNombre(nombre: string): Promise<Perfil | undefined>;
  createPerfil(perfil: InsertPerfil): Promise<Perfil>;
  updatePerfil(id: number, perfil: Partial<InsertPerfil>): Promise<Perfil>;
  deletePerfil(id: number): Promise<void>;

  // Candidato operations
  getCandidato(id: number): Promise<Candidato | undefined>;
  getCandidatoByEmail(email: string): Promise<Candidato | undefined>;
  getAllCandidatos(): Promise<Candidato[]>;
  createCandidato(candidato: InsertCandidato): Promise<Candidato>;
  updateCandidato(
    id: number,
    candidato: Partial<InsertCandidato>,
  ): Promise<Candidato>;

  // Operaciones especiales para crear candidatos desde perfiles
  createCandidatoFromPerfil(
    data: CreateCandidatoFromPerfil,
  ): Promise<Candidato>;

  // Empresa operations
  getEmpresa(id: number): Promise<Empresa | undefined>;
  getEmpresaByEmail(email: string): Promise<Empresa | undefined>;
  getAllEmpresas(): Promise<Empresa[]>;
  createEmpresa(empresa: InsertEmpresa): Promise<Empresa>;
  updateEmpresa(id: number, empresa: Partial<InsertEmpresa>): Promise<Empresa>;

  // Candidatos por empresa (para portal de empresas)
  getCandidatosByEmpresa(empresaId: number): Promise<Candidato[]>;
  createCandidatoForEmpresa(
    candidato: InsertCandidato,
    empresaId: number,
  ): Promise<Candidato>;
  updateCandidatoApproval(
    candidatoId: number,
    estado: string,
    notasAprobacion?: string,
  ): Promise<Candidato>;

  // Maestro operations - Tipos de Candidatos
  getAllTiposCandidatos(): Promise<TipoCandidato[]>;
  getTipoCandidatoById(id: number): Promise<TipoCandidato | undefined>;
  createTipoCandidato(
    tipoCandidato: InsertTipoCandidato,
  ): Promise<TipoCandidato>;
  updateTipoCandidato(
    id: number,
    tipoCandidato: Partial<InsertTipoCandidato>,
  ): Promise<TipoCandidato>;
  deleteTipoCandidato(id: number): Promise<void>;

  // Maestro operations - Documentos Tipo
  getAllDocumentosTipo(): Promise<DocumentoTipo[]>;
  getDocumentoTipoById(id: number): Promise<DocumentoTipo | undefined>;
  createDocumentoTipo(
    documentoTipo: InsertDocumentoTipo,
  ): Promise<DocumentoTipo>;
  updateDocumentoTipo(
    id: number,
    documentoTipo: Partial<InsertDocumentoTipo>,
  ): Promise<DocumentoTipo>;
  deleteDocumentoTipo(id: number): Promise<void>;

  // Maestro operations - Relación Tipos-Documentos
  getDocumentosByTipoCandidato(
    tipoCandidatoId: number,
  ): Promise<TipoCandidatoDocumento[]>;
  updateDocumentosByTipoCandidato(
    tipoCandidatoId: number,
    documentos: InsertTipoCandidatoDocumento[],
  ): Promise<void>;

  // Candidatos Documentos
  getDocumentosByCandidato(candidatoId: number): Promise<CandidatoDocumento[]>;
  createCandidatoDocumento(
    candidatoDocumento: InsertCandidatoDocumento,
  ): Promise<CandidatoDocumento>;
  updateCandidatoDocumento(
    id: number,
    candidatoDocumento: Partial<InsertCandidatoDocumento>,
  ): Promise<CandidatoDocumento>;
  deleteCandidatoDocumento(id: number): Promise<void>;

  // Menu operations
  getAllMenuNodes(): Promise<MenuNode[]>;
  createMenuNode(menuNode: InsertMenuNode): Promise<MenuNode>;
  updateMenuNode(
    id: number,
    menuNode: Partial<InsertMenuNode>,
  ): Promise<MenuNode>;
  deleteMenuNode(id: number): Promise<void>;

  // Menu permissions operations
  getMenuPermissionByNodeId(
    nodeId: number,
  ): Promise<MenuPermission | undefined>;
  createMenuPermission(
    permission: InsertMenuPermission,
  ): Promise<MenuPermission>;
  updateMenuPermission(
    id: number,
    permission: Partial<InsertMenuPermission>,
  ): Promise<MenuPermission>;
  deleteMenuPermission(id: number): Promise<void>;

  // Menu actions operations
  getMenuActionsByPermissionId(permissionId: number): Promise<MenuAction[]>;
  createMenuAction(action: InsertMenuAction): Promise<MenuAction>;
  deleteMenuAction(id: number): Promise<void>;
  // Analistas operations
  getAllAnalistas(): Promise<Analista[]>;
  getAnalistaById(id: number): Promise<Analista | undefined>;
  getAnalistaByEmail(email: string): Promise<Analista | undefined>;
  createAnalista(analista: InsertAnalista): Promise<Analista>;
  updateAnalista(
    id: number,
    analista: Partial<InsertAnalista>,
  ): Promise<Analista>;
  deleteAnalista(id: number): Promise<void>;

  // Clientes operations
  getAllClientes(): Promise<Cliente[]>;
  getClienteById(id: number): Promise<Cliente | undefined>;
  getClienteByEmail(email: string): Promise<Cliente | undefined>;
  createCliente(cliente: InsertCliente): Promise<Cliente>;
  updateCliente(id: number, cliente: Partial<InsertCliente>): Promise<Cliente>;
  deleteCliente(id: number): Promise<void>;

  // Perfil menus and actions operations
  createPerfilMenu(perfilMenu: InsertPerfilMenu): Promise<PerfilMenu>;
  deletePerfilMenusByPerfilId(perfilId: number): Promise<void>;
  createPerfilAccion(perfilAccion: InsertPerfilAccion): Promise<PerfilAccion>;
  deletePerfilAccionesByPerfilMenuId(perfilMenuId: number): Promise<void>;
  getPerfilMenusByPerfilId(perfilId: number): Promise<PerfilMenu[]>;
  getPerfilAccionesByPerfilMenuId(perfilMenuId: number): Promise<PerfilAccion[]>;

  // Operaciones de órdenes
  getAllOrdenes(): Promise<Orden[]>;
  getOrdenById(id: number): Promise<Orden | undefined>;
  getOrdenesByCliente(clienteId: number): Promise<Orden[]>;
  getOrdenesByAnalista(analistaId: number): Promise<Orden[]>;
  createOrden(orden: InsertOrden): Promise<Orden>;
  updateOrden(id: number, orden: Partial<InsertOrden>): Promise<Orden>;
  deleteOrden(id: number): Promise<void>;

  // Operaciones de historial de órdenes
  getHistorialByOrden(ordenId: number): Promise<OrdenHistorial[]>;
  createHistorialEntry(historial: InsertOrdenHistorial): Promise<OrdenHistorial>;

  // Operaciones de notificaciones
  getAllNotificaciones(): Promise<Notificacion[]>;
  getNotificacionesByOrden(ordenId: number): Promise<Notificacion[]>;
  createNotificacion(notificacion: InsertNotificacion): Promise<Notificacion>;
  updateNotificacionEstado(id: number, estado: string, motivoFallo?: string): Promise<Notificacion>;

  // Operaciones de alertas
  getAllAlertas(): Promise<Alerta[]>;
  getAlertasActivas(): Promise<Alerta[]>;
  createAlerta(alerta: InsertAlerta): Promise<Alerta>;
  resolverAlerta(id: number): Promise<Alerta>;

  // Operaciones de métricas y reportes
  getMetricasByFecha(fecha: Date): Promise<Metrica[]>;
  getMetricasByAnalista(analistaId: number, fechaInicio: Date, fechaFin: Date): Promise<Metrica[]>;
  createMetrica(metrica: InsertMetrica): Promise<Metrica>;
  updateMetrica(id: number, metrica: Partial<InsertMetrica>): Promise<Metrica>;

  // Reportes específicos
  getDashboardData(): Promise<{
    ordenesTotales: number;
    ordenesHoy: number;
    ordenesEnProceso: number;
    alertasActivas: number;
    leadTimePromedio: number;
    ordenesPorEstado: { estado: string; cantidad: number }[];
    ordenesPorAnalista: { analista: string; cantidad: number }[];
  }>;
  
  getLeadTimeByAnalista(): Promise<{
    analistaId: number;
    nombre: string;
    ordenesAbiertas: number;
    ordenesCerradas: number;
    leadTimePromedio: number;
  }[]>;

  // Operaciones de tokens de recuperación de contraseña
  createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markTokenAsUsed(id: number): Promise<void>;
  cleanExpiredTokens(): Promise<void>;

  // Métodos adicionales para recuperación de contraseñas
  getEmpresaById(id: number): Promise<Empresa | undefined>;
  getEmpresaByEmail(email: string): Promise<Empresa | undefined>;
  getCandidatoById(id: number): Promise<Candidato | undefined>;
  updateEmpresaPassword(id: number, hashedPassword: string): Promise<void>;
  updateCandidatoPassword(id: number, hashedPassword: string): Promise<void>;

  // ========== SISTEMA DE PERMISOS DINÁMICOS ==========
  
  // System Views operations
  getAllSystemViews(): Promise<SystemView[]>;
  getSystemViewById(id: number): Promise<SystemView | undefined>;
  getSystemViewByNombre(nombre: string): Promise<SystemView | undefined>;
  createSystemView(view: InsertSystemView): Promise<SystemView>;
  updateSystemView(id: number, view: Partial<InsertSystemView>): Promise<SystemView>;
  deleteSystemView(id: number): Promise<void>;

  // View Actions operations
  getActionsByViewId(viewId: number): Promise<ViewAction[]>;
  getAllViewActions(): Promise<ViewAction[]>;
  getViewActionById(id: number): Promise<ViewAction | undefined>;
  createViewAction(action: InsertViewAction): Promise<ViewAction>;
  updateViewAction(id: number, action: Partial<InsertViewAction>): Promise<ViewAction>;
  deleteViewAction(id: number): Promise<void>;

  // Profile View Permissions operations
  getViewPermissionsByPerfilId(perfilId: number): Promise<ProfileViewPermission[]>;
  createProfileViewPermission(permission: InsertProfileViewPermission): Promise<ProfileViewPermission>;
  deleteViewPermissionsByPerfilId(perfilId: number): Promise<void>;

  // Profile Action Permissions operations
  getActionPermissionsByPerfilId(perfilId: number): Promise<ProfileActionPermission[]>;
  createProfileActionPermission(permission: InsertProfileActionPermission): Promise<ProfileActionPermission>;
  deleteActionPermissionsByPerfilId(perfilId: number): Promise<void>;

  // Combined operations
  getViewsWithActionsByPerfilId(perfilId: number): Promise<ViewWithActions[]>;
  getProfilePermissions(perfilId: number): Promise<ProfilePermissions>;
  hasViewPermission(perfilId: number, viewNombre: string): Promise<boolean>;
  hasActionPermission(perfilId: number, viewNombre: string, actionNombre: string): Promise<boolean>;
  
  // Bulk permission management
  updateProfilePermissions(perfilId: number, permissions: {
    vistas: Array<{ vistaId: number; acciones: number[] }>;
  }): Promise<void>;

  // Initialize system views and actions
  initializeSystemViewsAndActions(): Promise<void>;

  // Order template operations
  getEmpresaOrderTemplates(empresaId: number): Promise<EmpresaOrderTemplate[]>;
  getEmpresaOrderTemplate(id: number): Promise<EmpresaOrderTemplate | undefined>;
  getDefaultEmpresaOrderTemplate(empresaId: number): Promise<EmpresaOrderTemplate | undefined>;
  createEmpresaOrderTemplate(template: InsertEmpresaOrderTemplate): Promise<EmpresaOrderTemplate>;
  updateEmpresaOrderTemplate(id: number, template: Partial<InsertEmpresaOrderTemplate>): Promise<EmpresaOrderTemplate>;
  deleteEmpresaOrderTemplate(id: number): Promise<void>;
  setDefaultEmpresaOrderTemplate(empresaId: number, templateId: number): Promise<void>;

  // Database user authentication methods
  getUsuarioByEmailOrUsername(identifier: string): Promise<any>;
  verifyUserPassword(userId: number, password: string): Promise<boolean>;
  verifyUserEmpresaAccess(userId: number, empresaId: number): Promise<boolean>;
  
  // Métodos para ubicaciones
  getAllPaises(): Promise<any[]>;
  createPais(data: { nombre: string }): Promise<any>;
  getAllDepartamentos(): Promise<any[]>;
  createDepartamento(data: { nombre: string; pais_id: number }): Promise<any>;
  getAllCiudades(): Promise<any[]>;
  createCiudad(data: { nombre: string; departamento_id: number; pais_id: number }): Promise<any>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private userPerfiles: Map<number, UserPerfil>;
  private candidatos: Map<number, Candidato>;
  private perfiles: Map<number, Perfil>;
  private empresas: Map<number, Empresa>;
  private clientes: Map<number, Cliente>;
  private tiposCandidatos: Map<number, TipoCandidato>;
  private documentosTipo: Map<number, DocumentoTipo>;
  private tiposCandidatosDocumentos: Map<number, TipoCandidatoDocumento>;
  private candidatosDocumentos: Map<number, CandidatoDocumento>;

  private menuNodes: Map<number, MenuNode>;
  private menuPermissions: Map<number, MenuPermission>;
  private menuActions: Map<number, MenuAction>;
  private perfilMenus: Map<number, PerfilMenu>;
  private perfilAcciones: Map<number, PerfilAccion>;
  private analistas: Map<number, Analista>;

  // Sistema de permisos dinámicos
  private systemViews: Map<number, SystemView>;
  private viewActions: Map<number, ViewAction>;
  private profileViewPermissions: Map<number, ProfileViewPermission>;
  private profileActionPermissions: Map<number, ProfileActionPermission>;
  
  // Nuevas tablas para reportes
  private ordenes: Map<number, Orden>;
  private ordenesHistorial: Map<number, OrdenHistorial>;
  private notificaciones: Map<number, Notificacion>;
  private alertas: Map<number, Alerta>;
  private metricas: Map<number, Metrica>;
  
  // Tokens de recuperación de contraseña
  private passwordResetTokens: Map<number, PasswordResetToken>;

  // Plantillas de orden por empresa
  private empresaOrderTemplates: Map<number, EmpresaOrderTemplate>;

  currentUserId: number;
  currentUserPerfilId: number;
  currentCandidatoId: number;
  currentPerfilId: number;
  currentEmpresaId: number;
  currentClienteId: number;
  currentTipoCandidatoId: number;
  currentDocumentoTipoId: number;
  currentTipoCandidatoDocumentoId: number;
  currentCandidatoDocumentoId: number;
  currentMenuNodeId: number;
  currentMenuPermissionId: number;
  currentMenuActionId: number;
  currentPerfilMenuId: number;
  currentPerfilAccionId: number;
  currentAnalistaId: number;
  currentOrdenId: number;
  currentHistorialId: number;
  currentNotificacionId: number;
  currentAlertaId: number;
  currentMetricaId: number;
  currentPasswordResetTokenId: number;
  currentEmpresaOrderTemplateId: number;
  
  // Contadores para sistema de permisos dinámicos
  currentSystemViewId: number;
  currentViewActionId: number;
  currentProfileViewPermissionId: number;
  currentProfileActionPermissionId: number;

  constructor() {
    this.users = new Map();
    this.userPerfiles = new Map();
    this.candidatos = new Map();
    this.perfiles = new Map();
    this.empresas = new Map();
    this.clientes = new Map();
    this.tiposCandidatos = new Map();
    this.documentosTipo = new Map();
    this.tiposCandidatosDocumentos = new Map();
    this.candidatosDocumentos = new Map();
    this.menuNodes = new Map();
    this.menuPermissions = new Map();
    this.menuActions = new Map();
    this.perfilMenus = new Map();
    this.perfilAcciones = new Map();
    this.analistas = new Map();
    
    // Inicializar las nuevas Maps para reportes
    this.ordenes = new Map();
    this.ordenesHistorial = new Map();
    this.notificaciones = new Map();
    this.alertas = new Map();
    this.metricas = new Map();
    this.passwordResetTokens = new Map();
    this.empresaOrderTemplates = new Map();

    // Inicializar Maps del sistema de permisos dinámicos
    this.systemViews = new Map();
    this.viewActions = new Map();
    this.profileViewPermissions = new Map();
    this.profileActionPermissions = new Map();
    
    this.currentUserId = 1;
    this.currentUserPerfilId = 1;
    this.currentCandidatoId = 1;
    this.currentPerfilId = 1;
    this.currentEmpresaId = 1;
    this.currentClienteId = 1;
    this.currentTipoCandidatoId = 1;
    this.currentDocumentoTipoId = 1;
    this.currentTipoCandidatoDocumentoId = 1;
    this.currentCandidatoDocumentoId = 1;
    this.currentMenuNodeId = 1;
    this.currentMenuPermissionId = 1;
    this.currentMenuActionId = 1;
    this.currentPerfilMenuId = 1;
    this.currentPerfilAccionId = 1;
    this.currentAnalistaId = 1;
    this.currentOrdenId = 1;
    this.currentHistorialId = 1;
    this.currentNotificacionId = 1;
    this.currentAlertaId = 1;
    this.currentMetricaId = 1;
    this.currentPasswordResetTokenId = 1;
    this.currentEmpresaOrderTemplateId = 1;
    
    // Inicializar contadores del sistema de permisos dinámicos
    this.currentSystemViewId = 1;
    this.currentViewActionId = 1;
    this.currentProfileViewPermissionId = 1;
    this.currentProfileActionPermissionId = 1;

    // Agregar datos de muestra para el dashboard
    this.initializeSampleData();
    
    // Inicializar vistas y acciones del sistema
    this.initializeSystemViewsAndActions();
    
    // Hash passwords after construction
    this.hashPasswordsAfterInit();

    // Create default profiles
    // Perfiles se manejan ahora por base de datos
    this.currentPerfilId = 1;

    // Create default admin user
    this.users.set(1, {
      id: 1,
      identificacion: "12345678",
      primerNombre: "Administrador",
      segundoNombre: null,
      primerApellido: "Principal",
      segundoApellido: null,
      telefono: "555-0000",
      email: "admin@sistema.com",
      username: "admin",
      password: "admin123",
      fechaCreacion: new Date(),
      activo: true,
    });

    // Create additional sample users
    this.users.set(2, {
      id: 2,
      identificacion: "87654321",
      primerNombre: "María",
      segundoNombre: "Isabel",
      primerApellido: "González",
      segundoApellido: "Torres",
      telefono: "300-123-4567",
      email: "maria.gonzalez@empresa.com",
      username: "mgonzalez",
      password: "password123",
      fechaCreacion: new Date(),
      activo: true,
    });

    this.users.set(3, {
      id: 3,
      identificacion: "11223344",
      primerNombre: "Carlos",
      segundoNombre: null,
      primerApellido: "Rodríguez",
      segundoApellido: "Pérez",
      telefono: "301-987-6543",
      email: "carlos.rodriguez@empresa.com",
      username: "crodriguez",
      password: "secure456",
      fechaCreacion: new Date(),
      activo: true,
    });

    this.users.set(4, {
      id: 4,
      identificacion: "55667788",
      primerNombre: "Ana",
      segundoNombre: "Lucia",
      primerApellido: "Martínez",
      segundoApellido: "López",
      telefono: "302-555-7890",
      email: "ana.martinez@empresa.com",
      username: "amartinez",
      password: "admin789",
      fechaCreacion: new Date(),
      activo: false,
    });

    this.currentUserId = 5;

    // Create user-profile relationships
    this.userPerfiles.set(1, {
      id: 1,
      userId: 1,
      perfilId: 1,
      fechaCreacion: new Date(),
    });

    this.userPerfiles.set(2, {
      id: 2,
      userId: 2,
      perfilId: 1,
      fechaCreacion: new Date(),
    });

    this.userPerfiles.set(3, {
      id: 3,
      userId: 2,
      perfilId: 3,
      fechaCreacion: new Date(),
    });

    this.userPerfiles.set(4, {
      id: 4,
      userId: 3,
      perfilId: 3,
      fechaCreacion: new Date(),
    });

    this.userPerfiles.set(5, {
      id: 5,
      userId: 4,
      perfilId: 4,
      fechaCreacion: new Date(),
    });

    this.currentUserPerfilId = 6;

    // Create some test candidatos with plain passwords for now
    this.candidatos.set(1, {
      id: 1,
      email: "candidato1@ejemplo.com",
      password: "123456", // Will be hashed after construction
      deberCambiarPassword: false, // Ya cambió la contraseña
      perfilId: 2, // Perfil de candidato
      nombres: "Juan Carlos",
      apellidos: "Pérez González",
      tipoDocumento: "CC",
      numeroDocumento: "1234567890",
      fechaNacimiento: "1990-05-15",
      edad: 33,
      sexo: "Masculino",
      estadoCivil: "Soltero",
      telefono: "3101234567",
      direccion: "Calle 123 #45-67",
      ciudad: "Bogotá",
      cargoAspirado: "Desarrollador Full Stack",
      experienciaLaboral: null,
      eps: "Sanitas",
      arl: "SURA",
      fondoPension: "Porvenir",
      grupoSanguineo: "O+",
      nivelEducativo: "Universitario",
      educacion: null,
      contactoEmergenciaNombre: "María Pérez",
      contactoEmergenciaTelefono: "3109876543",
      contactoEmergenciaRelacion: "Madre",
      hojaDeVida: null,
      fotografia: null,
      fechaRegistro: new Date(),
      estado: "pendiente",
      notasAprobacion: null,
      completado: true,
      empresaId: null, // Candidato creado por admin, no por empresa
    });
    this.currentCandidatoId = 2;

    // Create example empresas
    this.empresas.set(1, {
      id: 1,
      email: "empresa1@ejemplo.com",
      password: "empresa123", // Will be hashed after construction
      nombreEmpresa: "TechCorp Solutions",
      nit: "9001234567",
      direccion: "Calle 100 #15-23, Piso 5",
      telefono: "6012345678",
      ciudad: "Bogotá",
      contactoPrincipal: "María González",
      cargoContacto: "Directora de Recursos Humanos",
      fechaRegistro: new Date(),
      estado: "activo",
    });

    this.empresas.set(2, {
      id: 2,
      email: "empresa2@ejemplo.com",
      password: "empresa456", // Will be hashed after construction
      nombreEmpresa: "Innovación Digital S.A.S",
      nit: "9007654321",
      direccion: "Carrera 50 #80-15",
      telefono: "6019876543",
      ciudad: "Medellín",
      contactoPrincipal: "Carlos Ramírez",
      cargoContacto: "Gerente General",
      fechaRegistro: new Date(),
      estado: "activo",
    });

    this.empresas.set(5, {
      id: 5,
      email: "empresa5@ejemplo.com",
      password: "empresa789", // Will be hashed after construction
      nombreEmpresa: "Desarrollo Web S.A.S",
      nit: "9001237890",
      direccion: "Calle 72 #10-15",
      telefono: "6015551234",
      ciudad: "Bogotá",
      contactoPrincipal: "Ana Martínez",
      cargoContacto: "Directora de Tecnología",
      fechaRegistro: new Date(),
      estado: "activo",
    });
    this.currentEmpresaId = 6;

    // Create default tipos de candidatos
    this.tiposCandidatos.set(1, {
      id: 1,
      nombre: "Ingeniero de Sistemas",
      descripcion: "Profesional en desarrollo de software y sistemas",
      activo: true,
      fechaCreacion: new Date(),
    });

    this.tiposCandidatos.set(2, {
      id: 2,
      nombre: "Diseñador Gráfico",
      descripcion: "Profesional en diseño visual y multimedia",
      activo: true,
      fechaCreacion: new Date(),
    });

    this.tiposCandidatos.set(3, {
      id: 3,
      nombre: "Contador",
      descripcion: "Profesional en contabilidad y finanzas",
      activo: true,
      fechaCreacion: new Date(),
    });

    this.currentTipoCandidatoId = 4;

    // Create default documentos tipo
    this.documentosTipo.set(1, {
      id: 1,
      nombre: "Hoja de Vida",
      descripcion: "Curriculum vitae actualizado",
      requerido: true,
      activo: true,
      fechaCreacion: new Date(),
    });

    this.documentosTipo.set(2, {
      id: 2,
      nombre: "Diploma Universitario",
      descripcion: "Titulo profesional universitario",
      requerido: false,
      activo: true,
      fechaCreacion: new Date(),
    });

    this.documentosTipo.set(3, {
      id: 3,
      nombre: "Certificaciones Técnicas",
      descripcion: "Certificados de cursos técnicos relevantes",
      requerido: false,
      activo: true,
      fechaCreacion: new Date(),
    });

    this.documentosTipo.set(4, {
      id: 4,
      nombre: "Portafolio",
      descripcion: "Muestra de trabajos realizados",
      requerido: false,
      activo: true,
      fechaCreacion: new Date(),
    });

    this.documentosTipo.set(5, {
      id: 5,
      nombre: "Certificado Laboral",
      descripcion: "Cartas de recomendación laboral",
      requerido: false,
      activo: true,
      fechaCreacion: new Date(),
    });

    this.currentDocumentoTipoId = 6;

    // Create default tipo-documento relationships
    // Ingeniero de Sistemas
    this.tiposCandidatosDocumentos.set(1, {
      id: 1,
      tipoCandidatoId: 1,
      documentoTipoId: 1, // Hoja de Vida
      obligatorio: true,
      orden: 1,
      fechaCreacion: new Date(),
    });

    this.tiposCandidatosDocumentos.set(2, {
      id: 2,
      tipoCandidatoId: 1,
      documentoTipoId: 2, // Diploma Universitario
      obligatorio: true,
      orden: 2,
      fechaCreacion: new Date(),
    });

    this.tiposCandidatosDocumentos.set(3, {
      id: 3,
      tipoCandidatoId: 1,
      documentoTipoId: 3, // Certificaciones Técnicas
      obligatorio: false,
      orden: 3,
      fechaCreacion: new Date(),
    });

    // Diseñador Gráfico
    this.tiposCandidatosDocumentos.set(4, {
      id: 4,
      tipoCandidatoId: 2,
      documentoTipoId: 1, // Hoja de Vida
      obligatorio: true,
      orden: 1,
      fechaCreacion: new Date(),
    });

    this.tiposCandidatosDocumentos.set(5, {
      id: 5,
      tipoCandidatoId: 2,
      documentoTipoId: 4, // Portafolio
      obligatorio: true,
      orden: 2,
      fechaCreacion: new Date(),
    });

    // Contador
    this.tiposCandidatosDocumentos.set(6, {
      id: 6,
      tipoCandidatoId: 3,
      documentoTipoId: 1, // Hoja de Vida
      obligatorio: true,
      orden: 1,
      fechaCreacion: new Date(),
    });

    this.tiposCandidatosDocumentos.set(7, {
      id: 7,
      tipoCandidatoId: 3,
      documentoTipoId: 2, // Diploma Universitario
      obligatorio: true,
      orden: 2,
      fechaCreacion: new Date(),
    });

    this.tiposCandidatosDocumentos.set(8, {
      id: 8,
      tipoCandidatoId: 3,
      documentoTipoId: 5, // Certificado Laboral
      obligatorio: true,
      orden: 3,
      fechaCreacion: new Date(),
    });

    this.currentTipoCandidatoDocumentoId = 9;
    this.currentCandidatoDocumentoId = 1;

    // Crear analistas de ejemplo
    this.analistas.set(1, {
      id: 1,
      nombre: "Ana María",
      apellido: "González",
      email: "ana.gonzalez@empresa.com",
      telefono: "300-555-0101",
      regional: "Bogotá",
      clienteAsignado: "TechCorp",
      nivelPrioridad: "alto",
      estado: "activo",
      fechaIngreso: new Date("2023-01-15"),
      fechaCreacion: new Date(),
      fechaActualizacion: new Date(),
    });

    this.analistas.set(2, {
      id: 2,
      nombre: "Carlos",
      apellido: "Rodríguez",
      email: "carlos.rodriguez@empresa.com",
      telefono: "301-555-0102",
      regional: "Medellín",
      clienteAsignado: "InnovateCorp",
      nivelPrioridad: "medio",
      estado: "activo",
      fechaIngreso: new Date("2023-03-20"),
      fechaCreacion: new Date(),
      fechaActualizacion: new Date(),
    });

    this.analistas.set(3, {
      id: 3,
      nombre: "Laura",
      apellido: "Martínez",
      email: "laura.martinez@empresa.com",
      telefono: "302-555-0103",
      regional: "Cali",
      clienteAsignado: null,
      nivelPrioridad: "bajo",
      estado: "activo",
      fechaIngreso: new Date("2023-06-10"),
      fechaCreacion: new Date(),
      fechaActualizacion: new Date(),
    });

    this.analistas.set(4, {
      id: 4,
      nombre: "Diego",
      apellido: "Pérez",
      email: "diego.perez@empresa.com",
      telefono: "303-555-0104",
      regional: "Barranquilla",
      clienteAsignado: "GlobalSolutions",
      nivelPrioridad: "alto",
      estado: "inactivo",
      fechaIngreso: new Date("2022-11-05"),
      fechaCreacion: new Date(),
      fechaActualizacion: new Date(),
    });

    this.currentAnalistaId = 5;

    // Crear clientes de ejemplo
    this.clientes.set(1, {
      id: 1,
      email: "maria.torres@techcorp.com",
      password: "12345678",
      nombreCompleto: "María Torres",
      empresa: "TechCorp",
      regional: "Bogotá",
      sucursal: "Centro",
      fechaRegistro: new Date("2023-02-10"),
      estado: "activo",
    });

    this.clientes.set(2, {
      id: 2,
      email: "carlos.herrera@innovate.com",
      password: "12345678",
      nombreCompleto: "Carlos Herrera",
      empresa: "InnovateCorp",
      regional: "Medellín",
      sucursal: "Norte",
      fechaRegistro: new Date("2023-04-15"),
      estado: "activo",
    });

    this.currentClienteId = 3;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      id,
      identificacion: insertUser.identificacion,
      primerNombre: insertUser.primerNombre,
      segundoNombre: insertUser.segundoNombre || null,
      primerApellido: insertUser.primerApellido,
      segundoApellido: insertUser.segundoApellido || null,
      telefono: insertUser.telefono || null,
      email: insertUser.email,
      username: insertUser.username,
      password: insertUser.password,
      fechaCreacion: new Date(),
      activo: insertUser.activo !== undefined ? insertUser.activo : true,
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updateData: Partial<InsertUser>): Promise<User> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }

    const updatedUser = { ...user, ...updateData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<void> {
    // Primero eliminar todas las relaciones usuario-perfil
    await this.deleteUserPerfiles(id);
    // Luego eliminar el usuario
    this.users.delete(id);
  }

  // User-Profile relationship operations
  async getUserPerfiles(userId: number): Promise<Perfil[]> {
    const userPerfiles = Array.from(this.userPerfiles.values()).filter(
      (up) => up.userId === userId
    );
    const perfiles: Perfil[] = [];
    for (const userPerfil of userPerfiles) {
      const perfil = this.perfiles.get(userPerfil.perfilId);
      if (perfil) {
        perfiles.push(perfil);
      }
    }
    return perfiles;
  }

  async createUserPerfil(userPerfil: InsertUserPerfil): Promise<UserPerfil> {
    const id = this.currentUserPerfilId++;
    const newUserPerfil: UserPerfil = {
      id,
      userId: userPerfil.userId,
      perfilId: userPerfil.perfilId,
      fechaAsignacion: new Date(),
    };
    this.userPerfiles.set(id, newUserPerfil);
    return newUserPerfil;
  }

  async deleteUserPerfiles(userId: number): Promise<void> {
    const userPerfiles = Array.from(this.userPerfiles.values()).filter(
      (up) => up.userId === userId
    );
    for (const userPerfil of userPerfiles) {
      this.userPerfiles.delete(userPerfil.id);
    }
  }

  async createUserWithPerfiles(userData: InsertUser, perfilIds: number[]): Promise<{ user: User; perfiles: Perfil[] }> {
    // Crear el usuario
    const user = await this.createUser(userData);
    
    // Crear las relaciones usuario-perfil
    const perfiles: Perfil[] = [];
    for (const perfilId of perfilIds) {
      await this.createUserPerfil({ userId: user.id, perfilId });
      const perfil = this.perfiles.get(perfilId);
      if (perfil) {
        perfiles.push(perfil);
      }
    }
    
    return { user, perfiles };
  }

  async getCandidato(id: number): Promise<Candidato | undefined> {
    return this.candidatos.get(id);
  }

  async getCandidatoByEmail(email: string): Promise<Candidato | undefined> {
    for (const candidato of this.candidatos.values()) {
      if (candidato.email === email) {
        return candidato;
      }
    }
    return undefined;
  }

  async getAllCandidatos(): Promise<Candidato[]> {
    return Array.from(this.candidatos.values());
  }

  async createCandidato(insertCandidato: InsertCandidato): Promise<Candidato> {
    const id = this.currentCandidatoId++;
    const candidato: Candidato = {
      id,
      tipoDocumento: insertCandidato.tipoDocumento,
      numeroDocumento: insertCandidato.numeroDocumento,
      nombres: insertCandidato.nombres,
      apellidos: insertCandidato.apellidos,
      email: insertCandidato.email,
      password: insertCandidato.password,
      telefono: insertCandidato.telefono || null,
      fechaNacimiento: insertCandidato.fechaNacimiento || null,
      edad: insertCandidato.edad || null,
      sexo: insertCandidato.sexo || null,
      estadoCivil: insertCandidato.estadoCivil || null,
      ciudad: insertCandidato.ciudad || null,
      direccion: insertCandidato.direccion || null,
      cargoAspirado: insertCandidato.cargoAspirado || null,
      eps: insertCandidato.eps || null,
      arl: insertCandidato.arl || null,
      fondoPension: insertCandidato.fondoPension || null,
      nivelEducativo: insertCandidato.nivelEducativo || null,
      grupoSanguineo: insertCandidato.grupoSanguineo || null,
      contactoEmergenciaNombre:
        insertCandidato.contactoEmergenciaNombre || null,
      contactoEmergenciaTelefono:
        insertCandidato.contactoEmergenciaTelefono || null,
      contactoEmergenciaRelacion:
        insertCandidato.contactoEmergenciaRelacion || null,
      deberCambiarPassword: insertCandidato.deberCambiarPassword ?? true,
      perfilId: insertCandidato.perfilId || 2, // Default candidato profile
      experienciaLaboral: insertCandidato.experienciaLaboral || null,
      educacion: insertCandidato.educacion || null,
      hojaDeVida: insertCandidato.hojaDeVida || null,
      fotografia: insertCandidato.fotografia || null,
      fechaRegistro: new Date(),
      estado: "pendiente",
      notasAprobacion: null,
      completado: false,
      empresaId: insertCandidato.empresaId || null,
    };
    this.candidatos.set(id, candidato);
    return candidato;
  }

  async updateCandidato(
    id: number,
    updateData: Partial<InsertCandidato>,
  ): Promise<Candidato> {
    const candidato = this.candidatos.get(id);
    if (!candidato) {
      throw new Error(`Candidato with id ${id} not found`);
    }

    const updatedCandidato = { ...candidato, ...updateData };
    this.candidatos.set(id, updatedCandidato);
    return updatedCandidato;
  }

  // Perfil operations
  async getAllPerfiles(): Promise<Perfil[]> {
    return Array.from(this.perfiles.values());
  }

  async getPerfilById(id: number): Promise<Perfil | undefined> {
    return this.perfiles.get(id);
  }

  async getPerfilByNombre(nombre: string): Promise<Perfil | undefined> {
    return Array.from(this.perfiles.values()).find(
      (perfil) => perfil.nombre === nombre,
    );
  }

  async createPerfil(insertPerfil: InsertPerfil): Promise<Perfil> {
    const id = this.currentPerfilId++;
    const perfil: Perfil = {
      id,
      nombre: insertPerfil.nombre,
      descripcion: insertPerfil.descripcion || null,
      permisos: insertPerfil.permisos || null,
      fechaCreacion: new Date(),
      activo: insertPerfil.activo !== undefined ? insertPerfil.activo : true,
    };
    this.perfiles.set(id, perfil);
    return perfil;
  }

  async updatePerfil(
    id: number,
    updateData: Partial<InsertPerfil>,
  ): Promise<Perfil> {
    const perfil = this.perfiles.get(id);
    if (!perfil) {
      throw new Error(`Perfil with id ${id} not found`);
    }

    const updatedPerfil = { ...perfil, ...updateData };
    this.perfiles.set(id, updatedPerfil);
    return updatedPerfil;
  }

  async deletePerfil(id: number): Promise<void> {
    if (!this.perfiles.has(id)) {
      throw new Error(`Perfil with id ${id} not found`);
    }
    this.perfiles.delete(id);
  }

  // Operación especial para crear candidatos desde perfiles
  async createCandidatoFromPerfil(
    data: CreateCandidatoFromPerfil,
  ): Promise<Candidato> {
    // Buscar el perfil de candidato
    const perfilCandidato = await this.getPerfilByNombre("candidato");
    if (!perfilCandidato) {
      throw new Error("Perfil de candidato no encontrado");
    }

    // Crear candidato con contraseña inicial = cédula
    const candidatoData: InsertCandidato = {
      email: data.email,
      password: data.cedula, // Contraseña inicial es la cédula
      deberCambiarPassword: true, // Debe cambiar contraseña en primer login
      perfilId: perfilCandidato.id,
      nombres: data.nombres,
      apellidos: data.apellidos,
      tipoDocumento: data.tipoDocumento,
      numeroDocumento: data.cedula,
      // Campos opcionales con valores por defecto
      fechaNacimiento: null,
      edad: null,
      sexo: null,
      estadoCivil: null,
      telefono: null,
      direccion: null,
      ciudad: null,
      cargoAspirado: null,
      experienciaLaboral: null,
      eps: null,
      arl: null,
      fondoPension: null,
      grupoSanguineo: null,
      nivelEducativo: null,
      educacion: null,
      contactoEmergenciaNombre: null,
      contactoEmergenciaTelefono: null,
      contactoEmergenciaRelacion: null,
      hojaDeVida: null,
      fotografia: null,
      estado: "pendiente",
      completado: false,
    };

    return this.createCandidato(candidatoData);
  }

  // Maestro operations - Tipos de Candidatos
  async getAllTiposCandidatos(): Promise<TipoCandidato[]> {
    return Array.from(this.tiposCandidatos.values()).filter((tc) => tc.activo);
  }

  async getTipoCandidatoById(id: number): Promise<TipoCandidato | undefined> {
    return this.tiposCandidatos.get(id);
  }

  async createTipoCandidato(
    tipoCandidato: InsertTipoCandidato,
  ): Promise<TipoCandidato> {
    const id = this.currentTipoCandidatoId++;
    const nuevo: TipoCandidato = {
      id,
      nombre: tipoCandidato.nombre,
      descripcion: tipoCandidato.descripcion || null,
      activo: tipoCandidato.activo ?? true,
      fechaCreacion: new Date(),
    };
    this.tiposCandidatos.set(id, nuevo);
    return nuevo;
  }

  async updateTipoCandidato(
    id: number,
    tipoCandidato: Partial<InsertTipoCandidato>,
  ): Promise<TipoCandidato> {
    const existing = this.tiposCandidatos.get(id);
    if (!existing) {
      throw new Error("Tipo de candidato no encontrado");
    }
    const updated = { ...existing, ...tipoCandidato };
    this.tiposCandidatos.set(id, updated);
    return updated;
  }

  async deleteTipoCandidato(id: number): Promise<void> {
    const existing = this.tiposCandidatos.get(id);
    if (!existing) {
      throw new Error("Tipo de candidato no encontrado");
    }
    // Soft delete
    existing.activo = false;
    this.tiposCandidatos.set(id, existing);
  }

  // Maestro operations - Documentos Tipo
  async getAllDocumentosTipo(): Promise<DocumentoTipo[]> {
    return Array.from(this.documentosTipo.values()).filter((dt) => dt.activo);
  }

  async getDocumentoTipoById(id: number): Promise<DocumentoTipo | undefined> {
    return this.documentosTipo.get(id);
  }

  async createDocumentoTipo(
    documentoTipo: InsertDocumentoTipo,
  ): Promise<DocumentoTipo> {
    const id = this.currentDocumentoTipoId++;
    const nuevo: DocumentoTipo = {
      id,
      nombre: documentoTipo.nombre,
      descripcion: documentoTipo.descripcion || null,
      requerido: documentoTipo.requerido ?? false,
      activo: documentoTipo.activo ?? true,
      fechaCreacion: new Date(),
    };
    this.documentosTipo.set(id, nuevo);
    return nuevo;
  }

  async updateDocumentoTipo(
    id: number,
    documentoTipo: Partial<InsertDocumentoTipo>,
  ): Promise<DocumentoTipo> {
    const existing = this.documentosTipo.get(id);
    if (!existing) {
      throw new Error("Tipo de documento no encontrado");
    }
    const updated = { ...existing, ...documentoTipo };
    this.documentosTipo.set(id, updated);
    return updated;
  }

  async deleteDocumentoTipo(id: number): Promise<void> {
    const existing = this.documentosTipo.get(id);
    if (!existing) {
      throw new Error("Tipo de documento no encontrado");
    }
    // Soft delete
    existing.activo = false;
    this.documentosTipo.set(id, existing);
  }

  // Maestro operations - Relación Tipos-Documentos
  async getDocumentosByTipoCandidato(
    tipoCandidatoId: number,
  ): Promise<TipoCandidatoDocumento[]> {
    return Array.from(this.tiposCandidatosDocumentos.values())
      .filter((tcd) => tcd.tipoCandidatoId === tipoCandidatoId)
      .sort((a, b) => a.orden - b.orden);
  }

  async updateDocumentosByTipoCandidato(
    tipoCandidatoId: number,
    documentos: InsertTipoCandidatoDocumento[],
  ): Promise<void> {
    // Eliminar relaciones existentes para este tipo de candidato
    const idsToDelete: number[] = [];
    for (const [id, tcd] of this.tiposCandidatosDocumentos.entries()) {
      if (tcd.tipoCandidatoId === tipoCandidatoId) {
        idsToDelete.push(id);
      }
    }
    idsToDelete.forEach((id) => this.tiposCandidatosDocumentos.delete(id));

    // Agregar las nuevas relaciones
    documentos.forEach((doc) => {
      const id = this.currentTipoCandidatoDocumentoId++;
      const nuevo: TipoCandidatoDocumento = {
        id,
        tipoCandidatoId: doc.tipoCandidatoId,
        documentoTipoId: doc.documentoTipoId,
        obligatorio: doc.obligatorio ?? true,
        orden: doc.orden ?? 0,
        fechaCreacion: new Date(),
      };
      this.tiposCandidatosDocumentos.set(id, nuevo);
    });
  }

  // Candidatos Documentos
  async getDocumentosByCandidato(
    candidatoId: number,
  ): Promise<CandidatoDocumento[]> {
    return Array.from(this.candidatosDocumentos.values()).filter(
      (cd) => cd.candidatoId === candidatoId,
    );
  }

  async createCandidatoDocumento(
    candidatoDocumento: InsertCandidatoDocumento,
  ): Promise<CandidatoDocumento> {
    const id = this.currentCandidatoDocumentoId++;
    const nuevo: CandidatoDocumento = {
      id,
      candidatoId: candidatoDocumento.candidatoId,
      documentoTipoId: candidatoDocumento.documentoTipoId,
      archivo: candidatoDocumento.archivo || null,
      nombreArchivo: candidatoDocumento.nombreArchivo || null,
      fechaSubida: new Date(),
      estado: candidatoDocumento.estado ?? "pendiente",
    };
    this.candidatosDocumentos.set(id, nuevo);
    return nuevo;
  }

  async updateCandidatoDocumento(
    id: number,
    candidatoDocumento: Partial<InsertCandidatoDocumento>,
  ): Promise<CandidatoDocumento> {
    const existing = this.candidatosDocumentos.get(id);
    if (!existing) {
      throw new Error("Documento de candidato no encontrado");
    }
    const updated = { ...existing, ...candidatoDocumento };
    this.candidatosDocumentos.set(id, updated);
    return updated;
  }

  async deleteCandidatoDocumento(id: number): Promise<void> {
    this.candidatosDocumentos.delete(id);
  }

  // Empresa operations
  async getEmpresa(id: number): Promise<Empresa | undefined> {
    return this.empresas.get(id);
  }

  async getEmpresaByEmail(email: string): Promise<Empresa | undefined> {
    for (const empresa of this.empresas.values()) {
      if (empresa.email === email) {
        return empresa;
      }
    }
    return undefined;
  }

  async getAllEmpresas(): Promise<Empresa[]> {
    return Array.from(this.empresas.values());
  }

  async createEmpresa(insertEmpresa: InsertEmpresa): Promise<Empresa> {
    const id = this.currentEmpresaId++;
    const empresa: Empresa = {
      id,
      email: insertEmpresa.email,
      password: insertEmpresa.password,
      nombreEmpresa: insertEmpresa.nombreEmpresa,
      nit: insertEmpresa.nit,
      direccion: insertEmpresa.direccion || null,
      telefono: insertEmpresa.telefono || null,
      ciudad: insertEmpresa.ciudad || null,
      contactoPrincipal: insertEmpresa.contactoPrincipal || null,
      cargoContacto: insertEmpresa.cargoContacto || null,
      fechaRegistro: new Date(),
      estado: "activo",
    };
    this.empresas.set(id, empresa);
    return empresa;
  }

  async updateEmpresa(
    id: number,
    updateData: Partial<InsertEmpresa>,
  ): Promise<Empresa> {
    const existing = this.empresas.get(id);
    if (!existing) {
      throw new Error(`Empresa with id ${id} not found`);
    }
    const updated = { ...existing, ...updateData };
    this.empresas.set(id, updated);
    return updated;
  }

  // Candidatos por empresa (para portal de empresas)
  async getCandidatosByEmpresa(empresaId: number): Promise<Candidato[]> {
    return Array.from(this.candidatos.values()).filter(
      (candidato) => candidato.empresaId === empresaId,
    );
  }

  async createCandidatoForEmpresa(
    candidato: InsertCandidato,
    empresaId: number,
  ): Promise<Candidato> {
    const candidatoData = {
      ...candidato,
      empresaId: empresaId,
    };
    return this.createCandidato(candidatoData);
  }

  async updateCandidatoApproval(
    candidatoId: number,
    estado: string,
    notasAprobacion?: string,
  ): Promise<Candidato> {
    const candidato = this.candidatos.get(candidatoId);
    if (!candidato) {
      throw new Error("Candidato no encontrado");
    }

    const updated: Candidato = {
      ...candidato,
      estado,
      notasAprobacion: notasAprobacion || candidato.notasAprobacion,
    };

    this.candidatos.set(candidatoId, updated);
    return updated;
  }

  // Menu operations
  async getAllMenuNodes(): Promise<MenuNode[]> {
    return Array.from(this.menuNodes.values());
  }

  async createMenuNode(insertMenuNode: InsertMenuNode): Promise<MenuNode> {
    const menuNode: MenuNode = {
      id: this.currentMenuNodeId++,
      ...insertMenuNode,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.menuNodes.set(menuNode.id, menuNode);
    return menuNode;
  }

  async updateMenuNode(
    id: number,
    updateData: Partial<InsertMenuNode>,
  ): Promise<MenuNode> {
    const existing = this.menuNodes.get(id);
    if (!existing) {
      throw new Error(`MenuNode with id ${id} not found`);
    }

    const updated: MenuNode = {
      ...existing,
      ...updateData,
      updatedAt: new Date(),
    };

    this.menuNodes.set(id, updated);
    return updated;
  }

  async deleteMenuNode(id: number): Promise<void> {
    // Also delete any permissions and actions related to this node
    const permission = Array.from(this.menuPermissions.values()).find(
      (p) => p.nodeId === id,
    );

    if (permission) {
      await this.deleteMenuPermission(permission.id);
    }

    this.menuNodes.delete(id);
  }

  // Menu permissions operations
  async getMenuPermissionByNodeId(
    nodeId: number,
  ): Promise<MenuPermission | undefined> {
    return Array.from(this.menuPermissions.values()).find(
      (permission) => permission.nodeId === nodeId,
    );
  }

  async createMenuPermission(
    insertPermission: InsertMenuPermission,
  ): Promise<MenuPermission> {
    const permission: MenuPermission = {
      id: this.currentMenuPermissionId++,
      ...insertPermission,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.menuPermissions.set(permission.id, permission);
    return permission;
  }

  async updateMenuPermission(
    id: number,
    updateData: Partial<InsertMenuPermission>,
  ): Promise<MenuPermission> {
    const existing = this.menuPermissions.get(id);
    if (!existing) {
      throw new Error(`MenuPermission with id ${id} not found`);
    }

    const updated: MenuPermission = {
      ...existing,
      ...updateData,
      updatedAt: new Date(),
    };

    this.menuPermissions.set(id, updated);
    return updated;
  }

  async deleteMenuPermission(id: number): Promise<void> {
    // Also delete any actions related to this permission
    const actions = Array.from(this.menuActions.values()).filter(
      (action) => action.permissionId === id,
    );

    for (const action of actions) {
      await this.deleteMenuAction(action.id);
    }

    this.menuPermissions.delete(id);
  }

  // Menu actions operations
  async getMenuActionsByPermissionId(
    permissionId: number,
  ): Promise<MenuAction[]> {
    return Array.from(this.menuActions.values()).filter(
      (action) => action.permissionId === permissionId,
    );
  }

  async createMenuAction(insertAction: InsertMenuAction): Promise<MenuAction> {
    const action: MenuAction = {
      id: this.currentMenuActionId++,
      ...insertAction,
      tipo: insertAction.tipo || "Accion",
      createdAt: new Date(),
    };

    this.menuActions.set(action.id, action);
    return action;
  }

  async deleteMenuAction(id: number): Promise<void> {
    this.menuActions.delete(id);
  }

  // Implementaciones de Analistas
  async getAllAnalistas(): Promise<Analista[]> {
    return Array.from(this.analistas.values());
  }

  async getAnalistaById(id: number): Promise<Analista | undefined> {
    return this.analistas.get(id);
  }

  async getAnalistaByEmail(email: string): Promise<Analista | undefined> {
    return Array.from(this.analistas.values()).find(
      (analista) => analista.email === email,
    );
  }

  async createAnalista(insertAnalista: InsertAnalista): Promise<Analista> {
    const analista: Analista = {
      id: this.currentAnalistaId++,
      nombre: insertAnalista.nombre,
      apellido: insertAnalista.apellido,
      email: insertAnalista.email,
      telefono: insertAnalista.telefono || null,
      regional: insertAnalista.regional,
      clienteAsignado: insertAnalista.clienteAsignado || null,
      nivelPrioridad: insertAnalista.nivelPrioridad || "medio",
      estado: insertAnalista.estado || "activo",
      fechaIngreso: insertAnalista.fechaIngreso || new Date(),
      fechaCreacion: new Date(),
      fechaActualizacion: new Date(),
    };

    this.analistas.set(analista.id, analista);
    return analista;
  }

  async updateAnalista(
    id: number,
    updateData: Partial<InsertAnalista>,
  ): Promise<Analista> {
    const existing = this.analistas.get(id);
    if (!existing) {
      throw new Error("Analista no encontrado");
    }

    const updated: Analista = {
      ...existing,
      ...updateData,
      fechaActualizacion: new Date(),
    };

    this.analistas.set(id, updated);
    return updated;
  }

  async deleteAnalista(id: number): Promise<void> {
    if (!this.analistas.has(id)) {
      throw new Error("Analista no encontrado");
    }
    this.analistas.delete(id);
  }

  // Clientes operations
  async getAllClientes(): Promise<Cliente[]> {
    return Array.from(this.clientes.values());
  }

  async getClienteById(id: number): Promise<Cliente | undefined> {
    return this.clientes.get(id);
  }

  async getClienteByEmail(email: string): Promise<Cliente | undefined> {
    return Array.from(this.clientes.values()).find(
      (cliente) => cliente.email === email,
    );
  }

  async createCliente(insertCliente: InsertCliente): Promise<Cliente> {
    const id = this.currentClienteId++;
    const cliente: Cliente = {
      id,
      email: insertCliente.email,
      password: insertCliente.password,
      nombreCompleto: insertCliente.nombreCompleto,
      empresa: insertCliente.empresa,
      regional: insertCliente.regional,
      sucursal: insertCliente.sucursal,
      fechaRegistro: new Date(),
      estado: insertCliente.estado || "activo",
    };
    this.clientes.set(id, cliente);
    return cliente;
  }

  async updateCliente(
    id: number,
    updateData: Partial<InsertCliente>,
  ): Promise<Cliente> {
    const cliente = this.clientes.get(id);
    if (!cliente) {
      throw new Error("Cliente no encontrado");
    }

    const updated: Cliente = {
      ...cliente,
      ...updateData,
    };
    this.clientes.set(id, updated);
    return updated;
  }

  async deleteCliente(id: number): Promise<void> {
    this.clientes.delete(id);
  }

  // Perfil menus and actions operations
  async createPerfilMenu(perfilMenu: InsertPerfilMenu): Promise<PerfilMenu> {
    const newPerfilMenu: PerfilMenu = {
      id: this.currentPerfilMenuId++,
      ...perfilMenu,
      createdAt: new Date(),
    };

    this.perfilMenus.set(newPerfilMenu.id, newPerfilMenu);
    return newPerfilMenu;
  }

  async deletePerfilMenusByPerfilId(perfilId: number): Promise<void> {
    const perfilMenusToDelete = Array.from(this.perfilMenus.values()).filter(
      (perfilMenu) => perfilMenu.perfilId === perfilId,
    );

    for (const perfilMenu of perfilMenusToDelete) {
      // Delete related actions first
      await this.deletePerfilAccionesByPerfilMenuId(perfilMenu.id);
      this.perfilMenus.delete(perfilMenu.id);
    }
  }

  async createPerfilAccion(perfilAccion: InsertPerfilAccion): Promise<PerfilAccion> {
    const newPerfilAccion: PerfilAccion = {
      id: this.currentPerfilAccionId++,
      ...perfilAccion,
      createdAt: new Date(),
    };

    this.perfilAcciones.set(newPerfilAccion.id, newPerfilAccion);
    return newPerfilAccion;
  }

  async deletePerfilAccionesByPerfilMenuId(perfilMenuId: number): Promise<void> {
    const accionesToDelete = Array.from(this.perfilAcciones.values()).filter(
      (accion) => accion.perfilMenuId === perfilMenuId,
    );

    for (const accion of accionesToDelete) {
      this.perfilAcciones.delete(accion.id);
    }
  }

  async getPerfilMenusByPerfilId(perfilId: number): Promise<PerfilMenu[]> {
    return Array.from(this.perfilMenus.values()).filter(
      (perfilMenu) => perfilMenu.perfilId === perfilId,
    );
  }

  async getPerfilAccionesByPerfilMenuId(perfilMenuId: number): Promise<PerfilAccion[]> {
    return Array.from(this.perfilAcciones.values()).filter(
      (accion) => accion.perfilMenuId === perfilMenuId,
    );
  }

  // ===== REPORTES Y ÓRDENES =====
  
  // Operaciones de órdenes
  async getAllOrdenes(): Promise<Orden[]> {
    return Array.from(this.ordenes.values());
  }

  async getOrdenById(id: number): Promise<Orden | undefined> {
    return this.ordenes.get(id);
  }

  async getOrdenesByCliente(clienteId: number): Promise<Orden[]> {
    return Array.from(this.ordenes.values()).filter(
      (orden) => orden.clienteId === clienteId
    );
  }

  async getOrdenesByAnalista(analistaId: number): Promise<Orden[]> {
    return Array.from(this.ordenes.values()).filter(
      (orden) => orden.analistaId === analistaId
    );
  }

  async createOrden(orden: InsertOrden): Promise<Orden> {
    const newOrden: Orden = {
      id: this.currentOrdenId++,
      ...orden,
      fechaCreacion: new Date(),
      fechaAsignacion: null,
      fechaInicioExamenes: null,
      fechaFinalizacion: null,
      fechaVencimiento: null,
      leadTime: null,
    };

    this.ordenes.set(newOrden.id, newOrden);
    return newOrden;
  }

  async updateOrden(id: number, orden: Partial<InsertOrden>): Promise<Orden> {
    const existing = this.ordenes.get(id);
    if (!existing) throw new Error("Orden not found");

    const updated: Orden = { ...existing, ...orden };
    this.ordenes.set(id, updated);
    return updated;
  }

  async deleteOrden(id: number): Promise<void> {
    this.ordenes.delete(id);
  }

  // Operaciones de historial de órdenes
  async getHistorialByOrden(ordenId: number): Promise<OrdenHistorial[]> {
    return Array.from(this.ordenesHistorial.values()).filter(
      (historial) => historial.ordenId === ordenId
    );
  }

  async createHistorialEntry(historial: InsertOrdenHistorial): Promise<OrdenHistorial> {
    const newHistorial: OrdenHistorial = {
      id: this.currentHistorialId++,
      ...historial,
      fechaCambio: new Date(),
    };

    this.ordenesHistorial.set(newHistorial.id, newHistorial);
    return newHistorial;
  }

  // Operaciones de notificaciones
  async getAllNotificaciones(): Promise<Notificacion[]> {
    return Array.from(this.notificaciones.values());
  }

  async getNotificacionesByOrden(ordenId: number): Promise<Notificacion[]> {
    return Array.from(this.notificaciones.values()).filter(
      (notificacion) => notificacion.ordenId === ordenId
    );
  }

  async createNotificacion(notificacion: InsertNotificacion): Promise<Notificacion> {
    const newNotificacion: Notificacion = {
      id: this.currentNotificacionId++,
      ...notificacion,
      fechaCreacion: new Date(),
      fechaEnvio: null,
      motivoFallo: null,
    };

    this.notificaciones.set(newNotificacion.id, newNotificacion);
    return newNotificacion;
  }

  async updateNotificacionEstado(id: number, estado: string, motivoFallo?: string): Promise<Notificacion> {
    const existing = this.notificaciones.get(id);
    if (!existing) throw new Error("Notificacion not found");

    const updated: Notificacion = {
      ...existing,
      estado,
      fechaEnvio: estado === "enviado" ? new Date() : existing.fechaEnvio,
      motivoFallo: motivoFallo || existing.motivoFallo,
    };
    
    this.notificaciones.set(id, updated);
    return updated;
  }

  // Operaciones de alertas
  async getAllAlertas(): Promise<Alerta[]> {
    return Array.from(this.alertas.values());
  }

  async getAlertasActivas(): Promise<Alerta[]> {
    return Array.from(this.alertas.values()).filter(
      (alerta) => alerta.estado === "activa"
    );
  }

  async createAlerta(alerta: InsertAlerta): Promise<Alerta> {
    const newAlerta: Alerta = {
      id: this.currentAlertaId++,
      ...alerta,
      fechaCreacion: new Date(),
      fechaResolucion: null,
    };

    this.alertas.set(newAlerta.id, newAlerta);
    return newAlerta;
  }

  async resolverAlerta(id: number): Promise<Alerta> {
    const existing = this.alertas.get(id);
    if (!existing) throw new Error("Alerta not found");

    const updated: Alerta = {
      ...existing,
      estado: "resuelta",
      fechaResolucion: new Date(),
    };
    
    this.alertas.set(id, updated);
    return updated;
  }

  // Operaciones de métricas
  async getMetricasByFecha(fecha: Date): Promise<Metrica[]> {
    const fechaStr = fecha.toISOString().split('T')[0];
    return Array.from(this.metricas.values()).filter(
      (metrica) => metrica.fecha === fechaStr
    );
  }

  async getMetricasByAnalista(analistaId: number, fechaInicio: Date, fechaFin: Date): Promise<Metrica[]> {
    const inicioStr = fechaInicio.toISOString().split('T')[0];
    const finStr = fechaFin.toISOString().split('T')[0];
    
    return Array.from(this.metricas.values()).filter(
      (metrica) => 
        metrica.analistaId === analistaId &&
        metrica.fecha >= inicioStr &&
        metrica.fecha <= finStr
    );
  }

  async createMetrica(metrica: InsertMetrica): Promise<Metrica> {
    const newMetrica: Metrica = {
      id: this.currentMetricaId++,
      ...metrica,
      fechaActualizacion: new Date(),
    };

    this.metricas.set(newMetrica.id, newMetrica);
    return newMetrica;
  }

  async updateMetrica(id: number, metrica: Partial<InsertMetrica>): Promise<Metrica> {
    const existing = this.metricas.get(id);
    if (!existing) throw new Error("Metrica not found");

    const updated: Metrica = {
      ...existing,
      ...metrica,
      fechaActualizacion: new Date(),
    };
    
    this.metricas.set(id, updated);
    return updated;
  }

  // Reportes específicos
  async getDashboardData(): Promise<{
    ordenesTotales: number;
    ordenesHoy: number;
    ordenesEnProceso: number;
    alertasActivas: number;
    leadTimePromedio: number;
    ordenesPorEstado: { estado: string; cantidad: number }[];
    ordenesPorAnalista: { analista: string; cantidad: number }[];
  }> {
    const ordenes = Array.from(this.ordenes.values());
    const alertas = Array.from(this.alertas.values());
    const analistas = Array.from(this.analistas.values());
    
    const hoy = new Date().toISOString().split('T')[0];
    const ordenesHoy = ordenes.filter(o => 
      o.fechaCreacion?.toISOString().split('T')[0] === hoy
    ).length;

    const ordenesEnProceso = ordenes.filter(o => 
      !["finalizada", "rechazada"].includes(o.estado)
    ).length;

    const alertasActivas = alertas.filter(a => a.estado === "activa").length;

    // Calcular lead time promedio
    const ordenesConLeadTime = ordenes.filter(o => o.leadTime !== null);
    const leadTimePromedio = ordenesConLeadTime.length > 0 
      ? ordenesConLeadTime.reduce((sum, o) => sum + (o.leadTime || 0), 0) / ordenesConLeadTime.length
      : 0;

    // Agrupar por estado
    const estadoCounts = ordenes.reduce((acc, orden) => {
      acc[orden.estado] = (acc[orden.estado] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const ordenesPorEstado = Object.entries(estadoCounts).map(([estado, cantidad]) => ({
      estado,
      cantidad
    }));

    // Agrupar por analista
    const analistaCounts = ordenes.reduce((acc, orden) => {
      if (orden.analistaId) {
        const analista = analistas.find(a => a.id === orden.analistaId);
        const nombre = analista ? `${analista.nombre} ${analista.apellido}` : "Sin asignar";
        acc[nombre] = (acc[nombre] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const ordenesPorAnalista = Object.entries(analistaCounts).map(([analista, cantidad]) => ({
      analista,
      cantidad
    }));

    return {
      ordenesTotales: ordenes.length,
      ordenesHoy,
      ordenesEnProceso,
      alertasActivas,
      leadTimePromedio: Math.round(leadTimePromedio * 100) / 100,
      ordenesPorEstado,
      ordenesPorAnalista,
    };
  }

  async getLeadTimeByAnalista(): Promise<{
    analistaId: number;
    nombre: string;
    ordenesAbiertas: number;
    ordenesCerradas: number;
    leadTimePromedio: number;
  }[]> {
    const ordenes = Array.from(this.ordenes.values());
    const analistas = Array.from(this.analistas.values());

    return analistas.map(analista => {
      const ordenesAnalista = ordenes.filter(o => o.analistaId === analista.id);
      const ordenesAbiertas = ordenesAnalista.filter(o => 
        !["finalizada", "rechazada"].includes(o.estado)
      ).length;
      const ordenesCerradas = ordenesAnalista.filter(o => 
        ["finalizada", "rechazada"].includes(o.estado)
      ).length;
      
      const ordenesConLeadTime = ordenesAnalista.filter(o => o.leadTime !== null);
      const leadTimePromedio = ordenesConLeadTime.length > 0
        ? ordenesConLeadTime.reduce((sum, o) => sum + (o.leadTime || 0), 0) / ordenesConLeadTime.length
        : 0;

      return {
        analistaId: analista.id,
        nombre: `${analista.nombre} ${analista.apellido}`,
        ordenesAbiertas,
        ordenesCerradas,
        leadTimePromedio: Math.round(leadTimePromedio * 100) / 100,
      };
    });
  }

  // Método para inicializar datos de muestra para el dashboard
  private initializeSampleData() {
    // Crear órdenes de muestra
    const ordenesData = [
      {
        numeroOrden: "ORD-2025-001",
        clienteId: 1,
        candidatoId: 1,
        analistaId: 1,
        cargo: "Desarrollador Frontend",
        ciudad: "Bogotá",
        estado: "en_proceso",
        prioridad: "alta",
        fechaIngreso: "2025-02-01",
        tipoContrato: "Término indefinido",
        observaciones: "Candidato con experiencia en React",
        centroTrabajo: "Sede Principal",
        areaFuncional: "Tecnología",
        tipoExamen: "Examen básico de ingreso"
      },
      {
        numeroOrden: "ORD-2025-002", 
        clienteId: 1,
        candidatoId: 2,
        analistaId: 2,
        cargo: "Analista de Datos",
        ciudad: "Medellín", 
        estado: "documentos_completos",
        prioridad: "media",
        fechaIngreso: "2025-02-15",
        tipoContrato: "Término fijo",
        observaciones: "Requiere conocimientos en SQL",
        centroTrabajo: "Sede Medellín",
        areaFuncional: "Análisis",
        tipoExamen: "Examen técnico especializado"
      },
      {
        numeroOrden: "ORD-2025-003",
        clienteId: 1, 
        candidatoId: 3,
        analistaId: 3,
        cargo: "Contador Junior",
        ciudad: "Cali",
        estado: "finalizada",
        prioridad: "baja",
        fechaIngreso: "2025-01-15",
        tipoContrato: "Tiempo parcial",
        observaciones: "Aprobado para contratación",
        centroTrabajo: "Sede Cali",
        areaFuncional: "Contabilidad", 
        tipoExamen: "Examen de aptitudes básicas",
        leadTime: 15
      }
    ];

    ordenesData.forEach(ordenData => {
      const orden: Orden = {
        id: this.currentOrdenId++,
        ...ordenData,
        empresaId: null,
        salario: null,
        fechaCreacion: new Date(),
        fechaAsignacion: ordenData.analistaId ? new Date() : null,
        fechaInicioExamenes: ordenData.estado === "examenes_medicos" || ordenData.estado === "finalizada" ? new Date() : null,
        fechaFinalizacion: ordenData.estado === "finalizada" ? new Date() : null,
        fechaVencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
        notasInternas: null,
        leadTime: ordenData.leadTime || null
      };
      this.ordenes.set(orden.id, orden);
    });

    // Crear alertas de muestra
    const alertasData = [
      {
        tipo: "vencimiento_orden",
        titulo: "Orden próxima a vencer",
        descripcion: "La orden ORD-2025-001 vence en 5 días",
        ordenId: 1,
        prioridad: "alta"
      },
      {
        tipo: "documento_pendiente",
        titulo: "Documentos pendientes",
        descripcion: "Candidato ID 2 tiene documentos pendientes por cargar",
        candidatoId: 2,
        prioridad: "media"
      }
    ];

    alertasData.forEach(alertaData => {
      const alerta: Alerta = {
        id: this.currentAlertaId++,
        ...alertaData,
        estado: "activa",
        fechaCreacion: new Date(),
        fechaVencimiento: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 días
        fechaResolucion: null,
        candidatoId: alertaData.candidatoId || null,
        ordenId: alertaData.ordenId || null
      };
      this.alertas.set(alerta.id, alerta);
    });

    // Crear notificaciones de muestra
    const notificacionesData = [
      {
        tipo: "email",
        asunto: "Orden creada exitosamente",
        mensaje: "Su orden ORD-2025-001 ha sido creada y asignada",
        destinatario: "candidato1@example.com",
        ordenId: 1,
        candidatoId: 1,
        estado: "enviado"
      },
      {
        tipo: "email", 
        asunto: "Documentos requeridos",
        mensaje: "Por favor complete la documentación pendiente",
        destinatario: "candidato2@example.com",
        ordenId: 2,
        candidatoId: 2,
        estado: "pendiente"
      }
    ];

    notificacionesData.forEach(notifData => {
      const notificacion: Notificacion = {
        id: this.currentNotificacionId++,
        ...notifData,
        clienteId: null,
        fechaCreacion: new Date(),
        fechaEnvio: notifData.estado === "enviado" ? new Date() : null,
        motivoFallo: null
      };
      this.notificaciones.set(notificacion.id, notificacion);
    });
  }

  // Métodos para tokens de recuperación de contraseña
  async createPasswordResetToken(tokenData: InsertPasswordResetToken): Promise<PasswordResetToken> {
    const token: PasswordResetToken = {
      id: this.currentPasswordResetTokenId++,
      ...tokenData,
      createdAt: new Date(),
    };
    this.passwordResetTokens.set(token.id, token);
    return token;
  }

  async getPasswordResetToken(tokenValue: string): Promise<PasswordResetToken | undefined> {
    for (const token of this.passwordResetTokens.values()) {
      if (token.token === tokenValue && !token.used && token.expiresAt > new Date()) {
        return token;
      }
    }
    return undefined;
  }

  async markTokenAsUsed(id: number): Promise<void> {
    const token = this.passwordResetTokens.get(id);
    if (token) {
      const updatedToken = { ...token, used: true };
      this.passwordResetTokens.set(id, updatedToken);
    }
  }

  async cleanExpiredTokens(): Promise<void> {
    const now = new Date();
    for (const [id, token] of this.passwordResetTokens.entries()) {
      if (token.expiresAt <= now || token.used) {
        this.passwordResetTokens.delete(id);
      }
    }
  }

  // Hash passwords after initialization
  private hashPasswordsAfterInit(): void {
    // Hash candidatos passwords
    for (const [id, candidato] of this.candidatos.entries()) {
      if (candidato.password && !candidato.password.startsWith('$2b$')) {
        candidato.password = bcrypt.hashSync(candidato.password, 10);
        this.candidatos.set(id, candidato);
      }
    }
    
    // Hash empresas passwords
    for (const [id, empresa] of this.empresas.entries()) {
      if (empresa.password && !empresa.password.startsWith('$2b$')) {
        empresa.password = bcrypt.hashSync(empresa.password, 10);
        this.empresas.set(id, empresa);
      }
    }
  }

  // Métodos adicionales para recuperación de contraseñas
  async getEmpresaById(id: number): Promise<Empresa | undefined> {
    return this.empresas.get(id);
  }

  async getEmpresaByEmail(email: string): Promise<Empresa | undefined> {
    for (const empresa of this.empresas.values()) {
      if (empresa.email === email) {
        return empresa;
      }
    }
    return undefined;
  }

  async getCandidatoById(id: number): Promise<Candidato | undefined> {
    return this.candidatos.get(id);
  }

  async updateEmpresaPassword(id: number, hashedPassword: string): Promise<void> {
    const empresa = this.empresas.get(id);
    if (empresa) {
      const updatedEmpresa = { ...empresa, password: hashedPassword };
      this.empresas.set(id, updatedEmpresa);
    }
  }

  async updateCandidatoPassword(id: number, hashedPassword: string): Promise<void> {
    const candidato = this.candidatos.get(id);
    if (candidato) {
      const updatedCandidato = { ...candidato, password: hashedPassword };
      this.candidatos.set(id, updatedCandidato);
    }
  }

  // ========== IMPLEMENTACIONES SISTEMA DE PERMISOS DINÁMICOS ==========

  // System Views operations
  async getAllSystemViews(): Promise<SystemView[]> {
    return Array.from(this.systemViews.values());
  }

  async getSystemViewById(id: number): Promise<SystemView | undefined> {
    return this.systemViews.get(id);
  }

  async getSystemViewByNombre(nombre: string): Promise<SystemView | undefined> {
    return Array.from(this.systemViews.values()).find(view => view.nombre === nombre);
  }

  async createSystemView(view: InsertSystemView): Promise<SystemView> {
    const newView: SystemView = {
      id: this.currentSystemViewId++,
      ...view,
      fechaCreacion: new Date(),
    };
    this.systemViews.set(newView.id, newView);
    return newView;
  }

  async updateSystemView(id: number, view: Partial<InsertSystemView>): Promise<SystemView> {
    const existing = this.systemViews.get(id);
    if (!existing) throw new Error("Vista del sistema no encontrada");
    
    const updated: SystemView = { ...existing, ...view };
    this.systemViews.set(id, updated);
    return updated;
  }

  async deleteSystemView(id: number): Promise<void> {
    // Delete related actions first
    const actions = Array.from(this.viewActions.values()).filter(action => action.viewId === id);
    for (const action of actions) {
      await this.deleteViewAction(action.id);
    }
    
    // Delete related permissions
    const viewPermissions = Array.from(this.profileViewPermissions.values()).filter(p => p.viewId === id);
    for (const permission of viewPermissions) {
      this.profileViewPermissions.delete(permission.id);
    }
    
    this.systemViews.delete(id);
  }

  // View Actions operations
  async getActionsByViewId(viewId: number): Promise<ViewAction[]> {
    return Array.from(this.viewActions.values()).filter(action => action.viewId === viewId);
  }

  async getAllViewActions(): Promise<ViewAction[]> {
    return Array.from(this.viewActions.values());
  }

  async getViewActionById(id: number): Promise<ViewAction | undefined> {
    return this.viewActions.get(id);
  }

  async createViewAction(action: InsertViewAction): Promise<ViewAction> {
    const newAction: ViewAction = {
      id: this.currentViewActionId++,
      ...action,
      fechaCreacion: new Date(),
    };
    this.viewActions.set(newAction.id, newAction);
    return newAction;
  }

  async updateViewAction(id: number, action: Partial<InsertViewAction>): Promise<ViewAction> {
    const existing = this.viewActions.get(id);
    if (!existing) throw new Error("Acción no encontrada");
    
    const updated: ViewAction = { ...existing, ...action };
    this.viewActions.set(id, updated);
    return updated;
  }

  async deleteViewAction(id: number): Promise<void> {
    // Delete related action permissions first
    const actionPermissions = Array.from(this.profileActionPermissions.values()).filter(p => p.actionId === id);
    for (const permission of actionPermissions) {
      this.profileActionPermissions.delete(permission.id);
    }
    
    this.viewActions.delete(id);
  }

  // Profile View Permissions operations
  async getViewPermissionsByPerfilId(perfilId: number): Promise<ProfileViewPermission[]> {
    return Array.from(this.profileViewPermissions.values()).filter(p => p.perfilId === perfilId);
  }

  async createProfileViewPermission(permission: InsertProfileViewPermission): Promise<ProfileViewPermission> {
    const newPermission: ProfileViewPermission = {
      id: this.currentProfileViewPermissionId++,
      ...permission,
      fechaCreacion: new Date(),
    };
    this.profileViewPermissions.set(newPermission.id, newPermission);
    return newPermission;
  }

  async deleteViewPermissionsByPerfilId(perfilId: number): Promise<void> {
    const permissions = Array.from(this.profileViewPermissions.values()).filter(p => p.perfilId === perfilId);
    for (const permission of permissions) {
      this.profileViewPermissions.delete(permission.id);
    }
  }

  // Profile Action Permissions operations
  async getActionPermissionsByPerfilId(perfilId: number): Promise<ProfileActionPermission[]> {
    return Array.from(this.profileActionPermissions.values()).filter(p => p.perfilId === perfilId);
  }

  async createProfileActionPermission(permission: InsertProfileActionPermission): Promise<ProfileActionPermission> {
    const newPermission: ProfileActionPermission = {
      id: this.currentProfileActionPermissionId++,
      ...permission,
      fechaCreacion: new Date(),
    };
    this.profileActionPermissions.set(newPermission.id, newPermission);
    return newPermission;
  }

  async deleteActionPermissionsByPerfilId(perfilId: number): Promise<void> {
    const permissions = Array.from(this.profileActionPermissions.values()).filter(p => p.perfilId === perfilId);
    for (const permission of permissions) {
      this.profileActionPermissions.delete(permission.id);
    }
  }

  // Combined operations
  async getViewsWithActionsByPerfilId(perfilId: number): Promise<ViewWithActions[]> {
    const viewPermissions = await this.getViewPermissionsByPerfilId(perfilId);
    const result: ViewWithActions[] = [];
    
    for (const viewPermission of viewPermissions) {
      const view = await this.getSystemViewById(viewPermission.viewId);
      if (view) {
        const actions = await this.getActionsByViewId(view.id);
        const actionPermissions = await this.getActionPermissionsByPerfilId(perfilId);
        
        // Filter actions that the profile has permission for
        const allowedActions = actions.filter(action => 
          actionPermissions.some(ap => ap.actionId === action.id && ap.viewId === view.id)
        );
        
        result.push({
          ...view,
          acciones: allowedActions
        });
      }
    }
    
    return result;
  }

  async getProfilePermissions(perfilId: number): Promise<ProfilePermissions> {
    const perfil = await this.getPerfilById(perfilId);
    if (!perfil) throw new Error("Perfil no encontrado");
    
    const viewsWithActions = await this.getViewsWithActionsByPerfilId(perfilId);
    
    return {
      perfil,
      vistas: viewsWithActions.map(view => ({
        vista: view,
        acciones: view.acciones
      }))
    };
  }

  async hasViewPermission(perfilId: number, viewNombre: string): Promise<boolean> {
    const view = await this.getSystemViewByNombre(viewNombre);
    if (!view) return false;
    
    const permissions = await this.getViewPermissionsByPerfilId(perfilId);
    return permissions.some(p => p.viewId === view.id && p.activo);
  }

  async hasActionPermission(perfilId: number, viewNombre: string, actionNombre: string): Promise<boolean> {
    const view = await this.getSystemViewByNombre(viewNombre);
    if (!view) return false;
    
    const actions = await this.getActionsByViewId(view.id);
    const action = actions.find(a => a.nombre === actionNombre);
    if (!action) return false;
    
    const permissions = await this.getActionPermissionsByPerfilId(perfilId);
    return permissions.some(p => p.viewId === view.id && p.actionId === action.id && p.activo);
  }

  // Bulk permission management
  async updateProfilePermissions(perfilId: number, permissions: {
    vistas: Array<{ vistaId: number; acciones: number[] }>;
  }): Promise<void> {
    // Delete existing permissions
    await this.deleteViewPermissionsByPerfilId(perfilId);
    await this.deleteActionPermissionsByPerfilId(perfilId);
    
    // Create new permissions
    for (const vista of permissions.vistas) {
      // Create view permission
      await this.createProfileViewPermission({
        perfilId,
        viewId: vista.vistaId,
        activo: true
      });
      
      // Create action permissions
      for (const actionId of vista.acciones) {
        await this.createProfileActionPermission({
          perfilId,
          viewId: vista.vistaId,
          actionId,
          activo: true
        });
      }
    }
  }

  // Initialize system views and actions
  async initializeSystemViewsAndActions(): Promise<void> {
    // Only initialize if no views exist
    if (this.systemViews.size > 0) return;

    // Definición completa de todas las vistas del sistema y sus acciones
    const systemViewsData = [
      {
        nombre: "dashboard",
        displayName: "Dashboard Principal",
        descripcion: "Panel principal con estadísticas y métricas",
        ruta: "/dashboard",
        modulo: "general",
        icono: "BarChart3",
        orden: 1,
        acciones: [
          { nombre: "ver_dashboard", displayName: "Ver Dashboard", descripcion: "Acceso al panel principal", tipo: "view" },
          { nombre: "ver_metricas", displayName: "Ver Métricas", descripcion: "Visualizar métricas del sistema", tipo: "view" },
          { nombre: "exportar_reportes", displayName: "Exportar Reportes", descripcion: "Exportar datos del dashboard", tipo: "button" }
        ]
      },
      {
        nombre: "usuarios",
        displayName: "Gestión de Usuarios",
        descripcion: "Administración de usuarios del sistema",
        ruta: "/seguridad/usuarios",
        modulo: "seguridad",
        icono: "Users",
        orden: 2,
        acciones: [
          { nombre: "ver_usuarios", displayName: "Ver Usuarios", descripcion: "Listar usuarios del sistema", tipo: "view" },
          { nombre: "crear_usuario", displayName: "Crear Usuario", descripcion: "Crear nuevos usuarios", tipo: "form" },
          { nombre: "editar_usuario", displayName: "Editar Usuario", descripcion: "Modificar información de usuarios", tipo: "form" },
          { nombre: "eliminar_usuario", displayName: "Eliminar Usuario", descripcion: "Eliminar usuarios del sistema", tipo: "button" },
          { nombre: "resetear_password", displayName: "Resetear Contraseña", descripcion: "Restablecer contraseñas de usuario", tipo: "button" }
        ]
      },
      {
        nombre: "perfiles",
        displayName: "Gestión de Perfiles",
        descripcion: "Administración de perfiles y roles",
        ruta: "/seguridad/perfiles",
        modulo: "seguridad",
        icono: "UserCheck",
        orden: 3,
        acciones: [
          { nombre: "ver_perfiles", displayName: "Ver Perfiles", descripcion: "Listar perfiles del sistema", tipo: "view" },
          { nombre: "crear_perfil", displayName: "Crear Perfil", descripcion: "Crear nuevos perfiles", tipo: "form" },
          { nombre: "editar_perfil", displayName: "Editar Perfil", descripcion: "Modificar perfiles existentes", tipo: "form" },
          { nombre: "eliminar_perfil", displayName: "Eliminar Perfil", descripcion: "Eliminar perfiles", tipo: "button" },
          { nombre: "gestionar_permisos", displayName: "Gestionar Permisos", descripcion: "Configurar permisos de perfiles", tipo: "form" }
        ]
      },
      {
        nombre: "candidatos",
        displayName: "Gestión de Candidatos",
        descripcion: "Administración de candidatos",
        ruta: "/registros/candidatos",
        modulo: "registros",
        icono: "UserPlus",
        orden: 4,
        acciones: [
          { nombre: "ver_candidatos", displayName: "Ver Candidatos", descripcion: "Listar candidatos", tipo: "view" },
          { nombre: "crear_candidato", displayName: "Crear Candidato", descripcion: "Registrar nuevos candidatos", tipo: "form" },
          { nombre: "editar_candidato", displayName: "Editar Candidato", descripcion: "Modificar información de candidatos", tipo: "form" },
          { nombre: "aprobar_candidato", displayName: "Aprobar Candidato", descripcion: "Aprobar o rechazar candidatos", tipo: "button" },
          { nombre: "enviar_whatsapp", displayName: "Enviar WhatsApp", descripcion: "Enviar mensajes por WhatsApp", tipo: "button" },
          { nombre: "enviar_email", displayName: "Enviar Email", descripcion: "Enviar correos electrónicos", tipo: "button" }
        ]
      },
      {
        nombre: "empresas",
        displayName: "Gestión de Empresas",
        descripcion: "Administración de empresas afiliadas",
        ruta: "/registros/empresas",
        modulo: "registros",
        icono: "Building2",
        orden: 5,
        acciones: [
          { nombre: "ver_empresas", displayName: "Ver Empresas", descripcion: "Listar empresas afiliadas", tipo: "view" },
          { nombre: "crear_empresa", displayName: "Crear Empresa", descripcion: "Registrar nuevas empresas", tipo: "form" },
          { nombre: "editar_empresa", displayName: "Editar Empresa", descripcion: "Modificar información de empresas", tipo: "form" },
          { nombre: "eliminar_empresa", displayName: "Eliminar Empresa", descripcion: "Eliminar empresas", tipo: "button" },
          { nombre: "configurar_campos", displayName: "Configurar Campos", descripcion: "Configurar campos visibles", tipo: "form" }
        ]
      },
      {
        nombre: "qr",
        displayName: "Gestión de QR",
        descripcion: "Administración de códigos QR",
        ruta: "/empresa/qr",
        modulo: "empresa",
        icono: "QrCode",
        orden: 6,
        acciones: [
          { nombre: "ver_qr", displayName: "Ver QR", descripcion: "Visualizar códigos QR", tipo: "view" },
          { nombre: "generar_qr", displayName: "Generar QR", descripcion: "Crear nuevos códigos QR", tipo: "button" },
          { nombre: "configurar_qr", displayName: "Configurar QR", descripcion: "Configurar parámetros de QR", tipo: "form" },
          { nombre: "eliminar_qr", displayName: "Eliminar QR", descripcion: "Eliminar códigos QR", tipo: "button" },
          { nombre: "enviar_qr_whatsapp", displayName: "Enviar QR por WhatsApp", descripcion: "Compartir QR via WhatsApp", tipo: "button" },
          { nombre: "enviar_qr_email", displayName: "Enviar QR por Email", descripcion: "Compartir QR via email", tipo: "button" }
        ]
      },
      {
        nombre: "analistas",
        displayName: "Gestión de Analistas",
        descripcion: "Administración de analistas",
        ruta: "/analistas",
        modulo: "recursos",
        icono: "UserCheck",
        orden: 7,
        acciones: [
          { nombre: "ver_analistas", displayName: "Ver Analistas", descripcion: "Listar analistas", tipo: "view" },
          { nombre: "crear_analista", displayName: "Crear Analista", descripcion: "Registrar nuevos analistas", tipo: "form" },
          { nombre: "editar_analista", displayName: "Editar Analista", descripcion: "Modificar información de analistas", tipo: "form" },
          { nombre: "eliminar_analista", displayName: "Eliminar Analista", descripcion: "Eliminar analistas", tipo: "button" },
          { nombre: "exportar_analistas", displayName: "Exportar Analistas", descripcion: "Exportar lista de analistas", tipo: "button" }
        ]
      },
      {
        nombre: "ordenes",
        displayName: "Expedición de Órdenes",
        descripcion: "Gestión de órdenes de trabajo",
        ruta: "/ordenes/expedicion",
        modulo: "ordenes",
        icono: "FileText",
        orden: 8,
        acciones: [
          { nombre: "ver_ordenes", displayName: "Ver Órdenes", descripcion: "Listar órdenes de trabajo", tipo: "view" },
          { nombre: "crear_orden", displayName: "Crear Orden", descripcion: "Generar nuevas órdenes", tipo: "form" },
          { nombre: "editar_orden", displayName: "Editar Orden", descripcion: "Modificar órdenes existentes", tipo: "form" },
          { nombre: "aprobar_orden", displayName: "Aprobar Orden", descripcion: "Aprobar órdenes de trabajo", tipo: "button" },
          { nombre: "rechazar_orden", displayName: "Rechazar Orden", descripcion: "Rechazar órdenes de trabajo", tipo: "button" },
          { nombre: "imprimir_orden", displayName: "Imprimir Orden", descripcion: "Generar PDF de la orden", tipo: "button" }
        ]
      },
      {
        nombre: "certificados",
        displayName: "Expedición de Certificados",
        descripcion: "Gestión de certificados médicos",
        ruta: "/certificados/expedicion",
        modulo: "certificados",
        icono: "Award",
        orden: 9,
        acciones: [
          { nombre: "ver_certificados", displayName: "Ver Certificados", descripcion: "Listar certificados emitidos", tipo: "view" },
          { nombre: "generar_certificado", displayName: "Generar Certificado", descripcion: "Crear nuevos certificados", tipo: "form" },
          { nombre: "editar_certificado", displayName: "Editar Certificado", descripcion: "Modificar certificados", tipo: "form" },
          { nombre: "firmar_certificado", displayName: "Firmar Certificado", descripcion: "Aplicar firma digital", tipo: "button" },
          { nombre: "imprimir_certificado", displayName: "Imprimir Certificado", descripcion: "Generar PDF del certificado", tipo: "button" },
          { nombre: "enviar_certificado", displayName: "Enviar Certificado", descripcion: "Enviar certificado por email", tipo: "button" }
        ]
      },
      {
        nombre: "maestro",
        displayName: "Configuración Maestro",
        descripcion: "Configuración de tipos y documentos",
        ruta: "/maestro/tipos-candidatos",
        modulo: "configuracion",
        icono: "Settings",
        orden: 10,
        acciones: [
          { nombre: "ver_tipos_candidatos", displayName: "Ver Tipos de Candidatos", descripcion: "Listar tipos de candidatos", tipo: "view" },
          { nombre: "crear_tipo_candidato", displayName: "Crear Tipo Candidato", descripcion: "Crear nuevos tipos", tipo: "form" },
          { nombre: "editar_tipo_candidato", displayName: "Editar Tipo Candidato", descripcion: "Modificar tipos existentes", tipo: "form" },
          { nombre: "eliminar_tipo_candidato", displayName: "Eliminar Tipo Candidato", descripcion: "Eliminar tipos", tipo: "button" },
          { nombre: "configurar_documentos", displayName: "Configurar Documentos", descripcion: "Gestionar documentos requeridos", tipo: "form" }
        ]
      },
      {
        nombre: "reportes",
        displayName: "Reportes y Análisis",
        descripcion: "Generación de reportes del sistema",
        ruta: "/reportes",
        modulo: "reportes",
        icono: "BarChart3",
        orden: 11,
        acciones: [
          { nombre: "ver_reportes", displayName: "Ver Reportes", descripcion: "Acceder a reportes del sistema", tipo: "view" },
          { nombre: "generar_reporte_candidatos", displayName: "Reporte de Candidatos", descripcion: "Generar reporte de candidatos", tipo: "button" },
          { nombre: "generar_reporte_ordenes", displayName: "Reporte de Órdenes", descripcion: "Generar reporte de órdenes", tipo: "button" },
          { nombre: "generar_reporte_metricas", displayName: "Reporte de Métricas", descripcion: "Generar reporte de métricas", tipo: "button" },
          { nombre: "exportar_excel", displayName: "Exportar a Excel", descripcion: "Exportar reportes a Excel", tipo: "button" },
          { nombre: "programar_reporte", displayName: "Programar Reporte", descripcion: "Programar reportes automáticos", tipo: "form" }
        ]
      }
    ];

    // Crear las vistas del sistema
    for (const viewData of systemViewsData) {
      const { acciones, ...viewInfo } = viewData;
      
      const view = await this.createSystemView({
        ...viewInfo,
        activo: true
      });

      // Crear las acciones para cada vista
      for (let i = 0; i < acciones.length; i++) {
        await this.createViewAction({
          viewId: view.id,
          ...acciones[i],
          orden: i + 1,
          activo: true
        });
      }
    }
  }

  // ========== ORDER TEMPLATE OPERATIONS ==========

  async getEmpresaOrderTemplates(empresaId: number): Promise<EmpresaOrderTemplate[]> {
    return Array.from(this.empresaOrderTemplates.values()).filter(
      template => template.empresaId === empresaId && template.activo
    );
  }

  async getEmpresaOrderTemplate(id: number): Promise<EmpresaOrderTemplate | undefined> {
    return this.empresaOrderTemplates.get(id);
  }

  async getDefaultEmpresaOrderTemplate(empresaId: number): Promise<EmpresaOrderTemplate | undefined> {
    return Array.from(this.empresaOrderTemplates.values()).find(
      template => template.empresaId === empresaId && template.esDefault && template.activo
    );
  }

  async createEmpresaOrderTemplate(template: InsertEmpresaOrderTemplate): Promise<EmpresaOrderTemplate> {
    const id = this.currentEmpresaOrderTemplateId++;
    
    // Si esta plantilla se marca como default, desactivar las otras default de la misma empresa
    if (template.esDefault) {
      for (const [existingId, existing] of this.empresaOrderTemplates.entries()) {
        if (existing.empresaId === template.empresaId && existing.esDefault) {
          this.empresaOrderTemplates.set(existingId, { ...existing, esDefault: false });
        }
      }
    }

    const newTemplate: EmpresaOrderTemplate = {
      id,
      empresaId: template.empresaId,
      nombre: template.nombre,
      descripcion: template.descripcion || null,
      configuracionCampos: template.configuracionCampos,
      esDefault: template.esDefault || false,
      activo: template.activo !== undefined ? template.activo : true,
      fechaCreacion: new Date(),
      fechaModificacion: new Date(),
    };
    
    this.empresaOrderTemplates.set(id, newTemplate);
    return newTemplate;
  }

  async updateEmpresaOrderTemplate(id: number, template: Partial<InsertEmpresaOrderTemplate>): Promise<EmpresaOrderTemplate> {
    const existing = this.empresaOrderTemplates.get(id);
    if (!existing) {
      throw new Error(`Template with id ${id} not found`);
    }

    // Si se marca como default, desactivar las otras default de la misma empresa
    if (template.esDefault && !existing.esDefault) {
      for (const [existingId, existingTemplate] of this.empresaOrderTemplates.entries()) {
        if (existingTemplate.empresaId === existing.empresaId && existingTemplate.esDefault) {
          this.empresaOrderTemplates.set(existingId, { ...existingTemplate, esDefault: false });
        }
      }
    }

    const updated = { 
      ...existing, 
      ...template, 
      fechaModificacion: new Date() 
    };
    this.empresaOrderTemplates.set(id, updated);
    return updated;
  }

  async deleteEmpresaOrderTemplate(id: number): Promise<void> {
    const template = this.empresaOrderTemplates.get(id);
    if (template) {
      // Soft delete
      this.empresaOrderTemplates.set(id, { ...template, activo: false });
    }
  }

  async setDefaultEmpresaOrderTemplate(empresaId: number, templateId: number): Promise<void> {
    // Desactivar todas las plantillas default de la empresa
    for (const [id, template] of this.empresaOrderTemplates.entries()) {
      if (template.empresaId === empresaId && template.esDefault) {
        this.empresaOrderTemplates.set(id, { ...template, esDefault: false });
      }
    }

    // Activar la plantilla especificada como default
    const template = this.empresaOrderTemplates.get(templateId);
    if (template && template.empresaId === empresaId) {
      this.empresaOrderTemplates.set(templateId, { ...template, esDefault: true });
    }
  }

  // ========== DATABASE USER AUTHENTICATION METHODS ==========

  async getUsuarioByEmailOrUsername(identifier: string): Promise<any> {
    // Buscar en usuarios memoria storage (simulación de base de datos)
    const adminUser = await this.getUserByUsername(identifier);
    if (adminUser) {
      return {
        id: adminUser.id,
        username: adminUser.username,
        email: adminUser.email,
        primer_nombre: adminUser.primerNombre,
        primer_apellido: adminUser.primerApellido,
        activo: adminUser.activo,
        password_hash: adminUser.password // En memoria, la contraseña está sin hash
      };
    }

    // Buscar por email
    const userByEmail = await this.getUserByEmail(identifier);
    if (userByEmail) {
      return {
        id: userByEmail.id,
        username: userByEmail.username,
        email: userByEmail.email,
        primer_nombre: userByEmail.primerNombre,
        primer_apellido: userByEmail.primerApellido,
        activo: userByEmail.activo,
        password_hash: userByEmail.password // En memoria, la contraseña está sin hash
      };
    }

    return null;
  }

  async verifyUserPassword(userId: number, password: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;

    // En memoria, comparar directamente
    return user.password === password;
  }

  async verifyUserEmpresaAccess(userId: number, empresaId: number): Promise<boolean> {
    // En memoria, simular que todos los usuarios tienen acceso a todas las empresas
    // En una implementación real, esto verificaría la tabla gen_usuario_empresas
    return true;
  }
  // ========== UBICACIONES OPERATIONS ==========

  async getAllPaises(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('paises')
        .select('*')
        .order('nombre');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error obteniendo países:', error);
      return [];
    }
  }

  async createPais(data: { nombre: string; codigo_iso?: string }): Promise<any> {
    try {
      const { data: nuevoPais, error } = await supabase
        .from('paises')
        .insert({
          nombre: data.nombre,
          codigo_iso: data.codigo_iso || null
        })
        .select()
        .single();
      
      if (error) throw error;
      console.log("País creado:", nuevoPais);
      return nuevoPais;
    } catch (error) {
      console.error('Error creando país:', error);
      throw error;
    }
  }

  async getAllDepartamentos(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('departamentos')
        .select(`
          *,
          paises (
            id,
            nombre,
            codigo_iso
          )
        `)
        .order('nombre');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error obteniendo departamentos:', error);
      return [];
    }
  }

  async createDepartamento(data: { nombre: string; pais_id: number; codigo_dane?: string }): Promise<any> {
    try {
      const { data: nuevoDepartamento, error } = await supabase
        .from('departamentos')
        .insert({
          nombre: data.nombre,
          pais_id: data.pais_id,
          codigo_dane: data.codigo_dane || null
        })
        .select(`
          *,
          paises (
            id,
            nombre,
            codigo_iso
          )
        `)
        .single();
      
      if (error) throw error;
      console.log("Departamento creado:", nuevoDepartamento);
      return nuevoDepartamento;
    } catch (error) {
      console.error('Error creando departamento:', error);
      throw error;
    }
  }

  async getAllCiudades(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('ciudades')
        .select(`
          *,
          departamentos (
            id,
            nombre,
            codigo_dane,
            paises (
              id,
              nombre,
              codigo_iso
            )
          )
        `)
        .order('nombre');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error obteniendo ciudades:', error);
      return [];
    }
  }

  async createCiudad(data: { nombre: string; departamento_id: number; codigo_dane?: string }): Promise<any> {
    try {
      const { data: nuevaCiudad, error } = await supabase
        .from('ciudades')
        .insert({
          nombre: data.nombre,
          departamento_id: data.departamento_id,
          codigo_dane: data.codigo_dane || null
        })
        .select(`
          *,
          departamentos (
            id,
            nombre,
            codigo_dane,
            paises (
              id,
              nombre,
              codigo_iso
            )
          )
        `)
        .single();
      
      if (error) throw error;
      console.log("Ciudad creada:", nuevaCiudad);
      return nuevaCiudad;
    } catch (error) {
      console.error('Error creando ciudad:', error);
      throw error;
    }
  }
}

export const storage = new MemStorage();

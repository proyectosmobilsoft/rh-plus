import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  varchar,
  timestamp,
  date,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Tabla de usuarios admin
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  // Información personal básica
  identificacion: varchar("identificacion", { length: 20 }).notNull().unique(),
  primerNombre: varchar("primer_nombre", { length: 100 }).notNull(),
  segundoNombre: varchar("segundo_nombre", { length: 100 }),
  primerApellido: varchar("primer_apellido", { length: 100 }).notNull(),
  segundoApellido: varchar("segundo_apellido", { length: 100 }),
  telefono: varchar("telefono", { length: 20 }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  
  // Credenciales de acceso
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  
  // Metadatos
  fechaCreacion: timestamp("fecha_creacion").defaultNow(),
  activo: boolean("activo").default(true),
});

// Tabla de tipos de perfiles/roles
export const perfiles = pgTable("perfiles", {
  id: serial("id").primaryKey(),
  nombre: varchar("nombre", { length: 50 }).notNull().unique(), // administrador, candidato, coordinador, administrador_general
  descripcion: text("descripcion"),
  permisos: jsonb("permisos"), // JSON con permisos específicos
  fechaCreacion: timestamp("fecha_creacion").defaultNow(),
  activo: boolean("activo").default(true),
});

// Tabla de relación usuario-perfiles (muchos a muchos)
export const userPerfiles = pgTable("user_perfiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  perfilId: integer("perfil_id").notNull().references(() => perfiles.id),
  fechaAsignacion: timestamp("fecha_asignacion").defaultNow(),
});

// Tabla de candidatos que se registran
export const candidatos = pgTable("candidatos", {
  id: serial("id").primaryKey(),
  // Credenciales de acceso
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  deberCambiarPassword: boolean("deber_cambiar_password").default(true), // Para forzar cambio en primer login
  perfilId: integer("perfil_id").references(() => perfiles.id), // Referencia al tipo de perfil

  // Información personal
  nombres: varchar("nombres", { length: 100 }).notNull(),
  apellidos: varchar("apellidos", { length: 100 }).notNull(),
  tipoDocumento: varchar("tipo_documento", { length: 10 }).notNull(),
  numeroDocumento: varchar("numero_documento", { length: 20 })
    .notNull()
    .unique(),
  fechaNacimiento: date("fecha_nacimiento"),
  edad: integer("edad"),
  sexo: varchar("sexo", { length: 10 }),
  estadoCivil: varchar("estado_civil", { length: 20 }),
  telefono: varchar("telefono", { length: 20 }),
  direccion: text("direccion"),
  ciudad: varchar("ciudad", { length: 100 }),

  // Información laboral
  cargoAspirado: varchar("cargo_aspirado", { length: 100 }),
  experienciaLaboral: jsonb("experiencia_laboral"),

  // Información de salud
  eps: varchar("eps", { length: 100 }),
  arl: varchar("arl", { length: 100 }),
  fondoPension: varchar("fondo_pension", { length: 100 }),
  grupoSanguineo: varchar("grupo_sanguineo", { length: 5 }),

  // Educación
  nivelEducativo: varchar("nivel_educativo", { length: 50 }),
  educacion: jsonb("educacion"),

  // Contacto de emergencia
  contactoEmergenciaNombre: varchar("contacto_emergencia_nombre", {
    length: 100,
  }),
  contactoEmergenciaTelefono: varchar("contacto_emergencia_telefono", {
    length: 20,
  }),
  contactoEmergenciaRelacion: varchar("contacto_emergencia_relacion", {
    length: 50,
  }),

  // Archivos
  hojaDeVida: text("hoja_de_vida"), // URL o base64 del archivo
  fotografia: text("fotografia"), // URL o base64 de la foto

  // Metadatos
  fechaRegistro: timestamp("fecha_registro").defaultNow(),
  estado: varchar("estado", { length: 20 }).default("pendiente"), // pendiente, aprobado, rechazado
  notasAprobacion: text("notas_aprobacion"), // Notas sobre la aprobación/rechazo del candidato
  completado: boolean("completado").default(false),
  empresaId: integer("empresa_id").references(() => empresas.id), // Referencia a la empresa que creó el candidato
});

// Tabla de empresas/usuarios del portal
export const empresas = pgTable("empresas", {
  id: serial("id").primaryKey(),
  // Credenciales de acceso
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),

  // Información de la empresa
  nombreEmpresa: varchar("nombre_empresa", { length: 200 }).notNull(),
  nit: varchar("nit", { length: 20 }).notNull().unique(),
  direccion: text("direccion"),
  telefono: varchar("telefono", { length: 20 }),
  ciudad: varchar("ciudad", { length: 100 }),
  contactoPrincipal: varchar("contacto_principal", { length: 100 }),
  cargoContacto: varchar("cargo_contacto", { length: 100 }),

  // Metadatos
  fechaRegistro: timestamp("fecha_registro").defaultNow(),
  estado: varchar("estado", { length: 20 }).default("activo"), // activo, inactivo
});

// Tabla de clientes
export const clientes = pgTable("clientes", {
  id: serial("id").primaryKey(),
  // Credenciales de acceso
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),

  // Información personal
  nombreCompleto: varchar("nombre_completo", { length: 200 }).notNull(),
  empresa: varchar("empresa", { length: 200 }).notNull(),
  regional: varchar("regional", { length: 100 }).notNull(),
  sucursal: varchar("sucursal", { length: 100 }).notNull(),

  // Metadatos
  fechaRegistro: timestamp("fecha_registro").defaultNow(),
  estado: varchar("estado", { length: 20 }).default("activo"), // activo, inactivo
});

// Esquemas de inserción
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  fechaCreacion: true,
});

export const insertUserPerfilSchema = createInsertSchema(userPerfiles).omit({
  id: true,
  fechaAsignacion: true,
});

export const insertPerfilSchema = createInsertSchema(perfiles).omit({
  id: true,
  fechaCreacion: true,
});

export const insertCandidatoSchema = createInsertSchema(candidatos).omit({
  id: true,
  fechaRegistro: true,
});

export const createCandidatoFromPerfilSchema = z.object({
  cedula: z.string().min(6, "Cédula requerida"),
  nombres: z.string().min(2, "Nombres requeridos"),
  apellidos: z.string().min(2, "Apellidos requeridos"),
  email: z.string().email("Email inválido"),
  tipoDocumento: z.string().default("CC"),
});

export const createAdminUserSchema = z.object({
  nombres: z.string().min(2, "Nombres requeridos"),
  apellidos: z.string().min(2, "Apellidos requeridos"),
  email: z.string().email("Email inválido"),
  username: z.string().min(3, "Username debe tener al menos 3 caracteres"),
  tipoUsuario: z.enum([
    "administrador",
    "coordinador",
    "administrador_general",
  ]),
});

export const insertEmpresaSchema = createInsertSchema(empresas).omit({
  id: true,
  fechaRegistro: true,
});

export const insertClienteSchema = createInsertSchema(clientes).omit({
  id: true,
  fechaRegistro: true,
});

export const createClienteSchema = z.object({
  nombreCompleto: z.string().min(2, "Nombre completo requerido"),
  email: z.string().email("Email inválido"),
  password: z
    .string()
    .min(8, "Contraseña debe tener al menos 8 caracteres")
    .optional(),
  empresa: z.string().min(2, "Empresa requerida"),
  regional: z.string().min(2, "Regional requerida"),
  sucursal: z.string().min(2, "Sucursal requerida"),
});

export const createEmpresaSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Password debe tener al menos 8 caracteres"),
  nombreEmpresa: z.string().min(2, "Nombre de empresa requerido"),
  nit: z.string().min(6, "NIT requerido"),
  direccion: z.string().optional(),
  telefono: z.string().optional(),
  ciudad: z.string().optional(),
  contactoPrincipal: z.string().min(2, "Contacto principal requerido"),
  cargoContacto: z.string().optional(),
});

// Tipos TypeScript
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertUserPerfil = z.infer<typeof insertUserPerfilSchema>;
export type UserPerfil = typeof userPerfiles.$inferSelect;
export type InsertPerfil = z.infer<typeof insertPerfilSchema>;
export type Perfil = typeof perfiles.$inferSelect;
export type InsertCandidato = z.infer<typeof insertCandidatoSchema>;
export type Candidato = typeof candidatos.$inferSelect;
export type CreateCandidatoFromPerfil = z.infer<
  typeof createCandidatoFromPerfilSchema
>;
export type CreateAdminUser = z.infer<typeof createAdminUserSchema>;
export type InsertEmpresa = z.infer<typeof insertEmpresaSchema>;
export type Empresa = typeof empresas.$inferSelect;
export type CreateEmpresa = z.infer<typeof createEmpresaSchema>;

// Tipos TypeScript para clientes
export type InsertCliente = z.infer<typeof insertClienteSchema>;
export type Cliente = typeof clientes.$inferSelect;
export type CreateCliente = z.infer<typeof createClienteSchema>;

// Tabla maestro para tipos de candidatos
export const tiposCandidatos = pgTable("tipos_candidatos", {
  id: serial("id").primaryKey(),
  nombre: varchar("nombre", { length: 100 }).notNull().unique(), // "Ingeniero", "Diseñador", "Contador", etc.
  descripcion: text("descripcion"),
  activo: boolean("activo").default(true),
  fechaCreacion: timestamp("fecha_creacion").defaultNow(),
});

// Tabla de documentos disponibles en el sistema
export const documentosTipo = pgTable("documentos_tipo", {
  id: serial("id").primaryKey(),
  nombre: varchar("nombre", { length: 100 }).notNull().unique(), // "Hoja de Vida", "Diploma", "Certificaciones", etc.
  descripcion: text("descripcion"),
  requerido: boolean("requerido").default(false), // Si es obligatorio por defecto
  activo: boolean("activo").default(true),
  fechaCreacion: timestamp("fecha_creacion").defaultNow(),
});

// Tabla relación: qué documentos requiere cada tipo de candidato
export const tiposCandidatosDocumentos = pgTable(
  "tipos_candidatos_documentos",
  {
    id: serial("id").primaryKey(),
    tipoCandidatoId: integer("tipo_candidato_id")
      .references(() => tiposCandidatos.id)
      .notNull(),
    documentoTipoId: integer("documento_tipo_id")
      .references(() => documentosTipo.id)
      .notNull(),
    obligatorio: boolean("obligatorio").default(true),
    orden: integer("orden").default(0), // Para ordenar los documentos en el formulario
    fechaCreacion: timestamp("fecha_creacion").defaultNow(),
  },
);

// Tabla para almacenar los documentos subidos por candidatos
export const candidatosDocumentos = pgTable("candidatos_documentos", {
  id: serial("id").primaryKey(),
  candidatoId: integer("candidato_id")
    .references(() => candidatos.id)
    .notNull(),
  documentoTipoId: integer("documento_tipo_id")
    .references(() => documentosTipo.id)
    .notNull(),
  archivo: text("archivo"), // URL o path del archivo
  nombreArchivo: varchar("nombre_archivo", { length: 255 }),
  fechaSubida: timestamp("fecha_subida").defaultNow(),
  estado: varchar("estado", { length: 20 }).default("pendiente"), // "pendiente", "aprobado", "rechazado"
});

// Schemas de validación
export const insertTipoCandidatoSchema = createInsertSchema(
  tiposCandidatos,
).omit({
  id: true,
  fechaCreacion: true,
});

export const insertDocumentoTipoSchema = createInsertSchema(
  documentosTipo,
).omit({
  id: true,
  fechaCreacion: true,
});

export const insertTipoCandidatoDocumentoSchema = createInsertSchema(
  tiposCandidatosDocumentos,
).omit({
  id: true,
  fechaCreacion: true,
});

export const insertCandidatoDocumentoSchema = createInsertSchema(
  candidatosDocumentos,
).omit({
  id: true,
  fechaSubida: true,
});

// Tipos TypeScript para las nuevas tablas
export type InsertTipoCandidato = z.infer<typeof insertTipoCandidatoSchema>;
export type TipoCandidato = typeof tiposCandidatos.$inferSelect;
export type InsertDocumentoTipo = z.infer<typeof insertDocumentoTipoSchema>;
export type DocumentoTipo = typeof documentosTipo.$inferSelect;
export type InsertTipoCandidatoDocumento = z.infer<
  typeof insertTipoCandidatoDocumentoSchema
>;
export type TipoCandidatoDocumento =
  typeof tiposCandidatosDocumentos.$inferSelect;
export type InsertCandidatoDocumento = z.infer<
  typeof insertCandidatoDocumentoSchema
>;
export type CandidatoDocumento = typeof candidatosDocumentos.$inferSelect;

// Menu management schemas
export const menuNodes = pgTable("menu_nodes", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  tipo: varchar("tipo", { length: 10 }).notNull(), // 'folder' or 'file'
  parentId: integer("parent_id").references(() => menuNodes.id),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const menuPermissions = pgTable("menu_permissions", {
  id: serial("id").primaryKey(),
  nodeId: integer("node_id")
    .references(() => menuNodes.id)
    .notNull(),
  nombreVista: varchar("nombre_vista", { length: 255 }).notNull(),
  ruta: varchar("ruta", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const menuActions = pgTable("menu_actions", {
  id: serial("id").primaryKey(),
  permissionId: integer("permission_id")
    .references(() => menuPermissions.id)
    .notNull(),
  codigo: varchar("codigo", { length: 100 }).notNull(),
  nombre: varchar("nombre", { length: 255 }).notNull(),
  tipo: varchar("tipo", { length: 50 }).notNull().default("Accion"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tablas para gestión de perfiles y permisos
export const perfilMenus = pgTable("perfil_menus", {
  id: serial("id").primaryKey(),
  perfilId: integer("perfil_id")
    .references(() => perfiles.id)
    .notNull(),
  menuNodeId: integer("menu_node_id")
    .references(() => menuNodes.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const perfilAcciones = pgTable("perfil_acciones", {
  id: serial("id").primaryKey(),
  perfilMenuId: integer("perfil_menu_id")
    .references(() => perfilMenus.id)
    .notNull(),
  menuActionId: integer("menu_action_id")
    .references(() => menuActions.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertMenuNodeSchema = createInsertSchema(menuNodes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMenuPermissionSchema = createInsertSchema(
  menuPermissions,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMenuActionSchema = createInsertSchema(menuActions).omit({
  id: true,
  createdAt: true,
});

export const insertPerfilMenuSchema = createInsertSchema(perfilMenus).omit({
  id: true,
  createdAt: true,
});

export const insertPerfilAccionSchema = createInsertSchema(perfilAcciones).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertMenuNode = z.infer<typeof insertMenuNodeSchema>;
export type MenuNode = typeof menuNodes.$inferSelect;
export type InsertMenuPermission = z.infer<typeof insertMenuPermissionSchema>;
export type MenuPermission = typeof menuPermissions.$inferSelect;
export type InsertMenuAction = z.infer<typeof insertMenuActionSchema>;
export type MenuAction = typeof menuActions.$inferSelect;
export type InsertPerfilMenu = z.infer<typeof insertPerfilMenuSchema>;
export type PerfilMenu = typeof perfilMenus.$inferSelect;
export type InsertPerfilAccion = z.infer<typeof insertPerfilAccionSchema>;
export type PerfilAccion = typeof perfilAcciones.$inferSelect;

// Tabla de analistas
export const analistas = pgTable("analistas", {
  id: serial("id").primaryKey(),
  nombre: varchar("nombre", { length: 100 }).notNull(),
  apellido: varchar("apellido", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  telefono: varchar("telefono", { length: 20 }),
  regional: varchar("regional", { length: 100 }).notNull(),
  clienteAsignado: varchar("cliente_asignado", { length: 100 }),
  nivelPrioridad: varchar("nivel_prioridad", { length: 20 })
    .notNull()
    .default("medio"), // "alto", "medio", "bajo"
  estado: varchar("estado", { length: 20 }).notNull().default("activo"), // "activo", "inactivo"
  fechaIngreso: timestamp("fecha_ingreso").defaultNow(),
  fechaCreacion: timestamp("fecha_creacion").defaultNow(),
  fechaActualizacion: timestamp("fecha_actualizacion").defaultNow(),
});

// Esquemas de validación para analistas
export const insertAnalistaSchema = createInsertSchema(analistas).omit({
  id: true,
  fechaCreacion: true,
  fechaActualizacion: true,
}).extend({
  nivelPrioridad: z.number().min(1).max(5).transform(String), // Acepta número pero lo convierte a string
  fechaIngreso: z.string().transform((str) => new Date(str)), // Acepta string de fecha y lo convierte a Date
});

// Tipos TypeScript para analistas
export type InsertAnalista = z.infer<typeof insertAnalistaSchema>;
export type Analista = typeof analistas.$inferSelect;

// Tabla de órdenes de ingreso
export const ordenes = pgTable("ordenes", {
  id: serial("id").primaryKey(),
  numeroOrden: varchar("numero_orden", { length: 50 }).notNull().unique(),
  
  // Relaciones
  clienteId: integer("cliente_id").references(() => clientes.id),
  candidatoId: integer("candidato_id").references(() => candidatos.id),
  analistaId: integer("analista_id").references(() => analistas.id),
  empresaId: integer("empresa_id").references(() => empresas.id),
  
  // Información del trabajador
  nombres: varchar("nombres", { length: 100 }).notNull(),
  apellidos: varchar("apellidos", { length: 100 }).notNull(),
  tipoDocumento: varchar("tipo_documento", { length: 10 }).notNull().default("CC"),
  numeroDocumento: varchar("numero_documento", { length: 20 }).notNull(),
  lugarExpedicion: varchar("lugar_expedicion", { length: 100 }),
  celular: varchar("celular", { length: 20 }),
  direccion: text("direccion"),
  
  // Información de la empresa usuaria
  empresaUsuaria: varchar("empresa_usuaria", { length: 200 }),
  ciudadPrestacionServicio: varchar("ciudad_prestacion_servicio", { length: 100 }),
  departamentoPrestacionServicio: varchar("departamento_prestacion_servicio", { length: 100 }),
  
  // Información del trabajo
  cargo: varchar("cargo", { length: 100 }).notNull(),
  salario: varchar("salario", { length: 50 }),
  ciudad: varchar("ciudad", { length: 100 }).notNull(),
  fechaIngreso: date("fecha_ingreso"),
  tipoContrato: varchar("tipo_contrato", { length: 50 }),
  
  // Especificaciones para el ingreso
  salarioBasico: varchar("salario_basico", { length: 50 }),
  auxilioTransporte: varchar("auxilio_transporte", { length: 50 }),
  viajeRotativo: boolean("viaje_rotativo").default(false),
  
  // Vehículo de transporte y alimentación
  vehiculoTransporte: varchar("vehiculo_transporte", { length: 100 }),
  vehiculoAlimentacion: varchar("vehiculo_alimentacion", { length: 100 }),
  
  // Salario mensual
  salarioMensual: varchar("salario_mensual", { length: 50 }),
  
  // Jornada laboral
  jornadaLaboral: varchar("jornada_laboral", { length: 200 }),
  
  // Pagos adicionales
  pagosAuxilios: text("pagos_auxilios"),
  
  // Especificaciones adicionales
  especificacionesAdicionales: text("especificaciones_adicionales"),
  
  // Estado y seguimiento
  estado: varchar("estado", { length: 50 }).notNull().default("PENDIENTE"),
  // Estados: PENDIENTE, APROBADA, ANULADA, FINALIZADA
  prioridad: varchar("prioridad", { length: 20 }).notNull().default("media"), // alta, media, baja
  
  // Fechas de seguimiento
  fechaCreacion: timestamp("fecha_creacion").defaultNow(),
  fechaAsignacion: timestamp("fecha_asignacion"),
  fechaInicioExamenes: timestamp("fecha_inicio_examenes"),
  fechaFinalizacion: timestamp("fecha_finalizacion"),
  fechaVencimiento: timestamp("fecha_vencimiento"),
  
  // Metadatos
  observaciones: text("observaciones"),
  notasInternas: text("notas_internas"),
  leadTime: integer("lead_time"), // días transcurridos hasta finalización
  
  // Campos adicionales para el examen médico
  centroTrabajo: varchar("centro_trabajo", { length: 100 }),
  areaFuncional: varchar("area_funcional", { length: 100 }),
  tipoExamen: varchar("tipo_examen", { length: 100 }),
  examenMedicoRealizar: text("examen_medico_realizar"),
  
  // Información adicional de ubicación
  departamento: varchar("departamento", { length: 100 }),
  
  // Campos de cumplimiento
  cumpleHorario: boolean("cumple_horario").default(false),
  especifique: text("especifique"),
});

// Tabla de historial de cambios de estado
export const ordenesHistorial = pgTable("ordenes_historial", {
  id: serial("id").primaryKey(),
  ordenId: integer("orden_id").references(() => ordenes.id).notNull(),
  estadoAnterior: varchar("estado_anterior", { length: 50 }),
  estadoNuevo: varchar("estado_nuevo", { length: 50 }).notNull(),
  usuarioId: integer("usuario_id").references(() => users.id),
  motivo: text("motivo"),
  fechaCambio: timestamp("fecha_cambio").defaultNow(),
});

// Tabla de notificaciones enviadas
export const notificaciones = pgTable("notificaciones", {
  id: serial("id").primaryKey(),
  ordenId: integer("orden_id").references(() => ordenes.id),
  candidatoId: integer("candidato_id").references(() => candidatos.id),
  clienteId: integer("cliente_id").references(() => clientes.id),
  
  tipo: varchar("tipo", { length: 50 }).notNull(), // email, sms, whatsapp
  asunto: varchar("asunto", { length: 255 }),
  mensaje: text("mensaje"),
  destinatario: varchar("destinatario", { length: 255 }).notNull(),
  
  estado: varchar("estado", { length: 20 }).notNull().default("pendiente"), // pendiente, enviado, fallido
  fechaEnvio: timestamp("fecha_envio"),
  fechaCreacion: timestamp("fecha_creacion").defaultNow(),
  motivoFallo: text("motivo_fallo"),
});

// Tabla de alertas del sistema
export const alertas = pgTable("alertas", {
  id: serial("id").primaryKey(),
  tipo: varchar("tipo", { length: 50 }).notNull(), // vencimiento_orden, vencimiento_poliza, documento_pendiente
  titulo: varchar("titulo", { length: 255 }).notNull(),
  descripcion: text("descripcion"),
  
  // Relaciones opcionales según el tipo de alerta
  ordenId: integer("orden_id").references(() => ordenes.id),
  candidatoId: integer("candidato_id").references(() => candidatos.id),
  
  prioridad: varchar("prioridad", { length: 20 }).notNull().default("media"), // alta, media, baja
  estado: varchar("estado", { length: 20 }).notNull().default("activa"), // activa, resuelta, ignorada
  
  fechaVencimiento: timestamp("fecha_vencimiento"),
  fechaCreacion: timestamp("fecha_creacion").defaultNow(),
  fechaResolucion: timestamp("fecha_resolucion"),
});

// Tabla de métricas de rendimiento
export const metricas = pgTable("metricas", {
  id: serial("id").primaryKey(),
  fecha: date("fecha").notNull(),
  analistaId: integer("analista_id").references(() => analistas.id),
  clienteId: integer("cliente_id").references(() => clientes.id),
  
  // Métricas diarias
  ordenesCreadas: integer("ordenes_creadas").default(0),
  ordenesFinalizadas: integer("ordenes_finalizadas").default(0),
  ordenesEnProceso: integer("ordenes_en_proceso").default(0),
  leadTimePromedio: integer("lead_time_promedio").default(0), // en días
  
  // Métricas de calidad
  ordenesRechazadas: integer("ordenes_rechazadas").default(0),
  documentosRechazados: integer("documentos_rechazados").default(0),
  tiempoRespuestaPromedio: integer("tiempo_respuesta_promedio").default(0), // en horas
  
  fechaActualizacion: timestamp("fecha_actualizacion").defaultNow(),
});

// Esquemas de inserción
export const insertOrdenSchema = createInsertSchema(ordenes).omit({
  id: true,
  fechaCreacion: true,
  leadTime: true,
});

export const insertOrdenHistorialSchema = createInsertSchema(ordenesHistorial).omit({
  id: true,
  fechaCambio: true,
});

export const insertNotificacionSchema = createInsertSchema(notificaciones).omit({
  id: true,
  fechaCreacion: true,
});

export const insertAlertaSchema = createInsertSchema(alertas).omit({
  id: true,
  fechaCreacion: true,
});

export const insertMetricaSchema = createInsertSchema(metricas).omit({
  id: true,
  fechaActualizacion: true,
});

// Tipos TypeScript para las nuevas tablas
export type InsertOrden = z.infer<typeof insertOrdenSchema>;
export type Orden = typeof ordenes.$inferSelect;
export type InsertOrdenHistorial = z.infer<typeof insertOrdenHistorialSchema>;
export type OrdenHistorial = typeof ordenesHistorial.$inferSelect;
export type InsertNotificacion = z.infer<typeof insertNotificacionSchema>;
export type Notificacion = typeof notificaciones.$inferSelect;
export type InsertAlerta = z.infer<typeof insertAlertaSchema>;
export type Alerta = typeof alertas.$inferSelect;
export type InsertMetrica = z.infer<typeof insertMetricaSchema>;
export type Metrica = typeof metricas.$inferSelect;

// Tabla para tokens de recuperación de contraseña
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({ id: true });
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;

// ========== SISTEMA DE PERMISOS DINÁMICOS ==========

// Tabla de vistas del sistema
export const systemViews = pgTable("system_views", {
  id: serial("id").primaryKey(),
  nombre: varchar("nombre", { length: 100 }).notNull().unique(), // ej: "usuarios", "qr", "candidatos"
  displayName: varchar("display_name", { length: 150 }).notNull(), // ej: "Gestión de Usuarios"
  descripcion: text("descripcion"),
  ruta: varchar("ruta", { length: 255 }), // ej: "/seguridad/usuarios"
  modulo: varchar("modulo", { length: 100 }).notNull(), // ej: "seguridad", "empresa", "candidatos"
  icono: varchar("icono", { length: 50 }), // ej: "Users", "Shield"
  orden: integer("orden").default(0), // para ordenar en la UI
  activo: boolean("activo").default(true),
  fechaCreacion: timestamp("fecha_creacion").defaultNow(),
});

// Tabla de acciones disponibles para cada vista
export const viewActions = pgTable("view_actions", {
  id: serial("id").primaryKey(),
  viewId: integer("view_id").notNull().references(() => systemViews.id, { onDelete: 'cascade' }),
  nombre: varchar("nombre", { length: 100 }).notNull(), // ej: "crear_usuario", "ver_qr", "generar_qr"
  displayName: varchar("display_name", { length: 150 }).notNull(), // ej: "Crear Usuario"
  descripcion: text("descripcion"),
  tipo: varchar("tipo", { length: 50 }).default("button"), // button, endpoint, form, view
  orden: integer("orden").default(0),
  activo: boolean("activo").default(true),
  fechaCreacion: timestamp("fecha_creacion").defaultNow(),
});

// Tabla de permisos de vista por perfil (qué vistas puede ver un perfil)
export const profileViewPermissions = pgTable("profile_view_permissions", {
  id: serial("id").primaryKey(),
  perfilId: integer("perfil_id").notNull().references(() => perfiles.id, { onDelete: 'cascade' }),
  viewId: integer("view_id").notNull().references(() => systemViews.id, { onDelete: 'cascade' }),
  activo: boolean("activo").default(true),
  fechaCreacion: timestamp("fecha_creacion").defaultNow(),
});

// Tabla de permisos de acción por perfil (qué acciones puede ejecutar un perfil en cada vista)
export const profileActionPermissions = pgTable("profile_action_permissions", {
  id: serial("id").primaryKey(),
  perfilId: integer("perfil_id").notNull().references(() => perfiles.id, { onDelete: 'cascade' }),
  viewId: integer("view_id").notNull().references(() => systemViews.id, { onDelete: 'cascade' }),
  actionId: integer("action_id").notNull().references(() => viewActions.id, { onDelete: 'cascade' }),
  activo: boolean("activo").default(true),
  fechaCreacion: timestamp("fecha_creacion").defaultNow(),
});

// Esquemas de inserción para el sistema de permisos
export const insertSystemViewSchema = createInsertSchema(systemViews).omit({
  id: true,
  fechaCreacion: true,
});

export const insertViewActionSchema = createInsertSchema(viewActions).omit({
  id: true,
  fechaCreacion: true,
});

export const insertProfileViewPermissionSchema = createInsertSchema(profileViewPermissions).omit({
  id: true,
  fechaCreacion: true,
});

export const insertProfileActionPermissionSchema = createInsertSchema(profileActionPermissions).omit({
  id: true,
  fechaCreacion: true,
});

// Tipos TypeScript para el sistema de permisos
export type SystemView = typeof systemViews.$inferSelect;
export type InsertSystemView = z.infer<typeof insertSystemViewSchema>;
export type ViewAction = typeof viewActions.$inferSelect;
export type InsertViewAction = z.infer<typeof insertViewActionSchema>;
export type ProfileViewPermission = typeof profileViewPermissions.$inferSelect;
export type InsertProfileViewPermission = z.infer<typeof insertProfileViewPermissionSchema>;
export type ProfileActionPermission = typeof profileActionPermissions.$inferSelect;
export type InsertProfileActionPermission = z.infer<typeof insertProfileActionPermissionSchema>;

// Tipo para la estructura completa de vista con acciones
export type ViewWithActions = SystemView & {
  acciones: ViewAction[];
};

// Tipo para la estructura de permisos de un perfil
export type ProfilePermissions = {
  perfil: typeof perfiles.$inferSelect;
  vistas: Array<{
    vista: SystemView;
    acciones: ViewAction[];
  }>;
};

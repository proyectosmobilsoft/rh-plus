import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertCandidatoSchema,
  createCandidatoFromPerfilSchema,
  createAdminUserSchema,
  insertAnalistaSchema,
  insertUserSchema,
} from "@shared/schema";
import { z } from "zod";
import crypto from "crypto";
import bcrypt from "bcrypt";
// Note: Import para getUserPermissions se hará dinámicamente según necesidad

// Session middleware for simple login
declare module "express-session" {
  interface SessionData {
    userId?: number;
    candidatoId?: number;
    empresaId?: number;
    userType?: "admin" | "candidato" | "empresa" | "analista" | "cliente";
    userTable?: "users" | "candidatos" | "empresas";
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Sistema de autenticación unificado
  
  // Login unificado para todos los tipos de usuario
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: "Usuario y contraseña son requeridos" });
      }

      // Buscar usuario en todas las tablas posibles
      let user = null;
      let userRole = null;
      let userTable = null;

      // 1. Buscar en tabla de administradores/usuarios
      const adminUser = await storage.getUserByUsername(username);
      if (adminUser) {
        const isValidPassword = await bcrypt.compare(password, adminUser.password);
        if (isValidPassword) {
          user = adminUser;
          userRole = adminUser.tipoUsuario || "admin";
          userTable = "users";
        }
      }

      // 2. Buscar en tabla de candidatos
      if (!user) {
        const candidato = await storage.getCandidatoByEmail(username);
        if (candidato) {
          const isValidPassword = await bcrypt.compare(password, candidato.password);
          if (isValidPassword) {
            user = candidato;
            userRole = "candidato";
            userTable = "candidatos";
          }
        }
      }

      // 3. Buscar en tabla de empresas/clientes
      if (!user) {
        const empresa = await storage.getEmpresaByEmail(username);
        if (empresa) {
          const isValidPassword = await bcrypt.compare(password, empresa.password);
          if (isValidPassword) {
            user = empresa;
            userRole = "cliente";
            userTable = "empresas";
          }
        }
      }

      if (!user) {
        return res.status(401).json({ message: "Credenciales inválidas" });
      }

      // Verificar si el usuario está activo
      if (user.activo === false) {
        return res.status(401).json({ message: "Usuario inactivo" });
      }

      // Crear sesión
      req.session.userId = user.id;
      req.session.userType = userRole;
      req.session.userTable = userTable;

      // Preparar respuesta del usuario
      const userResponse = {
        id: user.id,
        username: user.username || user.email,
        email: user.email,
        primerNombre: user.primerNombre || user.nombres,
        primerApellido: user.primerApellido || user.apellidos,
        role: userRole,
        activo: user.activo
      };

      res.json({
        message: "Login exitoso",
        user: userResponse
      });

    } catch (error) {
      console.error("Error en login:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Verificar sesión actual
  app.get("/api/auth/session", async (req, res) => {
    try {
      if (!req.session.userId || !req.session.userType) {
        return res.status(401).json({ message: "No hay sesión activa" });
      }

      let user = null;

      // Obtener usuario según el tipo
      switch (req.session.userTable) {
        case "users":
          user = await storage.getUser(req.session.userId);
          break;
        case "candidatos":
          user = await storage.getCandidato(req.session.userId);
          break;
        case "empresas":
          user = await storage.getEmpresaById(req.session.userId);
          break;
      }

      if (!user) {
        req.session.destroy(() => {});
        return res.status(401).json({ message: "Usuario no encontrado" });
      }

      const userResponse = {
        id: user.id,
        username: user.username || user.email,
        email: user.email,
        primerNombre: user.primerNombre || user.nombres,
        primerApellido: user.primerApellido || user.apellidos,
        role: req.session.userType,
        activo: user.activo
      };

      res.json({ user: userResponse });

    } catch (error) {
      console.error("Error verificando sesión:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Error al cerrar sesión:", err);
        return res.status(500).json({ message: "Error al cerrar sesión" });
      }
      res.json({ message: "Sesión cerrada exitosamente" });
    });
  });

  // Obtener permisos del usuario
  app.get("/api/usuarios/:id/permisos", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (!req.session.userId || req.session.userId !== userId) {
        return res.status(401).json({ message: "No autorizado" });
      }

      // Obtener perfiles del usuario
      const userPerfiles = await storage.getUserPerfiles(userId);
      const additionalPermissions: string[] = [];
      
      // Combinar permisos de todos los perfiles
      for (const perfil of userPerfiles) {
        // Aquí deberías obtener los permisos específicos del perfil
        // Por ahora retornamos un array vacío para permisos adicionales
      }

      res.json(additionalPermissions);

    } catch (error) {
      console.error("Error obteniendo permisos:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Test route to diagnose the problem

  // Temporary auto-login route for development
  app.get("/api/auto-login", async (req, res) => {
    try {
      // Get the admin user
      const adminUser = await storage.getUserByUsername("admin");
      if (adminUser) {
        req.session.userId = adminUser.id;
        req.session.userType = "admin";
        res.json({
          message: "Auto-login exitoso",
          user: { id: adminUser.id, username: adminUser.username },
          session: {
            userId: req.session.userId,
            userType: req.session.userType,
          },
        });
      } else {
        res.status(404).json({ message: "Usuario admin no encontrado" });
      }
    } catch (error) {
      console.error("Error en auto-login:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Debug route to check session
  app.get("/api/session-debug", (req, res) => {
    res.json({
      session: req.session,
      userId: req.session.userId,
      userType: req.session.userType,
      sessionId: req.sessionID,
    });
  });

  // Admin Login Routes
  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res
          .status(400)
          .json({ message: "Username y password son requeridos" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Credenciales inválidas" });
      }

      req.session.userId = user.id;
      req.session.userType = "admin";

      res.json({
        message: "Login exitoso",
        user: { id: user.id, username: user.username },
      });
    } catch (error) {
      console.error("Error en login admin:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Error al cerrar sesión" });
      }
      res.json({ message: "Sesión cerrada exitosamente" });
    });
  });

  // Check auth status
  app.get("/api/auth/status", (req, res) => {
    if (req.session.userId && req.session.userType) {
      res.json({
        authenticated: true,
        userType: req.session.userType,
        userId: req.session.userId,
      });
    } else {
      res.json({ authenticated: false });
    }
  });

  // Candidato Login Routes
  app.post("/api/candidato/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ message: "Email y password son requeridos" });
      }

      const candidato = await storage.getCandidatoByEmail(email);
      if (!candidato || candidato.password !== password) {
        return res.status(401).json({ message: "Credenciales inválidas" });
      }

      req.session.candidatoId = candidato.id;
      req.session.userType = "candidato";

      res.json({
        message: "Login exitoso",
        deberCambiarPassword: candidato.deberCambiarPassword,
        candidato: {
          id: candidato.id,
          email: candidato.email,
          nombres: candidato.nombres,
          apellidos: candidato.apellidos,
          completado: candidato.completado,
        },
      });
    } catch (error) {
      console.error("Error en login candidato:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post("/api/candidato/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Error al cerrar sesión" });
      }
      res.json({ message: "Sesión cerrada exitosamente" });
    });
  });

  // Candidato Registration
  app.post("/api/candidato/register", async (req, res) => {
    try {
      const validatedData = insertCandidatoSchema.parse(req.body);

      // Check if email already exists
      const existingCandidato = await storage.getCandidatoByEmail(
        validatedData.email,
      );
      if (existingCandidato) {
        return res.status(400).json({ message: "El email ya está registrado" });
      }

      const candidato = await storage.createCandidato(validatedData);

      // Auto login after registration
      req.session.candidatoId = candidato.id;
      req.session.userType = "candidato";

      res.status(201).json({
        message: "Candidato registrado exitosamente",
        candidato: {
          id: candidato.id,
          email: candidato.email,
          nombres: candidato.nombres,
          apellidos: candidato.apellidos,
          completado: candidato.completado,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Datos inválidos", errors: error.errors });
      }
      console.error("Error registrando candidato:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Get current session info
  app.get("/api/auth/me", (req, res) => {
    if (req.session.userId && req.session.userType === "admin") {
      res.json({ userType: "admin", userId: req.session.userId });
    } else if (
      req.session.candidatoId &&
      req.session.userType === "candidato"
    ) {
      res.json({ userType: "candidato", candidatoId: req.session.candidatoId });
    } else {
      res.status(401).json({ message: "No hay sesión activa" });
    }
  });

  // Candidato profile management
  app.get("/api/candidato/profile", async (req, res) => {
    try {
      if (!req.session.candidatoId || req.session.userType !== "candidato") {
        return res.status(401).json({ message: "No autorizado" });
      }

      const candidato = await storage.getCandidato(req.session.candidatoId);
      if (!candidato) {
        return res.status(404).json({ message: "Candidato no encontrado" });
      }

      // Don't send password in response
      const { password, ...candidatoData } = candidato;
      res.json(candidatoData);
    } catch (error) {
      console.error("Error obteniendo perfil:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post("/api/candidato/cambiar-password", async (req, res) => {
    try {
      if (!req.session.candidatoId || req.session.userType !== "candidato") {
        return res.status(401).json({ message: "No autorizado" });
      }

      const { passwordActual, passwordNueva } = req.body;

      if (!passwordActual || !passwordNueva) {
        return res
          .status(400)
          .json({ message: "Contraseña actual y nueva son requeridas" });
      }

      const candidato = await storage.getCandidato(req.session.candidatoId);
      if (!candidato) {
        return res.status(404).json({ message: "Candidato no encontrado" });
      }

      // Verificar contraseña actual
      if (candidato.password !== passwordActual) {
        return res
          .status(400)
          .json({ message: "Contraseña actual incorrecta" });
      }

      // Actualizar contraseña y marcar que ya no debe cambiarla
      await storage.updateCandidato(req.session.candidatoId, {
        password: passwordNueva,
        deberCambiarPassword: false,
      });

      res.json({ message: "Contraseña actualizada exitosamente" });
    } catch (error) {
      console.error("Error cambiando contraseña:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.put("/api/candidato/profile", async (req, res) => {
    try {
      if (!req.session.candidatoId || req.session.userType !== "candidato") {
        return res.status(401).json({ message: "No autorizado" });
      }

      const updateData = req.body;
      delete updateData.id; // Don't allow ID updates
      delete updateData.email; // Don't allow email updates for now

      const updatedCandidato = await storage.updateCandidato(
        req.session.candidatoId,
        updateData,
      );

      const { password, ...candidatoData } = updatedCandidato;
      res.json({
        message: "Perfil actualizado exitosamente",
        candidato: candidatoData,
      });
    } catch (error) {
      console.error("Error actualizando perfil:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Admin routes to manage candidatos
  app.get("/api/admin/candidatos", async (req, res) => {
    try {
      if (!req.session.userId || req.session.userType !== "admin") {
        return res.status(401).json({ message: "No autorizado" });
      }

      const candidatos = await storage.getAllCandidatos();
      // Remove passwords from response
      const safeCandidatos = candidatos.map(
        ({ password, ...candidato }) => candidato,
      );

      res.json(safeCandidatos);
    } catch (error) {
      console.error("Error obteniendo candidatos:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.get("/api/admin/candidatos/:id", async (req, res) => {
    try {
      if (!req.session.userId || req.session.userType !== "admin") {
        return res.status(401).json({ message: "No autorizado" });
      }

      const candidatoId = parseInt(req.params.id);
      const candidato = await storage.getCandidato(candidatoId);

      if (!candidato) {
        return res.status(404).json({ message: "Candidato no encontrado" });
      }

      const { password, ...candidatoData } = candidato;
      res.json(candidatoData);
    } catch (error) {
      console.error("Error obteniendo candidato:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Rutas de perfiles
  app.get("/api/perfiles", async (req, res) => {
    try {
      const perfiles = await storage.getAllPerfiles();
      res.json(perfiles);
    } catch (error) {
      console.error("Error obteniendo perfiles:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post("/api/perfiles/create-candidato", async (req, res) => {
    try {
      // Temporarily disabled auth check for debugging
      // if (!req.session.userId || req.session.userType !== 'admin') {
      //   return res.status(401).json({ message: "No autorizado" });
      // }

      const validatedData = createCandidatoFromPerfilSchema.parse(req.body);

      // Check if email already exists
      const existingCandidato = await storage.getCandidatoByEmail(
        validatedData.email,
      );
      if (existingCandidato) {
        return res.status(400).json({ message: "El email ya está registrado" });
      }

      // Check if document number already exists
      const allCandidatos = await storage.getAllCandidatos();
      const existingDocument = allCandidatos.find(
        (c) => c.numeroDocumento === validatedData.cedula,
      );
      if (existingDocument) {
        return res
          .status(400)
          .json({ message: "El número de documento ya está registrado" });
      }

      const candidato = await storage.createCandidatoFromPerfil(validatedData);

      res.status(201).json({
        message: "Candidato creado exitosamente",
        candidato: {
          id: candidato.id,
          email: candidato.email,
          nombres: candidato.nombres,
          apellidos: candidato.apellidos,
          numeroDocumento: candidato.numeroDocumento,
          deberCambiarPassword: candidato.deberCambiarPassword,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Datos inválidos", errors: error.errors });
      }
      console.error("Error creando candidato desde perfil:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post("/api/perfiles/create-admin", async (req, res) => {
    try {
      // Temporarily disabled auth check for debugging
      // if (!req.session.userId || req.session.userType !== 'admin') {
      //   return res.status(401).json({ message: "No autorizado" });
      // }

      const validatedData = createAdminUserSchema.parse(req.body);

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(
        validatedData.username,
      );
      if (existingUser) {
        return res
          .status(400)
          .json({ message: "El nombre de usuario ya está registrado" });
      }

      // Create user with default password
      const userData = {
        username: validatedData.username,
        password: "12345678", // Default password
        nombres: validatedData.nombres,
        apellidos: validatedData.apellidos,
        email: validatedData.email,
        tipoUsuario: validatedData.tipoUsuario,
      };

      const user = await storage.createUser(userData);

      res.status(201).json({
        message: "Usuario administrativo creado exitosamente",
        user: {
          id: user.id,
          username: user.username,
          nombres: user.nombres,
          apellidos: user.apellidos,
          email: user.email,
          tipoUsuario: user.tipoUsuario,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Datos inválidos", errors: error.errors });
      }
      console.error("Error creando usuario administrativo:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Rutas del Maestro - Tipos de Candidatos
  app.get("/api/maestro/tipos-candidatos", async (req, res) => {
    try {
      const tiposCandidatos = await storage.getAllTiposCandidatos();
      res.json(tiposCandidatos);
    } catch (error) {
      console.error("Error obteniendo tipos de candidatos:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post("/api/maestro/tipos-candidatos", async (req, res) => {
    try {
      const tipoCandidato = await storage.createTipoCandidato(req.body);
      res.status(201).json(tipoCandidato);
    } catch (error) {
      console.error("Error creando tipo de candidato:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Rutas del Maestro - Documentos Tipo
  app.get("/api/maestro/documentos-tipo", async (req, res) => {
    try {
      const documentosTipo = await storage.getAllDocumentosTipo();
      res.json(documentosTipo);
    } catch (error) {
      console.error("Error obteniendo tipos de documentos:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post("/api/maestro/documentos-tipo", async (req, res) => {
    try {
      const documentoTipo = await storage.createDocumentoTipo(req.body);
      res.status(201).json(documentoTipo);
    } catch (error) {
      console.error("Error creando tipo de documento:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Rutas del Maestro - Relación Tipos-Documentos
  app.get(
    "/api/maestro/tipos-candidatos-documentos/:tipoCandidatoId",
    async (req, res) => {
      try {
        const tipoCandidatoId = parseInt(req.params.tipoCandidatoId);
        const documentos =
          await storage.getDocumentosByTipoCandidato(tipoCandidatoId);
        res.json(documentos);
      } catch (error) {
        console.error(
          "Error obteniendo documentos por tipo de candidato:",
          error,
        );
        res.status(500).json({ message: "Error interno del servidor" });
      }
    },
  );

  app.put(
    "/api/maestro/tipos-candidatos-documentos/:tipoCandidatoId",
    async (req, res) => {
      try {
        const tipoCandidatoId = parseInt(req.params.tipoCandidatoId);
        const { documentos } = req.body;
        await storage.updateDocumentosByTipoCandidato(
          tipoCandidatoId,
          documentos,
        );
        res.json({ message: "Configuración actualizada exitosamente" });
      } catch (error) {
        console.error(
          "Error actualizando documentos por tipo de candidato:",
          error,
        );
        res.status(500).json({ message: "Error interno del servidor" });
      }
    },
  );


  // Login de empresas
  app.post("/api/empresa/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ message: "Email y contraseña requeridos" });
      }

      const empresa = await storage.getEmpresaByEmail(email);

      if (!empresa || empresa.password !== password) {
        return res.status(401).json({ message: "Credenciales inválidas" });
      }

      req.session.empresaId = empresa.id;
      req.session.userType = "empresa";

      res.json({
        message: "Login exitoso",
        empresa: {
          id: empresa.id,
          nombreEmpresa: empresa.nombreEmpresa,
          email: empresa.email,
          nit: empresa.nit,
        },
      });
    } catch (error) {
      console.error("Error en login de empresa:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Profile de empresa autenticada
  app.get("/api/empresa/profile", async (req, res) => {
    try {
      if (!req.session.empresaId || req.session.userType !== "empresa") {
        return res.status(401).json({ message: "No autorizado" });
      }

      const empresa = await storage.getEmpresa(req.session.empresaId);
      if (!empresa) {
        return res.status(404).json({ message: "Empresa no encontrada" });
      }

      res.json({
        id: empresa.id,
        nombreEmpresa: empresa.nombreEmpresa,
        email: empresa.email,
        nit: empresa.nit,
        direccion: empresa.direccion,
        telefono: empresa.telefono,
        ciudad: empresa.ciudad,
        contactoPrincipal: empresa.contactoPrincipal,
        cargoContacto: empresa.cargoContacto,
      });
    } catch (error) {
      console.error("Error obteniendo perfil de empresa:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Dashboard stats para empresa
  app.get("/api/empresa/dashboard-stats", async (req, res) => {
    try {
      if (!req.session.empresaId || req.session.userType !== "empresa") {
        return res.status(401).json({ message: "No autorizado" });
      }

      const candidatos = await storage.getCandidatosByEmpresa(
        req.session.empresaId,
      );

      res.json({
        totalCandidatos: candidatos.length,
        candidatosPendientes: candidatos.filter((c) => c.estado === "pendiente")
          .length,
        candidatosAprobados: candidatos.filter((c) => c.estado === "aprobado")
          .length,
        candidatosRechazados: candidatos.filter((c) => c.estado === "rechazado")
          .length,
      });
    } catch (error) {
      console.error("Error obteniendo estadísticas:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Lista de candidatos de la empresa
  app.get("/api/empresa/candidatos", async (req, res) => {
    try {
      if (!req.session.empresaId || req.session.userType !== "empresa") {
        return res.status(401).json({ message: "No autorizado" });
      }

      const candidatos = await storage.getCandidatosByEmpresa(
        req.session.empresaId,
      );
      res.json(candidatos);
    } catch (error) {
      console.error("Error obteniendo candidatos de la empresa:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Crear candidato por empresa
  app.post("/api/empresa/candidatos", async (req, res) => {
    try {
      if (!req.session.empresaId || req.session.userType !== "empresa") {
        return res.status(401).json({ message: "No autorizado" });
      }

      const validatedData = insertCandidatoSchema.parse(req.body);
      const candidato = await storage.createCandidatoForEmpresa(
        validatedData,
        req.session.empresaId,
      );

      res.status(201).json({
        message: "Candidato creado exitosamente",
        candidato,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Datos inválidos", errors: error.errors });
      }
      console.error("Error creando candidato:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Obtener candidato específico de la empresa
  app.get("/api/empresa/candidatos/:id", async (req, res) => {
    try {
      if (!req.session.empresaId || req.session.userType !== "empresa") {
        return res.status(401).json({ message: "No autorizado" });
      }

      const candidatoId = parseInt(req.params.id);
      const candidato = await storage.getCandidato(candidatoId);

      if (!candidato || candidato.empresaId !== req.session.empresaId) {
        return res.status(404).json({ message: "Candidato no encontrado" });
      }

      res.json(candidato);
    } catch (error) {
      console.error("Error obteniendo candidato:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Logout de empresa
  app.post("/api/empresa/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Error en logout:", err);
        return res.status(500).json({ message: "Error en logout" });
      }
      res.json({ message: "Logout exitoso" });
    });
  });

  // Actualizar estado de aprobación de candidato
  app.patch("/api/empresa/candidatos/:id/approval", async (req, res) => {
    try {
      if (!req.session.empresaId || req.session.userType !== "empresa") {
        return res.status(401).json({ message: "No autorizado" });
      }

      const candidatoId = parseInt(req.params.id);
      const { estado, notasAprobacion } = req.body;

      // Verificar que el candidato pertenece a la empresa
      const candidato = await storage.getCandidato(candidatoId);
      if (!candidato || candidato.empresaId !== req.session.empresaId) {
        return res.status(404).json({ message: "Candidato no encontrado" });
      }

      const updatedCandidato = await storage.updateCandidatoApproval(
        candidatoId,
        estado,
        notasAprobacion
      );

      res.json({
        message: "Estado de candidato actualizado exitosamente",
        candidato: updatedCandidato,
      });
    } catch (error) {
      console.error("Error actualizando estado de candidato:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Obtener configuración QR de la empresa
  app.get("/api/empresa/qr/config", async (req, res) => {
    try {
      if (!req.session.empresaId || req.session.userType !== "empresa") {
        return res.status(401).json({ message: "No autorizado" });
      }

      // Por ahora devolvemos configuración por defecto
      // En el futuro esto podría venir de la base de datos
      res.json({
        renovacion: "30-dias",
        mensaje: "Hola, tu código QR de certificación está listo. Este código contiene tu información verificada para acceso a las instalaciones de nuestra empresa. Por favor, manténlo siempre contigo durante tu horario laboral."
      });
    } catch (error) {
      console.error("Error obteniendo configuración QR:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Guardar configuración QR de la empresa
  app.post("/api/empresa/qr/config", async (req, res) => {
    try {
      if (!req.session.empresaId || req.session.userType !== "empresa") {
        return res.status(401).json({ message: "No autorizado" });
      }

      const { renovacion, mensaje } = req.body;
      
      // Por ahora solo devolvemos éxito
      // En el futuro esto se guardaría en la base de datos
      res.json({
        message: "Configuración QR guardada exitosamente",
        config: { renovacion, mensaje }
      });
    } catch (error) {
      console.error("Error guardando configuración QR:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Menu API routes
  app.get("/api/menu-nodes", async (req, res, next) => {
    try {
      const nodes = await storage.getAllMenuNodes();
      res.json(nodes);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/menu-nodes", async (req, res, next) => {
    try {
      const node = await storage.createMenuNode(req.body);
      res.json(node);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/menu-nodes/:id", async (req, res, next) => {
    try {
      const node = await storage.updateMenuNode(
        parseInt(req.params.id),
        req.body,
      );
      res.json(node);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/menu-nodes/:id", async (req, res, next) => {
    try {
      await storage.deleteMenuNode(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // Menu permissions API routes
  app.get("/api/menu-permissions/node/:nodeId", async (req, res, next) => {
    try {
      const permission = await storage.getMenuPermissionByNodeId(
        parseInt(req.params.nodeId),
      );
      const actions = permission
        ? await storage.getMenuActionsByPermissionId(permission.id)
        : [];
      res.json({ permission, actions });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/menu-permissions", async (req, res, next) => {
    try {
      const { nodeId, nombreVista, ruta, acciones } = req.body;

      // Create or update permission
      let permission = await storage.getMenuPermissionByNodeId(nodeId);
      if (permission) {
        permission = await storage.updateMenuPermission(permission.id, {
          nombreVista,
          ruta,
        });
      } else {
        permission = await storage.createMenuPermission({
          nodeId,
          nombreVista,
          ruta,
        });
      }

      // Delete existing actions and create new ones
      const existingActions = await storage.getMenuActionsByPermissionId(
        permission.id,
      );
      for (const action of existingActions) {
        await storage.deleteMenuAction(action.id);
      }

      // Create new actions
      for (const actionData of acciones || []) {
        if (actionData.codigo && actionData.nombre) {
          await storage.createMenuAction({
            permissionId: permission.id,
            codigo: actionData.codigo,
            nombre: actionData.nombre,
            tipo: actionData.tipo || "Accion",
          });
        }
      }

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // Obtener todos los analistas
  app.get("/api/analistas", async (req, res) => {
    try {
      const analistas = await storage.getAllAnalistas();
      res.json(analistas);
    } catch (error) {
      console.error("Error obteniendo analistas:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Obtener analista por ID
  app.get("/api/analistas/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const analista = await storage.getAnalistaById(id);

      if (!analista) {
        return res.status(404).json({ message: "Analista no encontrado" });
      }

      res.json(analista);
    } catch (error) {
      console.error("Error obteniendo analista:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Crear nuevo analista
  app.post("/api/analistas", async (req, res) => {
    try {
      const validatedData = insertAnalistaSchema.parse(req.body);

      // Verificar que el email no esté en uso
      const existingAnalista = await storage.getAnalistaByEmail(
        validatedData.email,
      );
      if (existingAnalista) {
        return res.status(400).json({ message: "El email ya está en uso" });
      }

      const analista = await storage.createAnalista(validatedData);
      res
        .status(201)
        .json({ message: "Analista creado exitosamente", analista });
    } catch (error) {
      console.error("Error creando analista:", error);
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Actualizar analista
  app.put("/api/analistas/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;

      // Si se está actualizando el email, verificar que no esté en uso
      if (updateData.email) {
        const existingAnalista = await storage.getAnalistaByEmail(
          updateData.email,
        );
        if (existingAnalista && existingAnalista.id !== id) {
          return res.status(400).json({ message: "El email ya está en uso" });
        }
      }

      const analista = await storage.updateAnalista(id, updateData);
      res.json({ message: "Analista actualizado exitosamente", analista });
    } catch (error: any) {
      console.error("Error actualizando analista:", error);
      if (error.message === "Analista no encontrado") {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Eliminar analista
  app.delete("/api/analistas/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteAnalista(id);
      res.json({ message: "Analista eliminado exitosamente" });
    } catch (error: any) {
      console.error("Error eliminando analista:", error);
      if (error.message === "Analista no encontrado") {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // === RUTAS DE USUARIOS ===
  
  // Obtener todos los usuarios
  app.get("/api/usuarios", async (req, res) => {
    try {
      const usuarios = await storage.getAllUsers();
      // Obtener perfiles para cada usuario
      const usuariosConPerfiles = await Promise.all(
        usuarios.map(async (usuario) => {
          const perfiles = await storage.getUserPerfiles(usuario.id);
          return { ...usuario, perfiles };
        })
      );
      res.json(usuariosConPerfiles);
    } catch (error: any) {
      console.error("Error obteniendo usuarios:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Crear nuevo usuario
  app.post("/api/usuarios", async (req, res) => {
    try {
      const { perfilIds, ...userData } = req.body;
      
      // Validar datos del usuario
      const validatedData = insertUserSchema.parse(userData);
      
      // Verificar que el email no esté en uso
      const existingUserByEmail = await storage.getAllUsers();
      const emailExists = existingUserByEmail.some(u => u.email === validatedData.email);
      if (emailExists) {
        return res.status(400).json({ message: "El email ya está en uso" });
      }
      
      // Verificar que el username no esté en uso
      const existingUserByUsername = await storage.getUserByUsername(validatedData.username);
      if (existingUserByUsername) {
        return res.status(400).json({ message: "El username ya está en uso" });
      }
      
      // Crear usuario con perfiles
      const { user, perfiles } = await storage.createUserWithPerfiles(validatedData, perfilIds || []);
      
      res.json({ 
        message: "Usuario creado exitosamente", 
        user: { ...user, perfiles } 
      });
    } catch (error: any) {
      console.error("Error creando usuario:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Actualizar usuario
  app.put("/api/usuarios/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { perfilIds, ...updateData } = req.body;
      
      // Verificar que el usuario existe
      const existingUser = await storage.getUser(id);
      if (!existingUser) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      
      // Si se está actualizando el email, verificar que no esté en uso
      if (updateData.email && updateData.email !== existingUser.email) {
        const usuarios = await storage.getAllUsers();
        const emailExists = usuarios.some(u => u.email === updateData.email && u.id !== id);
        if (emailExists) {
          return res.status(400).json({ message: "El email ya está en uso" });
        }
      }
      
      // Si se está actualizando el username, verificar que no esté en uso
      if (updateData.username && updateData.username !== existingUser.username) {
        const existingUserByUsername = await storage.getUserByUsername(updateData.username);
        if (existingUserByUsername && existingUserByUsername.id !== id) {
          return res.status(400).json({ message: "El username ya está en uso" });
        }
      }
      
      // Actualizar usuario
      const updatedUser = await storage.updateUser(id, updateData);
      
      // Si se proporcionaron perfilIds, actualizar las relaciones
      if (perfilIds !== undefined) {
        // Eliminar relaciones existentes
        await storage.deleteUserPerfiles(id);
        // Crear nuevas relaciones
        for (const perfilId of perfilIds) {
          await storage.createUserPerfil({ userId: id, perfilId });
        }
      }
      
      // Obtener perfiles actualizados
      const perfiles = await storage.getUserPerfiles(id);
      
      res.json({ 
        message: "Usuario actualizado exitosamente", 
        user: { ...updatedUser, perfiles } 
      });
    } catch (error: any) {
      console.error("Error actualizando usuario:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Actualizar usuario
  app.put("/api/usuarios/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { perfilIds, ...userData } = req.body;
      
      // Verificar que el usuario existe
      const existingUser = await storage.getUser(id);
      if (!existingUser) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      
      // Validar email único (excepto el mismo usuario)
      const users = await storage.getAllUsers();
      const emailExists = users.some(u => u.email === userData.email && u.id !== id);
      if (emailExists) {
        return res.status(400).json({ message: "El email ya está en uso" });
      }
      
      // Validar username único (excepto el mismo usuario)
      const usernameUser = await storage.getUserByUsername(userData.username);
      if (usernameUser && usernameUser.id !== id) {
        return res.status(400).json({ message: "El username ya está en uso" });
      }
      
      // Actualizar usuario
      const updatedUser = await storage.updateUser(id, userData);
      
      // Actualizar perfiles si se proporcionaron
      if (perfilIds && Array.isArray(perfilIds)) {
        await storage.deleteUserPerfiles(id);
        for (const perfilId of perfilIds) {
          await storage.createUserPerfil({ userId: id, perfilId });
        }
      }
      
      // Obtener perfiles actualizados
      const perfiles = await storage.getUserPerfiles(id);
      
      res.json({ 
        message: "Usuario actualizado exitosamente", 
        user: { ...updatedUser, perfiles } 
      });
    } catch (error: any) {
      console.error("Error actualizando usuario:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Eliminar usuario
  app.delete("/api/usuarios/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Verificar que el usuario existe
      const existingUser = await storage.getUser(id);
      if (!existingUser) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      
      await storage.deleteUser(id);
      res.json({ message: "Usuario eliminado exitosamente" });
    } catch (error: any) {
      console.error("Error eliminando usuario:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Obtener todos los clientes
  app.get("/api/clientes", async (req, res) => {
    try {
      const clientes = await storage.getAllClientes();
      res.json(clientes);
    } catch (error) {
      console.error("Error obteniendo clientes:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Crear nuevo cliente
  app.post("/api/clientes", async (req, res) => {
    try {
      const clienteData = req.body;

      // Generar contraseña temporal si no se proporciona
      if (!clienteData.password) {
        clienteData.password = "TempPass123!";
      }

      const cliente = await storage.createCliente(clienteData);
      res.status(201).json(cliente);
    } catch (error) {
      console.error("Error creando cliente:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Obtener cliente por ID
  app.get("/api/clientes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const cliente = await storage.getClienteById(id);

      if (!cliente) {
        return res.status(404).json({ message: "Cliente no encontrado" });
      }

      res.json(cliente);
    } catch (error) {
      console.error("Error obteniendo cliente:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Actualizar cliente
  app.put("/api/clientes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const clienteData = req.body;

      const cliente = await storage.updateCliente(id, clienteData);
      res.json(cliente);
    } catch (error: any) {
      console.error("Error actualizando cliente:", error);
      if (error.message === "Cliente no encontrado") {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Eliminar cliente
  app.delete("/api/clientes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCliente(id);
      res.json({ message: "Cliente eliminado exitosamente" });
    } catch (error) {
      console.error("Error eliminando cliente:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Perfiles API routes with permissions
  app.get("/api/perfiles", async (req, res) => {
    try {
      const perfiles = await storage.getAllPerfiles();
      res.json(perfiles);
    } catch (error) {
      console.error("Error obteniendo perfiles:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post("/api/perfiles", async (req, res) => {
    try {
      const { codigo, nombre, descripcion, permisos } = req.body;
      
      // Create perfil
      const perfil = await storage.createPerfil({
        nombre,
        descripcion,
        permisos: null, // Use new permission system
        activo: true,
      });

      // Save permissions and actions
      if (permisos && permisos.length > 0) {
        for (const permiso of permisos) {
          const perfilMenu = await storage.createPerfilMenu({
            perfilId: perfil.id,
            menuNodeId: permiso.menuNodeId,
          });

          // Save actions for this menu
          if (permiso.acciones && permiso.acciones.length > 0) {
            for (const accionId of permiso.acciones) {
              await storage.createPerfilAccion({
                perfilMenuId: perfilMenu.id,
                menuActionId: accionId,
              });
            }
          }
        }
      }

      res.json(perfil);
    } catch (error) {
      console.error("Error creando perfil:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.put("/api/perfiles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { nombre, descripcion, permisos } = req.body;
      
      // Update perfil
      const perfil = await storage.updatePerfil(id, {
        nombre,
        descripcion,
      });

      // Delete existing permissions and recreate them
      await storage.deletePerfilMenusByPerfilId(id);

      // Save new permissions and actions
      if (permisos && permisos.length > 0) {
        for (const permiso of permisos) {
          const perfilMenu = await storage.createPerfilMenu({
            perfilId: perfil.id,
            menuNodeId: permiso.menuNodeId,
          });

          // Save actions for this menu
          if (permiso.acciones && permiso.acciones.length > 0) {
            for (const accionId of permiso.acciones) {
              await storage.createPerfilAccion({
                perfilMenuId: perfilMenu.id,
                menuActionId: accionId,
              });
            }
          }
        }
      }

      res.json(perfil);
    } catch (error) {
      console.error("Error actualizando perfil:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.get("/api/perfiles/:id/permisos", async (req, res) => {
    try {
      const perfilId = parseInt(req.params.id);
      
      // Get all menu permissions for this profile
      const perfilMenus = await storage.getPerfilMenusByPerfilId(perfilId);
      
      const permisos = [];
      for (const perfilMenu of perfilMenus) {
        // Get menu node details
        const menuNodes = await storage.getAllMenuNodes();
        const menuNode = menuNodes.find(node => node.id === perfilMenu.menuNodeId);
        
        // Get actions for this menu
        const acciones = await storage.getPerfilAccionesByPerfilMenuId(perfilMenu.id);
        
        permisos.push({
          menuNodeId: perfilMenu.menuNodeId,
          menuNodeName: menuNode ? menuNode.name : `Menu ${perfilMenu.menuNodeId}`,
          acciones: acciones.map(a => a.menuActionId)
        });
      }
      
      res.json(permisos);
    } catch (error) {
      console.error("Error obteniendo permisos de perfil:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.delete("/api/perfiles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Delete associated permissions first
      await storage.deletePerfilMenusByPerfilId(id);
      
      // Delete perfil
      await storage.deletePerfil(id);
      
      res.json({ message: "Perfil eliminado exitosamente" });
    } catch (error) {
      console.error("Error eliminando perfil:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // ===== MÓDULO DE REPORTES =====

  // Dashboard principal - métricas generales
  app.get("/api/reportes/dashboard", async (req, res) => {
    try {
      const dashboardData = await storage.getDashboardData();
      res.json(dashboardData);
    } catch (error) {
      console.error("Error obteniendo datos del dashboard:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Lead time por analista
  app.get("/api/reportes/leadtime-analistas", async (req, res) => {
    try {
      const leadTimeData = await storage.getLeadTimeByAnalista();
      res.json(leadTimeData);
    } catch (error) {
      console.error("Error obteniendo lead time por analista:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // === ÓRDENES ===

  // Obtener todas las órdenes
  app.get("/api/ordenes", async (req, res) => {
    try {
      const ordenes = await storage.getAllOrdenes();
      res.json(ordenes);
    } catch (error) {
      console.error("Error obteniendo órdenes:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Crear nueva orden
  app.post("/api/ordenes", async (req, res) => {
    try {
      const ordenData = req.body;
      const orden = await storage.createOrden(ordenData);
      
      // Crear entrada en historial
      await storage.createHistorialEntry({
        ordenId: orden.id,
        estadoAnterior: null,
        estadoNuevo: orden.estado,
        motivo: "Orden creada"
      });

      res.status(201).json(orden);
    } catch (error) {
      console.error("Error creando orden:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Obtener orden por ID
  app.get("/api/ordenes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const orden = await storage.getOrdenById(id);
      
      if (!orden) {
        return res.status(404).json({ message: "Orden no encontrada" });
      }
      
      res.json(orden);
    } catch (error) {
      console.error("Error obteniendo orden:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Actualizar estado de orden
  app.put("/api/ordenes/:id/estado", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { estado, motivo } = req.body;
      
      const ordenActual = await storage.getOrdenById(id);
      if (!ordenActual) {
        return res.status(404).json({ message: "Orden no encontrada" });
      }

      const orden = await storage.updateOrden(id, { estado });
      
      // Crear entrada en historial
      await storage.createHistorialEntry({
        ordenId: id,
        estadoAnterior: ordenActual.estado,
        estadoNuevo: estado,
        motivo: motivo || `Cambio de estado a ${estado}`
      });

      res.json(orden);
    } catch (error) {
      console.error("Error actualizando estado de orden:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Obtener historial de una orden
  app.get("/api/ordenes/:id/historial", async (req, res) => {
    try {
      const ordenId = parseInt(req.params.id);
      const historial = await storage.getHistorialByOrden(ordenId);
      res.json(historial);
    } catch (error) {
      console.error("Error obteniendo historial de orden:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // === ALERTAS ===

  // Obtener todas las alertas
  app.get("/api/alertas", async (req, res) => {
    try {
      const alertas = await storage.getAllAlertas();
      res.json(alertas);
    } catch (error) {
      console.error("Error obteniendo alertas:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Obtener alertas activas
  app.get("/api/alertas/activas", async (req, res) => {
    try {
      const alertas = await storage.getAlertasActivas();
      res.json(alertas);
    } catch (error) {
      console.error("Error obteniendo alertas activas:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Crear nueva alerta
  app.post("/api/alertas", async (req, res) => {
    try {
      const alertaData = req.body;
      const alerta = await storage.createAlerta(alertaData);
      res.status(201).json(alerta);
    } catch (error) {
      console.error("Error creando alerta:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Resolver alerta
  app.put("/api/alertas/:id/resolver", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const alerta = await storage.resolverAlerta(id);
      res.json(alerta);
    } catch (error) {
      console.error("Error resolviendo alerta:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // === NOTIFICACIONES ===

  // Obtener todas las notificaciones
  app.get("/api/notificaciones", async (req, res) => {
    try {
      const notificaciones = await storage.getAllNotificaciones();
      res.json(notificaciones);
    } catch (error) {
      console.error("Error obteniendo notificaciones:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Crear nueva notificación
  app.post("/api/notificaciones", async (req, res) => {
    try {
      const notificacionData = req.body;
      const notificacion = await storage.createNotificacion(notificacionData);
      res.status(201).json(notificacion);
    } catch (error) {
      console.error("Error creando notificación:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Rutas para recuperación de contraseña

  // Generar y enviar token de recuperación de contraseña
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email es requerido" });
      }

      // Buscar usuario por email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Por seguridad, no revelamos si el email existe o no
        return res.json({ message: "Si el email existe, se ha enviado un enlace de recuperación" });
      }

      // Generar token único
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // Expira en 1 hora

      // Guardar token en la base de datos
      await storage.createPasswordResetToken({
        userId: user.id,
        token,
        expiresAt,
        used: false,
      });

      // Aquí normalmente enviarías un email real con el enlace
      // Para desarrollo, solo logueamos el token
      console.log(`Token de recuperación para ${email}: ${token}`);
      console.log(`Enlace: http://localhost:5000/reset-password?token=${token}`);

      res.json({ 
        message: "Si el email existe, se ha enviado un enlace de recuperación",
        // Solo para desarrollo - en producción no enviarías el token
        developmentToken: token 
      });
    } catch (error) {
      console.error("Error en forgot-password:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Validar token de recuperación
  app.get("/api/auth/validate-reset-token/:token", async (req, res) => {
    try {
      const { token } = req.params;

      const resetToken = await storage.getPasswordResetToken(token);
      if (!resetToken) {
        return res.status(400).json({ message: "Token inválido o expirado" });
      }

      const user = await storage.getUser(resetToken.userId);
      if (!user) {
        return res.status(400).json({ message: "Usuario no encontrado" });
      }

      res.json({ 
        valid: true,
        email: user.email,
        username: user.username
      });
    } catch (error) {
      console.error("Error validando token:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Restablecer contraseña con token
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token y nueva contraseña son requeridos" });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ message: "La contraseña debe tener al menos 8 caracteres" });
      }

      const resetToken = await storage.getPasswordResetToken(token);
      if (!resetToken) {
        return res.status(400).json({ message: "Token inválido o expirado" });
      }

      // Actualizar contraseña del usuario
      await storage.updateUser(resetToken.userId, { password: newPassword });

      // Marcar token como usado
      await storage.markTokenAsUsed(resetToken.id);

      // Limpiar tokens expirados
      await storage.cleanExpiredTokens();

      res.json({ message: "Contraseña actualizada exitosamente" });
    } catch (error) {
      console.error("Error restableciendo contraseña:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // === EMPRESA RECUPERACIÓN DE CONTRASEÑA ===

  // Generar token para empresa
  app.post("/api/empresa/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email es requerido" });
      }

      // Buscar empresa por email
      const empresa = await storage.getEmpresaByEmail(email);
      if (!empresa) {
        // Por seguridad, no revelamos si el email existe o no
        return res.json({ message: "Si el email existe, se ha enviado un enlace de recuperación" });
      }

      // Generar token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

      // Guardar token en la base de datos
      await storage.createPasswordResetToken({
        userId: empresa.id,
        token,
        expiresAt
      });

      // En un entorno real, aquí enviarías el email
      console.log(`Token de recuperación para empresa ${empresa.email}: ${token}`);
      console.log(`URL de recuperación: ${req.protocol}://${req.get('host')}/empresa/reset-password?token=${token}`);

      res.json({ message: "Si el email existe, se ha enviado un enlace de recuperación" });
    } catch (error) {
      console.error("Error generando token de recuperación para empresa:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Validar token de empresa
  app.get("/api/empresa/validate-reset-token/:token", async (req, res) => {
    try {
      const { token } = req.params;

      const resetToken = await storage.getPasswordResetToken(token);
      if (!resetToken || resetToken.used || new Date() > resetToken.expiresAt) {
        return res.status(400).json({ 
          valid: false, 
          message: "Token inválido o expirado" 
        });
      }

      // Obtener información de la empresa
      const empresa = await storage.getEmpresaById(resetToken.userId);
      if (!empresa) {
        return res.status(400).json({ 
          valid: false, 
          message: "Empresa no encontrada" 
        });
      }

      res.json({ 
        valid: true, 
        email: empresa.email,
        username: empresa.nombreEmpresa 
      });
    } catch (error) {
      console.error("Error validando token de empresa:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Restablecer contraseña de empresa
  app.post("/api/empresa/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token y contraseña son requeridos" });
      }

      // Validar token
      const resetToken = await storage.getPasswordResetToken(token);
      if (!resetToken || resetToken.used || new Date() > resetToken.expiresAt) {
        return res.status(400).json({ message: "Token inválido o expirado" });
      }

      // Encriptar nueva contraseña
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Actualizar contraseña de empresa
      await storage.updateEmpresaPassword(resetToken.userId, hashedPassword);

      // Marcar token como usado
      await storage.markTokenAsUsed(resetToken.id);

      // Limpiar tokens expirados
      await storage.cleanExpiredTokens();

      res.json({ message: "Contraseña actualizada exitosamente" });
    } catch (error) {
      console.error("Error restableciendo contraseña de empresa:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // === CANDIDATO RECUPERACIÓN DE CONTRASEÑA ===

  // Generar token para candidato
  app.post("/api/candidato/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email es requerido" });
      }

      // Buscar candidato por email
      const candidato = await storage.getCandidatoByEmail(email);
      if (!candidato) {
        // Por seguridad, no revelamos si el email existe o no
        return res.json({ message: "Si el email existe, se ha enviado un enlace de recuperación" });
      }

      // Generar token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

      // Guardar token en la base de datos
      await storage.createPasswordResetToken({
        userId: candidato.id,
        token,
        expiresAt
      });

      // En un entorno real, aquí enviarías el email
      console.log(`Token de recuperación para candidato ${candidato.email}: ${token}`);
      console.log(`URL de recuperación: ${req.protocol}://${req.get('host')}/candidato/reset-password?token=${token}`);

      res.json({ message: "Si el email existe, se ha enviado un enlace de recuperación" });
    } catch (error) {
      console.error("Error generando token de recuperación para candidato:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Validar token de candidato
  app.get("/api/candidato/validate-reset-token/:token", async (req, res) => {
    try {
      const { token } = req.params;

      const resetToken = await storage.getPasswordResetToken(token);
      if (!resetToken || resetToken.used || new Date() > resetToken.expiresAt) {
        return res.status(400).json({ 
          valid: false, 
          message: "Token inválido o expirado" 
        });
      }

      // Obtener información del candidato
      const candidato = await storage.getCandidatoById(resetToken.userId);
      if (!candidato) {
        return res.status(400).json({ 
          valid: false, 
          message: "Candidato no encontrado" 
        });
      }

      res.json({ 
        valid: true, 
        email: candidato.email,
        username: candidato.username || `${candidato.primerNombre} ${candidato.primerApellido}`
      });
    } catch (error) {
      console.error("Error validando token de candidato:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Restablecer contraseña de candidato
  app.post("/api/candidato/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token y contraseña son requeridos" });
      }

      // Validar token
      const resetToken = await storage.getPasswordResetToken(token);
      if (!resetToken || resetToken.used || new Date() > resetToken.expiresAt) {
        return res.status(400).json({ message: "Token inválido o expirado" });
      }

      // Encriptar nueva contraseña
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Actualizar contraseña de candidato
      await storage.updateCandidatoPassword(resetToken.userId, hashedPassword);

      // Marcar token como usado
      await storage.markTokenAsUsed(resetToken.id);

      // Limpiar tokens expirados
      await storage.cleanExpiredTokens();

      res.json({ message: "Contraseña actualizada exitosamente" });
    } catch (error) {
      console.error("Error restableciendo contraseña de candidato:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

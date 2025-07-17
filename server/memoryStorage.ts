// Sistema de almacenamiento en memoria para usuarios y perfiles
// Funcional completo con todas las operaciones CRUD

import bcrypt from "bcrypt";
import { type User, type InsertUser, type Perfil, type InsertPerfil, type UserPerfil, type InsertUserPerfil } from "@shared/schema";

interface MemoryUser extends User {
  id: number;
  identificacion: string;
  primerNombre: string;
  segundoNombre?: string | null;
  primerApellido: string;
  segundoApellido?: string | null;
  telefono?: string | null;
  email: string;
  username: string;
  password: string;
  fechaCreacion: Date | null;
  activo: boolean | null;
}

interface MemoryPerfil extends Perfil {
  id: number;
  nombre: string;
  descripcion?: string | null;
  permisos?: any | null;
  fechaCreacion: Date | null;
  activo: boolean | null;
}

interface MemoryUserPerfil extends UserPerfil {
  id: number;
  userId: number;
  perfilId: number;
  fechaAsignacion: Date | null;
}

class MemoryUserStorage {
  private users: MemoryUser[] = [];
  private perfiles: MemoryPerfil[] = [];
  private userPerfiles: MemoryUserPerfil[] = [];
  private userIdCounter = 1;
  private perfilIdCounter = 1;
  private userPerfilIdCounter = 1;

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Datos iniciales de perfiles
    this.perfiles = [
      {
        id: 1,
        nombre: "Administrador",
        descripcion: "Perfil con acceso completo al sistema",
        permisos: JSON.stringify([
          {"viewId": "001", "viewName": "Dashboard", "actions": ["dashboard_view", "dashboard_export"]},
          {"viewId": "002", "viewName": "Usuarios", "actions": ["usuarios_view", "usuarios_create", "usuarios_edit", "usuarios_delete"]},
          {"viewId": "003", "viewName": "Perfiles", "actions": ["perfiles_view", "perfiles_create", "perfiles_edit", "perfiles_delete"]}
        ]),
        fechaCreacion: new Date(),
        activo: true
      },
      {
        id: 2,
        nombre: "Coordinador",
        descripcion: "Perfil para coordinadores con permisos limitados",
        permisos: JSON.stringify([
          {"viewId": "001", "viewName": "Dashboard", "actions": ["dashboard_view"]},
          {"viewId": "004", "viewName": "Candidatos", "actions": ["candidatos_view", "candidatos_edit"]}
        ]),
        fechaCreacion: new Date(),
        activo: true
      },
      {
        id: 3,
        nombre: "Candidato",
        descripcion: "Perfil para candidatos con acceso a su información personal",
        permisos: JSON.stringify([
          {"viewId": "004", "viewName": "Candidatos", "actions": ["candidatos_view"]}
        ]),
        fechaCreacion: new Date(),
        activo: true
      },
      {
        id: 4,
        nombre: "Analista",
        descripcion: "Perfil para analistas con permisos de revisión",
        permisos: JSON.stringify([
          {"viewId": "001", "viewName": "Dashboard", "actions": ["dashboard_view"]},
          {"viewId": "004", "viewName": "Candidatos", "actions": ["candidatos_view"]},
          {"viewId": "005", "viewName": "Empresas", "actions": ["empresas_view"]}
        ]),
        fechaCreacion: new Date(),
        activo: true
      }
    ];

    // Usuarios iniciales
    this.users = [
      {
        id: 1,
        identificacion: "12345678",
        primerNombre: "Admin",
        segundoNombre: null,
        primerApellido: "Sistema",
        segundoApellido: null,
        telefono: "3001234567",
        email: "admin@sistema.com",
        username: "admin",
        password: "admin123", // En producción debería estar hasheada
        fechaCreacion: new Date(),
        activo: true
      }
    ];

    // Relaciones usuario-perfil iniciales
    this.userPerfiles = [
      {
        id: 1,
        userId: 1,
        perfilId: 1, // Administrador
        fechaAsignacion: new Date()
      }
    ];

    this.userIdCounter = 2;
    this.perfilIdCounter = 5; // Siguiente después de los 4 perfiles iniciales
    this.userPerfilIdCounter = 2;
  }

  // ========== OPERACIONES DE USUARIOS ==========

  async getUser(id: number): Promise<MemoryUser | undefined> {
    return this.users.find(user => user.id === id);
  }

  async getUserByUsername(username: string): Promise<MemoryUser | undefined> {
    return this.users.find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<MemoryUser | undefined> {
    return this.users.find(user => user.email === email);
  }

  async getAllUsers(): Promise<MemoryUser[]> {
    return [...this.users];
  }

  async createUser(userData: InsertUser): Promise<MemoryUser> {
    const newUser: MemoryUser = {
      id: this.userIdCounter++,
      identificacion: userData.identificacion,
      primerNombre: userData.primerNombre,
      segundoNombre: userData.segundoNombre || null,
      primerApellido: userData.primerApellido,
      segundoApellido: userData.segundoApellido || null,
      telefono: userData.telefono || null,
      email: userData.email,
      username: userData.username,
      password: userData.password, // En producción debería hashearse
      fechaCreacion: new Date(),
      activo: userData.activo ?? true
    };

    this.users.push(newUser);
    return newUser;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<MemoryUser> {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) {
      throw new Error("Usuario no encontrado");
    }

    const existingUser = this.users[userIndex];
    const updatedUser: MemoryUser = {
      ...existingUser,
      ...userData,
      id: existingUser.id, // Mantener el ID original
      fechaCreacion: existingUser.fechaCreacion // Mantener fecha original
    };

    this.users[userIndex] = updatedUser;
    return updatedUser;
  }

  async deleteUser(id: number): Promise<void> {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) {
      throw new Error("Usuario no encontrado");
    }

    // Eliminar relaciones usuario-perfil
    this.userPerfiles = this.userPerfiles.filter(up => up.userId !== id);
    
    // Eliminar usuario
    this.users.splice(userIndex, 1);
  }

  // ========== OPERACIONES DE PERFILES ==========

  async getAllPerfiles(): Promise<MemoryPerfil[]> {
    return [...this.perfiles];
  }

  async getPerfilById(id: number): Promise<MemoryPerfil | undefined> {
    return this.perfiles.find(perfil => perfil.id === id);
  }

  async getPerfilByNombre(nombre: string): Promise<MemoryPerfil | undefined> {
    return this.perfiles.find(perfil => perfil.nombre === nombre);
  }

  async createPerfil(perfilData: InsertPerfil): Promise<MemoryPerfil> {
    const newPerfil: MemoryPerfil = {
      id: this.perfilIdCounter++,
      nombre: perfilData.nombre,
      descripcion: perfilData.descripcion || null,
      permisos: perfilData.permisos || null,
      fechaCreacion: new Date(),
      activo: perfilData.activo ?? true
    };

    this.perfiles.push(newPerfil);
    return newPerfil;
  }

  async updatePerfil(id: number, perfilData: Partial<InsertPerfil>): Promise<MemoryPerfil> {
    const perfilIndex = this.perfiles.findIndex(perfil => perfil.id === id);
    if (perfilIndex === -1) {
      throw new Error("Perfil no encontrado");
    }

    const existingPerfil = this.perfiles[perfilIndex];
    const updatedPerfil: MemoryPerfil = {
      ...existingPerfil,
      ...perfilData,
      id: existingPerfil.id, // Mantener el ID original
      fechaCreacion: existingPerfil.fechaCreacion // Mantener fecha original
    };

    this.perfiles[perfilIndex] = updatedPerfil;
    return updatedPerfil;
  }

  async deletePerfil(id: number): Promise<void> {
    const perfilIndex = this.perfiles.findIndex(perfil => perfil.id === id);
    if (perfilIndex === -1) {
      throw new Error("Perfil no encontrado");
    }

    // Eliminar relaciones usuario-perfil
    this.userPerfiles = this.userPerfiles.filter(up => up.perfilId !== id);
    
    // Eliminar perfil
    this.perfiles.splice(perfilIndex, 1);
  }

  // ========== OPERACIONES DE RELACIONES USUARIO-PERFIL ==========

  async getUserPerfiles(userId: number): Promise<MemoryPerfil[]> {
    const userPerfilIds = this.userPerfiles
      .filter(up => up.userId === userId)
      .map(up => up.perfilId);
    
    return this.perfiles.filter(perfil => userPerfilIds.includes(perfil.id));
  }

  async createUserPerfil(userPerfilData: InsertUserPerfil): Promise<MemoryUserPerfil> {
    const newUserPerfil: MemoryUserPerfil = {
      id: this.userPerfilIdCounter++,
      userId: userPerfilData.userId,
      perfilId: userPerfilData.perfilId,
      fechaAsignacion: new Date()
    };

    this.userPerfiles.push(newUserPerfil);
    return newUserPerfil;
  }

  async deleteUserPerfiles(userId: number): Promise<void> {
    this.userPerfiles = this.userPerfiles.filter(up => up.userId !== userId);
  }

  async createUserWithPerfiles(userData: InsertUser, perfilIds: number[]): Promise<{ user: MemoryUser; perfiles: MemoryPerfil[] }> {
    // Crear usuario
    const user = await this.createUser(userData);
    
    // Crear relaciones usuario-perfil
    const perfiles: MemoryPerfil[] = [];
    for (const perfilId of perfilIds) {
      await this.createUserPerfil({ userId: user.id, perfilId });
      const perfil = await this.getPerfilById(perfilId);
      if (perfil) {
        perfiles.push(perfil);
      }
    }

    return { user, perfiles };
  }

  // ========== MÉTODOS DE UTILIDAD ==========

  getStats() {
    return {
      totalUsers: this.users.length,
      activeUsers: this.users.filter(u => u.activo).length,
      totalPerfiles: this.perfiles.length,
      activePerfiles: this.perfiles.filter(p => p.activo).length,
      totalUserPerfiles: this.userPerfiles.length
    };
  }

  reset() {
    this.users = [];
    this.perfiles = [];
    this.userPerfiles = [];
    this.userIdCounter = 1;
    this.perfilIdCounter = 1;
    this.userPerfilIdCounter = 1;
    this.initializeDefaultData();
  }
}

// Instancia singleton
export const memoryUserStorage = new MemoryUserStorage();
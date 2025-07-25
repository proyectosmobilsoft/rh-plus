import { createClient, type User } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vlmeifyldcgfmhppynir.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsbWVpZnlsZGNnZm1ocHB5bmlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0ODQwNDUsImV4cCI6MjA2OTA2MDA0NX0.8MtUi9I_evcJYvB3tXGCKsXDpUX7V13T_DDfBbRvvu8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos para autenticación
export type AuthUser = User;

export type AuthSession = {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
};

// Funciones de autenticación
export const authService = {
  // Login unificado
  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  },

  // Logout
  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Obtener sesión actual
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  // Obtener usuario actual
  async getUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  // Registrar usuario
  async signUp(email: string, password: string, metadata?: any) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
    
    if (error) throw error;
    return data;
  },

  // Reset password
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  },

  // Cambiar contraseña
  async updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({
      password,
    });
    
    if (error) throw error;
  },
};

// Funciones para datos de candidatos
export const candidatosService = {
  async getCandidatos() {
    const { data, error } = await supabase
      .from('candidatos')
      .select('*')
      .order('fecha_registro', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getCandidatoById(id: number) {
    const { data, error } = await supabase
      .from('candidatos')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async createCandidato(candidato: any) {
    const { data, error } = await supabase
      .from('candidatos')
      .insert(candidato)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateCandidato(id: number, updates: any) {
    const { data, error } = await supabase
      .from('candidatos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteCandidato(id: number) {
    const { error } = await supabase
      .from('candidatos')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
};

// Funciones para datos de empresas
export const empresasService = {
  async getEmpresas() {
    const { data, error } = await supabase
      .from('empresas')
      .select('*')
      .order('fecha_registro', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getEmpresaById(id: number) {
    const { data, error } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async createEmpresa(empresa: any) {
    const { data, error } = await supabase
      .from('empresas')
      .insert(empresa)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateEmpresa(id: number, updates: any) {
    const { data, error } = await supabase
      .from('empresas')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
};

// Funciones para órdenes
export const ordenesService = {
  async getOrdenes() {
    const { data, error } = await supabase
      .from('ordenes')
      .select(`
        *,
        candidatos (nombres, apellidos, email),
        empresas (nombre_empresa),
        analistas (nombre, apellido),
        clientes (nombre_completo, empresa)
      `)
      .order('fecha_creacion', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getOrdenById(id: number) {
    const { data, error } = await supabase
      .from('ordenes')
      .select(`
        *,
        candidatos (nombres, apellidos, email),
        empresas (nombre_empresa),
        analistas (nombre, apellido),
        clientes (nombre_completo, empresa)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async createOrden(orden: any) {
    const { data, error } = await supabase
      .from('ordenes')
      .insert(orden)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateOrden(id: number, updates: any) {
    const { data, error } = await supabase
      .from('ordenes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
};

// Funciones para analistas
export const analistasService = {
  async getAnalistas() {
    const { data, error } = await supabase
      .from('analistas')
      .select('*')
      .order('fecha_creacion', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getAnalistaById(id: number) {
    const { data, error } = await supabase
      .from('analistas')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async createAnalista(analista: any) {
    const { data, error } = await supabase
      .from('analistas')
      .insert(analista)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateAnalista(id: number, updates: any) {
    const { data, error } = await supabase
      .from('analistas')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
};

// Funciones para documentos
export const documentosService = {
  async uploadDocument(file: File, path: string) {
    const { data, error } = await supabase.storage
      .from('documentos')
      .upload(path, file);
    
    if (error) throw error;
    return data;
  },

  async getDocumentUrl(path: string) {
    const { data } = supabase.storage
      .from('documentos')
      .getPublicUrl(path);
    
    return data.publicUrl;
  },

  async deleteDocument(path: string) {
    const { error } = await supabase.storage
      .from('documentos')
      .remove([path]);
    
    if (error) throw error;
  },
};

// Hook para manejar la autenticación
export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Obtener sesión inicial
    authService.getSession().then((session) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}; 
import { supabase } from './supabaseClient';

export interface EmailTemplate {
  id: number;
  nombre: string;
  asunto: string;
  contenido_html: string;
  variables: string[];
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface GmailTemplate {
  id: number;
  nombre: string;
  asunto: string;
  contenido_html: string;
  variables: string[];
  tipo_destinatario: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export const emailTemplatesService = {
  // Obtener todas las plantillas de email
  getAllEmailTemplates: async (): Promise<EmailTemplate[]> => {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('activo', true)
      .order('nombre', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  // Obtener todas las plantillas de Gmail
  getAllGmailTemplates: async (): Promise<GmailTemplate[]> => {
    const { data, error } = await supabase
      .from('gmail_templates')
      .select('*')
      .eq('activo', true)
      .order('nombre', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  // Crear una nueva plantilla de email
  createEmailTemplate: async (template: Partial<EmailTemplate>): Promise<EmailTemplate> => {
    console.log('=== CREANDO PLANTILLA EMAIL ===');
    console.log('Datos recibidos:', template);
    
    const { data, error } = await supabase
      .from('email_templates')
      .insert([template])
      .select()
      .single();
    
    console.log('Respuesta de Supabase - data:', data);
    console.log('Respuesta de Supabase - error:', error);
    
    if (error) {
      console.error('Error en createEmailTemplate:', error);
      throw error;
    }
    
    console.log('Plantilla creada exitosamente:', data);
    return data;
  },

  // Crear una nueva plantilla de Gmail
  createGmailTemplate: async (template: Partial<GmailTemplate>): Promise<GmailTemplate> => {
    console.log('=== CREANDO PLANTILLA GMAIL ===');
    console.log('Datos recibidos:', template);
    
    const { data, error } = await supabase
      .from('gmail_templates')
      .insert([template])
      .select()
      .single();
    
    console.log('Respuesta de Supabase - data:', data);
    console.log('Respuesta de Supabase - error:', error);
    
    if (error) {
      console.error('Error en createGmailTemplate:', error);
      throw error;
    }
    
    console.log('Plantilla creada exitosamente:', data);
    return data;
  },

  // Actualizar una plantilla de email
  updateEmailTemplate: async (id: number, template: Partial<EmailTemplate>): Promise<EmailTemplate> => {
    const { data, error } = await supabase
      .from('email_templates')
      .update({ ...template, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Actualizar una plantilla de Gmail
  updateGmailTemplate: async (id: number, template: Partial<GmailTemplate>): Promise<GmailTemplate> => {
    const { data, error } = await supabase
      .from('gmail_templates')
      .update({ ...template, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Eliminar una plantilla de email (marcar como inactiva)
  deleteEmailTemplate: async (id: number): Promise<boolean> => {
    const { error } = await supabase
      .from('email_templates')
      .update({ activo: false, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  // Eliminar una plantilla de Gmail (marcar como inactiva)
  deleteGmailTemplate: async (id: number): Promise<boolean> => {
    const { error } = await supabase
      .from('gmail_templates')
      .update({ activo: false, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    return true;
  },
}; 
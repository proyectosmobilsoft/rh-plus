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
  // Crear una nueva plantilla de email
  createEmailTemplate: async (template: Partial<EmailTemplate>): Promise<EmailTemplate> => {
    const { data, error } = await supabase
      .from('email_templates')
      .insert([template])
      .select()
      .single();
    
    if (error) {
      console.error('Error en createEmailTemplate:', error);
      throw error;
    }
    
    return data;
  },

  // Crear una nueva plantilla de Gmail
  createGmailTemplate: async (template: Partial<GmailTemplate>): Promise<GmailTemplate> => {
    const { data, error } = await supabase
      .from('gmail_templates')
      .insert([template])
      .select()
      .single();
    
    if (error) {
      console.error('Error en createGmailTemplate:', error);
      throw error;
    }
    
    return data;
  },
};

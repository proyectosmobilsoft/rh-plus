import { supabase } from './supabaseClient';
import { emailService } from './emailService';

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

export interface EmailCampaign {
  id: number;
  nombre: string;
  template_id: number;
  asunto_personalizado: string;
  contenido_personalizado: string;
  estado: string;
  destinatarios_count: number;
  enviados_count: number;
  created_by?: number;
  created_at: string;
  updated_at: string;
}

export interface CampaignRecipient {
  id: number;
  campaign_id: number;
  email: string;
  nombre: string;
  variables: Record<string, any>;
  estado: string;
  error_message?: string;
  sent_at?: string;
  created_at: string;
}

class EmailCampaignService {
  // Obtener todas las plantillas
  async getTemplates(): Promise<EmailTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('id, nombre, asunto, contenido_html, variables, activo, created_at, updated_at')
        .eq('activo', true)
        .order('nombre');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error obteniendo plantillas:', error);
      throw error;
    }
  }

  // Obtener una plantilla por ID
  async getTemplateById(id: number): Promise<EmailTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('id, nombre, asunto, contenido_html, variables, activo, created_at, updated_at')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error obteniendo plantilla:', error);
      throw error;
    }
  }

  // Crear una nueva plantilla
  async createTemplate(template: Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<EmailTemplate> {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .insert(template)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creando plantilla:', error);
      throw error;
    }
  }

  // Actualizar una plantilla
  async updateTemplate(id: number, template: Partial<EmailTemplate>): Promise<EmailTemplate> {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .update({ ...template, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error actualizando plantilla:', error);
      throw error;
    }
  }

  // Obtener todas las campañas
  async getCampaigns(): Promise<EmailCampaign[]> {
    try {
      const { data, error } = await supabase
        .from('email_campaigns')
        .select('id, nombre, template_id, asunto_personalizado, contenido_personalizado, estado, destinatarios_count, enviados_count, created_by, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error obteniendo campañas:', error);
      throw error;
    }
  }

  // Crear una nueva campaña
  async createCampaign(campaign: Omit<EmailCampaign, 'id' | 'created_at' | 'updated_at'>): Promise<EmailCampaign> {
    try {
      const { data, error } = await supabase
        .from('email_campaigns')
        .insert(campaign)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creando campaña:', error);
      throw error;
    }
  }

  // Procesar variables en el contenido
  processVariables(content: string, variables: Record<string, any>): string {
    let processedContent = content;
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processedContent = processedContent.replace(regex, variables[key] || `{{${key}}}`);
    });
    return processedContent;
  }

  // Enviar correo individual
  async sendIndividualEmail(to: string, subject: string, htmlContent: string, variables: Record<string, any>): Promise<boolean> {
    try {
      const processedContent = this.processVariables(htmlContent, variables);
      
      const result = await emailService.sendEmail({
        to,
        subject,
        html: processedContent,
        text: processedContent.replace(/<[^>]*>/g, '') // Remover HTML para texto plano
      });

      return result.success;
    } catch (error) {
      console.error('Error enviando email individual:', error);
      return false;
    }
  }

  // Agregar destinatarios a una campaña
  async addRecipients(campaignId: number, recipients: Array<{ email: string; nombre: string; variables: Record<string, any> }>): Promise<void> {
    try {
      const recipientsData = recipients.map(recipient => ({
        campaign_id: campaignId,
        email: recipient.email,
        nombre: recipient.nombre,
        variables: recipient.variables,
        estado: 'pendiente'
      }));

      const { error } = await supabase
        .from('email_campaign_recipients')
        .insert(recipientsData);

      if (error) throw error;
    } catch (error) {
      console.error('Error agregando destinatarios:', error);
      throw error;
    }
  }

  // Obtener destinatarios de una campaña
  async getCampaignRecipients(campaignId: number): Promise<CampaignRecipient[]> {
    try {
      const { data, error } = await supabase
        .from('email_campaign_recipients')
        .select('id, campaign_id, email, nombre, variables, estado, error_message, sent_at, created_at')
        .eq('campaign_id', campaignId)
        .order('created_at');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error obteniendo destinatarios:', error);
      throw error;
    }
  }

  // Enviar campaña
  async sendCampaign(campaignId: number): Promise<{ success: boolean; message: string }> {
    try {
      // Obtener información de la campaña
      const { data: campaign, error: campaignError } = await supabase
        .from('email_campaigns')
        .select('id, nombre, template_id, asunto_personalizado, contenido_personalizado, estado, destinatarios_count, enviados_count, created_by, created_at, updated_at')
        .eq('id', campaignId)
        .single();

      if (campaignError) throw campaignError;

      // Obtener destinatarios
      const recipients = await this.getCampaignRecipients(campaignId);
      
      if (recipients.length === 0) {
        return { success: false, message: 'No hay destinatarios para enviar' };
      }

      // Actualizar estado de la campaña
      await supabase
        .from('email_campaigns')
        .update({ estado: 'enviando' })
        .eq('id', campaignId);

      let enviados = 0;
      let errores = 0;

      // Enviar emails a cada destinatario
      for (const recipient of recipients) {
        try {
          const success = await this.sendIndividualEmail(
            recipient.email,
            campaign.asunto_personalizado,
            campaign.contenido_personalizado,
            recipient.variables
          );

          if (success) {
            enviados++;
            // Marcar como enviado
            await supabase
              .from('email_campaign_recipients')
              .update({ 
                estado: 'enviado',
                sent_at: new Date().toISOString()
              })
              .eq('id', recipient.id);
          } else {
            errores++;
            // Marcar como error
            await supabase
              .from('email_campaign_recipients')
              .update({ 
                estado: 'error',
                error_message: 'Error al enviar email'
              })
              .eq('id', recipient.id);
          }
        } catch (error) {
          errores++;
          console.error(`Error enviando a ${recipient.email}:`, error);
        }
      }

      // Actualizar estadísticas de la campaña
      await supabase
        .from('email_campaigns')
        .update({ 
          estado: 'completada',
          enviados_count: enviados
        })
        .eq('id', campaignId);

      return { 
        success: true, 
        message: `Campaña enviada. ${enviados} enviados, ${errores} errores` 
      };
    } catch (error) {
      console.error('Error enviando campaña:', error);
      return { success: false, message: 'Error al enviar la campaña' };
    }
  }
}

export const emailCampaignService = new EmailCampaignService(); 


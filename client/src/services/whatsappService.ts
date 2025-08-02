import { supabase } from './supabaseClient';

export interface WhatsAppMessage {
  to: string;
  message: string;
  template?: string;
  variables?: Record<string, string>;
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  message: string;
  variables: string[];
}

export interface WhatsAppResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

class WhatsAppService {
  private apiUrl = 'https://api.whatsapp.com/v1'; // This would be your WhatsApp Business API endpoint
  private accessToken = import.meta.env.VITE_WHATSAPP_TOKEN || '';

  /**
   * Send a WhatsApp message using the Business API
   */
  async sendMessage(messageData: WhatsAppMessage): Promise<WhatsAppResponse> {
    try {
      // For development, we'll simulate the API call
      // In production, you would make an actual HTTP request to WhatsApp Business API
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate success/failure based on phone number validity
      const isValidPhone = this.isValidPhoneNumber(messageData.to);
      
      if (!isValidPhone) {
        return {
          success: false,
          error: 'Número de teléfono inválido'
        };
      }
      
      // In development, we'll open WhatsApp Web with the message
      // This is a fallback for when the actual API is not available
      const whatsappUrl = `https://wa.me/${messageData.to}?text=${encodeURIComponent(messageData.message)}`;
      window.open(whatsappUrl, '_blank');
      
      return {
        success: true,
        messageId: `dev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send multiple WhatsApp messages
   */
  async sendBulkMessages(messages: WhatsAppMessage[]): Promise<WhatsAppResponse[]> {
    const results: WhatsAppResponse[] = [];
    
    for (const message of messages) {
      const result = await this.sendMessage(message);
      results.push(result);
      
      // Add a small delay between messages to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return results;
  }

  /**
   * Replace template variables with actual data
   */
  replaceTemplateVariables(template: string, variables: Record<string, string>): string {
    let message = template;
    
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      message = message.replace(regex, value || '');
    });
    
    return message;
  }

  /**
   * Format phone number for WhatsApp (remove non-digits and add country code if needed)
   */
  formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // If it doesn't start with country code, add Colombia's code (57)
    if (!cleaned.startsWith('57') && cleaned.length === 10) {
      return `57${cleaned}`;
    }
    
    return cleaned;
  }

  /**
   * Validate if a phone number is valid for WhatsApp
   */
  isValidPhoneNumber(phone: string): boolean {
    const formatted = this.formatPhoneNumber(phone);
    return formatted.length >= 10 && formatted.length <= 15;
  }

  /**
   * Get WhatsApp templates from database (if you want to store them)
   */
  async getTemplates(): Promise<WhatsAppTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_templates')
        .select('*')
        .eq('activo', true);

      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching WhatsApp templates:', error);
      return [];
    }
  }

  /**
   * Save a new WhatsApp template to database
   */
  async saveTemplate(template: Omit<WhatsAppTemplate, 'id'>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('whatsapp_templates')
        .insert({
          name: template.name,
          message: template.message,
          variables: template.variables,
          activo: true
        });

      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error saving WhatsApp template:', error);
      return false;
    }
  }
}

export const whatsappService = new WhatsAppService(); 
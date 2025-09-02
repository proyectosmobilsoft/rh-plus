import { supabase } from './supabaseClient';

interface EmailConfig {
  gmail: string;
  password: string;
  appPassword?: string; // Para Gmail con 2FA
}

// Servicio para envío de correos
export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from: string;
  attachments?: {
    content: string;
    filename: string;
    contentType: string;
  }[];
}

export const sendEmail = async (emailData: EmailData): Promise<{ success: boolean; error?: string }> => {
  try {
    // Por ahora usamos un servicio de email gratuito como EmailJS o similar
    // En producción deberías usar SendGrid, Mailgun, o similar
    
    // Simulación de envío para pruebas
    console.log('📧 Simulando envío de correo:', {
      to: emailData.to,
      subject: emailData.subject,
      from: emailData.from,
      attachments: emailData.attachments ? `${emailData.attachments.length} archivos adjuntos` : 'Sin adjuntos'
    });
    
    // Aquí puedes integrar con un servicio real de email
    // Ejemplo con SendGrid:
    /*
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    const msg = {
      to: emailData.to,
      from: emailData.from,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
      attachments: emailData.attachments?.map(att => ({
        content: att.content,
        filename: att.filename,
        type: att.contentType,
        disposition: 'attachment'
      }))
    };
    
    await sgMail.send(msg);
    */
    
    // Simular delay de envío
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return { success: true };
    
  } catch (error) {
    console.error('Error enviando email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    };
  }
};

class EmailService {
  private config: EmailConfig | null = null;

  // Configurar las credenciales de Gmail
  setConfig(config: EmailConfig) {
    this.config = config;
  }

  // Generar plantilla HTML para el código de verificación
  private generateVerificationEmailHTML(codigo: string, nombre?: string, userEmail?: string): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Código de Verificación</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background-color: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #1fb5ca;
            margin-bottom: 10px;
          }
          .code-container {
            text-align: center;
            margin: 30px 0;
            padding: 20px;
            background-color: #f8fafc;
            border-radius: 8px;
            border: 2px dashed #cbd5e1;
          }
          .code {
            font-size: 32px;
            font-weight: bold;
            color: #1fb5ca;
            letter-spacing: 4px;
            font-family: 'Courier New', monospace;
          }
          .warning {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            color: #92400e;
          }
          .info-box {
            background-color: rgba(31, 181, 202, 0.1);
            border: 1px solid #1fb5ca;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            color: #1fb5ca;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
          }
          .button {
            display: inline-block;
            background-color: #1fb5ca;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            margin: 10px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">RH Compensamos</div>
            <h1>Código de Verificación</h1>
          </div>
          
          <p>Hola Administrador,</p>
          
          ${userEmail ? `
          <div class="info-box">
            <strong>📧 Solicitud de Recuperación de Contraseña</strong><br>
            <strong>Usuario:</strong> ${nombre || 'Usuario del sistema'}<br>
            <strong>Email:</strong> ${userEmail}<br>
            <strong>Fecha:</strong> ${new Date().toLocaleString('es-ES')}
          </div>
          ` : ''}
          
          <p>Se ha solicitado un código de verificación para recuperar la contraseña. Utiliza el siguiente código:</p>
          
          <div class="code-container">
            <div class="code">${codigo}</div>
          </div>
          
          <div class="warning">
            <strong>⚠️ Importante:</strong>
            <ul>
              <li>Este código expira en 30 minutos</li>
              <li>No compartas este código con nadie</li>
              <li>Verifica la identidad del usuario antes de proporcionar el código</li>
            </ul>
          </div>
          
          <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
          
          <div class="footer">
            <p>Este es un correo automático del sistema RH Compensamos</p>
            <p>© 2024 RH Compensamos. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Generar plantilla para notificar creación de solicitud al candidato
  generateSolicitudCreadaHTML(params: {
    candidatoNombre: string;
    usuario: string;
    password: string;
    empresaNombre: string;
    solicitudId: number | string;
    fecha: string;
    detalles?: Record<string, any>;
  }): string {
    const { candidatoNombre, usuario, password, empresaNombre, solicitudId, fecha, detalles } = params;
    const detallesHtml = detalles ? Object.entries(detalles)
      .map(([k, v]) => `<tr><td style="padding:6px 8px;border-bottom:1px solid #eee;color:#555">${k}</td><td style="padding:6px 8px;border-bottom:1px solid #eee;color:#111">${String(v)}</td></tr>`)
      .join('') : '';

    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Orden de ingreso creada</title>
      </head>
      <body style="font-family:Arial,Helvetica,sans-serif;background:#f6f7fb;margin:0;padding:24px;color:#111">
        <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:10px;box-shadow:0 2px 10px rgba(0,0,0,0.06);overflow:hidden">
          <div style="background:#0ea5e9;color:#fff;padding:20px 24px">
            <h2 style="margin:0">Orden de ingreso creada</h2>
            <div style="opacity:.9;font-size:13px">${fecha}</div>
          </div>
          <div style="padding:24px">
            <p>Hola <strong>${candidatoNombre || 'Candidato'}</strong>,</p>
            <p>Te informamos que se ha creado una <strong>orden de ingreso</strong> en la empresa <strong>${empresaNombre}</strong> con ID de solicitud <strong>#${solicitudId}</strong>.</p>
            <div style="margin:16px 0;padding:14px 16px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px">
              <div style="font-weight:600;margin-bottom:8px">Credenciales de acceso</div>
              <div style="font-family:Consolas,Monaco,monospace;background:#111;color:#fff;display:inline-block;padding:6px 10px;border-radius:6px;margin-right:6px">${usuario}</div>
              <div style="font-family:Consolas,Monaco,monospace;background:#111;color:#fff;display:inline-block;padding:6px 10px;border-radius:6px">${password}</div>
              <div style="font-size:12px;color:#6b7280;margin-top:8px">Por seguridad, te recomendamos cambiar tu contraseña en el primer ingreso.</div>
            </div>
            ${detallesHtml ? `
            <div style="margin-top:10px">
              <div style="font-weight:600;margin-bottom:6px">Resumen de la solicitud</div>
              <table style="width:100%;border-collapse:collapse">${detallesHtml}</table>
            </div>` : ''}
            <p style="margin-top:18px">Si no esperabas este correo, por favor ignóralo o contacta a soporte.</p>
          </div>
          <div style="padding:16px 24px;background:#f9fafb;border-top:1px solid #eef2f7;color:#6b7280;font-size:12px;text-align:center">
            © ${new Date().getFullYear()} RH Compensamos. Este es un mensaje automático, no responder.
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Enviar email usando servicio profesional (SendGrid/Mailgun)
  async sendEmail(emailData: EmailData): Promise<{ success: boolean; message: string }> {
    try {
      // Opción 1: Usar SendGrid (Recomendado para producción)
      if (import.meta.env.VITE_SENDGRID_API_KEY) {
        return await this.sendWithSendGrid(emailData);
      }
      
      // Opción 2: Usar Mailgun (Alternativa)
      if (import.meta.env.VITE_MAILGUN_API_KEY) {
        return await this.sendWithMailgun(emailData);
      }
      
      // Opción 3: Fallback a Supabase Edge Functions (Gmail SMTP)
      if (this.config) {
        return await this.sendWithSupabase(emailData);
      }
      
      throw new Error('No hay configuración de email disponible');
    } catch (error) {
      console.error('Error enviando email:', error);
      return {
        success: false,
        message: 'Error al enviar el email'
      };
    }
  }

  // Enviar con SendGrid (Más confiable para dominios corporativos)
  private async sendWithSendGrid(emailData: EmailData): Promise<{ success: boolean; message: string }> {
    try {
      // Importar SendGrid dinámicamente
      const sgMail = await import('@sendgrid/mail');
      
      // Configurar API Key
      sgMail.default.setApiKey(import.meta.env.VITE_SENDGRID_API_KEY!);

      // Preparar mensaje
      const msg = {
        to: emailData.to,
        from: {
          email: 'noreply@rhcompensamos.com',
          name: 'RH Compensamos'
        },
        replyTo: 'soporte@rhcompensamos.com',
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text || emailData.html.replace(/<[^>]*>/g, ''),
        // Headers adicionales para mejor deliverabilidad
        headers: {
          'X-Mailer': 'RH Compensamos System',
          'X-Priority': '3',
          'X-MSMail-Priority': 'Normal'
        },
        // Configuración de tracking
        trackingSettings: {
          clickTracking: {
            enable: true,
            enableText: false
          },
          openTracking: {
            enable: true
          }
        }
      };

      // Enviar email
      await sgMail.default.send(msg);

      console.log('✅ Email enviado exitosamente con SendGrid a:', emailData.to);
      
      return {
        success: true,
        message: 'Email enviado correctamente con SendGrid'
      };
    } catch (error: any) {
      console.error('❌ Error SendGrid:', error);
      
      // Manejar errores específicos de SendGrid
      if (error.response) {
        const { status, body } = error.response;
        console.error('SendGrid API Error:', { status, body });
        
        return {
          success: false,
          message: `Error SendGrid (${status}): ${body?.errors?.[0]?.message || 'Error desconocido'}`
        };
      }
      
      return {
        success: false,
        message: 'Error al enviar con SendGrid'
      };
    }
  }

  // Enviar con Mailgun (Alternativa confiable)
  private async sendWithMailgun(emailData: EmailData): Promise<{ success: boolean; message: string }> {
    try {
      const formData = new FormData();
      formData.append('from', 'RH Compensamos <noreply@rhcompensamos.com>');
      formData.append('to', emailData.to);
      formData.append('subject', emailData.subject);
      formData.append('html', emailData.html);
      if (emailData.text) {
        formData.append('text', emailData.text);
      }

      const response = await fetch(`https://api.mailgun.net/v3/${import.meta.env.VITE_MAILGUN_DOMAIN}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`api:${import.meta.env.VITE_MAILGUN_API_KEY}`)}`,
        },
        body: formData
      });

      if (response.ok) {
        return {
          success: true,
          message: 'Email enviado correctamente con Mailgun'
        };
      } else {
        const errorData = await response.text();
        console.error('Mailgun error:', errorData);
        return {
          success: false,
          message: 'Error al enviar con Mailgun'
        };
      }
    } catch (error) {
      console.error('Mailgun error:', error);
      return {
        success: false,
        message: 'Error al enviar con Mailgun'
      };
    }
  }

  // Fallback: Enviar con Supabase Edge Functions (Gmail SMTP)
  private async sendWithSupabase(emailData: EmailData): Promise<{ success: boolean; message: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('smooth-responder', {
        body: {
          to: emailData.to,
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text,
          gmail: this.config!.gmail,
          password: this.config!.password,
          appPassword: this.config!.appPassword
        }
      });

      if (error) {
        return {
          success: false,
          message: 'Error al enviar el email con Gmail SMTP'
        };
      }

      return {
        success: true,
        message: 'Email enviado correctamente con Gmail SMTP'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error al enviar el email con Gmail SMTP'
      };
    }
  }

  // Enviar código de verificación
  async sendVerificationCode(email: string, codigo: string, nombre?: string, userEmail?: string): Promise<{ success: boolean; message: string }> {
    const html = this.generateVerificationEmailHTML(codigo, nombre, userEmail);
    
    return this.sendEmail({
      to: email,
      subject: 'Código de Verificación - RH Compensamos',
      html: html,
      text: `Tu código de verificación es: ${codigo}. Este código expira en 30 minutos.`,
      from: 'noreply@rhcompensamos.com'
    });
  }

  // Enviar notificación de cambio de contraseña
  async sendPasswordChangedNotification(email: string, nombre?: string): Promise<{ success: boolean; message: string }> {
    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Contraseña Cambiada</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background-color: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #059669;
            margin-bottom: 10px;
          }
          .success-icon {
            color: #059669;
            font-size: 48px;
            margin-bottom: 20px;
          }
          .warning {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            color: #92400e;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">RH Compensamos</div>
            <div class="success-icon">✅</div>
            <h1>Contraseña Cambiada Exitosamente</h1>
          </div>
          
          <p>Hola${nombre ? ` ${nombre}` : ''},</p>
          
          <p>Tu contraseña ha sido cambiada exitosamente en tu cuenta de RH Compensamos.</p>
          
          <div class="warning">
            <strong>🔒 Seguridad:</strong>
            <ul>
              <li>Si no realizaste este cambio, contacta inmediatamente al soporte</li>
              <li>Mantén tu contraseña segura y no la compartas</li>
              <li>Considera habilitar la autenticación de dos factores</li>
            </ul>
          </div>
          
          <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
          
          <div class="footer">
            <p>Este es un correo automático, no respondas a este mensaje.</p>
            <p>© 2024 RH Compensamos. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Contraseña Cambiada - RH Compensamos',
      html: html,
      text: 'Tu contraseña ha sido cambiada exitosamente. Si no realizaste este cambio, contacta al soporte inmediatamente.',
      from: 'noreply@rhcompensamos.com'
    });
  }

  async sendSolicitudCreada(params: {
    to: string;
    candidatoNombre: string;
    usuario: string;
    password: string;
    empresaNombre: string;
    solicitudId: number | string;
    fecha?: string;
    detalles?: Record<string, any>;
  }): Promise<{ success: boolean; message: string }> {
    const html = this.generateSolicitudCreadaHTML({
      candidatoNombre: params.candidatoNombre,
      usuario: params.usuario,
      password: params.password,
      empresaNombre: params.empresaNombre,
      solicitudId: params.solicitudId,
      fecha: params.fecha || new Date().toLocaleString('es-ES'),
      detalles: params.detalles
    });

    return this.sendEmail({
      to: params.to,
      subject: `Orden de ingreso creada - Empresa ${params.empresaNombre}`,
      html,
      text: `Se creó una orden de ingreso en ${params.empresaNombre} (Solicitud #${params.solicitudId}). Usuario: ${params.usuario} / Contraseña: ${params.password}`,
      from: 'noreply@rhcompensamos.com'
    });
  }
}

export const emailService = new EmailService(); 
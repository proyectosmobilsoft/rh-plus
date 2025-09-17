import { supabase } from './supabaseClient';

// Función para obtener la URL base del sistema
function getBaseUrl(): string {
  // Prioriza variables de entorno si existen
  const envUrl = (import.meta as any).env?.VITE_PUBLIC_APP_URL || (import.meta as any).env?.VITE_APP_URL;
  if (envUrl && typeof envUrl === 'string') {
    try {
      const url = new URL(envUrl);
      return url.origin;
    } catch {
      // si no es URL válida, sigue con origin
    }
  }
  // Fallback al origin del navegador
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  // Último recurso
  return 'https://localhost';
}

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
    temporal?: string;
    sistemaUrl?: string;
  }): string {
    const { candidatoNombre, usuario, password, empresaNombre, solicitudId, fecha, detalles, temporal, sistemaUrl } = params;
    const detallesHtml = detalles ? Object.entries(detalles)
      .map(([k, v]) => `<tr><td style="padding:6px 8px;border-bottom:1px solid #eee;color:#555">${k}</td><td style="padding:6px 8px;border-bottom:1px solid #eee;color:#111">${String(v)}</td></tr>`)
      .join('') : '';

    // Usar temporal en el título si está disponible, sino usar empresaNombre
    const tituloEmpresa = temporal || empresaNombre;

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
            <h2 style="margin:0">Orden de ingreso creada - ${tituloEmpresa}</h2>
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
              ${sistemaUrl ? `
              <div style="margin-top:12px;padding:10px;background:#e0f2fe;border:1px solid #0ea5e9;border-radius:6px">
                <div style="font-weight:600;color:#0c4a6e;margin-bottom:6px">🌐 Acceso al Sistema</div>
                <div style="font-size:14px;color:#0c4a6e;margin-bottom:8px">Puedes acceder al sistema usando las credenciales proporcionadas en:</div>
                <a href="${sistemaUrl}" style="display:inline-block;background:#0ea5e9;color:#fff;padding:8px 16px;text-decoration:none;border-radius:6px;font-weight:600;margin-top:4px">Ingresar al Sistema</a>
              </div>` : ''}
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
      
      // Opción 4: Simulación para desarrollo
      console.log('📧 Simulando envío de correo (sin configuración de email):', {
        to: emailData.to,
        subject: emailData.subject,
        from: emailData.from
      });
      
      return {
        success: true,
        message: 'Email simulado (configura SendGrid para envío real)'
      };
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
      // Usar Supabase Edge Function para evitar problemas de CORS
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: emailData.to,
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text || emailData.html.replace(/<[^>]*>/g, ''),
          gmail: this.config?.gmail || 'noreply@rhcompensamos.com',
          password: this.config?.password || 'default_password',
          appPassword: this.config?.appPassword
        }
      });

      if (error) {
        console.error('❌ Error SendGrid Edge Function:', error);
        return {
          success: false,
          message: `Error SendGrid: ${error.message || 'Error desconocido'}`
        };
      }

      if (data && data.success === false) {
        return {
          success: false,
          message: data.message || 'Error al enviar el email con SendGrid'
        };
      }

      console.log('✅ Email enviado exitosamente con SendGrid a:', emailData.to);
      
      return {
        success: true,
        message: 'Email enviado correctamente con SendGrid'
      };
    } catch (error: any) {
      console.error('❌ Error SendGrid:', error);
      return {
        success: false,
        message: `Error SendGrid: ${error.message || 'Error desconocido'}`
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
      // Usar Supabase Edge Function con el formato correcto
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: emailData.to,
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text || emailData.html.replace(/<[^>]*>/g, ''),
          gmail: this.config!.gmail,
          password: this.config!.password,
          appPassword: this.config!.appPassword
        }
      });

      if (error) {
        console.error('Error Supabase Edge Function:', error);
        return {
          success: false,
          message: `Error al enviar el email: ${error.message || 'Error desconocido'}`
        };
      }

      if (data && data.success === false) {
        return {
          success: false,
          message: data.message || 'Error al enviar el email'
        };
      }

      return {
        success: true,
        message: 'Email enviado correctamente con Gmail SMTP'
      };
    } catch (error: any) {
      console.error('Error Supabase Edge Function:', error);
      return {
        success: false,
        message: `Error al enviar el email: ${error.message || 'Error desconocido'}`
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
    temporal?: string;
    sistemaUrl?: string;
  }): Promise<{ success: boolean; message: string }> {
    // Usar temporal en el título si está disponible, sino usar empresaNombre
    const tituloEmpresa = params.temporal || params.empresaNombre;
    
    const html = this.generateSolicitudCreadaHTML({
      candidatoNombre: params.candidatoNombre,
      usuario: params.usuario,
      password: params.password,
      empresaNombre: params.empresaNombre,
      solicitudId: params.solicitudId,
      fecha: params.fecha || new Date().toLocaleString('es-ES'),
      detalles: params.detalles,
      temporal: params.temporal,
      sistemaUrl: params.sistemaUrl
    });

    return this.sendEmail({
      to: params.to,
      subject: `Orden de ingreso creada - ${tituloEmpresa}`,
      html,
      text: `Se creó una orden de ingreso en ${params.empresaNombre} (Solicitud #${params.solicitudId}). Usuario: ${params.usuario} / Contraseña: ${params.password}${params.sistemaUrl ? ` / URL: ${params.sistemaUrl}` : ''}`,
      from: 'noreply@rhcompensamos.com'
    });
  }

  // Función para enviar correo de documentos devueltos
  async sendDocumentosDevueltos(params: {
    to: string;
    candidatoNombre: string;
    numeroDocumento: string;
    tipoDocumento: string;
    empresaNombre: string;
    observaciones: string;
    solicitudId: number;
    fecha: string;
    sistemaUrl: string;
  }): Promise<{ success: boolean; message: string }> {
    const html = this.generateDocumentosDevueltosHTML(params);
    
    return this.sendEmail({
      to: params.to,
      subject: `Documentos devueltos - Solicitud #${params.solicitudId}`,
      html,
      text: `Sus documentos han sido devueltos para la solicitud #${params.solicitudId} en ${params.empresaNombre}. Observaciones: ${params.observaciones}${params.sistemaUrl ? ` / URL: ${params.sistemaUrl}` : ''}`,
      from: 'noreply@rhcompensamos.com'
    });
  }

  // Función para enviar notificación de solicitud creada en día no hábil
  async sendSolicitudDiaNoHabil(params: {
    to: string;
    empresaNombre: string;
    solicitudId: number;
    fechaCreacion: string;
    tipoDiaNoHabil: string;
    nombreFestivo?: string;
    sistemaUrl: string;
  }): Promise<{ success: boolean; message: string }> {
    const html = this.generateSolicitudDiaNoHabilHTML(params);
    
    return this.sendEmail({
      to: params.to,
      subject: `Notificación - Solicitud #${params.solicitudId} creada en día no hábil`,
      html,
      text: `Se ha creado una solicitud #${params.solicitudId} en ${params.empresaNombre} en un día no hábil (${params.tipoDiaNoHabil}). Fecha: ${params.fechaCreacion}${params.sistemaUrl ? ` / URL: ${params.sistemaUrl}` : ''}`,
      from: 'noreply@rhcompensamos.com'
    });
  }

  // Generar HTML para correo de documentos devueltos
  generateDocumentosDevueltosHTML(params: {
    candidatoNombre: string;
    numeroDocumento: string;
    tipoDocumento: string;
    empresaNombre: string;
    observaciones: string;
    solicitudId: number;
    fecha: string;
    sistemaUrl: string;
  }): string {
    const { candidatoNombre, numeroDocumento, tipoDocumento, empresaNombre, observaciones, solicitudId, fecha, sistemaUrl } = params;
    
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Documentos Devueltos</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #dc2626, #ef4444); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { margin-bottom: 20px; }
          .info-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 15px; margin: 15px 0; }
          .info-box h3 { color: #dc2626; margin-top: 0; }
          .observations { background: #fef3c7; border: 1px solid #fde68a; border-radius: 8px; padding: 15px; margin: 15px 0; }
          .observations h3 { color: #d97706; margin-top: 0; }
          .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 0; }
          .button:hover { background: #b91c1c; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📄 Documentos Devueltos</h1>
          </div>
          
          <div class="content">
            <p>Estimado/a <strong>${candidatoNombre}</strong>,</p>
            
            <p>Le informamos que los documentos que envió para su solicitud de empleo han sido devueltos y requieren corrección.</p>
            
            <div class="info-box">
              <h3>📋 Información de la Solicitud</h3>
              <p><strong>Número de Solicitud:</strong> #${solicitudId}</p>
              <p><strong>Empresa:</strong> ${empresaNombre}</p>
              <p><strong>Documento:</strong> ${tipoDocumento} ${numeroDocumento}</p>
              <p><strong>Fecha:</strong> ${fecha}</p>
            </div>
            
            <div class="observations">
              <h3>⚠️ Observaciones</h3>
              <p>${observaciones}</p>
            </div>
            
            <p>Por favor, revise los comentarios anteriores y vuelva a cargar los documentos corregidos en el sistema.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${sistemaUrl}" class="button">Acceder al Sistema</a>
            </div>
            
            <p>Si tiene alguna pregunta o necesita asistencia, no dude en contactarnos.</p>
          </div>
          
          <div class="footer">
            <p>Este es un correo automático del sistema de Recursos Humanos.</p>
            <p>Por favor, no responda a este correo.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Generar HTML para notificación de solicitud creada en día no hábil
  generateSolicitudDiaNoHabilHTML(params: {
    empresaNombre: string;
    solicitudId: number;
    fechaCreacion: string;
    tipoDiaNoHabil: string;
    nombreFestivo?: string;
    sistemaUrl: string;
  }): string {
    const { empresaNombre, solicitudId, fechaCreacion, tipoDiaNoHabil, nombreFestivo, sistemaUrl } = params;
    
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Notificación - Solicitud Creada en Día No Hábil</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #f59e0b, #fbbf24); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { margin-bottom: 20px; }
          .info-box { background: #fef3c7; border: 1px solid #fde68a; border-radius: 8px; padding: 15px; margin: 15px 0; }
          .info-box h3 { color: #d97706; margin-top: 0; }
          .warning-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 15px; margin: 15px 0; }
          .warning-box h3 { color: #dc2626; margin-top: 0; }
          .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 0; }
          .button:hover { background: #d97706; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
          .highlight { background: #fef3c7; padding: 2px 6px; border-radius: 4px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Notificación Importante</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Solicitud creada en día no hábil</p>
          </div>
          
          <div class="content">
            <p>Estimado/a <strong>${empresaNombre}</strong>,</p>
            
            <p>Le informamos que se ha creado una nueva solicitud en nuestro sistema en una fecha no hábil.</p>
            
            <div class="info-box">
              <h3>📋 Información de la Solicitud</h3>
              <p><strong>Número de Solicitud:</strong> #${solicitudId}</p>
              <p><strong>Empresa:</strong> ${empresaNombre}</p>
              <p><strong>Fecha de Creación:</strong> ${fechaCreacion}</p>
              <p><strong>Tipo de Día:</strong> <span class="highlight">${tipoDiaNoHabil}</span></p>
              ${nombreFestivo ? `<p><strong>Festivo:</strong> ${nombreFestivo}</p>` : ''}
            </div>
            
            <div class="warning-box">
              <h3>⚠️ Información Importante</h3>
              <p>Esta solicitud fue creada en un <strong>día no hábil</strong> (${tipoDiaNoHabil.toLowerCase()}).</p>
              <p>Por favor, tenga en cuenta que:</p>
              <ul>
                <li>El procesamiento de esta solicitud comenzará el próximo día hábil</li>
                <li>Los tiempos de respuesta pueden verse afectados</li>
                <li>Se recomienda contactar al equipo de soporte si tiene alguna urgencia</li>
              </ul>
            </div>
            
            <p>Puede acceder al sistema para revisar los detalles de la solicitud y su estado actual.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${sistemaUrl}" class="button">Ver Solicitud en el Sistema</a>
            </div>
            
            <p>Si tiene alguna pregunta o necesita asistencia, no dude en contactarnos.</p>
          </div>
          
          <div class="footer">
            <p>Este es un correo automático del sistema de Recursos Humanos.</p>
            <p>Por favor, no responda a este correo.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export const emailService = new EmailService(); 
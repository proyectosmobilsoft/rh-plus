import { supabase } from './supabaseClient';

interface EmailConfig {
  gmail: string;
  password: string;
  appPassword?: string; // Para Gmail con 2FA
}

interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private config: EmailConfig | null = null;

  // Configurar las credenciales de Gmail
  setConfig(config: EmailConfig) {
    this.config = config;
  }

  // Generar plantilla HTML para el código de verificación
  private generateVerificationEmailHTML(codigo: string, nombre?: string): string {
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
            color: #2563eb;
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
            color: #2563eb;
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
            background-color: #2563eb;
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
          
          <p>Hola${nombre ? ` ${nombre}` : ''},</p>
          
          <p>Has solicitado recuperar tu contraseña. Para continuar, utiliza el siguiente código de verificación:</p>
          
          <div class="code-container">
            <div class="code">${codigo}</div>
          </div>
          
          <div class="warning">
            <strong>⚠️ Importante:</strong>
            <ul>
              <li>Este código expira en 30 minutos</li>
              <li>No compartas este código con nadie</li>
              <li>Si no solicitaste este código, ignora este correo</li>
            </ul>
          </div>
          
          <p>Si tienes problemas, contacta al soporte técnico.</p>
          
          <div class="footer">
            <p>Este es un correo automático, no respondas a este mensaje.</p>
            <p>© 2024 RH Compensamos. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Enviar email usando Gmail SMTP
  async sendEmail(emailData: EmailData): Promise<{ success: boolean; message: string }> {
    if (!this.config) {
      throw new Error('Configuración de email no establecida');
    }

    try {
      // Usar Supabase Edge Functions para enviar email
      const { data, error } = await supabase.functions.invoke('smooth-responder', {
        body: {
          to: emailData.to,
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text,
          gmail: this.config.gmail,
          password: this.config.password,
          appPassword: this.config.appPassword
        }
      });

      if (error) {
        return {
          success: false,
          message: 'Error al enviar el email'
        };
      }

      return {
        success: true,
        message: 'Email enviado correctamente'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error al enviar el email'
      };
    }
  }

  // Enviar código de verificación
  async sendVerificationCode(email: string, codigo: string, nombre?: string): Promise<{ success: boolean; message: string }> {
    const html = this.generateVerificationEmailHTML(codigo, nombre);
    
    return this.sendEmail({
      to: email,
      subject: 'Código de Verificación - RH Compensamos',
      html: html,
      text: `Tu código de verificación es: ${codigo}. Este código expira en 30 minutos.`
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
      text: 'Tu contraseña ha sido cambiada exitosamente. Si no realizaste este cambio, contacta al soporte inmediatamente.'
    });
  }
}

export const emailService = new EmailService(); 
import { supabase } from './supabaseClient';

export const initDatabase = async () => {
  try {
    console.log('Verificando tablas de la base de datos...');

    // Verificar si las tablas existen intentando hacer una consulta simple
    const { data: emailTemplates, error: emailTemplatesError } = await supabase
      .from('email_templates')
      .select('id')
      .limit(1);

    if (emailTemplatesError) {
      console.log('Tabla email_templates no existe o hay un error:', emailTemplatesError);
      console.log('Por favor, crea las tablas manualmente en Supabase');
    } else {
      console.log('Tabla email_templates existe');
    }

    const { data: gmailTemplates, error: gmailTemplatesError } = await supabase
      .from('gmail_templates')
      .select('id')
      .limit(1);

    if (gmailTemplatesError) {
      console.log('Tabla gmail_templates no existe o hay un error:', gmailTemplatesError);
      console.log('Por favor, crea las tablas manualmente en Supabase');
    } else {
      console.log('Tabla gmail_templates existe');
    }

    const { data: emailRecipients, error: emailRecipientsError } = await supabase
      .from('email_recipients')
      .select('id')
      .limit(1);

    if (emailRecipientsError) {
      console.log('Tabla email_recipients no existe o hay un error:', emailRecipientsError);
      console.log('Por favor, crea las tablas manualmente en Supabase');
    } else {
      console.log('Tabla email_recipients existe');
    }

    // Intentar insertar datos de ejemplo si la tabla existe
    if (!emailRecipientsError) {
      const { error: insertError } = await supabase
        .from('email_recipients')
        .upsert([
          {
            email: 'candidato1@ejemplo.com',
            nombre: 'Juan Pérez',
            empresa: 'Empresa A',
            tipo: 'candidato'
          },
          {
            email: 'candidato2@ejemplo.com',
            nombre: 'María García',
            empresa: 'Empresa B',
            tipo: 'candidato'
          },
          {
            email: 'empleador1@ejemplo.com',
            nombre: 'Carlos López',
            empresa: 'Empresa C',
            tipo: 'empleador'
          },
          {
            email: 'empleador2@ejemplo.com',
            nombre: 'Ana Martínez',
            empresa: 'Empresa D',
            tipo: 'empleador'
          }
        ], {
          onConflict: 'email'
        });

      if (insertError) {
        console.log('Error insertando destinatarios de ejemplo:', insertError);
      } else {
        console.log('Datos de ejemplo insertados correctamente');
      }
    }

    console.log('Verificación de base de datos completada');
  } catch (error) {
    console.error('Error verificando base de datos:', error);
  }
}; 


import { supabase } from './supabaseClient';

export const checkTables = async () => {
  console.log('=== VERIFICANDO ESTRUCTURA DE TABLAS ===');
  
  try {
    // Verificar email_templates
    console.log('Verificando tabla email_templates...');
    const { data: emailTemplatesData, error: emailTemplatesError } = await supabase
      .from('email_templates')
      .select('*')
      .limit(1);
    
    console.log('email_templates - data:', emailTemplatesData);
    console.log('email_templates - error:', emailTemplatesError);
    
    if (emailTemplatesError) {
      console.error('Error accediendo a email_templates:', emailTemplatesError);
    } else {
      console.log('Tabla email_templates existe y es accesible');
    }
    
    // Verificar gmail_templates
    console.log('Verificando tabla gmail_templates...');
    const { data: gmailTemplatesData, error: gmailTemplatesError } = await supabase
      .from('gmail_templates')
      .select('*')
      .limit(1);
    
    console.log('gmail_templates - data:', gmailTemplatesData);
    console.log('gmail_templates - error:', gmailTemplatesError);
    
    if (gmailTemplatesError) {
      console.error('Error accediendo a gmail_templates:', gmailTemplatesError);
    } else {
      console.log('Tabla gmail_templates existe y es accesible');
    }
    
    // Intentar insertar un registro de prueba en email_templates
    console.log('Intentando insertar registro de prueba en email_templates...');
    const testEmailTemplate = {
      nombre: 'TEST_TEMPLATE_' + Date.now(),
      asunto: 'Asunto de prueba',
      contenido_html: '<p>Contenido de prueba</p>',
      variables: ['nombre', 'email'],
      activo: true
    };
    
    const { data: insertEmailData, error: insertEmailError } = await supabase
      .from('email_templates')
      .insert([testEmailTemplate])
      .select()
      .single();
    
    console.log('Insert email_templates - data:', insertEmailData);
    console.log('Insert email_templates - error:', insertEmailError);
    
    if (insertEmailError) {
      console.error('Error insertando en email_templates:', insertEmailError);
    } else {
      console.log('Inserción exitosa en email_templates');
      
      // Eliminar el registro de prueba
      const { error: deleteError } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', insertEmailData.id);
      
      if (deleteError) {
        console.error('Error eliminando registro de prueba:', deleteError);
      } else {
        console.log('Registro de prueba eliminado correctamente');
      }
    }
    
    // Intentar insertar un registro de prueba en gmail_templates
    console.log('Intentando insertar registro de prueba en gmail_templates...');
    const testGmailTemplate = {
      nombre: 'TEST_GMAIL_TEMPLATE_' + Date.now(),
      asunto: 'Asunto de prueba Gmail',
      contenido_html: '<p>Contenido de prueba Gmail</p>',
      variables: ['nombre', 'email'],
      tipo_destinatario: 'candidatos',
      activo: true
    };
    
    const { data: insertGmailData, error: insertGmailError } = await supabase
      .from('gmail_templates')
      .insert([testGmailTemplate])
      .select()
      .single();
    
    console.log('Insert gmail_templates - data:', insertGmailData);
    console.log('Insert gmail_templates - error:', insertGmailError);
    
    if (insertGmailError) {
      console.error('Error insertando en gmail_templates:', insertGmailError);
    } else {
      console.log('Inserción exitosa en gmail_templates');
      
      // Eliminar el registro de prueba
      const { error: deleteError } = await supabase
        .from('gmail_templates')
        .delete()
        .eq('id', insertGmailData.id);
      
      if (deleteError) {
        console.error('Error eliminando registro de prueba Gmail:', deleteError);
      } else {
        console.log('Registro de prueba Gmail eliminado correctamente');
      }
    }
    
    console.log('=== FIN VERIFICACIÓN DE TABLAS ===');
    
  } catch (error) {
    console.error('Error general verificando tablas:', error);
  }
}; 
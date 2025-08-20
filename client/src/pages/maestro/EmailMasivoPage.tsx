import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Mail, 
  Users, 
  FileText, 
  Send, 
  Plus, 
  Eye,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  Building,
  Code,
  GripVertical,
  Calendar,
  Megaphone
} from 'lucide-react';
import { supabase } from '@/services/supabaseClient';
import { emailTemplatesService } from '@/services/emailTemplatesService';
import { initDatabase } from '@/services/initDatabase';
import { checkTables } from '@/services/checkTables';
import { toast } from 'sonner';
import { emailService } from '@/services/emailService';

interface EmailTemplate {
  id: number;
  nombre: string;
  asunto: string;
  contenido_html: string;
  variables: string[];
  activo: boolean;
  created_at: string;
  updated_at: string;
}

interface GmailTemplate {
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

interface EmailCampaign {
  id: number;
  nombre: string;
  template_id: number | null;
  asunto_personalizado: string;
  contenido_personalizado: string;
  estado: string;
  destinatarios_count: number;
  enviados_count: number;
  created_at: string;
  updated_at: string;
}

interface GmailCampaign {
  id: number;
  nombre: string;
  template_id: number | null;
  asunto_personalizado: string;
  contenido_personalizado: string;
  tipo_destinatario: string;
  estado: string;
  destinatarios_count: number;
  enviados_count: number;
  created_at: string;
  updated_at: string;
}

interface EmailRecipient {
  id: number;
  email: string;
  nombre: string;
  empresa: string | null;
  tipo: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

// Función para convertir HTML a texto plano
const htmlToPlainText = (html: string): string => {
  // Crear un elemento temporal para decodificar HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // Obtener solo el texto
  const text = tempDiv.textContent || tempDiv.innerText || '';
  
  // Limpiar espacios extra y saltos de línea
  return text
    .replace(/\s+/g, ' ') // Reemplazar múltiples espacios por uno solo
    .replace(/\n\s*\n/g, '\n\n') // Mantener saltos de línea dobles
    .trim();
};

export default function EmailMasivoPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [gmailTemplates, setGmailTemplates] = useState<GmailTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [gmailCampaigns, setGmailCampaigns] = useState<GmailCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDestinatarios, setLoadingDestinatarios] = useState(false);
  const [enviandoCorreos, setEnviandoCorreos] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [campaignInfo, setCampaignInfo] = useState<any>(null);
  const [campaignRecipients, setCampaignRecipients] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | GmailTemplate | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [showHtmlPreview, setShowHtmlPreview] = useState(false);
  const [selectedDestinatarios, setSelectedDestinatarios] = useState<'candidatos' | 'empleadores' | 'ambos'>('candidatos');
  const [recipients, setRecipients] = useState<EmailRecipient[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<number[]>([]);
  const [selectionType, setSelectionType] = useState<'todos' | 'especificos'>('todos');
  const [isDragging, setIsDragging] = useState(false);
  const [draggedVariable, setDraggedVariable] = useState<string>('');
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [activeTab, setActiveTab] = useState('campanas');
  const [campaignData, setCampaignData] = useState({
    nombre: '',
    asunto: '',
    contenido: '',
    destinatarios: [] as any[]
  });

  useEffect(() => {
    const initializeData = async () => {
      try {
        // Inicializar base de datos
        await initDatabase();
        
        // Cargar datos
        await cargarTemplates();
        await cargarGmailTemplates();
        await cargarCampaigns();
        await cargarGmailCampaigns();
        await cargarDestinatarios();
      } catch (error) {
        console.error('Error inicializando datos:', error);
        toast.error('Error al cargar los datos');
      }
    };

    initializeData();
  }, []);

  const cargarTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('activo', true)
        .order('nombre');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error cargando templates:', error);
      toast.error('Error al cargar las plantillas');
    }
  };

  const cargarGmailTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('gmail_templates')
        .select('*')
        .eq('activo', true)
        .order('nombre');

      if (error) throw error;
      setGmailTemplates(data || []);
    } catch (error) {
      console.error('Error cargando plantillas de Gmail:', error);
      toast.error('Error al cargar las plantillas de Gmail');
    }
  };

  const cargarCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('email_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error cargando campañas:', error);
      toast.error('Error al cargar las campañas');
    }
  };

  const cargarGmailCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('gmail_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGmailCampaigns(data || []);
    } catch (error) {
      console.error('Error cargando campañas de Gmail:', error);
      toast.error('Error al cargar las campañas de Gmail');
    } finally {
      setLoading(false);
    }
  };

  const cargarDestinatarios = async () => {
    try {
      setLoadingDestinatarios(true);
      console.log('🔄 Cargando destinatarios desde la base de datos...');
      
      let destinatariosCargados: any[] = [];

      // Cargar candidatos si es necesario
      if (selectedDestinatarios === 'candidatos' || selectedDestinatarios === 'ambos') {
        console.log('📋 Cargando candidatos...');
        const { data: candidatosData, error: candidatosError } = await supabase
          .from('candidatos')
          .select('*')
          .order('primer_nombre');

        if (candidatosError) {
          console.error('❌ Error cargando candidatos:', candidatosError);
        } else {
          console.log('✅ Candidatos cargados:', candidatosData?.length || 0);
          
          const candidatosTransformados = candidatosData?.map((candidato: any) => ({
            id: candidato.id,
            email: candidato.email,
            nombre: `${candidato.primer_nombre} ${candidato.primer_apellido}`,
            empresa: candidato.empresa_id ? `Empresa ID: ${candidato.empresa_id}` : null,
            tipo: 'candidato',
            activo: true,
            created_at: candidato.created_at,
            updated_at: candidato.updated_at
          })) || [];

          destinatariosCargados.push(...candidatosTransformados);
        }
      }

      // Cargar empleadores si es necesario
      if (selectedDestinatarios === 'empleadores' || selectedDestinatarios === 'ambos') {
        console.log('🏢 Cargando empleadores...');
        const { data: empresasData, error: empresasError } = await supabase
          .from('empresas')
          .select('*')
          .order('razon_social');

        if (empresasError) {
          console.error('❌ Error cargando empleadores:', empresasError);
        } else {
          console.log('✅ Empleadores cargados:', empresasData?.length || 0);
          
          const empleadoresTransformados = empresasData?.map((empresa: any) => ({
            id: empresa.id,
            email: empresa.email,
            nombre: empresa.razon_social,
            empresa: empresa.nombre,
            tipo: 'empleador',
            activo: true,
            created_at: empresa.created_at,
            updated_at: empresa.updated_at
          })) || [];

          destinatariosCargados.push(...empleadoresTransformados);
        }
      }

      console.log('🎯 Total de destinatarios cargados:', destinatariosCargados.length);
      setRecipients(destinatariosCargados);
      
    } catch (error) {
      console.error('❌ Error cargando destinatarios:', error);
      toast.error('Error al cargar los destinatarios');
    } finally {
      setLoadingDestinatarios(false);
    }
  };

  const handleRecipientToggle = (recipientId: number) => {
    setSelectedRecipients(prev => 
      prev.includes(recipientId) 
        ? prev.filter(id => id !== recipientId)
        : [...prev, recipientId]
    );
  };

  const handleSelectAllRecipients = () => {
    const filteredRecipients = recipients.filter(r => {
      if (selectedDestinatarios === 'candidatos') return r.tipo === 'candidato';
      if (selectedDestinatarios === 'empleadores') return r.tipo === 'empleador';
      return true; // ambos
    });
    setSelectedRecipients(filteredRecipients.map(r => r.id));
  };

  const handleDeselectAllRecipients = () => {
    setSelectedRecipients([]);
  };

  const getFilteredRecipients = () => {
    console.log('🔍 Filtrando destinatarios...');
    console.log('Tipo seleccionado:', selectedDestinatarios);
    console.log('Total de destinatarios:', recipients.length);
    
    const filtered = recipients.filter(r => {
      if (selectedDestinatarios === 'candidatos') {
        const isCandidato = r.tipo === 'candidato';
        console.log(`Candidato ${r.nombre}: ${isCandidato}`);
        return isCandidato;
      }
      if (selectedDestinatarios === 'empleadores') {
        const isEmpleador = r.tipo === 'empleador';
        console.log(`Empleador ${r.nombre}: ${isEmpleador}`);
        return isEmpleador;
      }
      console.log(`Ambos - ${r.nombre}: ${r.tipo}`);
      return true; // ambos
    });
    
    console.log('🎯 Destinatarios filtrados:', filtered.length);
    return filtered;
  };

  // Limpiar selección cuando cambie el tipo de destinatarios
  useEffect(() => {
    setSelectedRecipients([]);
  }, [selectedDestinatarios]);

  // Recargar destinatarios cuando cambie el tipo de destinatarios
  useEffect(() => {
    cargarDestinatarios();
  }, [selectedDestinatarios]);

  // Funciones para drag and drop
  const handleDragStart = (e: React.DragEvent, variable: string) => {
    setIsDragging(true);
    setDraggedVariable(variable);
    e.dataTransfer.setData('text/plain', `{{${variable}}}`);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedVariable('');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (draggedVariable) {
      const textarea = document.getElementById('contenido') as HTMLTextAreaElement;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const before = text.substring(0, start);
        const after = text.substring(end);
        textarea.value = before + `{{${draggedVariable}}}` + after;
        textarea.focus();
        textarea.setSelectionRange(start + draggedVariable.length + 4, start + draggedVariable.length + 4);
        setCampaignData(prev => ({ ...prev, contenido: textarea.value }));
      }
    }
  };

  const handleSaveTemplate = async () => {
    console.log('=== INICIO DEBUG GUARDADO PLANTILLA ===');
    console.log('Template name:', templateName);
    console.log('Campaign data:', campaignData);
    console.log('Selected destinatarios:', selectedDestinatarios);
    
    if (!templateName.trim()) {
      console.log('ERROR: Nombre de plantilla vacío');
      toast.error('Ingresa un nombre para la plantilla');
      return;
    }
    
    if (!campaignData.asunto || !campaignData.contenido) {
      console.log('ERROR: Asunto o contenido vacío');
      console.log('Asunto:', campaignData.asunto);
      console.log('Contenido:', campaignData.contenido);
      toast.error('Completa el asunto y contenido antes de guardar la plantilla');
      return;
    }
    
    try {
      console.log('Generando contenido HTML...');
      const contenidoHtml = textToHtml(campaignData.contenido);
      console.log('Contenido HTML generado:', contenidoHtml);
      
      // Determinar si es una plantilla de Gmail basado en el tipo de destinatarios seleccionado
      const isGmailTemplate = selectedDestinatarios !== 'ambos';
      console.log('Es plantilla de Gmail:', isGmailTemplate);
      console.log('Tipo de destinatarios:', selectedDestinatarios);
      
      if (isGmailTemplate) {
        console.log('=== GUARDANDO COMO PLANTILLA GMAIL ===');
        const templateData = {
          nombre: templateName,
          asunto: campaignData.asunto,
          contenido_html: contenidoHtml,
          variables: ['nombre', 'email', 'empresa', 'fecha', 'contraseña'],
          tipo_destinatario: selectedDestinatarios,
          activo: true
        };
        console.log('Datos a guardar en gmail_templates:', templateData);
        
        // Guardar como plantilla de Gmail usando el servicio
        const newTemplate = await emailTemplatesService.createGmailTemplate(templateData);
        
        console.log('Plantilla de Gmail guardada exitosamente:', newTemplate);
        toast.success('Plantilla de Gmail guardada exitosamente');
        await cargarGmailTemplates();
      } else {
        console.log('=== GUARDANDO COMO PLANTILLA REGULAR ===');
        const templateData = {
          nombre: templateName,
          asunto: campaignData.asunto,
          contenido_html: contenidoHtml,
          variables: ['nombre', 'email', 'empresa', 'fecha', 'contraseña'],
          activo: true
        };
        console.log('Datos a guardar en email_templates:', templateData);
        
        // Guardar como plantilla regular usando el servicio
        const newTemplate = await emailTemplatesService.createEmailTemplate(templateData);
        
        console.log('Plantilla regular guardada exitosamente:', newTemplate);
        toast.success('Plantilla guardada exitosamente');
        await cargarTemplates();
      }
      
      setShowSaveTemplateModal(false);
      setTemplateName('');
      console.log('=== FIN DEBUG GUARDADO PLANTILLA ===');
    } catch (error) {
      console.error('=== ERROR GUARDANDO PLANTILLA ===');
      console.error('Error completo:', error);
      console.error('Tipo de error:', typeof error);
      console.error('Mensaje de error:', error instanceof Error ? error.message : 'Error desconocido');
      console.error('Stack trace:', error instanceof Error ? error.stack : 'No disponible');
      toast.error(`Error al guardar la plantilla: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  // Función para eliminar campaña regular
  const handleDeleteCampaign = async (campaignId: number) => {
    try {
      const { error } = await supabase
        .from('email_campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) throw error;
      
      toast.success('Campaña eliminada correctamente');
      await cargarCampaigns();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast.error('Error al eliminar la campaña');
    }
  };

  // Función para eliminar campaña de Gmail
  const handleDeleteGmailCampaign = async (campaignId: number) => {
    try {
      const { error } = await supabase
        .from('gmail_campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) throw error;
      
      toast.success('Campaña de Gmail eliminada correctamente');
      await cargarGmailCampaigns();
    } catch (error) {
      console.error('Error deleting Gmail campaign:', error);
      toast.error('Error al eliminar la campaña de Gmail');
    }
  };



  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id.toString() === templateId);
    if (template) {
      setSelectedTemplate(template);
      
      // Convertir HTML a texto simple para el editor
      const textoSimple = htmlToText(template.contenido_html);
      
      setCampaignData(prev => ({
        ...prev,
        asunto: template.asunto,
        contenido: textoSimple
      }));
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'borrador': return 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200 transition-colors';
      case 'enviando': return 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 transition-colors';
      case 'completada': return 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200 transition-colors';
      case 'cancelada': return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200 transition-colors';
      case 'enviada': return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 transition-colors';
      default: return 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200 transition-colors';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'borrador': return <FileText className="w-4 h-4" />;
      case 'enviando': return <Clock className="w-4 h-4" />;
      case 'completada': return <CheckCircle className="w-4 h-4" />;
      case 'cancelada': return <AlertCircle className="w-4 h-4" />;
      case 'enviada': return <CheckCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const procesarVariables = (contenido: string, variables: any): string => {
    let resultado = contenido;
    
    // Reemplazar variables con valores de ejemplo
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      resultado = resultado.replace(regex, variables[key]);
    });
    
    return resultado;
  };

  // Nueva función para procesar variables como etiquetas en la preview
  const procesarVariablesConEtiquetas = (contenido: string): React.ReactNode => {
    const partes = contenido.split(/({{[^}]+}})/g);
    
    return partes.map((parte, index) => {
      const match = parte.match(/{{([^}]+)}}/);
      if (match) {
        const variableName = match[1];
        return (
          <Badge 
            key={index} 
            variant="secondary" 
            className="bg-cyan-100 text-cyan-800 border-cyan-200 text-xs font-mono mx-1"
          >
            {variableName}
          </Badge>
        );
      }
      return <span key={index}>{parte}</span>;
    });
  };

  // Función para renderizar la preview con etiquetas
  const renderPreviewWithTags = (contenido: string) => {
    return (
      <div className="whitespace-pre-wrap text-sm text-gray-800 font-sans">
        {procesarVariablesConEtiquetas(contenido)}
      </div>
    );
  };

  // Función para convertir HTML a texto legible
  const htmlToText = (html: string): string => {
    // Crear un elemento temporal para parsear el HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Obtener solo el contenido del mensaje, excluyendo header y footer
    let text = '';
    
    // Buscar el contenido principal (dentro del div.container)
    const container = tempDiv.querySelector('[style*="background-color: white"]') || tempDiv.querySelector('.container');
    if (container) {
      // Obtener todos los párrafos del contenido principal
      const paragraphs = container.querySelectorAll('p');
      text = Array.from(paragraphs)
        .map(p => p.textContent?.trim())
        .filter(p => {
          // Filtrar solo el contenido del mensaje
          const content = p || '';
          return content && 
                 !content.includes('RH Compensamos') && 
                 !content.includes('© 2024') &&
                 !content.includes('Este es un correo automático') &&
                 !content.includes('Todos los derechos reservados');
        })
        .join('\n\n');
    } else {
      // Fallback: obtener todo el texto y limpiar
      text = tempDiv.textContent || tempDiv.innerText || '';
    }
    
    // Limpiar espacios extra y saltos de línea
    text = text.replace(/\s+/g, ' ').trim();
    
    // Mantener algunos saltos de línea importantes para mejor legibilidad
    text = text.replace(/\. /g, '.\n\n');
    text = text.replace(/\! /g, '!\n\n');
    text = text.replace(/\? /g, '?\n\n');
    
    // Limpiar líneas vacías múltiples
    text = text.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    // Asegurar que no haya espacios al inicio de líneas
    text = text.split('\n').map(line => line.trim()).join('\n');
    
    // Remover cualquier referencia a estilos CSS o estructura HTML
    text = text.replace(/body\s*\{[^}]*\}/g, '');
    text = text.replace(/\.\w+\s*\{[^}]*\}/g, '');
    text = text.replace(/<[^>]*>/g, '');
    text = text.replace(/style\s*=\s*"[^"]*"/g, '');
    text = text.replace(/class\s*=\s*"[^"]*"/g, '');
    
    return text;
  };

  // Función para obtener una vista previa del texto procesado
  const getPreviewText = (contenido: string, variables: any): string => {
    const contenidoProcesado = procesarVariables(contenido, variables);
    return htmlToText(contenidoProcesado);
  };

  // Función para convertir texto simple a HTML
  const textToHtml = (text: string): string => {
    // Dividir el texto en párrafos
    const paragraphs = text.split('\n\n').filter(p => p.trim());
    
    // Convertir cada párrafo a HTML
    const htmlParagraphs = paragraphs.map(p => {
      const trimmed = p.trim();
      if (trimmed) {
        return `<p style="margin: 0 0 16px 0; color: #333;">${trimmed.replace(/\n/g, '<br>')}</p>`;
      }
      return '';
    }).filter(p => p);
    
    // Crear el HTML completo con estilos inline para mejor compatibilidad
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Correo</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="font-size: 24px; font-weight: bold; color: #2563eb; margin-bottom: 10px;">RH Compensamos</div>
          </div>
          
          ${htmlParagraphs.join('\n')}
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
            <p style="margin: 0 0 8px 0;">Este es un correo automático del sistema RH Compensamos</p>
            <p style="margin: 0;">© 2024 RH Compensamos. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  // Función para enviar correos
  const enviarCorreos = async (destinatarios: any[], asunto: string, contenido: string, campaignId: number, campaignType: 'email' | 'gmail') => {
    try {
      setEnviandoCorreos(true);
      console.log('📧 Iniciando envío de correos...');
      console.log('📊 Total de destinatarios:', destinatarios.length);
      
      let enviadosExitosos = 0;
      let errores = 0;
      
      for (const destinatario of destinatarios) {
        try {
          // Procesar variables en el contenido
          const contenidoPersonalizado = procesarVariables(contenido, {
            nombre: destinatario.nombre,
            email: destinatario.email,
            empresa: destinatario.empresa || 'N/A',
            fecha: new Date().toLocaleDateString('es-ES'),
            contraseña: '******' // Placeholder
          });
          
          const asuntoPersonalizado = procesarVariables(asunto, {
            nombre: destinatario.nombre,
            email: destinatario.email,
            empresa: destinatario.empresa || 'N/A',
            fecha: new Date().toLocaleDateString('es-ES'),
            contraseña: '******'
          });
          
          console.log(`📤 Enviando correo a: ${destinatario.email}`);
          
          // Envío real usando el servicio de email existente
          const emailData = {
            to: destinatario.email,
            subject: asuntoPersonalizado,
            html: contenidoPersonalizado,
            from: 'noreply@rhcompensamos.com'
          };
          
          // Usar el servicio de email que ya funciona
          const result = await emailService.sendEmail(emailData);
          
          if (!result.success) {
            throw new Error(result.message || 'Error desconocido en el envío');
          }
          
          // Registrar el envío en la base de datos
          const { error: logError } = await supabase
            .from('email_logs')
            .insert({
              campaign_id: campaignId,
              campaign_type: campaignType,
              destinatario_id: destinatario.id,
              destinatario_email: destinatario.email,
              destinatario_nombre: destinatario.nombre,
              asunto: asuntoPersonalizado,
              contenido: contenidoPersonalizado,
              estado: 'enviado',
              enviado_at: new Date().toISOString()
            });
          
          if (logError) {
            console.error('❌ Error registrando envío:', logError);
          }
          
          enviadosExitosos++;
          console.log(`✅ Correo enviado exitosamente a: ${destinatario.email}`);
          
        } catch (error) {
          console.error(`❌ Error enviando correo a ${destinatario.email}:`, error);
          errores++;
          
          // Registrar el error
          await supabase
            .from('email_logs')
            .insert({
              campaign_id: campaignId,
              campaign_type: campaignType,
              destinatario_id: destinatario.id,
              destinatario_email: destinatario.email,
              destinatario_nombre: destinatario.nombre,
              asunto: asunto,
              contenido: contenido,
              estado: 'error',
              error_message: error instanceof Error ? error.message : 'Error desconocido',
              enviado_at: new Date().toISOString()
            });
        }
      }
      
      // Actualizar el contador de enviados en la campaña
      const { error: updateError } = await supabase
        .from(campaignType === 'gmail' ? 'gmail_campaigns' : 'email_campaigns')
        .update({ 
          enviados_count: enviadosExitosos,
          estado: 'enviada'
        })
        .eq('id', campaignId);
      
      if (updateError) {
        console.error('❌ Error actualizando campaña:', updateError);
      }
      
      console.log(`📊 Resumen de envío:`);
      console.log(`✅ Enviados exitosamente: ${enviadosExitosos}`);
      console.log(`❌ Errores: ${errores}`);
      
      toast.success(`Campaña enviada: ${enviadosExitosos} correos enviados exitosamente`);
      
      if (errores > 0) {
        toast.error(`${errores} correos fallaron al enviar`);
      }
      
    } catch (error) {
      console.error('❌ Error general en envío de correos:', error);
      toast.error('Error al enviar los correos');
    } finally {
      setEnviandoCorreos(false);
    }
  };

  // Función para ver qué se envió y a quién
  const handleViewCampaignSentInfo = async (campaign: EmailCampaign | GmailCampaign, type: 'email' | 'gmail') => {
    try {
      // Obtener información de la campaña
      const campaignInfo = {
        nombre: campaign.nombre,
        asunto: campaign.asunto_personalizado,
        contenido: campaign.contenido_personalizado,
        estado: campaign.estado,
        tipo: type === 'gmail' ? 'Gmail' : 'Email Regular',
        total_destinatarios: campaign.destinatarios_count,
        enviados: campaign.enviados_count,
        fecha_creacion: new Date(campaign.created_at).toLocaleDateString('es-ES'),
        fecha_envio: new Date(campaign.updated_at).toLocaleDateString('es-ES')
      };

      // Obtener destinatarios de la campaña
      const tableName = type === 'gmail' ? 'gmail_campaign_recipients' : 'email_campaign_recipients';
      const { data: recipients, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('campaign_id', campaign.id);

      if (error) {
        console.error('Error obteniendo destinatarios:', error);
        toast.error('Error al obtener información de destinatarios');
        return;
      }

      // Preparar información de destinatarios
      const destinatariosInfo = recipients?.map(r => ({
        email: r.email,
        nombre: r.nombre,
        empresa: r.empresa,
        estado_envio: r.estado_envio || 'enviado',
        fecha_envio: r.fecha_envio ? new Date(r.fecha_envio).toLocaleDateString('es-ES') : 'N/A'
      })) || [];

      // Guardar información para el modal
      setCampaignInfo(campaignInfo);
      setCampaignRecipients(destinatariosInfo);
      setShowCampaignModal(true);

    } catch (error) {
      console.error('Error obteniendo información de envío:', error);
      toast.error('Error al obtener información de la campaña');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-slate-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 font-medium">Cargando sistema de correos...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 max-w-full mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-extrabold text-cyan-800 flex items-center gap-2 mb-2">
            <Mail className="w-8 h-8 text-cyan-600" />
            Correos Masivos
          </h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-cyan-100/60 p-1 rounded-lg">
            <TabsTrigger
              value="campanas"
              className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
            >
              Campañas Recientes
            </TabsTrigger>
            <TabsTrigger
              value="nueva"
              className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
            >
              Nueva Campaña
            </TabsTrigger>
          </TabsList>

          {/* Tab de Campañas Recientes */}
          <TabsContent value="campanas" className="mt-6">
            <div className="bg-white rounded-lg border">
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                    <Users className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <span className="text-lg font-semibold text-gray-700">CAMPAÑAS RECIENTES</span>
                    <p className="text-xs text-gray-500 mt-1">Ordenadas por fecha (más recientes primero)</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-6">
                  {/* Campañas ordenadas por fecha descendente (más recientes primero) */}
                  {/* Campañas de Gmail */}
                  {gmailCampaigns.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                        <Mail className="h-5 w-5 text-cyan-600" />
                        <span>Campañas de Gmail</span>
                      </h3>
                      <div className="space-y-3">
                        {gmailCampaigns.map((campaign) => (
                          <div 
                            key={`gmail-${campaign.id}`} 
                            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm bg-white transition-all duration-200 cursor-pointer group"
                            onClick={() => handleViewCampaignSentInfo(campaign, 'gmail')}
                            title="Click para ver detalles de la campaña"
                          >
                            <div className="flex items-center space-x-4">
                              <div className="p-2 bg-gray-100 rounded-lg">
                                {getEstadoIcon(campaign.estado)}
                              </div>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <h3 className="font-semibold text-gray-900">{campaign.nombre}</h3>
                                  <Badge variant="outline" className="text-xs bg-cyan-100 text-cyan-700 border-cyan-200">
                                    Gmail
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600">{campaign.asunto_personalizado}</p>
                                <div className="flex items-center space-x-4 mt-1">
                                  <Badge className={`${getEstadoColor(campaign.estado)} font-medium`}>
                                    {campaign.estado}
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100 cursor-default">
                                    {campaign.tipo_destinatario}
                                  </Badge>
                                  <span className="text-xs text-gray-500">
                                    {campaign.enviados_count}/{campaign.destinatarios_count} enviados
                                  </span>
                                  <div className="flex items-center space-x-1 text-xs text-gray-500" title="Fecha de creación de la campaña">
                                    <Calendar className="w-3 h-3" />
                                    <span>{new Date(campaign.created_at).toLocaleDateString('es-ES', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="text-xs text-gray-400 group-hover:text-gray-600 transition-colors">
                                Click para ver detalles
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewCampaignSentInfo(campaign, 'gmail');
                                }}
                                title="Ver qué se envió y a quién"
                                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {gmailCampaigns.length > 0 && campaigns.length > 0 && (
                    <hr className="border-gray-300" />
                  )}

                  {/* Campañas regulares */}
                  {campaigns.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                        <Megaphone className="h-5 w-5 text-purple-600" />
                        <span>Campañas Regulares</span>
                      </h3>
                      <div className="space-y-3">
                        {campaigns.map((campaign) => (
                          <div 
                            key={campaign.id} 
                            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm bg-white transition-all duration-200 cursor-pointer group"
                            onClick={() => handleViewCampaignSentInfo(campaign, 'email')}
                            title="Click para ver detalles de la campaña"
                          >
                            <div className="flex items-center space-x-4">
                              <div className="p-2 bg-gray-100 rounded-lg">
                                {getEstadoIcon(campaign.estado)}
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">{campaign.nombre}</h3>
                                <p className="text-sm text-gray-600">{campaign.asunto_personalizado}</p>
                                <div className="flex items-center space-x-4 mt-1">
                                  <Badge className={`${getEstadoColor(campaign.estado)} font-medium`}>
                                    {campaign.estado}
                                  </Badge>
                                  <span className="text-xs text-gray-500">
                                    {campaign.enviados_count}/{campaign.destinatarios_count} enviados
                                  </span>
                                  <div className="flex items-center space-x-1 text-xs text-gray-500" title="Fecha de creación de la campaña">
                                    <Calendar className="w-3 h-3" />
                                    <span>{new Date(campaign.created_at).toLocaleDateString('es-ES', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="text-xs text-gray-400 group-hover:text-gray-600 transition-colors">
                                Click para ver detalles
                              </div>
                                                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewCampaignSentInfo(campaign, 'email');
                                }}
                                title="Ver qué se envió y a quién"
                                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mensaje cuando no hay campañas */}
                  {campaigns.length === 0 && gmailCampaigns.length === 0 && (
                    <div className="text-center py-12">
                      <Mail className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 font-medium">No hay campañas creadas aún</p>
                      <p className="text-gray-500 text-sm mt-2">Crea tu primera campaña para comenzar</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab de Nueva Campaña */}
          <TabsContent value="nueva" className="mt-6">
            <div className="bg-white rounded-lg border">
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                    <Send className="w-5 h-5 text-orange-600" />
                  </div>
                  <span className="text-lg font-semibold text-gray-700">NUEVA CAMPAÑA</span>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                  {/* Panel izquierdo - Configuración */}
                  <div className="xl:col-span-1 space-y-6">
                    {/* Selector de Plantillas */}
                    <Card className="shadow-sm border border-gray-200 bg-white">
                      <CardHeader className="bg-cyan-600 text-white rounded-t-lg">
                        <CardTitle className="flex items-center space-x-3 text-lg">
                          <Megaphone className="h-5 w-5" />
                          <span>Plantilla</span>
                        </CardTitle>
                        <CardDescription className="text-cyan-100">
                          Selecciona la plantilla base
                        </CardDescription>
                      </CardHeader>
               <CardContent className="p-6">
                 <div className="space-y-4">
                   <div>
                     <Label htmlFor="template-select" className="text-sm font-medium text-gray-700">
                       Plantilla
                     </Label>
                     <Select
                       value={selectedTemplate?.id?.toString() || ''}
                                               onValueChange={(value) => {
                          if (value === 'estandar') {
                            // Plantilla estándar con contenido básico
                            setSelectedTemplate({
                              id: 0,
                              nombre: 'Plantilla Estándar',
                              asunto: 'Mensaje de RH Compensamos',
                              contenido_html: '',
                              variables: ['nombre', 'email', 'empresa', 'fecha', 'contraseña'],
                              activo: true,
                              created_at: '',
                              updated_at: ''
                            });
                            setCampaignData(prev => ({
                              ...prev,
                              asunto: 'Mensaje de RH Compensamos',
                              contenido: 'Hola {{nombre}},\n\nEsperamos que este mensaje te encuentre bien.\n\nSaludos,\nEl equipo de RH Compensamos'
                            }));
                          } else if (value === 'cero') {
                            // Plantilla de cero
                            setSelectedTemplate({
                              id: -1,
                              nombre: 'De Cero',
                              asunto: '',
                              contenido_html: '',
                              variables: ['nombre', 'email', 'empresa', 'fecha', 'contraseña'],
                              activo: true,
                              created_at: '',
                              updated_at: ''
                            });
                            setCampaignData(prev => ({
                              ...prev,
                              asunto: '',
                              contenido: ''
                            }));
                          } else if (value.startsWith('gmail-')) {
                            // Plantilla de Gmail
                            const gmailTemplateId = parseInt(value.replace('gmail-', ''));
                            const gmailTemplate = gmailTemplates.find(t => t.id === gmailTemplateId);
                            if (gmailTemplate) {
                              setSelectedTemplate(gmailTemplate);
                              const textoSimple = htmlToText(gmailTemplate.contenido_html);
                              setCampaignData(prev => ({
                                ...prev,
                                asunto: gmailTemplate.asunto,
                                contenido: textoSimple
                              }));
                            }
                          } else {
                            // Plantilla regular de la base de datos
                            handleTemplateSelect(value);
                          }
                        }}
                     >
                       <SelectTrigger className="w-full">
                         <SelectValue placeholder="Selecciona una plantilla" />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="estandar">
                           <div className="flex items-center space-x-2">
                             <Megaphone className="h-4 w-4" />
                             <span>Plantilla Estándar</span>
                           </div>
                         </SelectItem>
                         <SelectItem value="cero">
                           <div className="flex items-center space-x-2">
                             <Plus className="h-4 w-4" />
                             <span>De Cero</span>
                           </div>
                         </SelectItem>
                         <Separator />
                         {/* Plantillas de Gmail filtradas por destinatario */}
                         {gmailTemplates
                           .filter(template => 
                             template.tipo_destinatario === selectedDestinatarios || 
                             template.tipo_destinatario === 'ambos'
                           )
                           .map((template) => (
                             <SelectItem key={`gmail-${template.id}`} value={`gmail-${template.id}`}>
                               <div className="flex items-center space-x-2">
                                 <Mail className="h-4 w-4" />
                                 <span>{template.nombre}</span>
                                 <Badge variant="outline" className="text-xs">Gmail</Badge>
                               </div>
                             </SelectItem>
                           ))}
                         <Separator />
                         {/* Plantillas regulares */}
                         {templates.map((template) => (
                           <SelectItem key={template.id} value={template.id.toString()}>
                             <div className="flex items-center space-x-2">
                               <Megaphone className="h-4 w-4" />
                               <span>{template.nombre}</span>
                             </div>
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>
                   
                   {selectedTemplate && (
                                         <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-slate-900">{selectedTemplate.nombre}</h4>
                        <Badge variant="secondary" className="text-xs bg-slate-200 text-slate-700">
                          {selectedTemplate.variables.length} variables
                        </Badge>
                      </div>
                      {selectedTemplate.asunto && (
                        <p className="text-sm text-slate-600">
                          <strong>Asunto:</strong> {selectedTemplate.asunto}
                        </p>
                      )}
                    </div>
                   )}
                 </div>
               </CardContent>
             </Card>

                    {/* Selección de Destinatarios */}
                    <Card className="shadow-sm border border-gray-200 bg-white">
                      <CardHeader className="bg-cyan-600 text-white rounded-t-lg">
                        <CardTitle className="flex items-center space-x-3 text-lg">
                          <Users className="h-5 w-5" />
                          <span>Destinatarios</span>
                        </CardTitle>
                        <CardDescription className="text-cyan-100">
                          Define tu audiencia objetivo
                        </CardDescription>
                      </CardHeader>
               <CardContent className="p-6">
                 <div className="space-y-4">
                   <div>
                     <Label htmlFor="destinatarios-select" className="text-sm font-medium text-gray-700">
                       Tipo de Destinatarios
                     </Label>
                     <Select
                       value={selectedDestinatarios}
                       onValueChange={(value) => setSelectedDestinatarios(value as 'candidatos' | 'empleadores' | 'ambos')}
                     >
                       <SelectTrigger className="w-full">
                         <SelectValue placeholder="Selecciona destinatarios" />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="candidatos">
                           <div className="flex items-center space-x-2">
                             <User className="h-4 w-4" />
                             <span>Candidatos</span>
                           </div>
                         </SelectItem>
                         <SelectItem value="empleadores">
                           <div className="flex items-center space-x-2">
                             <Building className="h-4 w-4" />
                             <span>Empleadores</span>
                           </div>
                         </SelectItem>
                         <SelectItem value="ambos">
                           <div className="flex items-center space-x-2">
                             <Users className="h-4 w-4" />
                             <span>Ambos</span>
                           </div>
                         </SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                   
                                       <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-center space-x-3 mb-2">
                        <Users className="h-4 w-4 text-slate-600" />
                        <span className="text-sm font-semibold text-slate-900">
                          {selectedDestinatarios === 'candidatos' ? 'Candidatos' :
                           selectedDestinatarios === 'empleadores' ? 'Empleadores' : 'Candidatos y Empleadores'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        {selectedDestinatarios === 'candidatos' ? 'Personas buscando empleo' :
                         selectedDestinatarios === 'empleadores' ? 'Empresas buscando talento' : 
                         'Todos los usuarios registrados'}
                      </p>
                    </div>

                   {/* Tipo de Selección */}
                   <div>
                     <Label className="text-sm font-medium text-gray-700">
                       Tipo de Selección
                     </Label>
                     <div className="flex flex-wrap gap-2 mt-2">
                       <Button
                         variant={selectionType === 'todos' ? 'default' : 'outline'}
                         size="sm"
                         onClick={() => setSelectionType('todos')}
                         className={selectionType === 'todos' ? 'bg-teal-400 hover:bg-teal-500 text-white' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}
                       >
                         Todos
                       </Button>
                       <Button
                         variant={selectionType === 'especificos' ? 'default' : 'outline'}
                         size="sm"
                         onClick={() => setSelectionType('especificos')}
                         className={selectionType === 'especificos' ? 'bg-teal-400 hover:bg-teal-500 text-white' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}
                       >
                         Específicos
                       </Button>
                     </div>
                   </div>

                   {/* Selección Específica de Destinatarios */}
                   {selectionType === 'especificos' && (
                     <div className="space-y-3">
                       <div className="flex items-center justify-between">
                         <Label className="text-sm font-medium text-gray-700">
                           Destinatarios Específicos
                         </Label>
                         <div className="flex items-center space-x-2">
                           {selectedRecipients.length > 0 && (
                             <Badge variant="secondary" className="text-xs">
                               {selectedRecipients.length} seleccionado{selectedRecipients.length !== 1 ? 's' : ''}
                             </Badge>
                           )}
                           <div className="flex flex-wrap gap-2">
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={handleSelectAllRecipients}
                               className="border-gray-300 text-gray-700 hover:bg-gray-50"
                             >
                               Seleccionar Todos
                             </Button>
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={handleDeselectAllRecipients}
                               className="border-gray-300 text-gray-700 hover:bg-gray-50"
                             >
                               Deseleccionar
                             </Button>
                           </div>
                         </div>
                       </div>
                       
                       <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2">
                         {loadingDestinatarios ? (
                           <div className="flex items-center justify-center py-8">
                             <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-600"></div>
                             <span className="ml-2 text-sm text-gray-600">Cargando destinatarios...</span>
                           </div>
                         ) : getFilteredRecipients().length === 0 ? (
                           <p className="text-sm text-gray-500 text-center py-4">
                             No hay destinatarios disponibles para este tipo
                           </p>
                         ) : (
                           <div className="space-y-2">
                             {getFilteredRecipients().map((recipient) => (
                               <div
                                 key={recipient.id}
                                 className={`flex items-center space-x-3 p-2 rounded cursor-pointer transition-colors ${
                                   selectedRecipients.includes(recipient.id)
                                     ? 'bg-cyan-100 border border-cyan-300'
                                     : 'bg-gray-50 hover:bg-gray-100'
                                 }`}
                                 onClick={() => handleRecipientToggle(recipient.id)}
                               >
                                 <input
                                   type="checkbox"
                                   checked={selectedRecipients.includes(recipient.id)}
                                   onChange={() => handleRecipientToggle(recipient.id)}
                                   className="rounded"
                                 />
                                 <div className="flex-1 min-w-0">
                                   <div className="flex items-center space-x-2">
                                     <span className="text-sm font-medium text-gray-900 truncate">
                                       {recipient.nombre}
                                     </span>
                                     <Badge variant="outline" className="text-xs">
                                       {recipient.tipo}
                                     </Badge>
                                   </div>
                                   <p className="text-xs text-gray-600 truncate">
                                     {recipient.email}
                                   </p>
                                   {recipient.empresa && (
                                     <p className="text-xs text-gray-500 truncate">
                                       {recipient.empresa}
                                     </p>
                                   )}
                                 </div>
                               </div>
                             ))}
                           </div>
                         )}
                       </div>
                       
                       {selectedRecipients.length > 0 && (
                         <div className="p-2 bg-brand-lime/10 rounded border border-brand-lime/20">
                           <p className="text-xs text-brand-lime">
                             <strong>{selectedRecipients.length}</strong> destinatario(s) seleccionado(s)
                           </p>
                         </div>
                       )}
                     </div>
                   )}
                 </div>
               </CardContent>
             </Card>


          </div>

                  {/* Panel central - Editor de campaña */}
                  <div className="xl:col-span-3 space-y-6">
                    <Card className="shadow-sm border border-gray-200 bg-white">
                      <CardHeader className="bg-cyan-600 text-white rounded-t-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="flex items-center space-x-3 text-xl">
                              <Send className="h-6 w-6" />
                              <span>Editor de Campaña</span>
                            </CardTitle>
                            <CardDescription className="text-cyan-100">
                              {selectedTemplate ? 
                                selectedTemplate.id === 0 ? 'Plantilla estándar seleccionada' :
                                selectedTemplate.id === -1 ? 'Crear contenido personalizado' :
                                `Plantilla: ${selectedTemplate.nombre}` 
                                : 'Selecciona una plantilla para comenzar'}
                              {isDragging && (
                                <span className="ml-2 text-cyan-200">• Arrastra variables aquí</span>
                              )}
                            </CardDescription>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPreviewMode(!previewMode)}
                              className="border-cyan-300 text-cyan-100 hover:bg-cyan-500 hover:text-white"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              {previewMode ? 'Editar' : 'Vista Previa'}
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Información básica */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                         <div>
                       <Label htmlFor="nombre" className="text-sm font-semibold text-slate-700">
                         Nombre de la Campaña
                       </Label>
                       <Input
                         id="nombre"
                         value={campaignData.nombre}
                         onChange={(e) => setCampaignData(prev => ({ ...prev, nombre: e.target.value }))}
                         placeholder="Ej: Bienvenida nuevos usuarios"
                         className="mt-2 border-slate-300 focus:border-slate-500 focus:ring-slate-500"
                       />
                     </div>
                     <div>
                       <Label htmlFor="asunto" className="text-sm font-semibold text-slate-700">
                         Asunto del Correo
                       </Label>
                       <Input
                         id="asunto"
                         value={campaignData.asunto}
                         onChange={(e) => setCampaignData(prev => ({ ...prev, asunto: e.target.value }))}
                         placeholder="Asunto del correo"
                         className="mt-2 border-slate-300 focus:border-slate-500 focus:ring-slate-500"
                       />
                     </div>
                  </div>

                  {/* Editor de contenido */}
                                     <div>
                     <Label htmlFor="contenido" className="text-sm font-semibold text-slate-700">
                       Contenido del Correo
                     </Label>
                                         {previewMode ? (
                                               <div className="mt-2 p-6 border border-slate-200 rounded-lg bg-slate-50 max-h-96 overflow-y-auto">
                          <div className="prose prose-sm max-w-none">
                            <h3 className="text-lg font-semibold text-slate-900 mb-4">Vista Previa del Correo</h3>
                           
                           {/* Botones de tipo de vista */}
                           <div className="flex space-x-2 mb-4">
                             <Button
                               variant={!showHtmlPreview ? "default" : "outline"}
                               size="sm"
                               onClick={() => setShowHtmlPreview(false)}
                               className={!showHtmlPreview ? 'bg-teal-400 hover:bg-teal-500 text-white' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}
                             >
                               <Megaphone className="h-4 w-4 mr-2" />
                               Vista Texto
                             </Button>
                             <Button
                               variant={showHtmlPreview ? "default" : "outline"}
                               size="sm"
                               onClick={() => setShowHtmlPreview(true)}
                               className={showHtmlPreview ? 'bg-teal-400 hover:bg-teal-500 text-white' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}
                             >
                               <Code className="h-4 w-4 mr-2" />
                               Vista HTML
                             </Button>
                           </div>
                           
                                                      <div className="bg-white p-4 rounded border">
                             <p className="text-sm text-gray-600 mb-2">
                               <strong>Asunto:</strong> {campaignData.asunto}
                             </p>
                             <div className="border-t pt-4">
                                 {showHtmlPreview ? (
                                   <div className="text-sm">
                                     {procesarVariablesConEtiquetas(textToHtml(campaignData.contenido))}
                                   </div>
                                 ) : (
                                   <div className="whitespace-pre-wrap text-sm text-gray-800 font-sans">
                                     {procesarVariablesConEtiquetas(campaignData.contenido)}
                                   </div>
                                 )}
                             </div>
                           </div>
                         </div>
                       </div>
                     ) : (
                                             <div className="mt-2">
                         <div className="flex space-x-2 mb-2">
                           <Button
                             type="button"
                             variant="outline"
                             size="sm"
                             onClick={() => {
                               const textarea = document.getElementById('contenido') as HTMLTextAreaElement;
                               if (textarea) {
                                 const start = textarea.selectionStart;
                                 const end = textarea.selectionEnd;
                                 const text = textarea.value;
                                 const before = text.substring(0, start);
                                 const after = text.substring(end);
                                 textarea.value = before + '\n\nSaludos,\nEl equipo de RH Compensamos' + after;
                                 textarea.focus();
                                 setCampaignData(prev => ({ ...prev, contenido: textarea.value }));
                               }
                             }}
                             className="border-gray-300 text-gray-700 hover:bg-gray-50"
                           >
                             Agregar Saludo
                           </Button>
                           <Button
                             type="button"
                             variant="outline"
                             size="sm"
                             onClick={() => {
                               const textarea = document.getElementById('contenido') as HTMLTextAreaElement;
                               if (textarea) {
                                 const start = textarea.selectionStart;
                                 const end = textarea.selectionEnd;
                                 const text = textarea.value;
                                 const before = text.substring(0, start);
                                 const after = text.substring(end);
                                 textarea.value = before + '\n\nSi tienes alguna pregunta, no dudes en contactarnos.' + after;
                                 textarea.focus();
                                 setCampaignData(prev => ({ ...prev, contenido: textarea.value }));
                               }
                             }}
                             className="border-gray-300 text-gray-700 hover:bg-gray-50"
                           >
                             Agregar Cierre
                           </Button>
                         </div>
                                                                                <div 
                              className={`mt-2 border-2 border-dashed rounded-lg transition-all duration-200 relative ${
                                isDragging 
                                  ? 'border-cyan-400 bg-cyan-50 shadow-lg' 
                                  : 'border-slate-300 hover:border-slate-400'
                              }`}
                              onDragOver={handleDragOver}
                              onDrop={handleDrop}
                            >
                              <Textarea
                                id="contenido"
                                value={campaignData.contenido}
                                onChange={(e) => setCampaignData(prev => ({ ...prev, contenido: e.target.value }))}
                                placeholder="Escribe el contenido de tu correo aquí... Arrastra las variables desde el panel lateral"
                                className="min-h-[300px] text-sm border-0 focus:ring-0 bg-transparent resize-none"
                                rows={15}
                              />
                              {isDragging && (
                                <div className="absolute inset-0 flex items-center justify-center bg-cyan-50 bg-opacity-50 rounded-lg pointer-events-none">
<div className="bg-cyan-600 text-white px-4 py-2 rounded-lg shadow-lg">
                                    <span className="font-medium">Suelta aquí para insertar: {`{{${draggedVariable}}}`}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                                                         <div className="flex items-center justify-between mt-2">
                               <p className="text-xs text-slate-500">
                                 💡 Tip: Escribe tu mensaje normalmente. El sistema automáticamente lo formateará como HTML.
                               </p>
                               {isDragging && (
                                 <div className="flex items-center space-x-2">
                                   <div className="animate-pulse">
                                     <Badge variant="secondary" className="bg-cyan-100 text-cyan-700">
                                       Arrastrando: {`{{${draggedVariable}}}`}
                                     </Badge>
                                   </div>
                                 </div>
                               )}
                             </div>
                       </div>
                    )}
                  </div>

                  {/* Variables siempre visibles */}
                  <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center space-x-2">
                      <Code className="h-4 w-4" />
                      <span>Variables Disponibles</span>
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { name: 'nombre', description: 'Nombre del usuario' },
                        { name: 'email', description: 'Email del usuario' },
                        { name: 'empresa', description: 'Nombre de la empresa' },
                        { name: 'fecha', description: 'Fecha actual' },
                        { name: 'contraseña', description: 'Contraseña temporal' }
                      ].map((variable) => (
                        <div 
                          key={variable.name} 
                          className={`flex items-center justify-between p-2 rounded-lg border transition-all duration-200 cursor-grab active:cursor-grabbing ${
                            isDragging && draggedVariable === variable.name
                              ? 'bg-cyan-100 border-cyan-300 shadow-lg scale-105'
                              : 'bg-white border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                          }`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, variable.name)}
                          onDragEnd={handleDragEnd}
                        >
                          <div className="flex items-center space-x-2">
                            <GripVertical className="h-3 w-3 text-slate-400" />
                            <div>
                              <span className="font-mono text-xs text-slate-800">{`{{${variable.name}}}`}</span>
                              <p className="text-xs text-slate-600">{variable.description}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-700 hover:bg-slate-200 h-6 px-2"
                            onClick={() => {
                             const textarea = document.getElementById('contenido') as HTMLTextAreaElement;
                             if (textarea) {
                               const start = textarea.selectionStart;
                               const end = textarea.selectionEnd;
                               const text = textarea.value;
                               const before = text.substring(0, start);
                               const after = text.substring(end);
                               textarea.value = before + `{{${variable.name}}}` + after;
                               textarea.focus();
                               textarea.setSelectionRange(start + variable.name.length + 4, start + variable.name.length + 4);
                             }
                           }}
                          >
                            +
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                    <Button 
                      variant="outline" 
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                      onClick={() => {
                        console.log('Abriendo modal de guardar plantilla...');
                        console.log('Estado actual de campaignData:', campaignData);
                        setShowSaveTemplateModal(true);
                      }}
                    >
                      <Megaphone className="h-4 w-4 mr-2" />
                      Guardar Plantilla
                    </Button>
                    <Button 
                      variant="outline" 
                      className="border-red-300 text-red-700 hover:bg-red-50"
                      onClick={async () => {
                        console.log('Ejecutando verificación de tablas...');
                        await checkTables();
                        toast.info('Verificación completada. Revisa la consola para detalles.');
                      }}
                    >
                      <Code className="h-4 w-4 mr-2" />
                      Verificar Tablas
                    </Button>
                    <Button 
                      onClick={async () => {
                         if (!campaignData.nombre.trim()) {
                           toast.error('Ingresa un nombre para la campaña');
                           return;
                         }
                         
                         if (!campaignData.asunto.trim()) {
                           toast.error('Ingresa un asunto para la campaña');
                           return;
                         }
                         
                         if (!campaignData.contenido.trim()) {
                           toast.error('Ingresa contenido para la campaña');
                           return;
                         }
                         
                         if (selectionType === 'especificos' && selectedRecipients.length === 0) {
                           toast.error('Selecciona al menos un destinatario');
                           return;
                         }
                         
                         try {
                           const contenidoHtml = textToHtml(campaignData.contenido);
                           
                           // Validar que se haya seleccionado una plantilla
                           if (!selectedTemplate) {
                             toast.error('Selecciona una plantilla primero');
                             return;
                           }
                           
                           // Determinar si es una plantilla de Gmail
                           const isGmailTemplate = 'tipo_destinatario' in selectedTemplate;
                           
                           if (isGmailTemplate) {
                             // Crear campaña de Gmail
                             const { data: newCampaignData, error: campaignError } = await supabase
                               .from('gmail_campaigns')
                               .insert({
                                 nombre: campaignData.nombre,
                                 template_id: selectedTemplate.id,
                                 asunto_personalizado: campaignData.asunto,
                                 contenido_personalizado: contenidoHtml,
                                 tipo_destinatario: selectedDestinatarios,
                                 estado: 'borrador',
                                 destinatarios_count: selectionType === 'todos' ? getFilteredRecipients().length : selectedRecipients.length,
                                 enviados_count: 0
                               })
                               .select()
                               .single();
                             
                             if (campaignError) throw campaignError;
                             
                             // Guardar selección de destinatarios
                             if (newCampaignData) {
                               const { error: selectionError } = await supabase
                                 .from('campaign_recipient_selection')
                                 .insert({
                                   campaign_id: newCampaignData.id,
                                   campaign_type: 'gmail',
                                   selection_type: selectionType,
                                   destinatarios_ids: selectionType === 'especificos' ? selectedRecipients : []
                                 });
                               
                               if (selectionError) throw selectionError;
                             }
                             
                             // Enviar correos automáticamente
                             const destinatariosAEnviar = selectionType === 'todos' 
                               ? getFilteredRecipients() 
                               : recipients.filter(r => selectedRecipients.includes(r.id));
                             
                             console.log('🚀 Iniciando envío automático de correos...');
                             await enviarCorreos(
                               destinatariosAEnviar,
                               campaignData.asunto,
                               contenidoHtml,
                               newCampaignData.id,
                               'gmail'
                             );
                             
                             toast.success('Campaña de Gmail creada y enviada exitosamente');
                             setCampaignData({
                               nombre: '',
                               asunto: '',
                               contenido: '',
                               destinatarios: []
                             });
                             setSelectedTemplate(null);
                             setSelectedRecipients([]);
                             setSelectionType('todos');
                             cargarGmailCampaigns();
                           } else {
                             // Determinar el template_id basado en el tipo de plantilla
                             let templateId: number | null = selectedTemplate?.id || null;
                             if (selectedTemplate?.id === 0 || selectedTemplate?.id === -1) {
                               templateId = null;
                             }
                             
                             // Crear campaña regular
                             const { data: newCampaignData2, error: campaignError } = await supabase
                               .from('email_campaigns')
                               .insert({
                                 nombre: campaignData.nombre,
                                 template_id: templateId,
                                 asunto_personalizado: campaignData.asunto,
                                 contenido_personalizado: contenidoHtml,
                                 estado: 'borrador',
                                 destinatarios_count: selectionType === 'todos' ? getFilteredRecipients().length : selectedRecipients.length,
                                 enviados_count: 0
                               })
                               .select()
                               .single();
                             
                             if (campaignError) throw campaignError;
                             
                             // Guardar selección de destinatarios
                             if (newCampaignData2) {
                               const { error: selectionError } = await supabase
                                 .from('campaign_recipient_selection')
                                 .insert({
                                   campaign_id: newCampaignData2.id,
                                   campaign_type: 'email',
                                   selection_type: selectionType,
                                   destinatarios_ids: selectionType === 'especificos' ? selectedRecipients : []
                                 });
                               
                               if (selectionError) throw selectionError;
                             }
                             
                             // Enviar correos automáticamente
                             const destinatariosAEnviar = selectionType === 'todos' 
                               ? getFilteredRecipients() 
                               : recipients.filter(r => selectedRecipients.includes(r.id));
                             
                             console.log('🚀 Iniciando envío automático de correos...');
                             await enviarCorreos(
                               destinatariosAEnviar,
                               campaignData.asunto,
                               contenidoHtml,
                               newCampaignData2.id,
                               'email'
                             );
                             
                             toast.success('Campaña creada y enviada exitosamente');
                             setCampaignData({
                               nombre: '',
                               asunto: '',
                               contenido: '',
                               destinatarios: []
                             });
                             setSelectedTemplate(null);
                             setSelectedRecipients([]);
                             setSelectionType('todos');
                             cargarCampaigns();
                           }
                           
                           toast.success('Campaña creada exitosamente');
                           setCampaignData({
                             nombre: '',
                             asunto: '',
                             contenido: '',
                             destinatarios: []
                           });
                           setSelectedTemplate(null);
                           cargarCampaigns();
                         } catch (error) {
                           console.error('Error creando campaña:', error);
                           toast.error('Error al crear la campaña');
                         }
                       }}
                       disabled={enviandoCorreos}
                       className="bg-teal-400 hover:bg-teal-500 text-white"
                     >
                       {enviandoCorreos ? (
                         <>
                           <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                           Enviando Correos...
                         </>
                       ) : (
                         <>
                           <Send className="h-4 w-4 mr-2" />
                           Crear y Enviar Campaña
                         </>
                       )}
                     </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    
    {/* Modal para guardar plantilla */}
    {showSaveTemplateModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Guardar Plantilla
          </h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="template-name" className="text-sm font-medium text-slate-700">
                Nombre de la Plantilla
              </Label>
              <Input
                id="template-name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Ej: Bienvenida Candidatos"
                className="mt-2 border-slate-300 focus:border-slate-500 focus:ring-slate-500"
              />
            </div>
            <div className="text-sm text-slate-600">
              <p><strong>Asunto:</strong> {campaignData.asunto}</p>
              <p><strong>Tipo:</strong> {selectedDestinatarios === 'candidatos' ? 'Candidatos' : 
                                         selectedDestinatarios === 'empleadores' ? 'Empleadores' : 'Ambos'}</p>
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowSaveTemplateModal(false);
                setTemplateName('');
              }}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveTemplate}
              className="bg-teal-400 hover:bg-teal-500 text-white"
            >
              Guardar Plantilla
            </Button>
          </div>
        </div>
      </div>
    )}

    {/* Modal para ver información de campaña enviada */}
    <Dialog open={showCampaignModal} onOpenChange={setShowCampaignModal}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            Información de Campaña Enviada
          </DialogTitle>
          <DialogDescription>
            Detalles del mensaje enviado y lista de destinatarios
          </DialogDescription>
        </DialogHeader>
        
        {campaignInfo && (
          <div className="space-y-6">
            {/* Información de la campaña */}
            <div className="bg-slate-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg text-slate-900 mb-3">
                {campaignInfo.nombre}
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-slate-700">Asunto:</span>
                  <p className="text-slate-600 mt-1">{campaignInfo.asunto}</p>
                </div>
                <div>
                  <span className="font-medium text-slate-700">Estado:</span>
                  <Badge className={`mt-1 ${getEstadoColor(campaignInfo.estado)}`}>
                    {campaignInfo.estado}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium text-slate-700">Enviados:</span>
                  <p className="text-slate-600 mt-1">
                    {campaignInfo.enviados} de {campaignInfo.total_destinatarios}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-slate-700">Fecha de envío:</span>
                  <p className="text-slate-600 mt-1">{campaignInfo.fecha_envio}</p>
                </div>
              </div>
            </div>

            {/* Contenido del mensaje */}
            <div>
              <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Megaphone className="h-4 w-4" />
                Mensaje Enviado
              </h4>
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                  {htmlToPlainText(campaignInfo.contenido)}
                </div>
              </div>
            </div>

            {/* Lista de destinatarios */}
            <div>
              <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Destinatarios ({campaignRecipients.length})
              </h4>
              <div className="bg-white border border-slate-200 rounded-lg max-h-60 overflow-y-auto">
                {campaignRecipients.length > 0 ? (
                  <div className="divide-y divide-slate-200">
                    {campaignRecipients.map((recipient, index) => (
                      <div key={index} className="p-3 hover:bg-slate-50">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-slate-900">
                              {recipient.nombre}
                            </p>
                            <p className="text-sm text-slate-600">
                              {recipient.email}
                            </p>
                            {recipient.empresa && (
                              <p className="text-xs text-slate-500 mt-1">
                                {recipient.empresa}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {recipient.estado_envio}
                            </Badge>
                            <span className="text-xs text-slate-500">
                              {recipient.fecha_envio}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-slate-500">
                    No hay destinatarios registrados para esta campaña
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-4">
          <Button
            onClick={() => setShowCampaignModal(false)}
            className="bg-teal-400 hover:bg-teal-500 text-white"
          >
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
} 
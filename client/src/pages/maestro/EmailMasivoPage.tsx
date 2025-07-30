import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Mail, 
  Users, 
  FileText, 
  Send, 
  Plus, 
  Edit3, 
  Eye, 
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  Building,
  Code,
  GripVertical
} from 'lucide-react';
import { supabase } from '@/services/supabaseClient';
import { emailTemplatesService } from '@/services/emailTemplatesService';
import { initDatabase } from '@/services/initDatabase';
import { checkTables } from '@/services/checkTables';
import { toast } from 'sonner';

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

export default function EmailMasivoPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [gmailTemplates, setGmailTemplates] = useState<GmailTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [gmailCampaigns, setGmailCampaigns] = useState<GmailCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | GmailTemplate | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [showHtmlPreview, setShowHtmlPreview] = useState(false);
  const [selectedDestinatarios, setSelectedDestinatarios] = useState<string>('candidatos');
  const [recipients, setRecipients] = useState<EmailRecipient[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<number[]>([]);
  const [selectionType, setSelectionType] = useState<'todos' | 'especificos'>('todos');
  const [isDragging, setIsDragging] = useState(false);
  const [draggedVariable, setDraggedVariable] = useState<string>('');
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
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
      const { data, error } = await supabase
        .from('email_recipients')
        .select('*')
        .eq('activo', true)
        .order('nombre');

      if (error) throw error;
      setRecipients(data || []);
    } catch (error) {
      console.error('Error cargando destinatarios:', error);
      toast.error('Error al cargar los destinatarios');
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
    return recipients.filter(r => {
      if (selectedDestinatarios === 'candidatos') return r.tipo === 'candidato';
      if (selectedDestinatarios === 'empleadores') return r.tipo === 'empleador';
      return true; // ambos
    });
  };

  // Limpiar selección cuando cambie el tipo de destinatarios
  useEffect(() => {
    setSelectedRecipients([]);
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
      case 'borrador': return 'bg-slate-100 text-slate-800';
      case 'enviando': return 'bg-blue-100 text-blue-800';
      case 'completada': return 'bg-emerald-100 text-emerald-800';
      case 'cancelada': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'borrador': return <FileText className="w-4 h-4" />;
      case 'enviando': return <Clock className="w-4 h-4" />;
      case 'completada': return <CheckCircle className="w-4 h-4" />;
      case 'cancelada': return <AlertCircle className="w-4 h-4" />;
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
            className="bg-blue-100 text-blue-800 border-blue-200 text-xs font-mono mx-1"
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
      <div className="min-h-screen bg-slate-50">
        <div className="container mx-auto p-8 space-y-8">
        {/* Header Corporativo */}
        <div className="text-center border-b border-slate-200 pb-8">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="p-4 bg-slate-800 rounded-xl shadow-lg">
              <Mail className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Sistema de Correos Masivos</h1>
              <p className="text-slate-600 text-lg mt-2">Gestión profesional de campañas de comunicación</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Panel izquierdo - Configuración */}
          <div className="xl:col-span-1 space-y-6">
                         {/* Selector de Plantillas */}
                           <Card className="shadow-lg border border-slate-200 bg-white">
                <CardHeader className="bg-slate-800 text-white rounded-t-lg">
                  <CardTitle className="flex items-center space-x-3 text-lg">
                    <FileText className="h-5 w-5" />
                    <span>Plantilla</span>
                  </CardTitle>
                  <CardDescription className="text-slate-300">
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
                             <FileText className="h-4 w-4" />
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
                               <FileText className="h-4 w-4" />
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
                           <Card className="shadow-lg border border-slate-200 bg-white">
                <CardHeader className="bg-slate-700 text-white rounded-t-lg">
                  <CardTitle className="flex items-center space-x-3 text-lg">
                    <Users className="h-5 w-5" />
                    <span>Destinatarios</span>
                  </CardTitle>
                  <CardDescription className="text-slate-300">
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
                       onValueChange={setSelectedDestinatarios}
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
                       >
                         Todos
                       </Button>
                       <Button
                         variant={selectionType === 'especificos' ? 'default' : 'outline'}
                         size="sm"
                         onClick={() => setSelectionType('especificos')}
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
                         <div className="flex flex-wrap gap-2">
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={handleSelectAllRecipients}
                           >
                             Seleccionar Todos
                           </Button>
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={handleDeselectAllRecipients}
                           >
                             Deseleccionar
                           </Button>
                         </div>
                       </div>
                       
                       <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2">
                         {getFilteredRecipients().length === 0 ? (
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
                                     ? 'bg-blue-100 border border-blue-300'
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
                         <div className="p-2 bg-green-50 rounded border border-green-200">
                           <p className="text-xs text-green-700">
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
            <Card className="shadow-lg border border-slate-200 bg-white">
              <CardHeader className="bg-slate-900 text-white rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-3 text-xl">
                      <Send className="h-6 w-6" />
                      <span>Nueva Campaña</span>
                    </CardTitle>
                                         <CardDescription className="text-slate-300">
                       {selectedTemplate ? 
                         selectedTemplate.id === 0 ? 'Plantilla estándar seleccionada' :
                         selectedTemplate.id === -1 ? 'Crear contenido personalizado' :
                         `Plantilla: ${selectedTemplate.nombre}` 
                         : 'Selecciona una plantilla para comenzar'}
                       {isDragging && (
                         <span className="ml-2 text-blue-300">• Arrastra variables aquí</span>
                       )}
                     </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewMode(!previewMode)}
                      className="border-slate-300 text-slate-300 hover:bg-slate-700"
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
                             >
                               <FileText className="h-4 w-4 mr-2" />
                               Vista Texto
                             </Button>
                             <Button
                               variant={showHtmlPreview ? "default" : "outline"}
                               size="sm"
                               onClick={() => setShowHtmlPreview(true)}
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
                           >
                             Agregar Cierre
                           </Button>
                         </div>
                                                                                <div 
                              className={`mt-2 border-2 border-dashed rounded-lg transition-all duration-200 relative ${
                                isDragging 
                                  ? 'border-blue-400 bg-blue-50 shadow-lg' 
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
                                <div className="absolute inset-0 flex items-center justify-center bg-blue-50 bg-opacity-50 rounded-lg pointer-events-none">
                                  <div className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
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
                                     <Badge variant="secondary" className="bg-blue-100 text-blue-700">
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
                              ? 'bg-blue-100 border-blue-300 shadow-lg scale-105'
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
                   <div className="flex justify-end space-x-4 pt-6 border-t border-slate-200">
                     <Button 
                       variant="outline" 
                       className="border-slate-300 text-slate-700 hover:bg-slate-50"
                       onClick={() => {
                         console.log('Abriendo modal de guardar plantilla...');
                         console.log('Estado actual de campaignData:', campaignData);
                         setShowSaveTemplateModal(true);
                       }}
                     >
                       <FileText className="h-4 w-4 mr-2" />
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
                       className="bg-slate-800 hover:bg-slate-900 text-white"
                       onClick={async () => {
                          if (!selectedTemplate) {
                            toast.error('Selecciona una plantilla primero');
                            return;
                          }
                          
                          if (!campaignData.nombre || !campaignData.asunto || !campaignData.contenido) {
                            toast.error('Completa todos los campos');
                            return;
                          }
                          
                          try {
                            // Convertir texto simple a HTML
                            const contenidoHtml = textToHtml(campaignData.contenido);
                            
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
                              
                              toast.success('Campaña de Gmail creada exitosamente');
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
                              let templateId = selectedTemplate.id;
                              if (selectedTemplate.id === 0 || selectedTemplate.id === -1) {
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
                              
                              toast.success('Campaña creada exitosamente');
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
                     >
                       <Send className="h-4 w-4 mr-2" />
                       Crear Campaña
                     </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

                 {/* Campañas recientes */}
                   <Card className="shadow-lg border border-slate-200 bg-white">
            <CardHeader className="bg-slate-800 text-white rounded-t-lg">
              <CardTitle className="flex items-center space-x-3 text-xl">
                <Users className="h-6 w-6" />
                <span>Campañas Recientes</span>
              </CardTitle>
              <CardDescription className="text-slate-300">
                Historial de campañas creadas
              </CardDescription>
            </CardHeader>
           <CardContent className="p-6">
             <div className="space-y-4">
               {/* Campañas de Gmail */}
               {gmailCampaigns.length > 0 && (
                 <div className="mb-6">
                   <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                     <Mail className="h-5 w-5 text-blue-600" />
                     <span>Campañas de Gmail</span>
                   </h3>
                   <div className="space-y-3">
                     {gmailCampaigns.map((campaign) => (
                                               <div key={`gmail-${campaign.id}`} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 bg-white">
                          <div className="flex items-center space-x-4">
                            <div className="p-2 bg-slate-100 rounded-lg">
                              {getEstadoIcon(campaign.estado)}
                            </div>
                           <div>
                             <div className="flex items-center space-x-2">
                               <h3 className="font-semibold text-gray-900">{campaign.nombre}</h3>
                               <Badge variant="outline" className="text-xs">Gmail</Badge>
                             </div>
                             <p className="text-sm text-gray-600">{campaign.asunto_personalizado}</p>
                             <div className="flex items-center space-x-4 mt-1">
                               <Badge className={getEstadoColor(campaign.estado)}>
                                 {campaign.estado}
                               </Badge>
                               <Badge variant="secondary" className="text-xs">
                                 {campaign.tipo_destinatario}
                               </Badge>
                               <span className="text-xs text-gray-500">
                                 {campaign.enviados_count}/{campaign.destinatarios_count} enviados
                               </span>
                             </div>
                           </div>
                         </div>
                         <div className="flex items-center space-x-2">
                           <Button variant="ghost" size="sm">
                             <Eye className="h-4 w-4" />
                           </Button>
                           <Button variant="ghost" size="sm">
                             <Edit3 className="h-4 w-4" />
                           </Button>
                           <Button variant="ghost" size="sm">
                             <Trash2 className="h-4 w-4" />
                           </Button>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               )}

               {/* Campañas regulares */}
               {campaigns.length > 0 && (
                 <div>
                   <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                     <FileText className="h-5 w-5 text-purple-600" />
                     <span>Campañas Regulares</span>
                   </h3>
                   <div className="space-y-3">
                     {campaigns.map((campaign) => (
                                               <div key={campaign.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 bg-white">
                          <div className="flex items-center space-x-4">
                            <div className="p-2 bg-slate-100 rounded-lg">
                              {getEstadoIcon(campaign.estado)}
                            </div>
                           <div>
                             <h3 className="font-semibold text-gray-900">{campaign.nombre}</h3>
                             <p className="text-sm text-gray-600">{campaign.asunto_personalizado}</p>
                             <div className="flex items-center space-x-4 mt-1">
                               <Badge className={getEstadoColor(campaign.estado)}>
                                 {campaign.estado}
                               </Badge>
                               <span className="text-xs text-gray-500">
                                 {campaign.enviados_count}/{campaign.destinatarios_count} enviados
                               </span>
                             </div>
                           </div>
                         </div>
                         <div className="flex items-center space-x-2">
                           <Button variant="ghost" size="sm">
                             <Eye className="h-4 w-4" />
                           </Button>
                           <Button variant="ghost" size="sm">
                             <Edit3 className="h-4 w-4" />
                           </Button>
                           <Button variant="ghost" size="sm">
                             <Trash2 className="h-4 w-4" />
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
                    <Mail className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600 font-medium">No hay campañas creadas aún</p>
                    <p className="text-slate-500 text-sm mt-2">Crea tu primera campaña para comenzar</p>
                  </div>
                )}
             </div>
           </CardContent>
         </Card>
      </div>
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
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveTemplate}
              className="bg-slate-800 hover:bg-slate-900 text-white"
            >
              Guardar Plantilla
            </Button>
          </div>
        </div>
      </div>
    )}
    </>
  );
} 
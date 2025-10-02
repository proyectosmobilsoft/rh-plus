import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  QrCode, 
  MessageSquare, 
  Mail, 
  Settings, 
  Download, 
  Send, 
  Search, 
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  FileText,
  Smartphone,
  AtSign,
  Check,
  CheckSquare,
  Square,
  Save,
  RefreshCw,
  X,
  Power,
  PowerOff
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { candidatosService, Candidato } from '@/services/candidatosService';
import { empresasService, Empresa } from '@/services/empresasService';
import { qrService, QRCodeData, QRConfiguracion } from '@/services/qrService';
import { whatsappService, WhatsAppMessage, WhatsAppResponse } from '@/services/whatsappService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLoading } from '@/contexts/LoadingContext';
import { emailService } from '@/services/emailService';

interface CandidatoConEmpresa extends Candidato {
  empresa_nombre?: string;
  qrGenerado?: boolean;
  fechaGeneracionQR?: string;
  qrData?: QRCodeData;
}

export default function QrPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { startLoading, stopLoading } = useLoading();
  
  // Estados para tabs
  const [activeTab, setActiveTab] = useState("generar");
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [empresaFilter, setEmpresaFilter] = useState<string>("all");
  const [estadoFilter, setEstadoFilter] = useState<string>("all");
  const [qrFilter, setQrFilter] = useState<string>("all");
  
  // Estados para selección múltiple
  const [selectedCandidatos, setSelectedCandidatos] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Estados para el modal de visualización QR
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedQRData, setSelectedQRData] = useState<QRCodeData | null>(null);
  const [selectedCandidatoData, setSelectedCandidatoData] = useState<CandidatoConEmpresa | null>(null);

  // Estados para configuración
  const [configuracion, setConfiguracion] = useState<QRConfiguracion>({
    periodo_renovacion: 30,
    tamanio_qr: 300,
    formato_imagen: 'PNG',
    calidad_imagen: 0.8,
    color_fondo: '#FFFFFF',
    color_qr: '#000000',
    margen: 4
  });

  // Estados para mensajes
  const [mensajeWhatsApp, setMensajeWhatsApp] = useState(`Hola {{nombre}},

Te informamos que tu código QR está listo para descargar.

Empresa: {{empresa}}
Documento: {{documento}}
Teléfono: {{telefono}}
Email: {{email}}

Por favor, escanea el código QR para acceder a tu información completa.

Saludos cordiales.`);
  
  const [selectedTemplate, setSelectedTemplate] = useState<string>('default');

  const [asuntoEmail, setAsuntoEmail] = useState('Tu código QR de certificación - empresa');
  const [mensajeEmail, setMensajeEmail] = useState(`Estimado/a nombre,

Nos complace informarte que tu código QR de certificación ha sido generado exitosamente.

Este código contiene tu información verificada y te permitirá acceder a las instalaciones de empresa de manera segura.

Información incluida:
- Nombre: nombre
- Cédula: cedula
- Email: email
- Empresa: empresa
- Fecha de generación: fecha

Atentamente,
Equipo de Recursos Humanos`);

  // Queries
  const { data: candidatos = [], isLoading, refetch } = useQuery({
    queryKey: ['candidatos-con-empresa-qr'],
    queryFn: async () => {
      startLoading();
      try {
        const candidatosData = await candidatosService.getAll();
        const empresasData = await empresasService.getAll();
        
        // Combinar datos de candidatos con información de empresa y QR
        const candidatosConEmpresa: CandidatoConEmpresa[] = await Promise.all(
          candidatosData.map(async (candidato) => {
            const empresa = empresasData.find(emp => emp.id === candidato.empresa_id);
            const qrData = await qrService.getQRByCandidato(candidato.id!);
            
            return {
              ...candidato,
              empresa_nombre: empresa?.razon_social || empresa?.razonSocial || 'Empresa no encontrada',
              qrGenerado: !!qrData && !qrService.isQRExpired(qrData),
              fechaGeneracionQR: qrData?.fecha_generacion,
              qrData: qrData || undefined
            };
          })
        );
        
        return candidatosConEmpresa;
      } finally {
        stopLoading();
      }
    },
    staleTime: 0,
    refetchOnWindowFocus: false
  });

  const { data: empresas = [] } = useQuery({
    queryKey: ['empresas'],
    queryFn: async () => {
      return await empresasService.getAll();
    },
    staleTime: 0,
    refetchOnWindowFocus: false
  });

  const { data: qrConfig } = useQuery({
    queryKey: ['qr-configuracion'],
    queryFn: async () => {
      return await qrService.getConfiguracion();
    },
    staleTime: 0,
    refetchOnWindowFocus: false
  });

  const { data: whatsappTemplates = [] } = useQuery({
    queryKey: ['whatsapp-templates'],
    queryFn: async () => {
      return await whatsappService.getTemplates();
    },
    staleTime: 0,
    refetchOnWindowFocus: false
  });

  // Mutations
  const generateQRMutation = useMutation({
    mutationFn: async (candidato: CandidatoConEmpresa) => {
      startLoading();
      try {
        const config = qrConfig || configuracion;
        return await qrService.generateQR(candidato, config);
      } finally {
        stopLoading();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidatos-con-empresa-qr'] });
      toast({ title: 'Éxito', description: 'Código QR generado correctamente' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const regenerateQRMutation = useMutation({
    mutationFn: async (candidato: CandidatoConEmpresa) => {
      startLoading();
      try {
        const config = qrConfig || configuracion;
        return await qrService.regenerateQR(candidato, config);
      } finally {
        stopLoading();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidatos-con-empresa-qr'] });
      toast({ title: 'Éxito', description: 'Código QR regenerado correctamente' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteQRMutation = useMutation({
    mutationFn: async (qrId: number) => {
      startLoading();
      try {
        return await qrService.deleteQR(qrId);
      } finally {
        stopLoading();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidatos-con-empresa-qr'] });
      toast({ title: 'Éxito', description: 'Código QR eliminado correctamente' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const activateCandidatoMutation = useMutation({
    mutationFn: async (candidatoId: number) => {
      startLoading();
      try {
        await candidatosService.activate(candidatoId);
      } finally {
        stopLoading();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidatos-con-empresa-qr'] });
      toast({ title: 'Éxito', description: 'Candidato activado correctamente' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deactivateCandidatoMutation = useMutation({
    mutationFn: async (candidatoId: number) => {
      startLoading();
      try {
        await candidatosService.deactivate(candidatoId);
      } finally {
        stopLoading();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidatos-con-empresa-qr'] });
      toast({ title: 'Éxito', description: 'Candidato desactivado correctamente' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteCandidatoMutation = useMutation({
    mutationFn: async (candidatoId: number) => {
      startLoading();
      try {
        await candidatosService.delete(candidatoId);
      } finally {
        stopLoading();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidatos-con-empresa-qr'] });
      toast({ title: 'Éxito', description: 'Candidato eliminado correctamente' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateConfigMutation = useMutation({
    mutationFn: async (config: Partial<QRConfiguracion>) => {
      startLoading();
      try {
        return await qrService.updateConfiguracion(config);
      } finally {
        stopLoading();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-configuracion'] });
      toast({ title: 'Éxito', description: 'Configuración guardada correctamente' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Actualizar configuración cuando se carga
  useEffect(() => {
    if (qrConfig) {
      setConfiguracion(qrConfig);
    }
  }, [qrConfig]);

  // Funciones auxiliares
  const toggleCandidato = (candidatoId: number) => {
    setSelectedCandidatos(prev => 
      prev.includes(candidatoId)
        ? prev.filter(id => id !== candidatoId)
        : [...prev, candidatoId]
    );
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedCandidatos([]);
    } else {
      const candidatosConQR = candidatos.filter(c => c.qrGenerado).map(c => c.id!);
      setSelectedCandidatos(candidatosConQR);
    }
    setSelectAll(!selectAll);
  };

  const generateQR = async (candidato: CandidatoConEmpresa) => {
    if (candidato.qrGenerado && candidato.qrData) {
      // Si ya tiene QR, regenerar
      regenerateQRMutation.mutate(candidato);
    } else {
      // Generar nuevo QR
      generateQRMutation.mutate(candidato);
    }
  };

  const downloadQR = async (candidato: CandidatoConEmpresa) => {
    if (!candidato.qrData) {
      toast({
        title: "Error",
        description: "No hay código QR para descargar",
        variant: "destructive",
      });
      return;
    }

    try {
      await qrService.downloadQR(candidato.qrData);
      toast({
        title: "Descarga iniciada",
        description: `QR descargado para ${candidato.primer_nombre} ${candidato.primer_apellido}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo descargar el código QR",
        variant: "destructive",
      });
    }
  };

  const deleteQR = async (candidato: CandidatoConEmpresa) => {
    if (!candidato.qrData) {
      toast({
        title: "Error",
        description: "No hay código QR para eliminar",
        variant: "destructive",
      });
      return;
    }

    deleteQRMutation.mutate(candidato.qrData.id!);
  };

  const viewQR = async (candidato: CandidatoConEmpresa) => {
    try {
      if (!candidato.qrData) {
        toast({
          title: "Error",
          description: "No hay QR generado para este candidato",
          variant: "destructive",
        });
        return;
      }

      // Verificar que el QR existe en la base de datos
      const qrFromDB = await qrService.getQRByCandidato(candidato.id!);
      if (!qrFromDB) {
        toast({
          title: "Error",
          description: "El QR ya no existe en la base de datos",
          variant: "destructive",
        });
        return;
      }

      // Configurar datos para el modal
      setSelectedQRData(qrFromDB);
      setSelectedCandidatoData(candidato);
      setShowQRModal(true);
      
      toast({
        title: "QR mostrado",
        description: `QR visualizado para ${candidato.primer_nombre} ${candidato.primer_apellido}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo mostrar el código QR",
        variant: "destructive",
      });
    }
  };

  const activateCandidato = (candidatoId: number) => {
    activateCandidatoMutation.mutate(candidatoId);
  };

  const deactivateCandidato = (candidatoId: number) => {
    deactivateCandidatoMutation.mutate(candidatoId);
  };

  const deleteCandidato = (candidatoId: number) => {
    deleteCandidatoMutation.mutate(candidatoId);
  };

  const saveConfiguracion = () => {
    updateConfigMutation.mutate(configuracion);
  };

  const sendWhatsApp = async () => {
    startLoading();
    
    try {
      const candidatosSeleccionados = candidatos.filter(c => selectedCandidatos.includes(c.id!));
      const messages: WhatsAppMessage[] = [];
      
      for (const candidato of candidatosSeleccionados) {
        const nombreCompleto = `${candidato.primer_nombre} ${candidato.segundo_nombre || ''} ${candidato.primer_apellido} ${candidato.segundo_apellido || ''}`.trim();
        
        // Replace template variables with actual candidate data
        const mensaje = whatsappService.replaceTemplateVariables(mensajeWhatsApp, {
          nombre: nombreCompleto,
          empresa: candidato.empresa_nombre || '',
          telefono: candidato.telefono || '',
          email: candidato.email || '',
          documento: candidato.numero_documento || ''
        });
        
        const telefonoFormateado = whatsappService.formatPhoneNumber(candidato.telefono || '');
        
        if (whatsappService.isValidPhoneNumber(telefonoFormateado)) {
          messages.push({
            to: telefonoFormateado,
            message: mensaje,
            variables: {
              nombre: nombreCompleto,
              empresa: candidato.empresa_nombre || '',
              telefono: candidato.telefono || '',
              email: candidato.email || '',
              documento: candidato.numero_documento || ''
            }
          });
        }
      }
      
      if (messages.length === 0) {
        toast({
          title: "Error",
          description: "No hay candidatos con números de teléfono válidos",
          variant: "destructive"
        });
        return;
      }
      
      // Send messages using the WhatsApp service
      const results = await whatsappService.sendBulkMessages(messages);
      
      const successfulMessages = results.filter(r => r.success).length;
      const failedMessages = results.filter(r => !r.success).length;
      
      if (successfulMessages > 0) {
        toast({
          title: "Mensajes enviados",
          description: `${successfulMessages} mensajes enviados exitosamente${failedMessages > 0 ? `, ${failedMessages} fallaron` : ''}`,
        });
      } else {
        toast({
          title: "Error",
          description: "No se pudieron enviar los mensajes de WhatsApp",
          variant: "destructive"
        });
      }
      
      // Clear selection after sending
      setSelectedCandidatos([]);
      setSelectAll(false);
      
    } catch (error) {
      console.error('Error sending WhatsApp messages:', error);
      toast({
        title: "Error",
        description: "Error al enviar mensajes de WhatsApp",
        variant: "destructive"
      });
    } finally {
      stopLoading();
    }
  };

  const sendEmail = async () => {
    if (selectedCandidatos.length === 0) {
      toast({
        title: "Error",
        description: "No hay candidatos seleccionados",
        variant: "destructive"
      });
      return;
    }

    if (!asuntoEmail.trim() || !mensajeEmail.trim()) {
      toast({
        title: "Error",
        description: "El asunto y mensaje son obligatorios",
        variant: "destructive"
      });
      return;
    }

    startLoading();
    
    try {
    const candidatosSeleccionados = candidatos.filter(c => selectedCandidatos.includes(c.id!));
      let emailsEnviados = 0;
      let emailsFallidos = 0;
      const errores: string[] = [];

      // Enviar email a cada candidato seleccionado
      for (const candidato of candidatosSeleccionados) {
        try {
          const nombreCompleto = `${candidato.primer_nombre} ${candidato.segundo_nombre || ''} ${candidato.primer_apellido} ${candidato.segundo_apellido || ''}`.trim();
          
          // Verificar que el candidato tenga QR generado
          if (!candidato.qrData || !candidato.qrData.qr_image_url) {
            errores.push(`${candidato.email}: No tiene código QR generado`);
            emailsFallidos++;
            continue;
          }

          // Debug: Verificar que la imagen QR esté disponible
          console.log(`🔍 Debug QR para ${candidato.email}:`, {
            tieneQRData: !!candidato.qrData,
            tieneImagenURL: !!candidato.qrData.qr_image_url,
            imagenURL: candidato.qrData.qr_image_url?.substring(0, 100) + '...',
            tipoImagen: candidato.qrData.qr_image_url?.startsWith('data:image/') ? 'Base64 válido' : 'Formato incorrecto',
            estructuraCompleta: candidato.qrData,
            candidatoCompleto: candidato
          });

          console.log(`📤 Enviando correo a: ${candidato.email}`);

          // Reemplazar variables en el asunto y mensaje (sin llaves)
          const asuntoProcesado = asuntoEmail
            .replace(/nombre/g, nombreCompleto)
            .replace(/cedula/g, candidato.numero_documento || '')
            .replace(/email/g, candidato.email || '')
            .replace(/empresa/g, candidato.empresa_nombre || '')
            .replace(/fecha/g, new Date().toLocaleDateString('es-ES'));

          const mensajeProcesado = mensajeEmail
            .replace(/nombre/g, nombreCompleto)
            .replace(/cedula/g, candidato.numero_documento || '')
            .replace(/email/g, candidato.email || '')
            .replace(/empresa/g, candidato.empresa_nombre || '')
            .replace(/fecha/g, new Date().toLocaleDateString('es-ES'));

          // Crear mensaje HTML con el código QR incrustado correctamente
          const mensajeHTML = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${asuntoProcesado}</title>
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
      border-bottom: 2px solid #059669;
      padding-bottom: 20px;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #059669;
      margin-bottom: 10px;
    }
    .qr-section {
      text-align: center;
      margin: 30px 0;
      padding: 30px;
      background-color: white;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }
    .qr-title {
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 8px;
    }
    .qr-subtitle {
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 25px;
    }
    .qr-container {
      display: inline-block;
      padding: 20px;
      background-color: white;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      margin-bottom: 20px;
    }
    .qr-image {
      width: 250px;
      height: 250px;
      display: block;
      margin: 0 auto;
      border-radius: 8px;
    }
    .qr-info {
      margin-top: 20px;
      text-align: left;
      max-width: 400px;
      margin-left: auto;
      margin-right: auto;
    }
    .qr-info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #f3f4f6;
    }
    .qr-info-item:last-child {
      border-bottom: none;
    }
    .qr-info-label {
      font-weight: 600;
      color: #374151;
      font-size: 14px;
    }
    .qr-info-value {
      color: #6b7280;
      font-size: 14px;
    }
    .qr-notice {
      background-color: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 8px;
      padding: 15px;
      margin: 20px 0;
      text-align: center;
    }
    .qr-notice-icon {
      font-size: 24px;
      margin-bottom: 10px;
    }
    .qr-notice-text {
      color: #92400e;
      font-size: 14px;
      margin: 0;
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
      <h1>${asuntoProcesado}</h1>
    </div>
    
    <div class="content">
      ${mensajeProcesado.replace(/\n/g, '<br>')}
    </div>
    
    <div class="qr-section">
      <div class="qr-title">Tu Código QR</div>
      <div class="qr-subtitle">Aquí tienes tu código QR personalizado:</div>
      
      <div class="qr-notice">
        <div class="qr-notice-icon">📱</div>
        <p class="qr-notice-text">
          <strong>Tu código QR está adjunto a este correo</strong><br>
          Descarga la imagen adjunta para usar tu código QR
        </p>
      </div>
      
      <div class="qr-info">
        <div class="qr-info-item">
          <span class="qr-info-label">Generado para:</span>
          <span class="qr-info-value">${nombreCompleto}</span>
        </div>
        <div class="qr-info-item">
          <span class="qr-info-label">Documento:</span>
          <span class="qr-info-value">${candidato.numero_documento}</span>
        </div>
        <div class="qr-info-item">
          <span class="qr-info-label">Empresa:</span>
          <span class="qr-info-value">${candidato.empresa_nombre || 'N/A'}</span>
        </div>
        <div class="qr-info-item">
          <span class="qr-info-label">Fecha de generación:</span>
          <span class="qr-info-value">${new Date(candidato.qrData.fecha_generacion || '').toLocaleDateString('es-ES')}</span>
        </div>
      </div>
    </div>
    
    <div class="footer">
      <p>Este es un correo automático, no respondas a este mensaje.</p>
      <p>© 2024 RH Compensamos. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>`;

          // Debug: Verificar el HTML generado
          console.log(`📧 HTML generado para ${candidato.email}:`, {
            asunto: asuntoProcesado,
            mensaje: mensajeProcesado,
            imagenQRIncluida: mensajeHTML.includes('data:image/'),
            longitudHTML: mensajeHTML.length,
            srcImagen: mensajeHTML.includes('src="data:image/'),
            imagenCompleta: candidato.qrData.qr_image_url?.substring(0, 50) + '...'
          });

          // Debug adicional: Verificar que la imagen esté en el HTML
          const imagenEnHTML = mensajeHTML.includes(candidato.qrData.qr_image_url);
          console.log(`🔍 Verificación imagen en HTML:`, {
            imagenEncontrada: imagenEnHTML,
            longitudImagen: candidato.qrData.qr_image_url?.length,
            posicionEnHTML: mensajeHTML.indexOf(candidato.qrData.qr_image_url)
          });

          // Preparar el adjunto del código QR usando el servicio de descarga
          try {
            // Convertir la imagen base64 a Blob para adjuntarla
            const base64Data = candidato.qrData.qr_image_url;
            const byteCharacters = atob(base64Data.split(',')[1]);
            const byteNumbers = new Array(byteCharacters.length);
            
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'image/png' });
            
            // Convertir Blob a base64 para el adjunto
            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve) => {
              reader.onload = () => {
                const result = reader.result as string;
                resolve(result.split(',')[1]); // Solo la parte base64 sin el prefijo
              };
            });
            
            reader.readAsDataURL(blob);
            const base64Content = await base64Promise;

            const qrAttachment = {
              filename: `QR_${candidato.numero_documento}_${nombreCompleto.replace(/\s+/g, '_')}.png`,
              content: base64Data,
              contentType: 'image/png'
            };
            console.log("qrAttachment", qrAttachment);
            

            console.log(`📎 Adjunto preparado para ${candidato.email}:`, {
              filename: qrAttachment.filename,
              contentType: qrAttachment.contentType,
              contentLength: qrAttachment.content.length
            });

            // Enviar email usando el servicio con adjunto
            const resultado = await emailService.sendEmail({
              to: candidato.email || '',
              subject: asuntoProcesado,
              html: mensajeHTML,
              text: mensajeProcesado.replace(/<[^>]*>/g, ''), // Versión texto sin HTML
              from: 'noreply@rhcompensamos.com',
              attachments: [qrAttachment]
            });

            if (resultado.success) {
              emailsEnviados++;
              console.log(`✅ Email enviado exitosamente a: ${candidato.email}`);
            } else {
              emailsFallidos++;
              errores.push(`${candidato.email}: ${resultado.error || 'Error desconocido'}`);
              console.error(`❌ Error enviando email a ${candidato.email}:`, resultado.error);
            }

          } catch (attachmentError) {
            console.error(`❌ Error preparando adjunto para ${candidato.email}:`, attachmentError);
            
            // Si falla la preparación del adjunto, enviar sin adjunto
            const resultado = await emailService.sendEmail({
              to: candidato.email || '',
              subject: asuntoProcesado,
              html: mensajeHTML,
              text: mensajeProcesado.replace(/<[^>]*>/g, ''),
              from: 'noreply@rhcompensamos.com'
            });

            if (resultado.success) {
              emailsEnviados++;
              console.log(`✅ Email enviado sin adjunto a: ${candidato.email}`);
            } else {
              emailsFallidos++;
              errores.push(`${candidato.email}: ${resultado.error || 'Error desconocido'}`);
              console.error(`❌ Error enviando email a ${candidato.email}:`, resultado.error);
            }
          }
          
        } catch (error) {
          emailsFallidos++;
          errores.push(`${candidato.email}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
          console.error(`❌ Error procesando candidato ${candidato.email}:`, error);
        }
      }

      // Mostrar resultado del envío
      if (emailsEnviados > 0) {
    toast({
          title: "Éxito",
          description: `Se enviaron ${emailsEnviados} emails exitosamente${emailsFallidos > 0 ? `, ${emailsFallidos} fallaron` : ''}`,
        });
      }

      if (emailsFallidos > 0) {
        toast({
          title: "Advertencia",
          description: `${emailsFallidos} emails fallaron. Revisa la consola para más detalles.`,
          variant: "destructive"
        });
        
        // Mostrar errores en consola para debugging
        console.error('Errores en envío de emails:', errores);
      }

      // Limpiar selección después del envío
      setSelectedCandidatos([]);
      setSelectAll(false);

    } catch (error) {
      console.error('Error en envío masivo de emails:', error);
      toast({
        title: "Error",
        description: "Error al enviar los emails. Revisa la consola para más detalles.",
        variant: "destructive"
      });
    } finally {
      stopLoading();
    }
  };

  const getEstadoBadge = (activo?: boolean) => {
    if (activo) {
      return <Badge className="bg-brand-lime/10 text-brand-lime">Activo</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800">Inactivo</Badge>;
    }
  };

  const getQRStatusBadge = (candidato: CandidatoConEmpresa) => {
    if (!candidato.qrData) {
      return <Badge className="bg-gray-200 text-gray-600 border-gray-300">Sin generar</Badge>;
    }
    
    if (qrService.isQRExpired(candidato.qrData)) {
      return <Badge className="bg-red-100 text-red-700 border-red-200">Vencido</Badge>;
    }
    
    return <Badge className="bg-brand-lime/10 text-brand-lime">Generado</Badge>;
  };

  // Filtrar candidatos
  const filteredCandidatos = candidatos
    .filter(candidato => {
      const nombreCompleto = `${candidato.primer_nombre} ${candidato.segundo_nombre || ''} ${candidato.primer_apellido} ${candidato.segundo_apellido || ''}`.trim();
      
      const matchesSearch = 
        candidato.numero_documento?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidato.empresa_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidato.email?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesEmpresa = empresaFilter === "all" || candidato.empresa_id?.toString() === empresaFilter;
      const matchesEstado = estadoFilter === "all" || (estadoFilter === "activos" && candidato.activo) || (estadoFilter === "inactivos" && !candidato.activo);
      const matchesQR = 
        (qrFilter === "all") ||
        (qrFilter === "generados" && candidato.qrGenerado) ||
        (qrFilter === "no-generados" && !candidato.qrGenerado);

      return matchesSearch && matchesEmpresa && matchesEstado && matchesQR;
    })
    .sort((a, b) => {
      // Mostrar candidatos con QR primero
      if (a.qrGenerado !== b.qrGenerado) {
        return a.qrGenerado ? -1 : 1;
      }
      // Luego ordenar por nombre
      const nombreA = `${a.primer_nombre} ${a.primer_apellido}`;
      const nombreB = `${b.primer_nombre} ${b.primer_apellido}`;
      return nombreA.localeCompare(nombreB);
    });

  // Candidatos con QR para los tabs de WhatsApp y Email
  const candidatosConQR = candidatos.filter(c => c.qrGenerado);

  return (
    <div className="p-4 max-w-full mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-extrabold text-cyan-800 flex items-center gap-2 mb-2">
          <QrCode className="w-8 h-8 text-cyan-600" />
          Gestión de Códigos QR
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-cyan-100/60 p-1 rounded-lg">
          <TabsTrigger
            value="generar"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
          >
            Generar QR
          </TabsTrigger>
          <TabsTrigger
            value="whatsapp"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
          >
            WhatsApp
          </TabsTrigger>
          <TabsTrigger
            value="email"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
          >
            Email
          </TabsTrigger>
          <TabsTrigger
            value="configuracion"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
          >
            Configuración
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generar" className="mt-6">
          {/* Header similar al diseño de empresas */}
          <div className="bg-white rounded-lg border">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                  <QrCode className="w-5 h-5 text-orange-600" />
                </div>
                <span className="text-lg font-semibold text-gray-700">GENERACIÓN DE QR</span>
              </div>
              <div className="flex space-x-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => refetch()}
                        className="bg-teal-400 hover:bg-teal-500 text-white text-xs px-3 py-1"
                        size="sm"
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Actualizar
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Actualizar lista de candidatos</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {/* Filtros */}
            <div className="p-4 border-b bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Buscar por cédula, nombre, empresa..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Buscar candidatos por cédula, nombre, empresa o email</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Select value={empresaFilter} onValueChange={setEmpresaFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Filtrar por empresa" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas las empresas</SelectItem>
                          {empresas.map((empresa) => (
                            <SelectItem key={empresa.id} value={empresa.id.toString()}>
                              {empresa.razonSocial}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Filtrar candidatos por empresa</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Filtrar por estado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos los estados</SelectItem>
                          <SelectItem value="activos">Activo</SelectItem>
                          <SelectItem value="inactivos">Inactivo</SelectItem>
                        </SelectContent>
                      </Select>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Filtrar candidatos por estado</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Select value={qrFilter} onValueChange={setQrFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Filtrar por QR" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos los QR</SelectItem>
                          <SelectItem value="generados">Solo generados</SelectItem>
                          <SelectItem value="no-generados">Sin generar</SelectItem>
                        </SelectContent>
                      </Select>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Filtrar por estado del código QR</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSearchTerm("");
                          setEmpresaFilter("all");
                          setQrFilter("all");
                          setEstadoFilter("all");
                        }}
                        className="flex items-center gap-2"
                      >
                        <Filter className="w-4 h-4" />
                        Limpiar filtros
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Limpiar todos los filtros aplicados</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {/* Tabla de candidatos */}
            <div className="overflow-x-auto rounded-lg shadow-sm">
              <Table className="min-w-[800px] w-full text-xs">
                <TableHeader className="bg-cyan-50">
                  <TableRow className="text-left font-semibold text-gray-700">
                    <TableHead className="px-2 py-1 text-teal-600">Acciones</TableHead>
                    <TableHead className="px-4 py-3">Cédula</TableHead>
                    <TableHead className="px-4 py-3">Nombre Completo</TableHead>
                    <TableHead className="px-4 py-3">Empresa</TableHead>
                    <TableHead className="px-4 py-3">Estado</TableHead>
                    <TableHead className="px-4 py-3">QR</TableHead>
                    <TableHead className="px-4 py-3">Fecha QR</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        Cargando candidatos...
                      </TableCell>
                    </TableRow>
                  ) : filteredCandidatos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        No hay candidatos disponibles.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCandidatos.map((candidato) => {
                      const nombreCompleto = `${candidato.primer_nombre} ${candidato.segundo_nombre || ''} ${candidato.primer_apellido} ${candidato.segundo_apellido || ''}`.trim();
                      
                      return (
                        <TableRow key={candidato.id} className="hover:bg-gray-50">
                          <TableCell className="px-2 py-1">
                            <div className="flex flex-row gap-1 items-center">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => generateQR(candidato)}
                                      aria-label="Generar QR"
                                      className="h-8 w-8"
                                      disabled={generateQRMutation.isPending || regenerateQRMutation.isPending}
                                    >
                                      <QrCode className="h-4 w-4 text-cyan-600 hover:text-cyan-800 transition-colors" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{candidato.qrGenerado ? "Regenerar QR" : "Generar QR"}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              
                              {candidato.qrGenerado && candidato.qrData && (
                                <>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => downloadQR(candidato)}
                                          aria-label="Descargar QR"
                                          className="h-8 w-8"
                                        >
                                          <Download className="h-4 w-4 text-brand-lime hover:text-brand-lime/80 transition-colors" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Descargar QR</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => viewQR(candidato)}
                                          aria-label="Visualizar QR"
                                          className="h-8 w-8"
                                        >
                                          <Eye className="h-4 w-4 text-purple-600 hover:text-purple-800 transition-colors" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Visualizar QR</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              aria-label="Eliminar QR"
                                              className="h-8 w-8"
                                            >
                                              <Trash2 className="h-4 w-4 text-rose-600 hover:text-rose-800 transition-colors" />
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>¿Eliminar QR?</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                Esta acción eliminará el código QR de forma permanente. ¿Estás seguro?
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                              <AlertDialogAction onClick={() => deleteQR(candidato)}>
                                                Sí, eliminar
                                              </AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Eliminar QR</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </>
                              )}
                              
                              {/* Botones de gestión del candidato */}
                              <div className="flex flex-row gap-1 items-center ml-2 border-l border-gray-200 pl-2">
                                {candidato.activo ? (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => deactivateCandidato(candidato.id!)}
                                          aria-label="Desactivar candidato"
                                          className="h-8 w-8"
                                          disabled={deactivateCandidatoMutation.isPending}
                                        >
                                          <PowerOff className="h-4 w-4 text-orange-600 hover:text-orange-800 transition-colors" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Desactivar candidato</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                ) : (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => activateCandidato(candidato.id!)}
                                          aria-label="Activar candidato"
                                          className="h-8 w-8"
                                          disabled={activateCandidatoMutation.isPending}
                                        >
                                          <Power className="h-4 w-4 text-brand-lime hover:text-brand-lime/80 transition-colors" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Activar candidato</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                                
                                {!candidato.activo && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              aria-label="Eliminar candidato"
                                              className="h-8 w-8"
                                              disabled={deleteCandidatoMutation.isPending}
                                            >
                                              <Trash2 className="h-4 w-4 text-red-600 hover:text-red-800 transition-colors" />
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>¿Eliminar candidato?</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                Esta acción eliminará el candidato de forma permanente. ¿Estás seguro?
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                              <AlertDialogAction onClick={() => deleteCandidato(candidato.id!)}>
                                                Sí, eliminar
                                              </AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Eliminar candidato</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-sm text-gray-900">{candidato.numero_documento}</TableCell>
                          <TableCell className="px-4 py-3 text-sm text-gray-900">
                            <div>
                              <div className="font-medium">{nombreCompleto}</div>
                              <div className="text-xs text-gray-500 mt-1">{candidato.email || 'Sin email'}</div>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-sm text-gray-500">{candidato.empresa_nombre}</TableCell>
                          <TableCell className="px-4 py-3">
                            {getEstadoBadge(candidato.activo)}
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            {getQRStatusBadge(candidato)}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-sm text-gray-500">
                            {candidato.fechaGeneracionQR ? new Date(candidato.fechaGeneracionQR).toLocaleDateString() : "N/A"}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="whatsapp" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Envío por WhatsApp
                </CardTitle>
                <CardDescription>
                  Selecciona candidatos y personaliza el mensaje
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Plantilla</label>
                  <Select value={selectedTemplate} onValueChange={(value) => {
                    setSelectedTemplate(value);
                    if (value !== 'custom') {
                      const template = whatsappTemplates.find(t => t.id === value);
                      if (template) {
                        setMensajeWhatsApp(template.message);
                      }
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar plantilla" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Mensaje personalizado</SelectItem>
                      {whatsappTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Mensaje</label>
                  <Textarea
                    value={mensajeWhatsApp}
                    onChange={(e) => setMensajeWhatsApp(e.target.value)}
                    rows={6}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Variables disponibles: {'{'}nombre{'}'}, {'{'}empresa{'}'}, {'{'}telefono{'}'}, {'{'}email{'}'}, {'{'}documento{'}'}
                  </p>
                </div>
                
                {selectedCandidatos.length > 0 && (
                  <div className="border rounded-lg p-3 bg-gray-50">
                    <label className="text-sm font-medium">Vista previa del mensaje</label>
                    <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
                      {(() => {
                        const candidato = candidatos.find(c => c.id === selectedCandidatos[0]);
                        if (!candidato) return 'Selecciona un candidato para ver la vista previa';
                        
                        const nombreCompleto = `${candidato.primer_nombre} ${candidato.segundo_nombre || ''} ${candidato.primer_apellido} ${candidato.segundo_apellido || ''}`.trim();
                        return whatsappService.replaceTemplateVariables(mensajeWhatsApp, {
                          nombre: nombreCompleto,
                          empresa: candidato.empresa_nombre || '',
                          telefono: candidato.telefono || '',
                          email: candidato.email || '',
                          documento: candidato.numero_documento || ''
                        });
                      })()}
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const templateName = prompt('Nombre de la plantilla:');
                      if (templateName) {
                        const success = await whatsappService.saveTemplate({
                          name: templateName,
                          message: mensajeWhatsApp,
                          variables: ['nombre', 'empresa', 'telefono', 'email', 'documento']
                        });
                        
                        if (success) {
                          toast({
                            title: "Plantilla guardada",
                            description: "La plantilla se ha guardado exitosamente"
                          });
                          queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] });
                        } else {
                          toast({
                            title: "Error",
                            description: "No se pudo guardar la plantilla",
                            variant: "destructive"
                          });
                        }
                      }
                    }}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Guardar como plantilla
                  </Button>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={sendWhatsApp}
                        disabled={selectedCandidatos.length === 0}
                        className="w-full"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Enviar a {selectedCandidatos.length} candidatos
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Enviar códigos QR por WhatsApp</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Candidatos con QR</CardTitle>
                <CardDescription>
                  Solo candidatos aprobados con QR generado
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filtro para candidatos con QR */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Buscar candidatos..."
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Checkbox para seleccionar todos */}
                <div className="flex items-center space-x-2 mb-3 p-2 bg-gray-50 rounded">
                  <Checkbox
                    checked={selectAll}
                    onCheckedChange={toggleSelectAll}
                    className="data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                  />
                  <label className="text-sm font-medium">
                    Seleccionar todos ({candidatosConQR.length})
                  </label>
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {candidatosConQR.map((candidato) => {
                    const nombreCompleto = `${candidato.primer_nombre} ${candidato.segundo_nombre || ''} ${candidato.primer_apellido} ${candidato.segundo_apellido || ''}`.trim();
                    
                    return (
                      <div key={candidato.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                        <Checkbox
                          checked={selectedCandidatos.includes(candidato.id!)}
                          onCheckedChange={() => toggleCandidato(candidato.id!)}
                          className="data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{nombreCompleto}</p>
                          <p className="text-xs text-gray-600">{candidato.telefono || 'Sin teléfono'}</p>
                        </div>
                        {getEstadoBadge(candidato.activo)}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="email" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="w-5 h-5 mr-2" />
                  Envío por Email
                </CardTitle>
                <CardDescription>
                  Configura el email con QR adjunto
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Asunto</label>
                  <Input
                    value={asuntoEmail}
                    onChange={(e) => setAsuntoEmail(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Mensaje</label>
                  <Textarea
                    value={mensajeEmail}
                    onChange={(e) => setMensajeEmail(e.target.value)}
                    rows={8}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                     Variables: nombre, cedula, email, empresa, fecha
                  </p>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={sendEmail}
                        disabled={selectedCandidatos.length === 0}
                        className="w-full"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Enviar a {selectedCandidatos.length} candidatos
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Enviar códigos QR por email</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Candidatos con QR</CardTitle>
                <CardDescription>
                  Selecciona candidatos para envío por email
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filtro para candidatos con QR */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Buscar candidatos..."
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Checkbox para seleccionar todos */}
                <div className="flex items-center space-x-2 mb-3 p-2 bg-gray-50 rounded">
                  <Checkbox
                    checked={selectAll}
                    onCheckedChange={toggleSelectAll}
                    className="data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                  />
                  <label className="text-sm font-medium">
                    Seleccionar todos ({candidatosConQR.length})
                  </label>
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {candidatosConQR.map((candidato) => {
                    const nombreCompleto = `${candidato.primer_nombre} ${candidato.segundo_nombre || ''} ${candidato.primer_apellido} ${candidato.segundo_apellido || ''}`.trim();
                    
                    return (
                      <div key={candidato.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                        <Checkbox
                          checked={selectedCandidatos.includes(candidato.id!)}
                          onCheckedChange={() => toggleCandidato(candidato.id!)}
                          className="data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{nombreCompleto}</p>
                          <p className="text-xs text-gray-600">{candidato.email}</p>
                        </div>
                        {getEstadoBadge(candidato.activo)}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="configuracion" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Configuración de QR
              </CardTitle>
              <CardDescription>
                Configura los parámetros de generación de códigos QR
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="periodo-renovacion">Período de renovación (días)</Label>
                  <Input
                    id="periodo-renovacion"
                    type="number"
                    value={configuracion.periodo_renovacion}
                    onChange={(e) => setConfiguracion(prev => ({ ...prev, periodo_renovacion: parseInt(e.target.value) }))}
                    className="mt-1"
                    min="1"
                    max="365"
                  />
                </div>
                <div>
                  <Label htmlFor="tamanio-qr">Tamaño del QR (píxeles)</Label>
                  <Input
                    id="tamanio-qr"
                    type="number"
                    value={configuracion.tamanio_qr}
                    onChange={(e) => setConfiguracion(prev => ({ ...prev, tamanio_qr: parseInt(e.target.value) }))}
                    className="mt-1"
                    min="100"
                    max="1000"
                  />
                </div>
                <div>
                  <Label htmlFor="formato-imagen">Formato de imagen</Label>
                  <Select value={configuracion.formato_imagen} onValueChange={(value) => setConfiguracion(prev => ({ ...prev, formato_imagen: value }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PNG">PNG</SelectItem>
                      <SelectItem value="JPEG">JPEG</SelectItem>
                      <SelectItem value="SVG">SVG</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="calidad-imagen">Calidad de imagen (0.1 - 1.0)</Label>
                  <Input
                    id="calidad-imagen"
                    type="number"
                    step="0.1"
                    value={configuracion.calidad_imagen}
                    onChange={(e) => setConfiguracion(prev => ({ ...prev, calidad_imagen: parseFloat(e.target.value) }))}
                    className="mt-1"
                    min="0.1"
                    max="1.0"
                  />
                </div>
                <div>
                  <Label htmlFor="color-fondo">Color de fondo</Label>
                  <Input
                    id="color-fondo"
                    type="color"
                    value={configuracion.color_fondo}
                    onChange={(e) => setConfiguracion(prev => ({ ...prev, color_fondo: e.target.value }))}
                    className="mt-1 h-10"
                  />
                </div>
                <div>
                  <Label htmlFor="color-qr">Color del QR</Label>
                  <Input
                    id="color-qr"
                    type="color"
                    value={configuracion.color_qr}
                    onChange={(e) => setConfiguracion(prev => ({ ...prev, color_qr: e.target.value }))}
                    className="mt-1 h-10"
                  />
                </div>
                <div>
                  <Label htmlFor="margen">Margen (píxeles)</Label>
                  <Input
                    id="margen"
                    type="number"
                    value={configuracion.margen}
                    onChange={(e) => setConfiguracion(prev => ({ ...prev, margen: parseInt(e.target.value) }))}
                    className="mt-1"
                    min="0"
                    max="10"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={saveConfiguracion}
                        disabled={updateConfigMutation.isPending}
                        className="flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        Guardar Configuración
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Guardar configuración de códigos QR</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal para visualizar QR */}
      <AlertDialog open={showQRModal} onOpenChange={setShowQRModal}>
        <AlertDialogContent className="max-w-md max-h-[80vh] overflow-hidden">
          <AlertDialogHeader className="pb-3">
            <div className="flex items-center justify-between">
              <AlertDialogTitle className="flex items-center gap-2 text-lg">
                <QrCode className="w-5 h-5 text-cyan-600" />
                Visualizar QR
              </AlertDialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowQRModal(false)}
                className="h-6 w-6"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <AlertDialogDescription className="text-sm">
              {selectedCandidatoData?.primer_nombre} {selectedCandidatoData?.primer_apellido}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="overflow-y-auto max-h-[60vh] space-y-3 pr-2">
            {/* Imagen del QR */}
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                {selectedQRData?.qr_image_url ? (
                  <img 
                    src={selectedQRData.qr_image_url} 
                    alt="Código QR" 
                    className="w-48 h-48 object-contain"
                  />
                ) : (
                  <div className="flex items-center justify-center w-48 h-48 bg-gray-100 rounded-lg">
                    <p className="text-gray-500 text-sm">QR no disponible</p>
                  </div>
                )}
              </div>
            </div>

            {/* Información básica */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-2 text-sm">Información</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Documento:</span>
                  <span className="text-gray-800">{selectedCandidatoData?.numero_documento}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Empresa:</span>
                  <span className="text-gray-800">{selectedCandidatoData?.empresa_nombre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estado:</span>
                  <span className="text-gray-800">
                    {selectedQRData && getQRStatusBadge(selectedCandidatoData!)}
                  </span>
                </div>
              </div>
            </div>

            {/* Detalles del QR */}
            {selectedQRData && (
              <div className="bg-cyan-50 p-3 rounded-lg">
                <h4 className="font-medium text-cyan-800 mb-2 text-sm">Detalles QR</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-cyan-600">Tamaño:</span>
                    <span className="text-cyan-800">{selectedQRData.qr_size}px</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cyan-600">Generado:</span>
                    <span className="text-cyan-800">
                      {selectedQRData.fecha_generacion ? new Date(selectedQRData.fecha_generacion).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cyan-600">Vence:</span>
                    <span className="text-cyan-800">
                      {selectedQRData.fecha_vencimiento ? new Date(selectedQRData.fecha_vencimiento).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <AlertDialogFooter className="pt-3">
            <AlertDialogCancel className="text-sm">Cerrar</AlertDialogCancel>
            {selectedQRData && (
              <Button
                onClick={() => {
                  if (selectedCandidatoData) {
                    downloadQR(selectedCandidatoData);
                  }
                }}
                className="flex items-center gap-2 text-sm"
                size="sm"
              >
                <Download className="w-4 h-4" />
                Descargar
              </Button>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
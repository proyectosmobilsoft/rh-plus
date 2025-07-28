import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { plantillasMensajesService, PlantillaMensaje } from '@/services/plantillasMensajesService';
import { 
  QrCode, 
  MessageSquare, 
  Mail, 
  Settings, 
  Send, 
  Download,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

interface Candidato {
  id: number;
  cedula: string;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  empresa: string;
  estado: string;
  qrGenerado: boolean;
  fechaGeneracionQR?: string;
}

export default function QrPageMejorado() {
  const { toast } = useToast();
  const [candidatos] = useState<Candidato[]>([
    {
      id: 1,
      cedula: "12345678",
      nombre: "Carlos",
      apellido: "Rodríguez", 
      telefono: "+57 300 123 4567",
      email: "carlos.rodriguez@email.com",
      empresa: "Empresa ABC",
      estado: "aprobado",
      qrGenerado: true,
      fechaGeneracionQR: "2025-01-03"
    },
    {
      id: 2,
      cedula: "87654321",
      nombre: "María",
      apellido: "González",
      telefono: "+57 301 987 6543", 
      email: "maria.gonzalez@email.com",
      empresa: "Industrial XYZ",
      estado: "aprobado",
      qrGenerado: false
    },
    {
      id: 3,
      cedula: "55667788",
      nombre: "Ana",
      apellido: "López",
      telefono: "+57 302 555 7788",
      email: "ana.lopez@email.com", 
      empresa: "Servicios 123",
      estado: "pendiente",
      qrGenerado: false
    },
    {
      id: 4,
      cedula: "11223344",
      nombre: "Luis",
      apellido: "Martín",
      telefono: "+57 303 111 2233",
      email: "luis.martin@email.com",
      empresa: "Tecnología Avanzada",
      estado: "aprobado",
      qrGenerado: true,
      fechaGeneracionQR: "2025-01-02"
    }
  ]);

  const [selectedCandidatos, setSelectedCandidatos] = useState<number[]>([]);
  const [mensajeWhatsApp, setMensajeWhatsApp] = useState(`Hola {{nombre}},

Tu código QR de certificación está listo. Este código contiene tu información verificada para acceso a las instalaciones de {{empresa}}.

Por favor, manténlo siempre contigo durante tu horario laboral.

Saludos,
Equipo de Recursos Humanos`);

  const [asuntoEmail, setAsuntoEmail] = useState('Tu código QR de certificación - {{empresa}}');
  const [mensajeEmail, setMensajeEmail] = useState(`Estimado/a {{nombre}},

Nos complace informarte que tu código QR de certificación ha sido generado exitosamente.

Este código contiene tu información verificada y te permitirá acceder a las instalaciones de {{empresa}} de manera segura.

Información incluida:
- Nombre: {{nombre}}
- Cédula: {{cedula}}
- Email: {{email}}
- Empresa: {{empresa}}
- Fecha de generación: {{fecha}}

Atentamente,
Equipo de Recursos Humanos`);

  // Estados para plantillas
  const [plantillaWhatsAppSeleccionada, setPlantillaWhatsAppSeleccionada] = useState<string>('sin-plantilla');
  const [plantillaEmailSeleccionada, setPlantillaEmailSeleccionada] = useState<string>('sin-plantilla');

  // Query para obtener plantillas
  const { data: plantillasWhatsApp = [] } = useQuery({
    queryKey: ['plantillas-whatsapp'],
    queryFn: () => plantillasMensajesService.getByTipo('whatsapp'),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const { data: plantillasEmail = [] } = useQuery({
    queryKey: ['plantillas-email'],
    queryFn: () => plantillasMensajesService.getByTipo('email'),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const toggleCandidato = (candidatoId: number) => {
    setSelectedCandidatos(prev => 
      prev.includes(candidatoId)
        ? prev.filter(id => id !== candidatoId)
        : [...prev, candidatoId]
    );
  };

  const generateQR = async (candidato: Candidato) => {
    try {
      // Simular generación de QR
      toast({
        title: "QR Generado",
        description: `Código QR generado para ${candidato.nombre} ${candidato.apellido}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo generar el código QR",
        variant: "destructive",
      });
    }
  };

  const sendWhatsApp = async () => {
    const candidatosSeleccionados = candidatos.filter(c => selectedCandidatos.includes(c.id));
    
    for (const candidato of candidatosSeleccionados) {
      const mensaje = mensajeWhatsApp
        .replace(/\{\{nombre\}\}/g, `${candidato.nombre} ${candidato.apellido}`)
        .replace(/\{\{empresa\}\}/g, candidato.empresa);
      
      const telefono = candidato.telefono?.replace(/\D/g, '') || '';
      const whatsappUrl = `https://wa.me/57${telefono}?text=${encodeURIComponent(mensaje)}`;
      window.open(whatsappUrl, '_blank');
    }
    
    toast({
      title: "WhatsApp enviado",
      description: `Mensaje enviado a ${candidatosSeleccionados.length} candidatos`,
    });
  };

  const sendEmail = async () => {
    const candidatosSeleccionados = candidatos.filter(c => selectedCandidatos.includes(c.id));
    
    for (const candidato of candidatosSeleccionados) {
      const asunto = asuntoEmail
        .replace(/\{\{empresa\}\}/g, candidato.empresa)
        .replace(/\{\{nombre\}\}/g, `${candidato.nombre} ${candidato.apellido}`);
      
      const mensaje = mensajeEmail
        .replace(/\{\{nombre\}\}/g, `${candidato.nombre} ${candidato.apellido}`)
        .replace(/\{\{cedula\}\}/g, candidato.cedula)
        .replace(/\{\{email\}\}/g, candidato.email)
        .replace(/\{\{empresa\}\}/g, candidato.empresa)
        .replace(/\{\{fecha\}\}/g, new Date().toLocaleDateString());
      
      const mailtoUrl = `mailto:${candidato.email}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(mensaje)}`;
      window.open(mailtoUrl, '_blank');
    }
    
    toast({
      title: "Email enviado",
      description: `Correo electrónico enviado a ${candidatosSeleccionados.length} candidatos`,
    });
  };

  // Función para cargar plantilla de WhatsApp
  const cargarPlantillaWhatsApp = (plantillaId: string) => {
    if (!plantillaId || plantillaId === "sin-plantilla") {
      setPlantillaWhatsAppSeleccionada("sin-plantilla");
      return;
    }
    
    const plantilla = plantillasWhatsApp.find(p => p.id.toString() === plantillaId);
    if (plantilla) {
      setMensajeWhatsApp(plantilla.mensaje);
      setPlantillaWhatsAppSeleccionada(plantillaId);
      toast({
        title: "Plantilla cargada",
        description: `Plantilla "${plantilla.nombre}" cargada correctamente`,
      });
    }
  };

  // Función para cargar plantilla de Email
  const cargarPlantillaEmail = (plantillaId: string) => {
    if (!plantillaId || plantillaId === "sin-plantilla") {
      setPlantillaEmailSeleccionada("sin-plantilla");
      return;
    }
    
    const plantilla = plantillasEmail.find(p => p.id.toString() === plantillaId);
    if (plantilla) {
      setMensajeEmail(plantilla.mensaje);
      if (plantilla.asunto) {
        setAsuntoEmail(plantilla.asunto);
      }
      setPlantillaEmailSeleccionada(plantillaId);
      toast({
        title: "Plantilla cargada",
        description: `Plantilla "${plantilla.nombre}" cargada correctamente`,
      });
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'aprobado':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Aprobado</Badge>;
      case 'rechazado':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Rechazado</Badge>;
      case 'pendiente':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pendiente</Badge>;
      default:
        return <Badge variant="secondary">{estado}</Badge>;
    }
  };

  return (
    <div className="page-container p-6">
      <div className="page-header mb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <QrCode className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Gestión de Códigos QR</h1>
          </div>
        </div>
      </div>

      <Tabs defaultValue="generar" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="generar" className="flex items-center gap-2">
            <QrCode className="w-4 h-4" />
            Generar QR
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            WhatsApp
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="configuracion" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configuración
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generar" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <QrCode className="w-5 h-5 mr-2" />
                Generar Códigos QR
              </CardTitle>
              <CardDescription>
                Genera códigos QR individuales para candidatos aprobados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {candidatos.filter(c => c.estado === 'aprobado').map((candidato) => (
                  <div key={candidato.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="font-medium">{candidato.nombre} {candidato.apellido}</h3>
                        <p className="text-sm text-gray-600">{candidato.cedula} • {candidato.empresa}</p>
                      </div>
                      {candidato.qrGenerado ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          QR Generado
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <Clock className="w-3 h-3 mr-1" />
                          Pendiente
                        </Badge>
                      )}
                    </div>
                    <Button
                      onClick={() => generateQR(candidato)}
                      disabled={candidato.qrGenerado}
                      size="sm"
                    >
                      {candidato.qrGenerado ? (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Descargar
                        </>
                      ) : (
                        <>
                          <QrCode className="w-4 h-4 mr-2" />
                          Generar QR
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="whatsapp" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Enviar por WhatsApp
                </CardTitle>
                <CardDescription>
                  Configura y envía códigos QR a través de WhatsApp
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Selector de plantilla */}
                <div className="space-y-2">
                  <Label htmlFor="plantilla-whatsapp">Seleccionar Plantilla</Label>
                  <Select value={plantillaWhatsAppSeleccionada} onValueChange={cargarPlantillaWhatsApp}>
                    <SelectTrigger>
                      <SelectValue placeholder="Elige una plantilla de mensaje" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sin-plantilla">Sin plantilla (mensaje personalizado)</SelectItem>
                      {plantillasWhatsApp.map((plantilla) => (
                        <SelectItem key={plantilla.id} value={plantilla.id.toString()}>
                          {plantilla.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Mensaje personalizado</label>
                  <Textarea
                    value={mensajeWhatsApp}
                    onChange={(e) => setMensajeWhatsApp(e.target.value)}
                    rows={8}
                    className="mt-1"
                    placeholder="Escribe tu mensaje aquí..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Variables disponibles: {'{{nombre}}'}, {'{{empresa}}'}
                  </p>
                </div>
                
                {selectedCandidatos.length > 0 && (
                  <Button 
                    onClick={sendWhatsApp}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    size="lg"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Enviar a {selectedCandidatos.length} candidatos
                  </Button>
                )}
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
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {candidatos.filter(c => c.qrGenerado).map((candidato) => (
                    <div key={candidato.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                      <input
                        type="checkbox"
                        checked={selectedCandidatos.includes(candidato.id)}
                        onChange={() => toggleCandidato(candidato.id)}
                        className="rounded"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{candidato.nombre} {candidato.apellido}</p>
                        <p className="text-xs text-gray-600">{candidato.telefono}</p>
                      </div>
                      {getEstadoBadge(candidato.estado)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="email" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="w-5 h-5 mr-2" />
                  Enviar por Email
                </CardTitle>
                <CardDescription>
                  Configura y envía códigos QR por correo electrónico
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Selector de plantilla */}
                <div className="space-y-2">
                  <Label htmlFor="plantilla-email">Seleccionar Plantilla</Label>
                  <Select value={plantillaEmailSeleccionada} onValueChange={cargarPlantillaEmail}>
                    <SelectTrigger>
                      <SelectValue placeholder="Elige una plantilla de email" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sin-plantilla">Sin plantilla (email personalizado)</SelectItem>
                      {plantillasEmail.map((plantilla) => (
                        <SelectItem key={plantilla.id} value={plantilla.id.toString()}>
                          {plantilla.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Asunto del email</label>
                  <Input
                    value={asuntoEmail}
                    onChange={(e) => setAsuntoEmail(e.target.value)}
                    className="mt-1"
                    placeholder="Asunto del correo"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Mensaje del email</label>
                  <Textarea
                    value={mensajeEmail}
                    onChange={(e) => setMensajeEmail(e.target.value)}
                    rows={10}
                    className="mt-1"
                    placeholder="Contenido del correo..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Variables: {'{{nombre}}'}, {'{{cedula}}'}, {'{{email}}'}, {'{{empresa}}'}, {'{{fecha}}'}
                  </p>
                </div>
                
                {selectedCandidatos.length > 0 && (
                  <Button 
                    onClick={sendEmail}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    size="lg"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Enviar a {selectedCandidatos.length} candidatos
                  </Button>
                )}
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
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {candidatos.filter(c => c.qrGenerado).map((candidato) => (
                    <div key={candidato.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                      <input
                        type="checkbox"
                        checked={selectedCandidatos.includes(candidato.id)}
                        onChange={() => toggleCandidato(candidato.id)}
                        className="rounded"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{candidato.nombre} {candidato.apellido}</p>
                        <p className="text-xs text-gray-600">{candidato.email}</p>
                      </div>
                      {getEstadoBadge(candidato.estado)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="configuracion" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Configuración de QR
              </CardTitle>
              <CardDescription>
                Configura los parámetros de generación y envío de códigos QR
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Plantillas de WhatsApp</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      {plantillasWhatsApp.length} plantillas disponibles
                    </p>
                  </div>
                  <div>
                    <Label>Plantillas de Email</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      {plantillasEmail.length} plantillas disponibles
                    </p>
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-blue-900">
                        Información sobre plantillas
                      </h4>
                      <p className="text-sm text-blue-800">
                        Las plantillas permiten personalizar automáticamente los mensajes con las variables disponibles. 
                        Puedes editar el mensaje después de seleccionar una plantilla.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
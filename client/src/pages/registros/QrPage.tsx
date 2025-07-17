import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QrCode, MessageSquare, Mail, Settings, Download, Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

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

export default function QrPage() {
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
      title: "Enviado",
      description: `QR enviado por WhatsApp a ${candidatosSeleccionados.length} candidatos`,
    });
  };

  const sendEmail = async () => {
    const candidatosSeleccionados = candidatos.filter(c => selectedCandidatos.includes(c.id));
    
    // Simular envío de email
    toast({
      title: "Enviado", 
      description: `QR enviado por email a ${candidatosSeleccionados.length} candidatos`,
    });
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'aprobado':
        return <Badge className="bg-green-100 text-green-800">Aprobado</Badge>;
      case 'rechazado':
        return <Badge className="bg-red-100 text-red-800">Rechazado</Badge>;
      case 'pendiente':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
      default:
        return <Badge variant="secondary">{estado}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Códigos QR</h1>
          <p className="text-gray-600">Genera y envía códigos QR a candidatos aprobados</p>
        </div>
      </div>

      <Tabs defaultValue="generar" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="generar">Generar QR</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="configuracion">Configuración</TabsTrigger>
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
                        <h4 className="font-medium">{candidato.nombre} {candidato.apellido}</h4>
                        <p className="text-sm text-gray-600">
                          {candidato.cedula} • {candidato.empresa}
                        </p>
                      </div>
                      {candidato.qrGenerado ? (
                        <Badge className="bg-green-100 text-green-800">QR Generado</Badge>
                      ) : (
                        <Badge variant="secondary">Sin QR</Badge>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => generateQR(candidato)}
                        size="sm"
                        disabled={candidato.qrGenerado}
                      >
                        <QrCode className="w-4 h-4 mr-1" />
                        {candidato.qrGenerado ? 'Regenerar' : 'Generar'}
                      </Button>
                      {candidato.qrGenerado && (
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-1" />
                          Descargar
                        </Button>
                      )}
                    </div>
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
                  Envío por WhatsApp
                </CardTitle>
                <CardDescription>
                  Selecciona candidatos y personaliza el mensaje
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Mensaje</label>
                  <Textarea
                    value={mensajeWhatsApp}
                    onChange={(e) => setMensajeWhatsApp(e.target.value)}
                    rows={6}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Variables: {'{'}nombre{'}'}, {'{'}empresa{'}'}
                  </p>
                </div>
                <Button
                  onClick={sendWhatsApp}
                  disabled={selectedCandidatos.length === 0}
                  className="w-full"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Enviar a {selectedCandidatos.length} candidatos
                </Button>
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
                    Variables: {'{'}nombre{'}'}, {'{'}cedula{'}'}, {'{'}email{'}'}, {'{'}empresa{'}'}, {'{'}fecha{'}'}
                  </p>
                </div>
                <Button
                  onClick={sendEmail}
                  disabled={selectedCandidatos.length === 0}
                  className="w-full"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Enviar a {selectedCandidatos.length} candidatos
                </Button>
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
                Configura los parámetros de generación de códigos QR
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Período de renovación</label>
                  <Select defaultValue="30-dias">
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15-dias">15 días</SelectItem>
                      <SelectItem value="30-dias">30 días</SelectItem>
                      <SelectItem value="60-dias">60 días</SelectItem>
                      <SelectItem value="90-dias">90 días</SelectItem>
                      <SelectItem value="6-meses">6 meses</SelectItem>
                      <SelectItem value="1-año">1 año</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Tamaño del QR</label>
                  <Select defaultValue="300">
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="200">200x200px</SelectItem>
                      <SelectItem value="300">300x300px</SelectItem>
                      <SelectItem value="400">400x400px</SelectItem>
                      <SelectItem value="500">500x500px</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button>Guardar Configuración</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
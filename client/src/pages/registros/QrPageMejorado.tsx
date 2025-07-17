import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QrCode, MessageSquare, Mail, Settings, Download, Send, ArrowRight } from 'lucide-react';
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
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header mejorado con flecha más grande y a la derecha */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <QrCode className="h-8 w-8 text-green-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestión de Códigos QR</h1>
              <p className="text-gray-600">Generar, configurar y enviar códigos QR a candidatos</p>
            </div>
          </div>
          {/* Flecha más grande y posicionada más a la derecha */}
          <div className="flex items-center">
            <ArrowRight className="h-12 w-12 text-green-600 ml-8" />
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Candidatos Aprobados</CardTitle>
                <CardDescription>
                  Generar códigos QR para candidatos aprobados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {candidatos.filter(c => c.estado === 'aprobado').map((candidato) => (
                    <div key={candidato.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <h4 className="font-medium">{candidato.nombre} {candidato.apellido}</h4>
                        <p className="text-sm text-gray-600">{candidato.cedula} • {candidato.empresa}</p>
                        <p className="text-xs text-gray-500">{candidato.email}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {getEstadoBadge(candidato.estado)}
                        {candidato.qrGenerado ? (
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200">QR Generado</Badge>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => generateQR(candidato)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <QrCode className="w-4 h-4 mr-1" />
                            Generar
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estadísticas de QR</CardTitle>
                <CardDescription>
                  Resumen del estado de códigos QR
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-2xl font-bold text-green-700">
                        {candidatos.filter(c => c.qrGenerado).length}
                      </div>
                      <div className="text-sm text-green-600">QR Generados</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-2xl font-bold text-blue-700">
                        {candidatos.filter(c => c.estado === 'aprobado').length}
                      </div>
                      <div className="text-sm text-blue-600">Candidatos Aprobados</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="text-2xl font-bold text-yellow-700">
                        {candidatos.filter(c => c.estado === 'pendiente').length}
                      </div>
                      <div className="text-sm text-yellow-600">Pendientes</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-2xl font-bold text-gray-700">
                        {candidatos.length}
                      </div>
                      <div className="text-sm text-gray-600">Total Candidatos</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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
                  <label className="text-sm font-medium">Formato de QR</label>
                  <Select defaultValue="png">
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="png">PNG</SelectItem>
                      <SelectItem value="jpg">JPG</SelectItem>
                      <SelectItem value="svg">SVG</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Tamaño del QR</label>
                  <Select defaultValue="256">
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="128">128x128 px</SelectItem>
                      <SelectItem value="256">256x256 px</SelectItem>
                      <SelectItem value="512">512x512 px</SelectItem>
                      <SelectItem value="1024">1024x1024 px</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Nivel de corrección</label>
                  <Select defaultValue="M">
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="L">Bajo (L)</SelectItem>
                      <SelectItem value="M">Medio (M)</SelectItem>
                      <SelectItem value="Q">Alto (Q)</SelectItem>
                      <SelectItem value="H">Muy Alto (H)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-4">
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  <Settings className="w-4 h-4 mr-2" />
                  Guardar Configuración
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
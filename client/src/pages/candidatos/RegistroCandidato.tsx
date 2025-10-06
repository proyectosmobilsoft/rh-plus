import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from "sonner";
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  FileText,
  Upload,
  IdCard
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TipoCandidatoSelector } from '@/components/candidatos/TipoCandidatoSelector';
import { useTiposCandidatos } from '@/hooks/useTiposCandidatos';

const registroSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string(),
  nombres: z.string().min(2, 'Los nombres son requeridos'),
  apellidos: z.string().min(2, 'Los apellidos son requeridos'),
  tipoDocumento: z.string().min(1, 'Seleccione el tipo de documento'),
  numeroDocumento: z.string().min(6, 'Número de documento requerido'),
  telefono: z.string().min(10, 'Teléfono debe tener al menos 10 dígitos'),
  tipoCandidatoId: z.number().min(1, 'Debe seleccionar un tipo de candidato'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type RegistroForm = z.infer<typeof registroSchema>;

export default function RegistroCandidato() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedTipoId, setSelectedTipoId] = useState<number | null>(null);
  const [documentosCargados, setDocumentosCargados] = useState<Record<number, { 
    archivo?: File; 
    fechaVigencia?: string; 
    observaciones?: string 
  }>>({});
  const navigate = useNavigate();

  // Hook para obtener tipos de candidatos
  const { tiposCandidatosActivos, isLoading: loadingTipos } = useTiposCandidatos();

  // Debug: mostrar información de tipos de candidatos
  console.log('🔍 RegistroCandidato - Tipos de candidatos activos:', tiposCandidatosActivos);
  console.log('🔍 RegistroCandidato - Estado de carga:', loadingTipos);
  console.log('🔍 RegistroCandidato - Total de tipos:', tiposCandidatosActivos.length);

  const form = useForm<RegistroForm>({
    resolver: zodResolver(registroSchema),
    defaultValues: {
      nombres: '',
      apellidos: '',
      email: '',
      telefono: '',
      password: '',
      confirmPassword: '',
      tipoCandidatoId: 0,
    },
  });

  const handleTipoChange = (tipoId: number | null) => {
    setSelectedTipoId(tipoId);
    form.setValue('tipoCandidatoId', tipoId || 0);
  };

  const handleDocumentoChange = (documentoId: number, data: { 
    archivo?: File; 
    fechaVigencia?: string; 
    observaciones?: string 
  }) => {
    setDocumentosCargados(prev => ({
      ...prev,
      [documentoId]: data
    }));
  };

  const onSubmit = async (data: RegistroForm) => {
    setIsLoading(true);
    try {
      const { confirmPassword, ...registroData } = data;
      
      // Crear FormData para enviar archivos
      const formData = new FormData();
      
      // Agregar datos básicos del candidato
      Object.entries(registroData).forEach(([key, value]) => {
        formData.append(key, value.toString());
      });

      // Agregar documentos
      Object.entries(documentosCargados).forEach(([documentoId, documentoData]) => {
        if (documentoData.archivo) {
          formData.append(`documentos[${documentoId}][archivo]`, documentoData.archivo);
          if (documentoData.fechaVigencia) {
            formData.append(`documentos[${documentoId}][fechaVigencia]`, documentoData.fechaVigencia);
          }
          if (documentoData.observaciones) {
            formData.append(`documentos[${documentoId}][observaciones]`, documentoData.observaciones);
          }
        }
      });

      const response = await fetch('/api/candidato/register', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Registro exitoso. Ahora puedes completar tu perfil.');
        navigate('/candidato/perfil');
      } else {
        toast.error(result.message || 'Error al registrarse');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  const documentosCargadosCount = Object.values(documentosCargados).filter(doc => doc.archivo).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Registro de Candidato</h1>
          <p className="text-gray-600 mt-2">Crea tu perfil para postularte a empleos</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Información del Candidato</CardTitle>
            <CardDescription className="text-center">
              Complete los datos requeridos y cargue los documentos necesarios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="datos" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="datos">Datos y Tipo</TabsTrigger>
                <TabsTrigger value="resumen">Resumen</TabsTrigger>
              </TabsList>

              <TabsContent value="datos" className="space-y-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="nombres"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombres *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input {...field} placeholder="Juan Carlos" className="pl-10" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="apellidos"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Apellidos *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Pérez García" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="tipoDocumento"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de Documento *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccione tipo de documento" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
                                <SelectItem value="CE">Cédula de Extranjería</SelectItem>
                                <SelectItem value="TI">Tarjeta de Identidad</SelectItem>
                                <SelectItem value="PP">Pasaporte</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="numeroDocumento"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número de Documento *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <IdCard className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input {...field} placeholder="12345678" className="pl-10" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input {...field} type="email" placeholder="juan@ejemplo.com" className="pl-10" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="telefono"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Teléfono *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input {...field} placeholder="3001234567" className="pl-10" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Select de Tipo de Candidato */}
                    <div className="space-y-4">
                      <div className="border-t pt-4">
                        <h3 className="text-lg font-medium mb-4">Tipo de Candidato</h3>
                        <FormField
                          control={form.control}
                          name="tipoCandidatoId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipo de Candidato *</FormLabel>
                              <Select onValueChange={(value) => {
                                field.onChange(parseInt(value));
                                handleTipoChange(parseInt(value));
                              }} defaultValue={field.value?.toString()}>
                                <FormControl>
                                  <SelectTrigger disabled={loadingTipos}>
                                    <SelectValue placeholder={
                                      loadingTipos 
                                        ? "Cargando tipos de candidatos..." 
                                        : "Seleccione su tipo de candidato"
                                    } />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {loadingTipos ? (
                                    <SelectItem value="" disabled>
                                      Cargando...
                                    </SelectItem>
                                  ) : tiposCandidatosActivos.length === 0 ? (
                                    <SelectItem value="" disabled>
                                      No hay tipos disponibles
                                    </SelectItem>
                                  ) : (
                                    tiposCandidatosActivos.map(tipo => (
                                      <SelectItem key={tipo.id} value={tipo.id.toString()}>
                                        {tipo.nombre}
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contraseña *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                  {...field}
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Mínimo 6 caracteres"
                                  className="pl-10 pr-10"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                  onClick={() => setShowPassword(!showPassword)}
                                >
                                  {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirmar Contraseña *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                  {...field}
                                  type={showConfirmPassword ? "text" : "password"}
                                  placeholder="Repita la contraseña"
                                  className="pl-10 pr-10"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                  {showConfirmPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-between">
                      <Button type="button" variant="outline" onClick={() => navigate('/candidato/login')}>
                        Ya tengo cuenta
                      </Button>
                      <Button type="submit" disabled={isLoading || !selectedTipoId}>
                        {isLoading ? 'Registrando...' : 'Completar Registro'}
                      </Button>
                    </div>

                    {/* Documentos Requeridos */}
                    {selectedTipoId && (
                      <div className="border-t pt-4">
                        <h3 className="text-lg font-medium mb-4">Documentos Requeridos</h3>
                        <TipoCandidatoSelector
                          selectedTipoId={selectedTipoId}
                          onTipoChange={handleTipoChange}
                          documentosCargados={documentosCargados}
                          onDocumentoChange={handleDocumentoChange}
                        />
                      </div>
                    )}
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="resumen" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Resumen del Registro</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Datos Personales</h4>
                        <div className="space-y-1 text-sm">
                          <p><strong>Nombres:</strong> {form.watch('nombres') || 'No especificado'}</p>
                          <p><strong>Apellidos:</strong> {form.watch('apellidos') || 'No especificado'}</p>
                          <p><strong>Email:</strong> {form.watch('email') || 'No especificado'}</p>
                          <p><strong>Teléfono:</strong> {form.watch('telefono') || 'No especificado'}</p>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Tipo y Documentos</h4>
                        <div className="space-y-1 text-sm">
                          <p><strong>Tipo de candidato:</strong> {
                            selectedTipoId === 1 ? 'Ingeniero de Sistemas' :
                            selectedTipoId === 2 ? 'Diseñador Gráfico' :
                            selectedTipoId === 3 ? 'Administrador' :
                            selectedTipoId === 4 ? 'Técnico' :
                            selectedTipoId === 5 ? 'Auxiliar' :
                            'No seleccionado'
                          }</p>
                          <p><strong>Documentos cargados:</strong> {documentosCargadosCount}</p>
                        </div>
                      </div>
                    </div>

                    {documentosCargadosCount > 0 && (
                      <Alert>
                        <FileText className="h-4 w-4" />
                        <AlertDescription>
                          Se han cargado {documentosCargadosCount} documento(s) requerido(s).
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex justify-between">
                      <Button type="button" variant="outline" onClick={() => navigate('/candidato/login')}>
                        Cancelar
                      </Button>
                      <Button 
                        type="button" 
                        onClick={() => form.handleSubmit(onSubmit)()}
                        disabled={isLoading || !selectedTipoId}
                      >
                        {isLoading ? 'Registrando...' : 'Completar Registro'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


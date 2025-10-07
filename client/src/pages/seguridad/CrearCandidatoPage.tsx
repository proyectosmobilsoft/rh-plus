import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, UserPlus } from "lucide-react";

import { createCandidatoFromPerfilSchema, type CreateCandidatoFromPerfil } from "@shared/schema";
import { toast } from "sonner";

const CrearCandidatoPage = () => {
  
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CreateCandidatoFromPerfil>({
    resolver: zodResolver(createCandidatoFromPerfilSchema),
    defaultValues: {
      nombres: '',
      apellidos: '',
      cedula: '',
      email: '',
      telefono: '',
      tipoDocumento: 'CC',
    },
  });

  const onSubmit = async (data: CreateCandidatoFromPerfil) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/perfiles/create-candidato', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success(`Se ha creado la cuenta para ${data.nombres} ${data.apellidos}. Usuario: ${data.email}, Contraseña inicial: ${data.cedula}`);
        form.reset();
        // Redirigir de vuelta a la página de perfiles después de 2 segundos
        setTimeout(() => {
          window.location.href = '/seguridad/perfiles';
        }, 2000);
      } else {
        const errorData = await response.json();
        const isDuplicate =
          errorData?.code === '23505' ||
          (typeof errorData?.message === 'string' &&
            (errorData.message.includes('usuarios_email_key') ||
              errorData.message.toLowerCase().includes('duplicate key')));

        if (isDuplicate) {
          toast.warning("Ya existe un candidato con este correo", {
            description:
              "No es necesario volver a crearlo. Puedes buscarlo en la lista de perfiles o usar otro correo para un candidato nuevo.",
          });
        } else {
          toast.error(errorData.message || "No se pudo crear el candidato");
        }
      }
    } catch (error) {
      toast.error("No se pudo conectar con el servidor");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container p-6">
      <div className="page-header mb-6">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/seguridad/perfiles'}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-brand-lime">Crear Candidato</h1>
            <p className="text-gray-600">
              Crea una nueva cuenta de candidato con información básica
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-brand-lime">
              <UserPlus className="h-5 w-5" />
              <span>Información del Candidato</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="tipoDocumento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Documento</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
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
                    name="cedula"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Documento</FormLabel>
                        <FormControl>
                          <Input placeholder="12345678" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="nombres"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombres</FormLabel>
                        <FormControl>
                          <Input placeholder="Ana María" {...field} />
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
                        <FormLabel>Apellidos</FormLabel>
                        <FormControl>
                          <Input placeholder="García López" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo Electrónico</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="ana.garcia@ejemplo.com" {...field} />
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
                      <FormLabel>Número de Celular</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="3001234567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="bg-brand-lime/10 p-4 rounded-lg border border-brand-lime/20">
                  <h3 className="font-medium text-brand-lime mb-2">Información importante:</h3>
                  <ul className="text-sm text-brand-lime space-y-1">
                    <li>• El usuario para iniciar sesión será el correo electrónico ingresado</li>
                    <li>• La contraseña inicial será el número de documento</li>
                    <li>• El candidato deberá cambiar la contraseña en su primer inicio de sesión</li>
                  </ul>
                </div>

                <div className="flex justify-end space-x-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => window.location.href = '/seguridad/perfiles'}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-brand-lime hover:bg-brand-lime/90" 
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creando candidato...' : 'Crear Candidato'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CrearCandidatoPage;




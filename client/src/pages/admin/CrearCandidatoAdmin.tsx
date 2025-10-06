import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from "sonner";
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  IdCard, 
  Save,
  UserPlus
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { candidatosService } from '@/services/candidatosService';
import { usuariosService } from '@/services/usuariosService';
import { supabase } from '@/services/supabaseClient';

const candidatoSimpleSchema = z.object({
  nombres: z.string().min(2, 'Nombres requeridos'),
  apellidos: z.string().min(2, 'Apellidos requeridos'),
  cedula: z.string().min(6, 'Cédula requerida'),
  email: z.string().email('Email inválido'),
  tipoDocumento: z.string().min(1, 'Tipo de documento requerido'),
});

type CandidatoSimpleForm = z.infer<typeof candidatoSimpleSchema>;

export default function CrearCandidatoAdmin() {
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  const form = useForm<CandidatoSimpleForm>({
    resolver: zodResolver(candidatoSimpleSchema),
    defaultValues: {
      nombres: '',
      apellidos: '',
      cedula: '',
      email: '',
      tipoDocumento: 'CC',
    },
  });

  const onSubmit = async (data: CandidatoSimpleForm) => {
    console.log('Formulario enviado con datos:', data);
    setIsSaving(true);
    
    try {
      console.log('Iniciando creación de candidato...');
      
      // Verificar si el email ya existe
      console.log('Verificando email existente...');
      const { data: existingUser, error: checkError } = await supabase
        .from('gen_usuarios')
        .select('id')
        .eq('email', data.email)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error verificando email:', checkError);
        toast.error('Error verificando email existente');
        return;
      }

      if (existingUser) {
        console.log('Email ya existe:', existingUser);
        toast.error('Ya existe un usuario con este email');
        return;
      }

      console.log('Email disponible, creando usuario...');

      // 1. Crear el usuario en gen_usuarios
      // Generar username único basado en el email
      const username = `${data.email.split('@')[0]}_${Date.now()}`;
      
      const usuarioData = {
        identificacion: data.cedula,
        primer_nombre: data.nombres,
        segundo_nombre: '',
        primer_apellido: data.apellidos,
        segundo_apellido: '',
        telefono: '',
        email: data.email,
        username: username, // Username único
        activo: true,
      };

      console.log('Datos del usuario a crear:', usuarioData);

      // Crear usuario con rol de candidato (ID 15)
      const usuarioCreado = await usuariosService.createUsuario(
        usuarioData,
        data.cedula, // La cédula como contraseña inicial
        [15], // Rol de candidato
        [] // Sin empresas asignadas por defecto
      );

      console.log('Usuario creado:', usuarioCreado);

      if (usuarioCreado) {
        console.log('Creando candidato...');
        // 2. Crear el candidato en la tabla candidatos
        const candidatoData = {
          tipo_documento: data.tipoDocumento,
          numero_documento: data.cedula,
          primer_nombre: data.nombres,
          primer_apellido: data.apellidos,
          email: data.email,
          telefono: '',
          direccion: '',
          ciudad: '',
          empresa_id: 1, // Empresa por defecto
        };

        console.log('Datos del candidato a crear:', candidatoData);

        const candidatoCreado = await candidatosService.create(candidatoData);

        console.log('Candidato creado:', candidatoCreado);

        if (candidatoCreado) {
          toast.success(
            `Candidato creado exitosamente. Usuario: ${data.email}, Contraseña inicial: ${data.cedula}`
          );
          form.reset();
          // Redirigir después de 3 segundos
          setTimeout(() => {
            navigate('/registros/candidatos');
          }, 3000);
        } else {
          toast.error('Error creando candidato');
        }
      } else {
        toast.error('Error creando usuario');
      }
    } catch (error: any) {
      console.error('Error completo:', error);
      toast.error(error.message || 'Error creando candidato');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/registros/candidatos')}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Crear Candidato</h1>
                <p className="text-sm text-gray-600">
                  Crear un nuevo candidato con acceso al portal
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">Registro de Candidato</CardTitle>
            <CardDescription>
              Complete los datos básicos del candidato. Se generará automáticamente una cuenta con acceso al portal.
            </CardDescription>
          </CardHeader>
          <CardContent>
                         <Form {...form}>
               <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" onError={(errors) => console.log('Errores de validación:', errors)}>
                {/* Información Personal */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 border-b border-green-200 pb-2">
                    Datos Personales
                  </h3>
                  
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
                            <Input {...field} placeholder="Pérez González" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tipoDocumento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Documento *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar" />
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
                          <FormLabel>Cédula *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <IdCard className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input {...field} placeholder="1234567890" className="pl-10" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input {...field} placeholder="candidato@ejemplo.com" className="pl-10" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                                 {/* Botones */}
                 <div className="flex justify-end space-x-4 pt-6 border-t">
                   <Button
                     type="button"
                     variant="outline"
                     onClick={() => navigate('/registros/candidatos')}
                   >
                     Cancelar
                   </Button>
                   <Button
                     type="button"
                     variant="outline"
                     onClick={() => {
                       console.log('Estado del formulario:', form.getValues());
                       console.log('Errores del formulario:', form.formState.errors);
                     }}
                   >
                     Debug
                   </Button>
                   <Button
                     type="submit"
                     disabled={isSaving}
                     className="px-8"
                   >
                     {isSaving ? (
                       <>
                         <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                         Creando...
                       </>
                     ) : (
                       <>
                         <UserPlus className="w-4 h-4 mr-2" />
                         Crear Candidato
                       </>
                     )}
                   </Button>
                 </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
} 


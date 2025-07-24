import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, UserCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useApiData } from '@/hooks/useApiData';
import { API_URL } from '@/services/api';

// Nuevo schema de validación para editar, igual que en crear
const analistaSchema = z.object({
  username: z.string().min(3, 'El nombre de usuario debe tener al menos 3 caracteres'),
  email: z.string().email('Ingrese un email válido'),
  password: z.string().optional(), // No es obligatorio al editar
  primer_nombre: z.string().min(2, 'El primer nombre debe tener al menos 2 caracteres'),
  segundo_nombre: z.string().optional(),
  primer_apellido: z.string().min(2, 'El primer apellido debe tener al menos 2 caracteres'),
  segundo_apellido: z.string().optional(),
  nivelPrioridad: z.enum(['alto', 'medio', 'bajo']).default('medio'),
  activo: z.boolean().default(true)
});

type AnalistaFormData = z.infer<typeof analistaSchema>;

export default function EditarAnalistaPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // Cambia la obtención del analista para usar .data si existe
  const { data: apiResponse, isLoading, fetchData } = useApiData<any>(
    `analistas/${id}`,
    {} as any,
    { showSuccessToast: false }
  );
  const analista = apiResponse?.data || apiResponse || {};

  // Inicializar el formulario con los datos del analista
  const form = useForm<AnalistaFormData>({
    resolver: zodResolver(analistaSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      primer_nombre: '',
      segundo_nombre: '',
      primer_apellido: '',
      segundo_apellido: '',
      nivelPrioridad: 'medio',
      activo: true
    },
  });

  // Forzar fetch de datos cada vez que cambie el id
  useEffect(() => {
    fetchData();
  }, [id, fetchData]);

  // Cuando llegan los datos, prellenar el formulario
  useEffect(() => {
    if (analista && analista.id) {
      form.reset({
        username: analista.username || '',
        email: analista.email || '',
        password: '', // No mostrar la contraseña
        primer_nombre: analista.primer_nombre || analista.nombre || '',
        segundo_nombre: analista.segundo_nombre || '',
        primer_apellido: analista.primer_apellido || analista.apellido || '',
        segundo_apellido: analista.segundo_apellido || '',
        nivelPrioridad: analista.nivelPrioridad || 'medio',
        activo: analista.activo !== undefined ? analista.activo : true
      })
    }
  }, [analista, form]);

  // Log de depuración para ver el analista y el id
  // (Eliminados los console.log de depuración innecesarios, solo queda el de datos enviados al backend)

  const onSubmit = async (data: AnalistaFormData) => {
    try {
      console.log('Datos enviados al backend (editar):', data);
      // No enviar password si está vacío
      const payload = { ...data };
      if (!payload.password) delete payload.password;
      const response = await fetch(`${API_URL}analistas/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success('Analista actualizado exitosamente');
        navigate('/analistas');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Error al actualizar analista');
      }
    } catch (error) {
      console.error('Error actualizando analista:', error);
      toast.error('Error al actualizar analista');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Cargando datos del analista...</div>
      </div>
    );
  }

  // Solo muestra 'Analista no encontrado' si apiResponse es null o undefined
  if (apiResponse == null) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">Analista no encontrado</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="outline"
          onClick={() => navigate('/analistas')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Button>
        <div className="flex items-center gap-3">
          <UserCheck className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Editar Analista</h1>
            <p className="text-gray-600 mt-2">
              Modifica la información del analista
            </p>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="bg-blue-50">
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <UserCheck className="w-5 h-5" />
            Datos del Analista
          </CardTitle>
          <CardDescription>
            Modifica la información del analista
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Información de Acceso */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-blue-800 border-b border-blue-200 pb-2">
                  Información de Acceso
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre de Usuario *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre de usuario" {...field} />
                        </FormControl>
                        <FormDescription>
                          El nombre de usuario para iniciar sesión
                        </FormDescription>
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
                          <Input type="email" placeholder="correo@ejemplo.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              {/* Información Personal */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-blue-800 border-b border-blue-200 pb-2">
                  Información Personal
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="primer_nombre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primer Nombre *</FormLabel>
                        <FormControl>
                          <Input placeholder="Primer nombre" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="segundo_nombre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Segundo Nombre</FormLabel>
                        <FormControl>
                          <Input placeholder="Segundo nombre" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="primer_apellido"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primer Apellido *</FormLabel>
                        <FormControl>
                          <Input placeholder="Primer apellido" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="segundo_apellido"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Segundo Apellido</FormLabel>
                        <FormControl>
                          <Input placeholder="Segundo apellido" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              {/* Estado y Nivel */}
              <div className="flex items-center gap-8">
                <FormField
                  control={form.control}
                  name="activo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Activo</FormLabel>
                      <input type="checkbox" checked={field.value} onChange={e => field.onChange(e.target.checked)} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nivelPrioridad"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nivel de Prioridad</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Nivel" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="alto">Alto</SelectItem>
                          <SelectItem value="medio">Medio</SelectItem>
                          <SelectItem value="bajo">Bajo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {/* Botones */}
              <div className="flex justify-end gap-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/analistas')}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={form.formState.isSubmitting}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {form.formState.isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Shield, AlertTriangle, Check, X } from 'lucide-react';
import { supabase } from '@/services/supabaseClient';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Upload, User } from 'lucide-react';

const cambiarPasswordSchema = z.object({
  passwordActual: z.string().min(1, 'Contraseña actual requerida'),
  passwordNueva: z.string()
    .min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'La contraseña debe contener al menos una mayúscula, una minúscula y un número'),
  confirmarPassword: z.string(),
  foto: z.string().min(1, 'Debe cargar una foto de perfil'),
  autorizacionDatos: z.boolean().refine((val) => val === true, {
    message: "Debe autorizar el uso de sus datos personales",
  }),
}).refine((data) => data.passwordNueva === data.confirmarPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmarPassword"],
});

type CambiarPasswordForm = z.infer<typeof cambiarPasswordSchema>;

export default function CambiarPassword() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [isSystemUser, setIsSystemUser] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar si hay datos de usuario en localStorage
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      const parsedUserData = JSON.parse(storedUserData);
      setUserData(parsedUserData);
      
      // Determinar si es usuario del sistema o candidato
      // Los usuarios del sistema tienen roles y empresas, los candidatos no
      const isSystem = parsedUserData.roles && parsedUserData.roles.length > 0;
      setIsSystemUser(isSystem);
    }
  }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar que sea una imagen
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor selecciona un archivo de imagen válido');
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen debe ser menor a 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        form.setValue('foto', result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Función para verificar si el formulario está completo
  const isFormComplete = () => {
    const values = form.getValues();
    return (
      values.passwordActual &&
      values.passwordNueva &&
      values.confirmarPassword &&
      values.passwordNueva === values.confirmarPassword &&
      values.foto &&
      values.autorizacionDatos &&
      form.formState.isValid
    );
  };

  // Función para validar los requisitos de la contraseña
  const validatePasswordRequirements = (password: string) => {
    return {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
    };
  };

  // Función para obtener el progreso de completado
  const getCompletionProgress = () => {
    const values = form.getValues();
    let completed = 0;
    const total = 5;

    if (values.passwordActual) completed++;
    if (values.passwordNueva && values.confirmarPassword && values.passwordNueva === values.confirmarPassword) completed++;
    if (values.foto) completed++;
    if (values.autorizacionDatos) completed++;
    if (form.formState.isValid) completed++;

    return { completed, total, percentage: (completed / total) * 100 };
  };

  const form = useForm<CambiarPasswordForm>({
    resolver: zodResolver(cambiarPasswordSchema),
    defaultValues: {
      passwordActual: '',
      passwordNueva: '',
      confirmarPassword: '',
      foto: '',
      autorizacionDatos: false,
    },
  });

  const onSubmit = async (data: CambiarPasswordForm) => {
    setIsLoading(true);
    try {
      if (isSystemUser) {
        // Para usuarios del sistema, usar Supabase directamente
        if (!userData || !userData.id) {
          toast.error('No se encontraron datos de usuario');
          return;
        }

        // Verificar que la contraseña actual sea correcta
        const { data: user, error: userError } = await supabase
          .from('gen_usuarios')
          .select('password')
          .eq('id', userData.id)
          .single();

        if (userError || !user) {
          toast.error('Error al verificar la contraseña actual');
          return;
        }

        // Verificar que la contraseña actual coincida
        if (user.password !== data.passwordActual) {
          toast.error('La contraseña actual no es correcta');
          return;
        }

        // Actualizar la contraseña y la foto
        const { error: updateError } = await supabase
          .from('gen_usuarios')
          .update({ 
            password: data.passwordNueva,
            foto_base64: data.foto
          })
          .eq('id', userData.id);

        if (updateError) {
          toast.error('Error al actualizar la contraseña');
          return;
        }

        toast.success('Contraseña y foto de perfil actualizadas exitosamente');
        
        // Limpiar localStorage y redirigir al login
        localStorage.removeItem('userData');
        localStorage.removeItem('authToken');
        navigate('/login');
      } else {
        // Para candidatos, usar la API existente
        const response = await fetch('/api/candidato/cambiar-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            passwordActual: data.passwordActual,
            passwordNueva: data.passwordNueva,
          }),
        });

        const result = await response.json();

        if (response.ok) {
          toast.success('Contraseña actualizada exitosamente');
          navigate('/candidato/perfil');
        } else {
          toast.error(result.message || 'Error al cambiar la contraseña');
        }
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Cambio de Contraseña</h1>
          <p className="text-gray-600 mt-2">
            {isSystemUser ? 'Sistema de Recursos Humanos' : 'Portal de Candidatos'}
          </p>
        </div>

        <Card className="shadow-lg border-amber-200">
          <CardHeader className="space-y-1 bg-amber-50">
            <CardTitle className="text-2xl text-center text-amber-800">
              <AlertTriangle className="w-5 h-5 inline mr-2" />
              Cambio Obligatorio
            </CardTitle>
            <CardDescription className="text-center text-amber-700">
              Por seguridad, debe cambiar su contraseña inicial
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="passwordActual"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña Actual</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            {...field}
                            type={showCurrentPassword ? 'text' : 'password'}
                            placeholder={isSystemUser ? "Su contraseña actual (número de identificación)" : "Su contraseña actual (número de documento)"}
                            className="pl-10 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                          >
                            {showCurrentPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="passwordNueva"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nueva Contraseña</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            {...field}
                            type={showNewPassword ? 'text' : 'password'}
                            placeholder="Mínimo 8 caracteres"
                            className="pl-10 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                          >
                            {showNewPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmarPassword"
                  render={({ field }) => {
                    const passwordNueva = form.watch('passwordNueva') || '';
                    const confirmarPassword = field.value || '';
                    const passwordsMatch = passwordNueva && confirmarPassword && passwordNueva === confirmarPassword;
                    const passwordsMismatch = passwordNueva && confirmarPassword && passwordNueva !== confirmarPassword;
                    
                    return (
                      <FormItem>
                        <FormLabel>Confirmar Nueva Contraseña</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className={`absolute left-3 top-3 h-4 w-4 ${
                              passwordsMatch ? 'text-green-500' : 
                              passwordsMismatch ? 'text-red-500' : 
                              'text-gray-400'
                            }`} />
                            <Input
                              {...field}
                              type={showConfirmPassword ? 'text' : 'password'}
                              placeholder="Repita la nueva contraseña"
                              className={`pl-10 pr-10 ${
                                passwordsMatch ? 'border-green-500 focus:border-green-500 focus:ring-green-500' :
                                passwordsMismatch ? 'border-red-500 focus:border-red-500 focus:ring-red-500' :
                                ''
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                            {/* Indicador visual de coincidencia */}
                            {passwordsMatch && (
                              <div className="absolute right-10 top-3">
                                <Check className="h-4 w-4 text-green-500" />
                              </div>
                            )}
                            {passwordsMismatch && (
                              <div className="absolute right-10 top-3">
                                <X className="h-4 w-4 text-red-500" />
                              </div>
                            )}
                          </div>
                        </FormControl>
                        {/* Mensaje dinámico */}
                        {passwordsMatch && confirmarPassword && (
                          <p className="text-sm text-green-600 flex items-center gap-1">
                            <Check className="h-3 w-3" />
                            Las contraseñas coinciden
                          </p>
                        )}
                        {passwordsMismatch && (
                          <p className="text-sm text-red-600 flex items-center gap-1">
                            <X className="h-3 w-3" />
                            Las contraseñas no coinciden
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                {/* Sección de Requisitos de Contraseña */}
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm text-green-800 font-medium mb-2">Requisitos de la contraseña:</p>
                  {(() => {
                    const password = form.watch('passwordNueva') || '';
                    const requirements = validatePasswordRequirements(password);
                    
                    return (
                      <ul className="text-sm space-y-1">
                        <li className={`flex items-center gap-2 ${requirements.minLength ? 'text-green-700' : 'text-red-600'}`}>
                          {requirements.minLength ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <X className="h-4 w-4 text-red-500" />
                          )}
                          Mínimo 8 caracteres
                        </li>
                        <li className={`flex items-center gap-2 ${requirements.hasUppercase ? 'text-green-700' : 'text-red-600'}`}>
                          {requirements.hasUppercase ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <X className="h-4 w-4 text-red-500" />
                          )}
                          Al menos una letra mayúscula
                        </li>
                        <li className={`flex items-center gap-2 ${requirements.hasLowercase ? 'text-green-700' : 'text-red-600'}`}>
                          {requirements.hasLowercase ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <X className="h-4 w-4 text-red-500" />
                          )}
                          Al menos una letra minúscula
                        </li>
                        <li className={`flex items-center gap-2 ${requirements.hasNumber ? 'text-green-700' : 'text-red-600'}`}>
                          {requirements.hasNumber ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <X className="h-4 w-4 text-red-500" />
                          )}
                          Al menos un número
                        </li>
                      </ul>
                    );
                  })()}
                </div>

                {/* Separador */}
                <hr className="border-gray-200" />

                {/* Campo de Avatar */}
                <FormField
                  control={form.control}
                  name="foto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Foto de Perfil *</FormLabel>
                      <FormControl>
                        <div className="flex flex-col items-center space-y-4">
                          <div className="relative">
                            <Avatar className="w-24 h-24 border-4 border-gray-200">
                              <AvatarImage src={field.value} alt="Foto de perfil" />
                              <AvatarFallback className="bg-gray-100">
                                <User className="w-8 h-8 text-gray-400" />
                              </AvatarFallback>
                            </Avatar>
                            <label
                              htmlFor="foto-upload"
                              className="absolute -bottom-2 -right-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 cursor-pointer transition-colors"
                            >
                              <Camera className="w-4 h-4" />
                            </label>
                          </div>
                          <input
                            id="foto-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                          <p className="text-sm text-gray-600 text-center">
                            Haz clic en la cámara para subir tu foto
                          </p>
                          <p className="text-xs text-blue-600 text-center font-medium">
                            La foto debe ser formal y elegante
                          </p>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Separador */}
                <hr className="border-gray-200" />

                {/* Campo de Autorización de Datos */}
                <FormField
                  control={form.control}
                  name="autorizacionDatos"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="cursor-pointer"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-normal cursor-pointer">
                          Autorizo el uso de mis datos personales *
                        </FormLabel>
                        <p className="text-xs text-gray-600">
                          Declaro que autorizo el tratamiento de mis datos personales conforme a la política de privacidad de la empresa.
                        </p>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                {/* Indicador de campos faltantes */}
                {!isFormComplete() && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800 font-medium mb-2">Complete todos los campos para continuar:</p>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      {!form.watch('passwordActual') && <li>• Ingrese su contraseña actual</li>}
                      {!form.watch('passwordNueva') && <li>• Cree una nueva contraseña</li>}
                      {form.watch('passwordNueva') && form.watch('confirmarPassword') && form.watch('passwordNueva') !== form.watch('confirmarPassword') && <li>• Las contraseñas deben coincidir</li>}
                      {!form.watch('foto') && <li>• Suba una foto de perfil</li>}
                      {!form.watch('autorizacionDatos') && <li>• Autorice el uso de sus datos personales</li>}
                    </ul>
                  </div>
                )}

                {/* Barra de progreso */}
                {!isFormComplete() && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Progreso de completado</span>
                      <span>{getCompletionProgress().completed}/{getCompletionProgress().total}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${getCompletionProgress().percentage}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  disabled={isLoading || !isFormComplete()}
                >
                  {isLoading ? (
                    'Cambiando contraseña...'
                  ) : !isFormComplete() ? (
                    'Complete todos los campos'
                  ) : (
                    'Cambiar Contraseña'
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-sm text-amber-800 font-medium mb-1">Importante:</p>
              <p className="text-sm text-amber-700">
                {isSystemUser 
                  ? "Una vez cambie su contraseña y suba su foto de perfil, tendrá acceso completo al sistema. Su contraseña actual es su número de identificación."
                  : "Una vez cambie su contraseña y suba su foto de perfil, tendrá acceso completo al portal de candidatos. Su contraseña actual es su número de documento."
                }
              </p>
              <p className="text-sm text-amber-700 mt-2">
                • Debe cargar una foto de perfil clara y reciente
                • Debe autorizar el uso de sus datos personales
                • Ambos campos son obligatorios para completar el proceso
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
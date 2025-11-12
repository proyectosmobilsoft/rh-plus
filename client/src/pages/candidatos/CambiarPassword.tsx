import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from "sonner";
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Shield, AlertTriangle, Check, X, Loader2, CheckCircle, Trash2 } from 'lucide-react';
import { supabase } from '@/services/supabaseClient';
import { useLoading } from '@/contexts/LoadingContext';

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

// Función para asegurar sesión de Supabase
const ensureSupabaseSession = async (): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session && session.user) {
      return true;
    }

    const userData = localStorage.getItem('userData');
    const authToken = localStorage.getItem('authToken');
    
    if (!userData || !authToken) {
      return false;
    }

    const parsedUserData = JSON.parse(userData);
    const { data: { user }, error: getUserError } = await supabase.auth.getUser();
    if (user && !getUserError) {
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshedSession && !refreshError) {
        return true;
      }
    }

    const email = parsedUserData.email || `${parsedUserData.username}@compensamos.com`;
    try {
      const tempPassword = sessionStorage.getItem('temp_password');
      if (tempPassword) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email,
          password: tempPassword
        });
        if (!signInError && signInData?.session) {
          return true;
        }
      }
    } catch (signInError) {
      // Error silenciado
    }

    return false;
  } catch (error) {
    return false;
  }
};

// Función para subir foto a Supabase Storage
// En el contexto de cambio de contraseña, el usuario puede no estar completamente autenticado
const uploadFotoToStorage = async (
  file: File, 
  folder: string, 
  usuarioId?: number,
  passwordActual?: string
): Promise<string> => {
  const userData = localStorage.getItem('userData');
  
  // Intentar establecer sesión de Supabase Auth
  let sessionEstablished = await ensureSupabaseSession();
  
  // Si no se pudo establecer sesión, intentar con la contraseña actual del formulario
  if (!sessionEstablished && userData && passwordActual) {
    try {
      const parsedUserData = JSON.parse(userData);
      const email = parsedUserData.email || `${parsedUserData.username}@compensamos.com`;
      
      // Intentar hacer sign in con la contraseña actual
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: passwordActual
      });
      
      if (!signInError && signInData?.session) {
        sessionEstablished = true;
        console.log('✅ Sesión establecida con contraseña actual');
      }
    } catch (error) {
      console.warn('⚠️ No se pudo establecer sesión con contraseña actual:', error);
    }
  }
  
  // Si aún no hay sesión, intentar con temp_password
  if (!sessionEstablished && userData) {
    try {
      const parsedUserData = JSON.parse(userData);
      const email = parsedUserData.email || `${parsedUserData.username}@compensamos.com`;
      const tempPassword = sessionStorage.getItem('temp_password');
      if (tempPassword) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email,
          password: tempPassword
        });
        if (!signInError && signInData?.session) {
          sessionEstablished = true;
          console.log('✅ Sesión establecida con temp_password');
        }
      }
    } catch (error) {
      console.warn('⚠️ No se pudo establecer sesión con temp_password:', error);
    }
  }
  
  // Si aún no hay sesión, continuar de todas formas (puede que las políticas RLS lo permitan)
  if (!sessionEstablished) {
    console.warn('⚠️ No se pudo establecer sesión de Supabase Auth, intentando subir archivo de todas formas');
  }

  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const fileName = usuarioId 
    ? `${usuarioId}_${timestamp}_${sanitizedName}`
    : `temp_${timestamp}_${sanitizedName}`;
  const filePath = `${folder}/${fileName}`;

  const { data, error } = await supabase.storage
    .from('usuarios-fotos')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Error subiendo foto a Storage:', error);
    throw error;
  }

  const { data: urlData } = supabase.storage
    .from('usuarios-fotos')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
};

// Función para eliminar foto de Storage
const deleteFotoFromStorage = async (url: string): Promise<void> => {
  if (!url || typeof url !== 'string') {
    return;
  }

  if (!url.startsWith('http') && !url.startsWith('https')) {
    return;
  }

  try {
    let filePath = '';
    
    if (url.includes('/storage/v1/object/public/usuarios-fotos/')) {
      const urlParts = url.split('/storage/v1/object/public/usuarios-fotos/');
      if (urlParts.length >= 2) {
        filePath = urlParts[1].split('?')[0];
        filePath = decodeURIComponent(filePath);
        filePath = filePath.trim().replace(/\/+/g, '/');
      }
    } else if (url.includes('/storage/v1/object/sign/usuarios-fotos/')) {
      const urlParts = url.split('/storage/v1/object/sign/usuarios-fotos/');
      if (urlParts.length >= 2) {
        filePath = urlParts[1].split('?')[0];
        filePath = decodeURIComponent(filePath);
        filePath = filePath.trim().replace(/\/+/g, '/');
      }
    } else if (url.includes('usuarios-fotos')) {
      const match = url.match(/usuarios-fotos\/(.+?)(?:\?|$)/);
      if (match && match[1]) {
        filePath = match[1];
        filePath = decodeURIComponent(filePath);
        filePath = filePath.trim().replace(/\/+/g, '/');
      }
    }

    if (!filePath) {
      throw new Error(`No se pudo extraer el path de la URL: ${url}`);
    }

    if (filePath.startsWith('/')) {
      filePath = filePath.substring(1);
    }
    
    await ensureSupabaseSession();
    
    if (filePath.startsWith('usuarios-fotos/')) {
      filePath = filePath.replace('usuarios-fotos/', '');
    }
    
    const normalizedPath = filePath.trim().replace(/^\/+|\/+$/g, '');
    
    if (!normalizedPath || normalizedPath.length === 0) {
      throw new Error('El path normalizado está vacío');
    }
    
    const { data, error } = await supabase.storage
      .from('usuarios-fotos')
      .remove([normalizedPath]);

    if (error) {
      console.error('❌ Error eliminando foto de Storage:', error);
      throw error;
    }
  } catch (error: any) {
    console.error('❌ Error al procesar eliminación de foto:', error);
    throw error;
  }
};

// Función para comprimir imagen
const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      const targetWidth = 400;
      const targetHeight = 400;
      
      let { width, height } = img;
      const aspectRatio = width / height;
      
      let finalWidth, finalHeight;
      
      if (width > height) {
        finalWidth = targetWidth;
        finalHeight = targetWidth / aspectRatio;
      } else {
        finalHeight = targetHeight;
        finalWidth = targetHeight * aspectRatio;
      }
      
      canvas.width = finalWidth;
      canvas.height = finalHeight;
      
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, finalWidth, finalHeight);
        ctx.drawImage(img, 0, 0, finalWidth, finalHeight);
      }
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.png'), {
              type: 'image/png',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Error al comprimir la imagen'));
          }
        },
        'image/png',
        0.9
      );
    };
    
    img.onerror = () => {
      reject(new Error('Error al cargar la imagen'));
    };
    
    img.src = URL.createObjectURL(file);
  });
};

export default function CambiarPassword() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [isSystemUser, setIsSystemUser] = useState(false);
  const [fotoUrl, setFotoUrl] = useState<string>("");
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const navigate = useNavigate();
  const { startLoading, stopLoading } = useLoading();

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

      // Cargar foto existente del usuario si es usuario del sistema
      if (isSystem && parsedUserData.id) {
        loadUserFoto(parsedUserData.id);
      } else if (parsedUserData.foto_base64) {
        // Si es candidato y tiene foto_base64, cargarla
        const fotoUrlValue = parsedUserData.foto_base64;
        setFotoUrl(fotoUrlValue);
        const isUrl = fotoUrlValue && (
          fotoUrlValue.startsWith('http://') || 
          fotoUrlValue.startsWith('https://') ||
          fotoUrlValue.includes('supabase.co/storage') ||
          fotoUrlValue.includes('/storage/v1/object/')
        );
        const isBase64 = fotoUrlValue && fotoUrlValue.startsWith('data:');
        if (isUrl || isBase64) {
          setFotoPreview(fotoUrlValue);
        }
      }
    }
  }, []);

  // Función para cargar foto del usuario desde la base de datos
  const loadUserFoto = async (userId: number) => {
    try {
      const { data: usuario, error } = await supabase
        .from('gen_usuarios')
        .select('foto_base64')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error cargando foto del usuario:', error);
        return;
      }

      if (usuario && usuario.foto_base64) {
        const fotoUrlValue = usuario.foto_base64;
        setFotoUrl(fotoUrlValue);
        
        const isUrl = fotoUrlValue && (
          fotoUrlValue.startsWith('http://') || 
          fotoUrlValue.startsWith('https://') ||
          fotoUrlValue.includes('supabase.co/storage') ||
          fotoUrlValue.includes('/storage/v1/object/')
        );
        const isBase64 = fotoUrlValue && fotoUrlValue.startsWith('data:');
        
        if (isUrl || isBase64) {
          setFotoPreview(fotoUrlValue);
        }
      }
    } catch (error) {
      console.error('Error al cargar foto del usuario:', error);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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

    try {
      startLoading();
      setUploadingFoto(true);

      // Si hay una foto anterior en Storage, eliminarla
      if (fotoUrl && (fotoUrl.startsWith('http://') || fotoUrl.startsWith('https://'))) {
        try {
          await deleteFotoFromStorage(fotoUrl);
        } catch (deleteError) {
          console.error('Error al eliminar foto anterior:', deleteError);
        }
      }

      // Comprimir la imagen
      const compressedImage = await compressImage(file);
      
      // Obtener la contraseña actual del formulario para intentar autenticarse
      const passwordActual = form.getValues('passwordActual');
      
      // Subir imagen comprimida a Storage
      const usuarioId = userData?.id;
      const folder = usuarioId ? `usuarios/${usuarioId}` : 'usuarios/temp';
      const fotoUrlValue = await uploadFotoToStorage(compressedImage, folder, usuarioId, passwordActual);

      // Guardar la URL en el estado y en el formulario
      setFotoUrl(fotoUrlValue);
      form.setValue('foto', fotoUrlValue);
      
      // También generar preview para visualización
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(compressedImage);
      });
      setFotoPreview(base64);

      toast.success("Foto procesada y guardada", { 
        description: "Imagen optimizada y subida a Storage." 
      });
    } catch (error: any) {
      console.error('Error al procesar foto:', error);
      toast.error("Error al procesar la foto", {
        description: error.message || "Por favor intenta de nuevo"
      });
    } finally {
      setUploadingFoto(false);
      stopLoading();
    }
  };

  const handleEliminarFoto = async () => {
    if (!fotoUrl) {
      setFotoUrl("");
      setFotoPreview(null);
      form.setValue('foto', "");
      return;
    }

    try {
      startLoading();
      
      // Si hay una URL de Storage, eliminar el archivo
      if (fotoUrl && (fotoUrl.startsWith('http://') || fotoUrl.startsWith('https://'))) {
        try {
          await deleteFotoFromStorage(fotoUrl);
          toast.success("Foto eliminada de Storage");
        } catch (deleteError) {
          console.error('Error eliminando foto de Storage:', deleteError);
        }
      }
      
      // Limpiar estados locales
      setFotoUrl("");
      setFotoPreview(null);
      form.setValue('foto', "");
      
      toast.success("Foto eliminada correctamente");
    } catch (error: any) {
      console.error('Error al eliminar foto:', error);
      toast.error("Error al eliminar la foto");
    } finally {
      stopLoading();
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

  // Efecto para actualizar el formulario cuando se carga la foto
  useEffect(() => {
    if (fotoPreview || fotoUrl) {
      form.setValue('foto', fotoUrl || fotoPreview || "");
    }
  }, [fotoPreview, fotoUrl, form]);

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

        // Actualizar la contraseña y la foto (usar fotoUrl si existe, sino usar data.foto)
        const fotoFinal = fotoUrl || data.foto || "";
        const { error: updateError } = await supabase
          .from('gen_usuarios')
          .update({ 
            password: data.passwordNueva,
            foto_base64: fotoFinal
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
                            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-200 bg-gray-50 flex items-center justify-center">
                              {(() => {
                                const fotoParaMostrar = fotoPreview || field.value || fotoUrl;
                                if (fotoParaMostrar) {
                                  return (
                                    <img 
                                      src={fotoParaMostrar as string} 
                                      alt="Foto de perfil" 
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        console.error('Error cargando imagen:', e);
                                      }}
                                    />
                                  );
                                }
                                return <User className="w-10 h-10 text-gray-400" />;
                              })()}
                            </div>
                            {uploadingFoto && (
                              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                                <Loader2 className="w-6 h-6 text-white animate-spin" />
                              </div>
                            )}
                            {!uploadingFoto && (fotoPreview || field.value || fotoUrl) && (
                              <div className="absolute -bottom-2 -right-2 bg-green-600 text-white rounded-full p-1">
                                <CheckCircle className="w-4 h-4" />
                              </div>
                            )}
                            {!uploadingFoto && !(fotoPreview || field.value || fotoUrl) && (
                              <label
                                htmlFor="foto-upload"
                                className="absolute -bottom-2 -right-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 cursor-pointer transition-colors"
                              >
                                <Camera className="w-4 h-4" />
                              </label>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <label
                              htmlFor="foto-upload"
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                              {uploadingFoto ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Subiendo...
                                </>
                              ) : (
                                <>
                                  <Upload className="w-4 h-4" />
                                  {fotoPreview || field.value || fotoUrl ? 'Cambiar Foto' : 'Subir Foto'}
                                </>
                              )}
                            </label>
                            {(fotoPreview || field.value || fotoUrl) && (
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={handleEliminarFoto}
                                disabled={uploadingFoto}
                                className="flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                Quitar
                              </Button>
                            )}
                          </div>
                          <input
                            id="foto-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            disabled={uploadingFoto}
                          />
                          <p className="text-sm text-gray-600 text-center">
                            {fotoPreview || field.value || fotoUrl 
                              ? "Foto lista. Puedes cambiarla o eliminarla."
                              : "Haz clic en 'Subir Foto' para seleccionar tu imagen"
                            }
                          </p>
                          <p className="text-xs text-blue-600 text-center font-medium">
                            La foto debe ser formal y elegante (máx. 5MB)
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


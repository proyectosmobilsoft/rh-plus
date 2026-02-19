import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Plus, Search, Users, Save, RefreshCw, Loader2, Lock, CheckCircle, User, ImagePlus, Eye, EyeOff, Upload } from "lucide-react";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Checkbox } from "@/components/ui/checkbox";
import { MultiSelect } from "@/components/ui/multi-select";
import { PasswordStrength } from "@/components/ui/password-strength";
import { rolesService } from "@/services/rolesService";
import { empresasService, Empresa } from "@/services/empresasService";
import { usuariosService, UsuarioData } from "@/services/usuariosService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLoading } from "@/contexts/LoadingContext";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useForm } from "react-hook-form";
import { Can } from "@/contexts/PermissionsContext";
import { supabase } from "@/services/supabaseClient";

// Función helper para establecer sesión de Supabase Auth si es necesario
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
const uploadFotoToStorage = async (
  file: File, 
  folder: string, 
  usuarioId?: number
): Promise<string> => {
  const userData = localStorage.getItem('userData');
  const authToken = localStorage.getItem('authToken');
  
  if (!userData || !authToken) {
    throw new Error('Debes estar autenticado para subir archivos');
  }

  // Intentar establecer sesión de Supabase Auth
  const sessionEstablished = await ensureSupabaseSession();
  
  // Si no se pudo establecer sesión, intentar configurar el token manualmente
  if (!sessionEstablished) {
    console.warn('⚠️ No se pudo establecer sesión de Supabase Auth, intentando con token manual');
    // Configurar el token de acceso manualmente si existe
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      // Intentar usar el authToken del localStorage como token de acceso
      try {
        const parsedUserData = JSON.parse(userData);
        const email = parsedUserData.email || `${parsedUserData.username}@compensamos.com`;
        // Intentar sign in con una contraseña temporal si está disponible
        const tempPassword = sessionStorage.getItem('temp_password');
        if (tempPassword) {
          await supabase.auth.signInWithPassword({
            email: email,
            password: tempPassword
          });
        }
      } catch (error) {
        console.error('Error configurando sesión manual:', error);
      }
    }
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
    console.error('Detalles del error:', error.message, error.statusCode);
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
      console.error('❌ No se pudo extraer la ruta del archivo de la URL:', url);
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

// Función para comprimir imagen (similar a empresas)
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
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Error al comprimir imagen'));
          }
        },
        'image/png',
        0.9
      );
    };
    
    img.onerror = () => reject(new Error('Error al cargar imagen'));
    img.src = URL.createObjectURL(file);
  });
};

// Esquema de validación para crear/editar usuario (usa isEditing para reglas de contraseña)
const crearUsuarioSchema = z.object({
  id: z.number().optional(),
  identificacion: z.string().min(1, "La identificación es requerida"),
  primer_nombre: z.string().min(1, "El primer nombre es requerido"),
  segundo_nombre: z.string().optional(),
  primer_apellido: z.string().min(1, "El primer apellido es requerido"),
  segundo_apellido: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email("Email inválido"),
  username: z.string().min(3, "El username debe tener al menos 3 caracteres"),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
  perfilIds: z.array(z.number()).min(1, "Debe seleccionar al menos un perfil"),
  empresaIds: z.array(z.number()).optional(),
  foto_base64: z.string().optional(),
  isEditing: z.boolean().optional(),
}).superRefine((data, ctx) => {
  const isEditing = !!data.isEditing;
  const pwd = data.password || "";
  const confirm = data.confirmPassword || "";
  if (!isEditing) {
    if (!pwd) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["password"], message: "La contraseña es requerida" });
      return;
    }
    if (pwd.length < 8) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["password"], message: "La contraseña debe tener al menos 8 caracteres" });
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(pwd)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["password"], message: "La contraseña debe contener al menos una mayúscula, una minúscula y un número" });
    if (confirm !== pwd) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["confirmPassword"], message: "Las contraseñas no coinciden" });
  } else {
    if (pwd) {
      if (pwd.length < 8) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["password"], message: "La contraseña debe tener al menos 8 caracteres" });
      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(pwd)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["password"], message: "La contraseña debe contener al menos una mayúscula, una minúscula y un número" });
      if (confirm !== pwd) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["confirmPassword"], message: "Las contraseñas no coinciden" });
    }
  }
});

// Esquema para editar usuario (password opcional)
const editarUsuarioSchema = z.object({
  id: z.number(),
  identificacion: z.string().min(1, "La identificación es requerida"),
  primer_nombre: z.string().min(1, "El primer nombre es requerido"),
  segundo_nombre: z.string().optional(),
  primer_apellido: z.string().min(1, "El primer apellido es requerido"),
  segundo_apellido: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email("Email inválido"),
  username: z.string().min(3, "El username debe tener al menos 3 caracteres"),
  password: z.string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "La contraseña debe contener al menos una letra mayúscula, una minúscula y un número")
    .or(z.literal(""))
    .optional(),
  confirmPassword: z.string().optional(),
  perfilIds: z.array(z.number()).min(1, "Debe seleccionar al menos un perfil"),
  empresaIds: z.array(z.number()).optional(),
  foto_base64: z.string().optional(),
}).refine((data) => {
  if (data.password && data.password !== "") {
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type CrearUsuarioForm = z.infer<typeof crearUsuarioSchema>;
type EditarUsuarioForm = z.infer<typeof editarUsuarioSchema>;

interface Perfil {
  id: number;
  nombre: string;
  descripcion?: string;
}

// INTERFAZ DE USUARIO CON LA ESTRUCTURA CORRECTA DE SUPABASE
interface Usuario {
  id: number;
  identificacion?: string;
  primer_nombre: string;
  segundo_nombre?: string;
  primer_apellido: string;
  segundo_apellido?: string;
  telefono?: string;
  email: string;
  username: string;
  activo: boolean;
  password?: string;
  foto_base64?: string;
  created_at?: string;
  gen_usuario_roles: Array<{ id: number; rol_id: number; created_at: string; gen_roles: { id: number; nombre: string } }>;
  gen_usuario_empresas: Array<{ id: number; empresa_id: number; created_at: string; empresas: { id: number; razon_social: string } }>;
}

const UsuariosPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("active");
  const [perfilFilter, setPerfilFilter] = useState<"all" | number>("all");
  const [activeTab, setActiveTab] = useState("usuarios");
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [fotoUrl, setFotoUrl] = useState<string>("");
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [uploadingFoto, setUploadingFoto] = useState<boolean>(false);
  
  // Estados para el modal informativo de eliminación
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<Usuario | null>(null);
  const [candidatosRelacionados, setCandidatosRelacionados] = useState<any[]>([]);
  const { startLoading, stopLoading } = useLoading();
  const queryClient = useQueryClient();

  // Efecto para cargar la foto cuando se edita un usuario
  useEffect(() => {
    if (editingUser && editingUser.foto_base64) {
      const fotoUrlValue = editingUser.foto_base64;
      console.log('🔄 [useEffect] Cargando foto para usuario editando:', editingUser.id);
      console.log('🖼️ [useEffect] foto_base64:', fotoUrlValue);
      
      setFotoUrl(fotoUrlValue);
      
      // Detectar si es URL
      const isUrl = fotoUrlValue && (
        fotoUrlValue.startsWith('http://') || 
        fotoUrlValue.startsWith('https://') ||
        fotoUrlValue.includes('supabase.co/storage') ||
        fotoUrlValue.includes('/storage/v1/object/')
      );
      
      // Detectar si es base64
      const isBase64 = fotoUrlValue && fotoUrlValue.startsWith('data:');
      
      if (isUrl) {
        console.log('✅ [useEffect] Es URL, estableciendo preview');
        setFotoPreview(fotoUrlValue);
      } else if (isBase64) {
        console.log('✅ [useEffect] Es base64, estableciendo preview');
        setFotoPreview(fotoUrlValue);
      } else {
        console.log('❌ [useEffect] No se pudo detectar el tipo de foto');
        setFotoPreview(null);
      }
    } else if (editingUser && !editingUser.foto_base64) {
      // Si el usuario no tiene foto, limpiar estados
      console.log('🔄 [useEffect] Usuario sin foto, limpiando estados');
      setFotoUrl("");
      setFotoPreview(null);
    }
  }, [editingUser]);

  // Función para asignar colores diferentes a cada perfil
  const getPerfilColor = (perfilId: number) => {
    const colors = [
      "bg-blue-50 text-blue-700 border-blue-200",
      "bg-green-50 text-green-700 border-green-200",
      "bg-purple-50 text-purple-700 border-purple-200",
      "bg-orange-50 text-orange-700 border-orange-200",
      "bg-pink-50 text-pink-700 border-pink-200",
      "bg-indigo-50 text-indigo-700 border-indigo-200",
      "bg-teal-50 text-teal-700 border-teal-200",
      "bg-red-50 text-red-700 border-red-200",
      "bg-yellow-50 text-yellow-700 border-yellow-200",
      "bg-cyan-50 text-cyan-700 border-cyan-200",
    ];
    return colors[perfilId % colors.length];
  };

  // Query para obtener usuarios desde Supabase
  const { data: usuarios = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: ["usuarios"],
    queryFn: usuariosService.listUsuarios,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // Query para obtener perfiles activos
  const { data: perfilesActivos = [], isLoading: perfilesLoading } = useQuery<Perfil[]>({
    queryKey: ["perfilesActivos"],
    queryFn: rolesService.listActiveRoles,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Query para obtener empresas
  const { data: empresas = [], isLoading: empresasLoading } = useQuery<Empresa[]>({
    queryKey: ["empresas"],
    queryFn: empresasService.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Formulario para crear usuario
  const form = useForm<CrearUsuarioForm>({
    resolver: zodResolver(crearUsuarioSchema),
    defaultValues: {
      id: undefined,
      identificacion: "",
      primer_nombre: "",
      segundo_nombre: "",
      primer_apellido: "",
      segundo_apellido: "",
      telefono: "",
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
      perfilIds: [],
      empresaIds: [],
      foto_base64: "",
      isEditing: false,
    },
  });

  // Mutaciones
  const createUserMutation = useMutation({
    mutationFn: async (data: any) => {
      startLoading();
      try {
        const { password, perfilIds, empresaIds, ...userData } = data;
        return await usuariosService.createUsuario(userData, password, perfilIds, empresaIds);
      } finally {
        stopLoading();
      }
    },
    onSuccess: () => {
      toast.success("El usuario ha sido creado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      form.reset();
      setFotoUrl("");
      setFotoPreview(null);
      setActiveTab("usuarios");
    },
    onError: (error: any) => {
      toast.error(error.message || "Hubo un error al crear el usuario");
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data: EditarUsuarioForm) => {
      startLoading();
      try {
        const { password, perfilIds, empresaIds, ...userData } = data;
        return await usuariosService.updateUsuario(
          userData.id, 
          userData, 
          perfilIds || [], 
          empresaIds || [], 
          password
        );
      } finally {
        stopLoading();
      }
    },
    onSuccess: () => {
      toast.success("El usuario ha sido actualizado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      setEditingUser(null);
      setFotoUrl("");
      setFotoPreview(null);
      setActiveTab("usuarios");
    },
    onError: (error: any) => {
      toast.error(error.message || "Hubo un error al actualizar el usuario");
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      startLoading();
      try {
        return await usuariosService.deleteUsuario(id);
      } finally {
        stopLoading();
      }
    },
    onSuccess: () => {
      toast.success("El usuario ha sido eliminado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Hubo un error al eliminar el usuario");
    },
  });

  const activateUserMutation = useMutation({
    mutationFn: async (id: number) => {
      startLoading();
      try {
        return await usuariosService.activateUsuario(id);
      } finally {
        stopLoading();
      }
    },
    onSuccess: () => {
      toast.success("El usuario ha sido activado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Hubo un error al activar el usuario");
    },
  });

  const deactivateUserMutation = useMutation({
    mutationFn: async (id: number) => {
      startLoading();
      try {
        return await usuariosService.deactivateUsuario(id);
      } finally {
        stopLoading();
      }
    },
    onSuccess: () => {
      toast.success("El usuario ha sido desactivado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Hubo un error al desactivar el usuario");
    },
  });

  // Filtrado de usuarios
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter(usuario => {
      const term = (searchTerm || "").toLowerCase();
      const matchesSearch =
        (usuario.primer_nombre || "").toLowerCase().includes(term) ||
        (usuario.primer_apellido || "").toLowerCase().includes(term) ||
        (usuario.email || "").toLowerCase().includes(term) ||
        (usuario.username || "").toLowerCase().includes(term) ||
        (usuario.identificacion || "").toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === "all" ? true :
          statusFilter === "active" ? usuario.activo :
            !usuario.activo;

      const matchesPerfil =
        perfilFilter === "all" ? true :
          usuario.gen_usuario_roles?.some(rol => rol.rol_id === perfilFilter);

      return matchesSearch && matchesStatus && matchesPerfil;
    });
  }, [usuarios, searchTerm, statusFilter, perfilFilter]);

  // Handlers
  const handleEliminarUsuario = async (id: number) => {
    try {
      // Buscar el usuario en la lista
      const usuario = usuarios.find(u => u.id === id);
      if (!usuario) {
        toast.error("Usuario no encontrado");
        return;
      }

      // Verificar si se puede eliminar antes de proceder
      const canDeleteResult = await usuariosService.canDeleteUsuario(id);
      
      if (!canDeleteResult.canDelete) {
        // Configurar el modal con la información del usuario y candidatos
        setUserToDelete(usuario);
        setCandidatosRelacionados(canDeleteResult.details || []);
        setShowDeleteModal(true);
        return;
      }
      
      // Si se puede eliminar, proceder con la eliminación
    deleteUserMutation.mutate(id);
    } catch (error: any) {
      toast.error(error.message || "Error al verificar si se puede eliminar el usuario");
    }
  };



  const handleActivarUsuario = async (id: number) => {
    activateUserMutation.mutate(id);
  };

  const handleInactivarUsuario = async (id: number) => {
    deactivateUserMutation.mutate(id);
  };

  const handleCrearUsuario = async (data: CrearUsuarioForm) => {
    // Filtrar campos que no deben enviarse al backend
    const { confirmPassword, perfilIds, empresaIds, isEditing, ...userData } = data;
    const password = data.password;

    // Decidir si crear o actualizar basado en editingUser
    if (editingUser) {
      console.log('🔄 Editando usuario existente, llamando updateUserMutation');
      // Estamos editando un usuario existente
      // Usar fotoUrl si existe (puede ser nueva foto subida o URL existente), sino usar el valor del formulario
      // Si fotoUrl está vacío pero había una foto antes, mantener la foto original
      const fotoFinal = fotoUrl !== "" 
        ? (fotoUrl || userData.foto_base64 || "") 
        : (userData.foto_base64 || editingUser.foto_base64 || "");
      
      const updateData = {
        ...userData,
        id: editingUser.id,
        password,
        perfilIds,
        empresaIds,
        foto_base64: fotoFinal
      };
      updateUserMutation.mutate(updateData);
    } else {
      console.log('➕ Creando nuevo usuario, llamando createUserMutation');
      
      // Si hay foto temporal, moverla a la carpeta del usuario después de crearlo
      let finalFotoUrl = fotoUrl || userData.foto_base64 || "";
      
      try {
        // Crear usuario primero usando mutateAsync para poder esperar el resultado
        const newUser = await createUserMutation.mutateAsync({
          ...userData,
          password,
          perfilIds,
          empresaIds,
          foto_base64: finalFotoUrl
        });
        
        // Si hay foto temporal, moverla a la carpeta del usuario
        if (fotoUrl && fotoUrl.includes('/usuarios/temp/')) {
          try {
            const urlParts = fotoUrl.split('/usuarios/temp/');
            if (urlParts.length > 1) {
              const fileName = urlParts[1].split('?')[0];
              const oldPath = `usuarios/temp/${fileName}`;
              const newPath = `usuarios/${newUser.id}/${fileName}`;

              // Mover archivo de temp a la carpeta del usuario
              const { error: moveError } = await supabase.storage
                .from('usuarios-fotos')
                .move(oldPath, newPath);

              if (moveError) {
                console.error('Error moviendo foto:', moveError);
                // Intentar copiar si move no funciona
                const { data: fileData } = await supabase.storage
                  .from('usuarios-fotos')
                  .download(oldPath);
                
                if (fileData) {
                  await supabase.storage
                    .from('usuarios-fotos')
                    .upload(newPath, fileData);
                  
                  await supabase.storage
                    .from('usuarios-fotos')
                    .remove([oldPath]);
                }
              }
              
              // Obtener la nueva URL pública después de mover
              const { data: urlData } = supabase.storage
                .from('usuarios-fotos')
                .getPublicUrl(newPath);
              
              // Actualizar la foto en la base de datos con la nueva URL
              await supabase
                .from('gen_usuarios')
                .update({ foto_base64: urlData.publicUrl })
                .eq('id', newUser.id);
            }
          } catch (error) {
            console.error('Error procesando foto después de crear usuario:', error);
          }
        }
      } catch (error) {
        // El error ya se maneja en la mutación
        console.error('Error al crear usuario:', error);
      }
    }
  };

  const handleActualizarUsuario = (data: EditarUsuarioForm) => {
    updateUserMutation.mutate(data);
  };

  const handleEditarUsuario = (usuario: Usuario) => {
    console.log('🔄 [handleEditarUsuario] Usuario a editar:', usuario);
    console.log('🖼️ [handleEditarUsuario] foto_base64 del usuario:', usuario.foto_base64);
    
    setEditingUser(usuario);
    
    // Cargar foto desde URL o base64
    const fotoUrlValue = usuario.foto_base64 || "";
    console.log('📸 [handleEditarUsuario] fotoUrlValue:', fotoUrlValue);
    console.log('📸 [handleEditarUsuario] Tipo de fotoUrlValue:', typeof fotoUrlValue);
    console.log('📸 [handleEditarUsuario] Longitud:', fotoUrlValue?.length);
    
    setFotoUrl(fotoUrlValue);
    
    // Detectar si es URL (más flexible: cualquier string que contenga http o sea una URL válida)
    const isUrl = fotoUrlValue && (
      fotoUrlValue.startsWith('http://') || 
      fotoUrlValue.startsWith('https://') ||
      fotoUrlValue.includes('supabase.co/storage') ||
      fotoUrlValue.includes('/storage/v1/object/')
    );
    
    // Detectar si es base64
    const isBase64 = fotoUrlValue && fotoUrlValue.startsWith('data:');
    
    console.log('🔍 [handleEditarUsuario] isUrl:', isUrl);
    console.log('🔍 [handleEditarUsuario] isBase64:', isBase64);
    
    // Si es URL de Storage, usar directamente para preview
    if (isUrl) {
      console.log('✅ [handleEditarUsuario] Es URL, estableciendo preview con URL');
      setFotoPreview(fotoUrlValue);
    } 
    // Si es base64, usar para preview
    else if (isBase64) {
      console.log('✅ [handleEditarUsuario] Es base64, estableciendo preview con base64');
      setFotoPreview(fotoUrlValue);
    } 
    // Si no hay foto, limpiar preview
    else {
      console.log('❌ [handleEditarUsuario] No es URL ni base64, limpiando preview');
      setFotoPreview(null);
    }
    
    // Nota: fotoPreview se actualizará en el siguiente render, no podemos leerlo aquí
    
    form.reset({
      id: usuario.id,
      identificacion: usuario.identificacion || "",
      primer_nombre: usuario.primer_nombre,
      segundo_nombre: usuario.segundo_nombre || "",
      primer_apellido: usuario.primer_apellido,
      segundo_apellido: usuario.segundo_apellido || "",
      telefono: usuario.telefono || "",
      email: usuario.email,
      username: usuario.username,
      password: usuario.password || "",
      confirmPassword: usuario.password || "",
      perfilIds: usuario.gen_usuario_roles?.map(r => r.rol_id) || [],
      empresaIds: usuario.gen_usuario_empresas?.map(e => e.empresa_id) || [],
      foto_base64: fotoUrlValue,
      isEditing: true,
    });
    setActiveTab("registro");
  };

  const handleEliminarFoto = async () => {
    if (!editingUser) {
      // Si no hay usuario editando, solo limpiar estados
      setFotoUrl("");
      setFotoPreview(null);
      form.setValue('foto_base64', "");
      return;
    }

    try {
      startLoading();
      
      // Obtener la URL actual de la foto
      const currentFotoUrl = fotoUrl || editingUser.foto_base64 || "";
      
      // Si hay una URL de Storage, eliminar el archivo
      if (currentFotoUrl && (currentFotoUrl.startsWith('http://') || currentFotoUrl.startsWith('https://'))) {
        try {
          await deleteFotoFromStorage(currentFotoUrl);
          toast.success("Foto eliminada de Storage");
        } catch (deleteError) {
          console.error('Error eliminando foto de Storage:', deleteError);
          // Continuar de todas formas para limpiar la referencia en la BD
        }
      }
      
      // Actualizar la base de datos para eliminar la referencia a la foto
      if (editingUser.id) {
        const { error: updateError } = await supabase
          .from('gen_usuarios')
          .update({ foto_base64: null })
          .eq('id', editingUser.id);
        
        if (updateError) {
          console.error('Error actualizando usuario después de eliminar foto:', updateError);
          toast.error("Error al actualizar la base de datos");
        } else {
          toast.success("Foto eliminada correctamente");
        }
      }
      
      // Limpiar estados locales
      setFotoUrl("");
      setFotoPreview(null);
      form.setValue('foto_base64', "");
      
      // Actualizar el usuario en el estado local
      if (editingUser) {
        setEditingUser({
          ...editingUser,
          foto_base64: undefined
        });
      }
      
      // Invalidar queries para refrescar la lista de usuarios
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
    } catch (error) {
      console.error('Error al eliminar foto:', error);
      toast.error("Error al eliminar la foto");
    } finally {
      stopLoading();
    }
  };

  const handleFotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      toast.error("Por favor selecciona un archivo de imagen válido.");
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La foto debe ser menor a 5MB.");
      return;
    }

    try {
      startLoading();
      setUploadingFoto(true);

      // Eliminar foto anterior si existe
      const oldFotoUrl = fotoUrl || editingUser?.foto_base64;
      if (oldFotoUrl && (oldFotoUrl.startsWith('http') || oldFotoUrl.startsWith('https'))) {
        try {
          await deleteFotoFromStorage(oldFotoUrl);
        } catch (deleteError) {
          console.error('❌ Error al eliminar foto anterior:', deleteError);
        }
      }

      // Comprimir la imagen
      const compressedImage = await compressImage(file);
      
      // Subir imagen comprimida a Storage
      const usuarioId = editingUser?.id;
      const folder = usuarioId ? `usuarios/${usuarioId}` : 'usuarios/temp';
      const fotoUrlValue = await uploadFotoToStorage(compressedImage, folder, usuarioId);

      // Guardar la URL en el estado y en el formulario
      setFotoUrl(fotoUrlValue);
      form.setValue('foto_base64', fotoUrlValue);
      
      // También generar preview para visualización
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(compressedImage);
      });
      setFotoPreview(base64);

      // Si el usuario ya existe, actualizar la URL en la base de datos inmediatamente
      if (usuarioId) {
        try {
          const { error: updateError } = await supabase
            .from('gen_usuarios')
            .update({ foto_base64: fotoUrlValue })
            .eq('id', usuarioId);
          
          if (updateError) {
            console.error('Error actualizando foto en la base de datos:', updateError);
            toast.error("Error al actualizar la foto en la base de datos");
          } else {
            toast.success("Foto procesada y guardada", { 
              description: "Imagen optimizada, subida a Storage y URL actualizada en la base de datos." 
            });
          }
        } catch (dbError) {
          console.error('Error al actualizar la base de datos:', dbError);
          toast.error("Error al actualizar la base de datos.");
        }
      } else {
        toast.success("Foto procesada", { description: "Imagen optimizada y subida a Storage." });
      }
    } catch (error) {
      console.error('Error al procesar foto:', error);
      toast.error("No se pudo procesar la foto.");
    } finally {
      setUploadingFoto(false);
      stopLoading();
    }
  };

  return (
    <div className="p-4 max-w-full mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-extrabold text-cyan-800 flex items-center gap-2 mb-2">
          <Users className="w-8 h-8 text-cyan-600" />
          Gestión de Usuarios
        </h1>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-cyan-100/60 p-1 rounded-lg">
          <TabsTrigger
            value="usuarios"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
          >
            Listado de Usuarios
          </TabsTrigger>
          <TabsTrigger
            value="registro"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
          >
            Registro de Usuario
          </TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios" className="mt-6">
          {/* Header similar a perfiles */}
          <div className="bg-white rounded-lg border">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                  <Users className="w-5 h-5 text-orange-600" />
                </div>
                <span className="text-lg font-semibold text-gray-700">USUARIOS</span>
              </div>
              <div className="flex space-x-2">
                <Can action="accion-crear-usuario">
                <Button
                  onClick={() => {
                    setEditingUser(null);
                    setFotoUrl("");
                    setFotoPreview(null);
                      // Vaciar completamente el formulario con valores por defecto
                      form.reset({
                        identificacion: "",
                        primer_nombre: "",
                        segundo_nombre: "",
                        primer_apellido: "",
                        segundo_apellido: "",
                        telefono: "",
                        email: "",
                        username: "",
                        password: "",
                        confirmPassword: "",
                        perfilIds: [],
                        empresaIds: [],
                        foto_base64: "",
                        isEditing: false,
                      });
                    setActiveTab("registro");
                  }}
                    className="bg-brand-lime hover:bg-brand-lime/90"
                  size="sm"
                >
                  Adicionar Registro
                </Button>
                </Can>
              </div>
            </div>

            {/* Filtros y búsqueda */}
            <div className="flex flex-wrap items-center gap-4 p-3 bg-cyan-50 rounded-lg mb-4 shadow-sm">
              <div className="flex-1 min-w-[200px]">
                <Input
                  placeholder="Buscar por nombre, email, username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="min-w-[180px]">
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | "active" | "inactive")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="active">Solo activos</SelectItem>
                    <SelectItem value="inactive">Solo inactivos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-[180px]">
                <Select value={perfilFilter === "all" ? "all" : perfilFilter.toString()} onValueChange={(value) => setPerfilFilter(value === "all" ? "all" : parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los perfiles</SelectItem>
                    {perfilesActivos.map(perfil => (
                      <SelectItem key={perfil.id} value={perfil.id.toString()}>
                        {perfil.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tabla de usuarios */}
            <div className="relative overflow-x-auto rounded-lg shadow-sm">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-20">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="animate-spin h-10 w-10 text-cyan-600" />
                    <span className="text-cyan-700 font-semibold">Cargando usuarios...</span>
                  </div>
                </div>
              )}
              <Table className="min-w-[900px] w-full text-xs">
                <TableHeader className="bg-cyan-50">
                  <TableRow className="text-left font-semibold text-gray-700">
                    <TableHead className="px-2 py-1 text-teal-600">Acciones</TableHead>
                    <TableHead className="px-4 py-3">Identificación</TableHead>
                    <TableHead className="px-4 py-3">Nombre Completo</TableHead>
                    <TableHead className="px-4 py-3">Username</TableHead>
                    <TableHead className="px-4 py-3">Teléfono</TableHead>
                    <TableHead className="px-4 py-3">Perfiles</TableHead>
                    <TableHead className="px-4 py-3">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!isLoading && (usuariosFiltrados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        No hay usuarios disponibles.
                      </TableCell>
                    </TableRow>
                  ) : (
                    usuariosFiltrados.map((usuario) => (
                      <TableRow key={usuario.id} className="hover:bg-gray-50">
                        <TableCell className="px-2 py-1">
                          <div className="flex flex-row gap-1 items-center">
                            <Can action="accion-editar-usuario">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditarUsuario(usuario)}
                                    aria-label="Editar usuario"
                                  >
                                      <Edit className="h-5 w-5 text-cyan-600 hover:text-cyan-800 transition-colors" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Editar</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            </Can>

                            {usuario.activo ? (
                              <Can action="accion-inactivar-usuario">
                              <AlertDialog>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          aria-label="Inactivar usuario"
                                        >
                                          <Lock className="h-5 w-5 text-yellow-600 hover:text-yellow-800 transition-colors" />
                                        </Button>
                                      </AlertDialogTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Inactivar</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>¿Inactivar usuario?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      ¿Estás seguro de que deseas inactivar el usuario{" "}
                                      <strong>{usuario.primer_nombre} {usuario.primer_apellido}</strong>?
                                      El usuario no podrá acceder al sistema hasta que sea reactivado.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleInactivarUsuario(usuario.id)}
                                      className="bg-yellow-600 hover:bg-yellow-700"
                                    >
                                      Inactivar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </Can>
                            ) : (
                              <>
                              <Can action="accion-activar-usuario">
                                <AlertDialog>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <AlertDialogTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            aria-label="Activar usuario"
                                          >
                                            <CheckCircle className="h-5 w-5 text-brand-lime hover:text-brand-lime/80 transition-colors" />
                                          </Button>
                                        </AlertDialogTrigger>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Activar</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>¿Activar usuario?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        ¿Estás seguro de que deseas activar el usuario{" "}
                                        <strong>{usuario.primer_nombre} {usuario.primer_apellido}</strong>?
                                        El usuario podrá acceder al sistema nuevamente.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleActivarUsuario(usuario.id)}
                                        className="bg-brand-lime hover:bg-brand-lime/90"
                                      >
                                        Activar
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </Can>
                              <Can action="accion-eliminar-usuario">
                                <AlertDialog>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <AlertDialogTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            aria-label="Eliminar usuario"
                                          >
                                            <Trash2 className="h-5 w-5 text-rose-600 hover:text-rose-800 transition-colors" />
                                          </Button>
                                        </AlertDialogTrigger>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Eliminar</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        ¿Estás seguro de que deseas eliminar permanentemente el usuario{" "}
                                        <strong>{usuario.primer_nombre} {usuario.primer_apellido}</strong>?
                                        Esta acción no se puede deshacer.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleEliminarUsuario(usuario.id)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Eliminar
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </Can>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-3 py-2 text-sm text-gray-900">
                          {usuario.identificacion || "-"}
                        </TableCell>
                        <TableCell className="px-3 py-2 text-sm text-gray-900">
                          {`${usuario.primer_nombre} ${usuario.segundo_nombre || ""} ${usuario.primer_apellido} ${usuario.segundo_apellido || ""}`.trim()}
                        </TableCell>
                        <TableCell className="px-3 py-2 text-sm text-gray-900">
                          {usuario.username}
                        </TableCell>
                        <TableCell className="px-3 py-2 text-sm text-gray-900">
                          {usuario.telefono || "-"}
                        </TableCell>
                        <TableCell className="px-3 py-2 text-sm text-gray-900">
                          {usuario.gen_usuario_roles && usuario.gen_usuario_roles.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                              {usuario.gen_usuario_roles.map((rol, index) => (
                              <Badge
                                  key={rol.id} 
                                variant="outline"
                                  className={`text-xs ${getPerfilColor(rol.rol_id)}`}
                              >
                                  {rol.gen_roles.nombre}
                              </Badge>
                              ))}
                          </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="px-3 py-2">
                          <Badge
                            variant={usuario.activo ? "default" : "secondary"}
                            className={
                              usuario.activo
                                ? "bg-brand-lime/10 text-brand-lime"
                                : "bg-gray-100 text-gray-800"
                            }
                          >
                            {usuario.activo ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="registro" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCrearUsuario)} className="space-y-6">
                  {/* Foto de perfil */}
                  <div className="p-4 border rounded-lg bg-slate-50 mb-2">
                    <h3 className="text-base font-bold text-gray-700 mb-3 flex items-center gap-2">
                      <ImagePlus className="w-5 h-5 text-cyan-600" />
                      Foto de perfil
                    </h3>
                    <div className="flex items-center gap-6">
                      <div className="w-24 h-24 rounded-full overflow-hidden border bg-gray-50 flex items-center justify-center">
                        {(() => {
                          const fotoParaMostrar = fotoPreview || form.watch('foto_base64') || fotoUrl;
                          console.log('🖼️ [Render] fotoParaMostrar:', fotoParaMostrar);
                          console.log('🖼️ [Render] fotoPreview:', fotoPreview);
                          console.log('🖼️ [Render] form.watch foto_base64:', form.watch('foto_base64'));
                          console.log('🖼️ [Render] fotoUrl:', fotoUrl);
                          
                          if (fotoParaMostrar) {
                            return (
                              <img 
                                src={fotoParaMostrar as string} 
                                alt="Foto de perfil" 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  console.error('❌ Error cargando imagen:', e);
                                  console.error('❌ URL de la imagen:', fotoParaMostrar);
                                }}
                                onLoad={() => {
                                  console.log('✅ Imagen cargada correctamente');
                                }}
                              />
                            );
                          }
                          return <User className="w-10 h-10 text-gray-400" />;
                        })()}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById('foto-input')?.click()}
                            disabled={uploadingFoto}
                            className="flex items-center gap-2"
                          >
                            <Upload className="w-4 h-4" />
                            {fotoPreview || form.watch('foto_base64') ? 'Cambiar foto' : 'Subir foto'}
                          </Button>
                          {(fotoPreview || form.watch('foto_base64')) && (
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm" 
                              onClick={handleEliminarFoto}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              disabled={uploadingFoto}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              {editingUser ? 'Eliminar' : 'Quitar'}
                            </Button>
                          )}
                        </div>
                        <input
                          id="foto-input"
                          type="file"
                          accept="image/*"
                          onChange={handleFotoChange}
                          disabled={uploadingFoto}
                          className="hidden"
                          onClick={(e) => (e.target as HTMLInputElement).value = ''}
                        />
                        {uploadingFoto && (
                          <div className="flex items-center gap-2 text-xs text-blue-600">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Procesando foto...</span>
                          </div>
                        )}
                        {(fotoPreview || form.watch('foto_base64')) && !uploadingFoto && (
                          <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                            <CheckCircle className="w-3 h-3 inline mr-1" />
                            {editingUser ? 'Foto cargada. Guarda los cambios para actualizar.' : 'Foto lista para subir'}
                          </div>
                        )}
                        <input type="hidden" {...form.register('foto_base64')} />
                        <p className="text-xs text-gray-500">Formatos: JPG, PNG. Tamaño sugerido: 400x400. Se optimizará automáticamente.</p>
                      </div>
                    </div>
                  </div>
                  {/* Datos Personales */}
                  <div className="p-4 border rounded-lg bg-slate-50 mb-4">
                    <h3 className="text-base font-bold text-gray-700 mb-2 flex items-center gap-2">
                      <User className="w-5 h-5 text-cyan-600" />
                      Datos Personales
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="identificacion"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Identificación *</FormLabel>
                            <FormControl>
                              <Input placeholder="Número de identificación" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

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
                              <Input placeholder="Segundo nombre (opcional)" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

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
                              <Input placeholder="Segundo apellido (opcional)" {...field} />
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
                            <FormLabel>Teléfono</FormLabel>
                            <FormControl>
                              <Input placeholder="Número de teléfono" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Credenciales de Acceso */}
                  <div className="p-4 border rounded-lg bg-slate-50 mb-4">
                    <h3 className="text-base font-bold text-gray-700 mb-2 flex items-center gap-2">
                      <Lock className="w-5 h-5 text-cyan-600" />
                      Credenciales de Acceso
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email *</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="correo@ejemplo.com"
                                autoComplete="off"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Nombre de usuario"
                                autoComplete="off"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                        <>
                          <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Contraseña *</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                  <Input
                                      type={showPassword ? "text" : "password"}
                                    placeholder="Contraseña"
                                    autoComplete="new-password"
                                      className="pr-10"
                                    {...field}
                                  />
                                    <button
                                      type="button"
                                      onClick={() => setShowPassword(!showPassword)}
                                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                                      title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                    >
                                      {showPassword ? (
                                        <Eye className="h-4 w-4" />
                                      ) : (
                                        <EyeOff className="h-4 w-4" />
                                      )}
                                    </button>
                                  </div>
                                </FormControl>
                                <FormMessage />
                                {field.value && (
                                  <div className="mt-2 space-y-1">
                                    <div className="flex items-center gap-2">
                                      <div className={`w-2 h-2 rounded-full ${field.value.length >= 8 ? 'bg-brand-lime' : 'bg-gray-300'}`} />
                                      <span className={`text-xs ${field.value.length >= 8 ? 'text-brand-lime' : 'text-gray-500'}`}>
                                        Mínimo 8 caracteres
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className={`w-2 h-2 rounded-full ${/[a-z]/.test(field.value) ? 'bg-brand-lime' : 'bg-gray-300'}`} />
                                      <span className={`text-xs ${/[a-z]/.test(field.value) ? 'text-brand-lime' : 'text-gray-500'}`}>
                                        Al menos una letra minúscula
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className={`w-2 h-2 rounded-full ${/[A-Z]/.test(field.value) ? 'bg-brand-lime' : 'bg-gray-300'}`} />
                                      <span className={`text-xs ${/[A-Z]/.test(field.value) ? 'text-brand-lime' : 'text-gray-500'}`}>
                                        Al menos una letra mayúscula
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className={`w-2 h-2 rounded-full ${/\d/.test(field.value) ? 'bg-brand-lime' : 'bg-gray-300'}`} />
                                      <span className={`text-xs ${/\d/.test(field.value) ? 'text-brand-lime' : 'text-gray-500'}`}>
                                        Al menos un número
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => {
                              const password = form.watch("password");
                              const isMatch = field.value === password && field.value !== "";
                              return (
                                <FormItem>
                                  <FormLabel>Confirmar Contraseña *</FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                    <Input
                                        type={showConfirmPassword ? "text" : "password"}
                                      placeholder="Confirmar contraseña"
                                      autoComplete="new-password"
                                        className="pr-10"
                                      {...field}
                                    />
                                      <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                                        title={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                      >
                                        {showConfirmPassword ? (
                                          <Eye className="h-4 w-4" />
                                        ) : (
                                          <EyeOff className="h-4 w-4" />
                                        )}
                                      </button>
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                  {field.value && password && (
                                    <div className="mt-2">
                                      <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${isMatch ? 'bg-brand-lime' : 'bg-red-500'}`} />
                                        <span className={`text-xs ${isMatch ? 'text-brand-lime' : 'text-red-600'}`}>
                                          {isMatch ? 'Las contraseñas coinciden' : 'Las contraseñas no coinciden'}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </FormItem>
                              );
                            }}
                          />
                        </>
                    </div>
                  </div>

                  {/* Perfiles y Empresas */}
                  <div className="p-4 border rounded-lg bg-cyan-50 mt-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
                      <Users className="w-5 h-5 text-cyan-600" />
                      Asignaciones
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="perfilIds"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Perfiles *</FormLabel>
                            <FormControl>
                              <MultiSelect
                                options={perfilesActivos.map(perfil => ({
                                  id: perfil.id,
                                  value: perfil.id.toString(),
                                  label: perfil.nombre
                                }))}
                                selected={field.value || []}
                                onSelectionChange={(selected) => {
                                  field.onChange(selected);
                                }}
                                placeholder="Seleccionar perfiles..."
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="empresaIds"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Empresas asociadas</FormLabel>
                            <FormControl>
                              <MultiSelect
                                options={empresas.map(empresa => ({
                                  id: empresa.id!,
                                  value: empresa.id!.toString(),
                                  label: empresa.razon_social
                                }))}
                                selected={field.value || []}
                                onSelectionChange={(selected) => {
                                  field.onChange(selected);
                                }}
                                placeholder="Seleccionar empresas..."
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setActiveTab("usuarios");
                        setEditingUser(null);
                        setFotoUrl("");
                        setFotoPreview(null);
                        form.reset();
                      }}
                    >
                      Cancelar
                    </Button>
                    <Can action={editingUser ? "accion-actualizar-usuario" : "accion-crear-usuario"}>
                    <Button
                      type="submit"
                        className="bg-brand-lime hover:bg-brand-lime/90 text-white border-0 shadow-sm px-6 py-2 rounded text-sm font-medium transition-colors"
                      disabled={createUserMutation.isPending}
                    >
                      {createUserMutation.isPending ?
                        (editingUser ? 'Actualizando...' : 'Guardando...') :
                        (editingUser ? 'Actualizar' : 'Guardar')
                      }
                    </Button>
                    </Can>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
</Tabs>

      {/* Modal informativo para usuario con candidatos relacionados */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Users className="w-5 h-5" />
              Candidatos activos relacionados
            </DialogTitle>
            <DialogDescription>
              No se puede eliminar el usuario porque tiene candidatos activos relacionados.
            </DialogDescription>
          </DialogHeader>

          {userToDelete && candidatosRelacionados.length > 0 && (
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {/* Información de candidatos relacionados */}
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Candidatos activos relacionados ({candidatosRelacionados.length})
                </h4>
                <p className="text-sm text-yellow-700 mb-4">
                  Los siguientes candidatos están activos y mantienen una relación con el usuario que desea eliminar:
                </p>
                <div className="max-h-60 overflow-y-auto space-y-3 pr-2">
                  {candidatosRelacionados.map((candidato, index) => (
                    <div key={index} className="p-4 bg-white rounded-lg border border-yellow-200 shadow-sm">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-gray-900 text-lg">{candidato.nombre}</span>
                            <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
                              Activo
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 space-y-2">
                            {candidato.email && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500">📧</span>
                                <span className="font-medium">{candidato.email}</span>
                              </div>
                            )}
                            {candidato.telefono && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500">📱</span>
                                <span className="font-medium">{candidato.telefono}</span>
                              </div>
                            )}
                            {candidato.fechaCreacion && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500">📅</span>
                                <span className="font-medium">Creado: {new Date(candidato.fechaCreacion).toLocaleDateString('es-ES')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mensaje informativo */}
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <div className="text-red-500 mt-0.5">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-red-800">No se puede eliminar</h4>
                    <p className="text-sm text-red-700 mt-1">
                      Para poder eliminar este usuario, primero debe inactivar o eliminar todos los candidatos activos relacionados.
                      Los candidatos listados arriba están actualmente activos y mantienen una relación con este usuario.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex-shrink-0 gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setUserToDelete(null);
                setCandidatosRelacionados([]);
              }}
              className="ml-auto"
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
</div>
);
};

export default UsuariosPage;





import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Plus, Search, Users, Save, RefreshCw, Loader2, Lock, CheckCircle, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
import { useForm } from "react-hook-form";

// Esquema de validación para crear usuario
const crearUsuarioSchema = z.object({
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
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "La contraseña debe contener al menos una letra mayúscula, una minúscula y un número"),
  confirmPassword: z.string(),
  perfilIds: z.array(z.number()).min(1, "Debe seleccionar al menos un perfil"),
  empresaIds: z.array(z.number()).optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

// Esquema para editar usuario (password opcional)
const editarUsuarioSchema = z.object({
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
  gen_usuario_roles: Array<{ id: number; rol_id: number; created_at: string; gen_roles: { id: number; nombre: string } }>;
  gen_usuario_empresas: Array<{ id: number; empresa_id: number; created_at: string; empresas: { id: number; razon_social: string } }>;
}

const UsuariosPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [activeTab, setActiveTab] = useState("usuarios");
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const { toast } = useToast();
  const { startLoading, stopLoading } = useLoading();
  const queryClient = useQueryClient();

  // Query para obtener usuarios desde Supabase
  const { data: usuarios = [], isLoading, refetch } = useQuery<Usuario[]>({
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
      toast({
        title: "Usuario creado",
        description: "El usuario ha sido creado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      form.reset();
      setActiveTab("usuarios");
    },
    onError: (error: any) => {
      toast({
        title: "Error al crear usuario",
        description: error.message || "Hubo un error al crear el usuario",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data: EditarUsuarioForm) => {
      startLoading();
      try {
        const { password, ...userData } = data;
        return await usuariosService.updateUsuario(userData.id, userData);
      } finally {
        stopLoading();
      }
    },
    onSuccess: () => {
      toast({
        title: "Usuario actualizado",
        description: "El usuario ha sido actualizado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      setEditingUser(null);
      setActiveTab("usuarios");
    },
    onError: (error: any) => {
      toast({
        title: "Error al actualizar usuario",
        description: error.message || "Hubo un error al actualizar el usuario",
        variant: "destructive",
      });
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
      toast({
        title: "Usuario eliminado",
        description: "El usuario ha sido eliminado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error al eliminar usuario",
        description: error.message || "Hubo un error al eliminar el usuario",
        variant: "destructive",
      });
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
      toast({
        title: "Usuario activado",
        description: "El usuario ha sido activado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error al activar usuario",
        description: error.message || "Hubo un error al activar el usuario",
        variant: "destructive",
      });
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
      toast({
        title: "Usuario desactivado",
        description: "El usuario ha sido desactivado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error al desactivar usuario",
        description: error.message || "Hubo un error al desactivar el usuario",
        variant: "destructive",
      });
    },
  });

  // Filtrado de usuarios
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter(usuario => {
      const matchesSearch =
        usuario.primer_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        usuario.primer_apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
        usuario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        usuario.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (usuario.identificacion || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ? true :
          statusFilter === "active" ? usuario.activo :
            !usuario.activo;

      return matchesSearch && matchesStatus;
    });
  }, [usuarios, searchTerm, statusFilter]);

  // Handlers
  const handleEliminarUsuario = async (id: number) => {
    deleteUserMutation.mutate(id);
  };

  const handleActivarUsuario = async (id: number) => {
    activateUserMutation.mutate(id);
  };

  const handleInactivarUsuario = async (id: number) => {
    deactivateUserMutation.mutate(id);
  };

  const handleCrearUsuario = (data: CrearUsuarioForm) => {
    // Filtrar campos que no deben enviarse al backend
    const { confirmPassword, perfilIds, empresaIds, ...userData } = data;
    const password = data.password;

    createUserMutation.mutate({
      ...userData,
      password,
      perfilIds,
      empresaIds
    });
  };

  const handleActualizarUsuario = (data: EditarUsuarioForm) => {
    updateUserMutation.mutate(data);
  };

  const handleEditarUsuario = (usuario: Usuario) => {
    setEditingUser(usuario);
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
      password: "",
      perfilIds: usuario.gen_usuario_roles?.map(r => r.rol_id) || [],
      empresaIds: usuario.gen_usuario_empresas?.map(e => e.empresa_id) || []
    });
    setActiveTab("registro");
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
                <Button
                  onClick={() => {
                    setEditingUser(null);
                    form.reset();
                    setActiveTab("registro");
                  }}
                  className="bg-brand-lime hover:bg-brand-lime/90"
                  size="sm"
                >
                  Adicionar Registro
                </Button>
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
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:border-transparent"
                >
                  <option value="all">Todos los estados</option>
                  <option value="active">Solo activos</option>
                  <option value="inactive">Solo inactivos</option>
                </select>
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
                    <TableHead className="px-4 py-3">Email</TableHead>
                    <TableHead className="px-4 py-3">Username</TableHead>
                    <TableHead className="px-4 py-3">Teléfono</TableHead>
                    <TableHead className="px-4 py-3">Perfiles</TableHead>
                    <TableHead className="px-4 py-3">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!isLoading && (usuariosFiltrados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
                        No hay usuarios disponibles.
                      </TableCell>
                    </TableRow>
                  ) : (
                    usuariosFiltrados.map((usuario) => (
                      <TableRow key={usuario.id} className="hover:bg-gray-50">
                        <TableCell className="px-2 py-1">
                          <div className="flex flex-row gap-1 items-center">
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

                            {usuario.activo ? (
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
                            ) : (
                              <>
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
                          {usuario.email}
                        </TableCell>
                        <TableCell className="px-3 py-2 text-sm text-gray-900">
                          {usuario.username}
                        </TableCell>
                        <TableCell className="px-3 py-2 text-sm text-gray-900">
                          {usuario.telefono || "-"}
                        </TableCell>
                        <TableCell className="px-3 py-2">
                          <div className="flex flex-wrap gap-1">
                            {usuario.gen_usuario_roles?.map((role) => (
                              <Badge
                                key={role.id}
                                variant="outline"
                                className="text-xs bg-brand-lime/10 text-brand-lime"
                              >
                                {role.gen_roles?.nombre || 'Sin nombre'}
                              </Badge>
                            )) || []}
                            {(!usuario.gen_usuario_roles || usuario.gen_usuario_roles.length === 0) && (
                              <span className="text-xs text-gray-400">Sin perfiles</span>
                            )}
                          </div>
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

                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contraseña *</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="Contraseña"
                                autoComplete="new-password"
                                {...field}
                              />
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
                                <Input
                                  type="password"
                                  placeholder="Confirmar contraseña"
                                  autoComplete="new-password"
                                  {...field}
                                />
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
                        form.reset();
                      }}
                    >
                      Cancelar
                    </Button>
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
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
</Tabs>
</div>
);
};

export default UsuariosPage;
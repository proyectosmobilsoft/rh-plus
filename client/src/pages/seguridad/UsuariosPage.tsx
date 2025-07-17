import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Plus, Search, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Checkbox } from "@/components/ui/checkbox";
import { MultiSelect } from "@/components/ui/multi-select";
import { PasswordStrength } from "@/components/ui/password-strength";
// Los tipos se importan automáticamente desde el schema

// Esquema de validación para crear usuario
const crearUsuarioSchema = z.object({
  identificacion: z.string().min(1, "La identificación es requerida"),
  primerNombre: z.string().min(1, "El primer nombre es requerido"),
  segundoNombre: z.string().optional(),
  primerApellido: z.string().min(1, "El primer apellido es requerido"),
  segundoApellido: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email("Email inválido"),
  username: z.string().min(3, "El username debe tener al menos 3 caracteres"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  perfilIds: z.array(z.number()).min(1, "Debe seleccionar al menos un perfil"),
  empresaIds: z.array(z.number()).optional(),
});

type CrearUsuarioForm = z.infer<typeof crearUsuarioSchema>;

interface Perfil {
  id: number;
  nombre: string;
  descripcion?: string;
}

interface Usuario {
  id: number;
  identificacion: string;
  primerNombre: string;
  segundoNombre?: string;
  primerApellido: string;
  segundoApellido?: string;
  telefono?: string;
  email: string;
  username: string;
  activo: boolean;
  fechaCreacion: string;
  perfiles: Array<{
    id: number;
    nombre: string;
    descripcion?: string;
  }>;
}

const UsuariosPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para obtener usuarios
  const { data: usuarios = [], refetch: refetchUsuarios } = useQuery<Usuario[]>({
    queryKey: ["/api/usuarios"],
    staleTime: 0, // Sin caché para actualizaciones inmediatas
    refetchOnWindowFocus: false,
  });

  // Query para obtener perfiles disponibles
  const { data: perfiles = [] } = useQuery<Perfil[]>({
    queryKey: ["/api/perfiles"],
  });

  // Mock data para empresas/almacenes
  const empresas = [
    { id: 1, nombreEmpresa: "Almacén Central Bogotá" },
    { id: 2, nombreEmpresa: "Sucursal Norte" },
    { id: 3, nombreEmpresa: "Depósito Sur" },
    { id: 4, nombreEmpresa: "Centro Logístico Medellín" },
    { id: 5, nombreEmpresa: "Bodega Principal Cali" },
    { id: 6, nombreEmpresa: "Almacén Zona Industrial" },
  ];

  // Formulario para crear usuario
  const form = useForm<CrearUsuarioForm>({
    resolver: zodResolver(crearUsuarioSchema),
    defaultValues: {
      identificacion: "",
      primerNombre: "",
      segundoNombre: "",
      primerApellido: "",
      segundoApellido: "",
      telefono: "",
      email: "",
      username: "",
      password: "",
      perfilIds: [],
      empresaIds: [],
    },
  });

  // Mutation para crear usuario
  const createUsuarioMutation = useMutation({
    mutationFn: async (data: CrearUsuarioForm) => {
      console.log('Enviando datos de usuario:', data);
      const response = await apiRequest("/api/usuarios", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: async () => {
      // Invalidar y refrescar datos automáticamente
      await queryClient.invalidateQueries({ queryKey: ["/api/usuarios"] });
      await queryClient.refetchQueries({ queryKey: ["/api/usuarios"] });
      
      setIsModalOpen(false);
      form.reset({
        identificacion: "",
        primerNombre: "",
        segundoNombre: "",
        primerApellido: "",
        segundoApellido: "",
        telefono: "",
        email: "",
        username: "",
        password: "",
        perfilIds: [],
        empresaIds: [],
      });
      
      toast({
        title: "✅ Usuario creado",
        description: "El usuario se ha creado exitosamente con todos sus perfiles y almacenes asociados.",
        variant: "default",
      });
    },
    onError: (error: any) => {
      console.error('Error creando usuario:', error);
      toast({
        title: "❌ Error al crear usuario",
        description: error.message || "No se pudo crear el usuario",
        variant: "destructive",
      });
    },
  });

  // Mutation para eliminar usuario
  const deleteUsuarioMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/usuarios/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/usuarios"] });
      toast({
        title: "✅ Usuario eliminado",
        description: "El usuario ha sido eliminado exitosamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Error",
        description: error.message || "No se pudo eliminar el usuario.",
        variant: "destructive",
      });
    },
  });

  // Filtrar usuarios basado en búsqueda con useMemo para optimización
  const usuariosFiltrados = useMemo(() => {
    if (!usuarios.length) return [];
    
    return usuarios.filter((usuario) => {
      const searchLower = searchTerm.toLowerCase();
      const nombreCompleto = `${usuario.primerNombre} ${usuario.segundoNombre || ""} ${usuario.primerApellido} ${usuario.segundoApellido || ""}`.toLowerCase();
      
      return (
        nombreCompleto.includes(searchLower) ||
        usuario.email.toLowerCase().includes(searchLower) ||
        usuario.username.toLowerCase().includes(searchLower) ||
        usuario.identificacion.includes(searchTerm)
      );
    });
  }, [usuarios, searchTerm]);

  const handleEliminarUsuario = async (id: number) => {
    deleteUsuarioMutation.mutate(id);
  };

  const handleCrearUsuario = (data: CrearUsuarioForm) => {
    createUsuarioMutation.mutate(data);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-brand-lime" />
          <div>
            <h1 className="text-2xl font-semibold text-brand-gray">
              Gestión de Usuarios
            </h1>
            <p className="text-brand-gray/70">
              Administra usuarios del sistema y sus perfiles asignados
            </p>
          </div>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-brand-lime hover:bg-brand-lime/90 text-white shadow-md">
              <Plus className="w-4 h-4 mr-2" />
              Crear Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-brand-lime">
                Crear Nuevo Usuario
              </DialogTitle>
              <DialogDescription>
                Complete la información del usuario
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCrearUsuario)} className="space-y-4">
                
                {/* Grid principal más compacto - 3 columnas */}
                <div className="grid grid-cols-3 gap-6">
                  {/* Columna 1 - Datos personales */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-gray-700 border-b pb-1">Datos Personales</h4>
                    
                    <FormField
                      control={form.control}
                      name="identificacion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Identificación *</FormLabel>
                          <FormControl>
                            <Input 
                              className="h-11 border-2 border-gray-300 focus:border-brand-lime focus:ring-brand-lime text-base" 
                              placeholder="Número de identificación" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="primerNombre"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Primer Nombre *</FormLabel>
                          <FormControl>
                            <Input 
                              className="h-11 border-2 border-gray-300 focus:border-brand-lime focus:ring-brand-lime text-base" 
                              placeholder="Primer nombre" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="segundoNombre"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Segundo Nombre</FormLabel>
                          <FormControl>
                            <Input 
                              className="h-11 border-2 border-gray-300 focus:border-green-500 focus:ring-green-500 text-base" 
                              placeholder="Segundo nombre" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="primerApellido"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Primer Apellido *</FormLabel>
                          <FormControl>
                            <Input 
                              className="h-11 border-2 border-gray-300 focus:border-green-500 focus:ring-green-500 text-base" 
                              placeholder="Primer apellido" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="segundoApellido"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Segundo Apellido</FormLabel>
                          <FormControl>
                            <Input 
                              className="h-11 border-2 border-gray-300 focus:border-green-500 focus:ring-green-500 text-base" 
                              placeholder="Segundo apellido" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Columna 2 - Contacto y credenciales */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-gray-700 border-b pb-1">Contacto y Acceso</h4>
                    
                    <FormField
                      control={form.control}
                      name="telefono"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Teléfono</FormLabel>
                          <FormControl>
                            <Input 
                              className="h-11 border-2 border-gray-300 focus:border-green-500 focus:ring-green-500 text-base" 
                              placeholder="Número de teléfono" 
                              {...field} 
                            />
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
                          <FormLabel className="text-sm font-medium">Email *</FormLabel>
                          <FormControl>
                            <Input 
                              className="h-11 border-2 border-gray-300 focus:border-green-500 focus:ring-green-500 text-base" 
                              type="email" 
                              placeholder="correo@ejemplo.com" 
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
                          <FormLabel className="text-sm font-medium">Username *</FormLabel>
                          <FormControl>
                            <Input 
                              className="h-11 border-2 border-gray-300 focus:border-green-500 focus:ring-green-500 text-base" 
                              placeholder="Nombre de usuario" 
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
                          <FormLabel className="text-sm font-medium">Contraseña *</FormLabel>
                          <FormControl>
                            <Input 
                              className="h-11 border-2 border-gray-300 focus:border-green-500 focus:ring-green-500 text-base" 
                              type="password" 
                              placeholder="Contraseña (mín. 6 caracteres)" 
                              {...field} 
                            />
                          </FormControl>
                          <PasswordStrength password={field.value} />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Columna 3 - Perfiles y Almacenes */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-gray-700 border-b pb-1">Asignaciones</h4>
                    
                    <FormField
                      control={form.control}
                      name="perfilIds"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Perfiles Asociados *</FormLabel>
                          <FormControl>
                            <div className="border-2 border-gray-300 rounded-md">
                              <MultiSelect
                                options={perfiles.map(perfil => ({
                                  id: perfil.id,
                                  name: perfil.nombre
                                }))}
                                selected={field.value || []}
                                onSelectionChange={(selected) => {
                                  field.onChange(selected);
                                }}
                                placeholder="Seleccione perfiles"
                              />
                            </div>
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
                          <FormLabel className="text-sm font-medium">Almacenes (Opcional)</FormLabel>
                          <FormControl>
                            <div className="border-2 border-gray-300 rounded-md">
                              <MultiSelect
                                options={empresas.map(empresa => ({
                                  id: empresa.id,
                                  name: empresa.nombreEmpresa
                                }))}
                                selected={field.value || []}
                                onSelectionChange={(selected) => {
                                  field.onChange(selected);
                                }}
                                placeholder="Seleccione almacenes"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Botones */}
                <div className="flex justify-end gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createUsuarioMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {createUsuarioMutation.isPending ? "Creando..." : "Crear Usuario"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Barra de búsqueda */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar por nombre, email, username o identificación..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Lista de usuarios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Usuarios Registrados</span>
            <Badge variant="secondary">{usuariosFiltrados.length} usuarios</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {usuariosFiltrados.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? "No se encontraron usuarios" : "No hay usuarios registrados"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Identificación
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Nombre Completo
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Email
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Username
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Teléfono
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Perfiles
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Estado
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {usuariosFiltrados.map((usuario) => (
                    <tr key={usuario.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {usuario.identificacion}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {`${usuario.primerNombre} ${usuario.segundoNombre || ""} ${usuario.primerApellido} ${usuario.segundoApellido || ""}`.trim()}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {usuario.email}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {usuario.username}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {usuario.telefono || "-"}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {usuario.perfiles.map((perfil) => (
                            <Badge
                              key={perfil.id}
                              variant="outline"
                              className="text-xs"
                            >
                              {perfil.nombre}
                            </Badge>
                          ))}
                          {usuario.perfiles.length === 0 && (
                            <span className="text-xs text-gray-400">Sin perfiles</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={usuario.activo ? "default" : "secondary"}
                          className={
                            usuario.activo
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }
                        >
                          {usuario.activo ? "Activo" : "Inactivo"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex gap-1 justify-end">
                          <Link href={`/seguridad/usuarios/editar/${usuario.id}`}>
                            <Button
                              size="sm"
                              className="h-8 w-8 p-0 bg-blue-500 hover:bg-blue-600 text-white border-0 rounded"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                className="h-8 w-8 p-0 bg-red-500 hover:bg-red-600 text-white border-0 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  ¿Estás seguro de que deseas eliminar el usuario{" "}
                                  <strong>{usuario.primerNombre} {usuario.primerApellido}</strong>?
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
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UsuariosPage;
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
  const { data: usuarios = [] } = useQuery<Usuario[]>({
    queryKey: ["/api/usuarios"],
    staleTime: 30000, // Cache por 30 segundos
    refetchOnWindowFocus: false,
  });

  // Query para obtener perfiles disponibles
  const { data: perfiles = [] } = useQuery<Perfil[]>({
    queryKey: ["/api/perfiles"],
  });

  // Query para obtener empresas disponibles
  const { data: empresas = [] } = useQuery<any[]>({
    queryKey: ["/api/empresas"],
  });

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
      const response = await apiRequest("/api/usuarios", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "✅ Usuario creado",
        description: "El usuario se ha creado exitosamente",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/usuarios"] });
      setIsModalOpen(false);
      form.reset();
    },
    onError: (error: any) => {
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
          <Users className="w-8 h-8 text-gray-600" />
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Gestión de Usuarios
            </h1>
            <p className="text-gray-600">
              Administra usuarios del sistema y sus perfiles asignados
            </p>
          </div>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Crear Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-green-700">
                Crear Nuevo Usuario
              </DialogTitle>
              <DialogDescription>
                Complete la información del usuario incluyendo sus datos personales, credenciales y perfiles asignados.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCrearUsuario)} className="space-y-6">
                {/* Información Personal */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Información Personal</h3>
                  <div className="grid grid-cols-2 gap-4">
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

                    <FormField
                      control={form.control}
                      name="primerNombre"
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
                      name="segundoNombre"
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
                      name="primerApellido"
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
                      name="segundoApellido"
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
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Credenciales de Acceso</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre de Usuario *</FormLabel>
                          <FormControl>
                            <Input placeholder="username" {...field} />
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
                            <Input type="password" placeholder="Contraseña (mín. 6 caracteres)" {...field} />
                          </FormControl>
                          <PasswordStrength password={field.value} />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Perfiles y Almacenes - layout como en la imagen */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Perfiles Asociados */}
                  <FormField
                    control={form.control}
                    name="perfilIds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Perfiles Asociados *</FormLabel>
                        <FormControl>
                          <MultiSelect
                            options={perfiles.map(perfil => ({
                              value: perfil.id.toString(),
                              label: perfil.nombre
                            }))}
                            selected={field.value?.map(id => id.toString()) || []}
                            onChange={(selected) => {
                              field.onChange(selected.map(id => parseInt(id)));
                            }}
                            placeholder="Seleccione un Perfil"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Almacenes Asociados */}
                  <FormField
                    control={form.control}
                    name="empresaIds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Almacenes Asociados *</FormLabel>
                        <FormControl>
                          <MultiSelect
                            options={empresas.map(empresa => ({
                              value: empresa.id.toString(),
                              label: empresa.nombreEmpresa
                            }))}
                            selected={field.value?.map(id => id.toString()) || []}
                            onChange={(selected) => {
                              field.onChange(selected.map(id => parseInt(id)));
                            }}
                            placeholder="Seleccione un almacén"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
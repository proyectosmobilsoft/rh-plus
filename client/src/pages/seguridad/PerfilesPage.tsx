import React, { useState } from "react";
import { Plus, Edit, Trash2, X, ChevronDown, Eye, Settings, Building, Users, FileText, Award, BarChart, UserCheck, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Schema para el formulario de perfil
const perfilSchema = z.object({
  codigo: z.number(),
  nombre: z.string().min(1, "El nombre es requerido"),
  descripcion: z.string().optional(),
  permisos: z.array(z.object({
    menuNodeId: z.number(),
    menuNodeName: z.string(),
    acciones: z.array(z.number()).default([])
  })).default([])
});

type PerfilForm = z.infer<typeof perfilSchema>;

// Interfaces para las vistas del sistema
interface ViewAction {
  id: number;
  nombre: string;
  displayName: string;
  descripcion: string;
  tipo: string;
  orden: number;
  activo: boolean;
}

interface SystemView {
  id: number;
  nombre: string;
  displayName: string;
  descripcion: string;
  ruta: string;
  modulo: string;
  icono: string;
  orden: number;
  activo: boolean;
  acciones: ViewAction[];
}

// Mock data de las vistas del sistema
const mockSystemViews: SystemView[] = [
  {
    id: 1,
    nombre: "dashboard",
    displayName: "Dashboard General",
    descripcion: "Panel principal del sistema con métricas y estadísticas",
    ruta: "/admin/dashboard",
    modulo: "GENERAL",
    icono: "LayoutDashboard",
    orden: 1,
    activo: true,
    acciones: [
      { id: 1, nombre: "ver_dashboard", displayName: "Ver Dashboard", descripcion: "Acceso al panel principal", tipo: "visualizacion", orden: 1, activo: true },
      { id: 2, nombre: "ver_estadisticas", displayName: "Ver Estadísticas", descripcion: "Visualizar métricas del sistema", tipo: "visualizacion", orden: 2, activo: true },
      { id: 3, nombre: "exportar_dashboard", displayName: "Exportar Dashboard", descripcion: "Exportar datos del dashboard", tipo: "exportacion", orden: 3, activo: true }
    ]
  },
  {
    id: 2,
    nombre: "usuarios",
    displayName: "Gestión de Usuarios",
    descripcion: "Administración completa de usuarios del sistema",
    ruta: "/admin/usuarios",
    modulo: "SEGURIDAD",
    icono: "Users",
    orden: 1,
    activo: true,
    acciones: [
      { id: 4, nombre: "ver_usuarios", displayName: "Ver Usuarios", descripcion: "Listar todos los usuarios", tipo: "visualizacion", orden: 1, activo: true },
      { id: 5, nombre: "crear_usuario", displayName: "Crear Usuario", descripcion: "Registrar nuevos usuarios", tipo: "creacion", orden: 2, activo: true },
      { id: 6, nombre: "editar_usuario", displayName: "Editar Usuario", descripcion: "Modificar datos de usuarios", tipo: "edicion", orden: 3, activo: true },
      { id: 7, nombre: "eliminar_usuario", displayName: "Eliminar Usuario", descripcion: "Desactivar o eliminar usuarios", tipo: "eliminacion", orden: 4, activo: true },
      { id: 8, nombre: "resetear_password", displayName: "Resetear Contraseña", descripcion: "Restablecer contraseñas de usuario", tipo: "especial", orden: 5, activo: true }
    ]
  },
  {
    id: 3,
    nombre: "perfiles",
    displayName: "Perfiles de Usuario",
    descripcion: "Gestión de perfiles y roles del sistema",
    ruta: "/admin/perfiles",
    modulo: "SEGURIDAD",
    icono: "UserCircle",
    orden: 2,
    activo: true,
    acciones: [
      { id: 9, nombre: "ver_perfiles", displayName: "Ver Perfiles", descripcion: "Listar perfiles de usuario", tipo: "visualizacion", orden: 1, activo: true },
      { id: 10, nombre: "crear_perfil", displayName: "Crear Perfil", descripcion: "Crear nuevos perfiles", tipo: "creacion", orden: 2, activo: true },
      { id: 11, nombre: "editar_perfil", displayName: "Editar Perfil", descripcion: "Modificar perfiles existentes", tipo: "edicion", orden: 3, activo: true },
      { id: 12, nombre: "eliminar_perfil", displayName: "Eliminar Perfil", descripcion: "Eliminar perfiles de usuario", tipo: "eliminacion", orden: 4, activo: true }
    ]
  },
  {
    id: 4,
    nombre: "candidatos",
    displayName: "Gestión de Candidatos",
    descripcion: "Administración de candidatos y postulantes",
    ruta: "/admin/candidatos",
    modulo: "REGISTROS",
    icono: "UserPlus",
    orden: 1,
    activo: true,
    acciones: [
      { id: 13, nombre: "ver_candidatos", displayName: "Ver Candidatos", descripcion: "Listar candidatos", tipo: "visualizacion", orden: 1, activo: true },
      { id: 14, nombre: "crear_candidato", displayName: "Crear Candidato", descripcion: "Registrar nuevos candidatos", tipo: "creacion", orden: 2, activo: true },
      { id: 15, nombre: "editar_candidato", displayName: "Editar Candidato", descripcion: "Modificar datos de candidatos", tipo: "edicion", orden: 3, activo: true },
      { id: 16, nombre: "eliminar_candidato", displayName: "Eliminar Candidato", descripcion: "Eliminar candidatos", tipo: "eliminacion", orden: 4, activo: true },
      { id: 17, nombre: "aprobar_candidato", displayName: "Aprobar Candidato", descripcion: "Aprobar solicitudes de candidatos", tipo: "aprobacion", orden: 5, activo: true }
    ]
  },
  {
    id: 5,
    nombre: "empresas",
    displayName: "Empresas Afiliadas",
    descripcion: "Gestión de empresas cliente y afiliadas",
    ruta: "/admin/empresas",
    modulo: "EMPRESA",
    icono: "Building",
    orden: 1,
    activo: true,
    acciones: [
      { id: 18, nombre: "ver_empresas", displayName: "Ver Empresas", descripcion: "Listar empresas afiliadas", tipo: "visualizacion", orden: 1, activo: true },
      { id: 19, nombre: "crear_empresa", displayName: "Crear Empresa", descripcion: "Registrar nuevas empresas", tipo: "creacion", orden: 2, activo: true },
      { id: 20, nombre: "editar_empresa", displayName: "Editar Empresa", descripcion: "Modificar datos de empresas", tipo: "edicion", orden: 3, activo: true },
      { id: 21, nombre: "eliminar_empresa", displayName: "Eliminar Empresa", descripcion: "Desactivar empresas", tipo: "eliminacion", orden: 4, activo: true }
    ]
  },
  {
    id: 6,
    nombre: "qr",
    displayName: "Códigos QR",
    descripcion: "Gestión y generación de códigos QR",
    ruta: "/admin/qr",
    modulo: "RECURSOS",
    icono: "QrCode",
    orden: 1,
    activo: true,
    acciones: [
      { id: 22, nombre: "ver_qr", displayName: "Ver Códigos QR", descripcion: "Visualizar códigos QR", tipo: "visualizacion", orden: 1, activo: true },
      { id: 23, nombre: "generar_qr", displayName: "Generar QR", descripcion: "Crear nuevos códigos QR", tipo: "creacion", orden: 2, activo: true },
      { id: 24, nombre: "eliminar_qr", displayName: "Eliminar QR", descripcion: "Eliminar códigos QR", tipo: "eliminacion", orden: 3, activo: true }
    ]
  },
  {
    id: 7,
    nombre: "analistas",
    displayName: "Gestión de Analistas",
    descripcion: "Administración de analistas y especialistas",
    ruta: "/admin/analistas",
    modulo: "RECURSOS",
    icono: "UserCheck",
    orden: 2,
    activo: true,
    acciones: [
      { id: 25, nombre: "ver_analistas", displayName: "Ver Analistas", descripcion: "Listar analistas", tipo: "visualizacion", orden: 1, activo: true },
      { id: 26, nombre: "crear_analista", displayName: "Crear Analista", descripcion: "Registrar nuevos analistas", tipo: "creacion", orden: 2, activo: true },
      { id: 27, nombre: "editar_analista", displayName: "Editar Analista", descripcion: "Modificar datos de analistas", tipo: "edicion", orden: 3, activo: true },
      { id: 28, nombre: "eliminar_analista", displayName: "Eliminar Analista", descripcion: "Eliminar analistas", tipo: "eliminacion", orden: 4, activo: true },
      { id: 29, nombre: "asignar_casos", displayName: "Asignar Casos", descripcion: "Asignar casos a analistas", tipo: "especial", orden: 5, activo: true }
    ]
  },
  {
    id: 8,
    nombre: "ordenes",
    displayName: "Expedición de Órdenes",
    descripcion: "Gestión de órdenes médicas y laboratoriales",
    ruta: "/admin/ordenes",
    modulo: "ORDENES",
    icono: "FileText",
    orden: 1,
    activo: true,
    acciones: [
      { id: 30, nombre: "ver_ordenes", displayName: "Ver Órdenes", descripcion: "Listar órdenes médicas", tipo: "visualizacion", orden: 1, activo: true },
      { id: 31, nombre: "crear_orden", displayName: "Crear Orden", descripcion: "Generar nuevas órdenes", tipo: "creacion", orden: 2, activo: true },
      { id: 32, nombre: "editar_orden", displayName: "Editar Orden", descripcion: "Modificar órdenes existentes", tipo: "edicion", orden: 3, activo: true },
      { id: 33, nombre: "eliminar_orden", displayName: "Eliminar Orden", descripcion: "Cancelar órdenes", tipo: "eliminacion", orden: 4, activo: true },
      { id: 34, nombre: "firmar_orden", displayName: "Firmar Orden", descripcion: "Firmar órdenes médicas", tipo: "aprobacion", orden: 5, activo: true }
    ]
  },
  {
    id: 9,
    nombre: "certificados",
    displayName: "Expedición de Certificados",
    descripcion: "Gestión de certificados médicos y laboratoriales",
    ruta: "/admin/certificados",
    modulo: "CERTIFICADOS",
    icono: "Award",
    orden: 1,
    activo: true,
    acciones: [
      { id: 35, nombre: "ver_certificados", displayName: "Ver Certificados", descripcion: "Listar certificados", tipo: "visualizacion", orden: 1, activo: true },
      { id: 36, nombre: "crear_certificado", displayName: "Crear Certificado", descripcion: "Generar certificados", tipo: "creacion", orden: 2, activo: true },
      { id: 37, nombre: "editar_certificado", displayName: "Editar Certificado", descripcion: "Modificar certificados", tipo: "edicion", orden: 3, activo: true },
      { id: 38, nombre: "eliminar_certificado", displayName: "Eliminar Certificado", descripcion: "Anular certificados", tipo: "eliminacion", orden: 4, activo: true },
      { id: 39, nombre: "firmar_certificado", displayName: "Firmar Certificado", descripcion: "Firmar certificados médicos", tipo: "aprobacion", orden: 5, activo: true }
    ]
  },
  {
    id: 10,
    nombre: "maestro",
    displayName: "Configuración Maestro",
    descripcion: "Gestión de datos maestros y configuraciones",
    ruta: "/admin/maestro",
    modulo: "CONFIGURACION",
    icono: "Settings",
    orden: 1,
    activo: true,
    acciones: [
      { id: 40, nombre: "ver_maestro", displayName: "Ver Configuración", descripcion: "Visualizar configuraciones", tipo: "visualizacion", orden: 1, activo: true },
      { id: 41, nombre: "editar_maestro", displayName: "Editar Configuración", descripcion: "Modificar configuraciones", tipo: "edicion", orden: 2, activo: true },
      { id: 42, nombre: "exportar_maestro", displayName: "Exportar Configuración", descripcion: "Exportar datos maestros", tipo: "exportacion", orden: 3, activo: true }
    ]
  },
  {
    id: 11,
    nombre: "reportes",
    displayName: "Reportes y Análisis",
    descripcion: "Generación de reportes y análisis estadísticos",
    ruta: "/admin/reportes",
    modulo: "REPORTES",
    icono: "BarChart",
    orden: 1,
    activo: true,
    acciones: [
      { id: 43, nombre: "ver_reportes", displayName: "Ver Reportes", descripcion: "Visualizar reportes", tipo: "visualizacion", orden: 1, activo: true },
      { id: 44, nombre: "generar_reporte", displayName: "Generar Reporte", descripcion: "Crear nuevos reportes", tipo: "creacion", orden: 2, activo: true },
      { id: 45, nombre: "exportar_reporte", displayName: "Exportar Reporte", descripcion: "Exportar reportes en diferentes formatos", tipo: "exportacion", orden: 3, activo: true },
      { id: 46, nombre: "programar_reporte", displayName: "Programar Reporte", descripcion: "Programar generación automática", tipo: "especial", orden: 4, activo: true }
    ]
  }
];

const PerfilesPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerfil, setEditingPerfil] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("perfiles");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Funciones auxiliares para las vistas
  const getModuleColor = (modulo: string) => {
    const colors: Record<string, string> = {
      'GENERAL': 'bg-brand-lime/10 text-brand-lime border-brand-lime/20',
      'SEGURIDAD': 'bg-brand-turquoise/10 text-brand-turquoise border-brand-turquoise/20',
      'REGISTROS': 'bg-brand-lime/10 text-brand-lime border-brand-lime/20',
      'EMPRESA': 'bg-brand-turquoise/10 text-brand-turquoise border-brand-turquoise/20',
      'RECURSOS': 'bg-brand-lime/10 text-brand-lime border-brand-lime/20',
      'ORDENES': 'bg-brand-turquoise/10 text-brand-turquoise border-brand-turquoise/20',
      'CERTIFICADOS': 'bg-brand-lime/10 text-brand-lime border-brand-lime/20',
      'CONFIGURACION': 'bg-brand-gray/10 text-brand-gray border-brand-gray/20',
      'REPORTES': 'bg-brand-turquoise/10 text-brand-turquoise border-brand-turquoise/20'
    };
    return colors[modulo] || 'bg-brand-gray/10 text-brand-gray border-brand-gray/20';
  };

  const getActionTypeColor = (tipo: string) => {
    const colors: Record<string, string> = {
      'visualizacion': 'bg-blue-100 text-blue-800',
      'creacion': 'bg-green-100 text-green-800',
      'edicion': 'bg-yellow-100 text-yellow-800',
      'eliminacion': 'bg-red-100 text-red-800',
      'exportacion': 'bg-purple-100 text-purple-800',
      'aprobacion': 'bg-orange-100 text-orange-800',
      'especial': 'bg-indigo-100 text-indigo-800'
    };
    return colors[tipo] || 'bg-gray-100 text-gray-800';
  };

  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, React.ComponentType<any>> = {
      'LayoutDashboard': Eye,
      'Users': Users,
      'UserCircle': Users,
      'UserPlus': Users,
      'Building': Building,
      'QrCode': QrCode,
      'UserCheck': UserCheck,
      'FileText': FileText,
      'Award': Award,
      'Settings': Settings,
      'BarChart': BarChart
    };
    return iconMap[iconName] || Eye;
  };

  // Fetch perfiles
  const { data: perfiles = [], isLoading } = useQuery({
    queryKey: ['perfiles'],
    queryFn: async () => {
      const response = await fetch('/api/perfiles');
      if (!response.ok) throw new Error('Failed to fetch perfiles');
      return response.json();
    }
  });

  // Usar datos mock para las vistas en lugar de la base de datos
  const menuNodes = mockSystemViews.map(vista => ({
    id: vista.id,
    name: vista.displayName,
    displayName: vista.displayName,
    descripcion: vista.descripcion,
    modulo: vista.modulo,
    ruta: vista.ruta
  }));

  // Obtener acciones para una vista específica usando datos mock
  const getActionsForNode = async (nodeId: number) => {
    const vista = mockSystemViews.find(v => v.id === nodeId);
    if (!vista) return [];
    
    // Convertir acciones al formato esperado por el componente
    return vista.acciones.map(accion => ({
      id: accion.id,
      nombre: accion.nombre,
      displayName: accion.displayName,
      descripcion: accion.descripcion,
      tipo: accion.tipo
    }));
  };

  const form = useForm<PerfilForm>({
    resolver: zodResolver(perfilSchema),
    defaultValues: {
      codigo: 0,
      nombre: "",
      descripcion: "",
      permisos: []
    }
  });

  const { fields: permisosFields, append: appendPermiso, remove: removePermiso } = useFieldArray({
    control: form.control,
    name: "permisos"
  });

  // Create/Update perfil mutation
  const savePerfilMutation = useMutation({
    mutationFn: async (data: PerfilForm) => {
      const url = editingPerfil ? `/api/perfiles/${editingPerfil.id}` : '/api/perfiles';
      const method = editingPerfil ? 'PUT' : 'POST';
      
      return await apiRequest(url, {
        method,
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['perfiles'] });
      setIsModalOpen(false);
      setEditingPerfil(null);
      
      // Limpiar completamente el formulario después de crear/editar
      form.reset({
        codigo: perfiles.length + 1,
        nombre: "",
        descripcion: "",
        permisos: []
      });
      
      toast({
        title: "Éxito",
        description: editingPerfil ? "Perfil actualizado correctamente" : "Perfil creado correctamente",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Error al guardar el perfil",
        variant: "destructive",
      });
    }
  });

  // Delete perfil mutation
  const deletePerfilMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/perfiles/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['perfiles'] });
      toast({
        title: "Éxito",
        description: "Perfil eliminado correctamente",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Error al eliminar el perfil",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: PerfilForm) => {
    savePerfilMutation.mutate(data);
  };

  const handleEdit = async (perfil: any) => {
    setEditingPerfil(perfil);
    
    try {
      // Load existing permissions for this profile
      const response = await fetch(`/api/perfiles/${perfil.id}/permisos`);
      if (!response.ok) throw new Error('Failed to load permissions');
      const existingPermisos = await response.json();
      
      form.reset({
        codigo: perfil.id,
        nombre: perfil.nombre,
        descripcion: perfil.descripcion || "",
        permisos: existingPermisos
      });
      
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error loading permissions:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los permisos del perfil",
        variant: "destructive",
      });
      
      // Fallback: open form without permissions
      form.reset({
        codigo: perfil.id,
        nombre: perfil.nombre,
        descripcion: perfil.descripcion || "",
        permisos: []
      });
      setIsModalOpen(true);
    }
  };

  const handleDelete = (id: number) => {
    deletePerfilMutation.mutate(id);
  };

  const addPermiso = async (menuNodeId: number, menuNodeName: string) => {
    const exists = permisosFields.find(p => p.menuNodeId === menuNodeId);
    if (!exists) {
      appendPermiso({
        menuNodeId,
        menuNodeName,
        acciones: []
      });
    }
  };

  if (isLoading) {
    return <div className="p-6">Cargando...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Perfiles y Vistas</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="perfiles">Perfiles de Usuario</TabsTrigger>
          <TabsTrigger value="vistas">Vistas del Sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="perfiles" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">Gestión de Perfiles</h2>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                setEditingPerfil(null);
                form.reset({
                  codigo: perfiles.length + 1,
                  nombre: "",
                  descripcion: "",
                  permisos: []
                });
              }}
              className="bg-green-500 hover:bg-green-600 text-white border-0 shadow-sm px-4 py-2 rounded text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Perfil
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPerfil ? 'Editar Perfil' : 'Registro de Perfiles'}
              </DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="codigo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            value={String(field.value).padStart(2, '0')}
                            disabled
                            className="bg-red-50 text-red-600 font-semibold"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="nombre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre del perfil" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Sección de permisos y acciones */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">LISTADO DE PERMISOS Y ACCIONES RELACIONADAS</h3>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm font-medium text-gray-700 border-b pb-2">
                    <div>Código</div>
                    <div>Nombre</div>
                    <div>Acciones</div>
                  </div>

                  {/* Select para agregar nueva vista */}
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Select onValueChange={(value) => {
                        const nodeId = parseInt(value);
                        const node = menuNodes.find((n: any) => n.id === nodeId);
                        if (node) {
                          addPermiso(nodeId, node.displayName);
                        }
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar vista del sistema..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-64 overflow-y-auto">
                          {Object.entries(
                            menuNodes.reduce((acc, node) => {
                              if (!acc[node.modulo]) acc[node.modulo] = [];
                              acc[node.modulo].push(node);
                              return acc;
                            }, {} as Record<string, any[]>)
                          ).map(([modulo, nodes]) => (
                            <div key={modulo}>
                              <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
                                {modulo}
                              </div>
                              {nodes.map((node: any) => (
                                <SelectItem key={node.id} value={String(node.id)} className="pl-4">
                                  <div className="flex flex-col">
                                    <span className="font-medium">{node.displayName}</span>
                                    <span className="text-xs text-gray-500">{node.ruta}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </div>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      className="bg-green-500 hover:bg-green-600 text-white border-0 rounded px-4 py-2"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Lista de permisos agregados */}
                  {permisosFields.map((campo, index) => (
                    <PermisoRow
                      key={campo.id}
                      campo={campo}
                      index={index}
                      form={form}
                      onRemove={() => removePermiso(index)}
                      getActionsForNode={getActionsForNode}
                    />
                  ))}
                </div>

                <FormField
                  control={form.control}
                  name="descripcion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descripción del perfil..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingPerfil(null);
                      form.reset();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit"
                    className="bg-green-500 hover:bg-green-600 text-white border-0 shadow-sm px-6 py-2 rounded text-sm font-medium transition-colors"
                    disabled={savePerfilMutation.isPending}
                  >
                    {savePerfilMutation.isPending ? 'Guardando...' : 'Guardar'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de perfiles */}
      <Card>
        <CardHeader>
          <CardTitle>Perfiles del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Código</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Nombre</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Descripción</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {perfiles.map((perfil: any) => (
                  <tr key={perfil.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-sm">{String(perfil.id).padStart(2, '0')}</td>
                    <td className="py-3 px-4 font-medium">{perfil.nombre}</td>
                    <td className="py-3 px-4 text-gray-600">{perfil.descripcion || '-'}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          size="sm"
                          onClick={() => handleEdit(perfil)}
                          className="h-8 w-8 p-0 bg-blue-500 hover:bg-blue-600 text-white border-0 rounded"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              className="h-8 w-8 p-0 bg-red-500 hover:bg-red-600 text-white border-0 rounded"
                              disabled={deletePerfilMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar perfil?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Se eliminará permanentemente el perfil "{perfil.nombre}" y todos sus permisos asociados.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(perfil.id)}
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
            
            {perfiles.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No hay perfiles registrados
              </div>
            )}
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="vistas" className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Vistas del Sistema</h2>
            <div className="text-sm text-gray-600">
              {mockSystemViews.length} vistas disponibles con {mockSystemViews.reduce((sum, v) => sum + v.acciones.length, 0)} acciones totales
            </div>
          </div>

          {/* Grid de vistas organizadas por módulo */}
          <div className="space-y-6">
            {Object.entries(
              mockSystemViews.reduce((acc, vista) => {
                if (!acc[vista.modulo]) acc[vista.modulo] = [];
                acc[vista.modulo].push(vista);
                return acc;
              }, {} as Record<string, SystemView[]>)
            ).map(([modulo, vistas]) => (
              <Card key={modulo}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge className={getModuleColor(modulo)} variant="outline">
                        {modulo}
                      </Badge>
                      <span>Módulo {modulo}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {vistas.length} vistas
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {vistas.map((vista) => {
                      const IconComponent = getIconComponent(vista.icono);
                      return (
                        <Card key={vista.id} className="border hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-3 mb-3">
                              <div className="p-2 bg-gray-100 rounded-lg">
                                <IconComponent className="h-5 w-5 text-gray-600" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-medium text-gray-900">{vista.displayName}</h3>
                                <p className="text-xs text-gray-500">{vista.ruta}</p>
                              </div>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-3">{vista.descripcion}</p>
                            
                            {/* Acciones disponibles */}
                            <div className="space-y-2">
                              <div className="text-xs font-medium text-gray-700 mb-1">
                                Acciones disponibles ({vista.acciones.length}):
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {vista.acciones.map((accion) => (
                                  <Badge 
                                    key={accion.id} 
                                    className={getActionTypeColor(accion.tipo)} 
                                    variant="outline"
                                  >
                                    {accion.displayName}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            
                            {/* Estado */}
                            <div className="mt-3 flex items-center justify-between">
                              <Badge variant={vista.activo ? "default" : "secondary"}>
                                {vista.activo ? "Activa" : "Inactiva"}
                              </Badge>
                              <div className="text-xs text-gray-500">
                                Orden: {vista.orden}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Resumen estadístico */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen Estadístico</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{mockSystemViews.length}</div>
                  <div className="text-sm text-gray-600">Vistas Totales</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {mockSystemViews.reduce((sum, v) => sum + v.acciones.filter(a => a.tipo === 'visualizacion').length, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Acciones de Vista</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {mockSystemViews.reduce((sum, v) => sum + v.acciones.filter(a => a.tipo === 'creacion').length, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Acciones de Creación</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {mockSystemViews.reduce((sum, v) => sum + v.acciones.filter(a => a.tipo === 'edicion').length, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Acciones de Edición</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Componente MultiSelect para acciones
const ActionMultiSelect = ({ actions, selectedActions, onSelectionChange, isLoading }: {
  actions: any[];
  selectedActions: number[];
  onSelectionChange: (actions: number[]) => void;
  isLoading: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleAction = (actionId: number) => {
    if (selectedActions.includes(actionId)) {
      onSelectionChange(selectedActions.filter(id => id !== actionId));
    } else {
      onSelectionChange([...selectedActions, actionId]);
    }
  };

  const removeAction = (actionId: number) => {
    onSelectionChange(selectedActions.filter(id => id !== actionId));
  };

  const selectedActionsData = actions.filter(action => selectedActions.includes(action.id));

  return (
    <div className="w-full">
      {/* Selected Actions Display */}
      <div className="flex flex-wrap gap-1 mb-2">
        {selectedActionsData.map((action) => (
          <Badge
            key={action.id}
            variant="secondary"
            className="flex items-center gap-1 px-2 py-1 text-xs"
          >
            {action.nombre}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-auto p-0 w-3 h-3 hover:bg-transparent"
              onClick={() => removeAction(action.id)}
            >
              <X className="h-2 w-2" />
            </Button>
          </Badge>
        ))}
      </div>

      {/* Dropdown */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            className="w-full justify-between"
            disabled={isLoading}
          >
            {isLoading 
              ? "Cargando acciones..." 
              : selectedActions.length > 0 
                ? `${selectedActions.length} acciones seleccionadas`
                : "Seleccionar acciones"
            }
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar acciones..." />
            <CommandEmpty>No se encontraron acciones.</CommandEmpty>
            <CommandGroup>
              {actions.map((action) => (
                <CommandItem
                  key={action.id}
                  onSelect={() => toggleAction(action.id)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{action.nombre} ({action.tipo})</span>
                    {selectedActions.includes(action.id) && (
                      <span className="ml-2 text-green-600 font-bold">✓</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

// Componente para cada fila de permiso
const PermisoRow = ({ campo, index, form, onRemove, getActionsForNode }: any) => {
  const [actions, setActions] = useState<any[]>([]);
  const [loadingActions, setLoadingActions] = useState(false);

  React.useEffect(() => {
    const loadActions = async () => {
      setLoadingActions(true);
      try {
        const nodeActions = await getActionsForNode(campo.menuNodeId);
        setActions(nodeActions);
      } catch (error) {
        console.error('Error loading actions:', error);
      } finally {
        setLoadingActions(false);
      }
    };

    loadActions();
  }, [campo.menuNodeId]);

  const handleActionToggle = (actionId: number, checked: boolean) => {
    const currentActions = form.getValues(`permisos.${index}.acciones`) || [];
    let newActions;
    
    if (checked) {
      newActions = [...currentActions, actionId];
    } else {
      newActions = currentActions.filter((id: number) => id !== actionId);
    }
    
    form.setValue(`permisos.${index}.acciones`, newActions);
  };

  return (
    <div className="grid grid-cols-3 gap-4 py-2 border-b">
      <div className="font-mono text-sm">{String(campo.menuNodeId).padStart(2, '0')}</div>
      <div className="font-medium">{campo.menuNodeName}</div>
      <div className="space-y-1">
        {loadingActions ? (
          <div className="text-sm text-gray-500">Cargando acciones...</div>
        ) : (
          <ActionMultiSelect
            actions={actions}
            selectedActions={form.watch(`permisos.${index}.acciones`) || []}
            onSelectionChange={(selectedActionIds) => 
              form.setValue(`permisos.${index}.acciones`, selectedActionIds)
            }
            isLoading={loadingActions}
          />
        )}
        <Button
          type="button"
          size="sm"
          onClick={onRemove}
          className="h-6 w-6 p-0 bg-red-500 hover:bg-red-600 text-white border-0 rounded mt-2"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};

export default PerfilesPage;
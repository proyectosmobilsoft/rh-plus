
import React, { useState } from "react";
import { Menu, Plus, Edit, Trash2, Eye, EyeOff, ChevronRight, ChevronDown, Folder, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Schema for the permission form
const permissionSchema = z.object({
  nodos: z.string().min(1, "Los nodos son requeridos"),
  nombreVista: z.string().min(1, "El nombre de la vista es requerido"),
  ruta: z.string().min(1, "La ruta es requerida"),
  acciones: z.array(z.object({
    codigo: z.string().min(1, "El código es requerido"),
    nombre: z.string().min(1, "El nombre es requerido"),
    tipo: z.string().min(1, "El tipo es requerido")
  })).default([])
});

type PermissionForm = z.infer<typeof permissionSchema>;

// Mock menu data structure
const mockMenuData = [
  {
    id: 1,
    name: "Gestión Almacenes",
    icon: "folder",
    expanded: true,
    children: [
      { id: 2, name: "Empresa", icon: "file", parent: 1 },
      { id: 3, name: "Sucursales", icon: "file", parent: 1 },
      { id: 4, name: "Bodegas", icon: "file", parent: 1 },
      { id: 5, name: "Terceros/Empresas", icon: "file", parent: 1 }
    ]
  },
  {
    id: 6,
    name: "Catalogos Generales",
    icon: "folder",
    expanded: false,
    children: []
  },
  {
    id: 7,
    name: "Gestion Asistencial",
    icon: "folder",
    expanded: false,
    children: []
  },
  {
    id: 8,
    name: "Gestión Clínica",
    icon: "folder",
    expanded: false,
    children: []
  },
  {
    id: 9,
    name: "Gestión Optometría",
    icon: "folder",
    expanded: false,
    children: []
  },
  {
    id: 10,
    name: "Gestión Comercial",
    icon: "folder",
    expanded: false,
    children: []
  },
  {
    id: 11,
    name: "Seguridad",
    icon: "folder",
    expanded: true,
    selected: true,
    children: []
  }
];

const MenuPage = () => {
  const [menuData, setMenuData] = useState(mockMenuData);
  const [selectedNode, setSelectedNode] = useState<number | null>(11);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const form = useForm<PermissionForm>({
    resolver: zodResolver(permissionSchema),
    defaultValues: {
      nodos: "",
      nombreVista: "",
      ruta: "",
      acciones: []
    }
  });

  const toggleNode = (nodeId: number) => {
    setMenuData(prev => prev.map(node => 
      node.id === nodeId 
        ? { ...node, expanded: !node.expanded }
        : node
    ));
  };

  const selectNode = (nodeId: number) => {
    setSelectedNode(nodeId);
  };

  const addAction = () => {
    const currentActions = form.getValues("acciones");
    form.setValue("acciones", [...currentActions, { codigo: "", nombre: "", tipo: "" }]);
  };

  const removeAction = (index: number) => {
    const currentActions = form.getValues("acciones");
    form.setValue("acciones", currentActions.filter((_, i) => i !== index));
  };

  const onSubmit = (data: PermissionForm) => {
    console.log("Permission data:", data);
    setIsCreateModalOpen(false);
    form.reset();
  };

  const renderTreeNode = (node: any, level = 0) => {
    const isSelected = selectedNode === node.id;
    const hasChildren = node.children && node.children.length > 0;
    
    return (
      <div key={node.id} className={`select-none ${level > 0 ? 'ml-4' : ''}`}>
        <div 
          className={`flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-100 ${
            isSelected ? 'bg-blue-100 border-l-4 border-blue-500' : ''
          }`}
          onClick={() => selectNode(node.id)}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.id);
              }}
              className="p-1"
            >
              {node.expanded ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-6" />}
          
          {node.icon === "folder" ? (
            <Folder size={16} className="text-yellow-600" />
          ) : (
            <FileText size={16} className="text-blue-600" />
          )}
          
          <span className="text-sm font-medium">{node.name}</span>
        </div>
        
        {hasChildren && node.expanded && (
          <div className="ml-2">
            {node.children.map((child: any) => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-2">
            <Menu className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Config. Menú</h1>
          </div>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>🔒 Seguridad</span>
            <span>•</span>
            <span>Config. Menú</span>
          </div>
        </div>
      </div>

      <div className="bg-teal-100 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold text-teal-800 mb-2">Listado de Menús</h2>
        <p className="text-sm text-teal-700">
          ❈ Arrastra y suelta los elementos hasta organizar el menú de la manera deseado...
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2 mb-6">
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-green-600 hover:bg-green-700">
              <Plus size={16} className="mr-1" />
              Nodo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Gestión de Permisos</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="nodos"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nodos</FormLabel>
                        <FormControl>
                          <Input placeholder="Nodos" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="nombreVista"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre Vista *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ruta"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ruta *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ruta" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-center w-full">LISTADO DE ACCIONES RELACIONADAS</h3>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2 text-sm font-medium text-center">
                    <div>Código</div>
                    <div>Nombre</div>
                    <div>Tipo</div>
                    <div></div>
                  </div>

                  {form.watch("acciones").map((_, index) => (
                    <div key={index} className="grid grid-cols-4 gap-2 items-end">
                      <FormField
                        control={form.control}
                        name={`acciones.${index}.codigo`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`acciones.${index}.nombre`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`acciones.${index}.tipo`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="crear">Crear</SelectItem>
                                  <SelectItem value="editar">Editar</SelectItem>
                                  <SelectItem value="eliminar">Eliminar</SelectItem>
                                  <SelectItem value="visualizar">Visualizar</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => removeAction(index)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}

                  <Button
                    type="button"
                    size="sm"
                    onClick={addAction}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus size={16} className="mr-1" />
                  </Button>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setIsCreateModalOpen(false)}
                  >
                    ❌ Cancelar
                  </Button>
                  <Button type="submit" className="bg-green-600 hover:bg-green-700">
                    💾 Guardar
                  </Button>
                  <Button 
                    type="button" 
                    variant="secondary"
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    ⚠️ Inactivar
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Button size="sm" variant="destructive">
          <Trash2 size={16} className="mr-1" />
          Nodo
        </Button>

        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
          <Eye size={16} className="mr-1" />
          Visualizar
        </Button>

        <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
          <EyeOff size={16} className="mr-1" />
          Vista/Nom
        </Button>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-12 gap-6">
        {/* Tree View - Left Side */}
        <div className="col-span-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Estructura del Menú</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto border rounded-md">
                {menuData.map(node => renderTreeNode(node))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Details Panel - Right Side */}
        <div className="col-span-8">
          <Card>
            <CardHeader>
              <CardTitle>Detalles del Nodo Seleccionado</CardTitle>
              <CardDescription>
                {selectedNode ? `Configuración para el nodo ID: ${selectedNode}` : 'Selecciona un nodo del árbol para ver sus detalles'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedNode ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Nombre del Nodo</Label>
                      <Input value={menuData.find(n => n.id === selectedNode)?.name || ''} readOnly />
                    </div>
                    <div>
                      <Label>Tipo</Label>
                      <Input value="Carpeta" readOnly />
                    </div>
                  </div>
                  <div>
                    <Label>Ruta</Label>
                    <Input value="/seguridad" readOnly />
                  </div>
                  <div>
                    <Label>Permisos Asociados</Label>
                    <div className="mt-2 p-3 bg-gray-50 rounded">
                      <p className="text-sm text-gray-600">
                        No hay permisos específicos configurados para este nodo.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  Selecciona un elemento del árbol de menús para ver sus detalles
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MenuPage;

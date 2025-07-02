import React, { useState } from "react";
import { Plus, Trash2, ChevronRight, ChevronDown, Folder, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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

// Schema for adding new nodes
const addNodeSchema = z.object({
  nombre: z.string().min(1, "El nombre del nodo es requerido"),
  tipo: z.enum(["folder", "file"]).default("folder"),
  parent: z.number().optional()
});

type PermissionForm = z.infer<typeof permissionSchema>;
type AddNodeForm = z.infer<typeof addNodeSchema>;

// Define interfaces for type safety
interface MenuChild {
  id: number;
  name: string;
  icon: string;
  parent: number;
}

interface MenuNode {
  id: number;
  name: string;
  icon: string;
  expanded: boolean;
  selected?: boolean;
  children: MenuChild[];
}

// Mock menu data structure
const mockMenuData: MenuNode[] = [
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
  const [menuData, setMenuData] = useState<MenuNode[]>(mockMenuData);
  const [selectedNode, setSelectedNode] = useState<number | null>(11);
  const [isAddNodeModalOpen, setIsAddNodeModalOpen] = useState(false);

  const form = useForm<PermissionForm>({
    resolver: zodResolver(permissionSchema),
    defaultValues: {
      nodos: "",
      nombreVista: "",
      ruta: "",
      acciones: []
    }
  });

  const addNodeForm = useForm<AddNodeForm>({
    resolver: zodResolver(addNodeSchema),
    defaultValues: {
      nombre: "",
      tipo: "folder",
      parent: undefined
    }
  });

  const toggleExpanded = (nodeId: number) => {
    setMenuData(prev => prev.map(node => 
      node.id === nodeId ? { ...node, expanded: !node.expanded } : node
    ));
  };

  const selectNode = (nodeId: number) => {
    setSelectedNode(nodeId);
    // Load the selected node data into the form
    const selectedNodeData = menuData.find(n => n.id === nodeId) || 
                           menuData.flatMap(n => n.children || []).find(c => c.id === nodeId);
    
    if (selectedNodeData) {
      form.reset({
        nodos: selectedNodeData.name,
        nombreVista: selectedNodeData.name,
        ruta: `/${selectedNodeData.name.toLowerCase().replace(/\s+/g, '-')}`,
        acciones: []
      });
    }
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
    // Save the permission data
  };

  const onAddNode = (data: AddNodeForm) => {
    const newId = Math.max(...menuData.map(n => n.id), ...menuData.flatMap(n => n.children?.map(c => c.id) || [])) + 1;
    
    if (data.parent && selectedNode) {
      // Add as child to selected parent
      setMenuData(prev => prev.map(node => {
        if (node.id === selectedNode) {
          const newChild = {
            id: newId,
            name: data.nombre,
            icon: data.tipo,
            parent: selectedNode
          };
          return {
            ...node,
            children: [...(node.children || []), newChild]
          };
        }
        return node;
      }));
    } else {
      // Add as root level node
      const newNode = {
        id: newId,
        name: data.nombre,
        icon: data.tipo,
        expanded: false,
        children: []
      };
      setMenuData(prev => [...prev, newNode]);
    }
    
    setIsAddNodeModalOpen(false);
    addNodeForm.reset();
    setSelectedNode(newId);
  };

  const deleteSelectedNode = () => {
    if (!selectedNode) return;
    
    // Check if it's a root node
    const isRootNode = menuData.some(node => node.id === selectedNode);
    
    if (isRootNode) {
      setMenuData(prev => prev.filter(node => node.id !== selectedNode));
    } else {
      // It's a child node
      setMenuData(prev => prev.map(node => ({
        ...node,
        children: node.children?.filter(child => child.id !== selectedNode) || []
      })));
    }
    
    setSelectedNode(null);
  };

  const renderTreeNode = (node: MenuNode) => (
    <div key={node.id} className="border-b border-gray-100 last:border-0">
      <div 
        className={`flex items-center py-2 px-3 hover:bg-gray-50 cursor-pointer ${
          selectedNode === node.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
        }`}
        onClick={() => selectNode(node.id)}
      >
        <div className="flex items-center flex-1 min-w-0">
          <Button 
            variant="ghost" 
            size="sm"
            className="p-0 h-auto mr-1"
            onClick={(e) => {
              e.stopPropagation();
              toggleExpanded(node.id);
            }}
          >
            {node.expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </Button>
          {node.icon === "folder" ? <Folder size={16} className="mr-2" /> : <FileText size={16} className="mr-2" />}
          <span className="text-sm truncate">{node.name}</span>
        </div>
      </div>
      
      {node.expanded && node.children && (
        <div className="ml-4">
          {node.children.map(child => (
            <div 
              key={child.id}
              className={`flex items-center py-2 px-3 hover:bg-gray-50 cursor-pointer ${
                selectedNode === child.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
              }`}
              onClick={() => selectNode(child.id)}
            >
              <FileText size={16} className="mr-2" />
              <span className="text-sm">{child.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mr-4">Gestión de Menús</h1>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-blue-800 text-sm">
          ❈ Arrastra y suelta los elementos hasta organizar el menú de la manera deseado...
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2 mb-6">
        <Dialog open={isAddNodeModalOpen} onOpenChange={setIsAddNodeModalOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-green-600 hover:bg-green-700">
              <Plus size={16} className="mr-1" />
              Nodo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar Nodo</DialogTitle>
            </DialogHeader>
            <Form {...addNodeForm}>
              <form onSubmit={addNodeForm.handleSubmit(onAddNode)} className="space-y-4">
                <FormField
                  control={addNodeForm.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Nodo</FormLabel>
                      <FormControl>
                        <Input placeholder="Ingrese el nombre del nodo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addNodeForm.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Nodo</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="folder">📁 Módulo</SelectItem>
                            <SelectItem value="file">📄 Formulario</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {selectedNode && (
                  <FormField
                    control={addNodeForm.control}
                    name="parent"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value === selectedNode}
                            onChange={(e) => field.onChange(e.target.checked ? selectedNode : undefined)}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Agregar como hijo del nodo seleccionado
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                )}
                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setIsAddNodeModalOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-green-600 hover:bg-green-700">
                    Agregar
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Button 
          size="sm" 
          variant="destructive"
          onClick={deleteSelectedNode}
          disabled={!selectedNode}
        >
          <Trash2 size={16} className="mr-1" />
          Eliminar
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
              <CardTitle>Gestión de Permisos</CardTitle>
              <CardDescription>
                {selectedNode ? `Configuración para el nodo seleccionado` : 'Selecciona un nodo del árbol para configurar sus permisos'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedNode ? (
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
              ) : (
                <p className="text-center text-gray-500 py-8">
                  Selecciona un elemento del árbol de menús para configurar sus permisos
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
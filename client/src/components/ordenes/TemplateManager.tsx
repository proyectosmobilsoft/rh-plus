import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { templatesService } from "@/services/templatesService";
import { empresasService } from "@/services/empresasService";
import { EmpresaOrderTemplate, InsertEmpresaOrderTemplate, Empresa, FieldConfiguration } from "@shared/schema";
import { Settings, Plus, Edit, Trash2, Check, Star } from "lucide-react";

interface TemplateManagerProps {
  empresaId?: number;
}

// All available fields that can be configured in an order template
const AVAILABLE_FIELDS: Array<{ key: keyof FieldConfiguration; label: string; description: string }> = [
  { key: "nombreTrabajador", label: "Nombre del Trabajador", description: "Nombre completo del trabajador" },
  { key: "cedulaTrabajador", label: "Cédula del Trabajador", description: "Número de identificación" },
  { key: "empresaSeleccionada", label: "Empresa", description: "Empresa contratante" },
  { key: "cargoTrabajador", label: "Cargo", description: "Posición del trabajador" },
  { key: "fechaIngreso", label: "Fecha de Ingreso", description: "Fecha prevista de ingreso" },
  { key: "jornadaLaboral", label: "Jornada Laboral", description: "Horarios de trabajo" },
  { key: "salario", label: "Salario", description: "Salario del trabajador" },
  { key: "celular", label: "Celular", description: "Número de contacto" },
  { key: "correo", label: "Correo Electrónico", description: "Email de contacto" },
  { key: "direccion", label: "Dirección", description: "Dirección de residencia" },
  { key: "tipoExamen", label: "Tipo de Examen", description: "Tipo de examen médico" },
  { key: "observaciones", label: "Observaciones", description: "Notas adicionales" }
];

export function TemplateManager({ empresaId }: TemplateManagerProps) {
  const [selectedEmpresaId, setSelectedEmpresaId] = useState<number | undefined>(empresaId);
  const [editingTemplate, setEditingTemplate] = useState<EmpresaOrderTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [fieldConfig, setFieldConfig] = useState<FieldConfiguration>({});

  const queryClient = useQueryClient();

  // Get list of empresas for selection
  const { data: empresas = [] } = useQuery({
    queryKey: ["/api/empresas"],
    enabled: !empresaId // Only load if empresaId is not provided
  });

  // Get templates for selected empresa
  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ["/api/empresas", selectedEmpresaId, "templates"],
    queryFn: () => selectedEmpresaId ? templatesService.getEmpresaTemplates(selectedEmpresaId) : Promise.resolve([]),
    enabled: !!selectedEmpresaId
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: (template: InsertEmpresaOrderTemplate) => templatesService.createTemplate(template),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/empresas", selectedEmpresaId, "templates"] });
      resetForm();
      toast({ title: "Plantilla creada exitosamente" });
    },
    onError: (error) => {
      toast({ title: "Error al crear plantilla", description: error.message, variant: "destructive" });
    }
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, template }: { id: number; template: Partial<InsertEmpresaOrderTemplate> }) =>
      templatesService.updateTemplate(id, template),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/empresas", selectedEmpresaId, "templates"] });
      resetForm();
      toast({ title: "Plantilla actualizada exitosamente" });
    },
    onError: (error) => {
      toast({ title: "Error al actualizar plantilla", description: error.message, variant: "destructive" });
    }
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: templatesService.deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/empresas", selectedEmpresaId, "templates"] });
      toast({ title: "Plantilla eliminada exitosamente" });
    },
    onError: (error) => {
      toast({ title: "Error al eliminar plantilla", description: error.message, variant: "destructive" });
    }
  });

  // Set default template mutation
  const setDefaultMutation = useMutation({
    mutationFn: ({ empresaId, templateId }: { empresaId: number; templateId: number }) =>
      templatesService.setDefaultTemplate(empresaId, templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/empresas", selectedEmpresaId, "templates"] });
      toast({ title: "Plantilla establecida como predeterminada" });
    },
    onError: (error) => {
      toast({ title: "Error al establecer plantilla predeterminada", description: error.message, variant: "destructive" });
    }
  });

  const resetForm = () => {
    setIsCreating(false);
    setEditingTemplate(null);
    setTemplateName("");
    setTemplateDescription("");
    setFieldConfig({});
  };

  const startEditing = (template: EmpresaOrderTemplate) => {
    setEditingTemplate(template);
    setTemplateName(template.nombre);
    setTemplateDescription(template.descripcion || "");
    setFieldConfig(template.configuracionCampos);
    setIsCreating(false);
  };

  const startCreating = () => {
    resetForm();
    setIsCreating(true);
    // Set all fields as visible by default
    const defaultConfig: FieldConfiguration = {};
    AVAILABLE_FIELDS.forEach(field => {
      defaultConfig[field.key] = { visible: true, required: false };
    });
    setFieldConfig(defaultConfig);
  };

  const handleFieldConfigChange = (fieldKey: keyof FieldConfiguration, property: 'visible' | 'required', value: boolean) => {
    setFieldConfig(prev => ({
      ...prev,
      [fieldKey]: {
        ...prev[fieldKey],
        [property]: value
      }
    }));
  };

  const handleSaveTemplate = () => {
    if (!selectedEmpresaId || !templateName.trim()) {
      toast({ title: "Error", description: "Empresa y nombre de plantilla son requeridos", variant: "destructive" });
      return;
    }

    const templateData: InsertEmpresaOrderTemplate = {
      empresaId: selectedEmpresaId,
      nombre: templateName,
      descripcion: templateDescription || null,
      configuracionCampos: fieldConfig,
      esDefault: false,
      activo: true
    };

    if (editingTemplate) {
      updateTemplateMutation.mutate({ id: editingTemplate.id, template: templateData });
    } else {
      createTemplateMutation.mutate(templateData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestión de Plantillas de Órdenes</h2>
          <p className="text-muted-foreground">
            Configure qué campos aparecen en los formularios de órdenes para cada empresa
          </p>
        </div>
        <Button onClick={startCreating} disabled={!selectedEmpresaId}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Plantilla
        </Button>
      </div>

      {!empresaId && (
        <Card>
          <CardHeader>
            <CardTitle>Seleccionar Empresa</CardTitle>
            <CardDescription>Elija la empresa para gestionar sus plantillas de órdenes</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedEmpresaId?.toString()} onValueChange={(value) => setSelectedEmpresaId(parseInt(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione una empresa..." />
              </SelectTrigger>
              <SelectContent>
                {empresas.map((empresa: Empresa) => (
                  <SelectItem key={empresa.id} value={empresa.id.toString()}>
                    {empresa.razon_social}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {selectedEmpresaId && (
        <Tabs defaultValue="list" className="space-y-4">
          <TabsList>
            <TabsTrigger value="list">Plantillas Existentes</TabsTrigger>
            {(isCreating || editingTemplate) && (
              <TabsTrigger value="edit">
                {editingTemplate ? "Editar Plantilla" : "Nueva Plantilla"}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            {templatesLoading ? (
              <div className="text-center py-8">Cargando plantillas...</div>
            ) : templates.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay plantillas configuradas</h3>
                  <p className="text-muted-foreground mb-4">
                    Cree la primera plantilla para personalizar los formularios de órdenes
                  </p>
                  <Button onClick={startCreating}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Primera Plantilla
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {templates.map((template) => (
                  <Card key={template.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <CardTitle className="text-lg">{template.nombre}</CardTitle>
                          {template.esDefault && (
                            <Badge variant="secondary" className="flex items-center space-x-1">
                              <Star className="h-3 w-3" />
                              <span>Predeterminada</span>
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {!template.esDefault && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDefaultMutation.mutate({ empresaId: selectedEmpresaId, templateId: template.id })}
                            >
                              <Star className="h-4 w-4 mr-2" />
                              Establecer como Predeterminada
                            </Button>
                          )}
                          <Button variant="outline" size="sm" onClick={() => startEditing(template)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </Button>
                          {!template.esDefault && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteTemplateMutation.mutate(template.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </Button>
                          )}
                        </div>
                      </div>
                      {template.descripcion && (
                        <CardDescription>{template.descripcion}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground">
                        <strong>Campos configurados:</strong>{" "}
                        {Object.entries(template.configuracionCampos).filter(([_, config]) => config.visible).length} de {AVAILABLE_FIELDS.length}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {(isCreating || editingTemplate) && (
            <TabsContent value="edit" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{editingTemplate ? "Editar Plantilla" : "Nueva Plantilla"}</CardTitle>
                  <CardDescription>
                    Configure la información básica y los campos visibles para esta plantilla
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="templateName">Nombre de la Plantilla</Label>
                      <Input
                        id="templateName"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        placeholder="Ej: Plantilla Estándar, Evaluación Básica..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="templateDescription">Descripción (Opcional)</Label>
                      <Textarea
                        id="templateDescription"
                        value={templateDescription}
                        onChange={(e) => setTemplateDescription(e.target.value)}
                        placeholder="Descripción de cuándo usar esta plantilla..."
                        rows={3}
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Configuración de Campos</h3>
                    <div className="grid gap-4">
                      {AVAILABLE_FIELDS.map((field) => {
                        const config = fieldConfig[field.key] || { visible: false, required: false };
                        return (
                          <Card key={field.key} className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3">
                                  <Checkbox
                                    checked={config.visible}
                                    onCheckedChange={(checked) =>
                                      handleFieldConfigChange(field.key, 'visible', !!checked)
                                    }
                                  />
                                  <div>
                                    <Label className="text-sm font-medium">{field.label}</Label>
                                    <p className="text-xs text-muted-foreground">{field.description}</p>
                                  </div>
                                </div>
                              </div>
                              {config.visible && (
                                <div className="flex items-center space-x-2">
                                  <Label htmlFor={`required-${field.key}`} className="text-xs">
                                    Obligatorio
                                  </Label>
                                  <Switch
                                    id={`required-${field.key}`}
                                    checked={config.required}
                                    onCheckedChange={(checked) =>
                                      handleFieldConfigChange(field.key, 'required', checked)
                                    }
                                  />
                                </div>
                              )}
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={resetForm}>
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSaveTemplate}
                      disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      {editingTemplate ? "Actualizar" : "Crear"} Plantilla
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      )}
    </div>
  );
}
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Plus, Edit, Trash2, Star } from "lucide-react";
import { TemplateForm } from "@/components/ordenes/TemplateForm";

const PlantillasPage: React.FC = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);

  // Mock data - Plantillas globales
  const templates = [
    { id: 1, nombre: "Plantilla Estándar", descripcion: "Plantilla básica para evaluaciones", esDefault: true },
    { id: 2, nombre: "Plantilla Completa", descripcion: "Plantilla con todos los campos", esDefault: false },
    { id: 3, nombre: "Plantilla de Ingreso", descripcion: "Plantilla específica para nuevos empleados", esDefault: false },
    { id: 4, nombre: "Plantilla de Seguridad", descripcion: "Plantilla para evaluaciones de seguridad", esDefault: false },
  ];

  const startCreating = () => {
    setIsCreating(true);
    setEditingTemplate(null);
  };

  const startEditing = (template: any) => {
    setEditingTemplate(template);
    setIsCreating(true);
  };

  const resetForm = () => {
    setIsCreating(false);
    setEditingTemplate(null);
  };

  const handleSaved = () => {
    resetForm();
    // Aquí podrías recargar las plantillas
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Plantillas</h1>
        <p className="text-muted-foreground">
          Configure las plantillas de órdenes para personalizar los formularios según las necesidades
        </p>
      </div>

      {!isCreating ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Plantillas de Órdenes</h2>
              <p className="text-muted-foreground">
                Gestione las plantillas disponibles para crear órdenes personalizadas
              </p>
            </div>
            <Button onClick={startCreating}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Plantilla
            </Button>
          </div>

          {templates.length === 0 ? (
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
                          <Button variant="outline" size="sm">
                            <Star className="h-4 w-4 mr-2" />
                            Establecer como Predeterminada
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => startEditing(template)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                    <CardDescription>{template.descripcion}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                {editingTemplate ? "Editar Plantilla" : "Nueva Plantilla"}
              </h2>
              <p className="text-muted-foreground">
                Configure la información y campos de la plantilla
              </p>
            </div>
            <Button variant="outline" onClick={resetForm}>
              Cancelar
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              <TemplateForm 
                initialData={editingTemplate}
                onSaved={handleSaved}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PlantillasPage; 
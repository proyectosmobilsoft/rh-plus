import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Plus, Edit, Trash2, Star } from "lucide-react";
import { TemplateForm } from "@/components/ordenes/TemplateForm";
import { plantillasService, Plantilla } from "@/services/plantillasService";

const PlantillasPage: React.FC = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Plantilla | null>(null);
  const [templates, setTemplates] = useState<Plantilla[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Cargar plantillas desde Supabase
  React.useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await plantillasService.getAll();
        setTemplates(data);
      } catch (err: any) {
        setError("Error al cargar las plantillas");
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  const startCreating = () => {
    setIsCreating(true);
    setEditingTemplate(null);
  };

  const startEditing = (template: Plantilla) => {
    setEditingTemplate(template);
    setIsCreating(true);
  };

  const resetForm = () => {
    setIsCreating(false);
    setEditingTemplate(null);
  };

  const handleSaved = () => {
    resetForm();
    // Recargar las plantillas desde Supabase
    setLoading(true);
    plantillasService.getAll()
      .then(setTemplates)
      .catch(() => setError("Error al recargar las plantillas"))
      .finally(() => setLoading(false));
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta plantilla?')) return;
    setDeletingId(id);
    setError(null);
    try {
      await plantillasService.delete(id);
      alert('Plantilla eliminada exitosamente');
      // Recargar la lista
      setLoading(true);
      const data = await plantillasService.getAll();
      setTemplates(data);
    } catch (err) {
      setError('Error al eliminar la plantilla');
      alert('Error al eliminar la plantilla');
    } finally {
      setDeletingId(null);
      setLoading(false);
    }
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

          {loading ? (
            <Card>
              <CardContent className="py-8 text-center">
                <span>Cargando plantillas...</span>
              </CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardContent className="py-8 text-center text-red-500">
                <span>{error}</span>
              </CardContent>
            </Card>
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
                        {template.es_default && (
                          <Badge variant="secondary" className="flex items-center space-x-1">
                            <Star className="h-3 w-3" />
                            <span>Predeterminada</span>
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {!template.es_default && (
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
                        <Button variant="outline" size="sm" 
                          onClick={() => handleDelete(template.id)}
                          disabled={deletingId === template.id || loading}
                        >
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
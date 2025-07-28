import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { plantillasMensajesService, PlantillaMensaje } from '@/services/plantillasMensajesService';
import { 
  Plus, 
  Edit, 
  Trash2, 
  MessageSquare, 
  Mail, 
  Save,
  X,
  FileText
} from 'lucide-react';

export default function QrPlantillasPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlantilla, setEditingPlantilla] = useState<PlantillaMensaje | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'whatsapp' as 'whatsapp' | 'email',
    asunto: '',
    mensaje: '',
    variables_disponibles: [] as string[]
  });

  // Queries
  const { data: plantillasWhatsApp = [], isLoading: loadingWhatsApp } = useQuery({
    queryKey: ['plantillas-whatsapp'],
    queryFn: () => plantillasMensajesService.getByTipo('whatsapp'),
  });

  const { data: plantillasEmail = [], isLoading: loadingEmail } = useQuery({
    queryKey: ['plantillas-email'],
    queryFn: () => plantillasMensajesService.getByTipo('email'),
  });

  // Mutations
  const createPlantillaMutation = useMutation({
    mutationFn: plantillasMensajesService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plantillas-whatsapp'] });
      queryClient.invalidateQueries({ queryKey: ['plantillas-email'] });
      setDialogOpen(false);
      resetForm();
      toast({ title: 'Éxito', description: 'Plantilla creada correctamente' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updatePlantillaMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<PlantillaMensaje> }) =>
      plantillasMensajesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plantillas-whatsapp'] });
      queryClient.invalidateQueries({ queryKey: ['plantillas-email'] });
      setDialogOpen(false);
      resetForm();
      toast({ title: 'Éxito', description: 'Plantilla actualizada correctamente' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deletePlantillaMutation = useMutation({
    mutationFn: plantillasMensajesService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plantillas-whatsapp'] });
      queryClient.invalidateQueries({ queryKey: ['plantillas-email'] });
      toast({ title: 'Éxito', description: 'Plantilla eliminada correctamente' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData({
      nombre: '',
      tipo: 'whatsapp',
      asunto: '',
      mensaje: '',
      variables_disponibles: []
    });
    setEditingPlantilla(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre || !formData.mensaje) {
      toast({ title: 'Error', description: 'Por favor completa todos los campos requeridos', variant: 'destructive' });
      return;
    }

    if (formData.tipo === 'email' && !formData.asunto) {
      toast({ title: 'Error', description: 'El asunto es requerido para plantillas de email', variant: 'destructive' });
      return;
    }

    const plantillaData = {
      ...formData,
      variables_disponibles: formData.tipo === 'whatsapp' 
        ? ['nombre', 'empresa'] 
        : ['nombre', 'cedula', 'email', 'empresa', 'fecha']
    };

    if (editingPlantilla) {
      updatePlantillaMutation.mutate({ id: editingPlantilla.id, data: plantillaData });
    } else {
      createPlantillaMutation.mutate(plantillaData);
    }
  };

  const handleEdit = (plantilla: PlantillaMensaje) => {
    setEditingPlantilla(plantilla);
    setFormData({
      nombre: plantilla.nombre,
      tipo: plantilla.tipo,
      asunto: plantilla.asunto || '',
      mensaje: plantilla.mensaje,
      variables_disponibles: plantilla.variables_disponibles
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta plantilla?')) {
      deletePlantillaMutation.mutate(id);
    }
  };

  const getVariablesDisponibles = (tipo: 'whatsapp' | 'email') => {
    if (tipo === 'whatsapp') {
      return ['nombre', 'empresa'];
    } else {
      return ['nombre', 'cedula', 'email', 'empresa', 'fecha'];
    }
  };

  return (
    <div className="page-container p-6">
      <div className="page-header mb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <FileText className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Plantillas de Mensajes</h1>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Plantilla
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[800px] max-w-[90%]">
              <DialogHeader>
                <DialogTitle>
                  {editingPlantilla ? "Editar Plantilla" : "Crear Nueva Plantilla"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre de la Plantilla *</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                      placeholder="Ej: Notificación QR - Formal"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tipo">Tipo de Plantilla *</Label>
                    <Select 
                      value={formData.tipo} 
                      onValueChange={(value: 'whatsapp' | 'email') => {
                        setFormData(prev => ({ 
                          ...prev, 
                          tipo: value,
                          variables_disponibles: getVariablesDisponibles(value)
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.tipo === 'email' && (
                  <div className="space-y-2">
                    <Label htmlFor="asunto">Asunto del Email *</Label>
                    <Input
                      id="asunto"
                      value={formData.asunto}
                      onChange={(e) => setFormData(prev => ({ ...prev, asunto: e.target.value }))}
                      placeholder="Ej: Tu código QR de certificación - {{empresa}}"
                      required={formData.tipo === 'email'}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="mensaje">Mensaje *</Label>
                  <Textarea
                    id="mensaje"
                    value={formData.mensaje}
                    onChange={(e) => setFormData(prev => ({ ...prev, mensaje: e.target.value }))}
                    rows={12}
                    placeholder="Escribe el contenido del mensaje aquí..."
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Variables disponibles: {formData.variables_disponibles.map(v => `{{${v}}}`).join(', ')}
                  </p>
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button type="submit">
                    <Save className="h-4 w-4 mr-2" />
                    {editingPlantilla ? "Actualizar" : "Crear"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="whatsapp" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="whatsapp" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Plantillas WhatsApp ({plantillasWhatsApp.length})
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Plantillas Email ({plantillasEmail.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="whatsapp" className="space-y-4">
          {loadingWhatsApp ? (
            <div className="text-center py-8">Cargando plantillas...</div>
          ) : plantillasWhatsApp.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">No hay plantillas de WhatsApp creadas</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plantillasWhatsApp.map((plantilla) => (
                <Card key={plantilla.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{plantilla.nombre}</CardTitle>
                        <CardDescription>
                          <Badge variant="secondary" className="mt-2">
                            WhatsApp
                          </Badge>
                        </CardDescription>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(plantilla)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(plantilla.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {plantilla.mensaje.substring(0, 150)}...
                      </p>
                      <div className="text-xs text-gray-500">
                        Variables: {plantilla.variables_disponibles.join(', ')}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          {loadingEmail ? (
            <div className="text-center py-8">Cargando plantillas...</div>
          ) : plantillasEmail.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Mail className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">No hay plantillas de Email creadas</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plantillasEmail.map((plantilla) => (
                <Card key={plantilla.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{plantilla.nombre}</CardTitle>
                        <CardDescription>
                          <Badge variant="secondary" className="mt-2">
                            Email
                          </Badge>
                        </CardDescription>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(plantilla)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(plantilla.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {plantilla.asunto && (
                        <div>
                          <p className="text-xs font-medium text-gray-700">Asunto:</p>
                          <p className="text-sm text-gray-600">{plantilla.asunto}</p>
                        </div>
                      )}
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {plantilla.mensaje.substring(0, 150)}...
                      </p>
                      <div className="text-xs text-gray-500">
                        Variables: {plantilla.variables_disponibles.join(', ')}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 
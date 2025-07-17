import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useApiData } from '@/hooks/useApiData';
import { Briefcase, Search, Plus, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Prestador {
  id: number;
  identificacion: string;
  nombre: string;
  apellido: string;
  especialidad: string;
  telefono: string;
  correo: string;
}

const PrestadoresPage = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('lista');
  const [formData, setFormData] = useState<Partial<Prestador>>({
    identificacion: '',
    nombre: '',
    apellido: '',
    especialidad: '',
    telefono: '',
    correo: '',
  });
  const [editingId, setEditingId] = useState<number | null>(null);

  // Datos simulados mientras se configura la API
  const mockPrestadores: Prestador[] = [
    { id: 1, identificacion: '12345678', nombre: 'Laura', apellido: 'Martínez', especialidad: 'Medicina General', telefono: '3101234567', correo: 'laura@ejemplo.com' },
    { id: 2, identificacion: '87654321', nombre: 'Pedro', apellido: 'Sánchez', especialidad: 'Fisioterapia', telefono: '3209876543', correo: 'pedro@ejemplo.com' },
    { id: 3, identificacion: '56781234', nombre: 'Ana', apellido: 'López', especialidad: 'Psicología', telefono: '3112345678', correo: 'ana@ejemplo.com' },
  ];

  // Hook para consumir la API
  const {
    data: prestadores,
    isLoading,
    error,
    fetchData,
    createData,
    updateData,
    deleteData,
  } = useApiData<Prestador[]>('/prestadores', mockPrestadores, {
    showSuccessToast: true,
    successMessage: 'Datos de prestadores cargados correctamente',
    errorMessage: 'Error al cargar los datos de prestadores',
  });

  // Simulamos la carga de datos
  useEffect(() => {
    // Descomentar cuando la API esté disponible
    // fetchData();

    // Por ahora simulamos la carga
    console.log('Simulando carga de datos de prestadores...');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validaciones básicas
      if (!formData.identificacion || !formData.nombre || !formData.especialidad) {
        toast({
          title: "Error de validación",
          description: "Por favor complete los campos requeridos",
          variant: "destructive",
        });
        return;
      }

      if (editingId) {
        // Actualizando prestador existente
        // Descomentar cuando la API esté disponible
        // await updateData(editingId, formData);
        
        // Por ahora simulamos la actualización
        console.log('Prestador a actualizar:', formData);
        toast({
          title: "Éxito",
          description: "Prestador actualizado correctamente",
        });
      } else {
        // Creando nuevo prestador
        // Descomentar cuando la API esté disponible
        // await createData(formData);
        
        // Por ahora simulamos la creación
        console.log('Prestador a crear:', formData);
        toast({
          title: "Éxito",
          description: "Prestador registrado correctamente",
        });
      }

      // Regresar a la lista y limpiar formulario
      setActiveTab('lista');
      setFormData({
        identificacion: '',
        nombre: '',
        apellido: '',
        especialidad: '',
        telefono: '',
        correo: '',
      });
      setEditingId(null);
    } catch (error) {
      console.error('Error al procesar prestador:', error);
    }
  };

  const handleEdit = (prestador: Prestador) => {
    setFormData(prestador);
    setEditingId(prestador.id);
    setActiveTab('formulario');
  };

  const handleCreateNew = () => {
    setFormData({
      identificacion: '',
      nombre: '',
      apellido: '',
      especialidad: '',
      telefono: '',
      correo: '',
    });
    setEditingId(null);
    setActiveTab('formulario');
  };

  const handleDelete = async (id: number) => {
    try {
      // Descomentar cuando la API esté disponible
      // await deleteData(id);
      
      // Por ahora simulamos la eliminación
      console.log('Eliminando prestador con ID:', id);
      toast({
        title: "Éxito",
        description: "Prestador eliminado correctamente",
      });
    } catch (error) {
      console.error('Error al eliminar prestador:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const filteredPrestadores = prestadores.filter(prestador => 
    prestador.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prestador.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prestador.identificacion.includes(searchTerm) ||
    prestador.especialidad.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-container p-6">
      <div className="page-header mb-6">
        <div className="flex items-center space-x-2">
          <Briefcase className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Prestadores</h1>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="lista">Lista de Prestadores</TabsTrigger>
          <TabsTrigger value="formulario">
            {editingId ? "Editar Prestador" : "Crear Prestador"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lista" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar prestadores..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Prestador
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Identificación</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Apellido</TableHead>
                  <TableHead>Especialidad</TableHead>
                  <TableHead className="hidden md:table-cell">Teléfono</TableHead>
                  <TableHead className="hidden md:table-cell">Correo</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPrestadores.map((prestador) => (
                  <TableRow key={prestador.id}>
                    <TableCell className="font-medium">{prestador.identificacion}</TableCell>
                    <TableCell>{prestador.nombre}</TableCell>
                    <TableCell>{prestador.apellido}</TableCell>
                    <TableCell>{prestador.especialidad}</TableCell>
                    <TableCell className="hidden md:table-cell">{prestador.telefono}</TableCell>
                    <TableCell className="hidden md:table-cell">{prestador.correo}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(prestador)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(prestador.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredPrestadores.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No se encontraron prestadores
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="formulario" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {editingId ? "Editar Prestador" : "Registrar Nuevo Prestador"}
                </CardTitle>
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab('lista')}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver a la lista
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="identificacion">Identificación *</Label>
                    <Input
                      id="identificacion"
                      name="identificacion"
                      placeholder="Número de identificación"
                      value={formData.identificacion}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="especialidad">Especialidad *</Label>
                    <Input
                      id="especialidad"
                      name="especialidad"
                      placeholder="Especialidad médica"
                      value={formData.especialidad}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre *</Label>
                    <Input
                      id="nombre"
                      name="nombre"
                      placeholder="Nombre del prestador"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apellido">Apellido</Label>
                    <Input
                      id="apellido"
                      name="apellido"
                      placeholder="Apellido del prestador"
                      value={formData.apellido}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input
                      id="telefono"
                      name="telefono"
                      placeholder="Número de teléfono"
                      value={formData.telefono}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="correo">Correo</Label>
                    <Input
                      id="correo"
                      name="correo"
                      type="email"
                      placeholder="Correo electrónico"
                      value={formData.correo}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setActiveTab('lista')}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingId ? 'Actualizar' : 'Registrar'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PrestadoresPage;
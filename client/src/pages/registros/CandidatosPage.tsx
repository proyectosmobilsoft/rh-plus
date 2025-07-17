import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User, Search, Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from "@/lib/queryClient";

interface Candidato {
  id: number;
  identificacion: string;
  tipoDocumento: string;
  nombre: string;
  apellido: string;
  telefono: string;
  correo: string;
  empresa: string;
  ciudad: string;
  direccion: string;
}

const CandidatosPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmpresa, setSelectedEmpresa] = useState('todas');
  const [formData, setFormData] = useState<Partial<Candidato>>({
    identificacion: '',
    tipoDocumento: '',
    nombre: '',
    apellido: '',
    telefono: '',
    correo: '',
    empresa: '',
    ciudad: '',
    direccion: ''
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Query para obtener candidatos - usando la misma configuración que usuarios y perfiles
  const { data: candidatos = [], isLoading, refetch } = useQuery<Candidato[]>({
    queryKey: ["/api/admin/candidatos"],
    queryFn: async () => {
      const response = await fetch('/api/admin/candidatos');
      if (!response.ok) throw new Error('Failed to fetch candidatos');
      return response.json();
    },
    staleTime: 0,
    refetchOnWindowFocus: false
  });

  // Mutation para crear candidato
  const createCandidatoMutation = useMutation({
    mutationFn: async (data: Partial<Candidato>) => {
      const response = await apiRequest("/api/admin/candidatos", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/candidatos"] });
      await refetch();
      setDialogOpen(false);
      resetForm();
      toast({
        title: "Éxito",
        description: "Candidato creado correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filtrar candidatos
  const filteredCandidatos = candidatos.filter((candidato: any) => {
    const matchesSearch = 
      candidato.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidato.apellido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidato.identificacion?.includes(searchTerm) ||
      candidato.correo?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEmpresa = selectedEmpresa === 'todas' || candidato.empresa === selectedEmpresa;
    
    return matchesSearch && matchesEmpresa;
  });

  // Función para limpiar el formulario
  const resetForm = () => {
    setFormData({
      identificacion: '',
      tipoDocumento: '',
      nombre: '',
      apellido: '',
      telefono: '',
      correo: '',
      empresa: '',
      ciudad: '',
      direccion: ''
    });
    setEditingId(null);
  };

  // Función para manejar envío del formulario
  const handleSubmit = () => {
    if (formData.identificacion && formData.nombre && formData.apellido && formData.correo) {
      if (editingId) {
        // Actualizar candidato existente
        toast({
          title: "Información",
          description: "Función de edición pendiente de implementar",
        });
      } else {
        // Crear nuevo candidato
        createCandidatoMutation.mutate(formData);
      }
    } else {
      toast({
        title: "Error",
        description: "Por favor complete los campos obligatorios",
        variant: "destructive",
      });
    }
  };

  // Función para abrir modal de edición
  const handleEdit = (candidato: any) => {
    setFormData({
      identificacion: candidato.identificacion || '',
      tipoDocumento: candidato.tipoDocumento || '',
      nombre: candidato.nombre || '',
      apellido: candidato.apellido || '',
      telefono: candidato.telefono || '',
      correo: candidato.correo || '',
      empresa: candidato.empresa || '',
      ciudad: candidato.ciudad || '',
      direccion: candidato.direccion || ''
    });
    setEditingId(candidato.id);
    setDialogOpen(true);
  };

  // Obtener lista única de empresas para el filtro
  const empresas = Array.from(new Set(candidatos.map((candidato: any) => candidato.empresa).filter(Boolean)));

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <User className="h-8 w-8 text-green-600" />
          <h1 className="text-3xl font-bold text-gray-900">Candidatos</h1>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar candidatos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedEmpresa} onValueChange={setSelectedEmpresa}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las empresas</SelectItem>
                {empresas.map((empresa) => (
                  <SelectItem key={empresa} value={empresa}>
                    {empresa}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()} className="bg-green-600 hover:bg-green-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Candidato
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? 'Editar Candidato' : 'Nuevo Candidato'}
                </DialogTitle>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Identificación *</label>
                  <Input
                    value={formData.identificacion || ''}
                    onChange={(e) => setFormData({ ...formData, identificacion: e.target.value })}
                    placeholder="Número de identificación"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Tipo de Documento *</label>
                  <Select
                    value={formData.tipoDocumento || ''}
                    onValueChange={(value) => setFormData({ ...formData, tipoDocumento: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
                      <SelectItem value="CE">Cédula de Extranjería</SelectItem>
                      <SelectItem value="TI">Tarjeta de Identidad</SelectItem>
                      <SelectItem value="PA">Pasaporte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre *</label>
                  <Input
                    value={formData.nombre || ''}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Nombre"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Apellido *</label>
                  <Input
                    value={formData.apellido || ''}
                    onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                    placeholder="Apellido"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Teléfono</label>
                  <Input
                    value={formData.telefono || ''}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    placeholder="Teléfono"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Correo *</label>
                  <Input
                    type="email"
                    value={formData.correo || ''}
                    onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                    placeholder="Correo electrónico"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Empresa</label>
                  <Input
                    value={formData.empresa || ''}
                    onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                    placeholder="Empresa"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Ciudad</label>
                  <Input
                    value={formData.ciudad || ''}
                    onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                    placeholder="Ciudad"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Dirección</label>
                  <Input
                    value={formData.direccion || ''}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    placeholder="Dirección"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={createCandidatoMutation.isPending}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {createCandidatoMutation.isPending ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            Lista de Candidatos ({filteredCandidatos.length})
          </h2>
          
          {filteredCandidatos.length === 0 ? (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No hay datos disponibles en este momento</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Identificación</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Apellido</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Correo</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCandidatos.map((candidato: any) => (
                    <TableRow key={candidato.id}>
                      <TableCell className="font-medium">
                        {candidato.identificacion}
                      </TableCell>
                      <TableCell>{candidato.nombre}</TableCell>
                      <TableCell>{candidato.apellido}</TableCell>
                      <TableCell>{candidato.telefono}</TableCell>
                      <TableCell>{candidato.correo}</TableCell>
                      <TableCell>{candidato.empresa}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(candidato)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CandidatosPage;
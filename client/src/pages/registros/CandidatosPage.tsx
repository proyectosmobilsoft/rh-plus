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
import { candidatosService } from '@/services/candidatosService';
import { useCompanies } from '@/hooks/useCompanies';
import { useCityData } from '@/hooks/useCityData';
import React from 'react';

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
  const [formData, setFormData] = useState<Partial<Candidato> & { empresa_id?: number, ciudad_id?: number }>({
    identificacion: '',
    tipoDocumento: '',
    nombre: '',
    apellido: '',
    telefono: '',
    correo: '',
    empresa_id: undefined,
    ciudad_id: undefined,
    direccion: ''
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const { data: cityData = {}, isLoading: loadingCities } = useCityData();
  const [selectedDepartamento, setSelectedDepartamento] = useState<string>('');

  // Query para obtener candidatos desde Supabase
  const { data: candidatos = [], isLoading, refetch } = useQuery({
    queryKey: ['candidatos'],
    queryFn: candidatosService.getAll,
    staleTime: 0,
    refetchOnWindowFocus: false
  });

  // Mutation para crear candidato en Supabase
  const createCandidatoMutation = useMutation({
    mutationFn: async (data: any) => {
      return candidatosService.create(data);
    },
    onSuccess: async () => {
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

  // Mutation para eliminar candidato en Supabase
  const deleteCandidatoMutation = useMutation({
    mutationFn: async (id: number) => {
      return candidatosService.delete(id);
    },
    onSuccess: async () => {
      await refetch();
      toast({
        title: "Eliminado",
        description: "Candidato eliminado correctamente",
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

  // Refresca la lista al abrir la página o cambiar de ruta
  React.useEffect(() => {
    refetch();
  }, []);

  const { data: empresasReales = [] } = useCompanies('empresa');

  // Lookup helpers para empresa y ciudad
  const getEmpresaNombre = (empresa_id: number) => {
    const empresa = empresasReales.find((e: any) => e.id === empresa_id);
    return empresa ? empresa.razonSocial : '';
  };

  // Filtrar candidatos usando los campos reales de Supabase
  const filteredCandidatos = candidatos.filter((candidato: any) => {
    const matchesSearch =
      (candidato.primer_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidato.primer_apellido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidato.numero_documento?.includes(searchTerm) ||
      candidato.email?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesEmpresa = selectedEmpresa === 'todas' || getEmpresaNombre(candidato.empresa_id) === selectedEmpresa;
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
      empresa_id: undefined,
      ciudad_id: undefined,
      direccion: ''
    });
    setEditingId(null);
  };

  // Función para manejar envío del formulario
  const handleSubmit = () => {
    if (formData.identificacion && formData.nombre && formData.apellido && formData.correo && formData.empresa_id) {
      const candidatoPayload = {
        tipo_documento: formData.tipoDocumento,
        numero_documento: formData.identificacion,
        primer_nombre: formData.nombre,
        primer_apellido: formData.apellido,
        telefono: formData.telefono,
        email: formData.correo,
        direccion: formData.direccion,
        ciudad_id: formData.ciudad_id,
        empresa_id: formData.empresa_id,
      };
      if (editingId) {
        // Actualizar candidato existente en Supabase
        candidatosService.update(editingId, candidatoPayload)
          .then(() => {
            refetch();
            setDialogOpen(false);
            resetForm();
            toast({
              title: "Éxito",
              description: "Candidato actualizado correctamente",
            });
          })
          .catch((error) => {
            toast({
              title: "Error",
              description: error.message,
              variant: "destructive",
            });
          });
      } else {
        // Crear nuevo candidato
        createCandidatoMutation.mutate(candidatoPayload);
      }
    } else {
      toast({
        title: "Error",
        description: "Por favor complete los campos obligatorios",
        variant: "destructive",
      });
    }
  };

  // Helper para obtener el departamento a partir del id de ciudad
  const getDepartamentoIdByCiudadId = (ciudad_id: number) => {
    for (const [depId, dep] of Object.entries(cityData as Record<string, any>)) {
      if (dep.ciudades.some((c: any) => c.id === ciudad_id)) {
        return depId;
      }
    }
    return '';
  };

  // Función para abrir modal de edición
  const handleEdit = (candidato: any) => {
    setFormData({
      identificacion: candidato.numero_documento || '',
      tipoDocumento: candidato.tipo_documento || '',
      nombre: candidato.primer_nombre || '',
      apellido: candidato.primer_apellido || '',
      telefono: candidato.telefono || '',
      correo: candidato.email || '',
      empresa_id: candidato.empresa_id || undefined,
      ciudad_id: candidato.ciudad_id || undefined,
      direccion: candidato.direccion || ''
    });
    setSelectedDepartamento(getDepartamentoIdByCiudadId(candidato.ciudad_id));
    setEditingId(candidato.id);
    setDialogOpen(true);
  };

  const getCiudadNombre = (ciudad_id: number) => {
    for (const dep of Object.values(cityData as Record<string, any>)) {
      const ciudad = dep.ciudades.find((c: any) => c.id === ciudad_id);
      if (ciudad) return ciudad.nombre;
    }
    return '';
  };

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
                {empresasReales.map((empresa) => (
                  <SelectItem key={empresa.id} value={empresa.razonSocial}>
                    {empresa.razonSocial}
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
                  <Select
                    value={formData.empresa_id ? String(formData.empresa_id) : ''}
                    onValueChange={(value) => setFormData({ ...formData, empresa_id: Number(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      {empresasReales.map((empresa) => (
                        <SelectItem key={empresa.id} value={String(empresa.id)}>
                          {empresa.razonSocial}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Departamento</label>
                  <Select
                    value={selectedDepartamento}
                    onValueChange={(value) => {
                      setSelectedDepartamento(value);
                      setFormData({ ...formData, ciudad_id: undefined });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar departamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(cityData).map(([depId, dep]) => (
                        <SelectItem key={depId} value={depId}>{dep.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Ciudad</label>
                  <Select
                    value={formData.ciudad_id ? String(formData.ciudad_id) : ''}
                    onValueChange={(value) => setFormData({ ...formData, ciudad_id: Number(value) })}
                    disabled={!selectedDepartamento || loadingCities}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar ciudad" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedDepartamento &&
                        Array.isArray((cityData as Record<string, { nombre: string, ciudades: { id: number, nombre: string }[] }>)[String(selectedDepartamento)]?.ciudades) &&
                        (cityData as Record<string, { nombre: string, ciudades: { id: number, nombre: string }[] }>)[String(selectedDepartamento)]?.ciudades.map((ciudad: { id: number, nombre: string }) => (
                          <SelectItem key={ciudad.id} value={String(ciudad.id)}>{ciudad.nombre}</SelectItem>
                        ))}
                      {selectedDepartamento &&
                        (!cityData[selectedDepartamento]?.ciudades || cityData[selectedDepartamento].ciudades.length === 0) && (
                          <SelectItem value="" disabled>
                            No hay ciudades disponibles
                          </SelectItem>
                        )}
                    </SelectContent>
                  </Select>
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
                    <TableHead>Ciudad</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCandidatos.map((candidato: any) => (
                    <TableRow key={candidato.id}>
                      <TableCell className="font-medium">
                        {candidato.numero_documento}
                      </TableCell>
                      <TableCell>{candidato.primer_nombre}</TableCell>
                      <TableCell>{candidato.primer_apellido}</TableCell>
                      <TableCell>{candidato.telefono}</TableCell>
                      <TableCell>{candidato.email}</TableCell>
                      <TableCell>{getEmpresaNombre(candidato.empresa_id)}</TableCell>
                      <TableCell>{getCiudadNombre(candidato.ciudad_id)}</TableCell>
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
                            onClick={() => deleteCandidatoMutation.mutate(candidato.id)}
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
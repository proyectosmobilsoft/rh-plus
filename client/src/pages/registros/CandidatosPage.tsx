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
import { User, Search, Plus, Edit, Trash2, FileText, Download, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { candidatosService, type DocumentoCandidato } from '@/services/candidatosService';
import { useCompanies } from '@/hooks/useCompanies';
import { useCityData } from '@/hooks/useCityData';
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { empresasService } from '@/services/empresasService';
import { supabase } from '@/services/supabaseClient';

interface Candidato {
  id: number;
  identificacion: string;
  tipoDocumento: string;
  nombre: string;
  segundoNombre?: string;
  apellido: string;
  segundoApellido?: string;
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

  // Estados para búsqueda por cédula y documentos
  const [candidatoEncontrado, setCandidatoEncontrado] = useState<any>(null);
  const [documentosCandidato, setDocumentosCandidato] = useState<DocumentoCandidato[]>([]);
  const [modalDocumentosOpen, setModalDocumentosOpen] = useState(false);
  const [buscandoCandidato, setBuscandoCandidato] = useState(false);
  const [tipoBusqueda, setTipoBusqueda] = useState<'general' | 'documentos'>('general');
  const [modalConfirmacionOpen, setModalConfirmacionOpen] = useState(false);
  const [candidatoAEliminar, setCandidatoAEliminar] = useState<any>(null);

  // Query para obtener candidatos desde Supabase
  const { data: candidatos = [], isLoading, refetch } = useQuery({
    queryKey: ['candidatos'],
    queryFn: candidatosService.getAll,
    staleTime: 0,
    refetchOnWindowFocus: false
  });

  // Función para buscar candidato por cédula
  const buscarCandidatoPorCedula = async () => {
    if (!searchTerm.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa un número de cédula",
        variant: "destructive",
      });
      return;
    }

    setBuscandoCandidato(true);
    try {
      const candidato = await candidatosService.getByDocumento(searchTerm);
      if (candidato) {
        setCandidatoEncontrado(candidato);
        // Obtener documentos del candidato
        const documentos = await candidatosService.getDocumentos(candidato.id!);
        setDocumentosCandidato(documentos);
        setModalDocumentosOpen(true);
      } else {
        toast({
          title: "No encontrado",
          description: "No se encontró ningún candidato con esa cédula",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error buscando candidato:', error);
      toast({
        title: "Error",
        description: "Error al buscar el candidato",
        variant: "destructive",
      });
    } finally {
      setBuscandoCandidato(false);
    }
  };

  // Función para buscar documentos de un candidato específico
  const buscarDocumentosCandidato = async (candidato: any) => {
    setBuscandoCandidato(true);
    try {
      setCandidatoEncontrado(candidato);
      // Obtener documentos del candidato
      const documentos = await candidatosService.getDocumentos(candidato.id);
      setDocumentosCandidato(documentos);
      setModalDocumentosOpen(true);
    } catch (error) {
      console.error('Error buscando documentos:', error);
      toast({
        title: "Error",
        description: "Error al buscar los documentos",
        variant: "destructive",
      });
    } finally {
      setBuscandoCandidato(false);
    }
  };

  // Función para abrir modal de confirmación de eliminación
  const confirmarEliminacion = (candidato: any) => {
    setCandidatoAEliminar(candidato);
    setModalConfirmacionOpen(true);
  };

  // Función para descargar documento
  const descargarDocumento = (documento: DocumentoCandidato) => {
    if (documento.url_archivo) {
      window.open(documento.url_archivo, '_blank');
    } else {
      toast({
        title: "Error",
        description: "No se puede descargar el documento",
        variant: "destructive",
      });
    }
  };

  // Función para obtener el tipo de documento en español
  const getTipoDocumentoLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      'hoja_vida': 'Hoja de Vida',
      'diploma': 'Diploma',
      'certificacion': 'Certificación',
      'fotografia': 'Fotografía',
      'certificado_laboral': 'Certificado Laboral',
      'portafolio': 'Portafolio',
      'otros': 'Otros'
    };
    return tipos[tipo] || tipo;
  };

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

  const { data: empresasReales = [], isLoading: isLoadingEmpresas, error: errorEmpresas } = useCompanies('empresa');

  // Debug: Verificar si las empresas se están cargando
  console.log('Empresas cargadas:', empresasReales);
  console.log('Estado de carga de empresas:', isLoadingEmpresas);
  console.log('Error de empresas:', errorEmpresas);

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
                placeholder={
                  tipoBusqueda === 'general' 
                    ? "Buscar candidatos por nombre, cédula o email..." 
                    : "Ingresa el número de cédula para buscar documentos..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    if (tipoBusqueda === 'documentos') {
                      buscarCandidatoPorCedula();
                    }
                  }
                }}
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

            {/* Botones de búsqueda */}
            <div className="flex gap-2">
              <Button 
                onClick={() => setTipoBusqueda('general')}
                variant={tipoBusqueda === 'general' ? 'default' : 'outline'}
                className="whitespace-nowrap"
              >
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
              <Button 
                onClick={() => {
                  setTipoBusqueda('documentos');
                  if (searchTerm.trim()) {
                    buscarCandidatoPorCedula();
                  }
                }}
                disabled={buscandoCandidato || !searchTerm.trim()}
                variant={tipoBusqueda === 'documentos' ? 'default' : 'outline'}
                className="whitespace-nowrap"
              >
                {buscandoCandidato ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Buscando...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Ver Docs
                  </>
                )}
              </Button>
              {/* Botón para agregar candidatos */}
              <Button 
                onClick={() => {
                  resetForm();
                  setEditingId(null);
                  setDialogOpen(true);
                }}
                className="bg-green-600 hover:bg-green-700 whitespace-nowrap"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Candidato
              </Button>
            </div>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
                      <SelectItem value="PP">Pasaporte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Primer Nombre *</label>
                  <Input
                    value={formData.nombre || ''}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Primer nombre"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Segundo Nombre</label>
                  <Input
                    value={formData.segundoNombre || ''}
                    onChange={(e) => setFormData({ ...formData, segundoNombre: e.target.value })}
                    placeholder="Segundo nombre (opcional)"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Primer Apellido *</label>
                  <Input
                    value={formData.apellido || ''}
                    onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                    placeholder="Primer apellido"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Segundo Apellido</label>
                  <Input
                    value={formData.segundoApellido || ''}
                    onChange={(e) => setFormData({ ...formData, segundoApellido: e.target.value })}
                    placeholder="Segundo apellido (opcional)"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Teléfono</label>
                  <Input
                    value={formData.telefono || ''}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    placeholder="Número de teléfono"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Correo Electrónico *</label>
                  <Input
                    type="email"
                    value={formData.correo || ''}
                    onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                    placeholder="correo@ejemplo.com"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Empresa *</label>
                  <Select
                    value={formData.empresa_id?.toString() || ''}
                    onValueChange={(value) => setFormData({ ...formData, empresa_id: parseInt(value) })}
                    disabled={isLoadingEmpresas}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingEmpresas ? "Cargando empresas..." : "Seleccionar empresa"} />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingEmpresas ? (
                        <SelectItem value="loading" disabled>
                          Cargando empresas...
                        </SelectItem>
                      ) : errorEmpresas ? (
                        <SelectItem value="error" disabled>
                          Error al cargar empresas
                        </SelectItem>
                      ) : empresasReales.length === 0 ? (
                        <SelectItem value="no-empresas" disabled>
                          No hay empresas disponibles
                        </SelectItem>
                      ) : (
                        empresasReales.map((empresa) => (
                          <SelectItem key={empresa.id} value={empresa.id.toString()}>
                            {empresa.razonSocial}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {errorEmpresas && (
                    <p className="text-sm text-red-500 mt-1">
                      Error al cargar empresas: {errorEmpresas}
                    </p>
                  )}
                  {empresasReales.length === 0 && !isLoadingEmpresas && !errorEmpresas && (
                    <div className="mt-2">
                      <p className="text-sm text-red-500 mb-2">
                        No se pudieron cargar las empresas. Verifica la conexión.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            try {
                              // Crear una empresa de prueba con la estructura correcta
                              const empresaPrueba = {
                                nombre: 'Empresa de Prueba',
                                razonSocial: 'Empresa de Prueba S.A.S.',
                                nit: '900123456-7',
                                direccion: 'Calle 123 #45-67',
                                telefono: '3001234567',
                                email: 'contacto@empresaprueba.com',
                                representanteLegal: 'Juan Pérez',
                                cargoRepresentante: 'Gerente General',
                                estado: 'activo'
                              };
                              
                              const nuevaEmpresa = await empresasService.create(empresaPrueba);
                              if (nuevaEmpresa) {
                                toast({
                                  title: "Éxito",
                                  description: "Empresa de prueba creada correctamente",
                                });
                                // Recargar las empresas
                                window.location.reload();
                              } else {
                                toast({
                                  title: "Error",
                                  description: "No se pudo crear la empresa de prueba",
                                  variant: "destructive",
                                });
                              }
                            } catch (error) {
                              console.error('Error completo:', error);
                              toast({
                                title: "Error",
                                description: "No se pudo crear la empresa de prueba",
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          Crear Empresa de Prueba
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            try {
                              // Verificar directamente las empresas en la BD
                              console.log('🔍 Verificando conexión con Supabase...');
                              
                              // Primero verificar la estructura de la tabla
                              const { data: structureData, error: structureError } = await supabase
                                .from('empresas')
                                .select('*')
                                .limit(1);
                              
                              if (structureError) {
                                console.error('❌ Error al verificar estructura:', structureError);
                                toast({
                                  title: "Error",
                                  description: `Error de estructura: ${structureError.message}`,
                                  variant: "destructive",
                                });
                                return;
                              }
                              
                              if (structureData && structureData.length > 0) {
                                console.log('📋 Estructura de la primera empresa:', structureData[0]);
                                console.log('🔑 Columnas disponibles:', Object.keys(structureData[0]));
                              }
                              
                              const { data, error } = await supabase
                                .from('empresas')
                                .select('*');
                              
                              if (error) {
                                console.error('❌ Error al consultar empresas:', error);
                                toast({
                                  title: "Error",
                                  description: `Error al consultar: ${error.message}`,
                                  variant: "destructive",
                                });
                              } else {
                                console.log('✅ Empresas en BD:', data);
                                console.log('📊 Total de empresas:', data?.length || 0);
                                
                                if (data && data.length > 0) {
                                  console.log('📋 Primera empresa:', data[0]);
                                }
                                
                                toast({
                                  title: "Info",
                                  description: `Encontradas ${data?.length || 0} empresas en la BD`,
                                });
                              }
                            } catch (error) {
                              console.error('❌ Error al verificar empresas:', error);
                            }
                          }}
                        >
                          Verificar BD
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Departamento</label>
                  <Select
                    value={selectedDepartamento}
                    onValueChange={setSelectedDepartamento}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar departamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(cityData).length === 0 ? (
                        <SelectItem value="no-departamentos" disabled>
                          No hay departamentos disponibles
                        </SelectItem>
                      ) : (
                        Object.entries(cityData).map(([depId, dep]: [string, any]) => (
                          <SelectItem key={depId} value={depId}>
                            {dep.nombre}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Ciudad</label>
                  <Select
                    value={formData.ciudad_id?.toString() || ''}
                    onValueChange={(value) => setFormData({ ...formData, ciudad_id: parseInt(value) })}
                    disabled={!selectedDepartamento}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar ciudad" />
                    </SelectTrigger>
                    <SelectContent>
                      {!selectedDepartamento ? (
                        <SelectItem value="seleccione-departamento" disabled>
                          Seleccione un departamento primero
                        </SelectItem>
                      ) : !(cityData as Record<string, any>)[selectedDepartamento]?.ciudades?.length ? (
                        <SelectItem value="no-ciudades" disabled>
                          No hay ciudades disponibles para este departamento
                        </SelectItem>
                      ) : (
                        (cityData as Record<string, any>)[selectedDepartamento]?.ciudades?.map((ciudad: any) => (
                          <SelectItem key={ciudad.id} value={ciudad.id.toString()}>
                            {ciudad.nombre}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Dirección</label>
                  <Input
                    value={formData.direccion || ''}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    placeholder="Dirección completa"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit} disabled={createCandidatoMutation.isPending}>
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
                            onClick={() => confirmarEliminacion(candidato)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setCandidatoEncontrado(candidato);
                              setDocumentosCandidato([]); // Limpiar documentos anteriores
                              buscarDocumentosCandidato(candidato); // Buscar documentos para este candidato
                            }}
                          >
                            <FileText className="h-4 w-4" />
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

      {/* Modal de Documentos del Candidato */}
      <Dialog open={modalDocumentosOpen} onOpenChange={setModalDocumentosOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Documentos del Candidato
            </DialogTitle>
          </DialogHeader>
          
          {candidatoEncontrado && (
            <div className="space-y-6">
              {/* Información del candidato */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Información del Candidato</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Nombre Completo</p>
                      <p className="text-base">
                        {candidatoEncontrado.primer_nombre} {candidatoEncontrado.segundo_nombre || ''} {candidatoEncontrado.primer_apellido} {candidatoEncontrado.segundo_apellido || ''}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Cédula</p>
                      <p className="text-base">{candidatoEncontrado.numero_documento}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Email</p>
                      <p className="text-base">{candidatoEncontrado.email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Teléfono</p>
                      <p className="text-base">{candidatoEncontrado.telefono || 'No registrado'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Separator />

              {/* Lista de documentos */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Documentos Adjuntados</h3>
                  <Badge variant="outline" className="text-sm">
                    {documentosCandidato.length} documento{documentosCandidato.length !== 1 ? 's' : ''}
                  </Badge>
                </div>

                {documentosCandidato.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No hay documentos adjuntados</p>
                    <p className="text-sm text-gray-400 mt-1">El candidato aún no ha subido documentos</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {documentosCandidato.map((documento) => (
                      <Card key={documento.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <FileText className="h-4 w-4 text-blue-600" />
                                <h4 className="font-medium text-sm">
                                  {getTipoDocumentoLabel(documento.tipo)}
                                </h4>
                              </div>
                              <p className="text-xs text-gray-600 mb-2">
                                {documento.nombre_archivo}
                              </p>
                              <p className="text-xs text-gray-500">
                                Subido: {new Date(documento.created_at).toLocaleDateString('es-ES')}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => descargarDocumento(documento)}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(documento.url_archivo, '_blank')}
                                className="text-green-600 hover:text-green-700"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmación de Eliminación */}
      <Dialog open={modalConfirmacionOpen} onOpenChange={setModalConfirmacionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Confirmar Eliminación
            </DialogTitle>
          </DialogHeader>
          {candidatoAEliminar && (
            <div className="py-6">
              <div className="text-center mb-4">
                <p className="text-lg font-medium">¿Estás seguro de que quieres eliminar este candidato?</p>
                <p className="text-sm text-gray-600 mt-2">Esta acción no se puede deshacer.</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h4 className="font-medium text-sm text-gray-700 mb-2">Información del candidato:</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Nombre:</span> {candidatoAEliminar.primer_nombre} {candidatoAEliminar.primer_apellido}</p>
                  <p><span className="font-medium">Cédula:</span> {candidatoAEliminar.numero_documento}</p>
                  <p><span className="font-medium">Email:</span> {candidatoAEliminar.email}</p>
                  <p><span className="font-medium">Empresa:</span> {getEmpresaNombre(candidatoAEliminar.empresa_id)}</p>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setModalConfirmacionOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (candidatoAEliminar) {
                      deleteCandidatoMutation.mutate(candidatoAEliminar.id);
                      setModalConfirmacionOpen(false);
                      setCandidatoAEliminar(null);
                    }
                  }}
                  disabled={deleteCandidatoMutation.isPending}
                >
                  {deleteCandidatoMutation.isPending ? 'Eliminando...' : 'Eliminar Candidato'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CandidatosPage;
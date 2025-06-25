import { useState, useEffect } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useApiData } from '@/hooks/useApiData';
import { User, Search, Plus, Edit, Trash2, DatabaseIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DatosPersonalesForm } from '@/components/aspirantes/DatosPersonalesForm';
import { EducacionTab } from '@/components/aspirantes/EducacionTab';
import { ExperienciaLaboralTab } from '@/components/aspirantes/ExperienciaLaboralTab';
import { api } from '@/services/api';

interface EducacionAPI {
  id?: number;
  aspirante_id?: number;
  nivel_educativo: string;
  institucion: string;
  titulo: string;
  graduacion: string;
}

interface ExperienciaLaboralAPI {
  id?: number;
  aspirante_id?: number;
  empresa: string;
  cargo: string;
  fecha_inicio: string;
  fecha_fin: string;
  responsabilidades: string;
  salario: string | number;
}

interface Educacion {
  id?: number;
  nivelEducativo: string;
  institucion: string;
  titulo: string;
  fechaGraduacion: string;
}

interface ExperienciaLaboral {
  id?: number;
  empresa: string;
  fechaInicio: string;
  fechaFin: string;
  cargo: string;
  responsabilidades: string;
  salario: string | number;
}

interface AspiranteAPI {
  id: number;
  numero_documento: string;
  tipo_documento: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  correo_electronico: string;
  empresa: string;
  ciudad: string;
  direccion: string;
  horario_trabajo?: string;
  cargo_aspirado?: string;
  sector_economico?: string;
  eps?: string;
  arl?: string;
  fondo_pension?: string;
  nivel_educativo_main?: string;
  remuneracion?: string | number;
  fecha_nacimiento?: string;
  sexo?: string;
  estado_civil?: string;
  grupo_sanguineo?: string;
  nombres_emergencia?: string;
  telefono_emergencia?: string;
  correo_emergencia?: string;
}

interface Aspirante {
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
  horarioTrabajo?: string;
  cargoAspira?: string;
  actividadEconomica?: string;
  eps?: string;
  arl?: string;
  fondoPensiones?: string;
  nivelEducativo?: string;
  remuneracionSalarial?: string | number;
  fechaNacimiento?: string;
  sexo?: string;
  estadoCivil?: string;
  grupoSanguineo?: string;
  contactoEmergenciaNombre?: string;
  contactoEmergenciaCelular?: string;
  contactoEmergenciaCorreo?: string;
  educacion?: Educacion[];
  experienciaLaboral?: ExperienciaLaboral[];
}

const AspirantesPage = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<Partial<Aspirante>>({
    identificacion: '',
    tipoDocumento: '',
    nombre: '',
    apellido: '',
    telefono: '',
    correo: '',
    empresa: '',
    ciudad: '',
    direccion: '',
    educacion: [],
    experienciaLaboral: []
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [aspirantesList, setAspirantesList] = useState<(Aspirante | AspiranteAPI)[]>([]);
  const [activeTab, setActiveTab] = useState('datos-personales');
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Datos simulados mientras se configura la API
  const mockAspirantes: Aspirante[] = [
    { id: 1, identificacion: '1234567890', tipoDocumento: 'CC', nombre: 'Juan', apellido: 'Pérez', telefono: '3101234567', correo: 'juan@ejemplo.com', empresa: 'Empresa ABC', ciudad: 'Bogotá', direccion: 'Calle 123' },
    { id: 2, identificacion: '0987654321', tipoDocumento: 'CE', nombre: 'María', apellido: 'González', telefono: '3209876543', correo: 'maria@ejemplo.com', empresa: 'Industrial XYZ', ciudad: 'Medellín', direccion: 'Carrera 45' },
    { id: 3, identificacion: '5678901234', tipoDocumento: 'TI', nombre: 'Carlos', apellido: 'Rodríguez', telefono: '3112345678', correo: 'carlos@ejemplo.com', empresa: 'Servicios 123', ciudad: 'Cali', direccion: 'Avenida 67' },
  ];

  // Hook para consumir la API
  const {
    data: apiResponse,
    isLoading,
    error,
    fetchData,
    createData,
    updateData,
    deleteData,
    isFetched
  } = useApiData<any>('/aspirantes', mockAspirantes, {
    showSuccessToast: true,
    successMessage: 'Datos de aspirantes cargados correctamente',
    errorMessage: 'Error al cargar los datos de aspirantes',
    autoFetch: false
  });

  // Procesar datos de API y actualizar lista de aspirantes
  useEffect(() => {
    if (apiResponse) {
      console.log('Processing API response:', apiResponse);
      
      // Verificar si tenemos datos en diferentes estructuras posibles
      let extractedData: (Aspirante | AspiranteAPI)[] = [];
      
      if (Array.isArray(apiResponse)) {
        extractedData = apiResponse;
      } else if (apiResponse.filas && Array.isArray(apiResponse.filas)) {
        extractedData = apiResponse.filas;
      } else if (apiResponse.resultado && Array.isArray(apiResponse.resultado)) {
        // Extraer datos del primer elemento si es un array de arrays
        if (Array.isArray(apiResponse.resultado[0])) {
          extractedData = apiResponse.resultado[0];
        } else {
          extractedData = apiResponse.resultado;
        }
      } else {
        // Fallback a usar mockAspirantes si no hay datos de la API
        extractedData = mockAspirantes;
      }
      
      console.log('Extracted aspirantes data:', extractedData);
      setAspirantesList(extractedData);
    }
  }, [apiResponse, mockAspirantes]);

  // Cargar datos solo cuando el componente se monta por primera vez
  useEffect(() => {
    if (!isFetched) {
      console.log('Fetching aspirantes data once on mount');
      fetchData().catch(error => {
        console.error('Error fetching aspirantes:', error);
        // En caso de error, usar datos simulados
        setAspirantesList(mockAspirantes);
      });
    }
  }, [fetchData, isFetched, mockAspirantes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validaciones básicas
      if (!formData.identificacion || !formData.nombre || !formData.apellido) {
        toast({
          title: "Error de validación",
          description: "Por favor complete los campos requeridos",
          variant: "destructive",
        });
        return;
      }

      if (editingId) {
        // Actualizando aspirante existente
        await updateData(editingId, formData);
        toast({
          title: "Éxito",
          description: "Aspirante actualizado correctamente",
        });
      } else {
        // Creando nuevo aspirante
        await createData(formData);
        toast({
          title: "Éxito",
          description: "Aspirante registrado correctamente",
        });
      }

      // Recargar datos después de crear/actualizar
      await fetchData();
      
      setDialogOpen(false);
      setFormData({
        identificacion: '',
        tipoDocumento: '',
        nombre: '',
        apellido: '',
        telefono: '',
        correo: '',
        empresa: '',
        ciudad: '',
        direccion: '',
        educacion: [],
        experienciaLaboral: []
      });
      setEditingId(null);
    } catch (error) {
      console.error('Error al procesar aspirante:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el aspirante",
        variant: "destructive",
      });
    }
  };

  const fetchAspiranteDetails = async (id: number) => {
    setIsLoadingDetails(true);
    try {
      console.log(`Fetching details for aspirante ID: ${id}`);
      const response = await api.post('/aspirantes/by/', { id });
      console.log("Aspirante details response:", response);
      
      if (response && typeof response === 'object') {
        // Fix: Access filas safely with optional chaining and type assertion
        const responseObj = response as any;
        const filas = responseObj.filas || [];
        
        // Extract education and experience arrays from response
        const educacionData: EducacionAPI[] = Array.isArray(filas[0]) ? filas[0] : [];
        const experienciaData: ExperienciaLaboralAPI[] = Array.isArray(filas[1]) ? filas[1] : [];
        
        console.log("Extracted education data:", educacionData);
        console.log("Extracted experience data:", experienciaData);
        
        // Transform API data to match component structure
        const formattedEducacion = educacionData.map(edu => ({
          id: edu.id,
          nivelEducativo: edu.nivel_educativo,
          institucion: edu.institucion,
          titulo: edu.titulo,
          fechaGraduacion: edu.graduacion ? new Date(edu.graduacion).toISOString().split('T')[0] : ''
        }));
        
        const formattedExperiencia = experienciaData.map(exp => ({
          id: exp.id,
          empresa: exp.empresa,
          fechaInicio: exp.fecha_inicio ? new Date(exp.fecha_inicio).toISOString().split('T')[0] : '',
          fechaFin: exp.fecha_fin ? new Date(exp.fecha_fin).toISOString().split('T')[0] : '',
          cargo: exp.cargo,
          responsabilidades: exp.responsabilidades,
          salario: exp.salario
        }));
        
        return {
          educacion: formattedEducacion,
          experienciaLaboral: formattedExperiencia
        };
      } else {
        console.warn("Unexpected response format for aspirante details:", response);
        return {
          educacion: [],
          experienciaLaboral: []
        };
      }
    } catch (error) {
      console.error('Error fetching aspirante details:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los detalles del aspirante",
        variant: "destructive",
      });
      return {
        educacion: [],
        experienciaLaboral: []
      };
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleEdit = async (aspirante: Aspirante | AspiranteAPI) => {
    try {
      // Initialize basic data from aspirante object based on its structure
      const baseData = 'numero_documento' in aspirante ? {
        id: aspirante.id,
        identificacion: aspirante.numero_documento || '',
        tipoDocumento: aspirante.tipo_documento || '',
        nombre: aspirante.nombres || '',
        apellido: aspirante.apellidos || '',
        telefono: aspirante.telefono || '',
        correo: aspirante.correo_electronico || '',
        empresa: aspirante.empresa || '',
        ciudad: aspirante.ciudad || '',
        direccion: aspirante.direccion || '',
        horarioTrabajo: aspirante.horario_trabajo || '',
        cargoAspira: aspirante.cargo_aspirado || '',
        actividadEconomica: aspirante.sector_economico || '',
        eps: aspirante.eps || '',
        arl: aspirante.arl || '',
        fondoPensiones: aspirante.fondo_pension || '',
        nivelEducativo: aspirante.nivel_educativo_main || '',
        remuneracionSalarial: aspirante.remuneracion || '',
        fechaNacimiento: aspirante.fecha_nacimiento ? new Date(aspirante.fecha_nacimiento).toISOString().split('T')[0] : '',
        sexo: aspirante.sexo || '',
        estadoCivil: aspirante.estado_civil || '',
        grupoSanguineo: aspirante.grupo_sanguineo || '',
        contactoEmergenciaNombre: aspirante.nombres_emergencia || '',
        contactoEmergenciaCelular: aspirante.telefono_emergencia || '',
        contactoEmergenciaCorreo: aspirante.correo_emergencia || '',
        educacion: [],
        experienciaLaboral: []
      } : {
        ...aspirante
      };
      
      setFormData(baseData);
      setEditingId(aspirante.id);
      setDialogOpen(true);
      setActiveTab('datos-personales');
      
      // Then fetch education and experience data from API
      const details = await fetchAspiranteDetails(aspirante.id);
      
      // Update form data with fetched details
      setFormData(prev => ({
        ...prev,
        educacion: details.educacion,
        experienciaLaboral: details.experienciaLaboral
      }));
    } catch (error) {
      console.error('Error preparing aspirante for edit:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar la información completa del aspirante",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteData(id);
      toast({
        title: "Éxito",
        description: "Aspirante eliminado correctamente",
      });
      // Recargar datos después de eliminar
      await fetchData();
    } catch (error) {
      console.error('Error al eliminar aspirante:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el aspirante",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Ahora filtramos la lista local que ya es un array
  const filteredAspirantes = aspirantesList.filter((aspirante: any) => 
    (aspirante.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     aspirante.nombres?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     aspirante.apellido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     aspirante.apellidos?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     aspirante.identificacion?.includes(searchTerm) ||
     aspirante.numero_documento?.includes(searchTerm) ||
     aspirante.empresa?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="page-container p-6">
      <div className="page-header mb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <User className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Aspirantes</h1>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setFormData({
                  identificacion: '',
                  tipoDocumento: '',
                  nombre: '',
                  apellido: '',
                  telefono: '',
                  correo: '',
                  empresa: '',
                  ciudad: '',
                  direccion: '',
                  educacion: [],
                  experienciaLaboral: []
                });
                setEditingId(null);
                setActiveTab('datos-personales');
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Aspirante
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? "Editar Aspirante" : "Registrar Nuevo Aspirante"}
                </DialogTitle>
              </DialogHeader>
              <ScrollArea className="h-[75vh]">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="w-full grid grid-cols-3">
                      <TabsTrigger value="datos-personales">Datos Personales</TabsTrigger>
                      <TabsTrigger value="educacion">Educación</TabsTrigger>
                      <TabsTrigger value="experiencia-laboral">Experiencia Laboral</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="datos-personales" className="mt-4">
                      <DatosPersonalesForm 
                        formData={formData}
                        onChange={handleInputChange}
                      />
                    </TabsContent>
                    
                    <TabsContent value="educacion" className="mt-4">
                      {isLoadingDetails && editingId && formData.educacion?.length === 0 ? (
                        <div className="flex justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                      ) : (
                        <EducacionTab
                          educacion={formData.educacion || []}
                          onChange={(newEducacion) => handleInputChange('educacion', newEducacion)}
                        />
                      )}
                    </TabsContent>
                    
                    <TabsContent value="experiencia-laboral" className="mt-4">
                      {isLoadingDetails && editingId && formData.experienciaLaboral?.length === 0 ? (
                        <div className="flex justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                      ) : (
                        <ExperienciaLaboralTab
                          experienciaLaboral={formData.experienciaLaboral || []}
                          onChange={(newExperiencia) => handleInputChange('experienciaLaboral', newExperiencia)}
                        />
                      )}
                    </TabsContent>
                  </Tabs>

                  <div className="flex justify-end space-x-2 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingId ? "Actualizar" : "Guardar"}
                    </Button>
                  </div>
                </form>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar aspirantes..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Identificación</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Apellido</TableHead>
              <TableHead className="hidden md:table-cell">Teléfono</TableHead>
              <TableHead className="hidden md:table-cell">Correo</TableHead>
              <TableHead className="hidden md:table-cell">Empresa</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                    <span>Cargando datos...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredAspirantes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <DatabaseIcon className="h-10 w-10 mb-2" />
                    <span className="font-medium">No se encontraron aspirantes</span>
                    <span className="text-sm">No hay datos disponibles en este momento</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredAspirantes.map((aspirante: any) => (
                <TableRow key={aspirante.id}>
                  <TableCell className="font-medium">{aspirante.numero_documento || aspirante.identificacion}</TableCell>
                  <TableCell>{aspirante.nombres || aspirante.nombre}</TableCell>
                  <TableCell>{aspirante.apellidos || aspirante.apellido}</TableCell>
                  <TableCell className="hidden md:table-cell">{aspirante.telefono}</TableCell>
                  <TableCell className="hidden md:table-cell">{aspirante.correo_electronico || aspirante.correo}</TableCell>
                  <TableCell className="hidden md:table-cell">{aspirante.empresa}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(aspirante)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(aspirante.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AspirantesPage;

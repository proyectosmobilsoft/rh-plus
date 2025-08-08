import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { plantillasService, Plantilla, verificarEstructuraDB } from '@/services/plantillasService';
import { solicitudesService, Solicitud } from '@/services/solicitudesService';
import { useToast } from '@/hooks/use-toast';
import FormRenderer from '@/components/FormRenderer';
import { toast } from 'sonner';

interface PlantillasSelectorProps {
  empresaId: number;
  onPlantillaSelect: (plantilla: Plantilla) => void;
  selectedSolicitud?: Solicitud; // Para edición
  onSave?: () => void; // Callback cuando se guarda exitosamente
  onCancel?: () => void; // Callback cuando se cancela
}

export default function PlantillasSelector({ 
  empresaId, 
  onPlantillaSelect, 
  selectedSolicitud, 
  onSave, 
  onCancel 
}: PlantillasSelectorProps) {
  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlantilla, setSelectedPlantilla] = useState<Plantilla | null>(null);
  const [estructuraFormulario, setEstructuraFormulario] = useState<any>(null);
  const [isLoadingEstructura, setIsLoadingEstructura] = useState(false);
  const [initialFormData, setInitialFormData] = useState<Record<string, any>>({});
  const { toast: useToastHook } = useToast();

  useEffect(() => {
    fetchPlantillas();
  }, [empresaId]);

  // Cargar datos para edición
  useEffect(() => {
    if (selectedSolicitud && selectedSolicitud.plantilla_id) {
      loadSolicitudForEdit();
    }
  }, [selectedSolicitud]);

  const fetchPlantillas = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('🚀 Iniciando carga de plantillas para empresa ID:', empresaId);
      
      // Primero verificamos la estructura de la base de datos
      console.log('🔍 Verificando estructura de la base de datos...');
      const estructuraDB = await verificarEstructuraDB();
      console.log('📊 Estructura DB:', estructuraDB);
      
      const data = await plantillasService.getByEmpresa(empresaId);
      console.log('📦 Plantillas recibidas:', data);
      console.log('📊 Cantidad de plantillas:', data?.length || 0);
      setPlantillas(data);
    } catch (error) {
      console.error('❌ Error al cargar plantillas:', error);
      setError('Error al cargar las plantillas');
      useToastHook({
        title: "Error",
        description: "No se pudieron cargar las plantillas de la empresa",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadSolicitudForEdit = async () => {
    console.log('🔍 PlantillasSelector - Cargando solicitud para editar:', selectedSolicitud);
    
    if (!selectedSolicitud || !selectedSolicitud.plantilla_id) return;

    try {
      setIsLoadingEstructura(true);
      
      // Obtener la plantilla utilizada en la solicitud
      const plantilla = await plantillasService.getById(selectedSolicitud.plantilla_id);
      console.log('🔍 PlantillasSelector - Plantilla obtenida para edición:', plantilla);
      
      if (plantilla) {
        setSelectedPlantilla(plantilla);
        setEstructuraFormulario(plantilla.estructura_formulario);
        
        // Cargar los datos guardados de la solicitud
        console.log('🔍 PlantillasSelector - Datos de estructura_datos:', selectedSolicitud.estructura_datos);
        if (selectedSolicitud.estructura_datos) {
          setInitialFormData(selectedSolicitud.estructura_datos);
          console.log('🔍 PlantillasSelector - Datos iniciales establecidos:', selectedSolicitud.estructura_datos);
        }
        
        onPlantillaSelect(plantilla);
      }
    } catch (error) {
      console.error('Error cargando solicitud para editar:', error);
      toast.error('Error al cargar los datos de la solicitud');
    } finally {
      setIsLoadingEstructura(false);
    }
  };

  const handlePlantillaSelect = async (plantilla: Plantilla) => {
    console.log('🎯 Plantilla seleccionada:', plantilla);
    setSelectedPlantilla(plantilla);
    setIsLoadingEstructura(true);
    
    try {
      // Obtener la plantilla completa con la estructura del formulario
      const plantillaCompleta = await plantillasService.getById(plantilla.id);
      
      if (plantillaCompleta) {
        console.log('📋 Plantilla completa obtenida:', plantillaCompleta);
        console.log('🏗️ Estructura del formulario:', plantillaCompleta.estructura_formulario);
        
        if (plantillaCompleta.estructura_formulario) {
          setEstructuraFormulario(plantillaCompleta.estructura_formulario);
          onPlantillaSelect(plantillaCompleta);
          
          // Solo resetear datos iniciales si no estamos editando
          if (!selectedSolicitud) {
            setInitialFormData({});
          }
        } else {
          console.warn('⚠️ La plantilla no tiene estructura de formulario definida');
          setEstructuraFormulario(null);
          useToastHook({
            title: "Advertencia",
            description: "Esta plantilla no tiene estructura de formulario configurada",
            variant: "destructive"
          });
        }
      } else {
        console.error('❌ No se pudo obtener la plantilla completa');
        setEstructuraFormulario(null);
        useToastHook({
          title: "Error",
          description: "No se pudo obtener la información completa de la plantilla",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ Error al obtener estructura del formulario:', error);
      setEstructuraFormulario(null);
      useToastHook({
        title: "Error",
        description: "Error al cargar la estructura del formulario",
        variant: "destructive"
      });
    } finally {
      setIsLoadingEstructura(false);
    }
  };

  const handleFormSave = async (formData: Record<string, any>) => {
    console.log('🔍 PlantillasSelector - Datos recibidos del formulario:', formData);
    console.log('🔍 PlantillasSelector - Plantilla seleccionada:', selectedPlantilla);
    console.log('🔍 PlantillasSelector - Solicitud existente:', selectedSolicitud);
    
    if (!selectedPlantilla) {
      toast.error('No hay plantilla seleccionada');
      return;
    }

    try {
      if (selectedSolicitud?.id) {
        // Actualizar solicitud existente
        console.log('🔍 PlantillasSelector - Actualizando solicitud ID:', selectedSolicitud.id);
        await solicitudesService.updateWithTemplate(selectedSolicitud.id, formData);
        toast.success('Solicitud actualizada correctamente');
      } else {
        // Crear nueva solicitud
        console.log('🔍 PlantillasSelector - Creando nueva solicitud');
        await solicitudesService.createWithTemplate(
          empresaId,
          selectedPlantilla.id,
          selectedPlantilla.nombre,
          formData
        );
        toast.success('Solicitud creada correctamente');
      }
      
      // Llamar callback de éxito
      if (onSave) {
        onSave();
      }
    } catch (error) {
      console.error('Error guardando solicitud:', error);
      toast.error('Error al guardar la solicitud');
    }
  };

  const handleFormCancel = () => {
    setSelectedPlantilla(null);
    setEstructuraFormulario(null);
    setInitialFormData({});
    
    if (onCancel) {
      onCancel();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando plantillas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error al cargar plantillas</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={fetchPlantillas} variant="outline">
          Intentar nuevamente
        </Button>
      </div>
    );
  }

  if (plantillas.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay plantillas disponibles</h3>
        <p className="text-gray-600">
          La empresa no tiene plantillas de solicitudes asignadas.
        </p>
      </div>
    );
  }

  // Si hay una plantilla seleccionada, mostrar el renderizador
  if (selectedPlantilla) {
    return (
      <div className="space-y-6">
        
        {/* Renderizador del Formulario */}
        <div>
          {isLoadingEstructura ? (
            <div className="border rounded-lg p-6 bg-white flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Cargando estructura del formulario...</p>
              </div>
            </div>
          )
          : estructuraFormulario ? (
            <div className="border rounded-lg p-6 bg-white space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xl font-bold text-gray-900">Formulario de Solicitud</h4>
                  <p className="text-sm text-gray-600">Plantilla: {selectedPlantilla?.nombre || 'Cargando...'}</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedPlantilla(null);
                    setEstructuraFormulario(null);
                  }}
                  className="flex items-center gap-1.5"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Cambiar Plantilla
                </Button>
              </div>
              <FormRenderer 
                estructura={estructuraFormulario} 
                hideFieldLabels={true}
                initialData={initialFormData}
                onSave={handleFormSave}
                onCancel={handleFormCancel}
                showButtons={true}
              />
            </div>
          ) : (
            <div className="border rounded-lg p-6 bg-white text-center py-8 text-gray-500">
              <>
                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No hay estructura definida</p>
                <p className="text-sm">Esta plantilla no tiene estructura de formulario configurada</p>
              </>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Si no hay plantilla seleccionada, mostrar la lista de plantillas
  return (
    <>
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Plantillas de Solicitudes</h2>
            <p className="text-gray-600">
              Selecciona una plantilla para crear una nueva solicitud
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 justify-items-center">
            {plantillas.map((plantilla) => (
              <Card 
                key={plantilla.id} 
                className={`w-full max-w-xs bg-white shadow-md border border-gray-200 transition-all duration-200 ease-in-out ${plantilla.activa ? 'hover:border-blue-500 hover:shadow-lg hover:scale-[1.02] cursor-pointer group' : 'opacity-70'}`}
                onClick={plantilla.activa ? () => handlePlantillaSelect(plantilla) : undefined}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <FileText className="h-5 w-5 text-blue-600 group-hover:text-blue-700 transition-colors" />
                    <div className="flex items-center gap-2">
                      
                      <Badge 
                        variant={plantilla.activa ? "default" : "destructive"}
                        className={`text-xs font-medium px-2 py-0.5 ${plantilla.activa ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}`}
                      >
                        {plantilla.activa ? "Activa" : "Inactiva"}
                      </Badge>
                    </div>
                  </div>
                  <CardTitle className="text-lg font-bold text-gray-900 mt-2">
                    {plantilla.nombre}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-3 flex flex-col justify-between flex-grow">
                  {plantilla.descripcion && (
                    <p className="text-xs text-gray-700 mb-4 line-clamp-2 min-h-[36px] flex-grow">
                      {plantilla.descripcion}
                    </p>
                  ) || <p className="text-xs text-gray-700 mb-4 min-h-[36px] flex-grow h-0"></p>}
                  <Button
                    
                    className="w-full bg-cyan-600 text-white hover:bg-cyan-700 flex items-center justify-center text-sm px-3 py-1.5 h-auto"
                    disabled={!plantilla.activa}
                  >
                    <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                    Seleccionar Plantilla
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </>
  );
} 
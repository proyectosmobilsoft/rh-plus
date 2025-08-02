import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { plantillasService, Plantilla, verificarEstructuraDB } from '@/services/plantillasService';
import { useToast } from '@/hooks/use-toast';
import FormRenderer from '@/components/FormRenderer';

interface PlantillasSelectorProps {
  empresaId: number;
  onPlantillaSelect: (plantilla: Plantilla) => void;
}

export default function PlantillasSelector({ empresaId, onPlantillaSelect }: PlantillasSelectorProps) {
  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlantilla, setSelectedPlantilla] = useState<Plantilla | null>(null);
  const [estructuraFormulario, setEstructuraFormulario] = useState<any>(null);
  const [isLoadingEstructura, setIsLoadingEstructura] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPlantillas();
  }, [empresaId]);

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
      toast({
        title: "Error",
        description: "No se pudieron cargar las plantillas de la empresa",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
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
        } else {
          console.warn('⚠️ La plantilla no tiene estructura de formulario definida');
          setEstructuraFormulario(null);
          toast({
            title: "Advertencia",
            description: "Esta plantilla no tiene estructura de formulario configurada",
            variant: "destructive"
          });
        }
      } else {
        console.error('❌ No se pudo obtener la plantilla completa');
        setEstructuraFormulario(null);
        toast({
          title: "Error",
          description: "No se pudo obtener la información completa de la plantilla",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ Error al obtener estructura del formulario:', error);
      setEstructuraFormulario(null);
      toast({
        title: "Error",
        description: "Error al cargar la estructura del formulario",
        variant: "destructive"
      });
    } finally {
      setIsLoadingEstructura(false);
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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Formulario de Solicitud</h2>
            <p className="text-gray-600">Plantilla: {selectedPlantilla.nombre}</p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setSelectedPlantilla(null);
              setEstructuraFormulario(null);
            }}
          >
            Cambiar Plantilla
          </Button>
        </div>

        {/* Información de la Plantilla */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-3">Información de la Plantilla</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Nombre:</span> {selectedPlantilla.nombre}
            </div>
            <div>
              <span className="font-medium">Estado:</span> 
              <span className={`ml-1 px-2 py-1 rounded text-xs ${selectedPlantilla.activa ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {selectedPlantilla.activa ? 'Activa' : 'Inactiva'}
              </span>
            </div>
            {selectedPlantilla.descripcion && (
              <div className="col-span-2">
                <span className="font-medium">Descripción:</span> {selectedPlantilla.descripcion}
              </div>
            )}
            {selectedPlantilla.es_default && (
              <div className="col-span-2">
                <span className="font-medium">Tipo:</span> 
                <span className="ml-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                  Plantilla por Defecto
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Renderizador del Formulario */}
        <div>
          <h4 className="font-medium mb-4 text-gray-800">Formulario de Solicitud</h4>
          <div className="border rounded-lg p-6 bg-white">
            {isLoadingEstructura ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Cargando estructura del formulario...</p>
                </div>
              </div>
            ) : estructuraFormulario ? (
              <>
                {/* Debug info */}
                <div className="mb-4 p-2 bg-blue-50 rounded text-xs">
                  <strong>Debug:</strong> Estructura cargada desde BD
                  <br />
                  <strong>Tipo:</strong> {typeof estructuraFormulario}
                  <br />
                  <strong>Tiene secciones:</strong> {estructuraFormulario.secciones ? 'Sí' : 'No'}
                  <br />
                  <strong>Tiene campos:</strong> {estructuraFormulario.campos ? 'Sí' : 'No'}
                  <br />
                  <strong>Secciones count:</strong> {estructuraFormulario.secciones?.length || 0}
                  <br />
                  <strong>Campos count:</strong> {estructuraFormulario.campos?.length || 0}
                </div>
                <FormRenderer estructura={estructuraFormulario} />
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No hay estructura definida</p>
                <p className="text-sm">Esta plantilla no tiene estructura de formulario configurada</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Si no hay plantilla seleccionada, mostrar la lista de plantillas
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Plantillas de Solicitudes</h2>
        <p className="text-gray-600">
          Selecciona una plantilla para crear una nueva solicitud
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plantillas.map((plantilla) => (
          <Card key={plantilla.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    {plantilla.nombre}
                  </CardTitle>
                  {plantilla.descripcion && (
                    <p className="text-sm text-gray-600 mt-1">
                      {plantilla.descripcion}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {plantilla.es_default && (
                    <Badge variant="secondary" className="text-xs">
                      Default
                    </Badge>
                  )}
                  <Badge 
                    variant={plantilla.activa ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {plantilla.activa ? "Activa" : "Inactiva"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Button
                onClick={() => handlePlantillaSelect(plantilla)}
                className="w-full"
                disabled={!plantilla.activa}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Seleccionar Plantilla
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 
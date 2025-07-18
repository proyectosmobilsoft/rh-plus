import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, MapPin, Loader2 } from 'lucide-react';

interface Sede {
  id: number;
  nombre: string;
  descripcion: string;
  direccion: string;
  estado: string;
}

interface SedeSelectorProps {
  userSedes: number[];
  onSedeSelected: (sedeId: number) => Promise<void>;
}

export default function SedeSelector({ userSedes, onSedeSelected }: SedeSelectorProps) {
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSedeId, setSelectedSedeId] = useState<number | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  useEffect(() => {
    fetchSedes();
  }, []);

  const fetchSedes = async () => {
    try {
      const response = await fetch('/api/sedes', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const allSedes = await response.json();
        // Filtrar solo las sedes asignadas al usuario
        const availableSedes = allSedes.filter((sede: Sede) => 
          userSedes.includes(sede.id)
        );
        setSedes(availableSedes);
      }
    } catch (error) {
      console.error('Error fetching sedes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSedeSelection = async (sedeId: number) => {
    setIsSelecting(true);
    setSelectedSedeId(sedeId);
    
    try {
      await onSedeSelected(sedeId);
    } catch (error) {
      console.error('Error selecting sede:', error);
      setSelectedSedeId(null);
    } finally {
      setIsSelecting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-lime mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando sedes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <Building2 className="h-12 w-12 text-brand-lime mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Seleccionar Sede
          </h1>
          <p className="text-gray-600">
            Tienes acceso a múltiples sedes. Selecciona la sede con la que deseas trabajar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sedes.map((sede) => (
            <Card 
              key={sede.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedSedeId === sede.id ? 'ring-2 ring-brand-lime' : ''
              }`}
              onClick={() => handleSedeSelection(sede.id)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-brand-lime" />
                  {sede.nombre}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-3 text-sm">
                  {sede.descripcion}
                </p>
                <div className="flex items-start gap-2 text-sm text-gray-500">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{sede.direccion}</span>
                </div>
                <div className="mt-4">
                  <Button 
                    className="w-full bg-brand-lime hover:bg-brand-lime/90 text-white"
                    disabled={isSelecting && selectedSedeId === sede.id}
                  >
                    {isSelecting && selectedSedeId === sede.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Seleccionando...
                      </>
                    ) : (
                      'Seleccionar Sede'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {sedes.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No hay sedes disponibles
            </h2>
            <p className="text-gray-600">
              Contacta al administrador para que te asigne acceso a una sede.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
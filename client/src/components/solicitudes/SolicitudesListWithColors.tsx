import React from 'react';
import { Badge } from '@/components/ui/badge';
import useSystemColors from '@/hooks/useSystemColors';

// Ejemplo de cómo usar el hook de colores en el componente SolicitudesList
export const SolicitudesListWithColorsExample = () => {
  const {
    getEstadoBadgeClasses,
    getFilaBackgroundColor,
    getAccionColor,
    getTextoColor
  } = useSystemColors();

  // Función para obtener el badge de estado con colores dinámicos
  const getStatusBadge = (estado: string) => {
    const badgeClasses = getEstadoBadgeClasses(estado);
    
    return (
      <Badge className={badgeClasses}>
        {estado.charAt(0).toUpperCase() + estado.slice(1).toLowerCase()}
      </Badge>
    );
  };

  // Función para obtener el color de fondo de la fila
  const getRowBackgroundColor = (estado: string) => {
    return getFilaBackgroundColor(estado);
  };

  // Función para obtener el color del texto del consecutivo
  const getConsecutivoColor = () => {
    return getTextoColor('CONSECUTIVO');
  };

  // Función para obtener el color del nombre del analista
  const getAnalistaColor = () => {
    return getTextoColor('ANALISTA_NOMBRE');
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Ejemplo de uso de colores dinámicos</h3>
      
      {/* Ejemplo de badges de estado */}
      <div className="space-y-2">
        <h4 className="font-medium">Badges de Estado:</h4>
        <div className="flex space-x-2">
          {getStatusBadge('PENDIENTE')}
          {getStatusBadge('ASIGNADO')}
          {getStatusBadge('APROBADA')}
          {getStatusBadge('RECHAZADA')}
        </div>
      </div>

      {/* Ejemplo de colores de fondo */}
      <div className="space-y-2">
        <h4 className="font-medium">Colores de Fondo:</h4>
        <div className="grid grid-cols-2 gap-2">
          <div className={`p-3 rounded ${getRowBackgroundColor('PENDIENTE')}`}>
            Fila Pendiente
          </div>
          <div className={`p-3 rounded ${getRowBackgroundColor('APROBADA')}`}>
            Fila Aprobada
          </div>
        </div>
      </div>

      {/* Ejemplo de colores de texto */}
      <div className="space-y-2">
        <h4 className="font-medium">Colores de Texto:</h4>
        <div className="space-y-1">
          <div className={getConsecutivoColor()}>
            Consecutivo: #123
          </div>
          <div className={getAnalistaColor()}>
            Analista: Juan Pérez
          </div>
        </div>
      </div>
    </div>
  );
};

export default SolicitudesListWithColorsExample;

import { useColors } from '@/contexts/ColorsContext';

export const useSystemColors = () => {
  const { getColor, getColorHex, getColorTailwind } = useColors();

  // Estados de solicitudes
  const getEstadoColor = (estado: string) => {
    const color = getColor('estados', estado);
    return {
      background: color?.color_tailwind || 'bg-gray-300',
      text: color?.color_hex || '#000000',
      tailwind: color?.color_tailwind || 'bg-gray-300 text-gray-900'
    };
  };

  const getFilaBackgroundColor = (estado: string) => {
    const color = getColor('filas', estado);
    return color?.color_tailwind || 'bg-gray-100';
  };

  // Colores de acciones
  const getAccionColor = (accion: string) => {
    const color = getColor('acciones', accion);
    return color?.color_tailwind || 'text-gray-600';
  };

  // Colores de botones
  const getBotonColor = (tipo: string) => {
    const color = getColor('botones', tipo);
    return color?.color_tailwind || 'bg-gray-600 hover:bg-gray-700';
  };

  // Colores de texto
  const getTextoColor = (tipo: string) => {
    const color = getColor('texto', tipo);
    return color?.color_tailwind || 'text-gray-700';
  };

  // Colores de formularios
  const getFormularioColor = (elemento: string) => {
    const color = getColor('formularios', elemento);
    return color?.color_tailwind || 'border-gray-300';
  };

  // Colores de plantillas
  const getPlantillaColor = (elemento: string) => {
    const color = getColor('plantillas', elemento);
    return color?.color_tailwind || 'bg-gray-50';
  };

  // Colores del sistema
  const getSistemaColor = (tipo: string) => {
    const color = getColor('sistema', tipo);
    return color?.color_tailwind || 'bg-gray-600';
  };

  // Colores de navegación
  const getNavegacionColor = (elemento: string) => {
    const color = getColor('navegacion', elemento);
    return color?.color_tailwind || 'bg-white';
  };

  // Colores de tablas
  const getTablaColor = (elemento: string) => {
    const color = getColor('tablas', elemento);
    return color?.color_tailwind || 'bg-gray-50';
  };

  // Función helper para obtener cualquier color
  const getColorByCategory = (categoria: string, elemento: string) => {
    const color = getColor(categoria, elemento);
    return {
      hex: color?.color_hex || '#000000',
      tailwind: color?.color_tailwind || '',
      descripcion: color?.descripcion || ''
    };
  };

  // Función para obtener clases CSS completas
  const getEstadoBadgeClasses = (estado: string) => {
    const color = getColor('estados', estado);
    if (!color) return 'bg-gray-300 text-gray-900 border-gray-500';
    
    // Parsear las clases tailwind para crear un badge completo
    const classes = color.color_tailwind.split(' ');
    const background = classes.find(cls => cls.startsWith('bg-')) || 'bg-gray-300';
    const text = classes.find(cls => cls.startsWith('text-')) || 'text-gray-900';
    const border = classes.find(cls => cls.startsWith('border-')) || 'border-gray-500';
    
    return `${background} ${text} ${border}`;
  };

  // Función para obtener estilos inline
  const getEstadoStyles = (estado: string) => {
    const color = getColor('estados', estado);
    return {
      backgroundColor: color?.color_hex || '#D1D5DB',
      color: color?.color_hex ? getContrastColor(color.color_hex) : '#000000'
    };
  };

  // Función para calcular contraste
  const getContrastColor = (hexColor: string): string => {
    const rgb = hexToRgb(hexColor);
    if (!rgb) return '#000000';
    
    const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  };

  // Función helper para convertir hex a RGB
  const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  // Función helper para calcular luminosidad
  const getLuminance = (r: number, g: number, b: number): number => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  return {
    // Estados
    getEstadoColor,
    getFilaBackgroundColor,
    getEstadoBadgeClasses,
    getEstadoStyles,
    
    // Acciones
    getAccionColor,
    
    // Botones
    getBotonColor,
    
    // Texto
    getTextoColor,
    
    // Formularios
    getFormularioColor,
    
    // Plantillas
    getPlantillaColor,
    
    // Sistema
    getSistemaColor,
    
    // Navegación
    getNavegacionColor,
    
    // Tablas
    getTablaColor,
    
    // General
    getColorByCategory,
    getContrastColor
  };
};

export default useSystemColors;


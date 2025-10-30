import { supabase } from '@/services/supabaseClient';

export interface ColorConfig {
  id: number;
  categoria: string;
  elemento: string;
  color_hex: string;
  color_tailwind: string;
  descripcion: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
  created_by?: number;
  empresa_id?: number;
}

export interface ColorCategory {
  nombre: string;
  descripcion: string;
  elementos: ColorConfig[];
}

export const coloresService = {
  // Obtener todos los colores
  getAll: async (): Promise<ColorConfig[]> => {
    try {
      const { data, error } = await supabase
        .from('gen_colores')
        .select('id, categoria, elemento, color_hex, color_tailwind, descripcion, activo, created_at, updated_at, created_by, empresa_id')
        .eq('activo', true)
        .order('categoria', { ascending: true })
        .order('elemento', { ascending: true });

      if (error) {
        console.error('Error fetching colores:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in coloresService.getAll:', error);
      throw error;
    }
  },

  // Obtener colores por categoría
  getByCategory: async (categoria: string): Promise<ColorConfig[]> => {
    try {
      const { data, error } = await supabase
        .from('gen_colores')
        .select('id, categoria, elemento, color_hex, color_tailwind, descripcion, activo, created_at, updated_at, created_by, empresa_id')
        .eq('categoria', categoria)
        .eq('activo', true)
        .order('elemento', { ascending: true });

      if (error) {
        console.error('Error fetching colores by category:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in coloresService.getByCategory:', error);
      throw error;
    }
  },

  // Obtener color específico
  getByElement: async (categoria: string, elemento: string): Promise<ColorConfig | null> => {
    try {
      const { data, error } = await supabase
        .from('gen_colores')
        .select('id, categoria, elemento, color_hex, color_tailwind, descripcion, activo, created_at, updated_at, created_by, empresa_id')
        .eq('categoria', categoria)
        .eq('elemento', elemento)
        .eq('activo', true)
        .single();

      if (error) {
        console.error('Error fetching color by element:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in coloresService.getByElement:', error);
      return null;
    }
  },

  // Obtener colores agrupados por categoría
  getGroupedByCategory: async (): Promise<ColorCategory[]> => {
    try {
      const colores = await coloresService.getAll();
      
      const grouped = colores.reduce((acc: ColorCategory[], color) => {
        const existingCategory = acc.find(cat => cat.nombre === color.categoria);
        
        if (existingCategory) {
          existingCategory.elementos.push(color);
        } else {
          acc.push({
            nombre: color.categoria,
            descripcion: getCategoryDescription(color.categoria),
            elementos: [color]
          });
        }
        
        return acc;
      }, []);

      return grouped;
    } catch (error) {
      console.error('Error in coloresService.getGroupedByCategory:', error);
      throw error;
    }
  },

  // Actualizar color
  update: async (id: number, updates: Partial<ColorConfig>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('gen_colores')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating color:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error in coloresService.update:', error);
      throw error;
    }
  },

  // Crear nuevo color
  create: async (color: Omit<ColorConfig, 'id' | 'created_at' | 'updated_at'>): Promise<ColorConfig> => {
    try {
      const { data, error } = await supabase
        .from('gen_colores')
        .insert([color])
        .select()
        .single();

      if (error) {
        console.error('Error creating color:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in coloresService.create:', error);
      throw error;
    }
  },

  // Eliminar color (desactivar)
  delete: async (id: number): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('gen_colores')
        .update({ activo: false, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('Error deleting color:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error in coloresService.delete:', error);
      throw error;
    }
  },

  // Restaurar color
  restore: async (id: number): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('gen_colores')
        .update({ activo: true, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('Error restoring color:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error in coloresService.restore:', error);
      throw error;
    }
  },

  // Obtener colores inactivos
  getInactive: async (): Promise<ColorConfig[]> => {
    try {
      const { data, error } = await supabase
        .from('gen_colores')
        .select('id, categoria, elemento, color_hex, color_tailwind, descripcion, activo, created_at, updated_at, created_by, empresa_id')
        .eq('activo', false)
        .order('categoria', { ascending: true })
        .order('elemento', { ascending: true });

      if (error) {
        console.error('Error fetching inactive colores:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in coloresService.getInactive:', error);
      throw error;
    }
  },

  // Validar color hexadecimal
  validateHexColor: (color: string): boolean => {
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexRegex.test(color);
  },

  // Convertir hex a RGB
  hexToRgb: (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  },

  // Convertir RGB a hex
  rgbToHex: (r: number, g: number, b: number): string => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  },

  // Obtener contraste de luminosidad
  getContrastRatio: (hex1: string, hex2: string): number => {
    const rgb1 = coloresService.hexToRgb(hex1);
    const rgb2 = coloresService.hexToRgb(hex2);
    
    if (!rgb1 || !rgb2) return 0;
    
    const luminance1 = coloresService.getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const luminance2 = coloresService.getLuminance(rgb2.r, rgb2.g, rgb2.b);
    
    const brightest = Math.max(luminance1, luminance2);
    const darkest = Math.min(luminance1, luminance2);
    
    return (brightest + 0.05) / (darkest + 0.05);
  },

  // Calcular luminosidad relativa
  getLuminance: (r: number, g: number, b: number): number => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }
};

// Función helper para obtener descripción de categoría
function getCategoryDescription(categoria: string): string {
  const descriptions: { [key: string]: string } = {
    'estados': 'Colores para los diferentes estados de las solicitudes',
    'filas': 'Colores de fondo para las filas de las tablas según el estado',
    'acciones': 'Colores para los iconos de las acciones disponibles',
    'botones': 'Colores para los botones de confirmación y acciones',
    'texto': 'Colores para diferentes tipos de texto en la interfaz',
    'formularios': 'Colores para elementos de formularios e inputs',
    'plantillas': 'Colores para las secciones y elementos de plantillas',
    'sistema': 'Colores principales del sistema (primary, secondary, etc.)',
    'navegacion': 'Colores para elementos de navegación y menús',
    'tablas': 'Colores para elementos de tablas y listas'
  };
  
  return descriptions[categoria] || 'Categoría de colores del sistema';
}

export default coloresService;


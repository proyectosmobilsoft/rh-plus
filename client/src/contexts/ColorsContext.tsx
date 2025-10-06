import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { coloresService, ColorConfig } from '@/services/coloresService';

interface ColorsContextType {
  colors: ColorConfig[];
  loading: boolean;
  error: string | null;
  getColor: (categoria: string, elemento: string) => ColorConfig | null;
  getColorHex: (categoria: string, elemento: string) => string;
  getColorTailwind: (categoria: string, elemento: string) => string;
  refreshColors: () => Promise<void>;
}

const ColorsContext = createContext<ColorsContextType | undefined>(undefined);

interface ColorsProviderProps {
  children: ReactNode;
}

function hexToHslTuple(hex: string): { h: number; s: number; l: number } | null {
  // Limpieza
  const clean = hex.replace('#', '');
  if (!(clean.length === 6 || clean.length === 3)) return null;
  const full = clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean;
  const r = parseInt(full.substring(0, 2), 16) / 255;
  const g = parseInt(full.substring(2, 4), 16) / 255;
  const b = parseInt(full.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function applyCssVariables(colors: ColorConfig[]) {
  try {
    const root = document.documentElement;

    // Variables personalizadas por cada color: --color-<categoria>-<elemento>
    for (const c of colors) {
      const cat = (c.categoria || '').toLowerCase().replace(/\s+/g, '-');
      const el = (c.elemento || '').toLowerCase().replace(/\s+/g, '-');
      if (cat && el && c.color_hex) {
        root.style.setProperty(`--color-${cat}-${el}`, c.color_hex);
      }
    }

    // Helpers
    const getHex = (cat: string, el: string) => {
      const found = colors.find(cc => cc.categoria === cat && cc.elemento === el && cc.activo);
      return found?.color_hex || '';
    };
    const setHslVar = (varName: string, hex: string) => {
      if (!hex) return;
      const hsl = hexToHslTuple(hex);
      if (!hsl) return;
      // Tailwind espera "h s% l%" (sin comas)
      root.style.setProperty(varName, `${hsl.h} ${hsl.s}% ${hsl.l}%`);
    };

    // Mapear colores del sistema a las variables shadcn/Tailwind
    setHslVar('--primary', getHex('sistema', 'primary'));
    setHslVar('--primary-foreground', getHex('sistema', 'primary-foreground'));

    setHslVar('--secondary', getHex('sistema', 'secondary'));
    setHslVar('--secondary-foreground', getHex('sistema', 'secondary-foreground'));

    setHslVar('--accent', getHex('sistema', 'accent'));
    setHslVar('--accent-foreground', getHex('sistema', 'accent-foreground'));

    setHslVar('--background', getHex('sistema', 'background'));
    setHslVar('--foreground', getHex('sistema', 'foreground'));

    setHslVar('--muted', getHex('sistema', 'muted'));
    setHslVar('--muted-foreground', getHex('sistema', 'muted-foreground'));

    setHslVar('--destructive', getHex('sistema', 'danger'));
    setHslVar('--destructive-foreground', getHex('sistema', 'danger-foreground'));

    setHslVar('--ring', getHex('sistema', 'primary'));
    setHslVar('--border', getHex('sistema', 'border'));
    setHslVar('--input', getHex('sistema', 'input'));

    // Variables específicas de tablas comunes
    const tableHeader = getHex('tablas', 'header');
    const tableRowAlt = getHex('tablas', 'row-alt');
    if (tableHeader) root.style.setProperty('--table-header', tableHeader);
    if (tableRowAlt) root.style.setProperty('--table-row-alt', tableRowAlt);
  } catch (e) {
    // noop en SSR o ambientes sin document
  }
}

export const ColorsProvider: React.FC<ColorsProviderProps> = ({ children }) => {
  const [colors, setColors] = useState<ColorConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadColors = async () => {
    try {
      setLoading(true);
      setError(null);
      const colorsData = await coloresService.getAll();
      setColors(colorsData);
      applyCssVariables(colorsData);
    } catch (err) {
      console.error('Error loading colors:', err);
      setError('Error al cargar la configuración de colores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadColors();
  }, []);

  const getColor = (categoria: string, elemento: string): ColorConfig | null => {
    return colors.find(
      color => color.categoria === categoria && color.elemento === elemento && color.activo
    ) || null;
  };

  const getColorHex = (categoria: string, elemento: string): string => {
    const color = getColor(categoria, elemento);
    return color?.color_hex || '#000000';
  };

  const getColorTailwind = (categoria: string, elemento: string): string => {
    const color = getColor(categoria, elemento);
    return color?.color_tailwind || '';
  };

  const refreshColors = async () => {
    await loadColors();
  };

  const value: ColorsContextType = {
    colors,
    loading,
    error,
    getColor,
    getColorHex,
    getColorTailwind,
    refreshColors
  };

  return (
    <ColorsContext.Provider value={value}>
      {children}
    </ColorsContext.Provider>
  );
};

export const useColors = (): ColorsContextType => {
  const context = useContext(ColorsContext);
  if (context === undefined) {
    throw new Error('useColors must be used within a ColorsProvider');
  }
  return context;
};

export default ColorsContext;


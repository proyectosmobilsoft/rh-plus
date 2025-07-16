import React, { createContext, useContext, useState, useEffect } from 'react';

export interface ColorTheme {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  primaryHsl: string;
  secondaryHsl: string;
  accentHsl: string;
}

export const themes: ColorTheme[] = [
  {
    id: 'zeus',
    name: 'ZEUS Original',
    primary: '#c1d009',
    secondary: '#1fb5ca',
    accent: '#9d9d9d',
    primaryHsl: '69, 89%, 43%',
    secondaryHsl: '187, 72%, 45%',
    accentHsl: '0, 0%, 62%'
  },
  {
    id: 'ocean',
    name: 'Ocean Blue',
    primary: '#0ea5e9',
    secondary: '#06b6d4',
    accent: '#64748b',
    primaryHsl: '199, 89%, 48%',
    secondaryHsl: '188, 96%, 43%',
    accentHsl: '215, 16%, 47%'
  },
  {
    id: 'forest',
    name: 'Forest Green',
    primary: '#10b981',
    secondary: '#059669',
    accent: '#6b7280',
    primaryHsl: '160, 84%, 39%',
    secondaryHsl: '158, 100%, 30%',
    accentHsl: '220, 9%, 46%'
  },
  {
    id: 'sunset',
    name: 'Sunset Orange',
    primary: '#f97316',
    secondary: '#ea580c',
    accent: '#78716c',
    primaryHsl: '21, 95%, 52%',
    secondaryHsl: '17, 88%, 48%',
    accentHsl: '28, 6%, 46%'
  },
  {
    id: 'royal',
    name: 'Royal Purple',
    primary: '#8b5cf6',
    secondary: '#7c3aed',
    accent: '#71717a',
    primaryHsl: '262, 88%, 66%',
    secondaryHsl: '262, 83%, 58%',
    accentHsl: '240, 5%, 46%'
  },
  {
    id: 'crimson',
    name: 'Crimson Red',
    primary: '#dc2626',
    secondary: '#b91c1c',
    accent: '#6b7280',
    primaryHsl: '0, 74%, 51%',
    secondaryHsl: '0, 73%, 42%',
    accentHsl: '220, 9%, 46%'
  }
];

interface ThemeContextType {
  currentTheme: ColorTheme;
  setTheme: (themeId: string) => void;
  themes: ColorTheme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<ColorTheme>(themes[0]);

  useEffect(() => {
    // Cargar tema desde localStorage al inicializar
    const savedThemeId = localStorage.getItem('zeus-theme');
    if (savedThemeId) {
      const savedTheme = themes.find(t => t.id === savedThemeId);
      if (savedTheme) {
        setCurrentTheme(savedTheme);
      }
    }
  }, []);

  useEffect(() => {
    // Aplicar variables CSS cuando cambie el tema
    const root = document.documentElement;
    
    // Aplicar colores principales
    root.style.setProperty('--brand-primary', currentTheme.primary);
    root.style.setProperty('--brand-secondary', currentTheme.secondary);
    root.style.setProperty('--brand-accent', currentTheme.accent);
    
    // Aplicar valores HSL para Tailwind
    root.style.setProperty('--brand-lime', currentTheme.primaryHsl);
    root.style.setProperty('--brand-turquoise', currentTheme.secondaryHsl);
    root.style.setProperty('--brand-gray', currentTheme.accentHsl);
    
    // Agregar clase de transición suave
    root.classList.add('theme-transition');
    
    // Remover clase de transición después de la animación
    setTimeout(() => {
      root.classList.remove('theme-transition');
    }, 300);
    
  }, [currentTheme]);

  const setTheme = (themeId: string) => {
    const theme = themes.find(t => t.id === themeId);
    if (theme) {
      setCurrentTheme(theme);
      localStorage.setItem('zeus-theme', themeId);
    }
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
};
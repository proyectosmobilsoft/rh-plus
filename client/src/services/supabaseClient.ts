import { createClient } from '@supabase/supabase-js';

// Valores por defecto para Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Solo usar variables de entorno si están disponibles (en el navegador)
let finalSupabaseUrl = supabaseUrl;
let finalSupabaseAnonKey = supabaseAnonKey;

if (typeof window !== 'undefined' && import.meta.env) {
  finalSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || supabaseUrl;
  finalSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || supabaseAnonKey;
}

export const supabase = createClient(finalSupabaseUrl, finalSupabaseAnonKey, {
  db: {
    schema: 'public',
  },
  global: {
    fetch: async (url, options = {}) => {
      // Crear un AbortController con timeout extendido (120 segundos)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 segundos
      
      try {
        const response = await fetch(url, {
          ...options,
          signal: options.signal || controller.signal,
        });
        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    },
  },
}); 


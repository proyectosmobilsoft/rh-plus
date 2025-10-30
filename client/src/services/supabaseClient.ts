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

export const supabase = createClient(finalSupabaseUrl, finalSupabaseAnonKey); 


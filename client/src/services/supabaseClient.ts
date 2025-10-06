import { createClient } from '@supabase/supabase-js';

// Valores por defecto para Supabase
const supabaseUrl = 'https://clffvmueangquavnaokd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsZmZ2bXVlYW5ncXVhdm5hb2tkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NTgzMTcsImV4cCI6MjA2OTAzNDMxN30.NyUOwOMmJgpWqz5FRSV52EELCaEMkrHTLWd5JDw3ZiU';

// Solo usar variables de entorno si están disponibles (en el navegador)
let finalSupabaseUrl = supabaseUrl;
let finalSupabaseAnonKey = supabaseAnonKey;

if (typeof window !== 'undefined' && import.meta.env) {
  finalSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || supabaseUrl;
  finalSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || supabaseAnonKey;
}

export const supabase = createClient(finalSupabaseUrl, finalSupabaseAnonKey); 


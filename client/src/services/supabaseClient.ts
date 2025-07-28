import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://clffvmueangquavnaokd.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsZmZ2bXVlYW5ncXVhdm5hb2tkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NTgzMTcsImV4cCI6MjA2OTAzNDMxN30.NyUOwOMmJgpWqz5FRSV52EELCaEMkrHTLWd5JDw3ZiU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 
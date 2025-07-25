import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://clffvmueangquavnaokd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsZmZ2bXVlYW5ncXVhdm5hb2tkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NTgzMTcsImV4cCI6MjA2OTAzNDMxN30.NyUOwOMmJgpWqz5FRSV52EELCaEMkrHTLWd5JDw3ZiU'
); 
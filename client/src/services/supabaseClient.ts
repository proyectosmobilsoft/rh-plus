import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vlmeifyldcgfmhppynir.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsbWVpZnlsZGNnZm1ocHB5bmlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0ODQwNDUsImV4cCI6MjA2OTA2MDA0NX0.8MtUi9I_evcJYvB3tXGCKsXDpUX7V13T_DDfBbRvvu8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 
import { createClient } from '@supabase/supabase-js';

// AthleticOS public client configuration for the Expo app.
const supabaseUrl = 'https://zblfnvxnexdplxmtojkx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpibGZudnhuZXhkcGx4bXRvamt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwOTE5MjgsImV4cCI6MjA5MDY2NzkyOH0.4gIQ4_sIPNOrw6nelqoOcSBa92d3M0E1sp-kA4MBDXo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

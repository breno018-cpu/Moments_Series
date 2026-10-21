import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://pzgqgznbesvxkbnmsjeu.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = 
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6Z3Fnem5iZXN2eGtibm1zamV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2Njc5NTAsImV4cCI6MjA5ODI0Mzk1MH0.damXqHbWGXThuR-2T5wP-k5Qi5LVZqWrbH_oiIiczT4";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

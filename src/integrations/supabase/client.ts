import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const LOVABLE_SUPABASE_URL = "https://lmaotaqkaczqfkpsxxbw.supabase.co";
const LOVABLE_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtYW90YXFrYWN6cWZrcHN4eGJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMTcwMzUsImV4cCI6MjA4ODU5MzAzNX0.KW8YWWcjDLLcMwaFYBdkjJFwjoTkyqdV8J6ONS_yTvk";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || LOVABLE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || LOVABLE_SUPABASE_ANON_KEY;

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

const getSafeStorage = () => {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    // Ignore SecurityError in restricted mobile WebViews / Safari private mode
  }
  return undefined;
};

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: getSafeStorage(),
    persistSession: true,
    autoRefreshToken: true,
  }
});
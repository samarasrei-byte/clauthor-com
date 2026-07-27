import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL) {
  document.body.innerHTML = "<h1>ERRO: VITE_SUPABASE_URL está vazia</h1>";
  throw new Error("VITE_SUPABASE_URL está vazia");
}

if (!SUPABASE_PUBLISHABLE_KEY) {
  document.body.innerHTML = "<h1>ERRO: VITE_SUPABASE_PUBLISHABLE_KEY está vazia</h1>";
  throw new Error("VITE_SUPABASE_PUBLISHABLE_KEY está vazia");
}

// Teste temporário
console.log("SUPABASE_URL:", SUPABASE_URL);
console.log("SUPABASE_KEY:", SUPABASE_PUBLISHABLE_KEY);

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

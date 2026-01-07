import { createClient } from '@supabase/supabase-js';

// Obter variáveis de ambiente
const VITE_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const VITE_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validações
if (!VITE_SUPABASE_URL) {
  console.error('❌ VITE_SUPABASE_URL não está definida! Configure no arquivo .env ou nas variáveis de ambiente do Vercel.');
}

if (!VITE_SUPABASE_ANON_KEY) {
  console.error('❌ VITE_SUPABASE_ANON_KEY não está definida! Configure no arquivo .env ou nas variáveis de ambiente do Vercel.');
}

if (!VITE_SUPABASE_URL || !VITE_SUPABASE_ANON_KEY) {
  console.warn('⚠️ Cliente Supabase não será inicializado. Configure as variáveis de ambiente necessárias.');
}

// Criar cliente Supabase
export const supabase = createClient(
  VITE_SUPABASE_URL || '',
  VITE_SUPABASE_ANON_KEY || ''
);

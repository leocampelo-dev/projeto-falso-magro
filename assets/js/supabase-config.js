/**
 * supabase-config.js
 *
 * Apenas dados PÚBLICOS do Supabase ficam aqui:
 *   - SUPABASE_URL
 *   - SUPABASE_PUBLISHABLE_KEY (chave "anon"/"publishable" — protegida por RLS)
 *
 * NUNCA coloque aqui:
 *   - service_role key
 *   - qualquer secret
 *   - o código de administrador
 *
 * Troque os valores abaixo pelos do seu projeto Supabase
 * (Dashboard → Project Settings → API).
 */

const SUPABASE_URL = 'https://SEU-PROJETO.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'SUA_CHAVE_ANON_PUBLICA_AQUI';

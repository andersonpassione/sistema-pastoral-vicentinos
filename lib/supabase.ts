import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://butxnienzkijmuphbnwj.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_oQeSNYQFr2j5vGs3h6mMHw_2A2cFmR2';

// A chave secreta (service_role) NUNCA deve ser commitada no código para não ser revogada pelo GitHub/Supabase Scanner.
// Deve vir estritamente de variável de ambiente ou ser rotacionada no painel do Supabase.
export const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || '';

// Se a chave secreta ainda não foi rotacionada ou estiver ausente, usamos a chave public/anon
// que possui políticas RLS ativas para todas as operações da pastoral.
const effectiveAdminKey = SUPABASE_SECRET_KEY && !SUPABASE_SECRET_KEY.startsWith('sb_secret_ACZ46')
  ? SUPABASE_SECRET_KEY
  : SUPABASE_PUBLISHABLE_KEY;

// Cliente para uso no navegador (Client Components)
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Cliente do Servidor (API Routes / Server Actions)
export const supabaseAdmin = createClient(SUPABASE_URL, effectiveAdminKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export const isSupabaseConfigured = () => {
  return Boolean(SUPABASE_URL && (SUPABASE_PUBLISHABLE_KEY || SUPABASE_SECRET_KEY));
};

export const hasValidAdminSecret = () => {
  return Boolean(SUPABASE_SECRET_KEY && !SUPABASE_SECRET_KEY.startsWith('sb_secret_ACZ46'));
};

export async function testSupabaseConnection() {
  const startTime = Date.now();
  try {
    const { error, count } = await supabaseAdmin
      .from('families')
      .select('id', { count: 'exact', head: true });

    if (error) {
      return {
        connected: false,
        latencyMs: Date.now() - startTime,
        error: error.message,
        url: SUPABASE_URL,
      };
    }

    return {
      connected: true,
      latencyMs: Date.now() - startTime,
      totalFamilies: count ?? 0,
      url: SUPABASE_URL,
      hasSecretRoleKey: hasValidAdminSecret(),
    };
  } catch (err: any) {
    return {
      connected: false,
      latencyMs: Date.now() - startTime,
      error: err.message || 'Erro inesperado ao conectar ao Supabase',
      url: SUPABASE_URL,
    };
  }
}

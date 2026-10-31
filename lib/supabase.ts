import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://butxnienzkijmuphbnwj.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_oQeSNYQFr2j5vGs3h6mMHw_2A2cFmR2';
export const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || 'sb_secret_ACZ46pJQddOm0LVnA8ybTQ_A0ppjC_S';

// Cliente para uso no navegador (Client Components)
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Cliente com privilégios administrativos para uso exclusivo no Servidor (API Routes / Server Actions)
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export const isSupabaseConfigured = () => {
  return Boolean(SUPABASE_URL && (SUPABASE_PUBLISHABLE_KEY || SUPABASE_SECRET_KEY));
};

export async function testSupabaseConnection() {
  const startTime = Date.now();
  try {
    const { data, error, count } = await supabaseAdmin
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

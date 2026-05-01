import { createClient as createSupabaseClient } from '@supabase/supabase-js';

function parseBody(raw: unknown) {
  if (raw == null) return {};
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return raw as Record<string, unknown>;
}

async function getDailyCourtesyLimit(supabase: ReturnType<typeof createSupabaseClient>) {
  const { data } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'daily_courtesy_limit')
    .maybeSingle();

  const raw = (data as { value?: { limit?: unknown } } | null)?.value?.limit;
  const limit = Number(raw);
  if (!Number.isFinite(limit) || limit < 0) return 0;
  return Math.floor(limit);
}

export default async function handler(req: any, res: any) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ ok: false, error: 'SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY não configurados' });
    }
    const supabase = createSupabaseClient(supabaseUrl, supabaseKey);

    if (req.method === 'GET') {
      const dailyCourtesyLimit = await getDailyCourtesyLimit(supabase);
      return res.status(200).json({ ok: true, daily_courtesy_limit: dailyCourtesyLimit });
    }

    if (req.method === 'PUT') {
      const body = parseBody(req.body);
      const next = Number(body.daily_courtesy_limit);
      if (!Number.isFinite(next) || next < 0) {
        return res.status(400).json({ ok: false, error: 'daily_courtesy_limit inválido' });
      }

      const normalized = Math.floor(next);
      const { error } = await supabase.from('app_settings').upsert(
        {
          key: 'daily_courtesy_limit',
          value: { limit: normalized },
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      );
      if (error) return res.status(500).json({ ok: false, error: error.message });
      return res.status(200).json({ ok: true, daily_courtesy_limit: normalized });
    }

    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ ok: false, error: 'Método não permitido' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro inesperado';
    return res.status(500).json({ ok: false, error: msg });
  }
}

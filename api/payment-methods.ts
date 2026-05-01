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

export default async function handler(req: any, res: any) {
	try {
		const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
		const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
		if (!supabaseUrl || !supabaseKey) {
			return res.status(500).json({ ok: false, error: 'SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY não configurados' });
		}
		const supabase = createSupabaseClient(supabaseUrl, supabaseKey);
		const urlObj = new URL(req?.url || '/', 'http://localhost');
		const activeOnly = urlObj.searchParams.get('active_only') === '1' || urlObj.searchParams.get('active_only') === 'true';

		if (req.method === 'GET') {
			let q = supabase
				.from('payment_methods')
				.select('id, name, display_order, is_active')
				.order('display_order', { ascending: true })
				.order('name', { ascending: true });
			if (activeOnly) {
				q = q.eq('is_active', true);
			}
			const { data, error } = await q;
			if (error) return res.status(500).json({ ok: false, error: error.message });
			return res.status(200).json({ ok: true, payment_methods: data || [] });
		}

		if (req.method === 'POST') {
			const body = parseBody(req.body);
			const name = String((body.name as string) || '').trim();
			const display_order = typeof body.display_order === 'number' ? body.display_order : Number(body.display_order) || 0;
			const is_active = typeof body.is_active === 'boolean' ? body.is_active : true;
			if (!name) return res.status(400).json({ ok: false, error: 'name é obrigatório' });
			const { data, error } = await supabase
				.from('payment_methods')
				.insert({ name, display_order, is_active })
				.select('id')
				.single();
			if (error) return res.status(500).json({ ok: false, error: error.message });
			return res.status(201).json({ ok: true, id: (data as { id: number }).id });
		}

		if (req.method === 'PUT') {
			const body = parseBody(req.body);
			const id = typeof body.id === 'number' ? body.id : Number(body.id);
			const name = String((body.name as string) || '').trim();
			const display_order = typeof body.display_order === 'number' ? body.display_order : Number(body.display_order) || 0;
			const is_active = typeof body.is_active === 'boolean' ? body.is_active : true;
			if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ ok: false, error: 'id inválido' });
			if (!name) return res.status(400).json({ ok: false, error: 'name é obrigatório' });
			const { error } = await supabase
				.from('payment_methods')
				.update({ name, display_order, is_active, updated_at: new Date().toISOString() })
				.eq('id', id);
			if (error) return res.status(500).json({ ok: false, error: error.message });
			return res.status(200).json({ ok: true });
		}

		if (req.method === 'DELETE') {
			const id = Number(urlObj.searchParams.get('id') || '');
			if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ ok: false, error: 'id é obrigatório' });
			const { error } = await supabase.from('payment_methods').delete().eq('id', id);
			if (error) return res.status(500).json({ ok: false, error: error.message });
			return res.status(200).json({ ok: true });
		}

		res.setHeader('Allow', 'GET, POST, PUT, DELETE');
		return res.status(405).json({ ok: false, error: 'Método não permitido' });
	} catch (err: unknown) {
		const msg = err instanceof Error ? err.message : 'Erro inesperado';
		return res.status(500).json({ ok: false, error: msg });
	}
}

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
	try {
		const supabaseUrl =
			process.env.SUPABASE_URL ||
			process.env.VITE_SUPABASE_URL;
		const supabaseKey =
			process.env.SUPABASE_SERVICE_ROLE_KEY ||
			process.env.VITE_SUPABASE_ANON_KEY;
		if (!supabaseUrl || !supabaseKey) {
			return res.status(500).json({ ok: false, error: 'SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY não configurados' });
		}
		const supabase = createSupabaseClient(supabaseUrl, supabaseKey);

		if (req.method === 'GET') {
			const urlObj = new URL(req?.url || '/', 'http://localhost');
			const serviceId = Number(urlObj.searchParams.get('service_id') || '0');
			if (!serviceId) {
				return res.status(400).json({ ok: false, error: 'service_id é obrigatório' });
			}
			const { data, error } = await supabase
				.from('service_price_variations')
				.select('*')
				.eq('service_id', serviceId)
				.order('display_order', { ascending: true })
				.order('duration_minutes', { ascending: true });
			if (error) return res.status(500).json({ ok: false, error: error.message });
			return res.status(200).json({ ok: true, variations: data || [] });
		}

		if (req.method === 'POST') {
			const raw = req.body ?? {};
			const body = typeof raw === 'string' ? (() => { try { return JSON.parse(raw); } catch { return {}; } })() : raw;
			const { service_id, duration_minutes, price, display_order } = body as {
				service_id?: number;
				duration_minutes?: number;
				price?: number;
				display_order?: number;
			};
			if (!service_id || !duration_minutes || !price) {
				return res.status(400).json({ ok: false, error: 'service_id, duration_minutes e price são obrigatórios' });
			}
			const { data, error } = await supabase
				.from('service_price_variations')
				.insert({
					service_id,
					duration_minutes,
					price,
					display_order: display_order ?? 0,
				})
				.select('*')
				.single();
			if (error) return res.status(500).json({ ok: false, error: error.message });
			return res.status(201).json({ ok: true, variation: data });
		}

		if (req.method === 'PUT') {
			const raw = req.body ?? {};
			const body = typeof raw === 'string' ? (() => { try { return JSON.parse(raw); } catch { return {}; } })() : raw;
			const { id, duration_minutes, price, display_order } = body as {
				id?: number;
				duration_minutes?: number;
				price?: number;
				display_order?: number;
			};
			if (!id || !duration_minutes || !price) {
				return res.status(400).json({ ok: false, error: 'id, duration_minutes e price são obrigatórios' });
			}
			const { error } = await supabase
				.from('service_price_variations')
				.update({
					duration_minutes,
					price,
					display_order: display_order ?? 0,
				})
				.eq('id', id);
			if (error) return res.status(500).json({ ok: false, error: error.message });
			return res.status(200).json({ ok: true });
		}

		if (req.method === 'DELETE') {
			const urlObj = new URL(req?.url || '/', 'http://localhost');
			const id = Number(urlObj.searchParams.get('id') || '0');
			if (!id) return res.status(400).json({ ok: false, error: 'id é obrigatório' });
			const { error } = await supabase.from('service_price_variations').delete().eq('id', id);
			if (error) return res.status(500).json({ ok: false, error: error.message });
			return res.status(200).json({ ok: true });
		}

		res.setHeader('Allow', 'GET, POST, PUT, DELETE');
		return res.status(405).json({ ok: false, error: 'Método não permitido' });
	} catch (err: any) {
		return res.status(500).json({ ok: false, error: err?.message || 'Erro inesperado' });
	}
}


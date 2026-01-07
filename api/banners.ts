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
			const { data, error } = await supabase
				.from('banners')
				.select('*')
				.eq('is_active', true)
				.order('display_order', { ascending: true })
				.order('created_at', { ascending: false });
			if (error) return res.status(500).json({ ok: false, error: error.message });
			return res.status(200).json({ ok: true, banners: data || [] });
		}

		if (req.method === 'POST') {
			const raw = req.body ?? {};
			const body = typeof raw === 'string' ? (() => { try { return JSON.parse(raw); } catch { return {}; } })() : raw;
			const { image_url, title, description, link_url, display_order, is_active } = body as {
				image_url?: string;
				title?: string;
				description?: string;
				link_url?: string;
				display_order?: number;
				is_active?: boolean;
			};
			if (!image_url) {
				return res.status(400).json({ ok: false, error: 'image_url é obrigatório' });
			}
			const { data, error } = await supabase
				.from('banners')
				.insert({
					image_url,
					title: title || null,
					description: description || null,
					link_url: link_url || null,
					display_order: display_order ?? 0,
					is_active: is_active ?? true,
				})
				.select('*')
				.single();
			if (error) return res.status(500).json({ ok: false, error: error.message });
			return res.status(201).json({ ok: true, banner: data });
		}

		if (req.method === 'PUT') {
			const raw = req.body ?? {};
			const body = typeof raw === 'string' ? (() => { try { return JSON.parse(raw); } catch { return {}; } })() : raw;
			const { id, image_url, title, description, link_url, display_order, is_active } = body as {
				id?: number;
				image_url?: string;
				title?: string;
				description?: string;
				link_url?: string;
				display_order?: number;
				is_active?: boolean;
			};
			if (!id || !image_url) {
				return res.status(400).json({ ok: false, error: 'id e image_url são obrigatórios' });
			}
			const { error } = await supabase
				.from('banners')
				.update({
					image_url,
					title: title || null,
					description: description || null,
					link_url: link_url || null,
					display_order: display_order ?? 0,
					is_active: is_active ?? true,
				})
				.eq('id', id);
			if (error) return res.status(500).json({ ok: false, error: error.message });
			return res.status(200).json({ ok: true });
		}

		if (req.method === 'DELETE') {
			const urlObj = new URL(req?.url || '/', 'http://localhost');
			const id = Number(urlObj.searchParams.get('id') || '0');
			if (!id) return res.status(400).json({ ok: false, error: 'id é obrigatório' });
			const { error } = await supabase.from('banners').delete().eq('id', id);
			if (error) return res.status(500).json({ ok: false, error: error.message });
			return res.status(200).json({ ok: true });
		}

		res.setHeader('Allow', 'GET, POST, PUT, DELETE');
		return res.status(405).json({ ok: false, error: 'Método não permitido' });
	} catch (err: any) {
		return res.status(500).json({ ok: false, error: err?.message || 'Erro inesperado' });
	}
}


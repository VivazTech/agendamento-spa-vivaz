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

		const urlObj = new URL(req?.url || '/', 'http://localhost');
		const action = urlObj.searchParams.get('action');

		// Variações de preço: rotas com ?action=variation DEVEM vir antes de GET/POST/PUT genéricos,
		// senão PUT/POST de variação caem no handler de serviço e falham na validação (e GET lista serviços em vez de variações).
		if (action === 'variation') {
			if (req.method === 'GET') {
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
				const body = parseBody(req.body);
				const { service_id, duration_minutes, price, display_order } = body as {
					service_id?: number;
					duration_minutes?: number;
					price?: number;
					display_order?: number;
				};
				if (!service_id || duration_minutes == null || price == null) {
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
				const body = parseBody(req.body);
				const { id, duration_minutes, price, display_order } = body as {
					id?: number;
					duration_minutes?: number;
					price?: number;
					display_order?: number;
				};
				if (!id || duration_minutes == null || price == null) {
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
				const id = Number(urlObj.searchParams.get('id') || '0');
				if (!id) return res.status(400).json({ ok: false, error: 'id é obrigatório' });
				const { error } = await supabase.from('service_price_variations').delete().eq('id', id);
				if (error) return res.status(500).json({ ok: false, error: error.message });
				return res.status(200).json({ ok: true });
			}

			res.setHeader('Allow', 'GET, POST, PUT, DELETE');
			return res.status(405).json({ ok: false, error: 'Método não permitido' });
		}

		if (req.method === 'GET') {
			const { data, error } = await supabase
				.from('services')
				.select(`
          id,
          name,
          price,
          duration_minutes,
          description,
          responsible_professional_id,
          category,
          image_url,
          professionals:responsible_professional_id ( id, name )
        `)
				.order('name', { ascending: true });
			if (error) return res.status(500).json({ ok: false, error: error.message });

			const serviceIds = (data || []).map((s: any) => s.id);
			let variationsMap: Record<number, any[]> = {};

			if (serviceIds.length > 0) {
				const { data: variationsData, error: variationsError } = await supabase
					.from('service_price_variations')
					.select('*')
					.in('service_id', serviceIds)
					.order('display_order', { ascending: true })
					.order('duration_minutes', { ascending: true });

				if (!variationsError && variationsData) {
					variationsData.forEach((v: any) => {
						if (!variationsMap[v.service_id]) {
							variationsMap[v.service_id] = [];
						}
						variationsMap[v.service_id].push({
							id: v.id,
							duration_minutes: Number(v.duration_minutes),
							price: Number(v.price),
							display_order: Number(v.display_order),
						});
					});
				}
			}

			const services = (data || []).map((r: any) => ({
				id: r.id,
				name: r.name,
				price: Number(r.price),
				duration: Number(r.duration_minutes),
				description: r.description || '',
				responsibleProfessionalId: r.responsible_professional_id,
				responsibleProfessionalName: r.professionals?.name || null,
				category: r.category ? Number(r.category) : null,
				image_url: r.image_url || null,
				price_variations: variationsMap[r.id] || [],
			}));
			return res.status(200).json({ ok: true, services });
		}

		if (req.method === 'POST') {
			const body = parseBody(req.body);
			const { name, price, duration, description, responsibleProfessionalId, category, image_url } = body as {
				name?: string;
				price?: number;
				duration?: number;
				description?: string;
				responsibleProfessionalId?: string | null;
				category?: number | null;
				image_url?: string | null;
			};
			if (!name || !price || !duration || !category) {
				return res.status(400).json({ ok: false, error: 'name, price, duration e category são obrigatórios' });
			}
			const { data, error } = await supabase
				.from('services')
				.insert({
					name,
					price,
					duration_minutes: duration,
					description: description || '',
					responsible_professional_id: responsibleProfessionalId ?? null,
					category: category,
					image_url: image_url || null,
				})
				.select('id')
				.single();
			if (error) return res.status(500).json({ ok: false, error: error.message });
			return res.status(201).json({ ok: true, id: data?.id });
		}

		if (req.method === 'PUT') {
			const body = parseBody(req.body);
			const { id, name, price, duration, description, responsibleProfessionalId, category, image_url } = body as {
				id?: number;
				name?: string;
				price?: number;
				duration?: number;
				description?: string;
				responsibleProfessionalId?: string | null;
				category?: number | null;
				image_url?: string | null;
			};
			if (!id || !name || !price || !duration || !category) {
				return res.status(400).json({ ok: false, error: 'id, name, price, duration e category são obrigatórios' });
			}
			const { error } = await supabase
				.from('services')
				.update({
					name,
					price,
					duration_minutes: duration,
					description: description || '',
					responsible_professional_id: responsibleProfessionalId ?? null,
					category: category,
					image_url: image_url || null,
				})
				.eq('id', id);
			if (error) return res.status(500).json({ ok: false, error: error.message });
			return res.status(200).json({ ok: true });
		}

		if (req.method === 'DELETE') {
			const id = Number(urlObj.searchParams.get('id') || '0');
			if (!id) return res.status(400).json({ ok: false, error: 'id é obrigatório' });
			const { error } = await supabase.from('services').delete().eq('id', id);
			if (error) return res.status(500).json({ ok: false, error: error.message });
			return res.status(200).json({ ok: true });
		}

		res.setHeader('Allow', 'GET, POST, PUT, DELETE');
		return res.status(405).json({ ok: false, error: 'Método não permitido' });
	} catch (err: any) {
		return res.status(500).json({ ok: false, error: err?.message || 'Erro inesperado' });
	}
}

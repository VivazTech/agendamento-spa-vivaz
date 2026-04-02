import { createClient as createSupabaseClient } from '@supabase/supabase-js';

type SupabaseAdmin = ReturnType<typeof createSupabaseClient>;

async function syncServiceProfessionals(supabase: SupabaseAdmin, serviceId: number, professionalIds: string[]) {
	const ids = [...new Set(professionalIds.map((x) => String(x)).filter(Boolean))];
	const { error: delErr } = await supabase.from('service_professionals').delete().eq('service_id', serviceId);
	if (delErr) throw new Error(delErr.message);
	if (ids.length === 0) return;
	const rows = ids.map((professional_id) => ({ service_id: serviceId, professional_id }));
	const { error: insErr } = await supabase.from('service_professionals').insert(rows);
	if (insErr) throw new Error(insErr.message);
}

function professionalFieldsFromRow(r: Record<string, unknown>) {
	const links = (r.service_professionals as Array<Record<string, unknown>> | null) || [];
	let serviceProfessionals = links
		.map((l) => {
			const prof = l.professionals as { id?: string; name?: string } | null | undefined;
			const id = prof?.id ?? l.professional_id;
			if (!id) return null;
			return { id: String(id), name: prof?.name || '' };
		})
		.filter(Boolean) as Array<{ id: string; name: string }>;
	if (serviceProfessionals.length === 0 && r.responsible_professional_id) {
		const legacy = r.professionals as { id?: string; name?: string } | null | undefined;
		if (legacy?.id) {
			serviceProfessionals = [{ id: String(legacy.id), name: legacy.name || '' }];
		} else {
			serviceProfessionals = [{ id: String(r.responsible_professional_id), name: '' }];
		}
	}
	const names = serviceProfessionals.map((p) => p.name).filter(Boolean);
	return {
		responsibleProfessionalId: serviceProfessionals[0]?.id ?? null,
		responsibleProfessionalName: names.length ? names.join(', ') : null,
		serviceProfessionals,
	};
}

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
				const { service_id, duration_minutes, price, display_order, variation_kind, label } = body as {
					service_id?: number;
					duration_minutes?: number;
					price?: number;
					display_order?: number;
					variation_kind?: string;
					label?: string | null;
				};
				if (!service_id || duration_minutes == null || price == null) {
					return res.status(400).json({ ok: false, error: 'service_id, duration_minutes e price são obrigatórios' });
				}
				const vKind = variation_kind === 'service_type' ? 'service_type' : 'duration';
				const labelTrim = vKind === 'service_type' ? String(label || '').trim() : '';
				if (vKind === 'service_type' && !labelTrim) {
					return res.status(400).json({ ok: false, error: 'label é obrigatório para variação por tipo de serviço' });
				}
				const { data, error } = await supabase
					.from('service_price_variations')
					.insert({
						service_id,
						duration_minutes,
						price,
						display_order: display_order ?? 0,
						variation_kind: vKind,
						label: vKind === 'service_type' ? labelTrim : null,
					})
					.select('*')
					.single();
				if (error) return res.status(500).json({ ok: false, error: error.message });
				return res.status(201).json({ ok: true, variation: data });
			}

			if (req.method === 'PUT') {
				const body = parseBody(req.body);
				const { id, duration_minutes, price, display_order, variation_kind, label } = body as {
					id?: number;
					duration_minutes?: number;
					price?: number;
					display_order?: number;
					variation_kind?: string;
					label?: string | null;
				};
				if (!id || duration_minutes == null || price == null) {
					return res.status(400).json({ ok: false, error: 'id, duration_minutes e price são obrigatórios' });
				}
				const vKind = variation_kind === 'service_type' ? 'service_type' : 'duration';
				const labelTrim = vKind === 'service_type' ? String(label || '').trim() : '';
				if (vKind === 'service_type' && !labelTrim) {
					return res.status(400).json({ ok: false, error: 'label é obrigatório para variação por tipo de serviço' });
				}
				const { error } = await supabase
					.from('service_price_variations')
					.update({
						duration_minutes,
						price,
						display_order: display_order ?? 0,
						variation_kind: vKind,
						label: vKind === 'service_type' ? labelTrim : null,
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
          variation_mode,
          professionals:responsible_professional_id ( id, name ),
          service_professionals (
            professional_id,
            professionals ( id, name )
          )
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
							variation_kind: v.variation_kind === 'service_type' ? 'service_type' : 'duration',
							label: v.label ?? null,
						});
					});
				}
			}

			const services = (data || []).map((r: any) => {
				const vars = variationsMap[r.id] || [];
				let variationMode = (r.variation_mode as string) || 'fixed';
				if ((!variationMode || variationMode === 'fixed') && vars.length > 0) {
					variationMode = vars.some((x: any) => x.variation_kind === 'service_type') ? 'service_type' : 'duration';
				}
				const pro = professionalFieldsFromRow(r as Record<string, unknown>);
				return {
					id: r.id,
					name: r.name,
					price: Number(r.price),
					duration: Number(r.duration_minutes),
					description: r.description || '',
					responsibleProfessionalId: pro.responsibleProfessionalId,
					responsibleProfessionalName: pro.responsibleProfessionalName,
					serviceProfessionals: pro.serviceProfessionals,
					category: r.category ? Number(r.category) : null,
					image_url: r.image_url || null,
					variation_mode: variationMode,
					price_variations: vars,
				};
			});
			return res.status(200).json({ ok: true, services });
		}

		if (req.method === 'POST') {
			const body = parseBody(req.body);
			const {
				name,
				price,
				duration,
				description,
				responsibleProfessionalId,
				professional_ids,
				category,
				image_url,
				variation_mode,
			} = body as {
				name?: string;
				price?: number;
				duration?: number;
				description?: string;
				responsibleProfessionalId?: string | null;
				professional_ids?: unknown;
				category?: number | null;
				image_url?: string | null;
				variation_mode?: string | null;
			};
			if (!name || !price || !duration || !category) {
				return res.status(400).json({ ok: false, error: 'name, price, duration e category são obrigatórios' });
			}
			const profIds =
				Array.isArray(professional_ids) && professional_ids.length
					? professional_ids.map((x) => String(x)).filter(Boolean)
					: responsibleProfessionalId
						? [String(responsibleProfessionalId)]
						: [];
			const firstPro = profIds[0] ?? null;
			const vMode =
				variation_mode === 'duration' || variation_mode === 'service_type' ? variation_mode : 'fixed';
			const { data, error } = await supabase
				.from('services')
				.insert({
					name,
					price,
					duration_minutes: duration,
					description: description || '',
					responsible_professional_id: firstPro,
					category: category,
					image_url: image_url || null,
					variation_mode: vMode,
				})
				.select('id')
				.single();
			if (error) return res.status(500).json({ ok: false, error: error.message });
			const newId = data?.id as number;
			try {
				await syncServiceProfessionals(supabase, newId, profIds);
			} catch (e: unknown) {
				const msg = e instanceof Error ? e.message : String(e);
				return res.status(500).json({ ok: false, error: msg });
			}
			return res.status(201).json({ ok: true, id: newId });
		}

		if (req.method === 'PUT') {
			const body = parseBody(req.body);
			const {
				id,
				name,
				price,
				duration,
				description,
				responsibleProfessionalId,
				professional_ids,
				category,
				image_url,
				variation_mode,
			} = body as {
				id?: number;
				name?: string;
				price?: number;
				duration?: number;
				description?: string;
				responsibleProfessionalId?: string | null;
				professional_ids?: unknown;
				category?: number | null;
				image_url?: string | null;
				variation_mode?: string | null;
			};
			if (!id || !name || !price || !duration || !category) {
				return res.status(400).json({ ok: false, error: 'id, name, price, duration e category são obrigatórios' });
			}
			let profIdsToSync: string[] | undefined;
			if (Array.isArray(professional_ids)) {
				profIdsToSync = professional_ids.map((x) => String(x)).filter(Boolean);
			} else if (responsibleProfessionalId !== undefined) {
				profIdsToSync = responsibleProfessionalId ? [String(responsibleProfessionalId)] : [];
			}
			const firstPro =
				profIdsToSync !== undefined ? profIdsToSync[0] ?? null : undefined;
			const vMode =
				variation_mode === 'duration' || variation_mode === 'service_type' ? variation_mode : 'fixed';
			const updateRow: Record<string, unknown> = {
				name,
				price,
				duration_minutes: duration,
				description: description || '',
				category: category,
				image_url: image_url || null,
				variation_mode: vMode,
			};
			if (firstPro !== undefined) {
				updateRow.responsible_professional_id = firstPro;
			}
			const { error } = await supabase.from('services').update(updateRow).eq('id', id);
			if (error) return res.status(500).json({ ok: false, error: error.message });
			if (profIdsToSync !== undefined) {
				try {
					await syncServiceProfessionals(supabase, id, profIdsToSync);
				} catch (e: unknown) {
					const msg = e instanceof Error ? e.message : String(e);
					return res.status(500).json({ ok: false, error: msg });
				}
			}
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

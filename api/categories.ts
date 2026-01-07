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
			const { include_inactive } = req.query;
			let query = supabase
				.from('categories')
				.select('*');
			
			// Se não for admin (não passar include_inactive), mostrar apenas ativas
			if (!include_inactive) {
				query = query.eq('is_active', true);
			}
			
			const { data, error } = await query
				.order('display_order', { ascending: true })
				.order('name', { ascending: true });
			
			if (error) return res.status(500).json({ ok: false, error: error.message });
			return res.status(200).json({ ok: true, categories: data || [] });
		}

		if (req.method === 'POST') {
			const raw = req.body ?? {};
			const body = typeof raw === 'string' ? (() => { try { return JSON.parse(raw); } catch { return {}; } })() : raw;
			const { name, icon, display_order } = body as {
				name?: string; icon?: string; display_order?: number;
			};
			if (!name) {
				return res.status(400).json({ ok: false, error: 'name é obrigatório' });
			}
			const { data, error } = await supabase
				.from('categories')
				.insert({
					name,
					icon: icon || null,
					display_order: display_order || 0,
					is_active: true,
				})
				.select('*')
				.single();
			if (error) return res.status(500).json({ ok: false, error: error.message });
			return res.status(201).json({ ok: true, category: data });
		}

		if (req.method === 'PUT') {
			const raw = req.body ?? {};
			const body = typeof raw === 'string' ? (() => { try { return JSON.parse(raw); } catch { return {}; } })() : raw;
			const { id, name, icon, display_order, is_active } = body as {
				id?: number; name?: string; icon?: string; display_order?: number; is_active?: boolean;
			};
			if (!id || !name) {
				return res.status(400).json({ ok: false, error: 'id e name são obrigatórios' });
			}
			const { data, error } = await supabase
				.from('categories')
				.update({
					name,
					icon: icon || null,
					display_order: display_order ?? 0,
					is_active: is_active !== undefined ? is_active : true,
				})
				.eq('id', id)
				.select('*')
				.single();
			if (error) return res.status(500).json({ ok: false, error: error.message });
			return res.status(200).json({ ok: true, category: data });
		}

		if (req.method === 'DELETE') {
			const { id } = req.query;
			if (!id) {
				return res.status(400).json({ ok: false, error: 'id é obrigatório' });
			}
			
			// Verificar se há serviços usando esta categoria
			const { data: services, error: servicesError } = await supabase
				.from('services')
				.select('id, name')
				.eq('category', id)
				.limit(1);
			
			if (servicesError) {
				return res.status(500).json({ ok: false, error: servicesError.message });
			}
			
			if (services && services.length > 0) {
				return res.status(400).json({ 
					ok: false, 
					error: `Não é possível excluir esta categoria. Existem ${services.length} serviço(s) associado(s) a ela.` 
				});
			}
			
			// Desativar ao invés de excluir (soft delete)
			const { error } = await supabase
				.from('categories')
				.update({ is_active: false })
				.eq('id', id);
			
			if (error) return res.status(500).json({ ok: false, error: error.message });
			return res.status(200).json({ ok: true });
		}

		return res.status(405).json({ ok: false, error: 'Método não permitido' });
	} catch (err: any) {
		console.error('[CATEGORIES API] Erro:', err);
		return res.status(500).json({ ok: false, error: err?.message || 'Erro interno' });
	}
}


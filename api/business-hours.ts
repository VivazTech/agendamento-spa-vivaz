import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
	res.setHeader('Content-Type', 'application/json');

	try {
		const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
		const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

		if (!supabaseUrl || !supabaseKey) {
			return res.status(500).json({
				ok: false,
				error: 'SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY não configurados',
			});
		}

		const supabase = createClient(supabaseUrl, supabaseKey);

		// GET - Listar horários
		if (req.method === 'GET') {
			const { data, error } = await supabase
				.from('business_hours')
				.select('*')
				.order('day_of_week', { ascending: true })
				.order('period', { ascending: true });

			if (error) {
				return res.status(500).json({ ok: false, error: error.message });
			}

			return res.status(200).json({ ok: true, hours: data || [] });
		}

		// PUT - Atualizar horário
		if (req.method === 'PUT') {
			const raw = req.body ?? {};
			const parsed = typeof raw === 'string' ? (() => { try { return JSON.parse(raw); } catch { return {}; } })() : raw;
			const body = (parsed || {}) as {
				id?: string;
				day_of_week: number;
				period: string;
				is_active: boolean;
				start_time: string;
				end_time: string;
			};

			if (body.day_of_week === undefined || !body.period) {
				return res.status(400).json({
					ok: false,
					error: 'day_of_week e period são obrigatórios',
				});
			}

			// Validar horários
			if (body.start_time >= body.end_time) {
				return res.status(400).json({
					ok: false,
					error: 'Horário de início deve ser menor que horário final',
				});
			}

			// Se tem ID, atualizar; senão, inserir (upsert)
			const { data, error } = await supabase
				.from('business_hours')
				.upsert({
					id: body.id,
					day_of_week: body.day_of_week,
					period: body.period,
					is_active: body.is_active,
					start_time: body.start_time,
					end_time: body.end_time,
					updated_at: new Date().toISOString(),
				}, {
					onConflict: 'day_of_week,period',
				})
				.select()
				.single();

			if (error) {
				return res.status(500).json({ ok: false, error: error.message });
			}

			return res.status(200).json({ ok: true, hour: data });
		}

		res.setHeader('Allow', 'GET, PUT');
		return res.status(405).json({ ok: false, error: 'Método não permitido' });
	} catch (err: any) {
		console.error('[BUSINESS-HOURS] Erro:', err);
		return res.status(500).json({
			ok: false,
			error: err?.message || 'Erro inesperado',
		});
	}
}


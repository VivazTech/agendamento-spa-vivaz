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

async function syncExtraWorkerServices(
	supabase: any,
	extraWorkerId: string,
	serviceIds: number[]
) {
	const ids = [...new Set(serviceIds.map((n) => Number(n)).filter((x) => Number.isFinite(x) && x > 0))];
	const { error: delErr } = await supabase.from('extra_worker_services').delete().eq('extra_worker_id', extraWorkerId);
	if (delErr) throw new Error(delErr.message);
	if (ids.length === 0) return;
	const rows = ids.map((service_id) => ({ extra_worker_id: extraWorkerId, service_id }));
	const { error: insErr } = await supabase.from('extra_worker_services').insert(rows);
	if (insErr) throw new Error(insErr.message);
}

function normalizeTime(t: string): string {
	const s = String(t || '').trim();
	if (!s) return '';
	if (s.length === 5) return `${s}:00`;
	return s.length >= 8 ? s.slice(0, 8) : s;
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
			const { data, error } = await supabase
				.from('extra_workers')
				.select(
					`
          id,
          full_name,
          work_time_from,
          work_time_to,
          working_today,
          created_at,
          updated_at,
          extra_worker_services ( service_id )
        `
				)
				.order('full_name', { ascending: true });
			if (error) return res.status(500).json({ ok: false, error: error.message });
			const rows = (data || []).map((row: Record<string, unknown>) => {
				const links = (row.extra_worker_services as Array<{ service_id?: number }> | null) || [];
				const service_ids = links.map((l) => l.service_id).filter((x): x is number => x != null);
				return {
					id: row.id,
					full_name: row.full_name,
					work_time_from: String(row.work_time_from || '').slice(0, 5),
					work_time_to: String(row.work_time_to || '').slice(0, 5),
					working_today: Boolean(row.working_today),
					created_at: row.created_at,
					updated_at: row.updated_at,
					service_ids,
				};
			});
			return res.status(200).json({ ok: true, extra_workers: rows });
		}

		if (req.method === 'POST') {
			const body = parseBody(req.body);
			const { full_name, work_time_from, work_time_to, working_today, service_ids } = body as {
				full_name?: string;
				work_time_from?: string;
				work_time_to?: string;
				working_today?: boolean;
				service_ids?: unknown;
			};
			const name = String(full_name || '').trim();
			const tFrom = normalizeTime(String(work_time_from || ''));
			const tTo = normalizeTime(String(work_time_to || ''));
			if (!name) return res.status(400).json({ ok: false, error: 'full_name é obrigatório' });
			if (!tFrom || !tTo) return res.status(400).json({ ok: false, error: 'work_time_from e work_time_to são obrigatórios' });
			const ids = Array.isArray(service_ids) ? service_ids.map((x) => Number(x)).filter((x) => Number.isFinite(x) && x > 0) : [];
			if (ids.length === 0) return res.status(400).json({ ok: false, error: 'Selecione ao menos um serviço' });

			const { data: inserted, error: insErr } = await supabase
				.from('extra_workers')
				.insert({
					full_name: name,
					work_time_from: tFrom,
					work_time_to: tTo,
					working_today: typeof working_today === 'boolean' ? working_today : false,
				})
				.select('id')
				.single();
			if (insErr) return res.status(500).json({ ok: false, error: insErr.message });
			const id = (inserted as { id: string }).id;
			try {
				await syncExtraWorkerServices(supabase, id, ids);
			} catch (e: unknown) {
				await supabase.from('extra_workers').delete().eq('id', id);
				const msg = e instanceof Error ? e.message : String(e);
				return res.status(500).json({ ok: false, error: msg });
			}
			return res.status(201).json({ ok: true, id });
		}

		if (req.method === 'PUT') {
			const body = parseBody(req.body);
			const { id, full_name, work_time_from, work_time_to, working_today, service_ids } = body as {
				id?: string;
				full_name?: string;
				work_time_from?: string;
				work_time_to?: string;
				working_today?: boolean;
				service_ids?: unknown;
			};
			if (!id) return res.status(400).json({ ok: false, error: 'id é obrigatório' });
			const name = String(full_name || '').trim();
			const tFrom = normalizeTime(String(work_time_from || ''));
			const tTo = normalizeTime(String(work_time_to || ''));
			if (!name) return res.status(400).json({ ok: false, error: 'full_name é obrigatório' });
			if (!tFrom || !tTo) return res.status(400).json({ ok: false, error: 'work_time_from e work_time_to são obrigatórios' });
			const ids = Array.isArray(service_ids) ? service_ids.map((x) => Number(x)).filter((x) => Number.isFinite(x) && x > 0) : [];
			if (ids.length === 0) return res.status(400).json({ ok: false, error: 'Selecione ao menos um serviço' });

			const { error: upErr } = await supabase
				.from('extra_workers')
				.update({
					full_name: name,
					work_time_from: tFrom,
					work_time_to: tTo,
					working_today: typeof working_today === 'boolean' ? working_today : false,
					updated_at: new Date().toISOString(),
				})
				.eq('id', id);
			if (upErr) return res.status(500).json({ ok: false, error: upErr.message });
			try {
				await syncExtraWorkerServices(supabase, id, ids);
			} catch (e: unknown) {
				const msg = e instanceof Error ? e.message : String(e);
				return res.status(500).json({ ok: false, error: msg });
			}
			return res.status(200).json({ ok: true });
		}

		if (req.method === 'DELETE') {
			const urlObj = new URL(req?.url || '/', 'http://localhost');
			const id = urlObj.searchParams.get('id');
			if (!id) return res.status(400).json({ ok: false, error: 'id é obrigatório' });
			const { error } = await supabase.from('extra_workers').delete().eq('id', id);
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

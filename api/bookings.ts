// Tipos afrouxados para evitar dependência de @vercel/node em build local
import crypto from 'crypto';
import { Client } from 'pg';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

type SupabaseServer = any;

function professionalSetForServiceRow(r: Record<string, unknown>): Set<string> {
	const links = (r.service_professionals as Array<{ professional_id?: string }> | null) || [];
	const fromJunction = links.map((x) => x.professional_id).filter(Boolean).map(String);
	if (fromJunction.length) return new Set(fromJunction);
	const leg = r.responsible_professional_id;
	if (leg) return new Set([String(leg)]);
	return new Set();
}

function timeToMinutes(value: string): number {
	const [h, m] = value.slice(0, 5).split(':').map(Number);
	return h * 60 + m;
}

async function upsertClientByPhone(
	supabase: SupabaseServer,
	clientPayload: {
		name?: string;
		email?: string;
		phone?: string;
		notes?: string | null;
		room_number?: string | null;
	}
): Promise<string> {
	const clientEmail =
		clientPayload.email || `whatsapp_${String(clientPayload.phone || '').replace(/\D/g, '')}@temp.local`;
	let clientId: string | null = null;
	const { data: existingClient } = await (supabase as any)
		.from('clients')
		.select('id')
		.eq('phone', clientPayload.phone)
		.limit(1)
		.maybeSingle();
	if (existingClient?.id) {
		clientId = existingClient.id as unknown as string;
		await supabase
			.from('clients')
			.update({
				name: clientPayload.name,
				phone: clientPayload.phone,
				email: clientEmail,
				notes: clientPayload.notes ?? null,
				room_number: clientPayload.room_number ?? null,
				updated_at: new Date().toISOString(),
			})
			.eq('id', clientId);
	} else {
		const { data: insertedClient, error: insClientErr } = await supabase
			.from('clients')
			.insert({
				name: clientPayload.name,
				phone: clientPayload.phone,
				email: clientEmail,
				notes: clientPayload.notes ?? null,
				room_number: clientPayload.room_number ?? null,
			})
			.select('id')
			.single();
		if (insClientErr) {
			throw new Error(insClientErr.message);
		}
		clientId = (insertedClient as { id: string }).id;
	}
	return clientId as string;
}

async function assertProfessionalCanServeServices(
	supabase: SupabaseServer,
	professionalId: string,
	serviceIds: number[]
): Promise<string | null> {
	if (!professionalId || !serviceIds.length) {
		return 'Cada horário do grupo precisa de profissional e ao menos um serviço.';
	}
	const { data: foundServices, error: svcErr } = await supabase
		.from('services')
		.select(
			`
      id,
      responsible_professional_id,
      service_professionals ( professional_id )
    `
		)
		.in('id', serviceIds);
	if (svcErr) return svcErr.message;
	const foundIds = new Set<number>((foundServices || []).map((r) => Number((r as { id: unknown }).id)));
	const missing = serviceIds.filter((id) => !foundIds.has(Number(id)));
	if (missing.length) {
		return `IDs de serviços inexistentes: ${missing.join(', ')}`;
	}
	for (const row of foundServices || []) {
		const set = professionalSetForServiceRow(row as Record<string, unknown>);
		if (set.size > 0 && !set.has(professionalId)) {
			return `O profissional não está habilitado para o serviço #${(row as { id: number }).id}.`;
		}
	}
	const { data: prof, error: profErr } = await supabase.from('professionals').select('id').eq('id', professionalId).limit(1).single();
	if (profErr || !prof) {
		return `Profissional não encontrado: ${professionalId}`;
	}
	return null;
}

async function validateActivePaymentMethodId(
	supabase: SupabaseServer,
	paymentMethodId: unknown
): Promise<{ ok: true; id: number | null } | { ok: false; error: string }> {
	if (paymentMethodId == null || paymentMethodId === '') {
		return { ok: true, id: null };
	}
	const id = Number(paymentMethodId);
	if (!Number.isFinite(id) || id <= 0) {
		return { ok: false, error: 'Forma de pagamento inválida.' };
	}
	const { data, error } = await supabase
		.from('payment_methods')
		.select('id')
		.eq('id', id)
		.eq('is_active', true)
		.maybeSingle();
	if (error) return { ok: false, error: error.message };
	if (!data) return { ok: false, error: 'Forma de pagamento não encontrada ou inativa.' };
	return { ok: true, id };
}

async function getDailyCourtesyLimit(supabase: SupabaseServer): Promise<number> {
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

async function getCourtesyBookingsCountForDay(supabase: SupabaseServer, date: string): Promise<number> {
	const { count } = await supabase
		.from('bookings')
		.select('id', { count: 'exact', head: true })
		.eq('date', date)
		.eq('is_courtesy', true)
		.in('status', ['pending', 'scheduled', 'completed']);
	return typeof count === 'number' ? count : 0;
}

async function getClient() {
	// Tentar várias variáveis de ambiente para connection string PostgreSQL
	const databaseUrl = 
		process.env.DATABASE_URL ||
		process.env.POSTGRES_URL ||
		process.env.POSTGRES_PRISMA_URL ||
		process.env.POSTGRES_URL_NON_POOLING;

	if (!databaseUrl) {
		throw new Error('DATABASE_URL ou POSTGRES_URL não configuradas. Configure uma dessas variáveis no Vercel (Settings → Environment Variables).');
	}

	// Desabilitar verificação de certificado SSL para evitar erro "self-signed certificate"
	// eslint-disable-next-line no-process-env
	process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

	const client = new Client({
		connectionString: databaseUrl,
		ssl: { 
			rejectUnauthorized: false 
		},
	});
	await client.connect();
	return client;
}

export default async function handler(req: any, res: any) {
	if (req.method === 'GET') {
		try {
			// Criar cliente Supabase com credenciais de servidor
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

			// Ler query string com fallback seguro
			const urlObj = new URL(req?.url || '/', 'http://localhost');
			const professionalId = urlObj.searchParams.get('professional_id') || undefined;
			const serviceId = urlObj.searchParams.get('service_id') || undefined;
			const clientQuery = urlObj.searchParams.get('client') || undefined;
			const time = urlObj.searchParams.get('time') || undefined;            // HH:MM
			const timeFrom = urlObj.searchParams.get('time_from') || undefined;   // HH:MM
			const timeTo = urlObj.searchParams.get('time_to') || undefined;       // HH:MM
			const from = urlObj.searchParams.get('from') || undefined;            // yyyy-mm-dd (opcional)
			const to = urlObj.searchParams.get('to') || undefined;                // yyyy-mm-dd (opcional)
			const courtesyOnlyRaw = urlObj.searchParams.get('courtesy_only');
			const courtesyOnly =
				courtesyOnlyRaw === '1' ||
				String(courtesyOnlyRaw || '').toLowerCase() === 'true';

			// Montar query base
			let query = supabase
				.from('bookings')
				.select(`
          id,
          date,
          time,
          professional_id,
          status,
          rejection_reason,
          is_courtesy,
          booking_group_id,
          client_requests_group,
          payment_method_id,
          payment_methods ( id, name ),
          professionals:professional_id ( id, name ),
          clients:client_id ( id, name, phone, email, room_number ),
          booking_services (
            quantity,
            services:service_id ( id, name, price, duration_minutes )
          ),
          reschedule_requests (
            id,
            requested_date,
            requested_time,
            original_date,
            original_time,
            status,
            requested_by,
            response_message,
            created_at,
            responded_at
          )
        `)
				.order('date', { ascending: true })
				.order('time', { ascending: true });

			if (professionalId) {
				query = query.eq('professional_id', professionalId);
			}
			if (from) {
				query = query.gte('date', from);
			}
			if (to) {
				query = query.lte('date', to);
			}
			if (courtesyOnly) {
				query = query.eq('is_courtesy', true);
			}
			if (time) {
				query = query.eq('time', `${time}:00`);
			} else {
				if (timeFrom) query = query.gte('time', `${timeFrom}:00`);
				if (timeTo) query = query.lte('time', `${timeTo}:00`);
			}

			const { data, error } = await query;
			if (error) {
				return res.status(500).json({ ok: false, error: error.message });
			}

			// Mapear e aplicar filtros de serviço/cliente no app
			const rows = (data || []).map((b: any) => {
				const services = (b.booking_services || []).map((bs: any) => ({
					id: bs?.services?.id,
					name: bs?.services?.name,
					price: bs?.services?.price,
					duration_minutes: bs?.services?.duration_minutes,
					quantity: bs?.quantity ?? 1,
				})).filter((s: any) => s.id != null);

				const total_price = services.reduce((sum: number, s: any) => sum + Number(s.price || 0) * Number(s.quantity || 1), 0);
				const total_duration_minutes = services.reduce((sum: number, s: any) => sum + Number(s.duration_minutes || 0) * Number(s.quantity || 1), 0);

				// Buscar solicitação pendente mais recente
				const rescheduleRequests = (b.reschedule_requests || []) as any[];
				const pendingRequest = rescheduleRequests.find((r: any) => r.status === 'pending');
				const latestRequest = rescheduleRequests.length > 0 
					? rescheduleRequests.sort((a: any, b: any) => 
						new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
					)[0]
					: null;

				const mapReq = (r: Record<string, unknown> | undefined) =>
					r
						? {
								id: r.id as string,
								requested_date: r.requested_date as string,
								requested_time: String(r.requested_time),
								original_date: r.original_date as string,
								original_time: String(r.original_time),
								status: r.status as string,
								requested_by: (r.requested_by as string) || 'client',
								response_message: r.response_message,
								created_at: r.created_at as string,
								responded_at: r.responded_at as string | null,
							}
						: null;

				const pendingMapped = pendingRequest ? mapReq(pendingRequest as Record<string, unknown>) : null;
				const latestMapped = latestRequest ? mapReq(latestRequest as Record<string, unknown>) : null;

				return {
					booking_id: b.id,
					date: b.date,
					time: b.time,
					professional_id: b.professional_id,
					professional_name: (b.professionals as { name?: string } | null)?.name ?? null,
					status: b.status || 'pending', // Default para 'pending' se não tiver status
					is_courtesy: Boolean((b as { is_courtesy?: unknown }).is_courtesy),
					rejection_reason: (b as { rejection_reason?: string | null }).rejection_reason ?? null,
					booking_group_id: b.booking_group_id ?? null,
					client_requests_group: Boolean(b.client_requests_group),
					payment_method_id: b.payment_method_id ?? null,
					payment_method_name:
						(b.payment_methods as { name?: string } | null | undefined)?.name ??
						(Array.isArray(b.payment_methods) && b.payment_methods[0]
							? (b.payment_methods[0] as { name?: string }).name
							: null) ??
						null,
					client_id: b.clients?.id,
					client_name: b.clients?.name,
					client_phone: b.clients?.phone,
					client_email: b.clients?.email,
					client_room_number: b.clients?.room_number || null,
					total_price: total_price.toFixed(2),
					total_duration_minutes,
					services,
					reschedule_request: pendingMapped || latestMapped,
				};
			});

      const filtered = rows.filter((r: any) => {
				if (serviceId && !(r.services || []).some((s: any) => String(s.id) === String(serviceId))) {
					return false;
				}
				if (clientQuery) {
          const q = clientQuery.toLowerCase();
          const hay = `${r.client_name || ''} ${r.client_email || ''} ${r.client_phone || ''}`.toLowerCase();
          // Busca textual
          let match = hay.includes(q);
          // Busca por telefone normalizado (apenas dígitos)
          const qDigits = q.replace(/\D/g, '');
          if (!match && qDigits) {
            const hayDigits = String(r.client_phone || '').replace(/\D/g, '');
            match = hayDigits.includes(qDigits);
          }
          if (!match) return false;
				}
				return true;
			});

			return res.status(200).json({ ok: true, bookings: filtered });
		} catch (err: any) {
			return res.status(500).json({ ok: false, error: err?.message || 'Erro inesperado' });
		}
	}

	if (req.method === 'POST') {
		try {
			const raw = (req.body ?? {}) as unknown;
			const parsed = typeof raw === 'string' ? (() => { try { return JSON.parse(raw); } catch { return {}; } })() : raw;
			const action = String((parsed as Record<string, unknown>).action || '').trim();

			const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
			const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

			if (!supabaseUrl || !supabaseKey) {
				return res.status(500).json({
					ok: false,
					code: 'SUPABASE_ENV_MISSING',
					error: 'SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY não configurados',
				});
			}

			const supabase = createSupabaseClient(supabaseUrl, supabaseKey);

			/** Apenas painel admin: vários horários / profissionais / serviços, mesmo cliente */
			if (action === 'admin_group_booking') {
				const gb = (parsed || {}) as {
					client?: {
						name?: string;
						email?: string;
						phone?: string;
						notes?: string | null;
						room_number?: string | null;
					};
					payment_method_id?: number | null;
					slots?: Array<{
						date?: string;
						time?: string;
						professional_id?: string | null;
						services?: Array<{ id?: number; quantity?: number }>;
					}>;
				};
				const clientPayload = gb.client || {};
				const slots = Array.isArray(gb.slots) ? gb.slots : [];
				if (!clientPayload.name || !clientPayload.phone) {
					return res.status(400).json({ ok: false, error: 'client.name e client.phone são obrigatórios' });
				}
				if (!slots.length) {
					return res.status(400).json({ ok: false, error: 'Informe ao menos um horário no grupo' });
				}

				for (let i = 0; i < slots.length; i++) {
					const slot = slots[i];
					if (!slot.date || !slot.time) {
						return res.status(400).json({ ok: false, error: `Horário ${i + 1}: data e hora são obrigatórios` });
					}
					const pid = slot.professional_id ? String(slot.professional_id) : '';
					if (!pid) {
						return res.status(400).json({ ok: false, error: `Horário ${i + 1}: profissional é obrigatório` });
					}
					const svcs = (slot.services || []).filter((s) => s && s.id != null);
					if (!svcs.length) {
						return res.status(400).json({ ok: false, error: `Horário ${i + 1}: selecione ao menos um serviço` });
					}
					const svcIds = svcs.map((s) => Number(s.id));
					const errMsg = await assertProfessionalCanServeServices(supabase, pid, svcIds);
					if (errMsg) {
						return res.status(400).json({ ok: false, error: `Horário ${i + 1}: ${errMsg}` });
					}
				}

				let clientId: string;
				try {
					clientId = await upsertClientByPhone(supabase, {
						name: clientPayload.name,
						phone: clientPayload.phone,
						email: clientPayload.email,
						notes: clientPayload.notes ?? null,
						room_number: clientPayload.room_number ?? null,
					});
				} catch (e: unknown) {
					const m = e instanceof Error ? e.message : String(e);
					return res.status(500).json({ ok: false, error: m });
				}

				let adminGroupPaymentId: number | null = null;
				const { count: activePayModes } = await supabase
					.from('payment_methods')
					.select('id', { count: 'exact', head: true })
					.eq('is_active', true);
				const mustPickPay = typeof activePayModes === 'number' && activePayModes > 0;
				if (mustPickPay) {
					const grpPay = validateActivePaymentMethodId(supabase, gb.payment_method_id);
			const awaited = await grpPay;
			if (awaited.ok === false) {
						return res.status(400).json({ ok: false, error: awaited.error });
					}
					if (awaited.id == null) {
						return res.status(400).json({ ok: false, error: 'Selecione a forma de pagamento para este grupo.' });
					}
					adminGroupPaymentId = awaited.id;
				} else if (gb.payment_method_id != null) {
					const awaited = await validateActivePaymentMethodId(supabase, gb.payment_method_id);
					if (awaited.ok === false) {
						return res.status(400).json({ ok: false, error: awaited.error });
					}
					adminGroupPaymentId = awaited.id;
				}

				const bookingGroupId = crypto.randomUUID();
				const createdIds: string[] = [];

				try {
					for (let i = 0; i < slots.length; i++) {
						const slot = slots[i];
						const date = slot.date as string;
						const timeRaw = slot.time as string;
						const time = timeRaw.length === 5 ? `${timeRaw}:00` : timeRaw;
						const professionalId = String(slot.professional_id);
						const svcs = (slot.services || []).filter((s) => s && s.id != null);
						const { data: bookingData, error: bookingErr } = await supabase
							.from('bookings')
							.insert({
								date,
								time,
								professional_id: professionalId,
								client_id: clientId,
								status: 'scheduled',
								booking_group_id: bookingGroupId,
								client_requests_group: false,
								payment_method_id: adminGroupPaymentId,
							})
							.select('id')
							.single();
						if (bookingErr || !bookingData) {
							throw new Error(bookingErr?.message || 'Falha ao criar agendamento');
						}
						const bookingId = (bookingData as { id: string }).id;
						createdIds.push(bookingId);
						const rows = svcs.map((s) => ({
							booking_id: bookingId,
							service_id: Number(s.id),
							quantity: s.quantity ?? 1,
						}));
						const { error: bsErr } = await supabase.from('booking_services').insert(rows);
						if (bsErr) {
							throw new Error(bsErr.message);
						}
					}
				} catch (err: unknown) {
					for (const bid of createdIds) {
						await supabase.from('bookings').delete().eq('id', bid);
					}
					const m = err instanceof Error ? err.message : String(err);
					return res.status(500).json({ ok: false, error: m });
				}

				return res.status(201).json({
					ok: true,
					booking_group_id: bookingGroupId,
					booking_ids: createdIds,
					count: createdIds.length,
				});
			}

			const body = (parsed || {}) as {
				date?: string;
				time?: string;
				professional_id?: string | null;
				client?: { name?: string; email?: string; phone?: string; notes?: string | null; room_number?: string | null };
				services?: Array<{ id: number; quantity?: number }>;
				client_requests_group?: boolean;
				payment_method_id?: number | null;
				is_courtesy?: boolean;
			};

			const date = body.date;
			const timeRaw = body.time;
			const professionalId = body.professional_id ?? null;
			const clientPayload = body.client || {};
			const services = body.services || [];
			const clientRequestsGroup = Boolean(body.client_requests_group);
			const isCourtesy = Boolean(body.is_courtesy);

			if (!date || !timeRaw) {
				return res.status(400).json({ ok: false, error: 'date e time são obrigatórios' });
			}
			if (!clientPayload.name || !clientPayload.phone) {
				return res.status(400).json({ ok: false, error: 'client.name e client.phone são obrigatórios' });
			}
			if (!services.length) {
				return res.status(400).json({ ok: false, error: 'services não pode ser vazio' });
			}

			const time = timeRaw.length === 5 ? `${timeRaw}:00` : timeRaw;
			if (isCourtesy) {
				const dailyCourtesyLimit = await getDailyCourtesyLimit(supabase);
				if (dailyCourtesyLimit > 0) {
					const courtesyCount = await getCourtesyBookingsCountForDay(supabase, date);
					if (courtesyCount >= dailyCourtesyLimit) {
						return res.status(400).json({
							ok: false,
							code: 'COURTESY_DAILY_LIMIT_REACHED',
							error: `Limite diário de cortesias atingido para ${date}. Selecione outro dia.`,
							details: { date, daily_limit: dailyCourtesyLimit, current: courtesyCount },
						});
					}
				}
			}

			// validar profissional (se informado)
			if (professionalId) {
				const { data: prof, error: profErr } = await supabase
					.from('professionals')
					.select('id')
					.eq('id', professionalId)
					.limit(1)
					.single();
				if (profErr || !prof) {
					return res.status(400).json({
						ok: false,
						code: 'PROFESSIONAL_NOT_FOUND',
						error: `Profissional não encontrado: ${professionalId}`,
					});
				}
			}

			// validar serviços e coletar profissional responsável por serviço (quando existir)
			const serviceIds = services.map(s => s.id);
			let inferredProfessionalId: string | null = null;
			if (serviceIds.length) {
				const { data: foundServices, error: svcErr } = await supabase
					.from('services')
					.select(
						`
            id,
            simultaneous_professionals_required,
            responsible_professional_id,
            service_professionals ( professional_id )
          `
					)
					.in('id', serviceIds);
				if (svcErr) {
					return res.status(500).json({ ok: false, error: svcErr.message });
				}
				const foundIds = new Set<number>((foundServices || []).map(r => Number(r.id)));
				const missing = serviceIds.filter(id => !foundIds.has(Number(id)));
				if (missing.length) {
					return res.status(400).json({
						ok: false,
						code: 'SERVICES_NOT_FOUND',
						error: `IDs de serviços inexistentes: ${missing.join(', ')}`,
						details: { sent: serviceIds, found: Array.from(foundIds) }
					});
				}
				const insufficientTeams = (foundServices || []).filter((r) => {
					const required = Number((r as { simultaneous_professionals_required?: number }).simultaneous_professionals_required) === 2 ? 2 : 1;
					const available = professionalSetForServiceRow(r as Record<string, unknown>).size;
					return available > 0 && available < required;
				});
				if (insufficientTeams.length) {
					const ids = insufficientTeams.map((r) => (r as { id: number }).id).join(', ');
					return res.status(400).json({
						ok: false,
						code: 'SERVICE_TEAM_INSUFFICIENT',
						error: `Serviço(s) exigem 2 profissionais simultâneos, mas não há equipe suficiente: ${ids}.`,
					});
				}

				const constrainedSets = (foundServices || [])
					.map((r) => professionalSetForServiceRow(r as Record<string, unknown>))
					.filter((s) => s.size > 0);
				const needsTwoSimultaneous = (foundServices || []).some(
					(r) => Number((r as { simultaneous_professionals_required?: number }).simultaneous_professionals_required) === 2
				);

				const intersect = (sets: Set<string>[]): Set<string> => {
					if (sets.length === 0) return new Set();
					let acc = new Set(sets[0]);
					for (let i = 1; i < sets.length; i++) {
						acc = new Set([...acc].filter((x) => sets[i].has(x)));
					}
					return acc;
				};

				if (!professionalId) {
					if (needsTwoSimultaneous) {
						inferredProfessionalId = null;
					} else
					if (constrainedSets.length === 0) {
						inferredProfessionalId = null;
					} else if (constrainedSets.length === 1) {
						const only = constrainedSets[0];
						inferredProfessionalId = only.size === 1 ? [...only][0] : null;
					} else {
						const inter = intersect(constrainedSets);
						if (inter.size === 1) {
							inferredProfessionalId = [...inter][0];
						} else if (inter.size === 0) {
							return res.status(400).json({
								ok: false,
								code: 'SERVICES_NO_COMMON_PROFESSIONAL',
								error:
									'Não há profissional em comum entre os serviços escolhidos. Ajuste a seleção ou informe o profissional no agendamento.',
								details: { serviceIds },
							});
						} else {
							return res.status(400).json({
								ok: false,
								code: 'SERVICES_WITH_DIFFERENT_PROFESSIONALS',
								error:
									'Vários profissionais podem atender esta combinação de serviços. Escolha um profissional.',
								details: { serviceIds },
							});
						}
					}
				}

				const singleProfessionalIds = new Set<string>();
				(foundServices || []).forEach((row) => {
					const set = professionalSetForServiceRow(row as Record<string, unknown>);
					if (set.size === 1) {
						singleProfessionalIds.add([...set][0]);
					}
				});
				if (singleProfessionalIds.size > 0) {
					const { data: professionalsWithBreak, error: breakErr } = await supabase
						.from('professionals')
						.select('id, name, break_start_time, break_end_time')
						.in('id', Array.from(singleProfessionalIds));
					if (breakErr) {
						return res.status(500).json({ ok: false, error: breakErr.message });
					}
					const bookingMinutes = timeToMinutes(time);
					const blockedByBreak = (professionalsWithBreak || []).filter((p: any) => {
						if (!p.break_start_time || !p.break_end_time) return false;
						const start = timeToMinutes(String(p.break_start_time));
						const end = timeToMinutes(String(p.break_end_time));
						return bookingMinutes >= start && bookingMinutes < end;
					});
					if (blockedByBreak.length > 0) {
						const names = blockedByBreak.map((p: any) => p.name).filter(Boolean).join(', ');
						return res.status(400).json({
							ok: false,
							code: 'PROFESSIONAL_BREAK_TIME',
							error: `Há profissional em intervalo neste horário (${names || 'sem nome'}). Selecione outro horário.`,
						});
					}
				}
			}

			const { count: clientActivePayments } = await supabase
				.from('payment_methods')
				.select('id', { count: 'exact', head: true })
				.eq('is_active', true);
			const requireClientPayment =
				typeof clientActivePayments === 'number' && clientActivePayments > 0;

			let resolvedPaymentMethodId: number | null = null;
			if (requireClientPayment) {
				const payCheck = await validateActivePaymentMethodId(supabase, body.payment_method_id);
				if (payCheck.ok === false) {
					return res.status(400).json({ ok: false, error: payCheck.error });
				}
				if (payCheck.id == null) {
					return res.status(400).json({ ok: false, error: 'Selecione uma forma de pagamento.' });
				}
				resolvedPaymentMethodId = payCheck.id;
			} else if (body.payment_method_id != null) {
				const payCheck = await validateActivePaymentMethodId(supabase, body.payment_method_id);
				if (payCheck.ok === false) {
					return res.status(400).json({ ok: false, error: payCheck.error });
				}
				resolvedPaymentMethodId = payCheck.id;
			}

			let clientId: string;
			try {
				clientId = await upsertClientByPhone(supabase, {
					name: clientPayload.name,
					phone: clientPayload.phone,
					email: clientPayload.email,
					notes: clientPayload.notes ?? null,
					room_number: clientPayload.room_number ?? null,
				});
			} catch (e: unknown) {
				const m = e instanceof Error ? e.message : String(e);
				return res.status(500).json({ ok: false, error: m });
			}

			// criar booking
			const { data: bookingData, error: bookingErr } = await supabase
				.from('bookings')
				.insert({
					date,
					time,
					professional_id: professionalId || inferredProfessionalId,
					client_id: clientId,
					status: 'pending',
					client_requests_group: clientRequestsGroup,
					payment_method_id: resolvedPaymentMethodId,
					is_courtesy: isCourtesy,
				})
				.select('id')
				.single();
			if (bookingErr) {
				return res.status(500).json({ ok: false, error: bookingErr.message });
			}
			const bookingId = (bookingData as any).id as string;

			// inserir serviços
			const rows = services.map(s => ({
				booking_id: bookingId,
				service_id: s.id,
				quantity: s.quantity ?? 1,
			}));
			if (rows.length) {
				const { error: bsErr } = await supabase
					.from('booking_services')
					.insert(rows);
				if (bsErr) {
					return res.status(500).json({ ok: false, error: bsErr.message });
				}
			}

			return res.status(201).json({ ok: true, booking_id: bookingId });
		} catch (err: any) {
			return res.status(500).json({
				ok: false,
				error: err?.message || 'Erro inesperado',
			});
		}
	}

	if (req.method === 'PUT') {
		try {
			const raw = req.body ?? {};
			const parsed = typeof raw === 'string' ? (() => { try { return JSON.parse(raw); } catch { return {}; } })() : raw;
			const body = (parsed || {}) as {
				booking_id?: string;
				status?: string; // 'scheduled', 'completed', 'cancelled', etc.
				send_whatsapp?: boolean; // Se deve enviar WhatsApp (padrão: false)
				rejection_reason?: string | null;
			};

			const bookingId = body.booking_id;
			const status = body.status;

			if (!bookingId) {
				return res.status(400).json({ ok: false, error: 'booking_id é obrigatório' });
			}
			if (!status) {
				return res.status(400).json({ ok: false, error: 'status é obrigatório' });
			}
			const rejectionReason = String(body.rejection_reason || '').trim();
			if (status === 'rejected' && !rejectionReason) {
				return res.status(400).json({ ok: false, error: 'Informe o motivo da recusa.' });
			}

			const supabaseUrl =
				process.env.SUPABASE_URL ||
				process.env.VITE_SUPABASE_URL;
			const supabaseKey =
				process.env.SUPABASE_SERVICE_ROLE_KEY ||
				process.env.VITE_SUPABASE_ANON_KEY;
			if (!supabaseUrl || !supabaseKey) {
				return res.status(500).json({
					ok: false,
					error: 'SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY não configurados',
				});
			}

			const supabase = createSupabaseClient(supabaseUrl, supabaseKey);

			// Buscar dados completos do agendamento
			const { data: bookingData, error: bookingErr } = await supabase
				.from('bookings')
				.select(`
					id,
					date,
					time,
					professional_id,
					clients:client_id ( id, name, phone, email, room_number ),
					professionals:professional_id ( id, name, phone, email ),
					booking_services (
						quantity,
						services:service_id ( id, name, price, duration_minutes )
					)
				`)
				.eq('id', bookingId)
				.single();

			if (bookingErr || !bookingData) {
				return res.status(404).json({ ok: false, error: 'Agendamento não encontrado' });
			}

			// Atualizar status do agendamento
			const updateData: any = {
				status: status,
				updated_at: new Date().toISOString(),
			};
			if (status === 'rejected') {
				updateData.rejection_reason = rejectionReason;
			} else if (status !== 'rejected') {
				updateData.rejection_reason = null;
			}

			// Se o status for 'completed', adicionar timestamp de conclusão
			if (status === 'completed') {
				updateData.completed_at = new Date().toISOString();
			}
			// Se o status for 'cancelled', adicionar timestamp de cancelamento (se a coluna existir)
			if (status === 'cancelled') {
				updateData.cancelled_at = new Date().toISOString();
			}

			const { error: updateErr } = await supabase
				.from('bookings')
				.update(updateData)
				.eq('id', bookingId);

			if (updateErr) {
				return res.status(500).json({ ok: false, error: updateErr.message });
			}

			// Enviar mensagens via WhatsApp apenas se solicitado explicitamente
			const shouldSendWhatsApp = body.send_whatsapp === true;
			if (status === 'completed' && shouldSendWhatsApp) {
				try {
					const { sendWhatsAppMessage, formatCompletionMessage, formatProfessionalMessage } = await import('../server/whatsapp');

					const client = bookingData.clients as any;
					const professional = bookingData.professionals as any;
					const services = ((bookingData.booking_services || []) as any[]).map((bs: any) => ({
						name: bs?.services?.name || '',
						price: Number(bs?.services?.price || 0) * Number(bs?.quantity || 1),
					}));

					const totalPrice = services.reduce((sum, s) => sum + s.price, 0);

					// Enviar mensagem para o cliente
					if (client?.phone) {
						const clientMessage = formatCompletionMessage(
							client.name || 'Cliente',
							professional?.name || 'Profissional',
							bookingData.date,
							bookingData.time?.slice(0, 5) || '',
							services,
							totalPrice
						);

						const clientResult = await sendWhatsAppMessage({
							to: client.phone,
							message: clientMessage,
						});

						if (!clientResult.success) {
							console.error('Erro ao enviar WhatsApp para cliente:', clientResult.error);
						}
					}

					// Enviar mensagem para o profissional
					if (professional?.phone) {
						const professionalMessage = formatProfessionalMessage(
							client?.name || 'Cliente',
							bookingData.date,
							bookingData.time?.slice(0, 5) || '',
							services,
							totalPrice
						);

						const profResult = await sendWhatsAppMessage({
							to: professional.phone,
							message: professionalMessage,
						});

						if (!profResult.success) {
							console.error('Erro ao enviar WhatsApp para profissional:', profResult.error);
						}
					}
				} catch (whatsappErr: any) {
					// Não falhar a requisição se o WhatsApp falhar, apenas logar
					console.error('Erro ao enviar mensagens WhatsApp:', whatsappErr?.message);
				}
			}

			return res.status(200).json({ ok: true, message: 'Status atualizado com sucesso' });
		} catch (err: any) {
			return res.status(500).json({
				ok: false,
				error: err?.message || 'Erro inesperado',
			});
		}
	}

	if (req.method === 'PATCH') {
		try {
			const raw = req.body ?? {};
			const parsed = typeof raw === 'string' ? (() => { try { return JSON.parse(raw); } catch { return {}; } })() : raw;
			const body = (parsed || {}) as {
				action?: string;
				booking_id?: string;
				date?: string; // yyyy-mm-dd
				time?: string; // HH:MM or HH:MM:SS
				request_id?: string; // ID da solicitação de reagendamento
				response?: 'accept' | 'reject'; // Resposta à solicitação
				response_message?: string; // Mensagem opcional ao rejeitar
				responded_by?: string; // ID do admin que respondeu (opcional)
			};

			const action = (body.action || '').toLowerCase();
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

			// Criar solicitação de reagendamento
			if (action === 'reschedule') {
				const bookingId = body.booking_id;
				const date = body.date;
				const timeRaw = body.time;

				if (!bookingId) {
					return res.status(400).json({ ok: false, error: 'booking_id é obrigatório' });
				}
				if (!date || !timeRaw) {
					return res.status(400).json({ ok: false, error: 'date e time são obrigatórios' });
				}

				// Buscar dados do agendamento atual
				const { data: bookingData, error: bookingErr } = await supabase
					.from('bookings')
					.select('id, date, time')
					.eq('id', bookingId)
					.single();

				if (bookingErr || !bookingData) {
					return res.status(404).json({ ok: false, error: 'Agendamento não encontrado' });
				}

				const time = timeRaw.length === 5 ? `${timeRaw}:00` : timeRaw;

				// Verificar se já existe uma solicitação pendente para este agendamento
				const { data: existingRequest } = await supabase
					.from('reschedule_requests')
					.select('id')
					.eq('booking_id', bookingId)
					.eq('status', 'pending')
					.maybeSingle();

				if (existingRequest) {
					return res.status(400).json({ ok: false, error: 'Já existe uma solicitação de reagendamento pendente para este agendamento' });
				}

				// Criar solicitação de reagendamento (iniciada pelo cliente)
				const { data: requestData, error: requestErr } = await supabase
					.from('reschedule_requests')
					.insert({
						booking_id: bookingId,
						requested_date: date,
						requested_time: time,
						original_date: bookingData.date,
						original_time: bookingData.time,
						status: 'pending',
						requested_by: 'client',
					})
					.select('id')
					.single();

				if (requestErr) {
					return res.status(500).json({ ok: false, error: requestErr.message });
				}

				return res.status(201).json({ ok: true, message: 'Solicitação de reagendamento criada com sucesso', request_id: requestData.id });
			}

			// Admin propõe outro horário (aguarda confirmação do cliente)
			if (action === 'admin-propose-reschedule') {
				const bookingId = body.booking_id;
				const date = body.date;
				const timeRaw = body.time;

				if (!bookingId) {
					return res.status(400).json({ ok: false, error: 'booking_id é obrigatório' });
				}
				if (!date || !timeRaw) {
					return res.status(400).json({ ok: false, error: 'date e time são obrigatórios' });
				}

				const { data: bookingRow, error: bookingErr } = await supabase
					.from('bookings')
					.select('id, date, time, status')
					.eq('id', bookingId)
					.single();

				if (bookingErr || !bookingRow) {
					return res.status(404).json({ ok: false, error: 'Agendamento não encontrado' });
				}

				if ((bookingRow as { status?: string }).status !== 'pending') {
					return res.status(400).json({
						ok: false,
						error: 'Só é possível propor outro horário para solicitações ainda pendentes de aprovação.',
					});
				}

				const time = timeRaw.length === 5 ? `${timeRaw}:00` : timeRaw;

				const sameSlot =
					String((bookingRow as { date?: string }).date) === String(date) &&
					String((bookingRow as { time?: string }).time).slice(0, 8) === time.slice(0, 8);
				if (sameSlot) {
					return res.status(400).json({ ok: false, error: 'Informe um horário diferente do pedido pelo cliente.' });
				}

				const { data: existingPending } = await supabase
					.from('reschedule_requests')
					.select('id')
					.eq('booking_id', bookingId)
					.eq('status', 'pending')
					.maybeSingle();

				if (existingPending) {
					return res.status(400).json({ ok: false, error: 'Já existe uma solicitação de troca de horário pendente para este agendamento' });
				}

				const { data: requestData, error: requestErr } = await supabase
					.from('reschedule_requests')
					.insert({
						booking_id: bookingId,
						requested_date: date,
						requested_time: time,
						original_date: (bookingRow as { date: string }).date,
						original_time: (bookingRow as { time: string }).time,
						status: 'pending',
						requested_by: 'admin',
					})
					.select('id')
					.single();

				if (requestErr) {
					return res.status(500).json({ ok: false, error: requestErr.message });
				}

				return res.status(201).json({
					ok: true,
					message: 'Proposta de horário enviada. O cliente precisa confirmar.',
					request_id: requestData.id,
				});
			}

			// Responder à solicitação de reagendamento (aceitar ou rejeitar)
			if (action === 'respond-reschedule') {
				const requestId = body.request_id;
				const response = body.response;
				const responseMessage = body.response_message || null;
				const adminId = body.responded_by || null; // Pode ser passado no body ou obtido de outra forma

				if (!requestId) {
					return res.status(400).json({ ok: false, error: 'request_id é obrigatório' });
				}
				if (!response || !['accept', 'reject'].includes(response)) {
					return res.status(400).json({ ok: false, error: 'response deve ser "accept" ou "reject"' });
				}

				// Buscar a solicitação
				const { data: requestData, error: requestErr } = await supabase
					.from('reschedule_requests')
					.select('*, bookings!inner(id, date, time, status)')
					.eq('id', requestId)
					.single();

				if (requestErr || !requestData) {
					return res.status(404).json({ ok: false, error: 'Solicitação não encontrada' });
				}

				if ((requestData as any).status !== 'pending') {
					return res.status(400).json({ ok: false, error: 'Esta solicitação já foi respondida' });
				}

				const newStatus = response === 'accept' ? 'accepted' : 'rejected';
				const booking = (requestData as any).bookings;

				// Atualizar a solicitação
				const updateData: any = {
					status: newStatus,
					responded_at: new Date().toISOString(),
					response_message: responseMessage,
				};
				if (adminId) {
					updateData.responded_by = adminId;
				}

				const { error: updateErr } = await supabase
					.from('reschedule_requests')
					.update(updateData)
					.eq('id', requestId);

				if (updateErr) {
					return res.status(500).json({ ok: false, error: updateErr.message });
				}

				// Se aceito, atualizar data/hora (e confirmar agendamento se ainda estava pendente)
				if (response === 'accept') {
					const bookingUpdate: Record<string, unknown> = {
						date: (requestData as any).requested_date,
						time: (requestData as any).requested_time,
						updated_at: new Date().toISOString(),
					};
					const prevStatus = (booking as { status?: string }).status;
					if (prevStatus === 'pending') {
						bookingUpdate.status = 'scheduled';
					}

					const { error: bookingUpdateErr } = await supabase.from('bookings').update(bookingUpdate).eq('id', booking.id);

					if (bookingUpdateErr) {
						return res.status(500).json({ ok: false, error: bookingUpdateErr.message });
					}
				}

				return res.status(200).json({ ok: true, message: `Solicitação ${response === 'accept' ? 'aceita' : 'rejeitada'} com sucesso` });
			}

			return res.status(400).json({
				ok: false,
				error: 'Ação inválida. Use action=reschedule, admin-propose-reschedule ou respond-reschedule',
			});
		} catch (err: any) {
			return res.status(500).json({ ok: false, error: err?.message || 'Erro inesperado' });
		}
	}

	res.setHeader('Allow', 'GET, POST, PUT, PATCH');
	return res.status(405).json({ ok: false, error: 'Método não permitido' });
}


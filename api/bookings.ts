// Tipos afrouxados para evitar dependência de @vercel/node em build local
import { Client } from 'pg';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

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

			// Montar query base
			let query = supabase
				.from('bookings')
				.select(`
          id,
          date,
          time,
          professional_id,
          status,
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

				return {
					booking_id: b.id,
					date: b.date,
					time: b.time,
					professional_id: b.professional_id,
					status: b.status || 'scheduled', // Default para 'scheduled' se não tiver status
					client_id: b.clients?.id,
					client_name: b.clients?.name,
					client_phone: b.clients?.phone,
					client_email: b.clients?.email,
					client_room_number: b.clients?.room_number || null,
					total_price: total_price.toFixed(2),
					total_duration_minutes,
					services,
					reschedule_request: pendingRequest || latestRequest || null,
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
			// Parse robusto do corpo (Vercel pode entregar string ou objeto)
			const raw = (req.body ?? {}) as unknown;
			const parsed = typeof raw === 'string' ? (() => { try { return JSON.parse(raw); } catch { return {}; } })() : raw;

			const body = (parsed || {}) as {
				date?: string; // yyyy-mm-dd
				time?: string; // HH:MM or HH:MM:SS
				professional_id?: string | null;
				client?: { name?: string; email?: string; phone?: string; notes?: string | null; room_number?: string | null };
				services?: Array<{ id: number; quantity?: number }>;
			};

			const date = body.date;
			const timeRaw = body.time;
			const professionalId = body.professional_id ?? null;
			const clientPayload = body.client || {};
			const services = body.services || [];

			if (!date || !timeRaw) {
				return res.status(400).json({ ok: false, error: 'date e time são obrigatórios' });
			}
			if (!clientPayload.name || !clientPayload.phone) {
				return res.status(400).json({ ok: false, error: 'client.name e client.phone são obrigatórios' });
			}
			// Se não houver email, usar telefone como fallback para compatibilidade
			const clientEmail = clientPayload.email || `whatsapp_${clientPayload.phone.replace(/\D/g, '')}@temp.local`;
			if (!services.length) {
				return res.status(400).json({ ok: false, error: 'services não pode ser vazio' });
			}

			const time = timeRaw.length === 5 ? `${timeRaw}:00` : timeRaw;

			// Supabase server client (usa service role se disponível)
			const supabaseUrl =
				process.env.SUPABASE_URL ||
				process.env.VITE_SUPABASE_URL;
			const supabaseKey =
				process.env.SUPABASE_SERVICE_ROLE_KEY || // recomendado para server
				process.env.VITE_SUPABASE_ANON_KEY;

			if (!supabaseUrl || !supabaseKey) {
				return res.status(500).json({
					ok: false,
					code: 'SUPABASE_ENV_MISSING',
					error: 'SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY não configurados',
				});
			}

			const supabase = createSupabaseClient(supabaseUrl, supabaseKey);

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
					.select('id, responsible_professional_id')
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
				// inferir profissional se não foi passado e todos os serviços apontam para o mesmo responsável não-nulo
				const distinctPros = Array.from(new Set((foundServices || [])
					.map((r: any) => r.responsible_professional_id)
					.filter((v: any) => v != null)));
				if (!professionalId) {
					if (distinctPros.length === 1) {
						inferredProfessionalId = String(distinctPros[0]);
					} else if (distinctPros.length > 1) {
						return res.status(400).json({
							ok: false,
							code: 'SERVICES_WITH_DIFFERENT_PROFESSIONALS',
							error: 'Os serviços selecionados possuem profissionais responsáveis diferentes. Escolha um profissional.',
							details: { serviceIds, distinctPros }
						});
					}
				}
			}

			// obter ou criar cliente por telefone (agora é o identificador principal)
			let clientId: string | null = null;
			const { data: existingClient, error: findClientErr } = await supabase
				.from('clients')
				.select('id')
				.eq('phone', clientPayload.phone)
				.limit(1)
				.single();
			if (existingClient?.id) {
				clientId = existingClient.id as unknown as string;
				// atualizar dados básicos
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
					return res.status(500).json({ ok: false, error: insClientErr.message });
				}
				clientId = (insertedClient as any).id as string;
			}

			// criar booking
			const { data: bookingData, error: bookingErr } = await supabase
				.from('bookings')
				.insert({
					date,
					time,
					professional_id: professionalId || inferredProfessionalId,
					client_id: clientId,
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
			};

			const bookingId = body.booking_id;
			const status = body.status;

			if (!bookingId) {
				return res.status(400).json({ ok: false, error: 'booking_id é obrigatório' });
			}
			if (!status) {
				return res.status(400).json({ ok: false, error: 'status é obrigatório' });
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
					const { sendWhatsAppMessage, formatCompletionMessage, formatProfessionalMessage } = await import('./whatsapp');

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
					.single();

				if (existingRequest) {
					return res.status(400).json({ ok: false, error: 'Já existe uma solicitação de reagendamento pendente para este agendamento' });
				}

				// Criar solicitação de reagendamento
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
					.select('*, bookings!inner(id, date, time)')
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

				// Se aceito, atualizar o agendamento
				if (response === 'accept') {
					const { error: bookingUpdateErr } = await supabase
						.from('bookings')
						.update({
							date: (requestData as any).requested_date,
							time: (requestData as any).requested_time,
							updated_at: new Date().toISOString(),
						})
						.eq('id', booking.id);

					if (bookingUpdateErr) {
						return res.status(500).json({ ok: false, error: bookingUpdateErr.message });
					}
				}

				return res.status(200).json({ ok: true, message: `Solicitação ${response === 'accept' ? 'aceita' : 'rejeitada'} com sucesso` });
			}

			return res.status(400).json({ ok: false, error: 'Ação inválida. Use action=reschedule ou action=respond-reschedule' });
		} catch (err: any) {
			return res.status(500).json({ ok: false, error: err?.message || 'Erro inesperado' });
		}
	}

	res.setHeader('Allow', 'GET, POST, PUT');
	return res.status(405).json({ ok: false, error: 'Método não permitido' });
}


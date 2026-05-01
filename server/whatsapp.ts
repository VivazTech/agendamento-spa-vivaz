interface WhatsAppConfig {
	apiUrl: string;
	apiKey?: string;
	instanceId?: string;
	token?: string;
	phoneNumberId?: string;
}

interface SendMessageParams {
	to: string;
	message: string;
}

function formatPhoneNumber(phone: string): string {
	const cleaned = phone.replace(/\D/g, '');
	const withoutZero = cleaned.startsWith('0') ? cleaned.slice(1) : cleaned;
	if (!withoutZero.startsWith('55')) return `55${withoutZero}`;
	return withoutZero;
}

async function sendViaEvolutionAPI(config: WhatsAppConfig, params: SendMessageParams) {
	try {
		const phone = formatPhoneNumber(params.to);
		const url = `${config.apiUrl}/message/sendText/${config.instanceId}`;
		const response = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', apikey: config.apiKey || '' },
			body: JSON.stringify({ number: phone, text: params.message }),
		});
		if (!response.ok) return { success: false, error: `Evolution API: ${await response.text()}` };
		return { success: true };
	} catch (error: any) {
		return { success: false, error: error?.message || 'Erro ao enviar via Evolution API' };
	}
}

async function sendViaZAPI(config: WhatsAppConfig, params: SendMessageParams) {
	try {
		const phone = formatPhoneNumber(params.to);
		const url = `${config.apiUrl}/instances/${config.instanceId}/token/${config.token}/send-text`;
		const response = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ phone, message: params.message }),
		});
		if (!response.ok) return { success: false, error: `Z-API: ${await response.text()}` };
		return { success: true };
	} catch (error: any) {
		return { success: false, error: error?.message || 'Erro ao enviar via Z-API' };
	}
}

async function sendViaTwilio(config: WhatsAppConfig, params: SendMessageParams) {
	try {
		const phone = formatPhoneNumber(params.to);
		const url = `https://api.twilio.com/2010-04-01/Accounts/${config.apiKey}/Messages.json`;
		const formData = new URLSearchParams();
		formData.append('From', `whatsapp:${config.phoneNumberId}`);
		formData.append('To', `whatsapp:${phone}`);
		formData.append('Body', params.message);
		const credentials = `${config.apiKey}:${config.token}`;
		const base64Credentials = Buffer.from(credentials).toString('base64');
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				Authorization: `Basic ${base64Credentials}`,
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: formData.toString(),
		});
		if (!response.ok) return { success: false, error: `Twilio: ${await response.text()}` };
		return { success: true };
	} catch (error: any) {
		return { success: false, error: error?.message || 'Erro ao enviar via Twilio' };
	}
}

export async function sendWhatsAppMessage(params: SendMessageParams): Promise<{ success: boolean; error?: string }> {
	const provider = process.env.WHATSAPP_PROVIDER || 'evolution';
	const apiUrl = process.env.WHATSAPP_API_URL || '';
	const apiKey = process.env.WHATSAPP_API_KEY || '';
	const instanceId = process.env.WHATSAPP_INSTANCE_ID || '';
	const token = process.env.WHATSAPP_TOKEN || '';
	const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';

	if (!apiUrl) return { success: false, error: 'WHATSAPP_API_URL não configurada' };
	const config: WhatsAppConfig = { apiUrl, apiKey, instanceId, token, phoneNumberId };

	switch (provider.toLowerCase()) {
		case 'evolution':
			if (!instanceId) return { success: false, error: 'WHATSAPP_INSTANCE_ID não configurada para Evolution API' };
			return sendViaEvolutionAPI(config, params);
		case 'zapi':
			if (!instanceId || !token) return { success: false, error: 'WHATSAPP_INSTANCE_ID e WHATSAPP_TOKEN são obrigatórios para Z-API' };
			return sendViaZAPI(config, params);
		case 'twilio':
			if (!apiKey || !token || !phoneNumberId) return { success: false, error: 'WHATSAPP_API_KEY, WHATSAPP_TOKEN e WHATSAPP_PHONE_NUMBER_ID são obrigatórios para Twilio' };
			return sendViaTwilio(config, params);
		default:
			return { success: false, error: `Provedor WhatsApp não suportado: ${provider}` };
	}
}

export function formatCompletionMessage(
	clientName: string,
	professionalName: string,
	date: string,
	time: string,
	services: Array<{ name: string; price: number }>,
	totalPrice: number
): string {
	const servicesList = services.map((s) => `• ${s.name} - R$ ${s.price.toFixed(2)}`).join('\n');
	const dateFormatted = new Date(date).toLocaleDateString('pt-BR', {
		weekday: 'long',
		day: '2-digit',
		month: 'long',
		year: 'numeric',
	});
	return `✅ *Atendimento Realizado!*\n\nOlá ${clientName}!\n\nSeu atendimento foi concluído com sucesso!\n\n*Profissional:* ${professionalName}\n*Data:* ${dateFormatted}\n*Horário:* ${time}\n\n*Serviços realizados:*\n${servicesList}\n\n*Total:* R$ ${totalPrice.toFixed(2)}\n\nAgradecemos pela preferência!`;
}

export function formatProfessionalMessage(
	clientName: string,
	date: string,
	time: string,
	services: Array<{ name: string }>,
	totalPrice: number
): string {
	const servicesList = services.map((s) => `• ${s.name}`).join('\n');
	const dateFormatted = new Date(date).toLocaleDateString('pt-BR', {
		weekday: 'long',
		day: '2-digit',
		month: 'long',
		year: 'numeric',
	});
	return `✅ *Atendimento Registrado*\n\n*Cliente:* ${clientName}\n*Data:* ${dateFormatted}\n*Horário:* ${time}\n\n*Serviços:*\n${servicesList}\n\n*Total:* R$ ${totalPrice.toFixed(2)}`;
}

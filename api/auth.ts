// Tipos afrouxados para evitar dependência de @vercel/node em build local
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Usar crypto do Node.js (disponível no Vercel)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const crypto = require('crypto');

// Função para criar hash SHA-256 da senha
function hashPassword(password: string): string {
	return crypto.createHash('sha256').update(password).digest('hex');
}

// Função para verificar senha
function verifyPassword(password: string, hash: string): boolean {
	const passwordHash = hashPassword(password);
	return passwordHash === hash;
}

export default async function handler(req: any, res: any) {
	try {
		// Endpoint para listar admins
		if (req.method === 'GET') {
			try {
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

				const { data: admins, error } = await supabase
					.from('admins')
					.select('id, username, name, email, is_active, created_at, updated_at, last_login')
					.order('name', { ascending: true });

				if (error) {
					return res.status(500).json({
						ok: false,
						error: error.message,
					});
				}

				return res.status(200).json({
					ok: true,
					admins: admins || [],
				});
			} catch (err: any) {
				return res.status(500).json({
					ok: false,
					error: err?.message || 'Erro inesperado',
				});
			}
		}

		// Endpoint para criar ou atualizar admin
		if (req.method === 'PUT') {
			try {
			const raw = req.body ?? {};
			const parsed = typeof raw === 'string' ? (() => { try { return JSON.parse(raw); } catch { return {}; } })() : raw;
			const { id, username, password, name, email, is_active } = (parsed || {}) as {
				id?: string;
				username?: string;
				password?: string;
				name?: string;
				email?: string;
				is_active?: boolean;
			};

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

			// Se tem ID, é atualização
			if (id) {
				if (!username || !name) {
					return res.status(400).json({
						ok: false,
						error: 'username e name são obrigatórios para atualização',
					});
				}

				const updateData: any = {
					username,
					name,
					email: email || null,
					is_active: typeof is_active === 'boolean' ? is_active : true,
				};

				// Se forneceu senha, atualizar também
				if (password) {
					updateData.password_hash = hashPassword(password);
				}

				const { data: updatedAdmin, error: updateError } = await supabase
					.from('admins')
					.update(updateData)
					.eq('id', id)
					.select('id, username, name, email, is_active')
					.single();

				if (updateError) {
					return res.status(500).json({
						ok: false,
						error: updateError.message,
					});
				}

				return res.status(200).json({
					ok: true,
					admin: updatedAdmin,
				});
			}

			// Criar novo admin
			if (!username || !password || !name) {
				return res.status(400).json({
					ok: false,
					error: 'username, password e name são obrigatórios',
				});
			}

			// Verificar se username já existe
			const { data: existing } = await supabase
				.from('admins')
				.select('id')
				.eq('username', username)
				.single();

			if (existing) {
				return res.status(400).json({
					ok: false,
					error: 'Username já existe',
				});
			}

			// Criar hash da senha
			const passwordHash = hashPassword(password);

			// Inserir novo admin
			const { data: newAdmin, error: insertError } = await supabase
				.from('admins')
				.insert({
					username,
					password_hash: passwordHash,
					name,
					email: email || null,
					is_active: true,
				})
				.select('id, username, name, email, is_active')
				.single();

			if (insertError) {
				return res.status(500).json({
					ok: false,
					error: insertError.message,
				});
			}

			return res.status(201).json({
				ok: true,
				admin: newAdmin,
			});
		} catch (err: any) {
			return res.status(500).json({
				ok: false,
				error: err?.message || 'Erro inesperado',
			});
			}
		}

		// Endpoint para deletar/desativar admin
		if (req.method === 'DELETE') {
			try {
			const urlObj = new URL(req?.url || '/', 'http://localhost');
			const id = urlObj.searchParams.get('id');

			if (!id) {
				return res.status(400).json({
					ok: false,
					error: 'id é obrigatório',
				});
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

			// Desativar ao invés de deletar (mais seguro)
			const { error } = await supabase
				.from('admins')
				.update({ is_active: false })
				.eq('id', id);

			if (error) {
				return res.status(500).json({
					ok: false,
					error: error.message,
				});
			}

			return res.status(200).json({
				ok: true,
				message: 'Admin desativado com sucesso',
			});
		} catch (err: any) {
			return res.status(500).json({
				ok: false,
				error: err?.message || 'Erro inesperado',
			});
			}
		}

		// Endpoint para solicitar reset de senha
		if (req.method === 'PATCH' && req.body?.action === 'request-reset') {
			try {
			const { email } = (req.body || {}) as { email?: string };

			if (!email) {
				return res.status(400).json({
					ok: false,
					error: 'email é obrigatório',
				});
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

			// Buscar admin por email
			const { data: admin, error: findError } = await supabase
				.from('admins')
				.select('id, username, name, email')
				.eq('email', email)
				.eq('is_active', true)
				.single();

			// Sempre retornar sucesso (não revelar se o email existe)
			if (findError || !admin) {
				return res.status(200).json({
					ok: true,
					message: 'Se o email existir, você receberá um link para redefinir sua senha.',
				});
			}

			// Gerar token único
			const token = crypto.randomBytes(32).toString('hex');
			const expiresAt = new Date();
			expiresAt.setHours(expiresAt.getHours() + 1); // Token válido por 1 hora

			// Salvar token no banco
			const { error: tokenError } = await supabase
				.from('password_reset_tokens')
				.insert({
					admin_id: admin.id,
					token,
					expires_at: expiresAt.toISOString(),
					used: false,
				});

			if (tokenError) {
				return res.status(500).json({
					ok: false,
					error: 'Erro ao gerar token de reset',
				});
			}

			// Construir link de reset
			let frontendUrl = process.env.FRONTEND_URL || '';
			
			// Se não tiver https://, adicionar
			if (frontendUrl && !frontendUrl.startsWith('http://') && !frontendUrl.startsWith('https://')) {
				frontendUrl = `https://${frontendUrl}`;
			}
			
			// Fallback para VERCEL_URL se FRONTEND_URL não estiver configurado
			if (!frontendUrl) {
				if (process.env.VERCEL_URL) {
					frontendUrl = `https://${process.env.VERCEL_URL}`;
				} else {
					frontendUrl = 'http://localhost:3000';
				}
			}
			
			const resetLink = `${frontendUrl}/admin/reset-password?token=${token}`;

			console.log('[AUTH] Enviando email de reset:', {
				email: admin.email,
				from: process.env.EMAIL_FROM,
				provider: process.env.EMAIL_PROVIDER,
				hasApiKey: !!process.env.RESEND_API_KEY,
				resetLink,
			});

			// Import dinâmico para evitar erros de inicialização
			let emailResult: { success: boolean; error?: string };
			try {
				const { sendResetPasswordEmail } = await import('./sendEmail');
				emailResult = await sendResetPasswordEmail(
					admin.email!,
					resetLink,
					admin.name
				);
			} catch (emailError: any) {
				console.error('[AUTH] Erro ao importar/enviar email:', emailError);
				emailResult = { 
					success: false, 
					error: emailError?.message || 'Erro ao enviar email' 
				};
			}

			console.log('[AUTH] Resultado do envio de email:', emailResult);

			// Se houver erro ao enviar email, logar mas não falhar a requisição
			// (por segurança, sempre retornar sucesso)
			if (!emailResult.success) {
				console.error('[AUTH] Erro ao enviar email de reset:', emailResult.error);
				// Em desenvolvimento ou se houver erro, retornar o link na resposta para debug
				return res.status(200).json({
					ok: true,
					message: 'Se o email existir, você receberá um link para redefinir sua senha.',
					error: emailResult.error, // Incluir erro para debug
					debug_link: resetLink, // Sempre incluir link para debug
				});
			}

			return res.status(200).json({
				ok: true,
				message: 'Se o email existir, você receberá um link para redefinir sua senha.',
			});
		} catch (err: any) {
			return res.status(500).json({
				ok: false,
				error: err?.message || 'Erro inesperado',
			});
			}
		}

		// Endpoint para redefinir senha com token
		if (req.method === 'PATCH' && req.body?.action === 'reset-password') {
			try {
				const { token, newPassword } = (req.body || {}) as {
				token?: string;
				newPassword?: string;
			};

			if (!token || !newPassword) {
				return res.status(400).json({
					ok: false,
					error: 'token e newPassword são obrigatórios',
				});
			}

			if (newPassword.length < 6) {
				return res.status(400).json({
					ok: false,
					error: 'A senha deve ter pelo menos 6 caracteres',
				});
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

			// Buscar token válido
			const { data: resetToken, error: tokenError } = await supabase
				.from('password_reset_tokens')
				.select('id, admin_id, expires_at, used')
				.eq('token', token)
				.eq('used', false)
				.single();

			if (tokenError || !resetToken) {
				return res.status(400).json({
					ok: false,
					error: 'Token inválido ou expirado',
				});
			}

			// Verificar se o token expirou
			const now = new Date();
			const expiresAt = new Date(resetToken.expires_at);
			if (now > expiresAt) {
				return res.status(400).json({
					ok: false,
					error: 'Token expirado',
				});
			}

			// Criar hash da nova senha
			const passwordHash = hashPassword(newPassword);

			// Atualizar senha do admin
			const { error: updateError } = await supabase
				.from('admins')
				.update({ password_hash: passwordHash })
				.eq('id', resetToken.admin_id);

			if (updateError) {
				return res.status(500).json({
					ok: false,
					error: 'Erro ao atualizar senha',
				});
			}

			// Marcar token como usado
			await supabase
				.from('password_reset_tokens')
				.update({ used: true })
				.eq('id', resetToken.id);

			return res.status(200).json({
				ok: true,
				message: 'Senha redefinida com sucesso',
			});
			} catch (err: any) {
				return res.status(500).json({
					ok: false,
					error: err?.message || 'Erro inesperado',
				});
			}
		}

		// Endpoint para login com username e senha
		if (req.method === 'POST') {
			try {
				const raw = req.body ?? {};
				const parsed = typeof raw === 'string' ? (() => { try { return JSON.parse(raw); } catch { return {}; } })() : raw;
				const { username, password } = (parsed || {}) as {
					username?: string;
					password?: string;
				};

				if (!username || !password) {
					return res.status(400).json({
						ok: false,
						error: 'username e password são obrigatórios',
					});
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

				// Buscar admin por username
				const { data: admin, error } = await supabase
					.from('admins')
					.select('id, username, name, email, password_hash, role, is_active')
					.eq('username', username)
					.single();

				if (error || !admin) {
					return res.status(401).json({
						ok: false,
						error: 'Usuário ou senha inválidos',
					});
				}

				// Verificar se está ativo
				if (!admin.is_active) {
					return res.status(403).json({
						ok: false,
						error: 'Usuário desativado',
					});
				}

				// Verificar senha
				if (!verifyPassword(password, admin.password_hash)) {
					return res.status(401).json({
						ok: false,
						error: 'Usuário ou senha inválidos',
					});
				}

				// Atualizar último login
				await supabase
					.from('admins')
					.update({ last_login: new Date().toISOString() })
					.eq('id', admin.id);

				// Retornar dados do admin (sem password_hash)
				return res.status(200).json({
					ok: true,
					admin: {
						id: admin.id,
						username: admin.username,
						name: admin.name,
						email: admin.email,
						role: admin.role || 'colaborador',
					},
				});
			} catch (err: any) {
				return res.status(500).json({
					ok: false,
					error: err?.message || 'Erro inesperado',
				});
			}
		}

		res.setHeader('Allow', 'GET, POST, PUT, PATCH, DELETE');
		return res.status(405).json({ ok: false, error: 'Método não permitido' });
	} catch (err: any) {
		console.error('[AUTH] Erro não tratado no handler:', {
			message: err?.message,
			stack: err?.stack,
			name: err?.name,
		});
		return res.status(500).json({
			ok: false,
			error: err?.message || 'Erro inesperado no servidor',
		});
	}
}


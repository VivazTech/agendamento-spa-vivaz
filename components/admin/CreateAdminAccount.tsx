import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const CreateAdminAccount: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'gerente' | 'colaborador'>('colaborador');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validações
    if (!username.trim()) {
      setError('Username é obrigatório');
      return;
    }

    if (!password.trim()) {
      setError('Senha é obrigatória');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (!name.trim()) {
      setError('Nome é obrigatório');
      return;
    }

    // Validar formato de email se fornecido
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Email inválido');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
          name: name.trim(),
          email: email.trim() || null,
          role: role,
        }),
      });

      // Verificar se a resposta é JSON
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('[CreateAdminAccount] Resposta não é JSON:', text.substring(0, 200));
        throw new Error('Erro no servidor. A resposta não é válida. Verifique o console para mais detalhes.');
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'Erro ao criar conta de admin');
      }

      // Sucesso
      setSuccess(true);
      // Limpar formulário
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      setName('');
      setEmail('');
      setRole('colaborador');

      // Redirecionar para admin (que mostrará login) após 2 segundos
      setTimeout(() => {
        navigate('/admin', { replace: true });
      }, 2000);
    } catch (err: any) {
      // Tratar diferentes tipos de erro
      let errorMessage = 'Erro ao criar conta. Tente novamente.';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err instanceof TypeError && err.message.includes('JSON')) {
        errorMessage = 'Erro ao processar resposta do servidor. Verifique se a API está funcionando.';
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      console.error('[CreateAdminAccount] Erro completo:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-gray-300 shadow-xl">
          <div className="text-center">
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Conta criada com sucesso!</h2>
            <p className="text-gray-600 mb-6">
              Sua conta de administrador foi criada. Você será redirecionado para a página de login.
            </p>
            <Link
              to="/admin"
              className="text-[#5b3310] hover:text-[#3b200d] underline text-sm"
            >
              Ir para login agora
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-gray-300 shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Criar Conta Admin</h1>
          <p className="text-gray-600">Preencha os dados para criar sua conta de administrador</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Usuário <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-[#5b3310] focus:border-[#5b3310]"
              placeholder="Digite seu usuário"
              required
              autoComplete="username"
              minLength={3}
            />
            <p className="mt-1 text-xs text-gray-500">Mínimo 3 caracteres</p>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nome Completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-[#5b3310] focus:border-[#5b3310]"
              placeholder="Digite seu nome completo"
              required
              autoComplete="name"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-[#5b3310] focus:border-[#5b3310]"
              placeholder="seu@email.com (opcional)"
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              Perfil <span className="text-red-500">*</span>
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'gerente' | 'colaborador')}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-[#5b3310] focus:border-[#5b3310]"
              required
            >
              <option value="colaborador">Colaborador</option>
              <option value="gerente">Gerente</option>
              <option value="admin">Administrador</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              {role === 'admin' && 'Acesso total ao sistema'}
              {role === 'gerente' && 'Acesso a gestão de serviços e profissionais'}
              {role === 'colaborador' && 'Acesso básico ao sistema'}
            </p>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Senha <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-[#5b3310] focus:border-[#5b3310]"
              placeholder="Digite sua senha"
              required
              autoComplete="new-password"
              minLength={6}
            />
            <p className="mt-1 text-xs text-gray-500">Mínimo 6 caracteres</p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar Senha <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-[#5b3310] focus:border-[#5b3310]"
              placeholder="Digite a senha novamente"
              required
              autoComplete="new-password"
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#5b3310] hover:bg-[#6b4020] text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Criando conta...
              </>
            ) : (
              'Criar Conta'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Já tem uma conta?{' '}
            <Link
              to="/admin"
              className="text-[#5b3310] hover:text-[#3b200d] underline font-medium"
            >
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreateAdminAccount;


import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { loginWithGoogle, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Redirecionar automaticamente se já estiver autenticado
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      console.log('[LoginPage] Usuário já autenticado, redirecionando para /admin');
      navigate('/admin', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      // O loginWithGoogle vai redirecionar a página para o Google
      // Se retornar, significa que algo deu errado
      const ok = await loginWithGoogle();
      if (!ok) {
        setError('Não foi possível iniciar o login. Tente novamente.');
        setIsLoading(false);
      }
      // Se ok for true, a página será redirecionada, então não precisamos fazer nada
    } catch (err: any) {
      console.error('[LoginPage] Error:', err);
      setError(err?.message || 'Erro ao fazer login. Tente novamente.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-gray-300 shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Painel Admin</h1>
          <p className="text-gray-600">Entre com sua conta Google para acessar</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
            {error.includes('bloqueado') && (
              <div className="mt-2 text-xs">
                <p>Dica: Permita popups para este site nas configurações do navegador.</p>
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full border border-gray-300 hover:bg-gray-50 text-gray-900 font-medium py-3 px-6 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Redirecionando para Google...
            </>
          ) : (
            <>
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" className="h-5 w-5" />
              Entrar com Google
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default LoginPage;


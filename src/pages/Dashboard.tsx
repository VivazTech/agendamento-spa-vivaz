import React from 'react';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user, signOut } = useSupabaseAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (!user) {
    return null; // ProtectedRoute vai redirecionar
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Sair
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Informações da Conta</h2>
              <p className="text-gray-600">
                <span className="font-medium">Logado como:</span> {user.email}
              </p>
              {user.user_metadata?.name && (
                <p className="text-gray-600 mt-1">
                  <span className="font-medium">Nome:</span> {user.user_metadata.name}
                </p>
              )}
              <p className="text-gray-600 mt-1">
                <span className="font-medium">ID:</span> {user.id}
              </p>
              <p className="text-gray-600 mt-1">
                <span className="font-medium">Email verificado:</span>{' '}
                {user.email_confirmed_at ? 'Sim' : 'Não'}
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm">
                🎉 Você está autenticado com Supabase Auth! Esta é uma página protegida.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;


import React, { useEffect, useState } from 'react';
import { UserIcon } from './icons';
import { Link } from 'react-router-dom';

// Importar a imagem como módulo
const logoPath = '/logo2.png';

const Header: React.FC = () => {
  const [isAdminLogged, setIsAdminLogged] = useState(false);
  const [newRequestsCount, setNewRequestsCount] = useState(0);

  useEffect(() => {
    const updateAuthState = () => {
      const adminAuth = localStorage.getItem('admin_authenticated') === 'true';
      setIsAdminLogged(adminAuth);
    };
    updateAuthState();
    window.addEventListener('storage', updateAuthState);
    return () => window.removeEventListener('storage', updateAuthState);
  }, []);

  useEffect(() => {
    if (!isAdminLogged) return;
    let cancelled = false;

    const loadPending = async () => {
      try {
        const res = await fetch('/api/bookings');
        const data = await res.json();
        if (!res.ok) return;
        const count = Array.isArray(data?.bookings)
          ? data.bookings.filter((b: any) => String(b?.status || '').toLowerCase() === 'pending').length
          : 0;
        if (!cancelled) setNewRequestsCount(count);
      } catch {
        // Silenciar para não quebrar o header
      }
    };

    loadPending();
    const interval = window.setInterval(loadPending, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [isAdminLogged]);

  return (
    <header className="bg-white/90 backdrop-blur-sm sticky top-0 z-50 border-b border-gray-300 shadow-sm">
      <div className="container mx-auto flex items-center justify-between p-4">
        <div className="flex items-center gap-2 md:gap-3">
          <img 
            src={logoPath} 
            alt="SPA Vivaz Cataratas" 
            className="h-5 w-auto object-contain md:h-6"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
          <h1 className="text-sm font-normal tracking-wider text-gray-400">
            <span className="hidden md:inline">Agendamento Online <br /></span>
            SPA Vivaz Cataratas
          </h1>
        </div>

        <div className="flex items-center">
          {isAdminLogged ? (
            <Link
              to="/admin"
              className="relative inline-flex items-center gap-2 text-gray-900 hover:text-[#5b3310] transition-colors"
              title="Novas solicitações de agendamento"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-6 h-6"
                aria-hidden
              >
                <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
                <path d="M9 17a3 3 0 0 0 6 0" />
              </svg>
              {newRequestsCount > 0 && (
                <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-[11px] font-bold flex items-center justify-center">
                  {newRequestsCount > 99 ? '99+' : newRequestsCount}
                </span>
              )}
            </Link>
          ) : (
            <Link
              to="/login-cliente"
              className="inline-flex items-center gap-2 text-gray-900 hover:text-[#5b3310] transition-colors"
              title="Acessar meus agendamentos"
            >
              <UserIcon className="w-6 h-6" />
              <span className="hidden sm:inline font-medium">Minha conta</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

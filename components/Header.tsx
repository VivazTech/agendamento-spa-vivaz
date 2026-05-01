import React, { useEffect, useMemo, useRef, useState } from 'react';
import { UserIcon } from './icons';
import { Link } from 'react-router-dom';

// Importar a imagem como módulo
const logoPath = '/logo2.png';

type PendingBooking = {
  booking_id: string;
  client_name?: string;
  date?: string;
  time?: string;
  services?: Array<{ name?: string }>;
  status?: string;
  reschedule_request?: {
    status?: string;
    requested_by?: string;
  } | null;
};

const Header: React.FC = () => {
  const [isAdminLogged, setIsAdminLogged] = useState(false);
  const [newRequestsCount, setNewRequestsCount] = useState(0);
  const [pendingBookings, setPendingBookings] = useState<PendingBooking[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const formatDatePtBr = (dateStr?: string) => {
    if (!dateStr) return '';
    const [year, month, day] = String(dateStr).split('-').map(Number);
    if (!year || !month || !day) return String(dateStr);
    return new Date(year, month - 1, day).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

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
        const pending = Array.isArray(data?.bookings)
          ? data.bookings.filter((b: PendingBooking) => {
              const bookingPending = String(b?.status || '').toLowerCase() === 'pending';
              const rr = b?.reschedule_request;
              const clientReschedulePending =
                String(rr?.status || '').toLowerCase() === 'pending' &&
                (String(rr?.requested_by || '').toLowerCase() === 'client' || !rr?.requested_by);
              return bookingPending || clientReschedulePending;
            })
          : [];
        if (!cancelled) {
          setPendingBookings(pending);
          setNewRequestsCount(pending.length);
        }
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

  useEffect(() => {
    if (!isOpen) return;
    const onMouseDown = (event: MouseEvent) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [isOpen]);

  const topPending = useMemo(() => pendingBookings.slice(0, 6), [pendingBookings]);

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

        <div className="flex items-center" ref={dropdownRef}>
          {isAdminLogged ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className="relative inline-flex items-center gap-2 text-gray-900 hover:text-[#5b3310] transition-colors"
              title="Novas solicitações de agendamento"
              aria-label="Abrir notificações de solicitações"
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
              </button>

              {isOpen && (
                <div className="absolute right-0 mt-3 w-[320px] max-w-[90vw] rounded-xl border border-gray-200 bg-white shadow-xl p-3 z-50">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-gray-900">Solicitações pendentes</h3>
                    <span className="text-xs text-gray-500">{newRequestsCount}</span>
                  </div>
                  {topPending.length === 0 ? (
                    <p className="text-sm text-gray-600 py-2">Nenhuma nova solicitação.</p>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-auto pr-1">
                      {topPending.map((booking) => (
                        <Link
                          key={booking.booking_id}
                          to="/admin"
                          onClick={() => setIsOpen(false)}
                          className="block rounded-lg border border-gray-200 hover:border-[#5b3310] px-3 py-2 transition-colors"
                        >
                          <div className="text-sm font-semibold text-gray-900">{booking.client_name || 'Cliente'}</div>
                          <div className="text-xs text-gray-600">
                            {formatDatePtBr(booking.date)} {booking.time ? `às ${booking.time.slice(0, 5)}` : ''}
                          </div>
                          {String(booking?.reschedule_request?.status || '').toLowerCase() === 'pending' &&
                            (String(booking?.reschedule_request?.requested_by || '').toLowerCase() === 'client' || !booking?.reschedule_request?.requested_by) && (
                            <div className="text-[11px] font-semibold text-amber-700 mt-1">
                              ⏳ Cliente pediu troca de horário
                            </div>
                          )}
                          {!!booking.services?.length && (
                            <div className="text-xs text-gray-700 mt-1 line-clamp-1">
                              {(booking.services || []).map((s) => s?.name).filter(Boolean).join(', ')}
                            </div>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                  <Link
                    to="/admin"
                    onClick={() => setIsOpen(false)}
                    className="mt-3 inline-flex w-full justify-center rounded-lg bg-[#3b200d] text-white text-sm font-semibold py-2 hover:bg-[#5b3310]"
                  >
                    Ver no painel
                  </Link>
                </div>
              )}
            </div>
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

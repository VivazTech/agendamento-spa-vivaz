import React, { useEffect, useState } from 'react';
import BannerSlider from '../BannerSlider';

type RescheduleRequest = {
  id: string;
  requested_date: string;
  requested_time: string;
  original_date: string;
  original_time: string;
  status: 'pending' | 'accepted' | 'rejected';
  response_message?: string | null;
  created_at: string;
  responded_at?: string | null;
};

type Row = {
  booking_id: string;
  date: string;
  time: string;
  services: Array<{ name: string; price: number }>;
  total_price: string;
  reschedule_request?: RescheduleRequest | null;
};

const ClientBookingsPage: React.FC = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const phone = (typeof window !== 'undefined' && localStorage.getItem('client_phone')) || '';
  const [clientName, setClientName] = useState<string | null>(null);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState<string>('');
  const [newTime, setNewTime] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Buscar nome do cliente
  useEffect(() => {
    (async () => {
      if (!phone) return;
      try {
        const res = await fetch('/api/client-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'login', phone }),
        });
        const data = await res.json();
        if (res.ok && data.ok && data.name) {
          setClientName(data.name);
        }
      } catch (e) {
        console.error('Erro ao buscar nome do cliente:', e);
      }
    })();
  }, [phone]);

  // Buscar agendamentos
  useEffect(() => {
    (async () => {
      if (!phone) return;
      setLoading(true);
      setError(null);
      try {
        const qs = new URLSearchParams({ client: phone });
        const res = await fetch(`/api/bookings?${qs.toString()}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Erro ao carregar agendamentos');
        setRows((data.bookings || []) as Row[]);
        
        // Se não conseguiu o nome pela API de auth, tentar pegar do primeiro booking
        if (!clientName && data.bookings && data.bookings.length > 0 && data.bookings[0].client_name) {
          setClientName(data.bookings[0].client_name);
        }
      } catch (e: any) {
        setError(e?.message || 'Erro ao carregar agendamentos');
      } finally {
        setLoading(false);
      }
    })();
  }, [phone, clientName]);

  if (!phone) {
    return (
      <div className="max-w-lg mx-auto text-center bg-white p-8 rounded-2xl border border-gray-300 shadow-xl">
        <p className="text-gray-700 mb-4">Você precisa entrar para ver seus agendamentos.</p>
        <a href="/login-cliente" className="text-[#5b3310] font-semibold hover:underline">Ir para login</a>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Banner */}
      <div className="w-full pt-4 mb-6">
        <BannerSlider />
      </div>

      {/* Conteúdo principal */}
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-300 shadow-xl">
        {/* Saudação */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {clientName ? `Olá, ${clientName}!` : 'Olá!'}
          </h2>
          <p className="text-gray-600">Aqui estão seus agendamentos</p>
        </div>

        {loading && <div className="text-gray-700">Carregando...</div>}
        {error && <div className="text-red-600">{error}</div>}

        {!loading && !error && rows.length === 0 && (
          <div className="text-gray-700">Nenhum agendamento encontrado.</div>
        )}

        <div className="space-y-3">
          {rows.map((r) => {
            const hasPendingRequest = r.reschedule_request?.status === 'pending';
            const hasAcceptedRequest = r.reschedule_request?.status === 'accepted';
            const hasRejectedRequest = r.reschedule_request?.status === 'rejected';
            
            return (
            <div key={r.booking_id} className="border border-gray-300 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-gray-900">
                  {new Date(r.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })} às {r.time?.slice(0,5)}
                </div>
                <div className="text-[#3b200d] font-bold">R${Number(r.total_price || 0).toFixed(2)}</div>
              </div>
              <div className="text-gray-700 mt-2">
                {(r.services || []).map(s => s.name).join(', ')}
              </div>
              
              {/* Status da solicitação de reagendamento */}
              {hasPendingRequest && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800 font-medium">
                    ⏳ Solicitação de troca de horário pendente
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Novo horário solicitado: {new Date(r.reschedule_request!.requested_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })} às {r.reschedule_request!.requested_time.slice(0,5)}
                  </p>
                  <p className="text-xs text-yellow-600 mt-1">
                    Aguardando resposta do profissional...
                  </p>
                </div>
              )}
              
              {hasAcceptedRequest && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800 font-medium">
                    ✅ Solicitação de troca aceita
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    Seu agendamento foi alterado para: {new Date(r.reschedule_request!.requested_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })} às {r.reschedule_request!.requested_time.slice(0,5)}
                  </p>
                </div>
              )}
              
              {hasRejectedRequest && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800 font-medium">
                    ❌ Solicitação de troca negada
                  </p>
                  {r.reschedule_request!.response_message && (
                    <p className="text-xs text-red-700 mt-1">
                      {r.reschedule_request!.response_message}
                    </p>
                  )}
                </div>
              )}
              
              <div className="mt-3 flex gap-2">
                <button
                  className="px-3 py-2 rounded-lg border border-gray-300 text-gray-900 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => {
                    setRescheduleId(r.booking_id);
                    setNewDate(r.date);
                    setNewTime((r.time || '').slice(0,5));
                  }}
                  disabled={hasPendingRequest}
                >
                  {hasPendingRequest ? 'Solicitação pendente' : 'Trocar horário'}
                </button>
                <button
                  className="px-3 py-2 rounded-lg border border-red-300 text-red-700 hover:bg-red-50"
                  onClick={async () => {
                    if (!confirm('Tem certeza que deseja cancelar este agendamento?')) return;
                    try {
                      setActionLoading(r.booking_id);
                      const res = await fetch('/api/bookings', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ booking_id: r.booking_id, status: 'cancelled' }),
                      });
                      const data = await res.json();
                      if (!res.ok || !data.ok) throw new Error(data?.error || 'Falha ao cancelar');
                      setRows(prev => prev.filter(row => row.booking_id !== r.booking_id));
                    } catch (e: any) {
                      alert(e?.message || 'Erro ao cancelar');
                    } finally {
                      setActionLoading(null);
                    }
                  }}
                  disabled={actionLoading === r.booking_id}
                >
                  {actionLoading === r.booking_id ? 'Cancelando...' : 'Cancelar'}
                </button>
              </div>
            </div>
            );
          })}
        </div>
      </div>

      {rescheduleId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white rounded-2xl border border-gray-300 shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xl font-bold text-gray-900">Trocar horário</h4>
              <button
                onClick={() => setRescheduleId(null)}
                className="text-gray-500 hover:text-gray-700"
              >✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nova data</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Novo horário</label>
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-900"
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  className="px-4 py-2 rounded-lg border border-gray-300"
                  onClick={() => setRescheduleId(null)}
                >
                  Fechar
                </button>
                <button
                  className="px-4 py-2 rounded-lg bg-[#3b200d] text-white font-semibold hover:bg-[#5b3310]"
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/bookings', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'reschedule', booking_id: rescheduleId, date: newDate, time: newTime }),
                      });
                      const data = await res.json();
                      if (!res.ok || !data.ok) throw new Error(data?.error || 'Falha ao criar solicitação');
                      alert('Solicitação de troca de horário enviada! Aguarde a resposta do profissional.');
                      // Recarregar agendamentos para mostrar a solicitação pendente
                      const qs = new URLSearchParams({ client: phone });
                      const refreshRes = await fetch(`/api/bookings?${qs.toString()}`);
                      const refreshData = await refreshRes.json();
                      if (refreshRes.ok) {
                        setRows((refreshData.bookings || []) as Row[]);
                      }
                      setRescheduleId(null);
                    } catch (e: any) {
                      alert(e?.message || 'Erro ao criar solicitação');
                    }
                  }}
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientBookingsPage;



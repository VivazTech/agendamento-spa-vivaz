import React, { useEffect, useMemo, useState } from 'react';
import { CalendarIcon } from '../icons';

type Professional = { id: string; name: string; };
type Service = { id: number; name: string; };

type RescheduleRequest = {
  id: string;
  requested_date: string;
  requested_time: string;
  original_date: string;
  original_time: string;
  status: 'pending' | 'accepted' | 'rejected';
  requested_by?: 'client' | 'admin' | 'professional' | string;
  response_message?: string | null;
  created_at: string;
  responded_at?: string | null;
};

type BookingRow = {
  booking_id: string;
  date: string; // yyyy-mm-dd
  time: string; // HH:MM:SS
  professional_id: string | null;
  status?: 'pending' | 'scheduled' | 'rejected' | 'completed' | 'cancelled' | string;
  is_courtesy?: boolean;
  rejection_reason?: string | null;
  client_id: string;
  client_name: string;
  client_phone: string;
  client_email: string;
  total_price: string;
  total_duration_minutes: number;
  services: Array<{
    id: number;
    name: string;
    price: number;
    duration_minutes: number;
    quantity: number;
  }>;
  reschedule_request?: RescheduleRequest | null;
}

const AppointmentsView: React.FC = () => {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  const [professionalId, setProfessionalId] = useState<string>('');
  const [serviceId, setServiceId] = useState<string>('');
  const [clientQuery, setClientQuery] = useState<string>('');
  const [time, setTime] = useState<string>(''); // HH:MM
  const [timeFrom, setTimeFrom] = useState<string>(''); // HH:MM
  const [timeTo, setTimeTo] = useState<string>(''); // HH:MM

  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [respondingToRequest, setRespondingToRequest] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [proposeBookingId, setProposeBookingId] = useState<string | null>(null);
  const [proposeDate, setProposeDate] = useState('');
  const [proposeTime, setProposeTime] = useState('');
  const [proposeSubmitting, setProposeSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [proRes, srvRes] = await Promise.all([
          fetch('/api/professionals'),
          fetch('/api/services')
        ]);
        if (proRes.ok) {
          const j = await proRes.json();
          setProfessionals((j.professionals || []).map((p: any) => ({ id: p.id, name: p.name })));
        }
        if (srvRes.ok) {
          const j = await srvRes.json();
          setServices((j.services || []).map((s: any) => ({ id: s.id, name: s.name })));
        }
      } catch {}
    })();
  }, []);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (professionalId) qs.set('professional_id', professionalId);
      if (serviceId) qs.set('service_id', serviceId);
      if (clientQuery) qs.set('client', clientQuery);
      if (time) qs.set('time', time);
      if (!time && timeFrom) qs.set('time_from', timeFrom);
      if (!time && timeTo) qs.set('time_to', timeTo);
      const url = `/api/bookings${qs.toString() ? `?${qs.toString()}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erro ao carregar agendamentos');
      setBookings(data.bookings || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Carregar agendamentos quando o componente monta e quando os filtros mudam
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [professionalId, serviceId, clientQuery, time, timeFrom, timeTo]);

  const updateBookingStatus = async (
    bookingId: string,
    newStatus: 'pending' | 'scheduled' | 'rejected' | 'completed' | 'cancelled',
    rejectionReason?: string
  ) => {
    setUpdatingStatus(bookingId);
    try {
      const res = await fetch('/api/bookings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: bookingId,
          status: newStatus,
          send_whatsapp: false, // Não enviar WhatsApp
          rejection_reason: newStatus === 'rejected' ? (rejectionReason || '') : null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data?.error || 'Erro ao atualizar status');
      }

      load(); // Recarregar lista
    } catch (e: any) {
      alert(e?.message || 'Erro ao atualizar status do agendamento');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const requestRejectReasonAndReject = async (bookingId: string) => {
    const reason = prompt('Informe o motivo da recusa (obrigatório):');
    if (reason === null) return;
    const normalized = reason.trim();
    if (!normalized) {
      alert('O motivo da recusa é obrigatório.');
      return;
    }
    await updateBookingStatus(bookingId, 'rejected', normalized);
  };

  const submitAdminProposeReschedule = async () => {
    if (!proposeBookingId || !proposeDate || !proposeTime) {
      alert('Informe data e horário sugeridos.');
      return;
    }
    setProposeSubmitting(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'admin-propose-reschedule',
          booking_id: proposeBookingId,
          date: proposeDate,
          time: proposeTime.length === 5 ? proposeTime : proposeTime.slice(0, 5),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data?.error || 'Erro ao enviar proposta de horário');
      }
      setProposeBookingId(null);
      load();
    } catch (e: any) {
      alert(e?.message || 'Erro ao propor horário');
    } finally {
      setProposeSubmitting(false);
    }
  };

  const openProposeModal = (b: BookingRow) => {
    setProposeBookingId(b.booking_id);
    setProposeDate(b.date);
    const t = (b.time || '09:00').slice(0, 5);
    setProposeTime(t);
  };

  const respondToRescheduleRequest = async (requestId: string, response: 'accept' | 'reject', responseMessage?: string) => {
    setRespondingToRequest(requestId);
    try {
      const res = await fetch('/api/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'respond-reschedule',
          request_id: requestId,
          response,
          response_message: responseMessage || null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data?.error || `Erro ao ${response === 'accept' ? 'aceitar' : 'rejeitar'} solicitação`);
      }

      alert(`Solicitação ${response === 'accept' ? 'aceita' : 'rejeitada'} com sucesso!`);
      load(); // Recarregar lista
    } catch (e: any) {
      alert(e?.message || `Erro ao ${response === 'accept' ? 'aceitar' : 'rejeitar'} solicitação`);
    } finally {
      setRespondingToRequest(null);
    }
  };

  const grouped = useMemo(() => {
    const m = new Map<string, BookingRow[]>();
    bookings.forEach(b => {
      const key = b.date;
      const arr = m.get(key) || [];
      arr.push(b);
      m.set(key, arr);
    });
    // Mais recentes primeiro: datas maiores no topo
    return Array.from(m.entries()).sort(([a],[b]) => b.localeCompare(a));
  }, [bookings]);

  const statusMeta = (status?: string) => {
    switch (status) {
      case 'completed':
        return { label: 'Concluído', className: 'bg-green-100 text-green-800' };
      case 'scheduled':
        return { label: 'Aprovado', className: 'bg-blue-100 text-blue-800' };
      case 'rejected':
        return { label: 'Recusado', className: 'bg-red-100 text-red-800' };
      case 'cancelled':
        return { label: 'Cancelado', className: 'bg-gray-200 text-gray-700' };
      case 'pending':
      default:
        return { label: 'Solicitação pendente', className: 'bg-amber-100 text-amber-800' };
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">Solicitações e Agendamentos</h2>
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Profissional</label>
            <select
              value={professionalId}
              onChange={e => setProfessionalId(e.target.value)}
              className="w-full bg-white text-gray-900 border border-gray-300 rounded px-3 py-2"
            >
              <option value="">Todos</option>
              {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Serviço</label>
            <select
              value={serviceId}
              onChange={e => setServiceId(e.target.value)}
              className="w-full bg-white text-gray-900 border border-gray-300 rounded px-3 py-2"
            >
              <option value="">Todos</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Cliente</label>
            <input
              value={clientQuery}
              onChange={e => setClientQuery(e.target.value)}
              placeholder="Nome, e-mail ou telefone"
              className="w-full bg-white text-gray-900 border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Horário exato</label>
            <input
              type="time"
              value={time}
              onChange={e => { setTime(e.target.value); }}
              className="w-full bg-white text-gray-900 border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm text-gray-600 mb-1">De</label>
              <input
                type="time"
                value={timeFrom}
                onChange={e => { setTimeFrom(e.target.value); if (time) setTime(''); }}
                className="w-full bg-white text-gray-900 border border-gray-300 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Até</label>
              <input
                type="time"
                value={timeTo}
                onChange={e => { setTimeTo(e.target.value); if (time) setTime(''); }}
                className="w-full bg-white text-gray-900 border border-gray-300 rounded px-3 py-2"
              />
            </div>
          </div>
          <div className="md:col-span-5 flex justify-end">
            <button
              onClick={() => {
                setProfessionalId('');
                setServiceId('');
                setClientQuery('');
                setTime('');
                setTimeFrom('');
                setTimeTo('');
              }}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-4 py-2 rounded transition-colors"
            >
              Limpar filtros
            </button>
          </div>
        </div>
      </div>

      {error && <div className="text-red-400 mb-4">{error}</div>}

      {loading && <div className="text-gray-700">Carregando...</div>}

      {!loading && grouped.length === 0 && (
        <div className="text-gray-600">Nenhum agendamento encontrado com os filtros selecionados.</div>
      )}

      <div className="space-y-6">
        {grouped.map(([date, rows]) => {
          // Parse da data no formato yyyy-mm-dd evitando problemas de fuso horário
          const [year, month, day] = date.split('-').map(Number);
          const dateObj = new Date(year, month - 1, day);
          
          return (
          <div key={date}>
            <h3 className="text-[#5b3310] font-bold text-lg mb-3 pb-2 border-b-2 border-gray-300">
              {dateObj.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rows.sort((a,b) => b.time.localeCompare(a.time)).map(b => (
                <div key={b.booking_id} className="bg-white p-5 rounded-lg border border-gray-300 hover:border-[#5b3310] transition-colors duration-300">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-lg font-bold text-gray-900">{b.client_name}</h4>
                        {b.is_courtesy && (
                          <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-950 border border-amber-300">
                            CORTESIA
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{b.client_phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#3b200d] text-lg">R${Number(b.total_price).toFixed(2)}</p>
                      <p className="text-sm text-gray-700">{b.time.slice(0,5)}</p>
                    </div>
                  </div>
                  <div className="border-t border-gray-300 my-3"></div>
                  <div>
                    <h5 className="font-semibold mb-2 text-gray-200">Serviços:</h5>
                    <ul className="list-disc list-inside text-gray-700 space-y-1">
                      {(b.services || []).map(s => (
                        <li key={s.id}>{s.name}</li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Status da solicitação / agendamento */}
                  <div className="border-t border-gray-300 my-3 pt-3">
                    {b.status === 'pending' && (
                      <div className="mb-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                        O cliente enviou uma <strong>solicitação de horário</strong>. Você pode aceitar, recusar ou sugerir outro horário (o cliente precisará confirmar a troca).
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Status:</span>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${statusMeta(b.status).className}`}>
                        {statusMeta(b.status).label}
                      </span>
                    </div>
                    {/* Ações para solicitação pendente */}
                    <div className="flex flex-col gap-2">
                      {(() => {
                        const rr = b.reschedule_request;
                        const pendingSwap = rr?.status === 'pending';
                        const clientAskedSwap = pendingSwap && (rr!.requested_by === 'client' || !rr!.requested_by);
                        const adminProposedSwap = pendingSwap && rr!.requested_by === 'admin';

                        if (b.status === 'pending' && adminProposedSwap) {
                          return (
                            <>
                              <div className="p-2 rounded-lg bg-sky-50 border border-sky-200 text-xs text-sky-900">
                                <strong>Horário alternativo sugerido.</strong> Aguardando confirmação do cliente para{' '}
                                {new Date(rr!.requested_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}{' '}
                                às {rr!.requested_time.slice(0, 5)} (pedido original:{' '}
                                {new Date(rr!.original_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} às{' '}
                                {rr!.original_time.slice(0, 5)}).
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    respondToRescheduleRequest(rr!.id, 'reject', 'Proposta de horário revogada pelo espaço.')
                                  }
                                  disabled={respondingToRequest === rr!.id || updatingStatus === b.booking_id}
                                  className="flex-1 min-w-[140px] bg-gray-700 hover:bg-gray-800 disabled:bg-gray-400 text-white font-semibold px-3 py-2 rounded text-sm"
                                >
                                  {respondingToRequest === rr!.id ? 'Atualizando...' : 'Revogar proposta'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => requestRejectReasonAndReject(b.booking_id)}
                                  disabled={updatingStatus === b.booking_id || respondingToRequest === rr!.id}
                                  className="flex-1 min-w-[140px] bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold px-3 py-2 rounded text-sm"
                                >
                                  {updatingStatus === b.booking_id ? 'Atualizando...' : 'Recusar solicitação'}
                                </button>
                              </div>
                            </>
                          );
                        }

                        if (b.status === 'pending' && clientAskedSwap) {
                          return (
                            <p className="text-xs text-gray-600 mb-1">
                              Resolva primeiro o pedido de troca de horário do cliente (abaixo).
                            </p>
                          );
                        }

                        if (b.status === 'pending' && !pendingSwap) {
                          return (
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => updateBookingStatus(b.booking_id, 'scheduled')}
                                disabled={updatingStatus === b.booking_id}
                                className="flex-1 min-w-[100px] bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold px-3 py-2 rounded text-sm transition-colors"
                              >
                                {updatingStatus === b.booking_id ? 'Atualizando...' : 'Aceitar'}
                              </button>
                              <button
                                type="button"
                                onClick={() => requestRejectReasonAndReject(b.booking_id)}
                                disabled={updatingStatus === b.booking_id}
                                className="flex-1 min-w-[100px] bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold px-3 py-2 rounded text-sm transition-colors"
                              >
                                {updatingStatus === b.booking_id ? 'Atualizando...' : 'Recusar'}
                              </button>
                              <button
                                type="button"
                                onClick={() => openProposeModal(b)}
                                disabled={updatingStatus === b.booking_id}
                                className="flex-1 min-w-[120px] bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold px-3 py-2 rounded text-sm transition-colors"
                              >
                                Trocar horário
                              </button>
                            </div>
                          );
                        }

                        if (b.status === 'scheduled') {
                          return (
                            <button
                              type="button"
                              onClick={() => updateBookingStatus(b.booking_id, 'completed')}
                              disabled={updatingStatus === b.booking_id}
                              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold px-3 py-2 rounded text-sm transition-colors"
                            >
                              {updatingStatus === b.booking_id ? 'Atualizando...' : '✓ Marcar como Concluído'}
                            </button>
                          );
                        }

                        if (b.status === 'completed') {
                          return (
                            <button
                              type="button"
                              onClick={() => updateBookingStatus(b.booking_id, 'scheduled')}
                              disabled={updatingStatus === b.booking_id}
                              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold px-3 py-2 rounded text-sm transition-colors"
                            >
                              {updatingStatus === b.booking_id ? 'Atualizando...' : '↩ Voltar para Aprovado'}
                            </button>
                          );
                        }

                        return (
                          <button
                            type="button"
                            onClick={() => updateBookingStatus(b.booking_id, 'pending')}
                            disabled={updatingStatus === b.booking_id}
                            className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold px-3 py-2 rounded text-sm transition-colors"
                          >
                            {updatingStatus === b.booking_id ? 'Atualizando...' : '↺ Reabrir solicitação'}
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                  
                  {/* Pedido de troca iniciado pelo cliente (admin aceita/recusa aqui) */}
                  {b.reschedule_request?.status === 'pending' &&
                    (b.reschedule_request.requested_by === 'client' || !b.reschedule_request.requested_by) && (
                    <div className="border-t border-gray-300 my-3 pt-3">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                        <p className="text-sm font-semibold text-yellow-800 mb-2">
                          ⏳ Cliente pediu troca de horário
                        </p>
                        <p className="text-xs text-yellow-700 mb-1">
                          <span className="font-medium">Horário do pedido atual:</span> {new Date(b.reschedule_request.original_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} às {b.reschedule_request.original_time.slice(0,5)}
                        </p>
                        <p className="text-xs text-yellow-700">
                          <span className="font-medium">Novo horário pedido pelo cliente:</span> {new Date(b.reschedule_request.requested_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} às {b.reschedule_request.requested_time.slice(0,5)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => respondToRescheduleRequest(b.reschedule_request!.id, 'accept')}
                          disabled={respondingToRequest === b.reschedule_request!.id}
                          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold px-3 py-2 rounded text-sm transition-colors"
                        >
                          {respondingToRequest === b.reschedule_request!.id ? 'Processando...' : '✓ Aceitar'}
                        </button>
                        <button
                          onClick={() => {
                            const message = prompt('Motivo da rejeição (opcional):');
                            if (message !== null) {
                              respondToRescheduleRequest(b.reschedule_request!.id, 'reject', message || undefined);
                            }
                          }}
                          disabled={respondingToRequest === b.reschedule_request!.id}
                          className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold px-3 py-2 rounded text-sm transition-colors"
                        >
                          {respondingToRequest === b.reschedule_request!.id ? 'Processando...' : '✗ Rejeitar'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          );
        })}
      </div>

      {proposeBookingId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white rounded-2xl border border-gray-300 shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xl font-bold text-gray-900">Propor outro horário</h4>
              <button
                type="button"
                onClick={() => !proposeSubmitting && setProposeBookingId(null)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              O cliente receberá o novo horário e precisará confirmar antes do agendamento ser concluído.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data sugerida</label>
                <input
                  type="date"
                  value={proposeDate}
                  onChange={(e) => setProposeDate(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Horário sugerido</label>
                <input
                  type="time"
                  value={proposeTime}
                  onChange={(e) => setProposeTime(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-900"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={proposeSubmitting}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-800"
                  onClick={() => setProposeBookingId(null)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={proposeSubmitting}
                  className="px-4 py-2 rounded-lg bg-[#3b200d] text-white font-semibold hover:bg-[#5b3310] disabled:opacity-50"
                  onClick={submitAdminProposeReschedule}
                >
                  {proposeSubmitting ? 'Enviando...' : 'Enviar proposta'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentsView;

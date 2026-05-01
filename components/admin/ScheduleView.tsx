import React, { useEffect, useMemo, useState } from 'react';
import { CalendarIcon } from '../icons';

type Professional = {
  id: string;
  name: string;
}

type BookingRow = {
  booking_id: string;
  date: string; // yyyy-mm-dd
  time: string; // HH:MM:SS
  professional_id: string | null;
  /** pending = solicitação; scheduled = aceito no calendário */
  status?: string;
  is_courtesy?: boolean;
  rejection_reason?: string | null;
  professional_name?: string | null;
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
}

/** Valor do filtro: string vazio = todos os profissionais */
const ALL_PROFESSIONALS_VALUE = '';

const ScheduleView: React.FC = () => {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selected, setSelected] = useState<string>(ALL_PROFESSIONALS_VALUE);
  const showAllProfessionals = selected === ALL_PROFESSIONALS_VALUE;
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [monthSelectedDate, setMonthSelectedDate] = useState<Date | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [proposeBookingId, setProposeBookingId] = useState<string | null>(null);
  const [proposeDate, setProposeDate] = useState('');
  const [proposeTime, setProposeTime] = useState('');
  const [proposeSubmitting, setProposeSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/professionals');
        const data = await res.json();
        if (res.ok) {
          setProfessionals((data.professionals || []).map((p: any) => ({ id: p.id, name: p.name })));
        }
      } catch {}
    })();
  }, []);

  const formatDate = (d: Date) => d.toISOString().slice(0,10);
  const startOfWeek = (d: Date) => {
    const day = (d.getDay() + 6) % 7; // Monday=0
    const r = new Date(d);
    r.setDate(d.getDate() - day);
    r.setHours(0,0,0,0);
    return r;
  };
  const endOfWeek = (d: Date) => {
    const r = startOfWeek(d);
    r.setDate(r.getDate() + 6);
    r.setHours(23,59,59,999);
    return r;
  };
  const startOfMonth = (d: Date) => {
    const r = new Date(d.getFullYear(), d.getMonth(), 1);
    r.setHours(0,0,0,0);
    return r;
  };
  const endOfMonth = (d: Date) => {
    const r = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    r.setHours(23,59,59,999);
    return r;
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (selected) qs.set('professional_id', selected);
      // limitar janela de tempo conforme a visão
      if (view === 'day') {
        const from = formatDate(currentDate);
        const to = formatDate(currentDate);
        qs.set('from', from);
        qs.set('to', to);
      } else if (view === 'week') {
        const from = formatDate(startOfWeek(currentDate));
        const to = formatDate(endOfWeek(currentDate));
        qs.set('from', from);
        qs.set('to', to);
      } else {
        const from = formatDate(startOfMonth(currentDate));
        const to = formatDate(endOfMonth(currentDate));
        qs.set('from', from);
        qs.set('to', to);
      }
      const res = await fetch(`/api/bookings?${qs.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erro ao carregar agenda');
      setBookings(data.bookings || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, view, currentDate]);

  const updateBookingStatus = async (bookingId: string, status: 'scheduled' | 'rejected') => {
    let rejectionReason: string | null = null;
    if (status === 'rejected') {
      const reason = prompt('Informe o motivo da recusa (obrigatório):');
      if (reason === null) return;
      rejectionReason = reason.trim();
      if (!rejectionReason) {
        alert('O motivo da recusa é obrigatório.');
        return;
      }
    }
    try {
      setUpdatingStatus(bookingId);
      const res = await fetch('/api/bookings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: bookingId, status, rejection_reason: rejectionReason }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data?.error || 'Erro ao atualizar status');
      await load();
    } catch (e: any) {
      alert(e?.message || 'Erro ao atualizar status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const openProposeModal = (b: BookingRow) => {
    setProposeBookingId(b.booking_id);
    setProposeDate(b.date || '');
    setProposeTime((b.time || '').slice(0, 5));
  };

  const submitPropose = async () => {
    if (!proposeBookingId || !proposeDate || !proposeTime) {
      alert('Informe data e horário para propor.');
      return;
    }
    try {
      setProposeSubmitting(true);
      const res = await fetch('/api/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'admin-propose-reschedule',
          booking_id: proposeBookingId,
          date: proposeDate,
          time: proposeTime,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data?.error || 'Erro ao propor horário');
      setProposeBookingId(null);
      await load();
    } catch (e: any) {
      alert(e?.message || 'Erro ao propor horário');
    } finally {
      setProposeSubmitting(false);
    }
  };

  const scheduleStatusBadge = (s?: string) => {
    switch (s) {
      case 'pending':
        return <span className="text-[10px] uppercase font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">solicitação</span>;
      case 'scheduled':
      case 'completed':
        return null;
      case 'rejected':
      case 'cancelled':
        return <span className="text-[10px] uppercase font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded">{s === 'cancelled' ? 'cancelado' : 'recusado'}</span>;
      default:
        return null;
    }
  };

  const courtesyBadge = (b: BookingRow) =>
    b.is_courtesy ? (
      <span className="text-[10px] font-bold text-amber-950 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300 shrink-0">CORTESIA</span>
    ) : null;

  const grouped = useMemo(() => {
    const groups = new Map<string, BookingRow[]>();
    bookings.forEach(b => {
      const key = b.date;
      const arr = groups.get(key) || [];
      arr.push(b);
      groups.set(key, arr);
    });
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [bookings]);

  const monthSelectedRows = monthSelectedDate
    ? (grouped.find(([d]) => d === formatDate(monthSelectedDate))?.[1] || []).sort((a, b) => a.time.localeCompare(b.time))
    : [];

  const renderPendingActions = (b: BookingRow, compact = false) => {
    if (b.status !== 'pending') return null;
    return (
      <div className={`mt-3 ${compact ? 'space-y-1' : 'space-y-2'}`}>
        <button
          type="button"
          onClick={() => updateBookingStatus(b.booking_id, 'scheduled')}
          disabled={updatingStatus === b.booking_id}
          className={`${compact ? 'w-full text-xs px-2 py-1.5' : 'w-full text-sm px-3 py-2'} rounded bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold`}
        >
          {updatingStatus === b.booking_id ? 'Atualizando...' : 'Aceitar'}
        </button>
        <button
          type="button"
          onClick={() => updateBookingStatus(b.booking_id, 'rejected')}
          disabled={updatingStatus === b.booking_id}
          className={`${compact ? 'w-full text-xs px-2 py-1.5' : 'w-full text-sm px-3 py-2'} rounded bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold`}
        >
          {updatingStatus === b.booking_id ? 'Atualizando...' : 'Recusar'}
        </button>
        <button
          type="button"
          onClick={() => openProposeModal(b)}
          disabled={updatingStatus === b.booking_id}
          className={`${compact ? 'w-full text-xs px-2 py-1.5' : 'w-full text-sm px-3 py-2'} rounded border border-[#5b3310] text-[#5b3310] hover:bg-[#f5f0eb] font-semibold`}
        >
          Trocar horário
        </button>
      </div>
    );
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">Agenda por Profissional</h2>
        <div className="flex items-center justify-center gap-3">
          <CalendarIcon className="w-6 h-6 text-[#5b3310]" />
          <select
            value={selected}
            onChange={e => setSelected(e.target.value)}
            className="bg-white text-gray-900 border border-gray-300 rounded px-3 py-2 min-w-[220px]"
          >
            <option value={ALL_PROFESSIONALS_VALUE}>Todos os profissionais</option>
            {professionals.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div className="inline-flex rounded overflow-hidden border border-gray-300">
          <button onClick={() => setView('month')} className={`px-3 py-2 ${view==='month'?'bg-[#3b200d] text-white':'bg-white text-gray-700'}`}>Mês</button>
          <button onClick={() => setView('week')} className={`px-3 py-2 ${view==='week'?'bg-[#3b200d] text-white':'bg-white text-gray-700'}`}>Semana</button>
          <button onClick={() => setView('day')} className={`px-3 py-2 ${view==='day'?'bg-[#3b200d] text-white':'bg-white text-gray-700'}`}>Dia</button>
        </div>
        <div className="inline-flex items-center gap-2">
          <button onClick={() => setCurrentDate(new Date())} className="px-3 py-2 bg-gray-200 text-gray-900 rounded">Hoje</button>
          <button
            onClick={() => {
              const d = new Date(currentDate);
              if (view === 'day') d.setDate(d.getDate() - 1);
              else if (view === 'week') d.setDate(d.getDate() - 7);
              else d.setMonth(d.getMonth() - 1);
              setCurrentDate(d);
            }}
            className="px-3 py-2 bg-white text-gray-900 rounded border border-gray-300"
          >
            ◀
          </button>
          <div className="text-gray-700 font-semibold min-w-[140px] text-center">
            {view === 'day' && currentDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
            {view === 'week' && `${startOfWeek(currentDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - ${endOfWeek(currentDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`}
            {view === 'month' && currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </div>
          <button
            onClick={() => {
              const d = new Date(currentDate);
              if (view === 'day') d.setDate(d.getDate() + 1);
              else if (view === 'week') d.setDate(d.getDate() + 7);
              else d.setMonth(d.getMonth() + 1);
              setCurrentDate(d);
            }}
            className="px-3 py-2 bg-white text-gray-900 rounded border border-gray-300"
          >
            ▶
          </button>
        </div>
      </div>

      {error && <div className="text-red-400 mb-4">{error}</div>}

      {loading && <div className="text-gray-700">Carregando agenda...</div>}

      {!loading && grouped.length === 0 && view === 'day' && (
        <div className="text-gray-600">Nenhum agendamento para este período.</div>
      )}

      {/* Dia */}
      {!loading && view === 'day' && (
        <div className="mb-6">
          <h3 className="text-[#5b3310] font-bold text-lg mb-3 pb-2 border-b-2 border-gray-300">
            {currentDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(grouped.find(([d]) => d === formatDate(currentDate))?.[1] || [])
              .sort((a,b) => a.time.localeCompare(b.time))
              .map(b => (
              <div key={b.booking_id} className="bg-white p-5 rounded-lg border border-gray-300">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-lg font-bold text-gray-900">{b.client_name}</h4>
                      {courtesyBadge(b)}
                      {scheduleStatusBadge(b.status)}
                    </div>
                    <p className="text-sm text-gray-600">{b.client_phone}</p>
                    {showAllProfessionals && b.professional_name && (
                      <p className="text-xs text-[#5b3310] font-medium mt-1">{b.professional_name}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#3b200d] text-lg">R${Number(b.total_price).toFixed(2)}</p>
                    <p className="text-sm text-gray-700">{b.time.slice(0,5)}</p>
                  </div>
                </div>
                <div className="border-t border-gray-600 my-3"></div>
                <div>
                  <h5 className="font-semibold mb-2 text-gray-700">Serviços:</h5>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    {(b.services || []).map(s => (<li key={s.id}>{s.name}</li>))}
                  </ul>
                </div>
                {renderPendingActions(b)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Semana */}
      {!loading && view === 'week' && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {Array.from({ length: 7 }).map((_, i) => {
            const day = new Date(startOfWeek(currentDate));
            day.setDate(day.getDate() + i);
            const key = formatDate(day);
            const rows = grouped.find(([d]) => d === key)?.[1] || [];
            return (
              <div key={key} className="bg-white rounded border border-gray-300 p-3">
                <div
                  className="font-semibold text-gray-700 mb-2 cursor-pointer hover:text-[#5b3310]"
                  onClick={() => { setCurrentDate(day); setView('day'); }}
                  title="Ver dia"
                >
                  {day.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' })}
                </div>
                {rows.length === 0 ? (
                  <div className="text-gray-500 text-sm">Sem agendamentos</div>
                ) : (
                  <ul className="space-y-2">
                    {rows.sort((a,b) => a.time.localeCompare(b.time)).map(b => (
                      <li key={b.booking_id} className="bg-gray-200/60 rounded px-2 py-1 space-y-0.5">
                        <div className="flex justify-between gap-1 items-center">
                          <span className="text-gray-700">{b.time.slice(0,5)}</span>
                          <span className="text-gray-700 truncate flex items-center gap-1 min-w-0">
                            {courtesyBadge(b)}
                            {b.client_name}
                            {scheduleStatusBadge(b.status)}
                          </span>
                        </div>
                        {showAllProfessionals && b.professional_name && (
                          <div className="text-[10px] text-[#5b3310] font-medium truncate">{b.professional_name}</div>
                        )}
                        {renderPendingActions(b, true)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Mês */}
      {!loading && view === 'month' && (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-6 items-start">
          <div className="grid grid-cols-7 gap-2">
            {(() => {
              const first = startOfMonth(currentDate);
              const start = startOfWeek(first);
              const cells: Date[] = [];
              for (let i = 0; i < 42; i++) {
                const d = new Date(start);
                d.setDate(start.getDate() + i);
                cells.push(d);
              }
              return cells.map((day, idx) => {
                const key = formatDate(day);
                const inMonth = day.getMonth() === currentDate.getMonth();
                const rows = grouped.find(([d]) => d === key)?.[1] || [];
                const isSelected = monthSelectedDate && formatDate(monthSelectedDate) === key;
                return (
                  <div
                    key={idx}
                    className={`p-2 rounded border cursor-pointer ${inMonth ? 'border-gray-300 bg-white hover:border-[#5b3310]' : 'border-gray-200 bg-gray-50/40'} ${isSelected ? '!border-[#5b3310] ring-1 ring-[#5b3310]/40' : ''}`}
                    style={{ aspectRatio: '1 / 1' }}
                    onClick={() => { setMonthSelectedDate(day); }}
                    title="Listar agendamentos do dia na lateral direita"
                  >
                    <div className={`text-sm mb-2 ${inMonth ? 'text-gray-700' : 'text-gray-500'}`}>
                      {day.getDate().toString().padStart(2,'0')}
                    </div>
                    <div className="mt-auto">
                      <span className={`text-lg font-bold ${rows.length ? 'text-[#3b200d]' : 'text-gray-500'}`}>
                        {rows.length ? rows.length : '—'}
                      </span>
                    </div>
                  </div>
                );
              });
            })()}
          </div>

          <aside className="bg-white rounded-lg border border-gray-300 p-4 xl:sticky xl:top-4">
            {!monthSelectedDate ? (
              <div className="text-gray-600">Selecione um dia no calendário para ver os agendamentos.</div>
            ) : (
              <>
                <h3 className="text-[#5b3310] font-bold text-lg mb-3 pb-2 border-b-2 border-gray-300">
                  {monthSelectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                </h3>

                {monthSelectedRows.length === 0 ? (
                  <div className="text-gray-600">Sem agendamentos para o dia selecionado.</div>
                ) : (
                  <div className="space-y-3 max-h-[70vh] overflow-auto pr-1">
                    {monthSelectedRows.map(b => (
                      <div key={b.booking_id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-base font-bold text-gray-900">{b.client_name}</h4>
                              {courtesyBadge(b)}
                              {scheduleStatusBadge(b.status)}
                            </div>
                            <p className="text-sm text-gray-600">{b.client_phone}</p>
                            {showAllProfessionals && b.professional_name && (
                              <p className="text-xs text-[#5b3310] font-medium mt-1">{b.professional_name}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-[#3b200d]">R${Number(b.total_price).toFixed(2)}</p>
                            <p className="text-sm text-gray-700">{b.time.slice(0,5)}</p>
                          </div>
                        </div>
                        <div className="border-t border-gray-200 my-3"></div>
                        <div>
                          <h5 className="font-semibold mb-2 text-gray-700">Serviços:</h5>
                          <ul className="list-disc list-inside text-gray-700 space-y-1">
                            {(b.services || []).map(s => (<li key={s.id}>{s.name}</li>))}
                          </ul>
                        </div>
                        {renderPendingActions(b)}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </aside>
        </div>
      )}

      {proposeBookingId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white rounded-2xl border border-gray-300 shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xl font-bold text-gray-900">Propor novo horário</h4>
              <button onClick={() => setProposeBookingId(null)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nova data</label>
                <input
                  type="date"
                  value={proposeDate}
                  onChange={(e) => setProposeDate(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Novo horário</label>
                <input
                  type="time"
                  value={proposeTime}
                  onChange={(e) => setProposeTime(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-900"
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  className="px-4 py-2 rounded-lg border border-gray-300"
                  onClick={() => setProposeBookingId(null)}
                >
                  Fechar
                </button>
                <button
                  className="px-4 py-2 rounded-lg bg-[#3b200d] text-white font-semibold hover:bg-[#5b3310] disabled:opacity-60"
                  onClick={submitPropose}
                  disabled={proposeSubmitting}
                >
                  {proposeSubmitting ? 'Salvando...' : 'Salvar proposta'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ScheduleView;


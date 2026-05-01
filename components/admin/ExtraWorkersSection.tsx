import React, { useCallback, useEffect, useState } from 'react';
import { PlusCircleIcon, TrashIcon, PencilIcon } from '../icons';

type ServiceOpt = { id: number; name: string };

type ExtraWorker = {
  id: string;
  full_name: string;
  work_time_from: string;
  work_time_to: string;
  working_today: boolean;
  service_ids: number[];
};

const ExtraWorkersSection: React.FC = () => {
  const [extras, setExtras] = useState<ExtraWorker[]>([]);
  const [services, setServices] = useState<ServiceOpt[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [timeFrom, setTimeFrom] = useState('09:00');
  const [timeTo, setTimeTo] = useState('18:00');
  const [workingToday, setWorkingToday] = useState(false);
  const [selectedServices, setSelectedServices] = useState<Set<number>>(new Set());

  const [editingId, setEditingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [exRes, srvRes] = await Promise.all([fetch('/api/extra-workers'), fetch('/api/services')]);
      const exData = await exRes.json();
      const srvData = await srvRes.json();
      if (!exRes.ok) throw new Error(exData?.error || 'Erro ao carregar trabalhadores extras');
      if (srvRes.ok && srvData.services) {
        setServices(
          (srvData.services as Array<{ id: number; name: string }>).map((s) => ({ id: s.id, name: s.name }))
        );
      }
      setExtras((exData.extra_workers || []) as ExtraWorker[]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setEditingId(null);
    setFullName('');
    setTimeFrom('09:00');
    setTimeTo('18:00');
    setWorkingToday(false);
    setSelectedServices(new Set());
  };

  const startEdit = (x: ExtraWorker) => {
    setEditingId(x.id);
    setFullName(x.full_name);
    setTimeFrom(x.work_time_from?.slice(0, 5) || '09:00');
    setTimeTo(x.work_time_to?.slice(0, 5) || '18:00');
    setWorkingToday(x.working_today);
    setSelectedServices(new Set(x.service_ids || []));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleService = (id: number) => {
    setSelectedServices((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = fullName.trim();
    if (!name) {
      setError('Informe o nome completo.');
      return;
    }
    if (selectedServices.size === 0) {
      setError('Marque ao menos um serviço que o extra pode atender.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body = {
        full_name: name,
        work_time_from: timeFrom,
        work_time_to: timeTo,
        working_today: workingToday,
        service_ids: [...selectedServices],
        ...(editingId ? { id: editingId } : {}),
      };
      const res = await fetch('/api/extra-workers', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Falha ao salvar');
      resetForm();
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!window.confirm('Excluir este trabalhador extra?')) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/extra-workers?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Falha ao excluir');
      if (editingId === id) resetForm();
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao excluir');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-12 pt-10 border-t-2 border-gray-200">
      <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">Trabalhadores extras (substitutos)</h3>
      <p className="text-sm text-gray-600 max-w-3xl mx-auto text-center mb-6">
        Cadastre quem cobre ausências. O extra <strong>não abre vagas a mais</strong>: o horário continua o mesmo do
        profissional titular; o nome dele só aparece na escolha de serviços para o cliente quando estiver marcado{' '}
        <strong>trabalhando hoje</strong>, nos serviços que você vincular.
      </p>

      <form
        onSubmit={onSubmit}
        className="bg-white p-4 md:p-6 rounded-lg border border-gray-300 mb-8 max-w-4xl mx-auto space-y-4"
      >
        <div className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-gray-50 text-gray-900 rounded px-3 py-2 border border-gray-300 focus:border-[#5b3310]"
              placeholder="Nome do substituto"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Horário de trabalho (início)</label>
            <input
              type="time"
              value={timeFrom}
              onChange={(e) => setTimeFrom(e.target.value)}
              className="w-full bg-gray-50 text-gray-900 rounded px-3 py-2 border border-gray-300"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Horário de trabalho (fim)</label>
            <input
              type="time"
              value={timeTo}
              onChange={(e) => setTimeTo(e.target.value)}
              className="w-full bg-gray-50 text-gray-900 rounded px-3 py-2 border border-gray-300"
              required
            />
          </div>
        </div>

        <div>
          <label className="inline-flex items-center gap-2 text-gray-800 font-medium cursor-pointer">
            <input type="checkbox" checked={workingToday} onChange={(e) => setWorkingToday(e.target.checked)} />
            Trabalhando hoje (nome aparece no site nos serviços marcados abaixo)
          </label>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Serviços que pode atender (substituindo a equipe)</p>
          <div className="max-h-52 overflow-y-auto border border-gray-200 rounded-lg p-3 grid sm:grid-cols-2 gap-2 bg-gray-50/80">
            {services.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum serviço cadastrado.</p>
            ) : (
              services.map((s) => (
                <label key={s.id} className="flex items-start gap-2 text-sm text-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedServices.has(s.id)}
                    onChange={() => toggleService(s.id)}
                    className="mt-0.5"
                  />
                  <span>{s.name}</span>
                </label>
              ))
            )}
          </div>
        </div>

        {error && <div className="text-red-600 text-sm">{error}</div>}

        <div className="flex flex-wrap gap-2 justify-end">
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-800 bg-white hover:bg-gray-50"
            >
              Cancelar edição
            </button>
          )}
          <button
            type="submit"
            disabled={saving || loading}
            className="inline-flex items-center justify-center gap-2 bg-[#3b200d] hover:bg-[#5b3310] text-white font-bold py-2 px-5 rounded-lg disabled:opacity-60"
          >
            <PlusCircleIcon className="w-5 h-5" />
            {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Cadastrar extra'}
          </button>
        </div>
      </form>

      <div className="max-w-4xl mx-auto">
        <h4 className="text-lg font-semibold text-gray-900 mb-3">Extras cadastrados</h4>
        {loading && extras.length === 0 && <p className="text-gray-600 text-sm">Carregando...</p>}
        {!loading && extras.length === 0 && <p className="text-gray-600 text-sm">Nenhum extra cadastrado.</p>}

        <div className="hidden md:block bg-white rounded-lg border border-gray-300 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-gray-700 border-b border-gray-300 bg-gray-50">
                <th className="p-3">Nome</th>
                <th className="p-3 whitespace-nowrap">Horário</th>
                <th className="p-3">Hoje</th>
                <th className="p-3">Serviços</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {extras.map((x) => (
                <tr key={x.id} className="border-b border-gray-200 last:border-0">
                  <td className="p-3 text-gray-900 font-medium">{x.full_name}</td>
                  <td className="p-3 text-gray-700 whitespace-nowrap">
                    {x.work_time_from} – {x.work_time_to}
                  </td>
                  <td className="p-3">
                    <span className={x.working_today ? 'text-emerald-600 font-semibold' : 'text-gray-500'}>
                      {x.working_today ? 'Sim' : 'Não'}
                    </span>
                  </td>
                  <td className="p-3 text-gray-600 text-xs max-w-[220px]">
                    {x.service_ids
                      .map((id) => services.find((s) => s.id === id)?.name || `#${id}`)
                      .join(', ')}
                  </td>
                  <td className="p-3 text-right">
                    <button type="button" onClick={() => startEdit(x)} className="text-gray-600 hover:text-blue-600 p-1 mr-2">
                      <PencilIcon className="w-5 h-5 inline" />
                    </button>
                    <button type="button" onClick={() => onDelete(x.id)} className="text-gray-600 hover:text-red-600 p-1">
                      <TrashIcon className="w-5 h-5 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="md:hidden grid gap-3">
          {extras.map((x) => (
            <div key={x.id} className="bg-white rounded-lg border border-gray-300 p-4">
              <div className="flex justify-between gap-2">
                <div>
                  <div className="font-semibold text-gray-900">{x.full_name}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {x.work_time_from} – {x.work_time_to}
                  </div>
                  <div className={`text-sm mt-1 ${x.working_today ? 'text-emerald-600 font-semibold' : 'text-gray-500'}`}>
                    Hoje: {x.working_today ? 'sim' : 'não'}
                  </div>
                  <div className="text-xs text-gray-600 mt-2">
                    {(x.service_ids || [])
                      .map((id) => services.find((s) => s.id === id)?.name || `#${id}`)
                      .join(', ')}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button type="button" onClick={() => startEdit(x)} className="text-blue-600">
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button type="button" onClick={() => onDelete(x.id)} className="text-red-600">
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExtraWorkersSection;

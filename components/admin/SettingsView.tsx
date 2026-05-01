import React, { useEffect, useState } from 'react';
import { PlusCircleIcon, TrashIcon, PencilIcon } from '../icons';

type PaymentMethod = {
  id: number;
  name: string;
  display_order: number;
  is_active: boolean;
};

const SettingsView: React.FC = () => {
  const [items, setItems] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [courtesyLimit, setCourtesyLimit] = useState<number>(0);
  const [savingCourtesyLimit, setSavingCourtesyLimit] = useState(false);
  const [name, setName] = useState('');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editDisplayOrder, setEditDisplayOrder] = useState(0);
  const [editActive, setEditActive] = useState(true);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/payment-methods');
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erro ao carregar formas de pagamento');
      setItems((data.payment_methods || []) as PaymentMethod[]);
    } catch (e: any) {
      setError(e?.message || 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  };

  const loadCourtesyLimit = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erro ao carregar configuração de cortesia');
      setCourtesyLimit(Number(data?.daily_courtesy_limit || 0));
    } catch (e: any) {
      setError(e?.message || 'Erro ao carregar configuração de cortesia');
    }
  };

  useEffect(() => {
    load();
    loadCourtesyLimit();
  }, []);

  const saveCourtesyLimit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCourtesyLimit(true);
    setError(null);
    try {
      const normalized = Number.isFinite(courtesyLimit) ? Math.max(0, Math.floor(courtesyLimit)) : 0;
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ daily_courtesy_limit: normalized }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Erro ao salvar limite de cortesias');
      setCourtesyLimit(Number(data?.daily_courtesy_limit || normalized));
      alert('Limite diário de cortesias atualizado com sucesso.');
    } catch (e: any) {
      setError(e?.message || 'Erro ao salvar limite de cortesias');
    } finally {
      setSavingCourtesyLimit(false);
    }
  };

  const createItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), display_order: displayOrder, is_active: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Erro ao criar forma de pagamento');
      setName('');
      setDisplayOrder(0);
      await load();
    } catch (e: any) {
      setError(e?.message || 'Erro ao criar');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (item: PaymentMethod) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditDisplayOrder(item.display_order);
    setEditActive(item.is_active);
  };

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/payment-methods', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingId,
          name: editName.trim(),
          display_order: editDisplayOrder,
          is_active: editActive,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Erro ao atualizar');
      setEditingId(null);
      await load();
    } catch (e: any) {
      setError(e?.message || 'Erro ao atualizar');
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (id: number) => {
    if (!window.confirm('Excluir esta forma de pagamento?')) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/payment-methods?id=${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Erro ao excluir');
      await load();
    } catch (e: any) {
      setError(e?.message || 'Erro ao excluir');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">Configurações</h2>
      <div className="bg-white rounded-lg border border-gray-300 p-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Limite diário de cortesias</h3>
        <form onSubmit={saveCourtesyLimit} className="grid md:grid-cols-[minmax(0,1fr)_auto] gap-3 items-end">
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Quantidade máxima de cortesias por dia
            </label>
            <input
              type="number"
              min={0}
              value={courtesyLimit}
              onChange={(e) => setCourtesyLimit(Number(e.target.value) || 0)}
              className="w-full bg-gray-50 text-gray-900 border border-gray-300 rounded px-3 py-2"
            />
            <p className="text-xs text-gray-600 mt-1">
              Defina 0 para não limitar cortesias por dia.
            </p>
          </div>
          <button
            type="submit"
            disabled={savingCourtesyLimit}
            className="inline-flex items-center justify-center gap-2 bg-[#3b200d] hover:bg-[#5b3310] text-white font-bold py-2 px-4 rounded-lg disabled:opacity-60"
          >
            Salvar limite
          </button>
        </form>
      </div>
      <div className="bg-white rounded-lg border border-gray-300 p-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Formas de pagamento</h3>
        <form onSubmit={createItem} className="grid md:grid-cols-3 gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: PIX, Cartão, Dinheiro"
            className="bg-gray-50 text-gray-900 border border-gray-300 rounded px-3 py-2"
          />
          <input
            type="number"
            value={displayOrder}
            onChange={(e) => setDisplayOrder(Number(e.target.value) || 0)}
            placeholder="Ordem"
            className="bg-gray-50 text-gray-900 border border-gray-300 rounded px-3 py-2"
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 bg-[#3b200d] hover:bg-[#5b3310] text-white font-bold py-2 px-4 rounded-lg disabled:opacity-60"
          >
            <PlusCircleIcon className="w-5 h-5" />
            Adicionar
          </button>
        </form>
      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-300 text-gray-700">
              <th className="p-3">Nome</th>
              <th className="p-3">Ordem</th>
              <th className="p-3">Ativo</th>
              <th className="p-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-gray-200/70">
                {editingId === item.id ? (
                  <>
                    <td className="p-3">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-300 rounded px-2 py-1 text-gray-900"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        value={editDisplayOrder}
                        onChange={(e) => setEditDisplayOrder(Number(e.target.value) || 0)}
                        className="w-28 bg-gray-50 border border-gray-300 rounded px-2 py-1 text-gray-900"
                      />
                    </td>
                    <td className="p-3">
                      <label className="inline-flex items-center gap-2 text-gray-700">
                        <input type="checkbox" checked={editActive} onChange={(e) => setEditActive(e.target.checked)} />
                        Ativo
                      </label>
                    </td>
                    <td className="p-3 text-right">
                      <button onClick={saveEdit} className="mr-2 px-3 py-1 rounded bg-emerald-600 text-white">Salvar</button>
                      <button onClick={() => setEditingId(null)} className="px-3 py-1 rounded bg-gray-300 text-gray-800">Cancelar</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-3 text-gray-900">{item.name}</td>
                    <td className="p-3 text-gray-700">{item.display_order}</td>
                    <td className="p-3">
                      <span className={item.is_active ? 'text-emerald-600 font-semibold' : 'text-gray-500'}>
                        {item.is_active ? 'Sim' : 'Não'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button onClick={() => startEdit(item)} className="text-gray-600 hover:text-blue-600 mr-3">
                        <PencilIcon className="w-5 h-5 inline" />
                      </button>
                      <button onClick={() => removeItem(item.id)} className="text-gray-600 hover:text-red-600">
                        <TrashIcon className="w-5 h-5 inline" />
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={4} className="p-4 text-gray-600">Nenhuma forma de pagamento cadastrada.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SettingsView;


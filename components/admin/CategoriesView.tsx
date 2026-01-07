import React, { useEffect, useState } from 'react';
import { PlusCircleIcon, TrashIcon, PencilIcon } from '../icons';

type Category = {
  id: number;
  name: string;
  icon: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const CategoriesView: React.FC = () => {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [displayOrder, setDisplayOrder] = useState(0);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [editDisplayOrder, setEditDisplayOrder] = useState(0);
  const [editActive, setEditActive] = useState<boolean>(true);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/categories?include_inactive=true');
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erro ao carregar categorias');
      // Buscar todas as categorias (incluindo inativas) para o admin
      setItems(data.categories || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nome é obrigatório');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: name.trim(), 
          icon: icon.trim() || null,
          display_order: displayOrder || 0
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erro ao criar categoria');
      setName(''); 
      setIcon('');
      setDisplayOrder(0);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (c: Category) => {
    setEditingId(c.id);
    setEditName(c.name);
    setEditIcon(c.icon || '');
    setEditDisplayOrder(c.display_order);
    setEditActive(c.is_active);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditIcon('');
    setEditDisplayOrder(0);
    setEditActive(true);
  };

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) {
      setError('Nome é obrigatório');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingId,
          name: editName.trim(),
          icon: editIcon.trim() || null,
          display_order: editDisplayOrder || 0,
          is_active: editActive,
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erro ao atualizar categoria');
      cancelEdit();
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir esta categoria?')) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/categories?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erro ao excluir categoria');
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">Gerenciar Categorias</h2>
      
      {error && <div className="mb-4 text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-lg">{error}</div>}
      {loading && <div className="mb-4 text-gray-700">Carregando...</div>}

      {/* Formulário de criação */}
      <div className="bg-white p-6 rounded-lg border border-gray-300 shadow-sm mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Nova Categoria</h3>
        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nome da categoria"
            className="bg-gray-50 text-gray-900 rounded px-3 py-2 outline-none border border-gray-300 focus:border-[#5b3310]"
            required
          />
          <input
            value={icon}
            onChange={e => setIcon(e.target.value)}
            placeholder="Ícone (emoji)"
            className="bg-gray-50 text-gray-900 rounded px-3 py-2 outline-none border border-gray-300 focus:border-[#5b3310]"
          />
          <input
            type="number"
            value={displayOrder}
            onChange={e => setDisplayOrder(Number(e.target.value))}
            placeholder="Ordem de exibição"
            className="bg-gray-50 text-gray-900 rounded px-3 py-2 outline-none border border-gray-300 focus:border-[#5b3310]"
            min="0"
          />
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-[#3b200d] hover:bg-[#5b3310] text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 disabled:opacity-70"
          >
            <PlusCircleIcon className="w-5 h-5" />
            Adicionar
          </button>
        </form>
      </div>

      {/* Lista de categorias */}
      <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100/50">
            <tr>
              <th className="p-4 font-semibold">Ícone</th>
              <th className="p-4 font-semibold">Nome</th>
              <th className="p-4 font-semibold text-center">Ordem</th>
              <th className="p-4 font-semibold text-center">Status</th>
              <th className="p-4 font-semibold text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-300">
            {items.map(item => (
              <tr key={item.id} className="hover:bg-gray-100/40">
                {editingId === item.id ? (
                  <>
                    <td className="p-4">
                      <input
                        value={editIcon}
                        onChange={e => setEditIcon(e.target.value)}
                        className="bg-gray-50 text-gray-900 rounded px-3 py-2 outline-none border border-gray-300 focus:border-[#5b3310] w-full"
                        placeholder="Emoji"
                      />
                    </td>
                    <td className="p-4">
                      <input
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="bg-gray-50 text-gray-900 rounded px-3 py-2 outline-none border border-gray-300 focus:border-[#5b3310] w-full"
                        required
                      />
                    </td>
                    <td className="p-4">
                      <input
                        type="number"
                        value={editDisplayOrder}
                        onChange={e => setEditDisplayOrder(Number(e.target.value))}
                        className="bg-gray-50 text-gray-900 rounded px-3 py-2 outline-none border border-gray-300 focus:border-[#5b3310] w-full text-center"
                        min="0"
                      />
                    </td>
                    <td className="p-4 text-center">
                      <label className="flex items-center justify-center gap-2">
                        <input
                          type="checkbox"
                          checked={editActive}
                          onChange={e => setEditActive(e.target.checked)}
                          className="rounded"
                        />
                        <span className={editActive ? 'text-green-600' : 'text-red-600'}>
                          {editActive ? 'Ativa' : 'Inativa'}
                        </span>
                      </label>
                    </td>
                    <td className="p-4 text-right">
                      <div className="inline-flex space-x-2">
                        <button
                          onClick={saveEdit}
                          disabled={loading}
                          className="text-green-600 hover:text-green-800 font-semibold disabled:opacity-50"
                        >
                          Salvar
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={loading}
                          className="text-gray-600 hover:text-gray-800 font-semibold disabled:opacity-50"
                        >
                          Cancelar
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-4">
                      <span className="text-2xl">{item.icon || '📦'}</span>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold">{item.name}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span>{item.display_order}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={item.is_active ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                        {item.is_active ? 'Ativa' : 'Inativa'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="inline-flex space-x-3">
                        <button
                          onClick={() => startEdit(item)}
                          className="text-gray-700 hover:text-blue-400"
                          title="Editar"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={loading}
                          className="text-gray-700 hover:text-red-400 disabled:opacity-50"
                          title="Excluir"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && !loading && (
          <div className="p-8 text-center text-gray-600">
            Nenhuma categoria cadastrada.
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoriesView;


import React, { useEffect, useState } from 'react';
import { PlusCircleIcon, TrashIcon, PencilIcon } from '../icons';
import { usePermissions } from '../../hooks/usePermissions';

type Admin = {
  id: string;
  username: string;
  name: string;
  email: string | null;
  role?: 'admin' | 'gerente' | 'colaborador';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login: string | null;
}

const AdminsView: React.FC = () => {
  const permissions = usePermissions();
  const [items, setItems] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'gerente' | 'colaborador'>('colaborador');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'gerente' | 'colaborador'>('colaborador');
  const [editActive, setEditActive] = useState<boolean>(true);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth');
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erro ao carregar usuários');
      setItems(data.admins || []);
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
    if (!username.trim() || !password.trim() || !name.trim()) {
      setError('Username, senha e nome são obrigatórios');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: username.trim(), 
          password: password.trim(), 
          name: name.trim(), 
          email: email.trim() || null,
          role: role
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erro ao criar usuário');
      setUsername(''); 
      setPassword(''); 
      setName(''); 
      setEmail('');
      setRole('colaborador');
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (a: Admin) => {
    setEditingId(a.id);
    setEditUsername(a.username);
    setEditPassword(''); // Não mostrar senha atual
    setEditName(a.name);
    setEditEmail(a.email || '');
    setEditRole(a.role || 'colaborador');
    setEditActive(a.is_active);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditUsername('');
    setEditPassword('');
    setEditName('');
    setEditEmail('');
    setEditRole('colaborador');
    setEditActive(true);
  };

  const saveEdit = async () => {
    if (!editingId || !editUsername.trim() || !editName.trim()) {
      setError('Username e nome são obrigatórios');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const body: any = {
        id: editingId,
        username: editUsername.trim(),
        name: editName.trim(),
        email: editEmail.trim() || null,
        role: editRole,
        is_active: editActive,
      };
      
      // Só atualizar senha se foi fornecida
      if (editPassword.trim()) {
        body.password = editPassword.trim();
      }

      const res = await fetch('/api/auth', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Erro ao atualizar usuário');
      await load();
      cancelEdit();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteAdmin = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja desativar este usuário? Ele não poderá mais fazer login.')) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/auth?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Erro ao desativar usuário');
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  // Verificar permissões
  if (!permissions.canManageUsers) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center bg-red-50 border border-red-200 rounded-lg p-8 max-w-md">
          <h3 className="text-xl font-bold text-red-800 mb-2">Acesso Negado</h3>
          <p className="text-red-700">
            Você não tem permissão para acessar esta página. Apenas administradores podem gerenciar usuários.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">Usuários Administradores</h2>

      <form onSubmit={onSubmit} className="bg-white p-4 rounded-lg border border-gray-300 mb-6 grid md:grid-cols-6 gap-3">
        <input
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="Username"
          className="bg-gray-50 text-gray-900 rounded px-3 py-2 outline-none border border-gray-300 focus:border-[#5b3310]"
        />
        <input
          value={password}
          onChange={e => setPassword(e.target.value)}
          type="password"
          placeholder="Senha"
          className="bg-gray-50 text-gray-900 rounded px-3 py-2 outline-none border border-gray-300 focus:border-[#5b3310]"
        />
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Nome completo"
          className="bg-gray-50 text-gray-900 rounded px-3 py-2 outline-none border border-gray-300 focus:border-[#5b3310]"
        />
        <input
          value={email}
          onChange={e => setEmail(e.target.value)}
          type="email"
          placeholder="E-mail (opcional)"
          className="bg-gray-50 text-gray-900 rounded px-3 py-2 outline-none border border-gray-300 focus:border-[#5b3310]"
        />
        <select
          value={role}
          onChange={e => setRole(e.target.value as 'admin' | 'gerente' | 'colaborador')}
          className="bg-gray-50 text-gray-900 rounded px-3 py-2 outline-none border border-gray-300 focus:border-[#5b3310]"
        >
          <option value="colaborador">Colaborador</option>
          <option value="gerente">Gerente</option>
          <option value="admin">Admin</option>
        </select>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 bg-[#3b200d] hover:bg-[#5b3310] text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 disabled:opacity-70"
        >
          <PlusCircleIcon className="w-5 h-5" />
          Adicionar
        </button>
      </form>

      {error && <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 mb-4">{error}</div>}

      {loading && items.length === 0 && (
        <div className="text-center text-gray-600 py-8">Carregando...</div>
      )}

      {/* Tabela (desktop) */}
      <div className="hidden md:block bg-white rounded-lg border border-gray-300 overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-gray-700 border-b border-gray-300">
              <th className="p-3">Username</th>
              <th className="p-3">Nome</th>
              <th className="p-3">E-mail</th>
              <th className="p-3">Tipo</th>
              <th className="p-3">Status</th>
              <th className="p-3">Último Login</th>
              <th className="p-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map(a => (
              <tr key={a.id} className="border-b border-gray-300/60">
                {editingId === a.id ? (
                  <>
                    <td className="p-3">
                      <input 
                        value={editUsername} 
                        onChange={e => setEditUsername(e.target.value)} 
                        className="bg-gray-50 text-gray-900 rounded px-2 py-1 border border-gray-300 w-full" 
                      />
                    </td>
                    <td className="p-3">
                      <input 
                        value={editName} 
                        onChange={e => setEditName(e.target.value)} 
                        className="bg-gray-50 text-gray-900 rounded px-2 py-1 border border-gray-300 w-full" 
                      />
                    </td>
                    <td className="p-3">
                      <input 
                        value={editEmail} 
                        onChange={e => setEditEmail(e.target.value)} 
                        type="email"
                        className="bg-gray-50 text-gray-900 rounded px-2 py-1 border border-gray-300 w-full" 
                      />
                    </td>
                    <td className="p-3">
                      <select 
                        value={editRole} 
                        onChange={e => setEditRole(e.target.value as 'admin' | 'gerente' | 'colaborador')} 
                        className="bg-gray-50 text-gray-900 rounded px-2 py-1 border border-gray-300 w-full"
                      >
                        <option value="colaborador">Colaborador</option>
                        <option value="gerente">Gerente</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="p-3">
                      <label className="inline-flex items-center gap-2 text-gray-700">
                        <input 
                          type="checkbox" 
                          checked={editActive} 
                          onChange={e => setEditActive(e.target.checked)} 
                        />
                        Ativo
                      </label>
                    </td>
                    <td className="p-3">
                      <input 
                        value={editPassword} 
                        onChange={e => setEditPassword(e.target.value)} 
                        type="password"
                        placeholder="Nova senha (opcional)"
                        className="bg-gray-50 text-gray-900 rounded px-2 py-1 border border-gray-300 w-full" 
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={saveEdit} 
                          className="bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-3 py-1 rounded"
                        >
                          Salvar
                        </button>
                        <button 
                          onClick={cancelEdit} 
                          className="bg-gray-600 hover:bg-gray-500 text-white font-semibold px-3 py-1 rounded"
                        >
                          Cancelar
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-3 text-gray-900 font-medium">{a.username}</td>
                    <td className="p-3 text-gray-900">{a.name}</td>
                    <td className="p-3 text-gray-700">{a.email || '-'}</td>
                    <td className="p-3">
                      <span className={a.is_active ? 'text-emerald-600 font-medium' : 'text-gray-500'}>
                        {a.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="p-3 text-gray-600 text-sm">{formatDate(a.last_login)}</td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-3">
                        <button 
                          onClick={() => startEdit(a)} 
                          className="text-gray-700 hover:text-blue-600"
                          title="Editar"
                        >
                          <PencilIcon className="w-5 h-5 inline" />
                        </button>
                        <button 
                          onClick={() => deleteAdmin(a.id)} 
                          className="text-gray-700 hover:text-red-600"
                          title="Desativar"
                        >
                          <TrashIcon className="w-5 h-5 inline" />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {items.length === 0 && !loading && (
              <tr>
                <td className="p-4 text-gray-600 text-center" colSpan={6}>
                  Nenhum usuário cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Cards (mobile) */}
      <div className="md:hidden grid gap-3">
        {items.map(a => (
          <div key={a.id} className="bg-white rounded-lg border border-gray-300 p-4">
            {editingId === a.id ? (
              <div className="grid gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Username</label>
                  <input 
                    value={editUsername} 
                    onChange={e => setEditUsername(e.target.value)} 
                    className="bg-gray-50 text-gray-900 rounded px-3 py-2 border border-gray-300 w-full" 
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Nome</label>
                  <input 
                    value={editName} 
                    onChange={e => setEditName(e.target.value)} 
                    className="bg-gray-50 text-gray-900 rounded px-3 py-2 border border-gray-300 w-full" 
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">E-mail</label>
                  <input 
                    value={editEmail} 
                    onChange={e => setEditEmail(e.target.value)} 
                    type="email"
                    className="bg-gray-50 text-gray-900 rounded px-3 py-2 border border-gray-300 w-full" 
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Nova Senha (opcional)</label>
                  <input 
                    value={editPassword} 
                    onChange={e => setEditPassword(e.target.value)} 
                    type="password"
                    placeholder="Deixe em branco para manter a atual"
                    className="bg-gray-50 text-gray-900 rounded px-3 py-2 border border-gray-300 w-full" 
                  />
                </div>
                <label className="inline-flex items-center gap-2 text-gray-700">
                  <input 
                    type="checkbox" 
                    checked={editActive} 
                    onChange={e => setEditActive(e.target.checked)} 
                  />
                  Ativo
                </label>
                <div className="flex justify-end gap-2">
                  <button 
                    onClick={saveEdit} 
                    className="bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-4 py-2 rounded"
                  >
                    Salvar
                  </button>
                  <button 
                    onClick={cancelEdit} 
                    className="bg-gray-600 hover:bg-gray-500 text-white font-semibold px-4 py-2 rounded"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid gap-2">
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-gray-900 font-semibold">{a.username}</div>
                    <div className="text-gray-700">{a.name}</div>
                    {a.email && <div className="text-gray-600 text-sm">{a.email}</div>}
                    <div className="text-gray-500 text-xs mt-1">
                      Último login: {formatDate(a.last_login)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => startEdit(a)} 
                      className="text-gray-700 hover:text-blue-600"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => deleteAdmin(a.id)} 
                      className="text-gray-700 hover:text-red-600"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="text-sm">
                  <span className={a.is_active ? 'text-emerald-600 font-medium' : 'text-gray-500'}>
                    {a.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
        {items.length === 0 && !loading && (
          <div className="text-center text-gray-600 py-8">Nenhum usuário cadastrado.</div>
        )}
      </div>
    </div>
  );
};

export default AdminsView;


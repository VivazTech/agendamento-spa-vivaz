import React, { useEffect, useState } from 'react';
import { PencilIcon, TrashIcon, PlusCircleIcon } from '../icons';

type Banner = {
  id: number;
  image_url: string;
  title?: string | null;
  description?: string | null;
  link_url?: string | null;
  display_order: number;
  is_active: boolean;
};

const BannersView: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState({
    image_url: '',
    title: '',
    description: '',
    link_url: '',
    display_order: 0,
    is_active: true,
  });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/banners');
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erro ao carregar banners');
      setBanners((data.banners || []) as Banner[]);
    } catch (e: any) {
      setError(e.message || 'Erro ao carregar banners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleOpenModal = (banner: Banner | null = null) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        image_url: banner.image_url || '',
        title: banner.title || '',
        description: banner.description || '',
        link_url: banner.link_url || '',
        display_order: banner.display_order || 0,
        is_active: banner.is_active ?? true,
      });
    } else {
      setEditingBanner(null);
      setFormData({
        image_url: '',
        title: '',
        description: '',
        link_url: '',
        display_order: 0,
        is_active: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBanner(null);
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      if (editingBanner) {
        const res = await fetch('/api/banners', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingBanner.id,
            ...formData,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || 'Erro ao atualizar banner');
      } else {
        const res = await fetch('/api/banners', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || 'Erro ao criar banner');
      }
      await load();
      handleCloseModal();
    } catch (e: any) {
      setError(e.message || 'Erro ao salvar banner');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBanner = async (bannerId: number) => {
    if (!window.confirm("Tem certeza que deseja excluir este banner?")) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/banners?id=${bannerId}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Erro ao excluir banner');
      await load();
    } catch (e: any) {
      setError(e.message || 'Erro ao excluir banner');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 text-center">Gerenciar Banners Promocionais</h2>
        <button
          onClick={() => handleOpenModal(null)}
          className="flex items-center gap-2 bg-[#3b200d] hover:bg-[#5b3310] text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
        >
          <PlusCircleIcon className="w-5 h-5" />
          Novo Banner
        </button>
      </div>

      {error && <div className="mb-4 text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-lg">{error}</div>}

      {loading && banners.length === 0 && (
        <div className="text-center text-gray-600 py-8">Carregando...</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {banners.map(banner => (
          <div key={banner.id} className="bg-white border border-gray-300 rounded-lg overflow-hidden shadow-sm">
            <div className="relative">
              <img
                src={banner.image_url}
                alt={banner.title || 'Banner'}
                className="w-full h-48 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="absolute top-2 right-2">
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  banner.is_active ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                }`}>
                  {banner.is_active ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>
            <div className="p-4">
              {banner.title && (
                <h3 className="font-bold text-gray-900 mb-1">{banner.title}</h3>
              )}
              {banner.description && (
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{banner.description}</p>
              )}
              <div className="flex items-center justify-between mt-4">
                <span className="text-xs text-gray-500">Ordem: {banner.display_order}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenModal(banner)}
                    className="text-gray-700 hover:text-blue-600"
                    title="Editar"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteBanner(banner.id)}
                    className="text-gray-700 hover:text-red-600"
                    title="Excluir"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {banners.length === 0 && !loading && (
        <div className="text-center text-gray-600 py-8">Nenhum banner cadastrado.</div>
      )}

      {/* Modal de Edição/Criação */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={handleCloseModal}
        >
          <div
            className="bg-white p-8 rounded-xl border border-gray-300 shadow-2xl w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-6">{editingBanner ? 'Editar Banner' : 'Novo Banner'}</h2>
            <form onSubmit={handleSaveBanner} className="space-y-4">
              <div>
                <label htmlFor="image_url" className="block text-sm font-medium text-gray-700 mb-1">
                  URL da Imagem <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:ring-[#5b3310] focus:border-[#5b3310]"
                  required
                />
                {formData.image_url && (
                  <div className="mt-2">
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg border border-gray-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Título (opcional)</label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:ring-[#5b3310] focus:border-[#5b3310]"
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Descrição (opcional)</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:ring-[#5b3310] focus:border-[#5b3310]"
                />
              </div>
              <div>
                <label htmlFor="link_url" className="block text-sm font-medium text-gray-700 mb-1">URL de Destino (opcional)</label>
                <input
                  type="url"
                  id="link_url"
                  value={formData.link_url}
                  onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:ring-[#5b3310] focus:border-[#5b3310]"
                  placeholder="https://exemplo.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="display_order" className="block text-sm font-medium text-gray-700 mb-1">Ordem de Exibição</label>
                  <input
                    type="number"
                    id="display_order"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value) })}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:ring-[#5b3310] focus:border-[#5b3310]"
                    min="0"
                  />
                </div>
                <div className="flex items-center pt-8">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Banner Ativo</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end space-x-4 pt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-5 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#3b200d] hover:bg-[#5b3310] text-white font-bold py-2 px-5 rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BannersView;


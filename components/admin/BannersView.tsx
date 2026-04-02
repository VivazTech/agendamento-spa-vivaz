import React, { useCallback, useEffect, useState } from 'react';
import { useBackdropPointerClose } from '../../hooks/useBackdropPointerClose';
import { PencilIcon, TrashIcon, PlusCircleIcon } from '../icons';

type BannerType = 'slide' | 'video';
type HeroMode = 'slider' | 'video';

type Banner = {
  id: number;
  image_url: string;
  title?: string | null;
  description?: string | null;
  link_url?: string | null;
  display_order: number;
  is_active: boolean;
  banner_type?: BannerType | string | null;
  video_url?: string | null;
};

const BannersView: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [heroMode, setHeroMode] = useState<HeroMode>('slider');
  const [savingHeroMode, setSavingHeroMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState({
    banner_type: 'slide' as BannerType,
    image_url: '',
    video_url: '',
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
      setHeroMode(data.hero_mode === 'video' ? 'video' : 'slider');
    } catch (e: any) {
      setError(e.message || 'Erro ao carregar banners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingBanner(null);
  }, []);

  const backdropClose = useBackdropPointerClose(handleCloseModal);

  const normalizeType = (t: string | null | undefined): BannerType =>
    t === 'video' ? 'video' : 'slide';

  const handleOpenModal = (banner: Banner | null = null) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        banner_type: normalizeType(banner.banner_type),
        image_url: banner.image_url || '',
        video_url: banner.video_url || '',
        title: banner.title || '',
        description: banner.description || '',
        link_url: banner.link_url || '',
        display_order: banner.display_order || 0,
        is_active: banner.is_active ?? true,
      });
    } else {
      setEditingBanner(null);
      setFormData({
        banner_type: 'slide',
        image_url: '',
        video_url: '',
        title: '',
        description: '',
        link_url: '',
        display_order: 0,
        is_active: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const payload = {
        banner_type: formData.banner_type,
        image_url: formData.image_url.trim(),
        video_url: formData.banner_type === 'video' ? formData.video_url.trim() : '',
        title: formData.title,
        description: formData.description,
        link_url: formData.link_url,
        display_order: formData.display_order,
        is_active: formData.is_active,
      };
      if (editingBanner) {
        const res = await fetch('/api/banners', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingBanner.id,
            ...payload,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || 'Erro ao atualizar banner');
      } else {
        const res = await fetch('/api/banners', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
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

  const handleHeroModeChange = async (mode: HeroMode) => {
    const previous = heroMode;
    setHeroMode(mode);
    try {
      setSavingHeroMode(true);
      setError(null);
      const res = await fetch('/api/banners?settings=1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hero_mode: mode }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error || 'Erro ao salvar exibição do topo');
    } catch (e: any) {
      setHeroMode(previous);
      setError(e.message || 'Erro ao salvar exibição do topo');
    } finally {
      setSavingHeroMode(false);
    }
  };

  const handleDeleteBanner = async (bannerId: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este banner?')) return;
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900 text-center sm:text-left">Gerenciar Banners Promocionais</h2>
        <button
          onClick={() => handleOpenModal(null)}
          className="flex items-center justify-center gap-2 bg-[#3b200d] hover:bg-[#5b3310] text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
        >
          <PlusCircleIcon className="w-5 h-5" />
          Novo Banner
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
        <label htmlFor="hero_mode" className="block text-sm font-semibold text-gray-900">
          O que exibir no topo do site
        </label>
        <p className="text-xs text-gray-600">
          Escolha <strong>apenas um</strong>: carrossel de imagens (slides) ou o banner de vídeo. No modo vídeo, só entra o primeiro vídeo ativo (por ordem de exibição).
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <select
            id="hero_mode"
            value={heroMode}
            disabled={savingHeroMode}
            onChange={(e) => handleHeroModeChange(e.target.value as HeroMode)}
            className="bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 min-w-[240px] focus:ring-[#5b3310] focus:border-[#5b3310] disabled:opacity-60"
          >
            <option value="slider">Slider de imagens (banners tipo slide)</option>
            <option value="video">Vídeo (banner tipo vídeo)</option>
          </select>
          {savingHeroMode && <span className="text-sm text-gray-600">Salvando…</span>}
        </div>
      </div>

      {error && <div className="mb-4 text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-lg">{error}</div>}

      {loading && banners.length === 0 && (
        <div className="text-center text-gray-600 py-8">Carregando...</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {banners.map((banner) => {
          const isVideo = normalizeType(banner.banner_type) === 'video';
          return (
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
                {isVideo && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/25 pointer-events-none">
                    <span className="rounded-full bg-white/90 w-14 h-14 flex items-center justify-center shadow-lg">
                      <svg className="w-8 h-8 text-[#3b200d] ml-1" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                  </div>
                )}
                <div className="absolute top-2 left-2 flex gap-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      isVideo ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'
                    }`}
                  >
                    {isVideo ? 'Vídeo' : 'Slide'}
                  </span>
                </div>
                <div className="absolute top-2 right-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      banner.is_active ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                    }`}
                  >
                    {banner.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>
              <div className="p-4">
                {banner.title && <h3 className="font-bold text-gray-900 mb-1">{banner.title}</h3>}
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
                      type="button"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteBanner(banner.id)}
                      className="text-gray-700 hover:text-red-600"
                      title="Excluir"
                      type="button"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {banners.length === 0 && !loading && (
        <div className="text-center text-gray-600 py-8">Nenhum banner cadastrado.</div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain">
          <div className="relative flex min-h-[100dvh] w-full items-center justify-center px-4 py-8 box-border">
            <div
              aria-hidden
              className="absolute inset-0 min-h-full bg-black/70 backdrop-blur-sm"
              onPointerDown={backdropClose.onBackdropPointerDown}
              onPointerUp={backdropClose.onBackdropPointerUp}
            />
            <div className="relative z-10 w-full max-w-2xl pointer-events-none flex justify-center">
              <div className="pointer-events-auto w-full max-h-[min(88dvh,calc(100dvh-4rem))] overflow-y-auto overscroll-contain rounded-xl border border-gray-300 bg-white p-6 shadow-2xl sm:p-8">
            <h2 className="text-2xl font-bold mb-6">{editingBanner ? 'Editar Banner' : 'Novo Banner'}</h2>
            <form onSubmit={handleSaveBanner} className="space-y-4">
              <div>
                <label htmlFor="banner_type" className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de banner
                </label>
                <select
                  id="banner_type"
                  value={formData.banner_type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      banner_type: e.target.value as BannerType,
                    })
                  }
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:ring-[#5b3310] focus:border-[#5b3310]"
                >
                  <option value="slide">Slide de imagens</option>
                  <option value="video">Vídeo</option>
                </select>
              </div>

              {formData.banner_type === 'slide' ? (
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
              ) : (
                <>
                  <div>
                    <label htmlFor="video_url" className="block text-sm font-medium text-gray-700 mb-1">
                      URL do vídeo <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="url"
                      id="video_url"
                      value={formData.video_url}
                      onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:ring-[#5b3310] focus:border-[#5b3310]"
                      placeholder="YouTube, Vimeo ou link direto .mp4"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Ex.: link do YouTube, Vimeo ou arquivo de vídeo (.mp4).
                    </p>
                  </div>
                  <div>
                    <label htmlFor="image_url_video" className="block text-sm font-medium text-gray-700 mb-1">
                      URL da miniatura <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-gray-500 mb-2">Exibida até o vídeo terminar de carregar.</p>
                    <input
                      type="url"
                      id="image_url_video"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:ring-[#5b3310] focus:border-[#5b3310]"
                      required
                    />
                    {formData.image_url && (
                      <div className="mt-2">
                        <img
                          src={formData.image_url}
                          alt="Preview da miniatura"
                          className="w-full h-48 object-cover rounded-lg border border-gray-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                </>
              )}

              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Título (opcional)
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:ring-[#5b3310] focus:border-[#5b3310]"
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição (opcional)
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:ring-[#5b3310] focus:border-[#5b3310]"
                />
              </div>
              <div>
                <label htmlFor="link_url" className="block text-sm font-medium text-gray-700 mb-1">
                  URL de Destino (opcional)
                </label>
                <input
                  type="url"
                  id="link_url"
                  value={formData.link_url}
                  onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:ring-[#5b3310] focus:border-[#5b3310]"
                  placeholder="https://exemplo.com"
                />
                {formData.banner_type === 'video' && (
                  <p className="mt-1 text-xs text-gray-500">
                    No modo vídeo, o link aparece como &quot;Abrir link&quot; no rodapé do banner.
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="display_order" className="block text-sm font-medium text-gray-700 mb-1">
                    Ordem de Exibição
                  </label>
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
          </div>
        </div>
      )}
    </div>
  );
};

export default BannersView;

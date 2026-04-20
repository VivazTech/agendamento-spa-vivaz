import React, { useState, useEffect } from 'react';
import { Service, ServiceVariationMode } from '../../types';
import { useBackdropPointerClose } from '../../hooks/useBackdropPointerClose';
import { PlusCircleIcon, TrashIcon } from '../icons';
import { supabase } from '../../src/lib/supabaseClient';

type VariationRow = {
  id?: number;
  duration_minutes: number;
  price: number;
  display_order: number;
  label?: string;
};

interface ServiceModalProps {
  service: Service | null;
  onClose: () => void;
  onSave: (service: Service) => void;
}

const ServiceModal: React.FC<ServiceModalProps> = ({ service, onClose, onSave }) => {
  const backdropClose = useBackdropPointerClose(onClose);
  const serviceImagesBucket = import.meta.env.VITE_SUPABASE_SERVICE_IMAGES_BUCKET || 'service-images';

  const [formData, setFormData] = useState<Omit<Service, 'id'>>({
    name: '',
    description: '',
    price: 0,
    duration: 0,
    responsibleProfessionalId: null,
    responsibleProfessionalName: null,
    category: null,
    image_url: null,
    variation_mode: 'fixed',
  });

  const [categories, setCategories] = useState<Array<{ id: number; name: string; icon: string | null }>>([]);
  const [professionals, setProfessionals] = useState<Array<{ id: string; name: string }>>([]);
  /** IDs dos profissionais habilitados para o serviço (múltipla escolha) */
  const [professionalIds, setProfessionalIds] = useState<string[]>([]);
  const [variationMode, setVariationMode] = useState<ServiceVariationMode>('fixed');
  const [priceVariations, setPriceVariations] = useState<VariationRow[]>([]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [catRes, proRes] = await Promise.all([fetch('/api/categories'), fetch('/api/professionals')]);
        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories((catData.categories || []).map((c: any) => ({ id: c.id, name: c.name, icon: c.icon })));
        }
        if (proRes.ok) {
          const proData = await proRes.json();
          setProfessionals((proData.professionals || []).map((p: any) => ({ id: p.id, name: p.name })));
        }
      } catch {
        /* ignore */
      }
    })();
  }, []);

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name,
        description: service.description,
        price: service.price,
        duration: service.duration,
        responsibleProfessionalId: service.responsibleProfessionalId ?? null,
        responsibleProfessionalName: service.responsibleProfessionalName ?? null,
        category: service.category ?? null,
        image_url: service.image_url ?? null,
        variation_mode: service.variation_mode ?? 'fixed',
      });
      const proIds =
        service.serviceProfessionals?.map((p) => p.id).filter(Boolean) ??
        (service.responsibleProfessionalId ? [service.responsibleProfessionalId] : []);
      setProfessionalIds(proIds);

      let mode: ServiceVariationMode = 'fixed';
      if (service.variation_mode === 'duration' || service.variation_mode === 'service_type') {
        mode = service.variation_mode;
      } else if (service.price_variations && service.price_variations.length > 0) {
        mode = service.price_variations[0].variation_kind === 'service_type' ? 'service_type' : 'duration';
      }
      setVariationMode(mode);

      if (mode !== 'fixed' && service.price_variations && service.price_variations.length > 0) {
        setPriceVariations(
          service.price_variations.map((v) => ({
            id: v.id,
            duration_minutes: v.duration_minutes,
            price: v.price,
            display_order: v.display_order,
            label: v.label || '',
          }))
        );
      } else {
        setPriceVariations([]);
      }
      setSelectedImage(null);
      setUploadError(null);
    } else {
      setFormData({
        name: '',
        description: '',
        price: 0,
        duration: 0,
        responsibleProfessionalId: null,
        responsibleProfessionalName: null,
        category: null,
        image_url: null,
        variation_mode: 'fixed',
      });
      setProfessionalIds([]);
      setVariationMode('fixed');
      setPriceVariations([]);
      setSelectedImage(null);
      setUploadError(null);
    }
  }, [service]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const isNumeric = ['price', 'duration'].includes(name);
    setFormData((prev) => ({
      ...prev,
      [name]: isNumeric ? Number(value) : value,
    }));
  };

  const handleModeChange = (m: ServiceVariationMode) => {
    setVariationMode(m);
    if (m === 'fixed') {
      setPriceVariations([]);
    } else if (m === 'duration') {
      setPriceVariations([{ duration_minutes: 30, price: 0, display_order: 0 }]);
    } else {
      setPriceVariations([{ label: '', duration_minutes: 30, price: 0, display_order: 0 }]);
    }
  };

  const handleAddVariation = () => {
    const next = priceVariations.length;
    if (variationMode === 'service_type') {
      setPriceVariations([...priceVariations, { label: '', duration_minutes: 30, price: 0, display_order: next }]);
    } else {
      setPriceVariations([...priceVariations, { duration_minutes: 30, price: 0, display_order: next }]);
    }
  };

  const handleRemoveVariation = (index: number) => {
    setPriceVariations(priceVariations.filter((_, i) => i !== index));
  };

  const handleVariationChange = (index: number, field: keyof VariationRow, value: string | number) => {
    const updated = [...priceVariations];
    updated[index] = { ...updated[index], [field]: value };
    setPriceVariations(updated);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setUploadError(null);
    if (!file) {
      setSelectedImage(null);
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Formato inválido. Envie apenas JPG, JPEG ou PNG.');
      setSelectedImage(null);
      return;
    }

    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setUploadError('A imagem deve ter no máximo 5MB.');
      setSelectedImage(null);
      return;
    }

    setSelectedImage(file);
  };

  const uploadSelectedImage = async (file: File): Promise<string> => {
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const safeBaseName = file.name
      .replace(/\.[^/.]+$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 60);
    const filePath = `services/${Date.now()}-${safeBaseName || 'service'}-${crypto.randomUUID()}.${extension}`;

    const { error: uploadErr } = await supabase.storage
      .from(serviceImagesBucket)
      .upload(filePath, file, { cacheControl: '3600', upsert: false, contentType: file.type });

    if (uploadErr) {
      throw new Error(uploadErr.message || 'Falha ao subir imagem.');
    }

    const { data } = supabase.storage.from(serviceImagesBucket).getPublicUrl(filePath);
    if (!data?.publicUrl) {
      throw new Error('Não foi possível obter a URL pública da imagem.');
    }

    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalImageUrl = formData.image_url ?? null;
    if (selectedImage) {
      try {
        setIsUploadingImage(true);
        setUploadError(null);
        finalImageUrl = await uploadSelectedImage(selectedImage);
      } catch (err: any) {
        setUploadError(err?.message || 'Erro ao fazer upload da imagem.');
        setIsUploadingImage(false);
        return;
      } finally {
        setIsUploadingImage(false);
      }
    }

    if (!formData.name || !formData.category) {
      alert('Por favor, preencha nome e categoria.');
      return;
    }

    if (variationMode !== 'fixed') {
      if (priceVariations.length === 0) {
        alert('Adicione pelo menos uma variação ou escolha preço fixo.');
        return;
      }
      for (const variation of priceVariations) {
        if (variation.duration_minutes <= 0 || variation.price <= 0) {
          alert('Preencha duração e preço em todas as variações.');
          return;
        }
        if (variationMode === 'service_type' && !(variation.label || '').trim()) {
          alert('Preencha o nome do tipo em todas as variações (ex.: Curto, Médio, Longo).');
          return;
        }
      }
    } else {
      if (formData.price <= 0 || formData.duration <= 0) {
        alert('Por favor, preencha duração e preço ou escolha um modo de variação.');
        return;
      }
    }

    const firstVar = variationMode !== 'fixed' && priceVariations.length > 0 ? priceVariations[0] : null;
    const kind = variationMode === 'service_type' ? 'service_type' : 'duration';

    const price_variations =
      variationMode === 'fixed'
        ? []
        : priceVariations.map((v, i) => ({
            id: v.id,
            duration_minutes: v.duration_minutes,
            price: v.price,
            display_order: i,
            variation_kind: kind as 'duration' | 'service_type',
            label: variationMode === 'service_type' ? (v.label || '').trim() : null,
          }));

    const proNames = professionalIds
      .map((id) => professionals.find((p) => p.id === id)?.name)
      .filter(Boolean) as string[];
    const serviceToSave = {
      ...formData,
      image_url: finalImageUrl,
      variation_mode: variationMode,
      price: firstVar ? firstVar.price : formData.price,
      duration: firstVar ? firstVar.duration_minutes : formData.duration,
      id: service ? service.id : 0,
      price_variations,
      professionalIds,
      responsibleProfessionalId: professionalIds[0] ?? null,
      responsibleProfessionalName: proNames.length ? proNames.join(', ') : null,
    } as Service;

    onSave(serviceToSave);
  };

  const showFixedPricing = variationMode === 'fixed';
  const showVariationBlock = variationMode !== 'fixed';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain">
      <div className="relative flex min-h-[100dvh] w-full items-center justify-center px-4 py-8 box-border">
        <div
          aria-hidden
          className="absolute inset-0 min-h-full bg-black/70 backdrop-blur-sm"
          onPointerDown={backdropClose.onBackdropPointerDown}
          onPointerUp={backdropClose.onBackdropPointerUp}
        />
        <div className="relative z-10 w-full max-w-lg pointer-events-none flex justify-center">
          <div className="pointer-events-auto w-full max-h-[min(88dvh,calc(100dvh-4rem))] overflow-y-auto overscroll-contain rounded-xl border border-gray-300 bg-white p-6 shadow-2xl sm:p-8">
        <h2 className="text-2xl font-bold mb-6">{service ? 'Editar Serviço' : 'Novo Serviço'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nome do Serviço</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:ring-[#5b3310] focus:border-[#5b3310]"
              required
            />
          </div>
          <div>
            <label htmlFor="image_url" className="block text-sm font-medium text-gray-700 mb-1">URL da Imagem (opcional)</label>
            <input
              type="url"
              id="image_url"
              name="image_url"
              value={formData.image_url || ''}
              onChange={handleChange}
              placeholder="https://exemplo.com/imagem.jpg"
              className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:ring-[#5b3310] focus:border-[#5b3310]"
            />
            <label htmlFor="image_file" className="block text-sm font-medium text-gray-700 mt-3 mb-1">
              Ou subir arquivo (JPG, JPEG, PNG)
            </label>
            <input
              type="file"
              id="image_file"
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              onChange={handleImageFileChange}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 file:mr-4 file:rounded-md file:border-0 file:bg-[#3b200d] file:px-3 file:py-1.5 file:text-white hover:file:bg-[#5b3310]"
            />
            {selectedImage && (
              <p className="mt-2 text-xs text-gray-600">
                Arquivo selecionado: {selectedImage.name} ({(selectedImage.size / 1024 / 1024).toFixed(2)} MB).
                O upload será feito ao salvar.
              </p>
            )}
            {uploadError && (
              <p className="mt-2 text-xs text-red-600">{uploadError}</p>
            )}
            {formData.image_url && (
              <div className="mt-2">
                <img
                  src={formData.image_url}
                  alt="Preview"
                  className="w-full h-32 object-cover rounded-lg border border-gray-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:ring-[#5b3310] focus:border-[#5b3310]"
            />
          </div>

          {showFixedPricing && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">Duração (minutos)</label>
                <input
                  type="number"
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:ring-[#5b3310] focus:border-[#5b3310]"
                  required
                  min="1"
                />
              </div>
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:ring-[#5b3310] focus:border-[#5b3310]"
                  required
                  min="0.01"
                  step="0.01"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria <span className="text-red-500">*</span></label>
            <select
              value={formData.category ?? ''}
              onChange={(e) => {
                const category = e.target.value ? Number(e.target.value) : null;
                setFormData((prev) => ({ ...prev, category }));
              }}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:ring-[#5b3310] focus:border-[#5b3310]"
              required
            >
              <option value="">Selecione uma categoria</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon ? `${cat.icon} ` : ''}
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <span className="block text-sm font-medium text-gray-700 mb-2">Profissionais (opcional)</span>
            <p className="text-xs text-gray-500 mb-2">Marque um ou mais profissionais que realizam este serviço.</p>
            <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-300 bg-gray-50 p-3 space-y-2">
              {professionals.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhum profissional cadastrado.</p>
              ) : (
                professionals.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 cursor-pointer text-sm text-gray-800">
                    <input
                      type="checkbox"
                      checked={professionalIds.includes(p.id)}
                      onChange={() =>
                        setProfessionalIds((prev) =>
                          prev.includes(p.id) ? prev.filter((x) => x !== p.id) : [...prev, p.id]
                        )
                      }
                      className="rounded border-gray-300 text-[#5b3310] focus:ring-[#5b3310]"
                    />
                    <span>{p.name}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="border-t border-gray-300 pt-4">
            <label htmlFor="variation_mode" className="block text-sm font-medium text-gray-700 mb-1">
              Como definir preço e tempo
            </label>
            <select
              id="variation_mode"
              value={variationMode}
              onChange={(e) => handleModeChange(e.target.value as ServiceVariationMode)}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:ring-[#5b3310] focus:border-[#5b3310]"
            >
              <option value="fixed">Preço e duração fixos</option>
              <option value="duration">Variação por duração</option>
              <option value="service_type">Variação por tipo de serviço</option>
            </select>
            <p className="text-xs text-gray-500 mt-1.5">
              Somente um modo ativo: fixo, por duração ou por tipo (ex. cabelo curto / médio / longo). Cada opção de variação tem sua própria duração para o agendamento.
            </p>

            {showVariationBlock && (
              <div className="space-y-3 mt-4">
                {variationMode === 'duration' && (
                  <p className="text-sm font-medium text-gray-700">Opções por duração</p>
                )}
                {variationMode === 'service_type' && (
                  <p className="text-sm font-medium text-gray-700">Opções por tipo</p>
                )}
                {priceVariations.map((variation, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-lg space-y-2">
                    {variationMode === 'service_type' && (
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Tipo (ex.: Curto, Médio, Longo)</label>
                        <input
                          type="text"
                          value={variation.label || ''}
                          onChange={(e) => handleVariationChange(index, 'label', e.target.value)}
                          className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm focus:ring-[#5b3310] focus:border-[#5b3310]"
                          placeholder="Ex.: Cabelo médio"
                          required
                        />
                      </div>
                    )}
                    <div className={`flex gap-2 items-end ${variationMode === 'service_type' ? 'flex-wrap sm:flex-nowrap' : ''}`}>
                      <div className="flex-1 min-w-[100px]">
                        <label className="block text-xs text-gray-600 mb-1">Duração (min)</label>
                        <input
                          type="number"
                          value={variation.duration_minutes}
                          onChange={(e) =>
                            handleVariationChange(index, 'duration_minutes', Number(e.target.value))
                          }
                          className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm focus:ring-[#5b3310] focus:border-[#5b3310]"
                          min="1"
                          required
                        />
                      </div>
                      <div className="flex-1 min-w-[100px]">
                        <label className="block text-xs text-gray-600 mb-1">Preço (R$)</label>
                        <input
                          type="number"
                          value={variation.price}
                          onChange={(e) => handleVariationChange(index, 'price', Number(e.target.value))}
                          className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm focus:ring-[#5b3310] focus:border-[#5b3310]"
                          min="0.01"
                          step="0.01"
                          required
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveVariation(index)}
                        className="text-red-600 hover:text-red-800 p-2"
                        title="Remover"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddVariation}
                  className="w-full flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  <PlusCircleIcon className="w-5 h-5" />
                  Adicionar opção
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-5 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isUploadingImage}
              className="bg-[#3b200d] hover:bg-[#5b3310] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-2 px-5 rounded-lg transition-colors"
            >
              {isUploadingImage ? 'Enviando imagem...' : 'Salvar'}
            </button>
          </div>
        </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceModal;

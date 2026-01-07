import React, { useState, useEffect } from 'react';
import { Service, PriceVariation } from '../../types';
import { PlusCircleIcon, TrashIcon } from '../icons';

interface ServiceModalProps {
  service: Service | null;
  onClose: () => void;
  onSave: (service: Service) => void;
}

const ServiceModal: React.FC<ServiceModalProps> = ({ service, onClose, onSave }) => {
  const [formData, setFormData] = useState<Omit<Service, 'id'>>({
    name: '',
    description: '',
    price: 0,
    duration: 0,
    responsibleProfessionalId: null,
    responsibleProfessionalName: null,
    category: null,
    image_url: null,
  });

  const [categories, setCategories] = useState<Array<{ id: number; name: string; icon: string | null }>>([]);
  const [professionals, setProfessionals] = useState<Array<{ id: string; name: string }>>([]);
  const [priceVariations, setPriceVariations] = useState<Array<{ duration_minutes: number; price: number; display_order: number; id?: number }>>([]);
  const [showVariations, setShowVariations] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [catRes, proRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/professionals')
        ]);
        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories((catData.categories || []).map((c: any) => ({ id: c.id, name: c.name, icon: c.icon })));
        }
        if (proRes.ok) {
          const proData = await proRes.json();
          setProfessionals((proData.professionals || []).map((p: any) => ({ id: p.id, name: p.name })));
        }
      } catch {}
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
      });
      if (service.price_variations && service.price_variations.length > 0) {
        setPriceVariations(service.price_variations.map(v => ({
          id: v.id,
          duration_minutes: v.duration_minutes,
          price: v.price,
          display_order: v.display_order,
        })));
        setShowVariations(true);
      } else {
        setPriceVariations([]);
        setShowVariations(false);
      }
    } else {
      setPriceVariations([]);
      setShowVariations(false);
    }
  }, [service]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      const isNumeric = ['price', 'duration'].includes(name);
      setFormData(prev => ({
          ...prev,
          [name]: isNumeric ? Number(value) : value
      }));
  }

  const handleAddVariation = () => {
    setPriceVariations([...priceVariations, { duration_minutes: 30, price: 0, display_order: priceVariations.length }]);
  };

  const handleRemoveVariation = (index: number) => {
    setPriceVariations(priceVariations.filter((_, i) => i !== index));
  };

  const handleVariationChange = (index: number, field: 'duration_minutes' | 'price', value: number) => {
    const updated = [...priceVariations];
    updated[index] = { ...updated[index], [field]: value };
    setPriceVariations(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Basic validation
    if (!formData.name || formData.price <= 0 || formData.duration <= 0 || !formData.category) {
        alert("Por favor, preencha todos os campos obrigatórios, incluindo a categoria.");
        return;
    }
    
    // Se houver variações, validar
    if (showVariations && priceVariations.length > 0) {
      for (const variation of priceVariations) {
        if (variation.duration_minutes <= 0 || variation.price <= 0) {
          alert("Por favor, preencha todas as variações de preço corretamente.");
          return;
        }
      }
    }
    
    const serviceToSave = {
        ...formData,
        id: service ? service.id : 0,
        price_variations: showVariations ? priceVariations : [],
    };
    
    onSave(serviceToSave as Service);
  };

  return (
    <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
        onClick={onClose}
    >
      <div 
        className="bg-white p-8 rounded-xl border border-gray-300 shadow-2xl w-full max-w-lg m-4"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-6">{service ? 'Editar Serviço' : 'Novo Serviço'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Nome do Serviço</label>
            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:ring-[#5b3310] focus:border-[#5b3310]" required/>
          </div>
          <div>
            <label htmlFor="image_url" className="block text-sm font-medium text-gray-300 mb-1">URL da Imagem (opcional)</label>
            <input 
              type="url" 
              id="image_url" 
              name="image_url" 
              value={formData.image_url || ''} 
              onChange={handleChange} 
              placeholder="https://exemplo.com/imagem.jpg"
              className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:ring-[#5b3310] focus:border-[#5b3310]"
            />
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
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">Descrição</label>
            <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:ring-[#5b3310] focus:border-[#5b3310]"></textarea>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-300 mb-1">Duração (minutos)</label>
                <input type="number" id="duration" name="duration" value={formData.duration} onChange={handleChange} className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:ring-[#5b3310] focus:border-[#5b3310]" required min="1" />
            </div>
            <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-300 mb-1">Preço (R$)</label>
                <input type="number" id="price" name="price" value={formData.price} onChange={handleChange} className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:ring-[#5b3310] focus:border-[#5b3310]" required min="0.01" step="0.01" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Categoria <span className="text-red-500">*</span></label>
            <select
              value={formData.category ?? ''}
              onChange={(e) => {
                const category = e.target.value ? Number(e.target.value) : null;
                setFormData(prev => ({ ...prev, category }));
              }}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:ring-[#5b3310] focus:border-[#5b3310]"
              required
            >
              <option value="">Selecione uma categoria</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon ? `${cat.icon} ` : ''}{cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Profissional responsável</label>
            <select
              value={formData.responsibleProfessionalId ?? ''}
              onChange={(e) => {
                const id = e.target.value || null;
                const name = professionals.find(p => p.id === id)?.name ?? null;
                setFormData(prev => ({ ...prev, responsibleProfessionalId: id, responsibleProfessionalName: name }));
              }}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:ring-[#5b3310] focus:border-[#5b3310]"
            >
              <option value="">Sem responsável</option>
              {professionals.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          
          {/* Variações de Preço */}
          <div className="border-t border-gray-300 pt-4">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-300">Variações de Preço por Duração</label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showVariations}
                  onChange={(e) => {
                    setShowVariations(e.target.checked);
                    if (!e.target.checked) {
                      setPriceVariations([]);
                    } else if (priceVariations.length === 0) {
                      setPriceVariations([{ duration_minutes: 30, price: 0, display_order: 0 }]);
                    }
                  }}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Usar variações</span>
              </label>
            </div>
            
            {showVariations && (
              <div className="space-y-3">
                {priceVariations.map((variation, index) => (
                  <div key={index} className="flex gap-2 items-center bg-gray-50 p-3 rounded-lg">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 mb-1">Duração (min)</label>
                      <input
                        type="number"
                        value={variation.duration_minutes}
                        onChange={(e) => handleVariationChange(index, 'duration_minutes', Number(e.target.value))}
                        className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm focus:ring-[#5b3310] focus:border-[#5b3310]"
                        min="1"
                        required
                      />
                    </div>
                    <div className="flex-1">
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
                      className="mt-6 text-red-600 hover:text-red-800"
                      title="Remover variação"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddVariation}
                  className="w-full flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  <PlusCircleIcon className="w-5 h-5" />
                  Adicionar Variação
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  Quando houver variações, o preço e duração padrão acima serão ignorados. As variações serão exibidas no card do serviço.
                </p>
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-4 pt-6">
            <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-5 rounded-lg transition-colors">Cancelar</button>
            <button type="submit" className="bg-[#3b200d] hover:bg-[#5b3310] text-white font-bold py-2 px-5 rounded-lg transition-colors">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceModal;

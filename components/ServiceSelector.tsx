
import React, { useState, useMemo, useEffect } from 'react';
import { Service, PriceVariation } from '../types';
import { CheckCircleIcon, PlusCircleIcon, ClockIcon, DollarSignIcon, ChevronLeftIcon, ChevronRightIcon } from './icons';

type Category = {
  id: number;
  name: string;
  icon: string | null;
  display_order: number;
};

interface ServiceSelectorProps {
  services: Service[];
  selectedServices: Service[];
  onSelectServices: (services: Service[]) => void;
  onNext: () => void;
  totalDuration: number;
  totalPrice: number;
}

const ServiceItem: React.FC<{ 
  service: Service; 
  isSelected: boolean; 
  onToggle: () => void;
  onEditVariation?: () => void;
}> = ({ service, isSelected, onToggle, onEditVariation }) => (
    <div
      onClick={onToggle}
      className={`bg-white rounded-lg border-2 transition-all duration-200 cursor-pointer hover:border-[#5b3310] shadow-sm overflow-hidden ${
        isSelected ? 'border-[#5b3310] shadow-lg shadow-[#5b3310]/20' : 'border-gray-300'
      }`}
    >
      <div className="flex">
        {/* Imagem à esquerda */}
        {service.image_url && (
          <div className="w-32 md:w-40 flex-shrink-0 overflow-hidden bg-gray-100 relative rounded-l-lg self-stretch">
            <img 
              src={service.image_url} 
              alt={service.name}
              className="w-full h-full object-cover min-h-[128px] md:min-h-[160px]"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            {/* Ícone de seleção sobreposto na imagem */}
            <div className="absolute top-2 right-2">
              {isSelected ? (
                <CheckCircleIcon className="w-6 h-6 text-[#3b200d] bg-white rounded-full" />
              ) : (
                <PlusCircleIcon className="w-6 h-6 text-gray-400 bg-white rounded-full" />
              )}
            </div>
          </div>
        )}
        {!service.image_url && (
          <div className="w-32 md:w-40 flex-shrink-0 flex items-center justify-center self-stretch min-h-[128px] md:min-h-[160px]">
            {isSelected ? (
              <CheckCircleIcon className="w-7 h-7 text-[#3b200d]" />
            ) : (
              <PlusCircleIcon className="w-7 h-7 text-gray-400" />
            )}
          </div>
        )}

        {/* Informações à direita */}
        <div className="flex-1 p-4 flex flex-col justify-between min-h-[128px] md:min-h-[160px]">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{service.name}</h3>
            <p className="text-gray-600 text-sm mt-1 line-clamp-2">{service.description}</p>
            {service.responsibleProfessionalName && (
              <p className="text-gray-700 text-sm mt-1">
                Profissional: {service.responsibleProfessionalName}
              </p>
            )}
            {/* Variações de preço ou preço único */}
            {service.price_variations && service.price_variations.length > 0 ? (
              <div className="mt-3 space-y-2">
                {isSelected && service.selectedVariation ? (
                  // Mostrar variação selecionada
                  <div 
                    className="bg-[#5b3310] border-2 border-[#5b3310] rounded-lg px-3 py-1.5 cursor-pointer hover:bg-[#6b4020] transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditVariation?.();
                    }}
                  >
                    <div className="text-xs text-white opacity-90 mb-1">Selecionado:</div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-white font-semibold">{service.selectedVariation.duration_minutes} min</div>
                      <div className="text-base text-white font-bold whitespace-nowrap">
                        <span className="text-[10px]">R$</span> {Math.floor(service.selectedVariation.price)}
                        <span className="text-[10px]">,{String(service.selectedVariation.price.toFixed(2)).split('.')[1]}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Mostrar todas as opções
                  <>
                    <p className="text-xs font-semibold text-gray-600 mb-2">Opções de duração e preço:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {service.price_variations.map((variation) => (
                        <div
                          key={variation.id}
                          className="bg-[#f5f0eb] border border-[#dac4b4] rounded-lg p-2 text-center"
                        >
                          <div className="text-xs text-gray-600">{variation.duration_minutes} min</div>
                          <div className="text-sm font-bold text-[#5b3310] whitespace-nowrap">
                            <span className="text-[10px]">R$</span> {Math.floor(variation.price)}
                            <span className="text-[10px]">,{String(variation.price.toFixed(2)).split('.')[1]}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-4 mt-3 text-gray-700 text-sm">
                <span className="flex items-center"><ClockIcon className="w-4 h-4 mr-1.5 text-[#5b3310]" /> {service.duration} min</span>
                <span className="flex items-center"><DollarSignIcon className="w-4 h-4 mr-1.5 text-[#5b3310]" /> R${service.price.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
);


const BookingSummary: React.FC<{
  selectedServices: Service[];
  totalDuration: number;
  totalPrice: number;
  onNext: () => void;
  onNextClick: () => void;
}> = ({ selectedServices, totalDuration, totalPrice, onNext, onNextClick }) => (
    <div className="sticky top-24 bg-white p-6 rounded-lg border border-gray-300 shadow-xl">
        <h2 className="text-xl font-bold text-gray-900 border-b border-gray-300 pb-3 mb-4">Resumo do Agendamento</h2>
        {selectedServices.length === 0 ? (
          <p className="text-gray-600">Selecione um serviço para começar.</p>
        ) : (
          <ul className="space-y-2 mb-4">
            {selectedServices.map(s => {
              const displayPrice = s.selectedVariation ? s.selectedVariation.price : s.price;
              const displayDuration = s.selectedVariation ? s.selectedVariation.duration_minutes : s.duration;
              return (
                <li key={s.id} className="flex justify-between text-gray-700">
                  <div>
                    <span className="font-medium">{s.name}</span>
                    {s.selectedVariation && (
                      <span className="text-xs text-gray-500 block">({s.selectedVariation.duration_minutes} min)</span>
                    )}
                  </div>
                  <span>R${displayPrice.toFixed(2)}</span>
                </li>
              );
            })}
          </ul>
        )}
        <div className="border-t border-gray-300 pt-4 mt-4 space-y-3">
          <div className="flex justify-between font-semibold text-gray-900">
            <span>Tempo total:</span>
            <span>{totalDuration} min</span>
          </div>
          <div className="flex justify-between font-bold text-lg text-[#3b200d]">
            <span>Valor total:</span>
            <span>R${totalPrice.toFixed(2)}</span>
          </div>
        </div>
        <button
          onClick={onNextClick}
          disabled={selectedServices.length === 0}
          className="w-full bg-[#3b200d] text-white font-bold py-3 px-4 rounded-lg mt-6 transition-all duration-300 hover:bg-[#5b3310] disabled:bg-gray-300 disabled:cursor-not-allowed disabled:text-gray-500 shadow-md"
        >
          Próximo
        </button>
    </div>
);

// Rodapé fixo resumido
const FixedFooter: React.FC<{
  selectedServices: Service[];
  totalPrice: number;
  onNext: () => void;
  onNextClick: () => void;
  isVisible: boolean;
}> = ({ selectedServices, totalPrice, onNext, onNextClick, isVisible }) => {
  if (selectedServices.length === 0) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300 shadow-lg z-40 transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">
                {selectedServices.length === 1 
                  ? selectedServices[0].name 
                  : `${selectedServices.length} serviços selecionados`}
              </span>
            </div>
            <div className="text-lg font-bold text-[#3b200d]">
              R$ {totalPrice.toFixed(2)}
            </div>
          </div>
          <button
            onClick={onNextClick}
            className="bg-[#3b200d] hover:bg-[#5b3310] text-white font-bold py-2.5 px-6 rounded-lg transition-all duration-300 shadow-md whitespace-nowrap"
          >
            Próximo
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal para seleção de variação de preço
const VariationSelectionModal: React.FC<{
  service: Service;
  onSelect: (variation: PriceVariation) => void;
  onClose: () => void;
}> = ({ service, onSelect, onClose }) => {
  if (!service.price_variations || service.price_variations.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-gray-300 shadow-2xl w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        {service.image_url && (
          <div className="w-full h-48 overflow-hidden bg-gray-100 rounded-t-2xl">
            <img
              src={service.image_url}
              alt={service.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
        <div className="p-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{service.name}</h3>
          {service.description && (
            <p className="text-gray-600 text-sm mb-6">{service.description}</p>
          )}
          <p className="text-sm font-semibold text-gray-700 mb-4">Escolha a duração e preço:</p>
          <div className="space-y-3">
            {service.price_variations.map((variation) => (
              <button
                key={variation.id}
                onClick={() => onSelect(variation)}
                className="w-full bg-white border-2 border-gray-300 hover:border-[#5b3310] rounded-xl p-4 text-left transition-all duration-200 hover:bg-[#f5f0eb]"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <ClockIcon className="w-5 h-5 text-[#5b3310]" />
                    <span className="font-semibold text-gray-900">{variation.duration_minutes} minutos</span>
                  </div>
                  <span className="text-lg font-bold text-[#5b3310]">R$ {variation.price.toFixed(2)}</span>
                </div>
              </button>
            ))}
          </div>
          <button
            onClick={onClose}
            className="w-full mt-6 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-lg transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

const ServiceSelector: React.FC<ServiceSelectorProps> = ({
  services,
  selectedServices,
  onSelectServices,
  onNext,
  totalDuration,
  totalPrice
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [showFixedFooter, setShowFixedFooter] = useState<boolean>(true);
  const [categorySliderIndex, setCategorySliderIndex] = useState<number>(0);
  const [variationModalService, setVariationModalService] = useState<Service | null>(null);

  // Buscar categorias do banco
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        if (res.ok && data.categories) {
          setCategories(data.categories);
          // Resetar índice do slider quando categorias mudarem
          setCategorySliderIndex(0);
        }
      } catch (error) {
        console.error('Erro ao carregar categorias:', error);
      }
    })();
  }, []);

  // Filtrar serviços baseado na categoria selecionada
  const filteredServices = useMemo(() => {
    if (!selectedCategory) {
      return services; // Mostrar todos os serviços se nenhuma categoria estiver selecionada
    }
    return services.filter(service => 
      service.category === selectedCategory
    );
  }, [services, selectedCategory]);

  const toggleService = (service: Service) => {
    const isSelected = selectedServices.some(s => s.id === service.id);
    if (isSelected) {
      // Remover serviço (tanto com quanto sem variações)
      onSelectServices(selectedServices.filter(s => s.id !== service.id));
    } else {
      // Se tem variações, abrir modal para escolher
      if (service.price_variations && service.price_variations.length > 0) {
        setVariationModalService(service);
      } else {
        // Sem variações, adicionar diretamente
        onSelectServices([...selectedServices, service]);
      }
    }
  };

  const handleVariationSelect = (variation: PriceVariation) => {
    if (!variationModalService) return;
    
    // Verificar se o serviço já está selecionado
    const isAlreadySelected = selectedServices.some(s => s.id === variationModalService.id);
    
    // Criar serviço com a variação selecionada
    const serviceWithVariation: Service = {
      ...variationModalService,
      price: variation.price,
      duration: variation.duration_minutes,
      selectedVariation: variation,
    };
    
    if (isAlreadySelected) {
      // Atualizar serviço existente
      onSelectServices(selectedServices.map(s => 
        s.id === variationModalService.id ? serviceWithVariation : s
      ));
    } else {
      // Adicionar à lista de serviços selecionados
      onSelectServices([...selectedServices, serviceWithVariation]);
    }
    
    // Fechar modal
    setVariationModalService(null);
  };

  const handleNextClick = () => {
    // Validar que serviços com variações tenham uma variação selecionada
    const servicesWithVariations = selectedServices.filter(s => 
      s.price_variations && s.price_variations.length > 0
    );
    
    const allHaveSelectedVariation = servicesWithVariations.every(s => 
      s.selectedVariation !== null && s.selectedVariation !== undefined
    );
    
    if (servicesWithVariations.length > 0 && !allHaveSelectedVariation) {
      alert('Por favor, selecione uma opção de duração e preço para todos os serviços que têm variações.');
      return;
    }
    
    onNext();
  };

  const handleCategoryChange = (categoryId: number | null) => {
    setSelectedCategory(categoryId);
  };

  // Funções para navegar o slider de categorias
  const itemsPerView = 4;
  const maxIndex = Math.max(0, categories.length - itemsPerView);
  const canNavigate = categories.length > itemsPerView;

  const handlePrevCategory = () => {
    setCategorySliderIndex(prev => Math.max(0, prev - 1));
  };

  const handleNextCategory = () => {
    setCategorySliderIndex(prev => Math.min(maxIndex, prev + 1));
  };

  // Detectar scroll para mostrar/esconder o rodapé fixo
  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      
      // Se estiver perto do final (100px de margem), esconder o rodapé
      const isNearBottom = scrollTop + windowHeight >= documentHeight - 100;
      setShowFixedFooter(!isNearBottom);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Verificar posição inicial

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="space-y-6 pb-20">
      {/* Seletor de Categorias com Slider */}
      <div className="relative">
          {/* Botão Anterior */}
          {canNavigate && categorySliderIndex > 0 && (
            <button
              onClick={handlePrevCategory}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white rounded-full p-2 shadow-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              aria-label="Categoria anterior"
            >
              <ChevronLeftIcon className="w-6 h-6 text-[#5b3310]" />
            </button>
          )}

          {/* Container do Slider */}
          <div className={`overflow-hidden ${canNavigate ? 'mx-8' : ''}`}>
            <div 
              className="flex transition-transform duration-300 ease-in-out gap-2"
              style={{
                transform: canNavigate ? `translateX(calc(-${categorySliderIndex * (100 / itemsPerView)}% - ${categorySliderIndex * 0.5}rem))` : 'none'
              }}
            >
              {categories.map(category => (
                <div key={category.id} className="flex-shrink-0" style={{ width: `calc(${100 / itemsPerView}% - 0.375rem)` }}>
                  <button
                    onClick={() => handleCategoryChange(selectedCategory === category.id ? null : category.id)}
                    className={`w-full h-[120px] flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200 ${
                      selectedCategory === category.id
                        ? 'border-[#5b3310] bg-[#dac4b4]/20 shadow-md'
                        : 'border-gray-300 bg-white hover:border-[#5b3310] hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-2xl mb-1.5">{category.icon || '📦'}</span>
                    <span className={`text-[10px] font-semibold text-center leading-tight px-1 ${
                      selectedCategory === category.id ? 'text-[#3b200d]' : 'text-gray-700'
                    }`}>
                      {category.name}
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Botão Próximo */}
          {canNavigate && categorySliderIndex < maxIndex && (
            <button
              onClick={handleNextCategory}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white rounded-full p-2 shadow-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              aria-label="Próxima categoria"
            >
              <ChevronRightIcon className="w-6 h-6 text-[#5b3310]" />
            </button>
          )}
        </div>
        {selectedCategory && (
          <button
            onClick={() => handleCategoryChange(null)}
            className="mt-4 text-sm text-[#5b3310] hover:text-[#3b200d] font-medium"
          >
            Limpar filtro
          </button>
        )}

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Nossos Serviços</h2>
          {filteredServices.length === 0 ? (
            <div className="bg-gray-50 border border-gray-300 rounded-lg p-8 text-center">
              <p className="text-gray-600">
                {selectedCategory 
                  ? 'Nenhum serviço disponível nesta categoria.' 
                  : 'Nenhum serviço disponível no momento.'}
              </p>
            </div>
          ) : (
            filteredServices.map(service => {
              // Se o serviço está selecionado, usar a versão com variação selecionada
              const selectedService = selectedServices.find(s => s.id === service.id);
              const serviceToDisplay = selectedService || service;
              const isSelected = selectedServices.some(s => s.id === service.id);
              return (
                <ServiceItem 
                  key={service.id}
                  service={serviceToDisplay}
                  isSelected={isSelected}
                  onToggle={() => toggleService(service)}
                  onEditVariation={
                    isSelected && service.price_variations && service.price_variations.length > 0
                      ? () => setVariationModalService(service)
                      : undefined
                  }
                />
              );
            })
          )}
        </div>
        <div className="lg:col-span-1">
          <BookingSummary 
            selectedServices={selectedServices}
            totalDuration={totalDuration}
            totalPrice={totalPrice}
            onNext={onNext}
            onNextClick={handleNextClick}
          />
        </div>
      </div>

      {/* Rodapé Fixo */}
      <FixedFooter
        selectedServices={selectedServices}
        totalPrice={totalPrice}
        onNext={onNext}
        onNextClick={handleNextClick}
        isVisible={showFixedFooter && selectedServices.length > 0}
      />

      {/* Modal de Seleção de Variação */}
      {variationModalService && (
        <VariationSelectionModal
          service={variationModalService}
          onSelect={handleVariationSelect}
          onClose={() => setVariationModalService(null)}
        />
      )}
    </div>
  );
};

export default ServiceSelector;

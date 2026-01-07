
import React, { useState, useMemo, useEffect } from 'react';
import { Service } from '../types';
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

const ServiceItem: React.FC<{ service: Service; isSelected: boolean; onToggle: () => void; }> = ({ service, isSelected, onToggle }) => (
    <div
      onClick={onToggle}
      className={`bg-white rounded-lg border-2 transition-all duration-200 cursor-pointer hover:border-[#5b3310] shadow-sm overflow-hidden ${
        isSelected ? 'border-[#5b3310] shadow-lg shadow-[#5b3310]/20' : 'border-gray-300'
      }`}
    >
      {service.image_url && (
        <div className="w-full h-48 overflow-hidden bg-gray-100">
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
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">{service.name}</h3>
            <p className="text-gray-600 text-sm mt-1">{service.description}</p>
            <p className="text-gray-700 text-sm mt-1">
              {service.responsibleProfessionalName ? `Profissional: ${service.responsibleProfessionalName}` : 'Profissional: —'}
            </p>
            {/* Variações de preço ou preço único */}
            {service.price_variations && service.price_variations.length > 0 ? (
              <div className="mt-3 space-y-2">
                <p className="text-xs font-semibold text-gray-600 mb-2">Opções de duração e preço:</p>
                <div className="grid grid-cols-2 gap-2">
                  {service.price_variations.map((variation) => (
                    <div
                      key={variation.id}
                      className="bg-[#f5f0eb] border border-[#dac4b4] rounded-lg p-2 text-center"
                    >
                      <div className="text-xs text-gray-600">{variation.duration_minutes} min</div>
                      <div className="text-sm font-bold text-[#5b3310]">R$ {variation.price.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4 mt-3 text-gray-700 text-sm">
                <span className="flex items-center"><ClockIcon className="w-4 h-4 mr-1.5 text-[#5b3310]" /> {service.duration} min</span>
                <span className="flex items-center"><DollarSignIcon className="w-4 h-4 mr-1.5 text-[#5b3310]" /> R${service.price.toFixed(2)}</span>
              </div>
            )}
          </div>
          {isSelected ? (
            <CheckCircleIcon className="w-7 h-7 text-[#3b200d] flex-shrink-0 ml-4" />
          ) : (
            <PlusCircleIcon className="w-7 h-7 text-gray-400 flex-shrink-0 ml-4" />
          )}
        </div>
      </div>
    </div>
);


const BookingSummary: React.FC<{
  selectedServices: Service[];
  totalDuration: number;
  totalPrice: number;
  onNext: () => void;
}> = ({ selectedServices, totalDuration, totalPrice, onNext }) => (
    <div className="sticky top-24 bg-white p-6 rounded-lg border border-gray-300 shadow-xl">
        <h2 className="text-xl font-bold text-gray-900 border-b border-gray-300 pb-3 mb-4">Resumo do Agendamento</h2>
        {selectedServices.length === 0 ? (
          <p className="text-gray-600">Selecione um serviço para começar.</p>
        ) : (
          <ul className="space-y-2 mb-4">
            {selectedServices.map(s => (
              <li key={s.id} className="flex justify-between text-gray-700">
                <span>{s.name}</span>
                <span>R${s.price.toFixed(2)}</span>
              </li>
            ))}
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
          onClick={onNext}
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
  isVisible: boolean;
}> = ({ selectedServices, totalPrice, onNext, isVisible }) => {
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
            onClick={onNext}
            className="bg-[#3b200d] hover:bg-[#5b3310] text-white font-bold py-2.5 px-6 rounded-lg transition-all duration-300 shadow-md whitespace-nowrap"
          >
            Próximo
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
      onSelectServices(selectedServices.filter(s => s.id !== service.id));
    } else {
      onSelectServices([...selectedServices, service]);
    }
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
      <div className="bg-white p-6 rounded-lg border border-gray-300 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Categorias</h2>
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
              className="flex transition-transform duration-300 ease-in-out gap-3"
              style={{
                transform: canNavigate ? `translateX(calc(-${categorySliderIndex * (100 / itemsPerView)}% - ${categorySliderIndex * 0.75}rem))` : 'none'
              }}
            >
              {categories.map(category => (
                <div key={category.id} className="flex-shrink-0" style={{ width: `calc(${100 / itemsPerView}% - 0.5625rem)` }}>
                  <button
                    onClick={() => handleCategoryChange(selectedCategory === category.id ? null : category.id)}
                    className={`w-full h-[120px] flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 ${
                      selectedCategory === category.id
                        ? 'border-[#5b3310] bg-[#dac4b4]/20 shadow-md'
                        : 'border-gray-300 bg-white hover:border-[#5b3310] hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-3xl mb-2">{category.icon || '📦'}</span>
                    <span className={`text-xs font-semibold text-center leading-tight px-1 ${
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
      </div>

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
            filteredServices.map(service => (
              <ServiceItem 
                key={service.id}
                service={service}
                isSelected={selectedServices.some(s => s.id === service.id)}
                onToggle={() => toggleService(service)}
              />
            ))
          )}
        </div>
        <div className="lg:col-span-1">
          <BookingSummary 
            selectedServices={selectedServices}
            totalDuration={totalDuration}
            totalPrice={totalPrice}
            onNext={onNext}
          />
        </div>
      </div>

      {/* Rodapé Fixo */}
      <FixedFooter
        selectedServices={selectedServices}
        totalPrice={totalPrice}
        onNext={onNext}
        isVisible={showFixedFooter && selectedServices.length > 0}
      />
    </div>
  );
};

export default ServiceSelector;

import React, { useState, useEffect } from 'react';

type Banner = {
  id: number;
  image_url: string;
  title?: string | null;
  description?: string | null;
  link_url?: string | null;
  display_order: number;
  is_active: boolean;
};

const BannerSlider: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Buscar banners do banco
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/banners');
        const data = await res.json();
        if (res.ok && data.banners) {
          setBanners(data.banners);
        }
      } catch (error) {
        console.error('Erro ao carregar banners:', error);
      }
    })();
  }, []);

  // Auto-play do slider
  useEffect(() => {
    if (!isAutoPlaying || banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000); // Muda a cada 5 segundos

    return () => clearInterval(interval);
  }, [isAutoPlaying, banners.length]);

  if (banners.length === 0) return null;

  const handleBannerClick = (banner: Banner) => {
    if (banner.link_url) {
      window.open(banner.link_url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="relative w-full mb-8 -mx-4 md:-mx-8 overflow-hidden">
      {/* Container do Slider com transbordamento - permite overflow nas laterais */}
      <div className="relative overflow-visible">
        <div className="flex justify-center">
          <div 
            className="flex transition-transform duration-500 ease-in-out gap-4"
            style={{
              transform: `translateX(calc(-${currentIndex * 100}% - ${currentIndex * 1rem}))`
            }}
          >
            {banners.map((banner, index) => {
              const isActive = index === currentIndex;
              const isPrev = index === currentIndex - 1 || (currentIndex === 0 && index === banners.length - 1);
              const isNext = index === currentIndex + 1 || (currentIndex === banners.length - 1 && index === 0);
              
              return (
                <div
                  key={banner.id}
                  className="flex-shrink-0 relative"
                  style={{
                    width: 'calc(100vw - 4rem)',
                    maxWidth: '1200px',
                  }}
                >
                <div
                  className={`relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 ${
                    isActive 
                      ? 'shadow-2xl scale-100 z-10' 
                      : (isPrev || isNext)
                      ? 'opacity-70 scale-[0.92] z-0'
                      : 'opacity-40 scale-[0.85] z-0'
                  }`}
                  onClick={() => {
                    setIsAutoPlaying(false);
                    setCurrentIndex(index);
                  }}
                >
                  <img
                    src={banner.image_url}
                    alt={banner.title || 'Banner promocional'}
                    className="w-full h-[200px] md:h-[250px] object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  {(banner.title || banner.description) && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end">
                      <div className="p-6 text-white">
                        {banner.title && (
                          <h3 className="text-2xl md:text-3xl font-bold mb-2">{banner.title}</h3>
                        )}
                        {banner.description && (
                          <p className="text-sm md:text-base opacity-90">{banner.description}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        </div>

        {/* Indicadores de página */}
        {banners.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setIsAutoPlaying(false);
                  setCurrentIndex(index);
                }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'w-8 bg-[#5b3310]'
                    : 'w-2 bg-white/60 hover:bg-white/80'
                }`}
                aria-label={`Ir para banner ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BannerSlider;


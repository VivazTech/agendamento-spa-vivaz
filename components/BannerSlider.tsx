import React, { useState, useEffect } from 'react';
import { parseVideoEmbed } from '../utils/videoBanner';

type Banner = {
  id: number;
  image_url: string;
  title?: string | null;
  description?: string | null;
  link_url?: string | null;
  display_order: number;
  is_active: boolean;
  banner_type?: string | null;
  video_url?: string | null;
};

const BannerSlider: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [videoReady, setVideoReady] = useState<Record<number, boolean>>({});

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

  useEffect(() => {
    if (!isAutoPlaying || banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, banners.length]);

  if (banners.length === 0) return null;

  const handleBannerClick = (banner: Banner) => {
    if (banner.banner_type === 'video') return;
    if (banner.link_url) {
      window.open(banner.link_url, '_blank', 'noopener,noreferrer');
    }
  };

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && banners.length > 0) {
      setIsAutoPlaying(false);
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }
    if (isRightSwipe && banners.length > 0) {
      setIsAutoPlaying(false);
      setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
    }
  };

  return (
    <div className="w-full mb-8 overflow-hidden">
      <div className="relative w-full">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
          }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {banners.map((banner) => {
            const isVideo = banner.banner_type === 'video' && banner.video_url;
            const embed = isVideo ? parseVideoEmbed(banner.video_url!) : null;

            return (
              <div key={banner.id} className="flex-shrink-0 w-full">
                <div
                  className={`relative rounded-2xl overflow-hidden mx-auto ${
                    !isVideo && banner.link_url ? 'cursor-pointer' : ''
                  }`}
                  style={{ maxWidth: '1200px' }}
                  onClick={() => {
                    if (!isVideo) handleBannerClick(banner);
                  }}
                >
                  {isVideo && embed ? (
                    <div className="relative w-full h-[200px] md:h-[250px] bg-black">
                      {!videoReady[banner.id] && (
                        <img
                          src={banner.image_url}
                          alt={banner.title || 'Carregando vídeo'}
                          className="absolute inset-0 z-10 w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                      {embed.mode === 'iframe' ? (
                        <iframe
                          src={embed.src}
                          title={banner.title || 'Vídeo do banner'}
                          className="absolute inset-0 z-[8] w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          onLoad={() =>
                            setVideoReady((prev) => ({ ...prev, [banner.id]: true }))
                          }
                        />
                      ) : (
                        <video
                          src={embed.src}
                          className="absolute inset-0 z-[8] w-full h-full object-cover"
                          controls
                          playsInline
                          preload="metadata"
                          onLoadedData={() =>
                            setVideoReady((prev) => ({ ...prev, [banner.id]: true }))
                          }
                        />
                      )}
                    </div>
                  ) : isVideo && !embed ? (
                    <div className="relative w-full h-[200px] md:h-[250px] bg-gray-900">
                      <img
                        src={banner.image_url}
                        alt=""
                        className="w-full h-full object-cover opacity-60"
                      />
                      <p className="absolute inset-0 flex items-center justify-center text-white text-sm px-4 text-center">
                        Não foi possível exibir este vídeo. Verifique o link.
                      </p>
                    </div>
                  ) : (
                    <img
                      src={banner.image_url}
                      alt={banner.title || 'Banner promocional'}
                      className="w-full h-[200px] md:h-[250px] object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  {(banner.title || banner.description || (isVideo && banner.link_url)) && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end pointer-events-none z-[15]">
                      <div className="p-6 text-white w-full">
                        {banner.title && (
                          <h3 className="text-2xl md:text-3xl font-bold mb-2">{banner.title}</h3>
                        )}
                        {banner.description && (
                          <p className="text-sm md:text-base opacity-90">{banner.description}</p>
                        )}
                        {isVideo && banner.link_url && (
                          <a
                            href={banner.link_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block mt-3 text-sm underline pointer-events-auto"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Abrir link
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {banners.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {banners.map((_, index) => (
              <button
                key={index}
                type="button"
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

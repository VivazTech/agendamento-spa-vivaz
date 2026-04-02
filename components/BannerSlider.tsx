import React, { useState, useEffect, useMemo, useRef } from 'react';
import { parseVideoEmbed, iframeSrcWithAutoplayMuted } from '../utils/videoBanner';

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

type HeroMode = 'slider' | 'video';

function VideoHeroBanner({ banner }: { banner: Banner }) {
  const embed = banner.video_url ? parseVideoEmbed(banner.video_url) : null;
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const tryPlay = () => {
      v.muted = true;
      v.play().catch(() => {});
    };
    v.addEventListener('loadeddata', tryPlay);
    v.addEventListener('canplay', tryPlay);
    return () => {
      v.removeEventListener('loadeddata', tryPlay);
      v.removeEventListener('canplay', tryPlay);
    };
  }, [banner.id, embed?.src]);

  const isVideo = banner.banner_type === 'video' && banner.video_url;

  if (!isVideo || !embed) {
    return (
      <div className="relative w-full h-[200px] md:h-[250px] bg-gray-900 rounded-2xl overflow-hidden mx-auto" style={{ maxWidth: '1200px' }}>
        <img
          src={banner.image_url}
          alt=""
          className="w-full h-full object-cover opacity-60"
        />
        <p className="absolute inset-0 flex items-center justify-center text-white text-sm px-4 text-center">
          Não foi possível exibir este vídeo. Verifique o link.
        </p>
      </div>
    );
  }

  const iframeSrc = embed.mode === 'iframe' ? iframeSrcWithAutoplayMuted(embed.src) : '';

  return (
    <div className="w-full mb-8 overflow-hidden">
      <div className="relative w-full mx-auto rounded-2xl overflow-hidden" style={{ maxWidth: '1200px' }}>
        <div
          className="relative w-full h-[200px] md:h-[250px] bg-black overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {!videoReady && (
            <img
              src={banner.image_url}
              alt={banner.title || 'Carregando vídeo'}
              className="absolute inset-0 z-10 w-full h-full object-cover object-center"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
          {embed.mode === 'iframe' ? (
            /* Bloco 16:9 centralizado: evita faixas pretas laterais quando o banner é mais “largo” que 16:9 */
            <div className="absolute left-1/2 top-1/2 z-[8] w-full max-w-none -translate-x-1/2 -translate-y-1/2 aspect-video">
              <iframe
                key={iframeSrc}
                src={iframeSrc}
                title={banner.title || 'Vídeo do banner'}
                className="absolute inset-0 h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                onLoad={() => setVideoReady(true)}
              />
            </div>
          ) : (
            <video
              ref={videoRef}
              key={embed.src}
              src={embed.src}
              className="absolute inset-0 z-[8] h-full w-full object-cover object-center"
              muted
              playsInline
              autoPlay
              loop
              preload="auto"
              onLoadedData={() => {
                setVideoReady(true);
                videoRef.current?.play().catch(() => {});
              }}
            />
          )}
        </div>
        {(banner.title || banner.description || banner.link_url) && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end pointer-events-none z-[15]">
            <div className="p-6 text-white w-full">
              {banner.title && <h3 className="text-2xl md:text-3xl font-bold mb-2">{banner.title}</h3>}
              {banner.description && <p className="text-sm md:text-base opacity-90">{banner.description}</p>}
              {banner.link_url && (
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
}

const BannerSlider: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [heroMode, setHeroMode] = useState<HeroMode>('slider');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/banners');
        const data = await res.json();
        if (res.ok && data.banners) {
          setBanners(data.banners);
          setHeroMode(data.hero_mode === 'video' ? 'video' : 'slider');
        }
      } catch (error) {
        console.error('Erro ao carregar banners:', error);
      }
    })();
  }, []);

  const slideBanners = useMemo(
    () => banners.filter((b) => (b.banner_type || 'slide') !== 'video'),
    [banners]
  );

  const videoBanners = useMemo(
    () => banners.filter((b) => b.banner_type === 'video' && String(b.video_url || '').trim()),
    [banners]
  );

  useEffect(() => {
    if (!isAutoPlaying || slideBanners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slideBanners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, slideBanners.length]);

  useEffect(() => {
    setCurrentIndex(0);
  }, [slideBanners.length, heroMode]);

  if (heroMode === 'video') {
    const first = videoBanners[0];
    if (!first) return null;
    return <VideoHeroBanner banner={first} />;
  }

  if (slideBanners.length === 0) return null;

  const handleBannerClick = (banner: Banner) => {
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

    if (isLeftSwipe && slideBanners.length > 0) {
      setIsAutoPlaying(false);
      setCurrentIndex((prev) => (prev + 1) % slideBanners.length);
    }
    if (isRightSwipe && slideBanners.length > 0) {
      setIsAutoPlaying(false);
      setCurrentIndex((prev) => (prev - 1 + slideBanners.length) % slideBanners.length);
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
          {slideBanners.map((banner) => (
            <div key={banner.id} className="flex-shrink-0 w-full">
              <div
                className={`relative rounded-2xl overflow-hidden mx-auto ${
                  banner.link_url ? 'cursor-pointer' : ''
                }`}
                style={{ maxWidth: '1200px' }}
                onClick={() => handleBannerClick(banner)}
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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end pointer-events-none z-[15]">
                    <div className="p-6 text-white w-full">
                      {banner.title && <h3 className="text-2xl md:text-3xl font-bold mb-2">{banner.title}</h3>}
                      {banner.description && <p className="text-sm md:text-base opacity-90">{banner.description}</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {slideBanners.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {slideBanners.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  setIsAutoPlaying(false);
                  setCurrentIndex(index);
                }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex ? 'w-8 bg-[#5b3310]' : 'w-2 bg-white/60 hover:bg-white/80'
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

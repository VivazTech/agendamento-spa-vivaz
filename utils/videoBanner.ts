/** Converte URL de vídeo (YouTube, Vimeo ou arquivo direto) para embed ou HTML5. */

export type VideoEmbed =
  | { mode: 'iframe'; src: string }
  | { mode: 'video'; src: string };

export function parseVideoEmbed(inputUrl: string): VideoEmbed | null {
  const url = inputUrl.trim();
  if (!url) return null;

  if (/youtube\.com\/embed\//i.test(url) || /player\.vimeo\.com\/video\//i.test(url)) {
    return { mode: 'iframe', src: url.split('&')[0] };
  }

  const yt =
    url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/i) ||
    url.match(/youtube\.com\/watch\?.*[&?]v=([\w-]{11})/i);
  if (yt?.[1]) {
    return { mode: 'iframe', src: `https://www.youtube.com/embed/${yt[1]}?rel=0` };
  }

  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vm?.[1]) {
    return { mode: 'iframe', src: `https://player.vimeo.com/video/${vm[1]}` };
  }

  if (/\.(mp4|webm|ogg)(\?|$)/i.test(url)) {
    return { mode: 'video', src: url };
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return { mode: 'iframe', src: url };
    }
  } catch {
    /* ignore */
  }

  return null;
}

/** Parâmetros de iframe para autoplay com som desligado (requisito dos navegadores). */
export function iframeSrcWithAutoplayMuted(src: string): string {
  try {
    const u = new URL(src);
    const h = u.hostname.toLowerCase();
    if (h.includes('youtube.com') || h.includes('youtu.be')) {
      u.searchParams.set('autoplay', '1');
      u.searchParams.set('mute', '1');
      u.searchParams.set('playsinline', '1');
    } else if (h.includes('vimeo.com')) {
      u.searchParams.set('autoplay', '1');
      u.searchParams.set('muted', '1');
    }
    return u.toString();
  } catch {
    const sep = src.includes('?') ? '&' : '?';
    return `${src}${sep}autoplay=1&mute=1`;
  }
}

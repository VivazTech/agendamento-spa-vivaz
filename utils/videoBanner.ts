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

export function cleanId(id: string | null): string | null {
    if (!id) return null;
    let t = id.trim();
    return /^[a-zA-Z0-9_-]{6,}$/.test(t) ? t : null;
}

export function getYouTubeVideoId(raw: string): string | null {
    try {
        const url = new URL(raw);
        if (url.hostname === 'youtu.be') return cleanId(url.pathname.split('/').filter(Boolean)[0] ?? null);
        if (url.pathname.startsWith('/embed/')) return cleanId(url.pathname.split('/').filter(Boolean)[1] ?? null);
        if (url.pathname === '/watch') return cleanId(url.searchParams.get('v'));
        if (url.pathname.startsWith('/shorts/')) return cleanId(url.pathname.split('/').filter(Boolean)[1] ?? null);
        // accept plain ids
        return cleanId(raw);
    } catch {
        return cleanId(raw);
    }
}

export function getYouTubeEmbedUrl(raw: string, origin?: string): string | null {
    const id = getYouTubeVideoId(raw);
    if (!id) return null;
    const u = new URL(`https://www.youtube.com/embed/${id}`);
    u.searchParams.set('rel', '0');
    u.searchParams.set('modestbranding', '1');
    u.searchParams.set('playsinline', '1');
    u.searchParams.set('enablejsapi', '1');
    if (origin) u.searchParams.set('origin', origin);
    return u.toString();
}

export function getTwitchEmbedUrl(raw: string): string | null {
    try {
        const url = new URL(raw);
        const host = url.hostname.replace(/^www\./, '');
        if (host === 'twitch.tv' || host === 'm.twitch.tv') {
            const seg = url.pathname.split('/').filter(Boolean);
            if (seg.length >= 1) {
                const channel = seg[0];
                // channel embed
                return `https://player.twitch.tv/?channel=${encodeURIComponent(channel)}&parent=${encodeURIComponent(location?.hostname ?? 'localhost')}`;
            }
        }
        // video urls have /videos/ID
        if (url.pathname.includes('/videos/')) {
            const seg = url.pathname.split('/').filter(Boolean);
            const idx = seg.indexOf('videos');
            const id = seg[idx + 1];
            if (id) return `https://player.twitch.tv/?video=${encodeURIComponent(id)}&parent=${encodeURIComponent(location?.hostname ?? 'localhost')}`;
        }
    } catch {}
    return null;
}

export function getStreamEmbedUrl(raw: string, origin?: string): { provider: 'youtube' | 'twitch' | null; embedUrl: string | null } {
    const yt = getYouTubeEmbedUrl(raw, origin);
    if (yt) return { provider: 'youtube', embedUrl: yt };
    const tw = getTwitchEmbedUrl(raw);
    if (tw) return { provider: 'twitch', embedUrl: tw };
    return { provider: null, embedUrl: null };
}

export function isSupportedStreamUrl(raw: string): boolean {
    return getYouTubeVideoId(raw) !== null || getTwitchEmbedUrl(raw) !== null;
}

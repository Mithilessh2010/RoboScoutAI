const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"]);

function cleanVideoId(id: string | null): string | null {
    if (!id) return null;

    let trimmed = id.trim();
    return /^[a-zA-Z0-9_-]{6,}$/.test(trimmed) ? trimmed : null;
}

export function getYouTubeVideoId(rawUrl: string): string | null {
    let url: URL;

    try {
        url = new URL(rawUrl.trim());
    } catch {
        return null;
    }

    if (!YOUTUBE_HOSTS.has(url.hostname)) return null;

    if (url.hostname === "youtu.be") {
        return cleanVideoId(url.pathname.split("/").filter(Boolean)[0] ?? null);
    }

    if (url.pathname.startsWith("/embed/")) {
        return cleanVideoId(url.pathname.split("/").filter(Boolean)[1] ?? null);
    }

    if (url.pathname.startsWith("/live/")) {
        return cleanVideoId(url.pathname.split("/").filter(Boolean)[1] ?? null);
    }

    if (url.pathname === "/watch") {
        return cleanVideoId(url.searchParams.get("v"));
    }

    if (url.pathname.startsWith("/shorts/")) {
        return cleanVideoId(url.pathname.split("/").filter(Boolean)[1] ?? null);
    }

    return null;
}

export function getYouTubeEmbedUrl(rawUrl: string, origin?: string): string | null {
    let videoId = getYouTubeVideoId(rawUrl);
    if (!videoId) return null;

    let embedUrl = new URL(`https://www.youtube.com/embed/${videoId}`);
    embedUrl.searchParams.set("autoplay", "1");
    embedUrl.searchParams.set("mute", "1");
    embedUrl.searchParams.set("playsinline", "1");
    embedUrl.searchParams.set("rel", "0");
    embedUrl.searchParams.set("modestbranding", "1");
    embedUrl.searchParams.set("enablejsapi", "1");

    if (origin) {
        embedUrl.searchParams.set("origin", origin);
    }

    return embedUrl.toString();
}

export function isSupportedStreamUrl(url: string): boolean {
    return !!getYouTubeVideoId(url);
}

const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"]);

function cleanVideoId(id: string | null): string | null {
    if (!id) return null;
    let trimmed = id.trim();
    let match = trimmed.match(/^[a-zA-Z0-9_-]{6,}$/);
    return match ? trimmed : null;
}

export function getYouTubeEmbedUrl(rawUrl: string): string | null {
    let url: URL;

    try {
        url = new URL(rawUrl.trim());
    } catch {
        return null;
    }

    if (!YOUTUBE_HOSTS.has(url.hostname)) return null;

    if (url.hostname === "youtu.be") {
        let id = cleanVideoId(url.pathname.split("/").filter(Boolean)[0] ?? null);
        return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (url.pathname.startsWith("/embed/")) {
        let id = cleanVideoId(url.pathname.split("/").filter(Boolean)[1] ?? null);
        return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (url.pathname.startsWith("/live/")) {
        let id = cleanVideoId(url.pathname.split("/").filter(Boolean)[1] ?? null);
        return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (url.pathname === "/watch") {
        let id = cleanVideoId(url.searchParams.get("v"));
        return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    return null;
}

export function isSupportedStreamUrl(url: string): boolean {
    return !!getYouTubeEmbedUrl(url);
}

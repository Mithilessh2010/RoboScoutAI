let apiPromise: Promise<void> | null = null;

declare global {
    interface Window {
        YT?: any;
        onYouTubeIframeAPIReady?: () => void;
    }
}

export function loadYouTubeIFrameApi(): Promise<void> {
    if (typeof window === "undefined") return Promise.resolve();
    if (window.YT?.Player) return Promise.resolve();
    if (apiPromise) return apiPromise;

    apiPromise = new Promise<void>((resolve) => {
        let existing = document.querySelector<HTMLScriptElement>('script[src="https://www.youtube.com/iframe_api"]');
        if (!existing) {
            let script = document.createElement("script");
            script.src = "https://www.youtube.com/iframe_api";
            script.async = true;
            document.head.appendChild(script);
        }

        let previous = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
            previous?.();
            resolve();
        };

        if (window.YT?.Player) {
            resolve();
        }
    });

    return apiPromise;
}

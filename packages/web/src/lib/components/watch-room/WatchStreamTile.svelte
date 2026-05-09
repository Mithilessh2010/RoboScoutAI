<script lang="ts">
    import { createEventDispatcher, onDestroy, onMount } from "svelte";
    import type { WatchPlaybackState, WatchStream } from "$lib/watch-room/types";
    import { getYouTubeEmbedUrl, getYouTubeVideoId } from "$lib/watch-room/youtubeEmbed";
    import { loadYouTubeIFrameApi } from "$lib/watch-room/youtubePlayer";

    export let stream: WatchStream;
    export let active = false;
    export let focused = false;
    export let host = false;
    export let followHost = true;
    export let roomOrigin = "";
    export let playbackState: WatchPlaybackState;

    const dispatch = createEventDispatcher<{
        remove: string;
        rename: { id: string; title: string };
        main: string;
        focus: string | null;
        playback: { kind: "play" | "pause" | "seek" | "sync"; streamId: string; currentTime: number; isPlaying: boolean };
    }>();

    let title = stream.title;
    let embedUrl = getYouTubeEmbedUrl(stream.url, roomOrigin);
    let playerHost: HTMLDivElement | null = null;
    let player: any = null;
    let polling: number | null = null;
    let ready = false;
    let lastApplied = "";

    $: embedUrl = getYouTubeEmbedUrl(stream.url, roomOrigin);
    $: title = stream.title;

    async function attachPlayer() {
        if (!active || !playerHost || !embedUrl) return;
        let videoId = getYouTubeVideoId(stream.url);
        if (!videoId) return;

        await loadYouTubeIFrameApi();

        if (player) return;

        player = new window.YT.Player(playerHost, {
            videoId,
            playerVars: {
                autoplay: 1,
                controls: 1,
                playsinline: 1,
                modestbranding: 1,
                rel: 0,
                enablejsapi: 1,
                origin: roomOrigin || undefined,
            },
            events: {
                onReady: () => {
                    ready = true;
                    applyPlaybackState(true);
                    startPolling();
                },
                onStateChange: (event: any) => {
                    if (!host) return;

                    if (event?.data === window.YT.PlayerState.PLAYING) {
                        emitPlaybackSnapshot("play");
                    } else if (event?.data === window.YT.PlayerState.PAUSED) {
                        emitPlaybackSnapshot("pause");
                    } else if (event?.data === window.YT.PlayerState.BUFFERING) {
                        emitPlaybackSnapshot("sync");
                    }
                },
            },
        });
    }

    function destroyPlayer() {
        ready = false;
        stopPolling();
        if (player?.destroy) player.destroy();
        player = null;
        if (playerHost) playerHost.innerHTML = "";
    }

    function startPolling() {
        stopPolling();
        if (!host) return;

        polling = window.setInterval(() => {
            emitPlaybackSnapshot("tick");
        }, 1500);
    }

    function stopPolling() {
        if (polling != null) {
            window.clearInterval(polling);
            polling = null;
        }
    }

    function emitPlaybackSnapshot(kind: string) {
        if (!host || !player || !ready) return;

        let currentTime = typeof player.getCurrentTime === "function" ? player.getCurrentTime() : 0;
        let isPlaying = typeof player.getPlayerState === "function" ? player.getPlayerState() === window.YT.PlayerState.PLAYING : false;

        dispatch("playback", { kind: kind as "play" | "pause" | "seek" | "sync", streamId: stream.id, currentTime, isPlaying });
    }

    function applyPlaybackState(force = false) {
        if (!active || !player || !ready || !followHost || !playbackState) return;

        let signature = `${playbackState.updatedAt}:${playbackState.currentTime}:${playbackState.isPlaying}:${playbackState.activeStreamId}`;
        if (!force && lastApplied === signature) return;
        lastApplied = signature;

        let drift = playbackState.isPlaying
            ? Math.max(0, (Date.now() - new Date(playbackState.updatedAt).getTime()) / 1000)
            : 0;
        let targetTime = playbackState.currentTime + drift;
        let currentTime = typeof player.getCurrentTime === "function" ? player.getCurrentTime() : 0;

        if (Math.abs(currentTime - targetTime) > 1.25 && typeof player.seekTo === "function") {
            player.seekTo(targetTime, true);
        }

        let state = typeof player.getPlayerState === "function" ? player.getPlayerState() : -1;
        if (playbackState.isPlaying && state !== window.YT.PlayerState.PLAYING && typeof player.playVideo === "function") {
            player.playVideo();
        }
        if (!playbackState.isPlaying && state === window.YT.PlayerState.PLAYING && typeof player.pauseVideo === "function") {
            player.pauseVideo();
        }
    }

    function rename(event: Event) {
        dispatch("rename", {
            id: stream.id,
            title: (event.currentTarget as HTMLInputElement).value,
        });
    }

    onMount(async () => {
        await attachPlayer();
    });

    $: if (active) {
        attachPlayer();
        applyPlaybackState();
    } else {
        destroyPlayer();
    }

    $: if (ready) {
        applyPlaybackState();
    }

    onDestroy(() => {
        destroyPlayer();
    });
</script>

<article class:focused={focused} class:active={active}>
    <header>
        <input aria-label="Stream title" value={title} on:change={rename} />
        <div class="actions">
            <button type="button" class:enabled={stream.isMain} on:click={() => dispatch("main", stream.id)}>
                {stream.isMain ? "Main" : "Set main"}
            </button>
            <button type="button" on:click={() => dispatch("focus", focused ? null : stream.id)}>
                {focused ? "Back" : "Focus"}
            </button>
            <button type="button" on:click={() => dispatch("remove", stream.id)}>Remove</button>
        </div>
    </header>

    {#if embedUrl}
        {#if active}
            <div class="player-shell" bind:this={playerHost}></div>
        {:else}
            <iframe
                title={stream.title}
                src={embedUrl}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowfullscreen
            />
        {/if}
    {:else}
        <div class="unsupported">
            <strong>Unsupported stream URL</strong>
            <span>Use a YouTube watch, youtu.be, live, shorts, or embed link.</span>
        </div>
    {/if}
</article>

<style>
    article {
        min-width: 0;
        overflow: hidden;
        background:
            linear-gradient(180deg, rgba(241, 233, 233, 0.035), transparent),
            rgba(21, 23, 61, 0.74);
        border: 1px solid var(--sep-color);
        border-radius: 8px;
        box-shadow: 0 18px 44px rgba(5, 6, 20, 0.24);
        animation: stream-enter 220ms ease both;
        transition:
            border-color 180ms ease,
            box-shadow 180ms ease,
            transform 180ms ease;
    }

    article.active,
    article.focused {
        border-color: rgba(228, 145, 201, 0.42);
        box-shadow: 0 22px 54px rgba(5, 6, 20, 0.3);
    }

    article:hover {
        transform: translateY(-1px);
    }

    header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--md-gap);
        padding: var(--md-pad);
        border-bottom: 1px solid var(--sep-color);
    }

    input {
        min-width: 0;
        flex: 1;
        border: 0;
        background: transparent;
        color: var(--text-color);
        font: inherit;
        font-weight: 700;
    }

    .actions {
        display: flex;
        gap: var(--sm-gap);
        flex-wrap: wrap;
        justify-content: flex-end;
    }

    button {
        border: 1px solid rgba(228, 145, 201, 0.26);
        border-radius: var(--pill-border-radius);
        padding: 6px 10px;
        color: var(--palette-pink);
        background: transparent;
        cursor: pointer;
        transition:
            color 180ms ease,
            border-color 180ms ease,
            background-color 180ms ease;
    }

    button.enabled {
        color: var(--palette-off-white);
        border-color: rgba(228, 145, 201, 0.5);
        background: rgba(152, 37, 152, 0.18);
    }

    button:hover {
        color: var(--palette-off-white);
        border-color: var(--palette-pink);
        background: rgba(152, 37, 152, 0.22);
    }

    iframe,
    .unsupported,
    .player-shell {
        display: block;
        width: 100%;
        aspect-ratio: 16 / 9;
        border: 0;
        background: rgba(5, 6, 20, 0.72);
    }

    .unsupported {
        display: grid;
        place-content: center;
        gap: var(--sm-gap);
        padding: var(--lg-pad);
        text-align: center;
        color: var(--secondary-text-color);
    }

    .unsupported strong {
        color: var(--text-color);
    }

    @keyframes stream-enter {
        from {
            opacity: 0;
            transform: translateY(8px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
</style>

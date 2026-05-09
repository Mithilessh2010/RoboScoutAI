<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { getYouTubeEmbedUrl } from "$lib/watch-room/youtubeEmbed";
    import type { WatchStream } from "$lib/watch-room/types";

    export let stream: WatchStream;
    export let removable = true;

    const dispatch = createEventDispatcher<{ remove: string; rename: { id: string; title: string } }>();

    $: embedUrl = getYouTubeEmbedUrl(stream.url);

    function renameStream(event: Event) {
        dispatch("rename", {
            id: stream.id,
            title: (event.currentTarget as HTMLInputElement).value,
        });
    }
</script>

<article class="stream-card">
    <header>
        <input
            aria-label="Stream title"
            value={stream.title}
            on:change={renameStream}
        />
        {#if removable}
            <button class="remove" title="Remove stream" on:click={() => dispatch("remove", stream.id)}>
                Remove
            </button>
        {/if}
    </header>

    {#if embedUrl}
        <iframe
            title={stream.title}
            src={embedUrl}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen
        />
    {:else}
        <div class="unsupported">
            <strong>Unsupported stream URL</strong>
            <span>Use a YouTube watch, youtu.be, live, or embed link.</span>
        </div>
    {/if}
</article>

<style>
    .stream-card {
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

    .stream-card:hover {
        border-color: rgba(228, 145, 201, 0.42);
        box-shadow: 0 22px 54px rgba(5, 6, 20, 0.3);
        transform: translateY(-1px);
    }

    header {
        display: flex;
        align-items: center;
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

    .remove {
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

    .remove:hover {
        color: var(--palette-off-white);
        border-color: var(--palette-pink);
        background: rgba(152, 37, 152, 0.22);
    }

    iframe,
    .unsupported {
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

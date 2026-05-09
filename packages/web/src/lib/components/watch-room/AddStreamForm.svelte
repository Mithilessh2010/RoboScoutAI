<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { createStream } from "$lib/watch-room/watchRoomStorage";
    import { isSupportedStreamUrl } from "$lib/watch-room/youtubeEmbed";
    import type { WatchStream } from "$lib/watch-room/types";

    const dispatch = createEventDispatcher<{ add: WatchStream }>();

    let title = "";
    let url = "";
    let error = "";

    function addStream() {
        error = "";
        if (!url.trim()) {
            error = "Paste a YouTube stream URL first.";
            return;
        }
        if (!isSupportedStreamUrl(url)) {
            error = "Use a YouTube watch, youtu.be, live, or embed URL.";
            return;
        }

        dispatch("add", createStream(title, url));
        title = "";
        url = "";
    }
</script>

<form on:submit|preventDefault={addStream}>
    <label>
        <span>Stream title</span>
        <input bind:value={title} placeholder="Field 1 livestream" />
    </label>
    <label>
        <span>YouTube URL</span>
        <input bind:value={url} placeholder="https://www.youtube.com/watch?v=..." />
    </label>
    {#if error}
        <p>{error}</p>
    {/if}
    <button>Add stream</button>
</form>

<style>
    form {
        display: grid;
        gap: var(--md-gap);
    }

    label {
        display: grid;
        gap: var(--sm-gap);
        color: var(--secondary-text-color);
        font-size: var(--sm-font-size);
        font-weight: 700;
    }

    input {
        width: 100%;
        border: 1px solid var(--sep-color);
        border-radius: 8px;
        padding: 10px 12px;
        color: var(--text-color);
        background: var(--form-bg-color);
        font: inherit;
    }

    input:focus {
        border-color: var(--palette-pink);
        box-shadow: 0 0 0 3px rgba(228, 145, 201, 0.14);
    }

    p {
        color: #ff9aaa;
        font-size: var(--sm-font-size);
    }

    button {
        min-height: 38px;
        border: 1px solid rgba(228, 145, 201, 0.32);
        border-radius: var(--pill-border-radius);
        color: var(--palette-off-white);
        background: var(--palette-purple);
        font: inherit;
        font-weight: 800;
        cursor: pointer;
        transition:
            background-color 180ms ease,
            transform 140ms ease;
    }

    button:hover {
        background: #aa2aaa;
        transform: translateY(-1px);
    }
</style>

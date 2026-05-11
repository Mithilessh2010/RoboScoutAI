<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import type { WatchNote, WatchStream } from "$lib/watch-room/types";

    export let notes: WatchNote[] = [];
    export let streams: WatchStream[] = [];

    const dispatch = createEventDispatcher<{ add: { text: string; streamId?: string } }>();

    let text = "";
    let streamId = "";

    function addNote() {
        if (!text.trim()) return;
        dispatch("add", streamId ? { text, streamId } : { text });
        text = "";
        streamId = "";
    }

    function formatTime(iso: string): string {
        return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    }
</script>

<section>
    <form on:submit|preventDefault={addNote}>
        <textarea bind:value={text} placeholder="Add a scouting note..." />
        <select bind:value={streamId}>
            <option value="">General room note</option>
            {#each streams as stream}
                <option value={stream.id}>{stream.title}</option>
            {/each}
        </select>
        <button>Save note</button>
    </form>

    <div class="notes">
        {#if notes.length}
            {#each notes as note (note.id)}
                <article>
                    <time>{formatTime(note.createdAt)}</time>
                    <p>{note.text}</p>
                </article>
            {/each}
        {:else}
            <p class="empty">No notes yet. Capture match context, robot behavior, or strategy calls here.</p>
        {/if}
    </div>
</section>

<style>
    section,
    form,
    .notes {
        display: grid;
        gap: var(--md-gap);
    }

    textarea,
    select {
        width: 100%;
        border: 1px solid var(--sep-color);
        border-radius: 8px;
        padding: 10px 12px;
        color: var(--text-color);
        background: var(--form-bg-color);
        font: inherit;
    }

    textarea {
        min-height: 96px;
        resize: vertical;
    }

    textarea:focus,
    select:focus {
        border-color: var(--palette-pink);
        box-shadow: 0 0 0 3px rgba(228, 145, 201, 0.14);
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

    article {
        padding: var(--md-pad);
        border: 1px solid var(--sep-color);
        border-radius: 8px;
        background: rgba(21, 23, 61, 0.52);
        animation: note-enter 180ms ease both;
    }

    time {
        display: block;
        margin-bottom: var(--sm-gap);
        color: var(--palette-pink);
        font-size: var(--sm-font-size);
        font-weight: 800;
    }

    .empty {
        color: var(--secondary-text-color);
    }

    @keyframes note-enter {
        from {
            opacity: 0;
            transform: translateY(6px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
</style>

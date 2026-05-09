<script lang="ts">
    import type { WatchLayout, WatchStream } from "$lib/watch-room/types";
    import StreamCard from "./StreamCard.svelte";

    export let streams: WatchStream[] = [];
    export let layout: WatchLayout = "two";

    $: visibleStreams = streams.slice(0, layout === "single" ? 1 : layout === "two" ? 2 : 4);
</script>

<section class:single={layout === "single"} class:two={layout === "two"} class:four={layout === "four"}>
    {#if visibleStreams.length}
        {#each visibleStreams as stream (stream.id)}
            <StreamCard
                {stream}
                on:remove
                on:rename
            />
        {/each}
    {:else}
        <div class="empty">
            <strong>No streams yet</strong>
            <span>Add a YouTube livestream to start the room.</span>
        </div>
    {/if}
</section>

<style>
    section {
        display: grid;
        gap: var(--lg-gap);
        align-content: start;
        transition: grid-template-columns 180ms ease;
    }

    section.single {
        grid-template-columns: minmax(0, 1fr);
    }

    section.two,
    section.four {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .empty {
        min-height: 280px;
        display: grid;
        place-content: center;
        gap: var(--sm-gap);
        padding: var(--xl-gap);
        border: 1px dashed rgba(228, 145, 201, 0.34);
        border-radius: 8px;
        background: rgba(21, 23, 61, 0.45);
        text-align: center;
        color: var(--secondary-text-color);
    }

    .empty strong {
        color: var(--text-color);
        font-size: var(--lg-font-size);
    }

    @media (max-width: 900px) {
        section.two,
        section.four {
            grid-template-columns: minmax(0, 1fr);
        }
    }
</style>

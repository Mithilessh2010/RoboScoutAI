<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import type { WatchLayout } from "$lib/watch-room/types";

    export let layout: WatchLayout;

    const dispatch = createEventDispatcher<{ change: WatchLayout }>();

    function select(nextLayout: WatchLayout) {
        layout = nextLayout;
        dispatch("change", nextLayout);
    }
</script>

<div class="layout-selector" aria-label="Stream layout">
    <button class:active={layout === "single"} on:click={() => select("single")}>1</button>
    <button class:active={layout === "two"} on:click={() => select("two")}>2</button>
    <button class:active={layout === "four"} on:click={() => select("four")}>4</button>
</div>

<style>
    .layout-selector {
        display: grid;
        grid-template-columns: repeat(3, minmax(42px, 1fr));
        gap: var(--sm-gap);
        padding: 4px;
        background: rgba(21, 23, 61, 0.58);
        border: 1px solid var(--sep-color);
        border-radius: var(--pill-border-radius);
    }

    button {
        min-height: 34px;
        border: 0;
        border-radius: var(--pill-border-radius);
        color: var(--secondary-text-color);
        background: transparent;
        font: inherit;
        font-weight: 700;
        cursor: pointer;
        transition:
            background-color 180ms ease,
            color 180ms ease,
            transform 140ms ease;
    }

    button:hover {
        color: var(--text-color);
        background: rgba(228, 145, 201, 0.12);
    }

    button:active {
        transform: scale(0.98);
    }

    button.active {
        color: var(--palette-off-white);
        background: var(--palette-purple);
    }
</style>

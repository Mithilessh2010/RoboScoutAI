<script lang="ts">
    import { getContext } from "svelte";
    import { REQUESTED_WIDTH } from "./WidthProvider.svelte";
    import type { Readable } from "svelte/store";

    export let style = "";
    export let vis = true;

    let requestedWidth: Readable<string> = getContext(REQUESTED_WIDTH);
</script>

<div style:--requested-width={$requestedWidth} {style} class:vis>
    <slot />
</div>

<style>
    div {
        margin: var(--lg-gap) auto;
        margin-bottom: var(--vl-gap);

        --side-gap: var(--lg-gap);

        position: relative;
        width: min-content;
        max-width: calc(100% - 2 * var(--side-gap));
        min-width: min(var(--requested-width), 100% - 2 * var(--side-gap));
    }

    .vis {
        background-color: var(--fg-color);
        border: 1px solid var(--sep-color);
        border-radius: 8px;
        box-shadow:
            0 16px 42px rgba(5, 6, 20, 0.22),
            inset 0 1px 0 rgba(241, 233, 233, 0.04);

        padding: var(--lg-pad);
        animation: card-enter 220ms ease both;
        transition:
            border-color 180ms ease,
            box-shadow 180ms ease,
            transform 180ms ease,
            background-color 180ms ease;
    }

    .vis:hover {
        border-color: rgba(228, 145, 201, 0.28);
        box-shadow:
            0 20px 50px rgba(5, 6, 20, 0.28),
            inset 0 1px 0 rgba(241, 233, 233, 0.06);
        transform: translateY(-1px);
    }

    @keyframes card-enter {
        from {
            opacity: 0;
            transform: translateY(6px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @media (max-width: 550px) {
        div {
            --side-gap: var(--md-gap);
        }
    }
</style>

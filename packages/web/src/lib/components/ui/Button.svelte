<script lang="ts">
    import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";
    import Fa from "svelte-fa";

    export let icon: IconDefinition | null = null;
    export let style = "";
    export let fw = false;
    export let disabled: string | null = null;
    export let title: string = "";
</script>

<button on:click {style} disabled={!!disabled} title={disabled ?? title}>
    <Fa {icon} {fw} />
    <slot />
</button>

<style>
    button {
        font-size: inherit;
        font-family: inherit;
        color: inherit;

        background: var(--theme-color);

        padding: calc(var(--md-pad) * 0.9) calc(var(--md-pad) * 2);

        border: none;
        border: 1px solid rgba(228, 145, 201, 0.32);
        border-radius: var(--pill-border-radius);
        box-shadow: 0 8px 18px rgba(152, 37, 152, 0.22);

        white-space: nowrap;
        cursor: pointer;
        transition:
            background-color 180ms ease,
            border-color 180ms ease,
            box-shadow 180ms ease,
            transform 140ms ease;
    }

    button:hover:not(:disabled) {
        background: #aa2aaa;
        border-color: var(--palette-pink);
        transform: translateY(-1px);
    }

    button:active:not(:disabled) {
        background: #842084;
        transform: translateY(0);
    }

    button:disabled {
        opacity: var(--form-disabled-opacity);
        cursor: not-allowed;
    }
</style>

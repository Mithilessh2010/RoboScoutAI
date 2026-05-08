<script lang="ts">
    import StatCell from "./StatCell.svelte";
    import type { StatColumn, StatData } from "@ftc-scout/common";
    import { createEventDispatcher } from "svelte";

    type T = $$Generic;

    export let data: StatData<T>;
    export let stats: StatColumn<T>[];
    export let focusedTeam: number | null;
    export let rankStat: StatColumn<T> | null;

    let dispatch = createEventDispatcher();
</script>

<tr on:click={() => dispatch("row_click", data)}>
    {#if rankStat}
        <StatCell {data} stat={rankStat} {focusedTeam} />
    {/if}

    {#each stats as stat}
        <StatCell {data} {stat} {focusedTeam} />
    {/each}
</tr>

<style>
    tr {
        outline: transparent 2px solid;
        outline-offset: -2px;
        transition:
            outline 0.12s ease 0s,
            background-color 160ms ease;

        cursor: pointer;
    }

    @supports selector(tr:has(td)) {
        tr:hover:not(:has(td.inner-hover:hover)) {
            outline: 2px solid var(--palette-pink);
            background-color: rgba(152, 37, 152, 0.08);
            z-index: var(--focused-row-zi);
        }
    }

    @supports not selector(tr:has(td)) {
        tr:hover {
            outline: 2px solid var(--palette-pink);
            background-color: rgba(152, 37, 152, 0.08);
            z-index: var(--focused-row-zi);
        }
    }
</style>

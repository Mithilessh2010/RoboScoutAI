<script lang="ts">
    import { onMount } from "svelte";

    export let season: number | undefined;
    export let eventCode: string | undefined;

    let loading = false;
    let error = "";
    let matches: any[] = [];

    onMount(async () => {
        if (!season || !eventCode) return;

        loading = true;
        error = "";

        try {
            let response = await fetch(`/api/ftc/schedule?season=${season}&eventCode=${eventCode}`);
            let json = await response.json();
            if (!response.ok || !json.ok) {
                throw new Error(json.error?.message || "Schedule unavailable");
            }
            matches = json.data?.schedule || json.data?.Schedule || json.data?.matches || [];
        } catch (err) {
            error = err instanceof Error ? err.message : "Schedule unavailable";
        } finally {
            loading = false;
        }
    });

    function stationList(match: any): string {
        let teams = match.teams || match.matchTeams || [];
        if (!Array.isArray(teams)) return "";
        return teams
            .map((team) => team.teamNumber || team.team?.teamNumber || team.number)
            .filter(Boolean)
            .join(", ");
    }
</script>

<section>
    {#if season && eventCode}
        <div class="event-meta">
            <span>{season}</span>
            <strong>{eventCode}</strong>
        </div>
        {#if loading}
            <p>Loading schedule...</p>
        {:else if error}
            <p>{error}. Watch Room still works without schedule data.</p>
        {:else if matches.length}
            <div class="matches">
                {#each matches.slice(0, 8) as match, index}
                    <article>
                        <strong>{match.description || match.matchName || `Match ${match.matchNumber || index + 1}`}</strong>
                        <span>{stationList(match) || "Teams pending"}</span>
                    </article>
                {/each}
            </div>
        {:else}
            <p>No schedule rows returned for this event yet.</p>
        {/if}
    {:else}
        <p>Add a season and event code to show schedule context.</p>
    {/if}
</section>

<style>
    section,
    .matches {
        display: grid;
        gap: var(--md-gap);
    }

    .event-meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--md-gap);
        color: var(--secondary-text-color);
    }

    .event-meta strong {
        color: var(--palette-pink);
        letter-spacing: 0.04em;
    }

    article {
        display: grid;
        gap: 2px;
        padding: var(--md-pad);
        border: 1px solid var(--sep-color);
        border-radius: 8px;
        background: rgba(21, 23, 61, 0.5);
    }

    article strong {
        color: var(--text-color);
    }

    article span,
    p {
        color: var(--secondary-text-color);
    }
</style>

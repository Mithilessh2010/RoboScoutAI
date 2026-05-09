<script lang="ts">
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import AddStreamForm from "$lib/components/watch-room/AddStreamForm.svelte";
    import {
        createRoom,
        encodeRoomState,
        normalizeEventCode,
        saveRoom,
    } from "$lib/watch-room/watchRoomStorage";
    import type { WatchStream } from "$lib/watch-room/types";
    import { CURRENT_SEASON } from "@ftc-scout/common";

    let name = "Competition Watch Room";
    let season: number = CURRENT_SEASON;
    let eventCode = "";
    let streams: WatchStream[] = [];

    $: {
        let querySeason = $page.url.searchParams.get("season");
        let queryEventCode = $page.url.searchParams.get("eventCode");
        if (querySeason && !Number.isNaN(+querySeason)) season = +querySeason;
        if (queryEventCode && !eventCode) eventCode = normalizeEventCode(queryEventCode) || "";
    }

    function addStream(event: CustomEvent<WatchStream>) {
        streams = [...streams, event.detail];
    }

    function removeStream(id: string) {
        streams = streams.filter((stream) => stream.id !== id);
    }

    async function submit() {
        let room = createRoom({ name, season, eventCode, streams });
        room = saveRoom(room);
        await goto(`/watch/room/${room.id}?state=${encodeRoomState(room)}`);
    }
</script>

<svelte:head>
    <title>Create Watch Room | RoboScoutAI</title>
</svelte:head>

<main>
    <section class="panel">
        <header>
            <p>New Watch Room</p>
            <h1>Create a stream wall for your team.</h1>
        </header>

        <form on:submit|preventDefault={submit}>
            <label>
                <span>Room name</span>
                <input bind:value={name} placeholder="Saturday qualifiers" />
            </label>
            <div class="row">
                <label>
                    <span>Season</span>
                    <input type="number" bind:value={season} min="2019" max="2035" />
                </label>
                <label>
                    <span>Event code</span>
                    <input bind:value={eventCode} placeholder="US..." />
                </label>
            </div>

            <div class="streams">
                <h2>Initial streams</h2>
                <AddStreamForm on:add={addStream} />
                {#if streams.length}
                    <div class="stream-list">
                        {#each streams as stream (stream.id)}
                            <article>
                                <span>{stream.title}</span>
                                <button type="button" on:click={() => removeStream(stream.id)}>Remove</button>
                            </article>
                        {/each}
                    </div>
                {/if}
            </div>

            <button class="submit">Create room</button>
        </form>
    </section>
</main>

<style>
    main {
        width: min(880px, calc(100% - 2 * var(--lg-gap)));
        margin: 0 auto;
    }

    .panel {
        padding: var(--xl-gap);
        border: 1px solid var(--sep-color);
        border-radius: 8px;
        background:
            linear-gradient(180deg, rgba(241, 233, 233, 0.04), transparent),
            rgba(31, 34, 71, 0.76);
        box-shadow: 0 18px 48px rgba(5, 6, 20, 0.22);
        animation: page-enter 220ms ease both;
    }

    header {
        margin-bottom: var(--vl-gap);
    }

    header p {
        color: var(--palette-pink);
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.08em;
    }

    form,
    label,
    .streams,
    .stream-list {
        display: grid;
        gap: var(--md-gap);
    }

    .row {
        display: grid;
        grid-template-columns: 160px 1fr;
        gap: var(--md-gap);
    }

    label span {
        color: var(--secondary-text-color);
        font-size: var(--sm-font-size);
        font-weight: 800;
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

    .streams {
        margin-top: var(--lg-gap);
        padding-top: var(--lg-gap);
        border-top: 1px solid var(--sep-color);
    }

    article {
        display: flex;
        justify-content: space-between;
        gap: var(--md-gap);
        align-items: center;
        padding: var(--md-pad);
        border: 1px solid var(--sep-color);
        border-radius: 8px;
        background: rgba(21, 23, 61, 0.45);
    }

    article button,
    .submit {
        border: 1px solid rgba(228, 145, 201, 0.32);
        border-radius: var(--pill-border-radius);
        padding: 10px 16px;
        color: var(--palette-off-white);
        background: var(--palette-purple);
        font: inherit;
        font-weight: 800;
        cursor: pointer;
        transition:
            background-color 180ms ease,
            transform 140ms ease;
    }

    article button {
        color: var(--palette-pink);
        background: transparent;
    }

    article button:hover,
    .submit:hover {
        background: #aa2aaa;
        color: var(--palette-off-white);
        transform: translateY(-1px);
    }

    .submit {
        margin-top: var(--lg-gap);
        min-height: 44px;
    }

    @media (max-width: 650px) {
        .row {
            grid-template-columns: 1fr;
        }
    }
</style>

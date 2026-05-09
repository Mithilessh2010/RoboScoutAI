<script lang="ts">
    import { onMount } from "svelte";
    import { listRooms, deleteRoom } from "$lib/watch-room/watchRoomStorage";
    import type { WatchRoom } from "$lib/watch-room/types";

    let rooms: WatchRoom[] = [];

    onMount(() => {
        rooms = listRooms();
    });

    function removeRoom(roomId: string) {
        deleteRoom(roomId);
        rooms = listRooms();
    }
</script>

<svelte:head>
    <title>Watch Room | RoboScoutAI</title>
</svelte:head>

<main>
    <section class="hero">
        <div>
            <p>RoboScoutAI Watch Room</p>
            <h1>Watch multiple FTC streams with your team.</h1>
        </div>
        <a class="primary" href="/watch/create">Create room</a>
    </section>

    <section class="panel">
        <header>
            <h2>Saved rooms</h2>
            <span>Stored on this device</span>
        </header>

        {#if rooms.length}
            <div class="rooms">
                {#each rooms as room (room.id)}
                    <article>
                        <div>
                            <h3>{room.name}</h3>
                            <p>
                                {room.streams.length} stream{room.streams.length === 1 ? "" : "s"}
                                {#if room.eventCode}
                                    · {room.season} {room.eventCode}
                                {/if}
                            </p>
                        </div>
                        <div class="actions">
                            <a href={`/watch/room/${room.id}`}>Open</a>
                            <button on:click={() => removeRoom(room.id)}>Remove</button>
                        </div>
                    </article>
                {/each}
            </div>
        {:else}
            <p class="empty">No rooms saved yet. Create one for your next event stream wall.</p>
        {/if}
    </section>
</main>

<style>
    main {
        width: min(1180px, calc(100% - 2 * var(--lg-gap)));
        margin: 0 auto;
        display: grid;
        gap: var(--vl-gap);
    }

    .hero,
    .panel,
    article {
        border: 1px solid var(--sep-color);
        border-radius: 8px;
        background:
            linear-gradient(180deg, rgba(241, 233, 233, 0.04), transparent),
            rgba(31, 34, 71, 0.76);
        box-shadow: 0 18px 48px rgba(5, 6, 20, 0.22);
    }

    .hero {
        display: flex;
        justify-content: space-between;
        gap: var(--lg-gap);
        align-items: center;
        padding: var(--xl-gap);
        animation: page-enter 220ms ease both;
    }

    .hero p,
    header span,
    article p,
    .empty {
        color: var(--secondary-text-color);
    }

    .hero p {
        color: var(--palette-pink);
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.08em;
    }

    .hero h1 {
        max-width: 760px;
        margin-top: var(--sm-gap);
    }

    .primary,
    article a,
    article button {
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

    .primary:hover,
    article a:hover,
    article button:hover {
        background: #aa2aaa;
        text-decoration: none;
        transform: translateY(-1px);
    }

    .panel {
        padding: var(--lg-pad);
    }

    header,
    article,
    .actions {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--md-gap);
    }

    .rooms {
        display: grid;
        gap: var(--md-gap);
        margin-top: var(--lg-gap);
    }

    article {
        padding: var(--lg-pad);
    }

    article button {
        background: transparent;
        color: var(--palette-pink);
    }

    .empty {
        margin-top: var(--lg-gap);
    }

    @media (max-width: 700px) {
        .hero,
        header,
        article {
            align-items: stretch;
            flex-direction: column;
        }
    }
</style>

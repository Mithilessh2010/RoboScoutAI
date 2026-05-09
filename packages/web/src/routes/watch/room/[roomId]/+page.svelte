<script lang="ts">
    import { onMount } from "svelte";
    import AddStreamForm from "$lib/components/watch-room/AddStreamForm.svelte";
    import EventSchedulePanel from "$lib/components/watch-room/EventSchedulePanel.svelte";
    import InvitePanel from "$lib/components/watch-room/InvitePanel.svelte";
    import LayoutSelector from "$lib/components/watch-room/LayoutSelector.svelte";
    import RoomNotesPanel from "$lib/components/watch-room/RoomNotesPanel.svelte";
    import StreamGrid from "$lib/components/watch-room/StreamGrid.svelte";
    import {
        addNote,
        decodeRoomState,
        encodeRoomState,
        loadRoom,
        roomFromInviteState,
        saveRoom,
        updateRoomLayout,
    } from "$lib/watch-room/watchRoomStorage";
    import type { WatchLayout, WatchRoom, WatchStream } from "$lib/watch-room/types";

    export let data: { roomId: string; inviteState: string | null };

    let room: WatchRoom | null = null;
    let inviteUrl = "";

    onMount(() => {
        room = loadRoom(data.roomId);

        if (!room && data.inviteState) {
            let state = decodeRoomState(data.inviteState);
            if (state) room = saveRoom(roomFromInviteState(data.roomId, state));
        }

        if (room) inviteUrl = buildInviteUrl(room);
    });

    $: if (room) inviteUrl = buildInviteUrl(room);

    function buildInviteUrl(room: WatchRoom): string {
        if (typeof location === "undefined") return "";
        return `${location.origin}/watch/room/${room.id}?state=${encodeRoomState(room)}`;
    }

    function persist(nextRoom: WatchRoom) {
        room = saveRoom(nextRoom);
    }

    function setLayout(layout: WatchLayout) {
        if (!room) return;
        room = updateRoomLayout(room, layout);
    }

    function addStream(event: CustomEvent<WatchStream>) {
        if (!room) return;
        persist({ ...room, streams: [...room.streams, event.detail] });
    }

    function removeStream(event: CustomEvent<string>) {
        if (!room) return;
        persist({ ...room, streams: room.streams.filter((stream) => stream.id !== event.detail) });
    }

    function renameStream(event: CustomEvent<{ id: string; title: string }>) {
        if (!room) return;
        persist({
            ...room,
            streams: room.streams.map((stream) =>
                stream.id === event.detail.id ? { ...stream, title: event.detail.title.trim() || "Event stream" } : stream
            ),
        });
    }

    function saveNote(event: CustomEvent<{ text: string; streamId?: string }>) {
        if (!room) return;
        room = addNote(room, event.detail.text, event.detail.streamId);
    }
</script>

<svelte:head>
    <title>{room?.name || "Watch Room"} | RoboScoutAI</title>
</svelte:head>

{#if room}
    <main>
        <section class="room-head">
            <div>
                <p>Watch Room</p>
                <h1>{room.name}</h1>
                {#if room.eventCode}
                    <span>{room.season} · {room.eventCode}</span>
                {/if}
            </div>
            <LayoutSelector layout={room.layout} on:change={(event) => setLayout(event.detail)} />
        </section>

        <section class="workspace">
            <div class="primary">
                <StreamGrid
                    streams={room.streams}
                    layout={room.layout}
                    on:remove={removeStream}
                    on:rename={renameStream}
                />
            </div>

            <aside>
                <section class="panel">
                    <h2>Invite teammates</h2>
                    <InvitePanel roomId={room.id} {inviteUrl} />
                </section>

                <section class="panel">
                    <h2>Add stream</h2>
                    <AddStreamForm on:add={addStream} />
                </section>

                <section class="panel">
                    <h2>Room notes</h2>
                    <RoomNotesPanel notes={room.notes} streams={room.streams} on:add={saveNote} />
                </section>

                <section class="panel">
                    <h2>Event schedule</h2>
                    <EventSchedulePanel season={room.season} eventCode={room.eventCode} />
                </section>
            </aside>
        </section>
    </main>
{:else}
    <main>
        <section class="missing">
            <h1>Room not found</h1>
            <p>This invite does not include saved room details on this device.</p>
            <a href="/watch/create">Create a new room</a>
        </section>
    </main>
{/if}

<style>
    main {
        width: min(1500px, calc(100% - 2 * var(--lg-gap)));
        margin: 0 auto;
        display: grid;
        gap: var(--lg-gap);
    }

    .room-head,
    .panel,
    .missing {
        border: 1px solid var(--sep-color);
        border-radius: 8px;
        background:
            linear-gradient(180deg, rgba(241, 233, 233, 0.04), transparent),
            rgba(31, 34, 71, 0.76);
        box-shadow: 0 18px 48px rgba(5, 6, 20, 0.22);
    }

    .room-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--lg-gap);
        padding: var(--lg-pad);
        animation: page-enter 220ms ease both;
    }

    .room-head p {
        color: var(--palette-pink);
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.08em;
    }

    .room-head span {
        color: var(--secondary-text-color);
        font-weight: 700;
    }

    .workspace {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 360px;
        gap: var(--lg-gap);
        align-items: start;
    }

    aside {
        display: grid;
        gap: var(--lg-gap);
    }

    .panel {
        padding: var(--lg-pad);
        animation: panel-enter 220ms ease both;
    }

    .panel h2 {
        margin-bottom: var(--md-gap);
        font-size: var(--lg-font-size);
    }

    .missing {
        display: grid;
        place-items: center;
        gap: var(--md-gap);
        min-height: 360px;
        padding: var(--xl-gap);
        text-align: center;
    }

    .missing p {
        color: var(--secondary-text-color);
    }

    .missing a {
        border: 1px solid rgba(228, 145, 201, 0.32);
        border-radius: var(--pill-border-radius);
        padding: 10px 16px;
        color: var(--palette-off-white);
        background: var(--palette-purple);
        font-weight: 800;
    }

    .missing a:hover {
        background: #aa2aaa;
        text-decoration: none;
    }

    @keyframes panel-enter {
        from {
            opacity: 0;
            transform: translateY(8px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @media (max-width: 1100px) {
        .workspace {
            grid-template-columns: 1fr;
        }
    }

    @media (max-width: 700px) {
        .room-head {
            align-items: stretch;
            flex-direction: column;
        }
    }
</style>

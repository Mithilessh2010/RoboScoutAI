<script lang="ts">
    import { browser } from "$app/environment";
    import { onDestroy, onMount } from "svelte";
    import {
        getDisplayName,
        getParticipantId,
        getWatchRoom,
        getWatchRoomInviteUrl,
        getWatchRoomWsUrl,
        listWatchRoomMessages,
        sendWatchRoomMessage,
        setDisplayName,
    } from "$lib/watch-room/api";
    import { getYouTubeEmbedUrl, isSupportedStreamUrl } from "$lib/watch-room/youtubeEmbed";
    import type { WatchLayoutPreference, WatchRoom, WatchRoomMessage, WatchStream } from "$lib/watch-room/types";
    import WatchStreamTile from "./WatchStreamTile.svelte";

    export let roomId: string;

    let loading = true;
    let error = "";
    let room: WatchRoom | null = null;
    let messages: WatchRoomMessage[] = [];
    let connected = false;
    let participantId = getParticipantId();
    let displayName = getDisplayName();
    let inviteCopied = false;
    let chatMessage = "";
    let followHost = true;
    let streamTitle = "";
    let streamUrl = "";
    let socket: WebSocket | null = null;
    let roomOrigin = browser ? location.origin : "";
    let displayNameDraft = displayName;
    let pendingDisplayName = displayName;
    let showDisplayNamePrompt = browser && !localStorage.getItem("roboscoutai.watchRoom.displayName");
    let activeStream: WatchStream | null = null;
    let focusStream: WatchStream | null = null;
    let visibleStreams: WatchStream[] = [];
    let livePlaybackTime = 0;
    let topParticipants: WatchRoom["participants"] = [];
    let syncStatus = "Loading";
    let canControlPlayback = false;
    let controlModeLabel = "Host Only";
    let lastControlledBy = "";

    function nowIso(): string {
        return new Date().toISOString();
    }

    function sendEvent(event: Record<string, unknown>) {
        if (socket?.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(event));
        }
    }

    async function loadRoom() {
        loading = true;
        error = "";

        try {
            room = await getWatchRoom(roomId);
            messages = await listWatchRoomMessages(roomId);
        } catch (err) {
            error = err instanceof Error ? err.message : "Watch room unavailable.";
        } finally {
            loading = false;
        }
    }

    function connectSocket() {
        socket?.close();

        socket = new WebSocket(getWatchRoomWsUrl(roomId, participantId, displayName));
        socket.onopen = () => {
            connected = true;
            error = "";
        };

        socket.onmessage = (message) => {
            let data = JSON.parse(message.data as string) as
                | { type: "room:init"; payload: { room: WatchRoom; messages: WatchRoomMessage[]; participantId: string } }
                | { type: "room:update"; payload: { room: WatchRoom } }
                | { type: "room:participants"; payload: { roomId: string; participants: WatchRoom["participants"] } }
                | { type: "room:message"; payload: { message: WatchRoomMessage } }
                | { type: "room:error"; payload: { message: string } };

            switch (data.type) {
                case "room:init":
                    room = data.payload.room;
                    messages = data.payload.messages;
                    break;
                case "room:update":
                    room = data.payload.room;
                    break;
                case "room:participants":
                    if (room) {
                        room = { ...room, participants: data.payload.participants, updatedAt: nowIso() };
                    }
                    break;
                case "room:message":
                    messages = [...messages, data.payload.message];
                    break;
                case "room:error":
                    error = data.payload.message;
                    break;
            }
        };

        socket.onclose = () => {
            connected = false;
        };
    }

    async function copyInvite() {
        try {
            await navigator.clipboard.writeText(getWatchRoomInviteUrl(roomId));
            inviteCopied = true;
            setTimeout(() => (inviteCopied = false), 1500);
        } catch {
            inviteCopied = false;
        }
    }

    function saveDisplayName() {
        displayName = displayNameDraft.trim() || "Guest";
        setDisplayName(displayName);
        sendEvent({
            type: "participant:update",
            payload: { roomId, participantId, displayName },
        });
    }

    function confirmDisplayName(useGuest = false) {
        let nextDisplayName = useGuest ? "Guest" : pendingDisplayName.trim() || "Guest";
        displayNameDraft = nextDisplayName;
        displayName = nextDisplayName;
        pendingDisplayName = nextDisplayName;
        setDisplayName(nextDisplayName);
        showDisplayNamePrompt = false;
        sendEvent({
            type: "participant:update",
            payload: { roomId, participantId, displayName: nextDisplayName },
        });
    }

    function setLayout(layoutPreference: WatchLayoutPreference, focusStreamId: string | null = null) {
        if (!room) return;

        sendEvent({
            type: "layout:update",
            payload: { roomId, participantId, layoutPreference, focusStreamId },
        });
    }

    function setMain(event: CustomEvent<string>) {
        if (!canControlPlayback) return;
        sendEvent({ type: "stream:main", payload: { roomId, participantId, streamId: event.detail } });
    }

    function addStream() {
        if (!room) return;
        if (!streamUrl.trim() || !isSupportedStreamUrl(streamUrl)) {
            error = "Use a YouTube watch, youtu.be, live, shorts, or embed URL.";
            return;
        }

        let timestamp = nowIso();
        let nextStream: WatchStream = {
            id: crypto.randomUUID().slice(0, 8),
            title: streamTitle.trim() || "Event stream",
            url: streamUrl.trim(),
            embedUrl: getYouTubeEmbedUrl(streamUrl.trim(), roomOrigin),
            position: room.streams.length,
            isMain: room.streams.length === 0,
            createdAt: timestamp,
            updatedAt: timestamp,
        };

        sendEvent({
            type: "stream:add",
            payload: { roomId, participantId, stream: nextStream },
        });

        streamTitle = "";
        streamUrl = "";
    }

    function renameStream(event: CustomEvent<{ id: string; title: string }>) {
        if (!room) return;
        sendEvent({
            type: "stream:update",
            payload: {
                roomId,
                participantId,
                streamId: event.detail.id,
                patch: { title: event.detail.title.trim() || "Event stream", updatedAt: nowIso() },
            },
        });
    }

    function removeStream(event: CustomEvent<string>) {
        if (!room) return;

        sendEvent({
            type: "stream:remove",
            payload: { roomId, participantId, streamId: event.detail },
        });
    }

    function toggleFocus(event: CustomEvent<string | null>) {
        if (!room) return;
        setLayout(event.detail ? "focus" : "auto", event.detail);
    }

    function handlePlayback(event: CustomEvent<{ kind: "play" | "pause" | "seek" | "sync"; streamId: string; currentTime: number; isPlaying: boolean }>) {
        if (!room || !canControlPlayback) return;

        let type = event.detail.kind === "pause" ? "playback:pause" : event.detail.kind === "play" ? "playback:play" : "playback:sync";
        sendEvent({
            type,
            payload: {
                roomId,
                participantId,
                streamId: event.detail.streamId,
                currentTime: event.detail.currentTime,
                isPlaying: event.detail.isPlaying,
            },
        });
    }

    function playForEveryone() {
        if (!room || !canControlPlayback) return;
        sendEvent({
            type: "playback:play",
            payload: {
                roomId,
                participantId,
                streamId: activeStream?.id ?? room.streams[0]?.id ?? "",
                currentTime: livePlaybackTime,
                isPlaying: true,
            },
        });
    }

    function pauseForEveryone() {
        if (!room || !canControlPlayback) return;
        sendEvent({
            type: "playback:pause",
            payload: {
                roomId,
                participantId,
                streamId: activeStream?.id ?? room.streams[0]?.id ?? "",
                currentTime: livePlaybackTime,
                isPlaying: false,
            },
        });
    }

    function syncToRoom() {
        if (!room) return;

        if (!canControlPlayback) {
            followHost = true;
            return;
        }

        sendEvent({
            type: "playback:sync",
            payload: {
                roomId,
                participantId,
                streamId: activeStream?.id ?? room.streams[0]?.id ?? "",
                currentTime: room.playbackState.currentTime,
                isPlaying: room.playbackState.isPlaying,
            },
        });
    }

    async function sendChat() {
        if (!room || !chatMessage.trim()) return;

        await sendWatchRoomMessage(roomId, {
            participantId,
            senderName: displayName,
            message: chatMessage.trim(),
        });

        chatMessage = "";
    }

    function formatTime(iso: string): string {
        return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    }

    function layoutClass(count: number): string {
        if (count <= 1) return "layout-1";
        if (count === 2) return "layout-2";
        if (count === 3) return "layout-3";
        if (count === 4) return "layout-4";
        return "layout-many";
    }

    $: isHost = !!room && room.hostParticipantId === participantId;
    $: canControlPlayback = !!room && (room.controlMode === "EVERYONE" || isHost);
    $: controlModeLabel = room?.controlMode === "EVERYONE" ? "Everyone Can Control" : "Host Only";
    $: inviteUrl = room ? getWatchRoomInviteUrl(room.id) : "";
    $: syncStatus = !room
        ? "Loading"
        : !connected
          ? "Disconnected"
          : canControlPlayback
            ? "You can control sync"
            : followHost
              ? "Following room playback"
              : "Local preview";
    $: {
        if (!room || !room.playbackState.controlledBy) {
            lastControlledBy = "";
        } else {
            const controlledById = room.playbackState.controlledBy;
            lastControlledBy =
                room.participants.find((participant) => participant.participantId === controlledById)?.displayName || "Unknown";
        }
    }

    $: if (room) {
        let currentRoom = room;
        activeStream =
            currentRoom.streams.find((stream) => stream.id === currentRoom.playbackState.activeStreamId) ??
            currentRoom.streams.find((stream) => stream.isMain) ??
            currentRoom.streams[0] ??
            null;
        focusStream = currentRoom.focusStreamId
            ? currentRoom.streams.find((stream) => stream.id === currentRoom.focusStreamId) ?? null
            : null;
        visibleStreams = currentRoom.streams.filter((stream) => stream.id !== focusStream?.id);
        livePlaybackTime =
            currentRoom.playbackState.currentTime +
            (currentRoom.playbackState.isPlaying
                ? Math.max(0, (Date.now() - new Date(currentRoom.playbackState.updatedAt).getTime()) / 1000)
                : 0);
        topParticipants = currentRoom.participants;
    } else {
        activeStream = null;
        focusStream = null;
        visibleStreams = [];
        livePlaybackTime = 0;
        topParticipants = [];
    }

    onMount(async () => {
        await loadRoom();
        connectSocket();
    });

    onDestroy(() => {
        socket?.close();
    });
</script>

{#if loading}
    <main class="shell loading">
        <section class="panel">Loading watch room...</section>
    </main>
{:else if error && !room}
    <main class="shell missing">
        <section class="panel error">
            <h1>Watch room unavailable</h1>
            <p>{error}</p>
            <a href="/watch/create">Create a new room</a>
        </section>
    </main>
{:else if room}
    <main class="shell">
        {#if showDisplayNamePrompt}
            <section class="panel name-prompt">
                <h2>Enter display name</h2>
                <p>Set your name before joining room chat and playback controls.</p>
                <div class="row">
                    <input bind:value={pendingDisplayName} placeholder="Guest" />
                    <button type="button" on:click={() => confirmDisplayName(false)}>Join room</button>
                    <button type="button" on:click={() => confirmDisplayName(true)}>Continue as guest</button>
                </div>
            </section>
        {/if}

        <section class="topbar panel">
            <div class="title-block">
                <p>Watch Room</p>
                <h1>{room.name}</h1>
                <div class="subline">
                    {#if room.season}
                        <span>{room.season}</span>
                    {/if}
                    {#if room.eventCode}
                        <span>{room.eventCode}</span>
                    {/if}
                    <span class:online={connected}>{connected ? "Live" : "Offline"}</span>
                    <span class="mode-badge">{controlModeLabel}</span>
                    <span class:host={isHost}>{isHost ? "Host" : "Viewer"}</span>
                </div>
            </div>

            <div class="top-actions">
                <div class="invite-box">
                    <strong>Invite teammates</strong>
                    <span>Room ID: {room.id}</span>
                    <span>{inviteUrl}</span>
                </div>
                <button type="button" on:click={copyInvite}>{inviteCopied ? "Copied" : "Copy invite link"}</button>
            </div>
        </section>

        <section class="controls panel">
            <label>
                <span>Display name</span>
                <div class="row">
                    <input bind:value={displayNameDraft} placeholder="Guest" />
                    <button type="button" on:click={saveDisplayName}>Save</button>
                </div>
            </label>

            <div class="sync-bar">
                <div>
                    <span>Sync status</span>
                    <strong>{syncStatus}</strong>
                    {#if lastControlledBy}
                        <p class="hint">Last controlled by {lastControlledBy}</p>
                    {/if}
                </div>
                <div class="sync-actions">
                    <button type="button" on:click={playForEveryone} disabled={!canControlPlayback}>Play for room</button>
                    <button type="button" on:click={pauseForEveryone} disabled={!canControlPlayback}>Pause for room</button>
                    <button type="button" on:click={syncToRoom}>Sync to room</button>
                    <button type="button" on:click={() => (followHost = !followHost)} disabled={room.controlMode !== "HOST_ONLY"}>
                        {followHost ? "Follow host on" : "Follow host off"}
                    </button>
                    <button type="button" on:click={() => setLayout("auto")}>Return to grid</button>
                </div>
            </div>

            {#if room.controlMode === "HOST_ONLY" && !isHost}
                <p class="hint">Only the host can control room playback.</p>
            {:else if room.controlMode === "EVERYONE"}
                <p class="hint">Anyone in this room can control playback.</p>
            {/if}

            <div class="layout-switcher">
                <button type="button" on:click={() => setLayout("single")}>1</button>
                <button type="button" on:click={() => setLayout("two")}>2</button>
                <button type="button" on:click={() => setLayout("grid")}>Grid</button>
                <button type="button" on:click={() => setLayout("focus", activeStream?.id ?? null)}>Focus</button>
            </div>
            <p class="hint">Best-effort sync: browser autoplay and buffering can cause slight drift. Click a player to join synced playback.</p>
        </section>

        <section class="workspace">
            <div class="streams panel">
                <div class="stream-header">
                    <div>
                        <h2>Live streams</h2>
                        <p>{room.streams.length} stream{room.streams.length === 1 ? "" : "s"}</p>
                    </div>
                    {#if activeStream}
                        <div class="active-badge">Active: {activeStream.title}</div>
                    {/if}
                </div>

                {#if room.streams.length}
                    {#if focusStream}
                        <div class="focus-panel">
                            <WatchStreamTile
                                stream={focusStream}
                                active={focusStream.id === room.playbackState.activeStreamId}
                                focused={true}
                                host={canControlPlayback}
                                followHost={followHost}
                                roomOrigin={roomOrigin}
                                playbackState={room.playbackState}
                                on:remove={removeStream}
                                on:rename={renameStream}
                                on:main={setMain}
                                on:focus={toggleFocus}
                                on:playback={handlePlayback}
                            />
                        </div>
                    {/if}

                    <div class={`grid ${layoutClass(visibleStreams.length)}`}>
                        {#each visibleStreams as stream (stream.id)}
                            <WatchStreamTile
                                stream={stream}
                                active={stream.id === room.playbackState.activeStreamId}
                                focused={room.focusStreamId === stream.id}
                                host={canControlPlayback}
                                followHost={followHost}
                                roomOrigin={roomOrigin}
                                playbackState={room.playbackState}
                                on:remove={removeStream}
                                on:rename={renameStream}
                                on:main={setMain}
                                on:focus={toggleFocus}
                                on:playback={handlePlayback}
                            />
                        {/each}
                    </div>
                {:else}
                    <div class="empty">
                        <strong>No streams yet</strong>
                        <span>Add a YouTube livestream to start the room.</span>
                    </div>
                {/if}

                <form class="add-stream" on:submit|preventDefault={addStream}>
                    <h3>Add livestream</h3>
                    <div class="row two-up">
                        <input bind:value={streamTitle} placeholder="Field 1 livestream" />
                        <input bind:value={streamUrl} placeholder="https://www.youtube.com/watch?v=..." />
                    </div>
                    <button type="submit">Add stream</button>
                </form>
            </div>

            <aside class="sidebar">
                <section class="panel chat-panel">
                    <div class="panel-head">
                        <h2>Chat</h2>
                        <span>{messages.length} message{messages.length === 1 ? "" : "s"}</span>
                    </div>

                    <div class="messages">
                        {#each messages as message (message.id)}
                            <article>
                                <header>
                                    <strong>{message.senderName}</strong>
                                    <time>{formatTime(message.createdAt)}</time>
                                </header>
                                <p>{message.message}</p>
                            </article>
                        {/each}
                    </div>

                    <form class="chat-form" on:submit|preventDefault={sendChat}>
                        <textarea bind:value={chatMessage} placeholder="Send a message to the room" />
                        <button type="submit">Send</button>
                    </form>
                </section>

                <section class="panel participants-panel">
                    <div class="panel-head">
                        <h2>Participants</h2>
                        <span>{topParticipants.length}</span>
                    </div>
                    <div class="participants">
                        {#each topParticipants as participant (participant.participantId)}
                            <article>
                                <strong>{participant.displayName}</strong>
                                <span>{participant.isHost ? "Host" : "In room"}</span>
                            </article>
                        {/each}
                    </div>
                </section>
            </aside>
        </section>
    </main>
{/if}

<style>
    .shell {
        width: min(1540px, calc(100% - 2 * var(--lg-gap)));
        margin: 0 auto;
        display: grid;
        gap: var(--lg-gap);
    }

    .panel {
        border: 1px solid var(--sep-color);
        border-radius: 10px;
        background:
            linear-gradient(180deg, rgba(241, 233, 233, 0.04), transparent),
            rgba(31, 34, 71, 0.76);
        box-shadow: 0 18px 48px rgba(5, 6, 20, 0.22);
    }

    .topbar,
    .controls,
    .name-prompt {
        display: grid;
        gap: var(--md-gap);
        padding: var(--lg-gap);
        animation: panel-enter 220ms ease both;
    }

    .topbar {
        grid-template-columns: 1fr auto;
        align-items: center;
    }

    .title-block p,
    .panel-head span,
    .subline span,
    .messages time,
    .participants span,
    .stream-header p,
    .empty span,
    .hint,
    .invite-box span {
        color: var(--secondary-text-color);
    }

    .title-block p {
        color: var(--palette-pink);
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.08em;
    }

    .subline {
        display: flex;
        flex-wrap: wrap;
        gap: var(--sm-gap);
        margin-top: var(--sm-gap);
    }

    .subline span,
    .active-badge,
    .mode-badge {
        border: 1px solid var(--sep-color);
        border-radius: var(--pill-border-radius);
        padding: 6px 10px;
        background: rgba(21, 23, 61, 0.45);
    }

    .subline span.online,
    .mode-badge {
        color: var(--palette-off-white);
        border-color: rgba(228, 145, 201, 0.32);
    }

    .subline span.host {
        color: var(--palette-pink);
        border-color: rgba(228, 145, 201, 0.42);
    }

    .top-actions,
    .sync-actions,
    .layout-switcher {
        display: flex;
        gap: var(--sm-gap);
        flex-wrap: wrap;
    }

    .top-actions {
        justify-content: flex-end;
        align-items: flex-start;
    }

    .invite-box {
        display: grid;
        gap: 4px;
        max-width: 340px;
        padding: 10px;
        border: 1px solid var(--sep-color);
        border-radius: 8px;
        background: rgba(21, 23, 61, 0.45);
    }

    button,
    a {
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

    button:hover,
    a:hover {
        background: #aa2aaa;
        transform: translateY(-1px);
        text-decoration: none;
    }

    button:disabled {
        opacity: 0.55;
        cursor: not-allowed;
        transform: none;
    }

    .row {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: var(--sm-gap);
        align-items: center;
    }

    .two-up {
        grid-template-columns: 200px 1fr;
    }

    input,
    textarea {
        width: 100%;
        border: 1px solid var(--sep-color);
        border-radius: 8px;
        padding: 10px 12px;
        color: var(--text-color);
        background: var(--form-bg-color);
        font: inherit;
    }

    textarea {
        min-height: 84px;
        resize: vertical;
    }

    input:focus,
    textarea:focus {
        border-color: var(--palette-pink);
        box-shadow: 0 0 0 3px rgba(228, 145, 201, 0.14);
        outline: none;
    }

    .sync-bar {
        display: flex;
        justify-content: space-between;
        gap: var(--md-gap);
        align-items: center;
        flex-wrap: wrap;
    }

    .sync-bar strong,
    .active-badge,
    .mode-badge {
        color: var(--palette-pink);
    }

    .layout-switcher button {
        min-width: 52px;
    }

    .workspace {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 390px;
        gap: var(--lg-gap);
        align-items: start;
    }

    .streams,
    .sidebar {
        display: grid;
        gap: var(--lg-gap);
    }

    .streams,
    .participants-panel,
    .chat-panel,
    .loading,
    .missing {
        padding: var(--lg-gap);
    }

    .stream-header,
    .panel-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--md-gap);
    }

    .stream-header h2,
    .panel h2 {
        font-size: var(--lg-font-size);
    }

    .grid {
        display: grid;
        gap: var(--lg-gap);
        margin-top: var(--lg-gap);
        align-content: start;
    }

    .layout-1 {
        grid-template-columns: minmax(0, 1fr);
    }

    .layout-2,
    .layout-4 {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .layout-3 {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .layout-many {
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        max-height: 72rem;
        overflow: auto;
        padding-right: 4px;
    }

    .focus-panel {
        margin-top: var(--lg-gap);
    }

    .empty {
        min-height: 260px;
        display: grid;
        place-content: center;
        gap: var(--sm-gap);
        margin-top: var(--lg-gap);
        padding: var(--xl-gap);
        border: 1px dashed rgba(228, 145, 201, 0.34);
        border-radius: 8px;
        background: rgba(21, 23, 61, 0.45);
        text-align: center;
    }

    .add-stream,
    .chat-form,
    .participants-panel,
    .chat-panel {
        display: grid;
        gap: var(--md-gap);
    }

    .messages,
    .participants {
        display: grid;
        gap: var(--sm-gap);
        max-height: 24rem;
        overflow: auto;
    }

    .messages article,
    .participants article {
        padding: var(--md-pad);
        border: 1px solid var(--sep-color);
        border-radius: 8px;
        background: rgba(21, 23, 61, 0.52);
    }

    .messages article header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--sm-gap);
        margin-bottom: 4px;
    }

    .hint {
        margin: 0;
        font-size: var(--sm-font-size);
    }

    .error {
        display: grid;
        gap: var(--md-gap);
        place-items: start;
    }

    .error p {
        color: var(--secondary-text-color);
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

    @media (max-width: 1200px) {
        .workspace {
            grid-template-columns: 1fr;
        }
    }

    @media (max-width: 760px) {
        .topbar,
        .sync-bar,
        .row,
        .two-up,
        .stream-header,
        .panel-head {
            grid-template-columns: 1fr;
            flex-direction: column;
            align-items: stretch;
        }

        .top-actions {
            justify-content: stretch;
        }

        .layout-2,
        .layout-3,
        .layout-4,
        .layout-many {
            grid-template-columns: minmax(0, 1fr);
        }
    }
</style>

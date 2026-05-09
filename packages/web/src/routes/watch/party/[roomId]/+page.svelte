<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { browser } from '$app/environment';
    import { getWatchRoom, patchWatchRoom, getParticipantId, getDisplayName, setDisplayName, listWatchRoomMessages, sendWatchRoomMessage } from '$lib/watch-room/api';
    export let data: { roomId: string };

    let room: any = null;
    let loading = true;
    let error = '';
    let displayName = getDisplayName();
    let messages: any[] = [];
    let chat = '';
    let polling: number | null = null;
    let controlMode: 'HOST_ONLY' | 'EVERYONE' = 'HOST_ONLY';
    let participantId = getParticipantId();

    async function load() {
        loading = true;
        try {
            room = await getWatchRoom(data.roomId);
            controlMode = room?.controlMode || 'HOST_ONLY';
            messages = await listWatchRoomMessages(data.roomId);
        } catch (err) {
            error = err instanceof Error ? err.message : 'Unable to load party.';
        } finally {
            loading = false;
        }
    }

    function startPolling() {
        stopPolling();
        polling = window.setInterval(async () => {
            try {
                messages = await listWatchRoomMessages(data.roomId);
            } catch {}
        }, 2000);
    }

    function stopPolling() {
        if (polling) {
            clearInterval(polling);
            polling = null;
        }
    }

    async function send() {
        if (!chat.trim()) return;
        try {
            await sendWatchRoomMessage(data.roomId, { participantId, senderName: displayName || 'Guest', message: chat.trim() });
            chat = '';
            messages = await listWatchRoomMessages(data.roomId);
        } catch (err) {}
    }

    async function playForRoom() {
        if (!room) return;
        await patchWatchRoom(data.roomId, { playbackState: { activeStreamId: room.playbackState.activeStreamId ?? room.streams[0]?.id ?? null, isPlaying: true, currentTime: room.playbackState?.currentTime ?? 0, controlledBy: participantId, updatedAt: new Date().toISOString() } });
        await load();
    }

    async function pauseForRoom() {
        if (!room) return;
        await patchWatchRoom(data.roomId, { playbackState: { activeStreamId: room.playbackState.activeStreamId ?? room.streams[0]?.id ?? null, isPlaying: false, currentTime: room.playbackState?.currentTime ?? 0, controlledBy: participantId, updatedAt: new Date().toISOString() } });
        await load();
    }

    function copyInvite() {
        if (!browser) return;
        navigator.clipboard.writeText(`${location.origin}/watch/party/${data.roomId}`);
    }

    onMount(async () => {
        await load();
        startPolling();
    });

    onDestroy(() => stopPolling());
    
</script>

{#if loading}
    <main class="panel">Loading party...</main>
{:else if error}
    <main class="panel">{error}</main>
{:else}
    <main class="panel party-page">
        <header class="top">
            <h1>{room?.name || 'Party'}</h1>
            <div class="actions">
                <button on:click={copyInvite}>Copy invite link</button>
            </div>
        </header>

        <section class="streams">
            {#if room?.streams?.length === 0}
                <div class="empty">No streams in this party yet.</div>
            {:else}
                <div class="grid">
                    {#each room.streams as s (s.id)}
                        <article>
                            <iframe title={s.title} src={s.embedUrl} allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" allowfullscreen />
                            <div class="meta">
                                <strong>{s.title}</strong>
                            </div>
                        </article>
                    {/each}
                </div>
            {/if}
        </section>

        <aside class="party-side">
            <label>
                <span>Your name</span>
                <input bind:value={displayName} on:change={() => setDisplayName(displayName)} />
            </label>

            <div class="controls">
                <strong>Playback</strong>
                <div class="ctrls">
                    <button on:click={playForRoom} disabled={controlMode === 'HOST_ONLY' && room.hostParticipantId !== participantId}>Play for room</button>
                    <button on:click={pauseForRoom} disabled={controlMode === 'HOST_ONLY' && room.hostParticipantId !== participantId}>Pause for room</button>
                </div>
                <p class="hint">{controlMode === 'HOST_ONLY' ? (room.hostParticipantId === participantId ? 'You are host' : 'Only the host can control playback') : 'Anyone can control playback'}</p>
            </div>

            <section class="chat">
                <strong>Chat</strong>
                <div class="messages">
                    {#each messages as m}
                        <div class="msg"><strong>{m.senderName}</strong> <span class="time">{new Date(m.createdAt).toLocaleTimeString()}</span><div class="body">{m.message}</div></div>
                    {/each}
                </div>
                <form on:submit|preventDefault={send} class="chat-form">
                    <input bind:value={chat} placeholder="Say something" />
                    <button type="submit">Send</button>
                </form>
            </section>
        </aside>
    </main>
{/if}

<style>
    .top { display:flex; justify-content:space-between; align-items:center; padding:1rem }
    .grid { display:grid; gap:12px; grid-template-columns: repeat(auto-fit,minmax(260px,1fr)) }
    iframe { width:100%; aspect-ratio:16/9; border:0 }
    .party-page { display:grid; grid-template-columns: 1fr 320px; gap:16px; padding:16px }
    .party-side { display:flex; flex-direction:column; gap:12px }
    .messages { max-height:40vh; overflow:auto; display:grid; gap:8px }
    .chat-form { display:flex; gap:8px }
    .chat-form input { flex:1 }
    .hint { color: #E491C9 }
</style>

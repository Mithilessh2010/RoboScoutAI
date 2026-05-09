<script lang="ts">
    import { goto } from "$app/navigation";
    import { browser } from "$app/environment";
    import { CURRENT_SEASON } from "@ftc-scout/common";
    import { createWatchRoom, getDisplayName, getParticipantId, patchWatchRoom, setDisplayName } from "$lib/watch-room/api";
    import { getYouTubeEmbedUrl, isSupportedStreamUrl } from "$lib/watch-room/youtubeEmbed";
    import type { WatchControlMode, WatchStream } from "$lib/watch-room/types";

    let name = "Competition Watch Room";
    let season: number = CURRENT_SEASON;
    let eventCode = "";
    let displayName = getDisplayName();
    let continueAsGuest = displayName === "Guest";
    let controlMode: WatchControlMode = "HOST_ONLY";
    let streamTitle = "";
    let streamUrl = "";
    let streams: WatchStream[] = [];
    let error = "";

    function addStream() {
        error = "";
        if (!streamUrl.trim()) {
            error = "Paste a YouTube stream URL first.";
            return;
        }
        if (!isSupportedStreamUrl(streamUrl)) {
            error = "Use a YouTube watch, youtu.be, live, shorts, or embed URL.";
            return;
        }

        let timestamp = new Date().toISOString();
        streams = [
            ...streams,
            {
                id: crypto.randomUUID().slice(0, 8),
                title: streamTitle.trim() || "Event stream",
                url: streamUrl.trim(),
                embedUrl: getYouTubeEmbedUrl(streamUrl.trim(), browser ? location.origin : undefined),
                position: streams.length,
                isMain: streams.length === 0,
                createdAt: timestamp,
                updatedAt: timestamp,
            },
        ];

        streamTitle = "";
        streamUrl = "";
    }

    function removeStream(id: string) {
        streams = streams.filter((stream) => stream.id !== id).map((stream, index) => ({ ...stream, position: index }));
    }

    async function submit() {
        error = "";

        try {
            let participantDisplayName = continueAsGuest ? "Guest" : displayName.trim() || "Guest";

            let room = await createWatchRoom({
                name,
                season,
                eventCode: eventCode || null,
                participantId: getParticipantId(),
                displayName: participantDisplayName,
                controlMode,
            });

            displayName = participantDisplayName;
            setDisplayName?.(participantDisplayName);

            if (streams.length) {
                await patchWatchRoom(room.id, { streams });
            }

            await goto(`/watch/room/${room.id}`);
        } catch (err) {
            error = err instanceof Error ? err.message : "Unable to create room.";
        }
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
            <label>
                <span>Display name</span>
                <input bind:value={displayName} placeholder="Guest" disabled={continueAsGuest} />
            </label>
            <button class="guest-toggle" type="button" on:click={() => (continueAsGuest = !continueAsGuest)}>
                {continueAsGuest ? "Using guest mode" : "Continue as guest"}
            </button>
            <p class="guest-note">
                {continueAsGuest
                    ? "You can enter the room without choosing a display name."
                    : "Turn on guest mode if you want to skip sign-in style setup and join anonymously."}
            </p>

            <fieldset class="control-mode">
                <legend>Playback control mode</legend>
                <label>
                    <input type="radio" bind:group={controlMode} value="HOST_ONLY" />
                    Host Only
                </label>
                <label>
                    <input type="radio" bind:group={controlMode} value="EVERYONE" />
                    Everyone Can Control
                </label>
            </fieldset>
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
                <div class="add-row">
                    <input bind:value={streamTitle} placeholder="Stream title" />
                    <input bind:value={streamUrl} placeholder="https://www.youtube.com/watch?v=..." />
                    <button type="button" on:click={addStream}>Add</button>
                </div>

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

            {#if error}
                <p class="error">{error}</p>
            {/if}

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

    .row,
    .add-row {
        display: grid;
        grid-template-columns: 160px 1fr;
        gap: var(--md-gap);
    }

    .add-row {
        grid-template-columns: 200px 1fr auto;
    }

    label span,
    .error {
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
    .submit,
    .add-row button {
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
    .submit:hover,
    .add-row button:hover {
        background: #aa2aaa;
        color: var(--palette-off-white);
        transform: translateY(-1px);
    }

    .submit {
        margin-top: var(--lg-gap);
        min-height: 44px;
    }

    .error {
        margin-top: var(--sm-gap);
    }

    .guest-toggle {
        width: fit-content;
        border: 1px solid rgba(228, 145, 201, 0.32);
        border-radius: var(--pill-border-radius);
        padding: 8px 14px;
        color: var(--palette-off-white);
        background: rgba(126, 38, 153, 0.6);
        font: inherit;
        font-weight: 800;
        cursor: pointer;
        transition:
            background-color 180ms ease,
            transform 140ms ease;
    }

    .guest-toggle:hover {
        background: #aa2aaa;
        transform: translateY(-1px);
    }

    .guest-note {
        margin-top: -0.35rem;
        color: var(--secondary-text-color);
        font-size: var(--sm-font-size);
    }

    .control-mode {
        display: grid;
        gap: var(--sm-gap);
        border: 1px solid var(--sep-color);
        border-radius: 8px;
        padding: var(--md-pad);
        background: rgba(21, 23, 61, 0.45);
    }

    .control-mode legend {
        color: var(--secondary-text-color);
        font-size: var(--sm-font-size);
        font-weight: 800;
        padding: 0 4px;
    }

    .control-mode label {
        display: flex;
        align-items: center;
        gap: var(--sm-gap);
    }

    @media (max-width: 650px) {
        .row,
        .add-row,
        article {
            grid-template-columns: 1fr;
            display: grid;
        }
    }
</style>

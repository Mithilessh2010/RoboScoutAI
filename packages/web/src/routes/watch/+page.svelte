<script lang="ts">
    import { browser } from '$app/environment';
    import { getStreamEmbedUrl } from '$lib/watch-room/streamUtils';

    let streams: Array<{ id: string; title: string; url: string; embedUrl: string | null; provider: string | null }> = [];
    let showModal = false;
    let url = '';
    let title = '';
    let error = '';
    let focusId: string | null = null;

    function openAdd() {
        error = '';
        url = '';
        title = '';
        showModal = true;
    }

    function addStream() {
        error = '';
        const trimmed = url.trim();
        if (!trimmed) {
            error = 'Paste a stream link first.';
            return;
        }
        const { provider, embedUrl } = getStreamEmbedUrl(trimmed, browser ? location.origin : undefined);
        if (!embedUrl) {
            error = 'Unsupported stream link. Try a YouTube or Twitch link.';
            return;
        }
        streams = [...streams, { id: crypto.randomUUID().slice(0, 8), title: title.trim() || 'Live stream', url: trimmed, embedUrl, provider }];
        showModal = false;
    }

    function remove(id: string) {
        streams = streams.filter((s) => s.id !== id);
        if (focusId === id) focusId = null;
    }

    function toggleFocus(id: string) {
        focusId = focusId === id ? null : id;
    }
</script>

<svelte:head>
    <title>Watch | RoboScoutAI</title>
</svelte:head>

<main class="watch-page">
    <header class="topbar">
        <h1>Watch</h1>
        <div class="actions">
            <button on:click={openAdd}>Add Stream</button>
        </div>
    </header>

    {#if streams.length === 0}
        <section class="empty">
            <p>Add your first stream to get started.</p>
            <button on:click={openAdd}>Add Stream</button>
        </section>
    {:else}
        <section class={focusId ? 'focus-mode' : 'grid-mode'}>
            {#if focusId}
                {#each streams as s (s.id)}
                    {#if s.id === focusId}
                        <div class="focus">
                            <iframe title={s.title} src={s.embedUrl} allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" allowfullscreen />
                            <div class="meta">
                                <strong>{s.title}</strong>
                                <div class="meta-actions">
                                    <button on:click={() => toggleFocus(s.id)}>Back to grid</button>
                                    <button on:click={() => remove(s.id)}>Remove</button>
                                </div>
                            </div>
                        </div>
                    {/if}
                {/each}
            {:else}
                <div class="grid">
                    {#each streams as s (s.id)}
                        <article class="stream-card">
                            <iframe title={s.title} src={s.embedUrl} allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" allowfullscreen />
                            <div class="meta">
                                <strong>{s.title}</strong>
                                <div class="meta-actions">
                                    <button on:click={() => toggleFocus(s.id)}>Focus</button>
                                    <button on:click={() => remove(s.id)}>Remove</button>
                                </div>
                            </div>
                        </article>
                    {/each}
                </div>
            {/if}
        </section>
    {/if}

    {#if showModal}
        <div class="modal" role="dialog" tabindex="-1" on:click={() => (showModal = false)} on:keydown={(e) => e.key === 'Escape' && (showModal = false)}>
            <form class="modal-card" on:click|stopPropagation on:submit|preventDefault={addStream}>
                <h3>Add Stream</h3>
                {#if error}
                    <p class="error">{error}</p>
                {/if}
                <label>
                    <span>Stream URL</span>
                    <input bind:value={url} placeholder="https://www.youtube.com/watch?v=..." />
                </label>
                <label>
                    <span>Title (optional)</span>
                    <input bind:value={title} placeholder="Optional title" />
                </label>
                <div class="row actions">
                    <button type="submit">Add</button>
                    <button type="button" on:click={() => (showModal = false)}>Cancel</button>
                </div>
            </form>
        </div>
    {/if}
</main>

<style>
    .watch-page { max-width:1200px; margin:0 auto; padding:20px }
    .topbar { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px }
    .actions { display:flex; gap:12px }
    button { border:1px solid rgba(152,37,152,0.32); background:var(--palette-purple); color:var(--palette-off-white); padding:8px 12px; border-radius:8px; cursor:pointer }
    .empty { display:grid; place-items:center; gap:12px; padding:40px; border:1px dashed rgba(228,145,201,0.22); border-radius:8px }
    .grid { display:grid; gap:12px; grid-template-columns: repeat(auto-fit,minmax(300px,1fr)) }
    .focus { display:block }
    .stream-card { background:rgba(21,23,61,0.7); border-radius:8px; overflow:hidden; padding:8px }
    iframe { width:100%; aspect-ratio:16/9; border:0 }
    .meta { display:flex; justify-content:space-between; align-items:center; margin-top:8px }
    .meta-actions { display:flex; gap:8px }
    .modal { position:fixed; inset:0; display:grid; place-items:center; background:rgba(0,0,0,0.45) }
    .modal-card { background:var(--panel-bg, rgba(31,34,71,0.9)); padding:18px; border-radius:10px; width:min(640px,92%) }
    .error { color:#ffb3c9 }
</style>

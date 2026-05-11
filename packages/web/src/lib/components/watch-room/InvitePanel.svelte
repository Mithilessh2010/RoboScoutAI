<script lang="ts">
    export let inviteUrl = "";
    export let roomId = "";

    let copied = false;

    async function copyInvite() {
        try {
            await navigator.clipboard.writeText(inviteUrl);
            copied = true;
            setTimeout(() => (copied = false), 1800);
        } catch {
            copied = false;
        }
    }
</script>

<section>
    <div>
        <span>Room code</span>
        <strong>{roomId}</strong>
    </div>
    <label>
        <span>Invite link</span>
        <input readonly value={inviteUrl} on:focus={(event) => event.currentTarget.select()} />
    </label>
    <button on:click={copyInvite}>{copied ? "Copied" : "Copy invite"}</button>
</section>

<style>
    section {
        display: grid;
        gap: var(--md-gap);
    }

    div,
    label {
        display: grid;
        gap: var(--sm-gap);
    }

    span {
        color: var(--secondary-text-color);
        font-size: var(--sm-font-size);
        font-weight: 700;
    }

    strong {
        color: var(--palette-pink);
        font-size: var(--lg-font-size);
        letter-spacing: 0.04em;
    }

    input {
        min-width: 0;
        width: 100%;
        border: 1px solid var(--sep-color);
        border-radius: 8px;
        padding: 10px 12px;
        color: var(--text-color);
        background: var(--form-bg-color);
        font: inherit;
    }

    button {
        min-height: 38px;
        border: 1px solid rgba(228, 145, 201, 0.32);
        border-radius: var(--pill-border-radius);
        color: var(--palette-off-white);
        background: var(--palette-purple);
        font: inherit;
        font-weight: 800;
        cursor: pointer;
        transition:
            background-color 180ms ease,
            transform 140ms ease;
    }

    button:hover {
        background: #aa2aaa;
        transform: translateY(-1px);
    }
</style>

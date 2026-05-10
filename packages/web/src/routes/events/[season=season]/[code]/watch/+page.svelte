<script lang="ts">
    export let data: { season: number; eventCode: string };
</script>

<svelte:head>
    <title>{data.eventCode} Watch Room | RoboScoutAI</title>
</svelte:head>

<main>
    <section>
        <p>Event Watch</p>
        <h1>{data.season} {data.eventCode}</h1>
        <span>Open the local Watch page, then add the event livestreams you want to monitor.</span>
        <a href="/watch">Open Watch</a>
    </section>
</main>

<style>
    main {
        width: min(840px, calc(100% - 2 * var(--lg-gap)));
        margin: 0 auto;
    }

    section {
        display: grid;
        gap: var(--md-gap);
        padding: var(--xl-gap);
        border: 1px solid var(--sep-color);
        border-radius: 8px;
        background:
            linear-gradient(180deg, rgba(241, 233, 233, 0.04), transparent),
            rgba(31, 34, 71, 0.76);
        box-shadow: 0 18px 48px rgba(5, 6, 20, 0.22);
        animation: page-enter 220ms ease both;
    }

    p {
        color: var(--palette-pink);
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.08em;
    }

    span {
        color: var(--secondary-text-color);
    }

    a {
        width: fit-content;
        margin-top: var(--md-gap);
        border: 1px solid rgba(228, 145, 201, 0.32);
        border-radius: var(--pill-border-radius);
        padding: 10px 16px;
        color: var(--palette-off-white);
        background: var(--palette-purple);
        font-weight: 800;
    }

    a:hover {
        background: #aa2aaa;
        text-decoration: none;
    }
</style>

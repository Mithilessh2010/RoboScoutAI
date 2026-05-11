<script lang="ts">
    import { page } from "$app/stores";
    import { IS_DEV } from "$lib/constants";

    export let title: string;
    export let description: string =
        "RoboScoutAI is a premium FTC scouting and statistics platform for teams, events, matches, rankings, and strategy.";
    export let image = "/img/roboscoutai-logo.svg";
    export let url: string | null = null;
    export let canonical: string | null = null;

    // import { env } from "$env/dynamic/public";
    // const endpoint = `http${IS_DEV ? "" : "s"}://${env.PUBLIC_SERVER_ORIGIN}`;
</script>

<svelte:head>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" />
    <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap"
        rel="stylesheet"
    />

    <link rel="apple-touch-icon" href="/img/roboscoutai-logo.svg" />
    <link rel="icon" type="image/svg+xml" href="/img/roboscoutai-logo.svg" />
    <link rel="manifest" href="/head/site.webmanifest" />
    <link rel="mask-icon" href="/head/safari-pinned-tab.svg" color="#982598" />
    <meta name="msapplication-TileColor" content="#15173D" />
    <meta name="theme-color" content="#15173D" />
    <meta property="og:site_name" content="RoboScoutAI" />

    <title>{IS_DEV ? "*" : ""}{title}</title>
    <meta name="description" content={description} />
    <meta property="og:title" content={title} />
    <meta property="og:image" content={image} />
    <meta property="og:description" content={description} />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="theme-color" content="#15173D" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="620" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content={url ?? $page.url.toString()} />

    {#if canonical}
        <link rel="canonical" href={$page.url.origin + canonical} />
    {/if}

    <slot />
</svelte:head>

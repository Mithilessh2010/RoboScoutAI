<script lang="ts">
    import Card from "$lib/components/Card.svelte";
    import Head from "$lib/components/Head.svelte";
    import WidthProvider from "$lib/components/WidthProvider.svelte";
</script>

<Head title="RoboScoutAI" description="RoboScoutAI FTC scouting and statistics." />

<WidthProvider width="850px">
    <Card>
        <h1>RoboScoutAI</h1>
        <p>This public information page has been retired.</p>
    </Card>
</WidthProvider>

<style>
    h1 {
        margin-bottom: var(--md-gap);
    }

    p {
        color: var(--secondary-text-color);
        line-height: 1.75;
    }
</style>

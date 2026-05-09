<script lang="ts">
    import WatchRoomShell from "$lib/components/watch-room/WatchRoomShell.svelte";

    export let data: { roomId: string };
</script>

<svelte:head>
    <title>Watch Room | RoboScoutAI</title>
</svelte:head>

<WatchRoomShell roomId={data.roomId} />

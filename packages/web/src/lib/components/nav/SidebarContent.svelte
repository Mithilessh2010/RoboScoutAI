<script lang="ts">
    import {
        faCalendarAlt,
        faClose,
        faHashtag,
        faHome,
        faTrophy,
        faTv,
    } from "@fortawesome/free-solid-svg-icons";
    import SidebarItem from "./SidebarItem.svelte";
    import { sidebarOpen } from "./Sidebar.svelte";
    import Fa from "svelte-fa";
    import { CURRENT_SEASON } from "@ftc-scout/common";
</script>

<b>
    <span>Navigate</span>
    <button on:click={() => ($sidebarOpen = false)}>
        <Fa icon={faClose} size="1.75x" style="margin-right: var(--md-gap)" />
    </button>
</b>

<SidebarItem icon={faHome} name="Home" link="/" strict />
<SidebarItem icon={faCalendarAlt} name="Events" link="/events/{CURRENT_SEASON}" />
<SidebarItem icon={faHashtag} name="Teams" link="/teams" />
<SidebarItem icon={faTrophy} name="Season Records" link="/records/{CURRENT_SEASON}/teams" />
<SidebarItem icon={faTv} name="Watch Room" link="/watch" />

<style>
    b {
        display: none;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--lg-gap);

        font-size: var(--vl-font-size);
        font-weight: 600;
    }

    @media (max-width: 1500px) {
        b {
            display: flex;
        }
    }

    button {
        background: none;
        border: none;
    }
</style>

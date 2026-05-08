<script lang="ts" context="module">
    function loadAlertPreference(): "show" | "hide" {
        if (!browser) return "hide";
        let parsed = parse(document.cookie)[ALERT_COOKIE_NAME];
        return parsed == undefined ? "show" : "hide";
    }

    export let theme = writable(loadAlertPreference());
</script>

<script lang="ts">
    import { serialize, parse } from "cookie";
    import { writable } from "svelte/store";
    import Fa from "svelte-fa";
    import { faClose, faArrowRight, faInfoCircle } from "@fortawesome/free-solid-svg-icons";
    import { ALERT_COOKIE_AGE, ALERT_COOKIE_NAME } from "../../constants";
    import { browser } from "$app/environment";

    export let message: string;
    export let link: string | null = null;

    function hide() {
        $theme = "hide";
        document.cookie = serialize(ALERT_COOKIE_NAME, "hide", {
            path: "/",
            maxAge: ALERT_COOKIE_AGE,
            httpOnly: false,
        });
    }
</script>

<div class="wrap" class:show={$theme == "show"}>
    <div><Fa icon={faInfoCircle} /> {message}</div>

    <div>
        {#if link}
            <a href={link} target="_blank" rel="noopener noreferrer">
                <Fa icon={faArrowRight} fw size="1.5x" />
            </a>
        {/if}
        <button on:click={hide}>
            <Fa icon={faClose} fw size="1.5x" />
        </button>
    </div>
</div>

<style>
    .wrap {
        display: none;
        align-items: center;
        justify-content: space-between;
        gap: var(--md-gap);
        padding: var(--md-pad) var(--lg-pad);

        background: rgba(152, 37, 152, 0.82);
        color: var(--palette-off-white);
        font-size: var(--lg-font-size);
        font-weight: bold;

        border-radius: 8px;
        border: 1px solid rgba(228, 145, 201, 0.35);
        box-shadow: 0 12px 28px rgba(5, 6, 20, 0.22);
    }

    .show {
        display: flex;
    }

    a {
        color: inherit;
    }

    button {
        padding: none;
        border: none;
        background: none;
        color: inherit;
        font-size: inherit;
    }

    a,
    button {
        display: inline-block;
        cursor: pointer;
        border-radius: var(--pill-border-radius);
        background: transparent;
        transition:
            background-color 180ms ease,
            transform 140ms ease;
    }

    :is(a, button):hover {
        background: rgba(241, 233, 233, 0.12);
        filter: none;
        transform: translateY(-1px);
    }
</style>

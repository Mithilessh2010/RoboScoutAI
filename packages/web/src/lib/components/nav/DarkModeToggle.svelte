<script lang="ts" context="module">
    function getSystemColorScheme(): "light" | "dark" {
        return browser
            ? window.matchMedia("(prefers-color-scheme: dark)").matches
                ? "dark"
                : "light"
            : "light";
    }

    function loadThemePreference(): {
        preference: "system" | "light" | "dark";
        rendered: "light" | "dark";
    } {
        let cookie = browser ? parse(document.cookie)[THEME_COOKIE_NAME] : undefined;
        let parsed = undefined;
        try {
            parsed = JSON.parse(cookie ?? "");
        } catch {}
        return (
            parsed ?? {
                preference: "system" as const,
                rendered: getSystemColorScheme(),
            }
        );
    }

    export let theme = writable(loadThemePreference());

    export let tippyTheme: Readable<"light" | "dark"> = derived(theme, ($theme) =>
        $theme.rendered == "light" ? "dark" : "light"
    );
</script>

<script lang="ts">
    import { serialize, parse } from "cookie";
    import { derived, writable, type Readable } from "svelte/store";
    import Fa from "svelte-fa";
    import { faMoon, faSun } from "@fortawesome/free-solid-svg-icons";
    import { THEME_COOKIE_AGE, THEME_COOKIE_NAME } from "../../constants";
    import { browser } from "$app/environment";

    function handleThemeChange(newTheme: typeof $theme) {
        if (!browser) return;

        document.body.classList.remove("dark");
        document.body.classList.remove("light");
        document.body.classList.remove("system");
        document.body.classList.add(newTheme.preference);

        document.cookie = serialize(THEME_COOKIE_NAME, JSON.stringify(newTheme), {
            path: "/",
            maxAge: THEME_COOKIE_AGE,
            httpOnly: false,
        });
    }

    function setTheme(next: "light" | "dark") {
        $theme = {
            preference: next,
            rendered: next,
        };
        handleThemeChange($theme);
    }
</script>

<form method="POST" action="/toggle-theme">
    <button
        type="button"
        class:active={$theme.rendered == "light"}
        aria-pressed={$theme.rendered == "light"}
        aria-label="Use light mode"
        name="currTheme"
        value="dark"
        on:click={() => setTheme("light")}
    >
        <Fa icon={faSun} fw size="1.05x" />
    </button>

    <button
        type="button"
        class:active={$theme.rendered == "dark"}
        aria-pressed={$theme.rendered == "dark"}
        aria-label="Use dark mode"
        name="currTheme"
        value="light"
        on:click={() => setTheme("dark")}
    >
        <Fa icon={faMoon} fw size="1.05x" />
    </button>
</form>

<style>
    form {
        display: flex;
        align-items: center;
        gap: 2px;
        padding: 3px;
        border: 1px solid rgba(228, 145, 201, 0.28);
        border-radius: var(--pill-border-radius);
        background: rgba(21, 23, 61, 0.52);
    }

    button {
        width: 32px;
        height: 32px;
        padding: 0;
        border: none;
        border-radius: var(--pill-border-radius);
        background: transparent;
        color: var(--theme-text-color);

        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition:
            background-color 180ms ease,
            color 180ms ease,
            transform 140ms ease;
    }

    button:hover {
        color: var(--palette-pink);
        transform: translateY(-1px);
    }

    button.active {
        background: var(--theme-color);
        color: var(--palette-off-white);
        box-shadow: 0 6px 16px rgba(152, 37, 152, 0.24);
    }
</style>

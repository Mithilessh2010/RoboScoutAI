<script>
    import DarkModeToggle from "./DarkModeToggle.svelte";
    import Hamburger from "./Hamburger.svelte";
    import Logo from "./Logo.svelte";
    import Searchbar from "./search/Searchbar.svelte";
</script>

<nav>
    <div class="left">
        <Hamburger />
        <Logo />
    </div>

    <div class="right">
        <Searchbar />
        <DarkModeToggle />
    </div>
</nav>

<style>
    nav {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: var(--navbar-size);

        padding: var(--md-pad);

        background: rgba(21, 23, 61, 0.92);
        border-bottom: 1px solid rgba(228, 145, 201, 0.22);
        box-shadow: 0 12px 34px rgba(5, 6, 20, 0.28);
        backdrop-filter: blur(12px);
        z-index: var(--navbar-zi);

        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .left {
        display: flex;
        align-items: center;
    }

    .right {
        display: flex;
        align-items: center;
        gap: calc(var(--lg-gap) * 1.75);
    }
</style>

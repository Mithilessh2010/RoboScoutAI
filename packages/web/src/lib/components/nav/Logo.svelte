<a href="/">
    <img src="/img/roboscoutai-logo.svg" alt="RoboScoutAI" />
</a>

<style>
    a {
        display: flex;
        align-items: center;
        padding: calc(var(--sm-pad) * 0.75) var(--md-pad);
        background-color: transparent;
        user-select: none;
        transition:
            opacity 180ms ease,
            transform 180ms ease;
    }

    img {
        display: block;
        width: clamp(142px, 14vw, 190px);
        height: calc(var(--navbar-size) - var(--md-pad) * 1.4);
        object-fit: contain;
        object-position: left center;
    }

    a:hover {
        opacity: 0.9;
        text-decoration: none;
        transform: translateY(-1px);
    }

    @media (max-width: 800px) {
        img {
            width: 54px;
            object-fit: cover;
            object-position: left center;
        }
    }
</style>

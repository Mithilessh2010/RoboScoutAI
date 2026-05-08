# UI Theme Notes

## Files changed

- `packages/web/static/css/global.css`
- `packages/web/static/css/form-reset.css`
- `packages/web/src/routes/+layout.svelte`
- `packages/web/src/routes/+page.svelte`
- `packages/web/src/routes/about/+page.svelte`
- `packages/web/src/routes/api/+page.svelte`
- `packages/web/src/routes/api/rest/+page.svelte`
- `packages/web/src/routes/blog/+page.svelte`
- `packages/web/src/routes/first/+page.svelte`
- `packages/web/src/routes/privacy/+page.svelte`
- `packages/web/src/routes/sponsors/+page.svelte`
- `packages/web/src/routes/sponsors/info/+page.svelte`
- `packages/web/src/routes/teams/+page.svelte`
- `packages/web/src/routes/teams/[number=team_num]/+page.svelte`
- `packages/web/src/routes/events/[season=season]/+page.svelte`
- `packages/web/src/routes/events/[season=season]/SingleEvent.svelte`
- `packages/web/src/routes/events/[season=season]/[code]/[tab=event_tab]/+page.svelte`
- `packages/web/src/lib/components/Head.svelte`
- `packages/web/src/lib/components/ErrorPage.svelte`
- `packages/web/src/lib/components/Card.svelte`
- `packages/web/src/lib/components/Modal.svelte`
- `packages/web/src/lib/components/matches/MatchTable.svelte`
- `packages/web/src/lib/components/nav/AlertBar.svelte`
- `packages/web/src/lib/components/nav/DarkModeToggle.svelte`
- `packages/web/src/lib/components/nav/Hamburger.svelte`
- `packages/web/src/lib/components/nav/IconSidebarItem.svelte`
- `packages/web/src/lib/components/nav/Logo.svelte`
- `packages/web/src/lib/components/nav/Navbar.svelte`
- `packages/web/src/lib/components/nav/Sidebar.svelte`
- `packages/web/src/lib/components/nav/SidebarContent.svelte`
- `packages/web/src/lib/components/nav/SidebarItem.svelte`
- `packages/web/src/lib/components/nav/search/Searchbar.svelte`
- `packages/web/src/lib/constants.ts`
- `packages/web/src/lib/components/skeleton/SkeletonRow.svelte`
- `packages/web/src/lib/components/stats/StatHeader.svelte`
- `packages/web/src/lib/components/stats/StatRow.svelte`
- `packages/web/src/lib/components/stats/StatTable.svelte`
- `packages/web/src/lib/components/tabs/TabbedCard.svelte`
- `packages/web/src/lib/components/ui/Button.svelte`
- `packages/web/src/lib/components/ui/form/SearchInput.svelte`
- `packages/web/src/lib/ftc-events/api.ts`
- `packages/web/static/img/roboscoutai-logo.svg`
- `packages/web/static/head/site.webmanifest`
- Removed `packages/web/src/lib/components/nav/Sponsor.svelte`

## Color palette applied

- `#15173D` is now the global navy page background and browser theme color.
- `#982598` is the primary accent for active navigation, primary buttons, highlights, and selected states.
- `#E491C9` is the secondary accent for links, focus rings, active indicators, and subtle borders.
- `#F1E9E9` is the primary text color and light surface reference.

## Animations added

- Fast page entrance fade/slide.
- Card fade-up and subtle hover lift.
- Button hover/press transitions.
- Active navigation and tab indicator transitions.
- Search input focus expansion polish.
- Dropdown/input focus rings.
- Table row hover transitions.
- Modal entrance animation.
- Skeleton shimmer tuned to the new palette.
- Reduced-motion safeguards through `prefers-reduced-motion`.

## Components updated

- Global theme variables and shared element states.
- Navbar, sidebar, logo, mobile menu button, dark mode button, alert bar.
- Removed legacy sidebar links, social icons, contact links, and sponsor placement.
- Cards, buttons, forms, search inputs, tabs, modals.
- Team search/list rows.
- Event search/list rows.
- Event detail livestream controls.
- Match/stat table containers and stat row hover states.
- Home page visual branding and stat/event panels.
- RoboScoutAI SVG logo added and used in the navbar and homepage hero.

## Functionality checked

- No backend, database, server route, API syncing, data fetching, ranking, match, stats, or event/team search logic was intentionally changed.
- Changes are limited to CSS, Svelte presentation markup/text, and manifest/head theme metadata.
- Build/check should verify Svelte and TypeScript compatibility.
- `packages/web/src/lib/ftc-events/api.ts` had an unused imported type removed so the frontend checker could run cleanly; this does not change API behavior or data fetching.
- `npm run web:check` completed with 0 errors and 0 warnings.
- `npm run web:build` completed successfully.
- Local dev server route checks returned HTTP 200 for `/`, `/teams`, `/events/2025`, `/teams/11212`, `/api`, and `/records/2025/teams`.

## Known issues

- Legacy sidebar links, sponsor blocks, social links, and public informational pages were removed or retired.
- Browser automation CLI `agent-browser` was not installed in this workspace, so visual verification used build/check plus local HTTP route checks instead of screenshots.
- FTC Events proxy endpoints returned `MISSING_CREDENTIALS` locally because `FTC_EVENTS_USERNAME`, `FTC_EVENTS_AUTH_KEY`, and `FTC_EVENTS_API_BASE_URL` are not present in this shell. This appears environment-related, not caused by the theme changes.

## Manual test checklist

- Start the frontend and confirm the app shell loads.
- Search for a team from the navbar search and from `/teams`.
- Open a team detail page and verify events, matches, and quick stats render.
- Open `/events`, filter/search events, and open an event detail page.
- Check event tabs for matches, rankings, insights, awards, and teams when data exists.
- Open a match score modal and close it.
- Check mobile width for navbar search, sidebar, tabs, and table scrolling.

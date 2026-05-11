import { c as create_ssr_component } from "../../chunks/ssr.js";
import { e as escape } from "../../chunks/escape.js";
const _page_svelte_svelte_type_style_lang = "";
const css = {
  code: "body{margin:0;font-family:Inter, system-ui, sans-serif;background:radial-gradient(circle at top left, rgba(228, 145, 201, 0.14), transparent 30rem),\n			linear-gradient(180deg, rgba(152, 37, 152, 0.08), transparent 18rem),\n			#0f1227;color:#f6f6fb}main.svelte-issjeq.svelte-issjeq{max-width:920px;margin:0 auto;padding:4rem 1.5rem 3rem}.hero.svelte-issjeq.svelte-issjeq{margin-bottom:1.25rem}h1.svelte-issjeq.svelte-issjeq{font-size:clamp(2.4rem, 5vw, 4rem);margin:0.35rem 0 0.7rem}p.svelte-issjeq.svelte-issjeq{line-height:1.6;margin:0;color:rgba(246, 246, 251, 0.8)}.badge.svelte-issjeq.svelte-issjeq{display:inline-flex;align-items:center;gap:0.55rem;padding:0.45rem 0.8rem;border-radius:999px;border:1px solid rgba(255, 255, 255, 0.12);background:rgba(255, 255, 255, 0.05);font-weight:700}.badge.ok.svelte-issjeq.svelte-issjeq,.ok.svelte-issjeq.svelte-issjeq{color:#7dedb0}.badge.bad.svelte-issjeq.svelte-issjeq,.bad.svelte-issjeq.svelte-issjeq{color:#ff9f9f}.card.svelte-issjeq.svelte-issjeq{margin-top:1rem;padding:1.2rem 1.35rem;border-radius:16px;background:rgba(255, 255, 255, 0.06);border:1px solid rgba(255, 255, 255, 0.1);backdrop-filter:blur(12px)}h2.svelte-issjeq.svelte-issjeq{display:flex;align-items:center;gap:0.65rem;margin:0 0 0.75rem}ul.svelte-issjeq.svelte-issjeq{margin:0;padding-left:1.2rem}li.svelte-issjeq+li.svelte-issjeq{margin-top:0.35rem}.meta.svelte-issjeq.svelte-issjeq{margin-top:1rem;font-size:0.92rem;color:rgba(246, 246, 251, 0.65)}",
  map: null
};
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let backendReady;
  let { data } = $$props;
  if ($$props.data === void 0 && $$bindings.data && data !== void 0)
    $$bindings.data(data);
  $$result.css.add(css);
  backendReady = data.checks.database.status === "ready";
  return `${$$result.head += `<!-- HEAD_svelte-13v6hpk_START -->${$$result.title = `<title>Backend</title>`, ""}<meta name="description" content="Standalone backend project for RoboScoutAI."><!-- HEAD_svelte-13v6hpk_END -->`, ""} <main class="svelte-issjeq"><section class="hero svelte-issjeq"><div class="${[
    "badge svelte-issjeq",
    (backendReady ? "ok" : "") + " " + (!backendReady ? "bad" : "")
  ].join(" ").trim()}"><span>${escape(backendReady ? "Backend ready" : "Backend needs attention")}</span></div> <h1 class="svelte-issjeq" data-svelte-h="svelte-kk1bka">RoboScoutAI Backend</h1> <p class="svelte-issjeq" data-svelte-h="svelte-xrg6mb">This project is ready to be deployed as a separate Vercel root at <strong>packages/backend</strong>.</p></section> <section class="card svelte-issjeq"><h2 class="svelte-issjeq" data-svelte-h="svelte-11m88pa">Database mode</h2> <p class="${[
    "svelte-issjeq",
    (backendReady ? "ok" : "") + " " + (!backendReady ? "bad" : "")
  ].join(" ").trim()}">${escape(data.checks.database.message)}</p></section> <section class="card svelte-issjeq"><h2 class="svelte-issjeq" data-svelte-h="svelte-1t0vaml">Environment</h2> <ul class="svelte-issjeq"><li class="svelte-issjeq">Database driver: ${escape(data.driver)}</li> <li class="svelte-issjeq">DATABASE_URL: ${escape(backendReady && data.driver !== "sqljs" ? "configured" : "check your env vars")}</li> <li class="svelte-issjeq">FTC_EVENTS_USERNAME: ${escape(data.checks.ftcEvents.username)}</li> <li class="svelte-issjeq">FTC_EVENTS_AUTH_KEY: ${escape(data.checks.ftcEvents.authKey)}</li> <li class="svelte-issjeq">FTC_EVENTS_API_BASE_URL: ${escape(data.checks.ftcEvents.baseUrl)}</li></ul></section> <section class="card svelte-issjeq" data-svelte-h="svelte-1n85wz5"><h2 class="svelte-issjeq">Endpoints</h2> <ul class="svelte-issjeq"><li class="svelte-issjeq">/graphql</li> <li class="svelte-issjeq">/analytics</li> <li class="svelte-issjeq">/sitemap.xml</li> <li class="svelte-issjeq">/api/ftc/*</li> <li class="svelte-issjeq">/api/debug/env</li></ul></section> <p class="meta svelte-issjeq">Checked at ${escape(new Date(data.checkedAt).toLocaleString())}</p> </main>`;
});
export {
  Page as default
};

import * as server from '../entries/pages/_page.server.ts.js';

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/+page.server.ts";
export const imports = ["_app/immutable/nodes/2.7dc2dfe6.js","_app/immutable/chunks/scheduler.e108d1fd.js","_app/immutable/chunks/index.06b23ecb.js"];
export const stylesheets = ["_app/immutable/assets/2.79b1c262.css"];
export const fonts = [];

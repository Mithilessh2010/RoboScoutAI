

export const index = 1;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/fallbacks/error.svelte.js')).default;
export const imports = ["_app/immutable/nodes/1.280b4504.js","_app/immutable/chunks/scheduler.e108d1fd.js","_app/immutable/chunks/index.06b23ecb.js","_app/immutable/chunks/singletons.84c830f0.js"];
export const stylesheets = [];
export const fonts = [];

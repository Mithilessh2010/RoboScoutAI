import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig((mode) => ({
    server: {
        host: "0.0.0.0",
        port: 5173,
        strictPort: false,
    },
    ssr: {
        noExternal: ["@graphql-typed-document-node/core", "three"],
    },
    optimizeDeps: {
        exclude: ["@graphql-typed-document-node/core", "svelte-fa"],
    },
    // Resolves importing common.
    resolve: {
        preserveSymlinks: true,
    },
    define: {
        // For Apollo
        __DEV__: (mode.mode == "development").toString(),
    },
    plugins: [sveltekit()],
}));

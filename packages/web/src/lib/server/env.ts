import { existsSync } from "fs";
import { resolve } from "path";
import { config } from "dotenv";

let loaded = false;

export function loadServerEnv(): void {
    if (loaded) return;
    loaded = true;

    for (const candidate of [
        ".env.local",
        ".env",
        "packages/web/.env.local",
        "packages/web/.env",
        "../web/.env.local",
        "../web/.env",
        "packages/server/.env",
        "../server/.env",
    ]) {
        const path = resolve(process.cwd(), candidate);
        if (existsSync(path)) {
            config({ path, override: false });
        }
    }
}

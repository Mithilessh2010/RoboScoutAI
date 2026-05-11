import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";
let loaded = false;
function loadServerEnv() {
  if (loaded)
    return;
  loaded = true;
  for (const candidate of [
    ".env.local",
    ".env",
    "packages/backend/.env.local",
    "packages/backend/.env",
    "../.env.local",
    "../.env",
    "../packages/backend/.env.local",
    "../packages/backend/.env",
    "../../.env.local",
    "../../.env"
  ]) {
    const path = resolve(process.cwd(), candidate);
    if (existsSync(path)) {
      config({ path, override: false });
    }
  }
}
export {
  loadServerEnv as l
};

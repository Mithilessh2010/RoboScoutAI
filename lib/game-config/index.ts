import { decodeConfig } from "./2025-2026-decode";

const fallbackConfig = {
  ...decodeConfig,
  season: "default",
  gameName: "Configurable FTC Season",
};

export function getGameConfig(season: string) {
  if (season === decodeConfig.season) return decodeConfig;
  return fallbackConfig;
}

export const gameConfigs = [decodeConfig];

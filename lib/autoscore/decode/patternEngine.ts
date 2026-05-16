import { DECODE_SCORING } from "../../game-config/decode";

export function motifColorAt(motif: keyof typeof DECODE_SCORING.motifOptions, slot: number) {
  return DECODE_SCORING.motifOptions[motif][(slot - 1) % 3];
}

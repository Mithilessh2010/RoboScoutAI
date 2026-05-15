export const DECODE_SCORING = {
    auto: {
        leavePoints: 3,
        classifiedArtifactPoints: 3,
        overflowArtifactPoints: 1,
        patternMatchPoints: 2,
    },
    teleop: {
        classifiedArtifactPoints: 3,
        overflowArtifactPoints: 1,
        depotArtifactPoints: 1,
        patternMatchPoints: 2,
        basePartialPoints: 5,
        baseFullPoints: 10,
        bothRobotsFullBaseBonus: 10,
    },
    fouls: {
        minorFoulPoints: 5,
        majorFoulPoints: 15,
    },
    rankingPoints: {
        winRP: 3,
        tieRP: 1,
        movementRP: 1,
        goalRP: 1,
        patternRP: 1,
        movementRPThreshold: 16,
        goalRPThreshold: 36,
        patternRPThreshold: 18,
    },
    timing: {
        autoSeconds: 30,
        teleopSeconds: 120,
    },
    motifOptions: {
        GPP: ["green", "purple", "purple"],
        PGP: ["purple", "green", "purple"],
        PPG: ["purple", "purple", "green"],
    },
    rampSlots: 9,
} as const;

export type DecodeAlliance = "red" | "blue";
export type DecodePhase = "AUTO" | "TELEOP" | "ENDGAME";
export type DecodeMotif = keyof typeof DECODE_SCORING.motifOptions | "manual" | "unknown";

export function decodeMatchSeconds() {
    return DECODE_SCORING.timing.autoSeconds + DECODE_SCORING.timing.teleopSeconds;
}

export function decodePhaseAt(timestamp: number): DecodePhase {
    if (timestamp <= DECODE_SCORING.timing.autoSeconds) return "AUTO";
    if (timestamp >= decodeMatchSeconds()) return "ENDGAME";
    return "TELEOP";
}

export function expectedMotifColor(motif: DecodeMotif, index: number) {
    if (!(motif in DECODE_SCORING.motifOptions) || index < 1) return null;
    let colors = DECODE_SCORING.motifOptions[motif as keyof typeof DECODE_SCORING.motifOptions];
    return colors[(index - 1) % colors.length];
}

export const decodeConfig = {
  season: "2025-2026",
  gameName: "DECODE",
  objectClasses: ["artifact", "goal", "ramp", "base", "robot", "field zone", "obstacle/game-specific object"],
  scoutingCategories: {
    autonomous: ["left staging area", "scored artifact", "completed pattern", "parked/base return"],
    teleop: ["artifact cycles", "pattern progress", "intake success", "missed artifact"],
    endgame: ["partial base return", "full base return", "partner base bonus"],
    penalties: ["minor penalty", "major penalty", "field damage", "contact in protected zone"],
  },
  timelineEventTypes: [
    "scored artifact",
    "missed artifact",
    "completed pattern",
    "robot returned to base",
    "penalty",
    "robot disabled",
    "defense action",
    "intake success",
    "intake fail",
    "collision",
    "field issue",
  ],
};

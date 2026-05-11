const Season = {
  Skystone: 2019,
  UltimateGoal: 2020,
  FreightFrenzy: 2021,
  PowerPlay: 2022,
  CenterStage: 2023,
  IntoTheDeep: 2024,
  Decode: 2025
};
const CURRENT_SEASON = Season.Decode;
const PAST_SEASONS = [
  Season.Skystone,
  Season.UltimateGoal,
  Season.FreightFrenzy,
  Season.PowerPlay,
  Season.CenterStage,
  Season.IntoTheDeep
];
const ALL_SEASONS = [...PAST_SEASONS, CURRENT_SEASON];
export {
  ALL_SEASONS as A,
  CURRENT_SEASON as C,
  Season as S
};

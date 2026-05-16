export function isReviewEvent(eventType: string) {
  return eventType === "ramp_count_drop_unexplained" || eventType === "manual_adjustment";
}

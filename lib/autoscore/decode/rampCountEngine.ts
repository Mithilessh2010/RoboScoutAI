export function median(values: number[]) {
  let sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
}
export function smoothRampCounts(counts: number[], windowSize = 3) {
  return counts.map((_, index) => median(counts.slice(Math.max(0, index - windowSize + 1), index + 1)));
}

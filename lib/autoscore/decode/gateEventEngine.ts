export function rampDropExplainedByGate(gateTimestamp: number, rampTimestamp: number, windowSeconds = 5) {
  return Math.abs(rampTimestamp - gateTimestamp) <= windowSeconds;
}

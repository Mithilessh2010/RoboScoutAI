export function scoreTotal(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0);
}

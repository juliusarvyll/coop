export function normalizeCoopId(input: string): string {
  return input.trim().toLowerCase().replace(/[\s-]+/g, "");
}

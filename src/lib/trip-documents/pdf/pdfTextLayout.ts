/** Conservative line estimate: explicit breaks must count even in short text. */
export function estimatedPdfLines(value: string, charactersPerLine = 65) {
  return value
    .split(/\r?\n/)
    .reduce(
      (total, line) =>
        total + Math.max(1, Math.ceil(line.length / charactersPerLine)),
      0,
    );
}
export function compactPdfPolicy(value: string) {
  return value.length < 1500 && estimatedPdfLines(value) <= 16;
}

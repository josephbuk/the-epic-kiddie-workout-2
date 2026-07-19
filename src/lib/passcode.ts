export function validatePasscode(p: string): string | null {
  if (!/^\d{4,}$/.test(p)) return "Use at least 4 digits (numbers only)";
  if (/^(\d)\1+$/.test(p)) return "Passcode can't be the same digit repeated";
  const isSeq = (s: string, step: number) =>
    s.split("").every((c, i) => i === 0 || (parseInt(c) - parseInt(s[i - 1]) + 10) % 10 === step);
  if (isSeq(p, 1)) return "Passcode can't be a simple sequence like 1234";
  if (isSeq(p, -1) || isSeq(p, 9)) return "Passcode can't be a simple sequence like 9876";
  return null;
}
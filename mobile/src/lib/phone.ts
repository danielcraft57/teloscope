export function normalizePhone(raw: string): string | null {
  let s = raw.trim().replace(/[\s.\-()]/g, "");
  if (s.startsWith("00")) s = "+" + s.slice(2);
  if (/^0[1-9]\d{8}$/.test(s)) s = "+33" + s.slice(1);
  if (/^[1-9]\d{8}$/.test(s)) s = "+33" + s;
  if (!s.startsWith("+")) s = "+" + s;
  if (!/^\+\d{8,15}$/.test(s)) return null;
  return s;
}

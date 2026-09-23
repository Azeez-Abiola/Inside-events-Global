/**
 * Temporary password for admin-issued invites. Shared by the sub-admin invite
 * and the organiser listing-claim invite so both produce the same shape.
 * Ambiguous glyphs (O/0, I/l/1) are left out — these get read off a screen and
 * typed by hand.
 */
export function generateTempPassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const digits = "23456789";
  const special = "!@#$";
  const pick = (s: string) => s[Math.floor(Math.random() * s.length)]!;
  const parts = [pick(upper), pick(lower), pick(digits), pick(special)];
  const all = upper + lower + digits + special;
  while (parts.length < 14) parts.push(pick(all));
  return parts.sort(() => Math.random() - 0.5).join("");
}

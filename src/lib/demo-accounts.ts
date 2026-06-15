export const DEMO_PASSWORD = "IgeDemo2026!";

export const DEMO_ACCOUNT_EMAILS = {
  organiser: "organiser@ige.test",
  sponsor: "sponsor@ige.test",
  partner: "partner@ige.test",
  media: "media@ige.test",
  admin: "admin@ige.test",
  super: "super@ige.test",
} as const;

export function demoLoginSearch(email: string) {
  return { email, password: DEMO_PASSWORD };
}

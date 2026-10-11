import { createFileRoute } from "@tanstack/react-router";
import { createHash } from "node:crypto";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Five failed password sign-ins within 15 minutes trigger a short lock and
// then a CAPTCHA, with a prompt to use Forgot password (TAB 2, TAB 12 §12.4).
// Failures are keyed by a hash of the email so no address is stored here.
const WINDOW_MS = 15 * 60_000;
const LOCK_MS = 2 * 60_000;
const LIMIT = 5;

const Schema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  event: z.enum(["check", "failed", "succeeded"]),
  captchaToken: z.string().max(4096).optional(),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fdb = () => supabaseAdmin as any;
const hash = (s: string) => createHash("sha256").update(`ige-signin:${s}`).digest("hex");

async function verifyTurnstile(token: string, ip: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return false;
  const form = new URLSearchParams({ secret, response: token });
  if (ip) form.set("remoteip", ip);
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: form,
  });
  const out = (await res.json().catch(() => ({}))) as { success?: boolean };
  return !!out.success;
}

export const Route = createFileRoute("/api/public/sign-in-guard")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }
        const parsed = Schema.safeParse(body);
        if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
        const { email, event, captchaToken } = parsed.data;
        const key = hash(email);
        const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;

        if (event === "failed") {
          await fdb()
            .from("sign_in_failures")
            .insert({ email_hash: key, ip_hash: ip ? hash(ip) : null });
          return Response.json({ ok: true });
        }

        if (event === "succeeded") {
          // Only the signed-in owner of the address may clear its failures.
          const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
          if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });
          const { data } = await supabaseAdmin.auth.getUser(token);
          if (data.user?.email?.toLowerCase() !== email)
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          await fdb().from("sign_in_failures").delete().eq("email_hash", key);
          return Response.json({ ok: true });
        }

        const since = new Date(Date.now() - WINDOW_MS).toISOString();
        const { data: rows, error } = await fdb()
          .from("sign_in_failures")
          .select("created_at")
          .eq("email_hash", key)
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(50);
        // Before the migration is applied the guard steps aside.
        if (error) return Response.json({ allowed: true, captchaRequired: false });
        const failures = (rows ?? []) as { created_at: string }[];
        if (failures.length < LIMIT)
          return Response.json({ allowed: true, captchaRequired: false });

        const lockedUntil = new Date(failures[0].created_at).getTime() + LOCK_MS;
        if (lockedUntil > Date.now()) {
          return Response.json({
            allowed: false,
            captchaRequired: true,
            lockedUntil: new Date(lockedUntil).toISOString(),
          });
        }
        const captchaConfigured = !!process.env.TURNSTILE_SECRET_KEY;
        if (!captchaConfigured) return Response.json({ allowed: true, captchaRequired: false });
        if (captchaToken && (await verifyTurnstile(captchaToken, ip)))
          return Response.json({ allowed: true, captchaRequired: true });
        return Response.json({ allowed: false, captchaRequired: true });
      },
    },
  },
});

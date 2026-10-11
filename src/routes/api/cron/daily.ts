import { createFileRoute } from "@tanstack/react-router";
import { runDailyJobs } from "@/lib/jobs/daily.server";

/**
 * Daily scheduled jobs (TAB 12 §12.1A). Vercel Cron calls this with
 * `Authorization: Bearer $CRON_SECRET`; anything else is refused, so the URL
 * being public does not make the jobs public.
 */
async function handle(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await runDailyJobs();
  return Response.json({ ok: true, ran_at: new Date().toISOString(), result });
}

export const Route = createFileRoute("/api/cron/daily")({
  server: {
    handlers: {
      GET: async ({ request }) => handle(request),
      POST: async ({ request }) => handle(request),
    },
  },
});

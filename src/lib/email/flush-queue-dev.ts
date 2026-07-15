/**
 * In local `npm run dev`, emails are only enqueued — production cron
 * (which hits the live site) may be missing RESEND_API_KEY and never delivers.
 * Flush the queue against this machine so Resend sends immediately.
 */
export async function flushEmailQueueInDev(): Promise<{
  processed?: number
  skipped?: boolean
  reason?: string
  error?: string
}> {
  if (process.env.NODE_ENV === "production") {
    return { skipped: true, reason: "production" }
  }
  if (!process.env.RESEND_API_KEY) {
    return { skipped: true, reason: "RESEND_API_KEY missing locally" }
  }
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    return { skipped: true, reason: "SUPABASE_SERVICE_ROLE_KEY missing" }
  }

  const port = process.env.PORT || "8080"
  const url = `http://127.0.0.1:${port}/lovable/email/queue/process`

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
    })
    const body = (await res.json().catch(() => ({}))) as {
      processed?: number
      error?: string
      stopped?: string
    }
    if (!res.ok) {
      return { error: body.error ?? `Queue flush failed (${res.status})` }
    }
    return { processed: body.processed ?? 0, reason: body.stopped }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Queue flush failed" }
  }
}

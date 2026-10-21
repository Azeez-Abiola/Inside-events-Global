import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/unsubscribe")({
  head: () => ({ meta: [{ title: "Unsubscribe — Inside Global Events" }, { name: "robots", content: "noindex" }] }),
  component: UnsubscribePage,
  validateSearch: (s: Record<string, unknown>) => ({ token: typeof s.token === "string" ? s.token : "" }),
});

type State = "loading" | "valid" | "invalid" | "already" | "done" | "error";

function UnsubscribePage() {
  const { token } = Route.useSearch();
  const [state, setState] = useState<State>("loading");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    if (!token) { setState("invalid"); return; }
    (async () => {
      try {
        const res = await fetch(`/email/unsubscribe?token=${encodeURIComponent(token)}`);
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) { setState("invalid"); setErrorMsg(data.error ?? ""); return; }
        if (data.used_at || data.alreadyUnsubscribed) setState("already");
        else setState("valid");
      } catch (e) {
        if (!cancelled) { setState("error"); setErrorMsg(e instanceof Error ? e.message : ""); }
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  async function confirm() {
    setSubmitting(true);
    try {
      const res = await fetch("/email/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setState("error"); setErrorMsg(data.error ?? "Failed to unsubscribe"); }
      else setState("done");
    } catch (e) {
      setState("error");
      setErrorMsg(e instanceof Error ? e.message : "");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-xl px-6 py-24">
        <div className="rounded-2xl border border-border/60 bg-card p-8 text-center">
          {state === "loading" && (
            <><Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" /><p className="mt-4 text-sm text-muted-foreground">Checking your link…</p></>
          )}
          {state === "valid" && (
            <>
              <h1 className="font-display text-2xl font-bold">Unsubscribe from IGE emails</h1>
              <p className="mt-2 text-sm text-muted-foreground">Confirm and we'll stop sending you transactional emails.</p>
              <Button className="mt-6" onClick={confirm} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {submitting ? "Working…" : "Confirm unsubscribe"}
              </Button>
            </>
          )}
          {state === "already" && (
            <><CheckCircle2 className="mx-auto h-8 w-8 text-primary" /><h1 className="mt-3 font-display text-xl font-bold">Already unsubscribed</h1><p className="mt-2 text-sm text-muted-foreground">This email is no longer receiving messages from us.</p></>
          )}
          {state === "done" && (
            <><CheckCircle2 className="mx-auto h-8 w-8 text-primary" /><h1 className="mt-3 font-display text-xl font-bold">You're unsubscribed</h1><p className="mt-2 text-sm text-muted-foreground">We've removed you from our transactional email list.</p></>
          )}
          {(state === "invalid" || state === "error") && (
            <><XCircle className="mx-auto h-8 w-8 text-destructive" /><h1 className="mt-3 font-display text-xl font-bold">Link not valid</h1><p className="mt-2 text-sm text-muted-foreground">{errorMsg || "This unsubscribe link is invalid or has expired."}</p></>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

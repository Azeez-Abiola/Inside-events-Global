import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, Phone, MapPin, Loader2, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact · Inside Global Events" },
      { name: "description", content: "Get in touch with the Inside Global Events team. Email, phone, and office locations across Lagos and Paris." },
      { property: "og:title", content: "Contact · Inside Global Events" },
      { property: "og:description", content: "Talk to the IGE team about sponsorships, partnerships, and trust enquiries." },
    ],
  }),
  component: ContactPage,
});

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  company: z.string().trim().max(150).optional(),
  subject: z.string().trim().min(1, "Subject is required").max(150),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(2000),
});

function ContactPage() {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    const parsed = contactSchema.safeParse(data);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check your details");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Failed to send message");
      }
      setSent(true);
      form.reset();
      toast.success("Message sent. We'll be in touch within one business day.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSubmitting(false);
    }
  }


  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-16">
        <Link to="/" className="text-sm text-primary hover:underline">← Home</Link>
        <h1 className="mt-6 font-display text-4xl font-bold tracking-tight md:text-5xl">Contact us</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Questions about listing an event, becoming a sponsor, or joining as a referral partner?
          The Inside Global Events team usually replies within one business day.
        </p>

        <div className="mt-12 grid gap-10 md:grid-cols-[1fr_1.2fr]">
          <aside className="space-y-6">
            <div className="rounded-2xl border border-border/60 bg-card p-6">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Email</div>
                  <a href="mailto:Hi@insideglobalevents.com" className="font-medium hover:underline">Hi@insideglobalevents.com</a>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card p-6">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Phone</div>
                  <a href="tel:+2349030915964" className="font-medium hover:underline">+234 903 091 5964</a>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Lagos</div>
                  <p className="text-sm">Yaba, Lagos, Nigeria</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Paris</div>
                  <p className="text-sm">Paris, France</p>
                </div>
              </div>
            </div>
          </aside>

          <form onSubmit={handleSubmit} className="rounded-2xl border border-border/60 bg-card p-6 md:p-8 space-y-5">
            {sent && (
              <div className="flex items-start gap-3 rounded-lg bg-primary/10 p-4 text-sm">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                <span>Thanks. We've received your message and sent you a confirmation email.</span>
              </div>
            )}

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" name="name" required maxLength={100} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required maxLength={255} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company (optional)</Label>
              <Input id="company" name="company" maxLength={150} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" name="subject" required maxLength={150} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" name="message" rows={6} required maxLength={2000} />
            </div>
            <Button type="submit" disabled={submitting} className="w-full md:w-auto">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {submitting ? "Sending…" : "Send message"}
            </Button>
          </form>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

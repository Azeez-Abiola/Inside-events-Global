import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { DashboardPipelineSkeleton } from "@/components/dashboards/dashboard-skeletons";
import { Eye, MessageSquare, FileText, PenLine, CheckCircle2, Archive } from "lucide-react";
import { getSponsorPipeline } from "@/lib/deals.functions";
import { fmtMoney } from "@/lib/currency";

const COLUMNS = [
  { id: "watching", label: "Watching", icon: Eye, hint: "Saved, not yet engaged" },
  { id: "in_conversation", label: "In conversation", icon: MessageSquare, hint: "Commitment submitted" },
  { id: "proposal", label: "Proposal", icon: FileText, hint: "Tier & terms in negotiation" },
  { id: "committed", label: "Committed", icon: PenLine, hint: "Contract signed" },
  { id: "paid_active", label: "Paid / active", icon: CheckCircle2, hint: "Funds received" },
  { id: "closed", label: "Closed", icon: Archive, hint: "Won or lost" },
] as const;

export function SponsorPipelinePanel() {
  const fetch = useServerFn(getSponsorPipeline);
  const { data, isLoading } = useQuery({ queryKey: ["sponsor-pipeline"], queryFn: () => fetch() });
  const cards = data?.cards ?? [];

  const byColumn: Record<string, any[]> = {};
  for (const c of COLUMNS) byColumn[c.id] = [];
  for (const card of cards) (byColumn[card.column] ??= []).push(card);

  if (isLoading) {
    return <DashboardPipelineSkeleton />;
  }

  return (
    <div>
      <div className="overflow-x-auto pb-2">
        <div className="grid min-w-[1080px] grid-cols-6 gap-3">
          {COLUMNS.map((col) => {
            const items = byColumn[col.id] ?? [];
            return (
              <div key={col.id} className="rounded-xl border border-border bg-muted/20 p-2.5">
                <div className="mb-2 px-1">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      <col.icon className="h-3.5 w-3.5" /> {col.label}
                    </span>
                    <span className="rounded-full bg-card px-2 py-0.5 text-[10px] font-bold border border-border">{items.length}</span>
                  </div>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{col.hint}</p>
                </div>
                <div className="space-y-2">
                  {items.map((card) => <PipelineCard key={card.key} card={card} />)}
                  {items.length === 0 && (
                    <p className="rounded-md border border-dashed border-border p-3 text-center text-[11px] text-muted-foreground italic">Empty</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PipelineCard({ card }: { card: any }) {
  const ev = card.ev;
  const money =
    card.value != null
      ? fmtMoney(card.currency ?? "USD", Number(card.value))
      : card.budgetMin || card.budgetMax
        ? `${fmtMoney(card.currency ?? "USD", Number(card.budgetMin ?? 0))} – ${fmtMoney(card.currency ?? "USD", Number(card.budgetMax ?? 0))}`
        : null;

  const inner = (
    <>
      <div className="text-sm font-semibold leading-tight line-clamp-2">{ev.name}</div>
      <div className="mt-1 text-[11px] text-muted-foreground">{[ev.city, ev.country].filter(Boolean).join(", ") || "—"}</div>
      {card.company && <div className="mt-1.5 text-[11px] font-medium text-foreground">{card.company}</div>}
      {money && <div className="mt-1 text-xs font-bold text-primary-deep">{money}</div>}
      {card.status && (
        <div className="mt-1.5 inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium capitalize text-muted-foreground">
          {card.status.replace(/_/g, " ")}
        </div>
      )}
      {card.contractUrl && (
        <a
          href={card.contractUrl}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded-md border border-primary/40 bg-card px-2 py-1.5 text-[11px] font-bold text-primary-deep hover:bg-brand-soft"
        >
          <FileText className="h-3 w-3" /> View contract
        </a>
      )}
      {card.paymentLinkUrl && card.status !== "payment_received" && (
        <a
          href={card.paymentLinkUrl}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="mt-2 inline-flex w-full items-center justify-center rounded-md bg-brand-gradient px-2 py-1.5 text-[11px] font-bold text-white"
        >
          Pay now
        </a>
      )}
    </>
  );
  const cls = "block rounded-lg border border-border bg-card p-3 text-left hover:border-primary hover:shadow-soft transition-all";

  return ev.slug ? (
    <Link to="/events/$slug" params={{ slug: ev.slug }} className={cls}>{inner}</Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

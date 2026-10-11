import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { FileDown, FileSpreadsheet, Loader2, Printer } from "lucide-react";
import { WorkspacePage } from "@/components/dashboards/workspace-page";
import { DashboardPanel } from "@/components/dashboards/dashboard-shell";
import { Button } from "@/components/ui/button";
import { InfoTip } from "@/components/info-tip";
import { downloadCsv } from "@/lib/csv-export";
import { downloadXlsx } from "@/lib/xlsx-export";
import { getReport, type ReportResult, type ReportType } from "@/lib/reports.functions";

const REPORTS: { id: ReportType; label: string; blurb: string; periodic: boolean }[] = [
  {
    id: "weekly_activity",
    label: "Weekly Activity Report",
    blurb:
      "Contacts added, outreach made, meetings held, feedback captured, pipeline movement, activations and tasks — split by person.",
    periodic: true,
  },
  {
    id: "pipeline_commission",
    label: "Pipeline and Commission Report",
    blurb: "Open, won, lost and paid deals with values and commission, totalled by currency.",
    periodic: true,
  },
  {
    id: "event_report",
    label: "Event Report",
    blurb:
      "Per event: sponsorship raised against target, partners secured and activations delivered.",
    periodic: false,
  },
];

const iso = (d: Date) => d.toISOString().slice(0, 10);
const daysAgo = (n: number) => iso(new Date(Date.now() - n * 86_400_000));

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const escHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * PDF without a PDF library: a clean, print-styled page the browser saves as
 * PDF. The same approach the platform already uses for contracts.
 */
function openPrintable(report: ReportResult) {
  const w = window.open("", "_blank");
  if (!w) {
    toast.error("Allow pop-ups for IGE to save the PDF.");
    return;
  }
  const tables = report.tables
    .filter((t) => t.rows.length)
    .map(
      (t) => `
      <h2>${escHtml(t.name)}</h2>
      <table>
        <thead><tr>${t.headers.map((h) => `<th>${escHtml(h)}</th>`).join("")}</tr></thead>
        <tbody>${t.rows
          .map(
            (r) =>
              `<tr>${r
                .map(
                  (c) =>
                    `<td class="${typeof c === "number" ? "num" : ""}">${escHtml(
                      c == null ? "" : typeof c === "number" ? c.toLocaleString() : String(c),
                    )}</td>`,
                )
                .join("")}</tr>`,
          )
          .join("")}</tbody>
      </table>`,
    )
    .join("");
  w.document.write(`<!doctype html><html><head><meta charset="utf-8">
    <title>${escHtml(report.title)} — ${escHtml(report.workspaceName)}</title>
    <style>
      body { font-family: Lato, -apple-system, Segoe UI, sans-serif; color: #1f1a2b; margin: 32px; }
      .brand { font-weight: 800; background: linear-gradient(135deg,#6B3FA0,#0E8A62); -webkit-background-clip: text; color: transparent; font-size: 14px; letter-spacing: .04em; }
      h1 { font-family: 'Playfair Display', Georgia, serif; color: #6B3FA0; margin: 6px 0 2px; }
      .meta { color: #6b6578; font-size: 12px; margin-bottom: 18px; }
      .summary { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 20px; }
      .tile { border: 1px solid #e4e0ea; border-radius: 10px; padding: 8px 12px; min-width: 120px; }
      .tile b { display: block; font-size: 18px; }
      .tile span { font-size: 11px; color: #6b6578; }
      h2 { font-size: 14px; color: #2E8171; margin: 22px 0 6px; }
      table { width: 100%; border-collapse: collapse; font-size: 11px; }
      th { text-align: left; background: #F2F0F5; padding: 6px; }
      td { padding: 5px 6px; border-bottom: 1px solid #eee; vertical-align: top; }
      td.num { text-align: right; font-variant-numeric: tabular-nums; }
      @media print { body { margin: 12mm; } }
    </style></head><body>
    <div class="brand">INSIDE GLOBAL EVENTS</div>
    <h1>${escHtml(report.title)}</h1>
    <div class="meta">${escHtml(report.workspaceName)} · ${escHtml(report.period)} · generated ${escHtml(
      new Date(report.generatedAt).toLocaleString(),
    )}</div>
    <div class="summary">${report.summary
      .map(
        (s) => `<div class="tile"><b>${escHtml(s.value)}</b><span>${escHtml(s.label)}</span></div>`,
      )
      .join("")}</div>
    ${tables || "<p>Nothing recorded for this period.</p>"}
    <script>window.onload = () => setTimeout(() => window.print(), 300);</script>
    </body></html>`);
  w.document.close();
}

/** Reports and Excel downloads (TAB 4 §4.4.3) — available on every dashboard. */
export function ReportsPage() {
  const fetchReport = useServerFn(getReport);
  const [type, setType] = useState<ReportType>("weekly_activity");
  const [from, setFrom] = useState(daysAgo(6));
  const [to, setTo] = useState(iso(new Date()));
  const def = REPORTS.find((r) => r.id === type)!;

  const {
    data: report,
    isFetching,
    error,
  } = useQuery({
    queryKey: ["report", type, from, to],
    queryFn: () => fetchReport({ data: { type, from, to } }),
  });

  const fileBase = report
    ? `${slug(report.title)}-${slug(report.workspaceName)}-${def.periodic ? `${from}-to-${to}` : iso(new Date())}`
    : "report";

  const excel = () => {
    if (!report) return;
    downloadXlsx(
      fileBase,
      report.tables.map((t, i) => ({
        name: t.name,
        headers: t.headers,
        rows: t.rows,
        preamble:
          i === 0
            ? [
                report.title,
                `${report.workspaceName} · ${report.period}`,
                ...report.summary.map((s) => `${s.label}: ${s.value}`),
              ]
            : undefined,
      })),
    );
  };

  // CSV is one table per file by nature; the main table is the one people want.
  const csv = () => {
    if (!report?.tables[0]) return;
    const t = report.tables[0];
    downloadCsv(`${fileBase}.csv`, t.headers, t.rows);
  };

  return (
    <WorkspacePage
      title="Reports"
      subtitle="Download your activity and performance as Excel, CSV or PDF — for yourself, your manager or your clients."
    >
      <div className="grid gap-3 md:grid-cols-3">
        {REPORTS.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setType(r.id)}
            className={`rounded-xl border p-4 text-left transition-colors ${type === r.id ? "border-primary bg-brand-soft" : "border-border bg-card hover:bg-muted/40"}`}
          >
            <p className="text-sm font-semibold text-foreground">{r.label}</p>
            <p className="mt-1 text-xs text-muted-foreground">{r.blurb}</p>
          </button>
        ))}
      </div>

      <DashboardPanel
        title={def.label}
        description={report ? `${report.workspaceName} · ${report.period}` : undefined}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {def.periodic && (
              <>
                <div className="flex gap-1">
                  {[
                    { label: "This week", f: daysAgo(6) },
                    { label: "30 days", f: daysAgo(29) },
                    { label: "Quarter", f: daysAgo(89) },
                  ].map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        setFrom(p.f);
                        setTo(iso(new Date()));
                      }}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${from === p.f && to === iso(new Date()) ? "bg-brand-soft text-primary-deep" : "text-muted-foreground hover:bg-muted"}`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <input
                  type="date"
                  value={from}
                  max={to}
                  onChange={(e) => setFrom(e.target.value)}
                  aria-label="From"
                  className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                />
                <input
                  type="date"
                  value={to}
                  min={from}
                  onChange={(e) => setTo(e.target.value)}
                  aria-label="To"
                  className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                />
              </>
            )}
            <InfoTip tip="reports.downloads" />
          </div>
        }
      >
        {isFetching && !report ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <p className="py-8 text-center text-sm text-destructive">{(error as Error).message}</p>
        ) : report ? (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <Button onClick={excel}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Excel (.xlsx)
              </Button>
              <Button variant="outline" onClick={csv}>
                <FileDown className="mr-2 h-4 w-4" />
                CSV
              </Button>
              <Button variant="outline" onClick={() => openPrintable(report)}>
                <Printer className="mr-2 h-4 w-4" />
                PDF
              </Button>
            </div>

            {report.summary.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {report.summary.map((s) => (
                  <div key={s.label} className="rounded-xl border border-border bg-card px-4 py-3">
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
                      {s.value}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {report.tables.map((t) => (
              <div key={t.name}>
                <h3 className="mb-2 text-sm font-semibold text-foreground">{t.name}</h3>
                {t.rows.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nothing recorded for this period.</p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/40 text-left text-muted-foreground">
                        <tr>
                          {t.headers.map((h) => (
                            <th key={h} className="whitespace-nowrap px-3 py-2 font-medium">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {t.rows.slice(0, 50).map((r, i) => (
                          <tr key={i} className="border-t border-border">
                            {r.map((c, j) => (
                              <td
                                key={j}
                                className={`px-3 py-2 ${typeof c === "number" ? "text-right tabular-nums" : ""}`}
                              >
                                {c == null ? "" : typeof c === "number" ? c.toLocaleString() : c}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {t.rows.length > 50 && (
                      <p className="border-t border-border px-3 py-2 text-[11px] text-muted-foreground">
                        Showing 50 of {t.rows.length}. The download has every row.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : null}
      </DashboardPanel>
    </WorkspacePage>
  );
}

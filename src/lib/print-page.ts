/**
 * PDF without a PDF library: open a clean, brand-styled page and let the
 * browser save it as PDF — the same approach as contracts and Reports.
 */
export const escHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function openPrintPage(title: string, bodyHtml: string): boolean {
  const w = window.open("", "_blank");
  if (!w) return false;
  w.document
    .write(`<!doctype html><html><head><meta charset="utf-8"><title>${escHtml(title)}</title>
    <style>
      body { font-family: Lato, -apple-system, Segoe UI, sans-serif; color: #1f1a2b; margin: 32px; line-height: 1.5; }
      .brand { font-weight: 800; background: linear-gradient(135deg,#6B3FA0,#0E8A62); -webkit-background-clip: text; color: transparent; font-size: 13px; letter-spacing: .05em; }
      h1 { font-family: 'Playfair Display', Georgia, serif; color: #6B3FA0; margin: 6px 0 4px; font-size: 26px; }
      h2 { font-size: 14px; color: #2E8171; margin: 22px 0 6px; text-transform: uppercase; letter-spacing: .04em; }
      .meta { color: #6b6578; font-size: 12px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th { text-align: left; background: #F2F0F5; padding: 6px; }
      td { padding: 6px; border-bottom: 1px solid #eee; vertical-align: top; }
      .num { text-align: right; font-variant-numeric: tabular-nums; }
      .note { font-size: 11px; color: #6b6578; margin-top: 18px; }
      .tag { display: inline-block; font-size: 10px; padding: 1px 6px; border-radius: 8px; background: #F2F0F5; color: #6b6578; }
      @media print { body { margin: 14mm; } }
    </style></head><body>
    <div class="brand">INSIDE GLOBAL EVENTS</div>
    ${bodyHtml}
    <script>window.onload = () => setTimeout(() => window.print(), 300);</script>
    </body></html>`);
  w.document.close();
  return true;
}

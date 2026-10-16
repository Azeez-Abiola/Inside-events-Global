import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const DEFAULT_PAGE_SIZE = 10;

/**
 * A <table> whose <tbody> rows are paginated. Callers keep writing their
 * table exactly as before (thead + tbody of mapped rows); this takes the
 * tbody's rows, shows one page of them, and renders the page controls
 * underneath. Searching or filtering that shrinks the list drops back to a
 * page that still exists. The controls are hidden when everything fits on
 * one page.
 */
export function PaginatedTable({
  children,
  className,
  pageSize = DEFAULT_PAGE_SIZE,
}: {
  children: ReactNode;
  className?: string;
  pageSize?: number;
}) {
  const [page, setPage] = useState(0);
  let total = 0;
  let foundBody = false;

  const content = Children.map(children, (child) => {
    if (foundBody || !isValidElement(child) || child.type !== "tbody") return child;
    foundBody = true;
    const body = child as ReactElement<{ children?: ReactNode }>;
    const rows = Children.toArray(body.props.children);
    total = rows.length;
    const pages = Math.max(1, Math.ceil(total / pageSize));
    const current = Math.min(page, pages - 1);
    return cloneElement(body, {}, rows.slice(current * pageSize, (current + 1) * pageSize));
  });

  const pages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, pages - 1);
  // Keep the stored page in range when the list shrinks (search, filters).
  useEffect(() => {
    if (page > pages - 1) setPage(pages - 1);
  }, [page, pages]);

  return (
    <>
      <table className={className}>{content}</table>
      {total > pageSize && (
        <Pager page={current} pages={pages} total={total} pageSize={pageSize} onPage={setPage} />
      )}
    </>
  );
}

function Pager({
  page,
  pages,
  total,
  pageSize,
  onPage,
}: {
  page: number;
  pages: number;
  total: number;
  pageSize: number;
  onPage: (p: number) => void;
}) {
  const from = page * pageSize + 1;
  const to = Math.min(total, (page + 1) * pageSize);
  // First, last, and the pages around the current one; gaps become "…".
  const shown = [...new Set([0, pages - 1, page - 1, page, page + 1])]
    .filter((p) => p >= 0 && p < pages)
    .sort((a, b) => a - b);
  const btn =
    "inline-flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-xs font-medium transition-colors disabled:opacity-40";
  return (
    <nav
      aria-label="Table pages"
      className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 px-4 py-3 text-xs text-muted-foreground"
    >
      <span>
        Showing {from}–{to} of {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPage(page - 1)}
          disabled={page === 0}
          aria-label="Previous page"
          className={`${btn} border-border bg-card text-foreground hover:bg-muted`}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        {shown.map((p, i) => (
          <span key={p} className="flex items-center gap-1">
            {i > 0 && p - shown[i - 1] > 1 && <span className="px-1">…</span>}
            <button
              type="button"
              onClick={() => onPage(p)}
              aria-current={p === page ? "page" : undefined}
              className={`${btn} ${
                p === page
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:bg-muted"
              }`}
            >
              {p + 1}
            </button>
          </span>
        ))}
        <button
          type="button"
          onClick={() => onPage(page + 1)}
          disabled={page >= pages - 1}
          aria-label="Next page"
          className={`${btn} border-border bg-card text-foreground hover:bg-muted`}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </nav>
  );
}

import { useMemo } from "react";
import type { BudgetWindow, CalendarItem } from "@/lib/calendar.functions";

/**
 * Month, quarter and 12-month views (TAB 4 §4.4.1).
 *
 * One grid component for all three: a month is a day grid, a quarter and a
 * year are month strips. Rendering three separate components would mean three
 * places to fix when the item shape changes.
 */

export type CalendarView = "month" | "quarter" | "year";

const SOURCE_STYLE: Record<string, string> = {
  event: "bg-brand-soft text-primary-deep",
  entry: "bg-accent/15 text-accent",
  follow_up: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  meeting: "bg-secondary/15 text-secondary-deep",
};

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}
function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function CalendarGrid({
  view,
  anchor,
  items,
  budgetWindows,
  onSelectDay,
}: {
  view: CalendarView;
  anchor: Date;
  items: CalendarItem[];
  budgetWindows: BudgetWindow[];
  onSelectDay: (day: Date) => void;
}) {
  const byDay = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    for (const i of items) {
      const key = i.starts_at.slice(0, 10);
      const list = map.get(key);
      if (list) list.push(i);
      else map.set(key, [i]);
    }
    return map;
  }, [items]);

  const inBudgetWindow = (iso: string) =>
    budgetWindows.some((w) => iso >= w.starts_on && iso <= w.ends_on);

  if (view === "month") {
    const first = startOfMonth(anchor);
    // Monday-first, which is how the rest of the product reads dates.
    const lead = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate();
    const cells: (Date | null)[] = [
      ...Array.from({ length: lead }, () => null),
      ...Array.from(
        { length: daysInMonth },
        (_, i) => new Date(anchor.getFullYear(), anchor.getMonth(), i + 1),
      ),
    ];
    const today = new Date();

    return (
      <div>
        <div className="grid grid-cols-7 gap-px border-b border-border pb-1 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px bg-border">
          {cells.map((day, i) => {
            if (!day) return <div key={`pad-${i}`} className="min-h-24 bg-card" />;
            const iso = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
            const dayItems = byDay.get(iso) ?? [];
            const isToday = sameDay(day, today);
            return (
              <button
                key={iso}
                type="button"
                onClick={() => onSelectDay(day)}
                className={`min-h-24 bg-card p-1.5 text-left transition-colors hover:bg-muted/40 ${
                  inBudgetWindow(iso) ? "ring-1 ring-inset ring-primary/25" : ""
                }`}
              >
                <span
                  className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold ${
                    isToday ? "bg-brand-gradient text-white" : "text-muted-foreground"
                  }`}
                >
                  {day.getDate()}
                </span>
                <span className="mt-1 block space-y-0.5">
                  {dayItems.slice(0, 3).map((it) => (
                    <span
                      key={it.id}
                      className={`block truncate rounded px-1 py-0.5 text-[10px] ${SOURCE_STYLE[it.source] ?? "bg-muted"}`}
                      title={it.title}
                    >
                      {it.is_private ? "🔒 " : ""}
                      {it.title}
                    </span>
                  ))}
                  {dayItems.length > 3 && (
                    <span className="block px-1 text-[10px] text-muted-foreground">
                      +{dayItems.length - 3} more
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Quarter and year are the same shape — month strips, three or twelve of them.
  const months = view === "quarter" ? 3 : 12;
  const start = view === "quarter" ? startOfMonth(anchor) : new Date(anchor.getFullYear(), 0, 1);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: months }, (_, i) => addMonths(start, i)).map((m) => {
        const key = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`;
        const monthItems = items.filter((it) => it.starts_at.slice(0, 7) === key);
        return (
          <div key={key} className="rounded-xl border border-border bg-card p-3">
            <h3 className="mb-2 text-sm font-semibold text-foreground">
              {m.toLocaleString(undefined, { month: "long", year: "numeric" })}
            </h3>
            {monthItems.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nothing planned.</p>
            ) : (
              <ul className="space-y-1">
                {monthItems.slice(0, 8).map((it) => (
                  <li key={it.id} className="flex items-baseline gap-2">
                    <span className="w-6 shrink-0 text-[11px] tabular-nums text-muted-foreground">
                      {it.starts_at.slice(8, 10)}
                    </span>
                    <span
                      className={`min-w-0 flex-1 truncate rounded px-1 py-0.5 text-[11px] ${SOURCE_STYLE[it.source] ?? "bg-muted"}`}
                      title={it.title}
                    >
                      {it.is_private ? "🔒 " : ""}
                      {it.title}
                    </span>
                  </li>
                ))}
                {monthItems.length > 8 && (
                  <li className="pl-8 text-[11px] text-muted-foreground">
                    +{monthItems.length - 8} more
                  </li>
                )}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

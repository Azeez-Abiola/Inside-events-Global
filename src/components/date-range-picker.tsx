import { useMemo, useState } from "react";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { format, startOfMonth, subMonths, endOfDay, startOfDay } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type DateRangeValue = { from: Date; to: Date };

const PRESETS: { id: string; label: string; range: () => DateRangeValue }[] = [
  {
    id: "3m",
    label: "Last 3 months",
    range: () => ({ from: startOfMonth(subMonths(new Date(), 2)), to: endOfDay(new Date()) }),
  },
  {
    id: "6m",
    label: "Last 6 months",
    range: () => ({ from: startOfMonth(subMonths(new Date(), 5)), to: endOfDay(new Date()) }),
  },
  {
    id: "12m",
    label: "Last 12 months",
    range: () => ({ from: startOfMonth(subMonths(new Date(), 11)), to: endOfDay(new Date()) }),
  },
  {
    id: "ytd",
    label: "Year to date",
    range: () => ({ from: startOfDay(new Date(new Date().getFullYear(), 0, 1)), to: endOfDay(new Date()) }),
  },
];

export function defaultSalesRange(): DateRangeValue {
  return PRESETS.find((p) => p.id === "6m")!.range();
}

export function DateRangePicker({
  value,
  onChange,
  className,
}: {
  value: DateRangeValue;
  onChange: (next: DateRangeValue) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange | undefined>({ from: value.from, to: value.to });

  const label = useMemo(() => {
    if (!value.from || !value.to) return "Pick dates";
    return `${format(value.from, "MMM d, yyyy")} – ${format(value.to, "MMM d, yyyy")}`;
  }, [value.from, value.to]);

  function applyPreset(preset: (typeof PRESETS)[number]) {
    const range = preset.range();
    onChange(range);
    setDraft({ from: range.from, to: range.to });
    setOpen(false);
  }

  function applyCustom() {
    if (!draft?.from || !draft?.to) return;
    onChange({ from: startOfDay(draft.from), to: endOfDay(draft.to) });
    setOpen(false);
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setDraft({ from: value.from, to: value.to });
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            "h-9 gap-2 rounded-full border-border/60 bg-muted/40 px-3 text-[11px] font-semibold text-foreground hover:bg-muted",
            className,
          )}
        >
          <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-0" sideOffset={8}>
        <div className="flex flex-col sm:flex-row">
          <div className="flex flex-row gap-1 border-b border-border p-3 sm:w-40 sm:flex-col sm:border-b-0 sm:border-r">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p)}
                className="rounded-lg px-3 py-2 text-left text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="p-3">
            <Calendar
              mode="range"
              numberOfMonths={2}
              selected={draft}
              onSelect={setDraft}
              defaultMonth={draft?.from ?? value.from}
              disabled={{ after: new Date() }}
            />
            <div className="mt-3 flex items-center justify-end gap-2 border-t border-border pt-3">
              <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!draft?.from || !draft?.to}
                onClick={applyCustom}
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

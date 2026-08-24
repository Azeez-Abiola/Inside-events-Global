import { ReactNode } from "react";
import { ChevronDown, Download, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type DashboardFilterOption = {
  id: string;
  label: string;
  count?: number;
};

/** Standard table status/category filter — dropdown, not a tab strip. */
export function DashboardFilterSelect({
  label = "Filter",
  value,
  onChange,
  options,
  className,
  selectClassName,
}: {
  label?: string;
  value: string;
  onChange: (id: string) => void;
  options: readonly DashboardFilterOption[];
  className?: string;
  selectClassName?: string;
}) {
  return (
    <label className={cn("inline-flex min-w-[10rem] flex-col gap-1", className)}>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "w-full appearance-none rounded-lg border border-border bg-card py-2 pl-3 pr-9 text-sm font-medium text-foreground shadow-sm",
            "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
            selectClassName,
          )}
        >
          {options.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.count != null ? `${opt.label} (${opt.count})` : opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </span>
    </label>
  );
}

/**
 * Standard dashboard table toolbar: search + filter dropdowns + export.
 * Put status/category filters in `filters` via DashboardFilterSelect.
 */
export function DashboardDataToolbar({
  search,
  onSearchChange,
  searchPlaceholder = "Search…",
  exportLabel = "Export CSV",
  onExport,
  exportDisabled,
  exportCount,
  filters,
  children,
  className,
}: {
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  exportLabel?: string;
  onExport?: () => void;
  exportDisabled?: boolean;
  exportCount?: number;
  filters?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const showSearch = onSearchChange != null;
  const showExport = onExport != null;

  if (!showSearch && !showExport && !filters && !children) return null;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-border/60 px-4 py-3 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      {showSearch ? (
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search ?? ""}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9"
          />
        </div>
      ) : (
        <div className="flex-1" />
      )}
      <div className="flex flex-wrap items-end gap-2">
        {filters}
        {children}
        {showExport && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={exportDisabled}
            onClick={onExport}
            className="h-9 gap-2"
          >
            <Download className="h-4 w-4" />
            {exportLabel}
            {exportCount != null ? ` (${exportCount})` : ""}
          </Button>
        )}
      </div>
    </div>
  );
}

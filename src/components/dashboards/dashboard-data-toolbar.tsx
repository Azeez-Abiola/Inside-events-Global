import { ReactNode } from "react";
import { Download, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
}) {
  const showSearch = onSearchChange != null;
  const showExport = onExport != null;

  if (!showSearch && !showExport && !filters && !children) return null;

  return (
    <div className="flex flex-col gap-3 border-b border-border/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
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
      <div className="flex flex-wrap items-center gap-2">
        {filters}
        {children}
        {showExport && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={exportDisabled}
            onClick={onExport}
            className="gap-2"
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

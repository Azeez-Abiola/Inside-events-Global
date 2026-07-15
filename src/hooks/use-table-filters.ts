import { useMemo } from "react";

export function useTableFilters<T>({
  rows,
  searchText = "",
  search,
  statusFilter = "all",
  matchStatus,
}: {
  rows: T[];
  searchText?: string;
  search?: (row: T) => string;
  statusFilter?: string;
  matchStatus?: (row: T, filter: string) => boolean;
}) {
  return useMemo(() => {
    let result = rows;
    if (statusFilter !== "all" && matchStatus) {
      result = result.filter((r) => matchStatus(r, statusFilter));
    }
    const q = searchText.trim().toLowerCase();
    if (q && search) {
      result = result.filter((r) => search(r).toLowerCase().includes(q));
    }
    return result;
  }, [rows, searchText, statusFilter, search, matchStatus]);
}

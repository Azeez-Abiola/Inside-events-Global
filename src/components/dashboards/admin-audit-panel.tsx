import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listAdminAuditLog } from "@/lib/admin-team.functions";
import { DashboardPanel, DashboardTable, DashboardTableHead, DashboardTabs } from "@/components/dashboards/dashboard-shell";
import { DashboardDataToolbar } from "@/components/dashboards/dashboard-data-toolbar";
import { DashboardTableSkeleton } from "@/components/dashboards/dashboard-skeletons";
import { useTableFilters } from "@/hooks/use-table-filters";
import { datedCsvFilename, downloadCsv } from "@/lib/csv-export";

const ACTION_LABELS: Record<string, string> = {
  admin_login: "Signed in",
  admin_invited: "Sub-admin invited",
  user_suspended: "User deactivated",
  user_reactivated: "User reactivated",
  event_vetting_updated: "Event vetting updated",
  event_deleted: "Event deleted",
  newsletter_sent: "Newsletter sent",
  commission_rates_updated: "Commission rates updated",
  fx_rates_updated: "FX rates updated",
  fraud_flag_updated: "Fraud flag updated",
  complaint_reply_sent: "Complaint reply sent",
  waitlist_invited: "Waitlist invite sent",
  waitlist_rejected: "Waitlist rejected",
};

export function AdminAuditPanel() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const fetchLog = useServerFn(listAdminAuditLog);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-audit-log"],
    queryFn: () => fetchLog({ data: { limit: 300 } }),
  });

  const rows = (data?.entries ?? []) as Array<{
    id: string;
    created_at: string;
    actor_email: string | null;
    actor_role: string;
    action: string;
    summary: string;
  }>;

  const filtered = useTableFilters({
    rows,
    searchText: search,
    statusFilter: roleFilter,
    search: (r) => [r.actor_email, r.actor_role, r.action, r.summary].filter(Boolean).join(" "),
    matchStatus: (r, filter) => r.actor_role === filter,
  });

  return (
    <>
      <DashboardTabs
        tabs={[
          { id: "all", label: "All roles", count: rows.length },
          { id: "abw_admin", label: "Sub-admins", count: rows.filter((r) => r.actor_role === "abw_admin").length },
          { id: "super_admin", label: "Super admins", count: rows.filter((r) => r.actor_role === "super_admin").length },
        ]}
        active={roleFilter}
        onChange={setRoleFilter}
      />

      <DashboardPanel title="Audit log" description="Who signed in and what vital actions were taken." bodyClassName="p-0">
        <DashboardDataToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search email, action, summary…"
          onExport={() =>
            downloadCsv(
              datedCsvFilename("ige-admin-audit"),
              ["created_at", "actor_email", "actor_role", "action", "summary"],
              filtered.map((r) => [
                r.created_at,
                r.actor_email ?? "",
                r.actor_role,
                ACTION_LABELS[r.action] ?? r.action,
                r.summary,
              ]),
            )
          }
          exportDisabled={!filtered.length}
          exportCount={filtered.length}
        />
        {isLoading ? (
          <DashboardTableSkeleton rows={8} cols={4} />
        ) : !rows.length ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No audit entries yet.</div>
        ) : (
          <DashboardTable>
            <DashboardTableHead>
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Who</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Summary</th>
              </tr>
            </DashboardTableHead>
            <tbody className="divide-y divide-border/60">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-muted/10">
                  <td className="px-4 py-3 text-xs whitespace-nowrap text-muted-foreground">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-foreground">{r.actor_email ?? "—"}</div>
                    <div className="text-xs capitalize text-muted-foreground">{r.actor_role.replace(/_/g, " ")}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {ACTION_LABELS[r.action] ?? r.action.replace(/_/g, " ")}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">{r.summary}</td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                    No entries match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </DashboardTable>
        )}
      </DashboardPanel>
    </>
  );
}

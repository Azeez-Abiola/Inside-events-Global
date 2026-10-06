import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Building2, Loader2, Plus, Search, Users, X } from "lucide-react";
import { WorkspacePage } from "@/components/dashboards/workspace-page";
import { DashboardPanel } from "@/components/dashboards/dashboard-shell";
import { Button } from "@/components/ui/button";
import { InfoTip } from "@/components/info-tip";
import {
  getCrmWorkspace,
  moveDealToStage,
  upsertContact,
  upsertDeal,
  type CrmContact,
  type CrmDeal,
  type CrmStage,
} from "@/lib/crm.functions";
import { can, type WorkspaceRole } from "@/lib/workspace-permissions";
import { PipelineBoard } from "@/components/crm/pipeline-board";
import { ContactTable } from "@/components/crm/contact-table";
import { ContactDrawer } from "@/components/crm/contact-drawer";

/**
 * Contacts and CRM (TAB 4 §4.4.2).
 *
 * One workspace, one pipeline — an Organisation team shares it, and a Manager
 * sees everything while being able to change none of it. Read-only seats get
 * the same screen with the write affordances removed rather than a different
 * one, so nobody has to wonder what they are missing.
 */
type Tab = "pipeline" | "contacts" | "companies";

export function CrmPage() {
  const qc = useQueryClient();
  const fetchCrm = useServerFn(getCrmWorkspace);
  const moveDeal = useServerFn(moveDealToStage);

  const [tab, setTab] = useState<Tab>("pipeline");
  const [search, setSearch] = useState("");
  const [openContact, setOpenContact] = useState<CrmContact | null>(null);
  const [newContactOpen, setNewContactOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["crm-workspace"],
    queryFn: () => fetchCrm(),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["crm-workspace"] });

  const move = useMutation({
    mutationFn: (v: { deal_id: string; stage_id: string }) => moveDeal({ data: v }),
    onSuccess: refresh,
    onError: (e: Error) => toast.error(e.message),
  });

  const myRole = (data?.myRole ?? null) as WorkspaceRole | null;
  const editable = can(myRole, "workspace.edit");

  const companyById = useMemo(
    () => new Map((data?.companies ?? []).map((c) => [c.id, c])),
    [data?.companies],
  );
  const contactById = useMemo(
    () => new Map((data?.contacts ?? []).map((c) => [c.id, c])),
    [data?.contacts],
  );

  const filteredContacts = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = data?.contacts ?? [];
    if (!q) return rows;
    return rows.filter((c) =>
      [c.full_name, c.email, c.phone, c.job_title, companyById.get(c.company_id ?? "")?.name]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [data?.contacts, search, companyById]);

  if (isLoading) {
    return (
      <WorkspacePage title="Contacts & CRM">
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </WorkspacePage>
    );
  }

  const stages = (data?.stages ?? []) as CrmStage[];
  const deals = (data?.deals ?? []) as CrmDeal[];

  const TABS: { id: Tab; label: string; count: number }[] = [
    { id: "pipeline", label: "Pipeline", count: deals.length },
    { id: "contacts", label: "Contacts", count: data?.contacts.length ?? 0 },
    { id: "companies", label: "Companies", count: data?.companies.length ?? 0 },
  ];

  return (
    <WorkspacePage
      title="Contacts & CRM"
      subtitle="Your own contacts, clients and deals — shared with everyone on this workspace."
      action={
        editable ? (
          <Button onClick={() => setNewContactOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New contact
          </Button>
        ) : undefined
      }
    >
      {myRole === "manager" && (
        <p className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
          Your seat is Manager — read-only oversight. You can see everything the team is working on
          here, but cannot change it.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-brand-soft text-primary-deep"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {t.label}
            <span className="rounded-full bg-muted px-1.5 text-[11px] tabular-nums">{t.count}</span>
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts…"
              className="w-56 rounded-md border border-border bg-background py-1.5 pl-8 pr-7 text-sm focus:border-primary focus:outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {tab === "pipeline" && (
        <PipelineBoard
          stages={stages}
          deals={deals}
          contactById={contactById}
          companyById={companyById}
          editable={editable}
          onMove={(deal_id, stage_id) => move.mutate({ deal_id, stage_id })}
          onChanged={refresh}
        />
      )}

      {tab === "contacts" && (
        <ContactTable
          contacts={filteredContacts}
          companyById={companyById}
          onOpen={setOpenContact}
          emptyHint={
            search ? "No contacts match that search." : "No contacts yet. Add your first one."
          }
        />
      )}

      {tab === "companies" && (
        <DashboardPanel title="Companies and clients">
          {(data?.companies ?? []).length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">
              No companies yet. They are created automatically when you set a company on a contact.
            </p>
          ) : (
            <ul className="divide-y divide-border/60">
              {(data?.companies ?? []).map((c) => {
                const people = (data?.contacts ?? []).filter((p) => p.company_id === c.id).length;
                return (
                  <li key={c.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                    <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {c.name}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {[c.sector, c.country].filter(Boolean).join(" · ") || "—"}
                      </span>
                    </span>
                    {c.is_client && (
                      <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-[11px] font-semibold text-secondary-deep">
                        Client{c.client_type ? ` · ${c.client_type}` : ""}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {people}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </DashboardPanel>
      )}

      {(openContact || newContactOpen) && (
        <ContactDrawer
          contact={openContact}
          companies={data?.companies ?? []}
          deals={deals}
          editable={editable}
          onClose={() => {
            setOpenContact(null);
            setNewContactOpen(false);
          }}
          onSaved={() => {
            refresh();
            setOpenContact(null);
            setNewContactOpen(false);
          }}
        />
      )}
    </WorkspacePage>
  );
}

import { DashboardPanel } from "@/components/dashboards/dashboard-shell";
import type { CrmCompany, CrmContact } from "@/lib/crm.functions";

/** The contacts list (TAB 4 §4.4.2). Rows open the drawer. */
export function ContactTable({
  contacts,
  companyById,
  onOpen,
  emptyHint,
}: {
  contacts: CrmContact[];
  companyById: Map<string, CrmCompany>;
  onOpen: (c: CrmContact) => void;
  emptyHint: string;
}) {
  return (
    <DashboardPanel title="Contacts" bodyClassName="p-0">
      {contacts.length === 0 ? (
        <p className="px-5 py-12 text-center text-sm text-muted-foreground">{emptyHint}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Company</th>
                <th className="px-5 py-3 font-semibold">Type</th>
                <th className="px-5 py-3 font-semibold">Email</th>
                <th className="px-5 py-3 font-semibold">Phone</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {contacts.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => onOpen(c)}
                  className="cursor-pointer transition-colors hover:bg-muted/40"
                >
                  <td className="px-5 py-3">
                    <span className="block font-medium text-foreground">{c.full_name}</span>
                    {c.job_title && (
                      <span className="block text-xs text-muted-foreground">{c.job_title}</span>
                    )}
                    {c.tags.length > 0 && (
                      <span className="mt-1 flex flex-wrap gap-1">
                        {c.tags.map((t) => (
                          <span
                            key={t}
                            className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                          >
                            {t}
                          </span>
                        ))}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">
                    {c.company_id ? (companyById.get(c.company_id)?.name ?? "—") : "—"}
                  </td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">
                    {c.contact_type ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{c.email ?? "—"}</td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{c.phone ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardPanel>
  );
}

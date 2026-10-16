import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { WorkspacePage } from "@/components/dashboards/workspace-page";
import { DashboardPanel } from "@/components/dashboards/dashboard-shell";
import { getHelpContentGaps } from "@/lib/help-feedback.functions";
import { PaginatedTable } from "@/components/paginated-table";

/** Help Center content-gap report for Support (TAB 17 §17.3). */
export function HelpGapsPage() {
  const [days, setDays] = useState(30);
  const fetchGaps = useServerFn(getHelpContentGaps);
  const { data, isLoading } = useQuery({
    queryKey: ["help-gaps", days],
    queryFn: () => fetchGaps({ data: { days } }),
  });
  return (
    <WorkspacePage
      title="Help content gaps"
      subtitle="Which answers aren't helping, and what people ask Live Chat that the Help Center doesn't cover."
      action={
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          aria-label="Period"
          className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      }
    >
      {isLoading || !data ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <DashboardPanel title="Answers, least helpful first">
            <PaginatedTable className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr>
                  <th className="pb-2">Question</th>
                  <th className="pb-2 text-right">👍</th>
                  <th className="pb-2 text-right">👎</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.articles.map((a) => (
                  <tr key={a.id}>
                    <td className="py-2 pr-2">
                      <span className="block text-foreground">{a.q}</span>
                      <span className="text-xs text-muted-foreground">{a.category}</span>
                    </td>
                    <td className="text-right tabular-nums">{a.helpful}</td>
                    <td
                      className={`text-right tabular-nums ${a.unhelpful > a.helpful ? "font-semibold text-destructive" : ""}`}
                    >
                      {a.unhelpful}
                    </td>
                  </tr>
                ))}
              </tbody>
            </PaginatedTable>
          </DashboardPanel>
          <DashboardPanel
            title="Questions with no answer"
            description="Asked in Live Chat; the assistant had nothing confident to say."
          >
            {data.unanswered.length ? (
              <ul className="divide-y divide-border text-sm">
                {data.unanswered.map((u, i) => (
                  <li key={i} className="py-2">
                    <span className="block text-foreground">{u.question}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(u.created_at).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">None in this period.</p>
            )}
          </DashboardPanel>
        </div>
      )}
    </WorkspacePage>
  );
}

import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarCheck, Coins, Handshake, MessageSquare, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DashboardHeader, DashboardPanel } from "@/components/dashboards/dashboard-shell";
import { DashboardPageSkeleton } from "@/components/dashboards/dashboard-skeletons";
import { StatCard } from "@/components/dashboards/shared";
import { ProfileCompletionBar } from "@/components/onboarding/profile-completion-bar";
import { MatchNotificationsPanel } from "@/components/matches/match-notifications-panel";
import { fmtMoney } from "@/lib/currency";
import { getCrmActivity, getCrmWorkspace } from "@/lib/crm.functions";

const iso = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Partnerships Pro home (TAB 5 §5.5, rebuilt as a CRM in v6.2): "a
 * partnerships professional should open IGE every morning to check what is
 * happening with their partnerships, and update it straight after every
 * meeting."
 */
export function ProDashboard() {
  const fetchCrm = useServerFn(getCrmWorkspace);
  const fetchActivity = useServerFn(getCrmActivity);
  const { data: crm, isLoading } = useQuery({
    queryKey: ["crm-workspace"],
    queryFn: () => fetchCrm(),
  });
  const { data: act } = useQuery({
    queryKey: ["crm-activity"],
    queryFn: () => fetchActivity({ data: { days: 180 } }),
  });

  if (isLoading || !crm) {
    return (
      <AppShell>
        <DashboardPageSkeleton kpis={4} />
      </AppShell>
    );
  }

  const today = iso(new Date());
  const weekAgo = iso(new Date(Date.now() - 6 * 86_400_000));
  const monthStart = `${today.slice(0, 7)}-01`;
  const contactName = new Map(crm.contacts.map((c) => [c.id, c.full_name]));

  const followUps = (act?.outreach ?? [])
    .filter((o) => o.next_follow_up && o.next_follow_up <= today)
    .sort((a, b) => (a.next_follow_up ?? "").localeCompare(b.next_follow_up ?? ""));

  // Open pipeline by stage, per currency.
  const openStages = crm.stages.filter((s) => !s.is_won && !s.is_lost);
  const byStage = openStages.map((s) => {
    const deals = crm.deals.filter((d) => d.stage_id === s.id);
    const values = deals.reduce<Record<string, number>>((acc, d) => {
      acc[d.value_currency] = (acc[d.value_currency] ?? 0) + Number(d.value_amount ?? 0);
      return acc;
    }, {});
    return { stage: s.name, count: deals.length, values };
  });
  const pipelineTotals = byStage.reduce<Record<string, number>>((acc, s) => {
    for (const [c, v] of Object.entries(s.values)) acc[c] = (acc[c] ?? 0) + v;
    return acc;
  }, {});

  const commissions = act?.commissions ?? [];
  const thisMonth = commissions.filter(
    (c) => c.created_at.slice(0, 10) >= monthStart || (c.paid_at ?? "") >= monthStart,
  );
  const commissionByCur = thisMonth.reduce<
    Record<string, { earned: number; expected: number; paid: number }>
  >((acc, c) => {
    const t = (acc[c.currency] ??= { earned: 0, expected: 0, paid: 0 });
    t.earned += c.earned_amount ?? 0;
    t.expected += c.expected_amount ?? 0;
    if (c.status === "paid") t.paid += c.earned_amount ?? c.expected_amount ?? 0;
    return acc;
  }, {});
  const firstCur = Object.keys(commissionByCur)[0];

  const contactsThisWeek = crm.contacts.filter(
    (c) => (c.created_at ?? "").slice(0, 10) >= weekAgo,
  ).length;
  const outreachThisWeek = (act?.outreach ?? []).filter(
    (o) => o.occurred_at.slice(0, 10) >= weekAgo,
  ).length;
  const meetingsThisWeek = (act?.meetings ?? []).filter(
    (m) => m.held_at.slice(0, 10) >= weekAgo,
  ).length;

  return (
    <AppShell>
      <div className="space-y-6">
        <DashboardHeader
          title="Partnerships workspace"
          subtitle="Today's follow-ups, your pipeline and your commission — update it straight after every meeting."
          action={
            <Link to="/dashboard/crm" className="btn-primary inline-block">
              Open CRM
            </Link>
          }
        />
        <ProfileCompletionBar />

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon={CalendarCheck} label="Follow-ups due" value={followUps.length} />
          <StatCard
            icon={Coins}
            label="Commission this month"
            value={
              firstCur
                ? fmtMoney(
                    firstCur,
                    commissionByCur[firstCur].earned || commissionByCur[firstCur].expected,
                  )
                : "—"
            }
          />
          <StatCard icon={MessageSquare} label="Outreach this week" value={outreachThisWeek} />
          <StatCard icon={Users} label="Meetings this week" value={meetingsThisWeek} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <DashboardPanel
            title="Today's follow-ups"
            description="Due today or overdue."
            action={
              <Link
                to="/dashboard/crm"
                search={{ tab: "outreach" }}
                className="text-xs font-semibold text-primary hover:underline"
              >
                All outreach →
              </Link>
            }
          >
            {followUps.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nothing due. A clear morning.
              </p>
            ) : (
              <ul className="space-y-2">
                {followUps.slice(0, 8).map((o) => (
                  <li key={o.id} className="flex items-center gap-3 text-sm">
                    <span
                      className={`w-20 shrink-0 text-xs tabular-nums ${(o.next_follow_up ?? "") < today ? "font-semibold text-destructive" : "text-foreground"}`}
                    >
                      {o.next_follow_up === today
                        ? "Today"
                        : new Date(o.next_follow_up!).toLocaleDateString()}
                    </span>
                    <span className="truncate text-foreground">
                      {o.contact_id ? contactName.get(o.contact_id) : "—"}
                      <span className="text-muted-foreground"> · {o.channel}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </DashboardPanel>

          <DashboardPanel
            title="Pipeline value"
            description="Open deals by stage."
            action={
              <Link
                to="/dashboard/crm"
                search={{ tab: "pipeline" }}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Pipeline →
              </Link>
            }
          >
            <div className="mb-3 flex flex-wrap gap-x-5">
              {Object.entries(pipelineTotals).map(([c, v]) => (
                <span
                  key={c}
                  className="bg-brand-gradient bg-clip-text font-display text-2xl font-bold tabular-nums text-transparent"
                >
                  {fmtMoney(c, v)}
                </span>
              ))}
              {!Object.keys(pipelineTotals).length && (
                <span className="text-sm text-muted-foreground">No open deals yet.</span>
              )}
            </div>
            <ul className="space-y-1.5 text-sm">
              {byStage.map((s) => (
                <li key={s.stage} className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">
                    {s.stage} <span className="tabular-nums">({s.count})</span>
                  </span>
                  <span className="tabular-nums text-foreground">
                    {Object.entries(s.values)
                      .filter(([, v]) => v > 0)
                      .map(([c, v]) => fmtMoney(c, v))
                      .join(" + ") || "—"}
                  </span>
                </li>
              ))}
            </ul>
          </DashboardPanel>

          <DashboardPanel
            title="Commission this month"
            action={
              <Link
                to="/dashboard/crm"
                search={{ tab: "commission" }}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Commission tracker →
              </Link>
            }
          >
            {Object.keys(commissionByCur).length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nothing recorded this month.
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {Object.entries(commissionByCur).map(([c, t]) => (
                  <li key={c} className="flex flex-wrap justify-between gap-2">
                    <span className="font-medium text-foreground">
                      {fmtMoney(c, t.earned)} earned
                    </span>
                    <span className="text-muted-foreground">
                      {fmtMoney(c, t.expected)} expected · {fmtMoney(c, t.paid)} paid
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </DashboardPanel>

          <DashboardPanel
            title="This week"
            action={
              <Link
                to="/dashboard/reports"
                className="text-xs font-semibold text-primary hover:underline"
              >
                Weekly Activity Report →
              </Link>
            }
          >
            <dl className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: "Contacts added", value: contactsThisWeek, icon: Users },
                { label: "Outreach made", value: outreachThisWeek, icon: Handshake },
                { label: "Meetings held", value: meetingsThisWeek, icon: CalendarCheck },
              ].map((x) => (
                <div key={x.label} className="rounded-lg bg-muted/30 p-3">
                  <dd className="text-2xl font-bold tabular-nums text-foreground">{x.value}</dd>
                  <dt className="text-[11px] text-muted-foreground">{x.label}</dt>
                </div>
              ))}
            </dl>
          </DashboardPanel>
        </div>

        <MatchNotificationsPanel />
      </div>
    </AppShell>
  );
}

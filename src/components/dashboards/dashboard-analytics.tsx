import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { StatCard } from "@/components/dashboards/shared";
import { DashboardLoading, DashboardPanel } from "@/components/dashboards/dashboard-shell";
import {
  getOrganiserAnalytics, getSponsorAnalytics, getReferralAnalytics, getMediaAnalytics, getAdminAnalytics,
} from "@/lib/analytics.functions";
import { Eye, Bookmark, MessageSquare, BarChart3, Inbox, TrendingUp, Wallet, Link2, Newspaper, DollarSign, Users, ShieldCheck } from "lucide-react";

const CHART_COLORS = ["hsl(271 45% 44%)", "hsl(160 100% 25%)", "hsl(271 45% 60%)", "hsl(160 60% 40%)", "hsl(220 20% 50%)", "hsl(35 90% 50%)"];

function fmtMonth(m: string) {
  const [y, mo] = m.split("-");
  return new Date(Number(y), Number(mo) - 1).toLocaleString("en", { month: "short" });
}

function BarPanel({ title, description, data, dataKey, nameKey }: {
  title: string; description?: string;
  data: { [k: string]: string | number }[];
  dataKey: string; nameKey: string;
}) {
  if (!data.length) return null;
  const config = { [dataKey]: { label: title, color: CHART_COLORS[0] } };
  return (
    <DashboardPanel title={title} description={description}>
      <ChartContainer config={config} className="h-[260px] w-full aspect-auto">
        <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey={nameKey} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
          <YAxis tickLine={false} axisLine={false} width={32} tick={{ fontSize: 11 }} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey={dataKey} fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </DashboardPanel>
  );
}

function LinePanel({ title, description, data }: { title: string; description?: string; data: { month: string; count: number }[] }) {
  const config = { count: { label: "Count", color: CHART_COLORS[1] } };
  const chartData = data.map((d) => ({ ...d, label: fmtMonth(d.month) }));
  return (
    <DashboardPanel title={title} description={description}>
      <ChartContainer config={config} className="h-[260px] w-full aspect-auto">
        <LineChart data={chartData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
          <YAxis tickLine={false} axisLine={false} width={32} tick={{ fontSize: 11 }} allowDecimals={false} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line type="monotone" dataKey="count" stroke={CHART_COLORS[1]} strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ChartContainer>
    </DashboardPanel>
  );
}

function MultiBarPanel({ title, description, data }: {
  title: string; description?: string;
  data: { name: string; views: number; saves: number; inquiries: number }[];
}) {
  if (!data.length) return null;
  const config = {
    views: { label: "Views", color: CHART_COLORS[0] },
    saves: { label: "Saves", color: CHART_COLORS[1] },
    inquiries: { label: "Inquiries", color: CHART_COLORS[2] },
  };
  return (
    <DashboardPanel title={title} description={description}>
      <ChartContainer config={config} className="h-[280px] w-full aspect-auto">
        <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
          <YAxis tickLine={false} axisLine={false} width={32} tick={{ fontSize: 11 }} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="views" fill={CHART_COLORS[0]} radius={[2, 2, 0, 0]} />
          <Bar dataKey="saves" fill={CHART_COLORS[1]} radius={[2, 2, 0, 0]} />
          <Bar dataKey="inquiries" fill={CHART_COLORS[2]} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </DashboardPanel>
  );
}

function PiePanel({ title, description, data, nameKey, valueKey }: {
  title: string; description?: string;
  data: { [k: string]: string | number }[];
  nameKey: string; valueKey: string;
}) {
  if (!data.length) return null;
  const config = Object.fromEntries(data.map((d, i) => [String(d[nameKey]), { label: String(d[nameKey]), color: CHART_COLORS[i % CHART_COLORS.length] }]));
  return (
    <DashboardPanel title={title} description={description}>
      <ChartContainer config={config} className="h-[260px] w-full aspect-auto">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent />} />
          <Pie data={data} dataKey={valueKey} nameKey={nameKey} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2}>
            {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
          </Pie>
        </PieChart>
      </ChartContainer>
    </DashboardPanel>
  );
}

export function OrganiserAnalyticsPanel() {
  const fetch = useServerFn(getOrganiserAnalytics);
  const { data, isLoading } = useQuery({ queryKey: ["analytics", "organiser"], queryFn: () => fetch() });
  if (isLoading || !data) return <DashboardLoading label="Loading analytics…" />;
  const s = data.summary;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={Eye} label="Total profile views" value={s.totalViews} />
        <StatCard icon={Bookmark} label="Times saved" value={s.totalSaves} />
        <StatCard icon={MessageSquare} label="Commitment inquiries" value={s.totalInquiries} />
        <StatCard icon={BarChart3} label="Closed deals" value={s.closedDeals} />
        <StatCard icon={ShieldCheck} label="IGE vetted events" value={s.vettedEvents} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <MultiBarPanel title="Event engagement" description="Views, saves, and inquiries per live listing" data={data.eventEngagement} />
        <LinePanel title="Inquiries over time" description="Commitment forms received (last 6 months)" data={data.inquiriesOverTime} />
        <BarPanel title="Deal pipeline" description="Deals by current stage" data={data.dealPipeline} dataKey="count" nameKey="status" />
      </div>
    </div>
  );
}

export function SponsorAnalyticsPanel() {
  const fetch = useServerFn(getSponsorAnalytics);
  const { data, isLoading } = useQuery({ queryKey: ["analytics", "sponsor"], queryFn: () => fetch() });
  if (isLoading || !data) return <DashboardLoading label="Loading analytics…" />;
  const s = data.summary;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={Inbox} label="Commitments submitted" value={s.commitments} />
        <StatCard icon={Bookmark} label="Events saved" value={s.savedEvents} />
        <StatCard icon={TrendingUp} label="Sectors explored" value={s.sectorsExplored} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <LinePanel title="Commitments over time" data={data.commitmentsOverTime} />
        <LinePanel title="Saves over time" data={data.savesOverTime} />
        <PiePanel title="Interest by sector" data={data.sectorBreakdown} nameKey="sector" valueKey="count" />
        <BarPanel title="Budget ceiling by currency" data={data.budgetByCurrency} dataKey="total" nameKey="currency" />
      </div>
    </div>
  );
}

export function ReferralAnalyticsPanel() {
  const fetch = useServerFn(getReferralAnalytics);
  const { data, isLoading } = useQuery({ queryKey: ["analytics", "referral"], queryFn: () => fetch() });
  if (isLoading || !data) return <DashboardLoading label="Loading analytics…" />;
  const s = data.summary;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Link2} label="Active links" value={s.links} />
        <StatCard icon={TrendingUp} label="Total clicks" value={s.clicks} />
        <StatCard icon={BarChart3} label="Conversions" value={s.conversions} />
        <StatCard icon={Wallet} label="Earned (USD)" value={`$${s.earned.toFixed(0)}`} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <BarPanel title="Clicks by referral link" data={data.clicksByLink} dataKey="clicks" nameKey="name" />
        <PiePanel title="Commission breakdown (USD)" data={data.commissionBreakdown} nameKey="label" valueKey="value" />
        <LinePanel title="Attributed deals over time" data={data.dealsOverTime} />
      </div>
    </div>
  );
}

export function MediaAnalyticsPanel() {
  const fetch = useServerFn(getMediaAnalytics);
  const { data, isLoading } = useQuery({ queryKey: ["analytics", "media"], queryFn: () => fetch() });
  if (isLoading || !data) return <DashboardLoading label="Loading analytics…" />;
  const s = data.summary;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={Newspaper} label="Coverage requests" value={s.requests} />
        <StatCard icon={Bookmark} label="Saved events" value={s.saved} />
        <StatCard icon={ShieldCheck} label="Approved requests" value={s.approved} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <PiePanel title="Requests by status" data={data.requestsByStatus} nameKey="status" valueKey="count" />
        <LinePanel title="Requests over time" data={data.requestsOverTime} />
        <BarPanel title="Sector interest" data={data.sectorInterest} dataKey="count" nameKey="sector" />
      </div>
    </div>
  );
}

export function AdminAnalyticsPanel() {
  const fetch = useServerFn(getAdminAnalytics);
  const { data, isLoading } = useQuery({ queryKey: ["analytics", "admin"], queryFn: () => fetch() });
  if (isLoading || !data) return <DashboardLoading label="Loading analytics…" />;
  const s = data.summary;
  const gmvConfig = { gmv: { label: "GMV (USD)", color: CHART_COLORS[0] } };
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={ShieldCheck} label="Total events" value={s.totalEvents} />
        <StatCard icon={TrendingUp} label="Live listings" value={s.liveEvents} />
        <StatCard icon={DollarSign} label="Platform GMV" value={`$${s.gmv.toLocaleString()}`} />
        <StatCard icon={Users} label="Waitlist signups" value={s.waitlist} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardPanel title="GMV over time" description="Closed deal value (USD, last 6 months)">
          <ChartContainer config={gmvConfig} className="h-[260px] w-full aspect-auto">
            <LineChart data={data.gmvOverTime.map((d) => ({ ...d, label: fmtMonth(d.month) }))} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
              <YAxis tickLine={false} axisLine={false} width={48} tick={{ fontSize: 11 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="gmv" stroke={CHART_COLORS[0]} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ChartContainer>
        </DashboardPanel>
        <LinePanel title="Waitlist growth" data={data.waitlistOverTime} />
        <BarPanel title="Vetting pipeline" data={data.vettingPipeline} dataKey="count" nameKey="status" />
        <BarPanel title="Deal pipeline" data={data.dealPipeline} dataKey="count" nameKey="status" />
      </div>
    </div>
  );
}

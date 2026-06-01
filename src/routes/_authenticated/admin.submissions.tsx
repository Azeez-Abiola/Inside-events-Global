import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/admin/submissions")({
  head: () => ({ meta: [{ title: "Submissions — Admin" }] }),
  beforeLoad: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw redirect({ to: "/login" });
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
    const isAdmin = roles?.some((r) => r.role === "abw_admin" || r.role === "super_admin");
    if (!isAdmin) throw redirect({ to: "/dashboard" });
  },
  component: SubmissionsPage,
});

function fmt(d: string) {
  return new Date(d).toLocaleString();
}

function SubmissionsPage() {
  const [tab, setTab] = useState<"waitlist" | "contact">("waitlist");

  const waitlist = useQuery({
    queryKey: ["admin-waitlist"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("waitlist_signups")
        .select("id,created_at,audience,full_name,email,company,role_title,country,phone,notes,status")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });

  const contact = useQuery({
    queryKey: ["admin-contact"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_submissions")
        .select("id,created_at,name,email,company,subject,message,status")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Submissions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Waitlist signups and contact-form messages. Latest first.
          </p>
        </div>
        <Link to="/dashboard" className="text-sm text-primary hover:underline">← Dashboard</Link>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="waitlist">
            Waitlist {waitlist.data ? `(${waitlist.data.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="contact">
            Contact {contact.data ? `(${contact.data.length})` : ""}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="waitlist" className="mt-4 rounded-2xl border border-border bg-card">
          {waitlist.isLoading ? (
            <div className="p-8 text-sm text-muted-foreground">Loading…</div>
          ) : waitlist.error ? (
            <div className="p-8 text-sm text-destructive">{(waitlist.error as Error).message}</div>
          ) : !waitlist.data?.length ? (
            <div className="p-8 text-sm text-muted-foreground">No signups yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Audience</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {waitlist.data.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{fmt(r.created_at)}</TableCell>
                    <TableCell><Badge variant="outline">{r.audience}</Badge></TableCell>
                    <TableCell>{r.full_name}</TableCell>
                    <TableCell className="text-sm"><a href={`mailto:${r.email}`} className="text-primary hover:underline">{r.email}</a></TableCell>
                    <TableCell className="text-sm">{r.company ?? "—"}</TableCell>
                    <TableCell className="text-sm">{r.role_title ?? "—"}</TableCell>
                    <TableCell className="text-sm">{r.country ?? "—"}</TableCell>
                    <TableCell><Badge>{r.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="contact" className="mt-4 rounded-2xl border border-border bg-card">
          {contact.isLoading ? (
            <div className="p-8 text-sm text-muted-foreground">Loading…</div>
          ) : contact.error ? (
            <div className="p-8 text-sm text-destructive">{(contact.error as Error).message}</div>
          ) : !contact.data?.length ? (
            <div className="p-8 text-sm text-muted-foreground">No contact messages yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contact.data.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{fmt(r.created_at)}</TableCell>
                    <TableCell className="text-sm">
                      <div className="font-medium">{r.name}</div>
                      <a href={`mailto:${r.email}`} className="text-xs text-primary hover:underline">{r.email}</a>
                      {r.company ? <div className="text-xs text-muted-foreground">{r.company}</div> : null}
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate text-sm" title={r.subject}>{r.subject}</TableCell>
                    <TableCell className="max-w-[420px] whitespace-pre-wrap text-sm text-muted-foreground">{r.message}</TableCell>
                    <TableCell><Badge>{r.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

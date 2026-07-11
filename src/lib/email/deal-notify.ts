import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendTransactionalEmailServer } from "@/lib/email/server-send";

const SITE_URL = process.env.VITE_SITE_URL || "https://www.insideglobalevents.com";

export const DEAL_STATUS_LABELS: Record<string, string> = {
  inquiry_received: "Inquiry received",
  qualification_call_scheduled: "Qualification call scheduled",
  proposal_sent: "Proposal sent",
  negotiation: "In negotiation",
  contract_sent: "Contract sent",
  contract_signed: "Contract signed",
  payment_received: "Payment received",
  deal_closed: "Deal closed",
  deal_lost: "Deal lost",
  cancelled: "Cancelled",
};

export async function notifyDealParties(opts: {
  dealId: string;
  eventName: string;
  fromStatus: string | null;
  toStatus: string;
  note?: string | null;
  userIds: string[];
}) {
  const { dealId, eventName, fromStatus, toStatus, note, userIds } = opts;
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
  if (!uniqueIds.length) return;

  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("id, email, display_name")
    .in("id", uniqueIds);
  const statusLabel = DEAL_STATUS_LABELS[toStatus] ?? toStatus.replace(/_/g, " ");

  for (const p of profiles ?? []) {
    if (!p.email) continue;
    try {
      await sendTransactionalEmailServer({
        templateName: "deal-status",
        recipientEmail: p.email,
        idempotencyKey: `deal-${dealId}-${toStatus}-${p.id}`,
        templateData: {
          name: p.display_name ?? p.email.split("@")[0],
          eventName,
          statusLabel,
          previousStatus: fromStatus ? (DEAL_STATUS_LABELS[fromStatus] ?? fromStatus) : null,
          note: note ?? undefined,
          dashboardUrl: `${SITE_URL}/dashboard/pipeline`,
        },
      });
    } catch (e) {
      console.error("[notifyDealParties] email failed", p.id, e);
    }
  }
}

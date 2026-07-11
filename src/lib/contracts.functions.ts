import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

function fmtMoney(currency: string, amount: number) {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

function buildContractHtml(opts: {
  eventName: string;
  eventCity?: string | null;
  eventCountry?: string | null;
  organiserName: string;
  sponsorCompany: string;
  sponsorContact: string;
  dealValue?: number | null;
  currency: string;
  signedDate: string;
  referralPartner?: string | null;
}) {
  const location = [opts.eventCity, opts.eventCountry].filter(Boolean).join(", ");
  const valueLine =
    opts.dealValue != null && opts.dealValue > 0
      ? fmtMoney(opts.currency, opts.dealValue)
      : "To be confirmed per signed proposal";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Sponsorship Agreement — ${opts.eventName}</title>
  <style>
    body { font-family: Inter, Arial, sans-serif; color: #2D1F3D; max-width: 720px; margin: 40px auto; line-height: 1.6; }
    h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
    .meta { color: #7A6A8A; font-size: 0.875rem; margin-bottom: 2rem; }
    h2 { font-size: 1rem; margin-top: 1.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #6B3FA0; }
    p, li { font-size: 0.9375rem; }
    .sig-block { margin-top: 3rem; display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
    .sig-line { border-top: 1px solid #ccc; padding-top: 0.5rem; font-size: 0.875rem; }
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>
  <h1>Sponsorship Agreement</h1>
  <p class="meta">Inside Global Events (IGE) · Template agreement · Generated ${opts.signedDate}</p>

  <h2>Parties</h2>
  <p><strong>Event organiser:</strong> ${opts.organiserName}<br/>
  <strong>Sponsor:</strong> ${opts.sponsorCompany} (represented by ${opts.sponsorContact})<br/>
  <strong>Facilitator:</strong> Inside Global Events (AlexBoyo World)</p>

  <h2>Event</h2>
  <p><strong>${opts.eventName}</strong>${location ? ` · ${location}` : ""}</p>

  <h2>Commercial terms</h2>
  <ul>
    <li><strong>Sponsorship value:</strong> ${valueLine}</li>
    <li><strong>Currency:</strong> ${opts.currency}</li>
    ${opts.referralPartner ? `<li><strong>Referral attribution:</strong> ${opts.referralPartner}</li>` : ""}
    <li>Deliverables, tier assets, and activation schedule as per the event sponsorship deck and IGE proposal.</li>
    <li>IGE platform commission applies per the organiser's founding-member or standard rate schedule.</li>
  </ul>

  <h2>Standard clauses</h2>
  <ol>
    <li>Payment is due per the schedule agreed in the proposal. Late payment may pause sponsor benefits.</li>
    <li>Either party may terminate with written notice if the other materially breaches this agreement.</li>
    <li>IGE acts as facilitator and is not liable for organiser non-performance beyond its vetting obligations.</li>
    <li>This agreement is governed by the laws agreed between parties with IGE as escrow/facilitation agent where applicable.</li>
    <li>Electronic signatures and PDF copies are valid for execution (DocuSign / Yousign integration — Phase 1).</li>
  </ol>

  <div class="sig-block">
    <div>
      <div class="sig-line">Organiser signature / date</div>
    </div>
    <div>
      <div class="sig-line">Sponsor signature / date</div>
    </div>
  </div>
  <p class="meta" style="margin-top:2rem;">Print this page to PDF for your records. IGE will countersign upon contract_signed status.</p>
</body>
</html>`;
}

async function ensureAdmin(supabase: any, userId: string) {
  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (!roles?.some((r: any) => r.role === "abw_admin" || r.role === "super_admin")) {
    throw new Error("Forbidden");
  }
}

export const generateDealContract = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ deal_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensureAdmin(supabase, userId);

    const { data: deal } = await supabaseAdmin.from("deals").select("*").eq("id", data.deal_id).single();
    if (!deal) throw new Error("Deal not found");

    const [{ data: ev }, { data: cf }, { data: orgProfile }, { data: orgRole }] = await Promise.all([
      supabaseAdmin.from("events").select("name, city, country, organiser_id").eq("id", deal.event_id).single(),
      supabaseAdmin.from("commitment_forms").select("company_name, contact_name").eq("id", deal.commitment_form_id).single(),
      supabaseAdmin.from("organiser_profiles").select("org_name").eq("user_id", deal.organiser_id).maybeSingle(),
      supabaseAdmin.from("profiles").select("display_name, email").eq("id", deal.organiser_id).maybeSingle(),
    ]);

    let referralName: string | null = null;
    if (deal.referral_partner_id) {
      const { data: ref } = await supabaseAdmin
        .from("referral_partner_profiles")
        .select("full_name")
        .eq("user_id", deal.referral_partner_id)
        .maybeSingle();
      referralName = ref?.full_name ?? null;
    }

    const html = buildContractHtml({
      eventName: ev?.name ?? "Event",
      eventCity: ev?.city,
      eventCountry: ev?.country,
      organiserName: orgProfile?.org_name ?? orgRole?.display_name ?? orgRole?.email ?? "Organiser",
      sponsorCompany: cf?.company_name ?? "Sponsor",
      sponsorContact: cf?.contact_name ?? "Authorised representative",
      dealValue: deal.deal_value_native != null ? Number(deal.deal_value_native) : null,
      currency: deal.deal_currency ?? "USD",
      signedDate: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
      referralPartner: referralName,
    });

    const path = `${deal.organiser_id}/contracts/${deal.id}-agreement.html`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const { error: upErr } = await supabaseAdmin.storage
      .from("event-assets")
      .upload(path, blob, { upsert: true, contentType: "text/html" });
    if (upErr) throw new Error(upErr.message);

    const { data: urlData } = supabaseAdmin.storage.from("event-assets").getPublicUrl(path);
    const now = new Date().toISOString();

    await supabaseAdmin
      .from("deals")
      .update({
        contract_url: urlData.publicUrl,
        contract_generated_at: now,
        status: deal.status === "negotiation" || deal.status === "proposal_sent" ? "contract_sent" : deal.status,
        updated_at: now,
      } as never)
      .eq("id", deal.id);

    const notifyIds = [deal.organiser_id, deal.sponsor_user_id].filter(Boolean) as string[];
    if (notifyIds.length) {
      await supabaseAdmin.from("notifications").insert(
        notifyIds.map((uid) => ({
          user_id: uid,
          type: "contract_ready",
          title: "Sponsorship agreement ready",
          body: `Contract generated for ${ev?.name ?? "your deal"}. Download and sign.`,
          data: { deal_id: deal.id, url: urlData.publicUrl },
        })),
      );
    }

    return { url: urlData.publicUrl, status: "contract_sent" };
  });

export const getDealContractUrl = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ deal_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: deal } = await supabaseAdmin
      .from("deals")
      .select("contract_url, organiser_id, sponsor_user_id, referral_partner_id")
      .eq("id", data.deal_id)
      .single();
    if (!deal) throw new Error("Deal not found");
    const allowed = [deal.organiser_id, deal.sponsor_user_id, deal.referral_partner_id].filter(Boolean);
    const { data: roles } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId);
    const isAdmin = roles?.some((r) => r.role === "abw_admin" || r.role === "super_admin");
    if (!isAdmin && !allowed.includes(userId)) throw new Error("Forbidden");
    return { url: deal.contract_url };
  });

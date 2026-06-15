import { j as jsxRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { s as supabaseAdmin } from "./client.server-k0C2Btf0.mjs";
import { H as Html } from "../_libs/react-email__html.mjs";
import { H as Head } from "../_libs/react-email__head.mjs";
import { P as Preview } from "../_libs/react-email__preview.mjs";
import { B as Body } from "../_libs/react-email__body.mjs";
import { C as Container } from "../_libs/react-email__container.mjs";
import { S as Section } from "../_libs/react-email__section.mjs";
import { H as Heading } from "../_libs/react-email__heading.mjs";
import { T as Text } from "../_libs/react-email__text.mjs";
import { B as Button } from "../_libs/react-email__button.mjs";
import { L as Link } from "../_libs/react-email__link.mjs";
import { H as Hr } from "../_libs/react-email__hr.mjs";
import { r as render } from "../_libs/react-email__render.mjs";
const SITE_NAME$3 = "Inside Global Events 2026";
const ContactConfirmationEmail = ({ name, subject }) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Html, { lang: "en", dir: "ltr", children: [
  /* @__PURE__ */ jsxRuntimeExports.jsx(Head, {}),
  /* @__PURE__ */ jsxRuntimeExports.jsx(Preview, { children: "We received your message — IGE will be in touch shortly." }),
  /* @__PURE__ */ jsxRuntimeExports.jsx(Body, { style: main$4, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Container, { style: container$4, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Heading, { style: h1$4, children: name ? `Thanks, ${name}.` : "Thanks for reaching out." }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Text, { style: text$1, children: [
      "We've received your message",
      subject ? ` regarding "${subject}"` : "",
      " and the ",
      SITE_NAME$3,
      " team will get back to you within one business day."
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { style: text$1, children: "If your enquiry is urgent, reply to this email or call +234 903 091 5964." }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Text, { style: footer$2, children: [
      "— The ",
      SITE_NAME$3,
      " team"
    ] })
  ] }) })
] });
const template$4 = {
  component: ContactConfirmationEmail,
  subject: "We received your message",
  displayName: "Contact confirmation",
  previewData: { name: "Jane", subject: "Sponsorship enquiry" }
};
const main$4 = { backgroundColor: "#ffffff", fontFamily: "Inter, Arial, sans-serif" };
const container$4 = { padding: "32px 28px", maxWidth: "560px" };
const h1$4 = { fontSize: "22px", fontWeight: 700, color: "#0a0a0a", margin: "0 0 18px" };
const text$1 = { fontSize: "14px", color: "#3f3f46", lineHeight: "1.6", margin: "0 0 16px" };
const footer$2 = { fontSize: "12px", color: "#71717a", margin: "28px 0 0" };
const ContactInternalEmail = ({ name, email, company, subject, message }) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Html, { lang: "en", dir: "ltr", children: [
  /* @__PURE__ */ jsxRuntimeExports.jsx(Head, {}),
  /* @__PURE__ */ jsxRuntimeExports.jsxs(Preview, { children: [
    "New contact form submission",
    name ? ` from ${name}` : ""
  ] }),
  /* @__PURE__ */ jsxRuntimeExports.jsx(Body, { style: main$3, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Container, { style: container$3, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Heading, { style: h1$3, children: "New contact submission" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Text, { style: kv$1, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "Name:" }),
      " ",
      name ?? "—"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Text, { style: kv$1, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "Email:" }),
      " ",
      email ?? "—"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Text, { style: kv$1, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "Company:" }),
      " ",
      company ?? "—"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Text, { style: kv$1, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "Subject:" }),
      " ",
      subject ?? "—"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Hr, { style: hr$1 }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { style: body$1, children: message ?? "(no message)" })
  ] }) })
] });
const template$3 = {
  component: ContactInternalEmail,
  subject: (d) => `Contact form: ${d.subject ?? "New message"}`,
  displayName: "Contact form — internal",
  previewData: { name: "Jane Doe", email: "jane@brand.com", company: "Acme", subject: "Sponsorship enquiry", message: "Hi, we'd love to learn more about your events." }
};
const main$3 = { backgroundColor: "#ffffff", fontFamily: "Inter, Arial, sans-serif" };
const container$3 = { padding: "32px 28px", maxWidth: "560px" };
const h1$3 = { fontSize: "20px", fontWeight: 700, color: "#0a0a0a", margin: "0 0 18px" };
const kv$1 = { fontSize: "14px", color: "#27272a", margin: "0 0 6px" };
const body$1 = { fontSize: "14px", color: "#3f3f46", lineHeight: "1.6", whiteSpace: "pre-wrap" };
const hr$1 = { borderColor: "#e4e4e7", margin: "16px 0" };
const WaitlistInternalEmail = ({ audience, name, email, company, role, country, phone, notes }) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Html, { lang: "en", dir: "ltr", children: [
  /* @__PURE__ */ jsxRuntimeExports.jsx(Head, {}),
  /* @__PURE__ */ jsxRuntimeExports.jsxs(Preview, { children: [
    "New waitlist signup",
    name ? ` — ${name}` : ""
  ] }),
  /* @__PURE__ */ jsxRuntimeExports.jsx(Body, { style: main$2, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Container, { style: container$2, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Heading, { style: h1$2, children: "New waitlist signup" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Text, { style: kv, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "Audience:" }),
      " ",
      audience ?? "—"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Text, { style: kv, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "Name:" }),
      " ",
      name ?? "—"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Text, { style: kv, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "Email:" }),
      " ",
      email ?? "—"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Text, { style: kv, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "Company:" }),
      " ",
      company ?? "—"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Text, { style: kv, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "Role:" }),
      " ",
      role ?? "—"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Text, { style: kv, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "Country:" }),
      " ",
      country ?? "—"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Text, { style: kv, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "Phone:" }),
      " ",
      phone ?? "—"
    ] }),
    notes ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Hr, { style: hr }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { style: body, children: notes })
    ] }) : null
  ] }) })
] });
const template$2 = {
  component: WaitlistInternalEmail,
  subject: (d) => `Waitlist: ${d.audience ?? "signup"} — ${d.name ?? d.email ?? ""}`,
  displayName: "Waitlist — internal",
  previewData: { audience: "organiser", name: "Jane", email: "jane@brand.com", company: "Acme", role: "Founder", country: "Nigeria" }
};
const main$2 = { backgroundColor: "#ffffff", fontFamily: "Inter, Arial, sans-serif" };
const container$2 = { padding: "32px 28px", maxWidth: "560px" };
const h1$2 = { fontSize: "20px", fontWeight: 700, color: "#0a0a0a", margin: "0 0 18px" };
const kv = { fontSize: "14px", color: "#27272a", margin: "0 0 6px" };
const body = { fontSize: "14px", color: "#3f3f46", lineHeight: "1.6", whiteSpace: "pre-wrap" };
const hr = { borderColor: "#e4e4e7", margin: "16px 0" };
const SITE_NAME$2 = "Inside Global Events 2026";
const ROLE_COPY = {
  organiser: {
    headline: "Your organiser workspace is ready",
    bullets: [
      "Create and submit event listings through our guided flow",
      "Track vetting status and sponsor pipeline from your dashboard",
      "Message sponsors directly when commitments come in"
    ]
  },
  sponsor: {
    headline: "Your sponsor workspace is ready",
    bullets: [
      "Browse vetted B2B events on the marketplace",
      "Save shortlists and submit sponsorship commitments",
      "Message organisers to close deals faster"
    ]
  },
  referral_partner: {
    headline: "Your referral partner workspace is ready",
    bullets: [
      "Generate trackable referral links for sponsors and events",
      "Monitor deals and commission pipeline in real time",
      "Get paid when introduced deals reach payment received"
    ]
  },
  media_partner: {
    headline: "Welcome to the IGE media partner programme",
    bullets: [
      "Explore vetted events for cross-promotion opportunities",
      "Submit media partnership requests from your dashboard",
      "Our partnerships team will reach out to tailor your onboarding"
    ]
  },
  abw_admin: {
    headline: "Your IGE admin workspace is ready",
    bullets: [
      "Review event vetting queue and organiser submissions",
      "Monitor revenue, deals, and platform analytics",
      "Manage fraud controls and commission rates"
    ]
  },
  super_admin: {
    headline: "Your super admin workspace is ready",
    bullets: [
      "Full platform oversight across vetting, deals, and revenue",
      "Access admin analytics and operational controls",
      "Support organisers, sponsors, and partners at scale"
    ]
  }
};
function WelcomeEmail({
  role,
  roleLabel,
  siteUrl,
  dashboardUrl,
  messagesUrl,
  marketplaceUrl
}) {
  const copy = ROLE_COPY[role] ?? ROLE_COPY.sponsor;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Html, { lang: "en", dir: "ltr", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Head, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Preview, { children: [
      "Welcome to ",
      SITE_NAME$2,
      " — your ",
      roleLabel,
      " workspace is ready"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Body, { style: main$1, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Container, { style: container$1, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Section, { style: hero$1, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { style: eyebrow, children: "Inside Global Events 2026" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Heading, { style: h1$1, children: copy.headline }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Text, { style: lead$1, children: [
          "Thanks for joining ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: SITE_NAME$2 }),
          " as a",
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: roleLabel }),
          ". Here's what you can do next:"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Section, { style: card$1, children: copy.bullets.map((b) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Text, { style: bullet, children: [
        "✓ ",
        b
      ] }, b)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Section, { style: ctaRow$1, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { style: button$1, href: dashboardUrl, children: "Open your dashboard" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { style: text, children: role === "sponsor" || role === "organiser" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        "Explore the",
        " ",
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { href: marketplaceUrl, style: link, children: "marketplace" }),
        " ",
        "or check",
        " ",
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { href: messagesUrl, style: link, children: "messages" }),
        " ",
        "for new conversations."
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        "Visit",
        " ",
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { href: siteUrl, style: link, children: siteUrl.replace(/^https?:\/\//, "") }),
        " ",
        "anytime to pick up where you left off."
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Text, { style: footer$1, children: [
        "— The ",
        SITE_NAME$2,
        " team"
      ] })
    ] }) })
  ] });
}
const template$1 = {
  component: WelcomeEmail,
  subject: (data) => `Welcome to IGE — your ${data.roleLabel ?? "workspace"} is ready`,
  displayName: "Welcome (role-based)",
  previewData: {
    role: "sponsor",
    roleLabel: "Brand / Sponsor",
    siteUrl: "https://www.insideglobalevents.com",
    dashboardUrl: "https://www.insideglobalevents.com/dashboard",
    messagesUrl: "https://www.insideglobalevents.com/messages",
    marketplaceUrl: "https://www.insideglobalevents.com/marketplace"
  }
};
const main$1 = { backgroundColor: "#f4f0fa", fontFamily: "Inter, Arial, sans-serif" };
const container$1 = { margin: "0 auto", padding: "24px 16px", maxWidth: "560px" };
const hero$1 = {
  background: "linear-gradient(135deg, #5b2d8e 0%, #7c3aed 55%, #a855f7 100%)",
  borderRadius: "12px 12px 0 0",
  padding: "28px 24px"
};
const eyebrow = {
  margin: "0 0 8px",
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.85)"
};
const h1$1 = { margin: "0 0 12px", fontSize: "24px", fontWeight: 700, color: "#ffffff", lineHeight: 1.3 };
const lead$1 = { margin: 0, fontSize: "14px", color: "rgba(255,255,255,0.92)", lineHeight: 1.6 };
const card$1 = {
  backgroundColor: "#ffffff",
  padding: "24px",
  borderLeft: "1px solid #e4e4e7",
  borderRight: "1px solid #e4e4e7"
};
const bullet = { margin: "0 0 10px", fontSize: "14px", color: "#3f3f46", lineHeight: 1.5 };
const ctaRow$1 = {
  backgroundColor: "#ffffff",
  padding: "8px 24px 24px",
  borderRadius: "0 0 12px 12px",
  border: "1px solid #e4e4e7",
  borderTop: "none"
};
const button$1 = {
  backgroundColor: "#5b2d8e",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: 600,
  borderRadius: "8px",
  padding: "12px 24px",
  textDecoration: "none"
};
const text = { fontSize: "13px", color: "#71717a", lineHeight: 1.6, margin: "20px 0 0" };
const link = { color: "#5b2d8e", textDecoration: "underline" };
const footer$1 = { fontSize: "12px", color: "#a1a1aa", margin: "24px 0 0" };
const SITE_NAME$1 = "Inside Global Events 2026";
function NewMessageEmail({ senderName, preview, threadUrl }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Html, { lang: "en", dir: "ltr", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Head, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Preview, { children: [
      "New message from ",
      senderName,
      " on IGE"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Body, { style: main, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Container, { style: container, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Section, { style: hero, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Heading, { style: h1, children: "New message" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Text, { style: lead, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: senderName }),
          " sent you a message on ",
          SITE_NAME$1,
          "."
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Section, { style: card, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Text, { style: quote, children: [
        "“",
        preview,
        "”"
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Section, { style: ctaRow, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { style: button, href: threadUrl, children: "Reply in IGE" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { style: footer, children: "You're receiving this because you have an active IGE account. Manage notifications from your dashboard." })
    ] }) })
  ] });
}
const template = {
  component: NewMessageEmail,
  subject: (data) => `New message from ${data.senderName ?? "someone"} on IGE`,
  displayName: "New chat message",
  previewData: {
    senderName: "Acme Events",
    preview: "Hi — we'd love to discuss a title sponsorship for your Q3 conference.",
    threadUrl: "https://www.insideglobalevents.com/messages?thread=00000000-0000-0000-0000-000000000001"
  }
};
const main = { backgroundColor: "#f4f0fa", fontFamily: "Inter, Arial, sans-serif" };
const container = { margin: "0 auto", padding: "24px 16px", maxWidth: "560px" };
const hero = {
  background: "linear-gradient(135deg, #5b2d8e 0%, #7c3aed 100%)",
  borderRadius: "12px 12px 0 0",
  padding: "24px"
};
const h1 = { margin: "0 0 8px", fontSize: "22px", fontWeight: 700, color: "#fff" };
const lead = { margin: 0, fontSize: "14px", color: "rgba(255,255,255,0.9)", lineHeight: 1.5 };
const card = {
  backgroundColor: "#fff",
  padding: "20px 24px",
  borderLeft: "1px solid #e4e4e7",
  borderRight: "1px solid #e4e4e7"
};
const quote = {
  margin: 0,
  fontSize: "15px",
  color: "#3f3f46",
  lineHeight: 1.6,
  fontStyle: "italic"
};
const ctaRow = {
  backgroundColor: "#fff",
  padding: "8px 24px 24px",
  borderRadius: "0 0 12px 12px",
  border: "1px solid #e4e4e7",
  borderTop: "none"
};
const button = {
  backgroundColor: "#5b2d8e",
  color: "#fff",
  fontSize: "14px",
  fontWeight: 600,
  borderRadius: "8px",
  padding: "12px 24px",
  textDecoration: "none"
};
const footer = { fontSize: "12px", color: "#a1a1aa", margin: "20px 0 0" };
const TEMPLATES = {
  "contact-confirmation": template$4,
  "contact-internal": template$3,
  "waitlist-internal": template$2,
  welcome: template$1,
  "new-message": template
};
const SITE_NAME = "Inside Global Events 2026";
const SENDER_DOMAIN = "notify.www.insideglobalevents.com";
const FROM_DOMAIN = "notify.www.insideglobalevents.com";
function generateToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function sendTransactionalEmailServer(params) {
  const { templateName, templateData = {} } = params;
  const template2 = TEMPLATES[templateName];
  if (!template2) throw new Error(`Template '${templateName}' not found`);
  const effectiveRecipient = template2.to || params.recipientEmail;
  if (!effectiveRecipient) throw new Error("recipientEmail required");
  const normalized = effectiveRecipient.toLowerCase();
  const messageId = crypto.randomUUID();
  const idempotencyKey = params.idempotencyKey || messageId;
  const { data: suppressed } = await supabaseAdmin.from("suppressed_emails").select("id").eq("email", normalized).maybeSingle();
  if (suppressed) {
    await supabaseAdmin.from("email_send_log").insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: effectiveRecipient,
      status: "suppressed"
    });
    return { success: false, reason: "suppressed" };
  }
  let unsubscribeToken;
  const { data: existing } = await supabaseAdmin.from("email_unsubscribe_tokens").select("token, used_at").eq("email", normalized).maybeSingle();
  if (existing && !existing.used_at) {
    unsubscribeToken = existing.token;
  } else {
    unsubscribeToken = generateToken();
    await supabaseAdmin.from("email_unsubscribe_tokens").upsert({ token: unsubscribeToken, email: normalized }, { onConflict: "email", ignoreDuplicates: true });
    const { data: stored } = await supabaseAdmin.from("email_unsubscribe_tokens").select("token").eq("email", normalized).maybeSingle();
    if (stored) unsubscribeToken = stored.token;
  }
  const element = reactExports.createElement(template2.component, templateData);
  const html = await render(element);
  const text2 = await render(element, { plainText: true });
  const subject = typeof template2.subject === "function" ? template2.subject(templateData) : template2.subject;
  await supabaseAdmin.from("email_send_log").insert({
    message_id: messageId,
    template_name: templateName,
    recipient_email: effectiveRecipient,
    status: "pending"
  });
  const { error } = await supabaseAdmin.rpc("enqueue_email", {
    queue_name: "transactional_emails",
    payload: {
      message_id: messageId,
      to: effectiveRecipient,
      from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
      sender_domain: SENDER_DOMAIN,
      subject,
      html,
      text: text2,
      purpose: "transactional",
      label: templateName,
      idempotency_key: idempotencyKey,
      unsubscribe_token: unsubscribeToken,
      queued_at: (/* @__PURE__ */ new Date()).toISOString()
    }
  });
  if (error) {
    await supabaseAdmin.from("email_send_log").insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: effectiveRecipient,
      status: "failed",
      error_message: error.message
    });
    throw new Error(`Failed to enqueue: ${error.message}`);
  }
  return { success: true, messageId };
}
const DEFAULT_SITE_URL = "https://www.insideglobalevents.com";
function getSiteUrl() {
  if (typeof window !== "undefined") {
    return DEFAULT_SITE_URL;
  }
  const fromEnv = process.env.SITE_URL || process.env.VITE_SITE_URL;
  return (fromEnv || DEFAULT_SITE_URL).replace(/\/$/, "");
}
function normalizeAuthRedirectUrl(url) {
  const siteUrl = getSiteUrl();
  try {
    const parsed = new URL(url);
    const site = new URL(siteUrl);
    if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
      parsed.protocol = site.protocol;
      parsed.host = site.host;
      return parsed.toString();
    }
  } catch {
  }
  return url;
}
export {
  TEMPLATES as T,
  getSiteUrl as g,
  normalizeAuthRedirectUrl as n,
  sendTransactionalEmailServer as s
};

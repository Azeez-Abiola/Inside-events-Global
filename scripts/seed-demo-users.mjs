// Seed demo accounts (one per role) into Supabase via the REST/Auth admin APIs.
// Uses plain fetch (no SDK) to avoid Node 20 websocket issues.
// Run:  set -a; source .env; set +a; node scripts/seed-demo-users.mjs
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env");
  process.exit(1);
}

const authHeaders = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
const restHeaders = { ...authHeaders };

const PASSWORD = "IgeDemo2026!";
const ACCOUNTS = [
  { email: "organiser@ige.test", role: "organiser" },
  { email: "sponsor@ige.test", role: "sponsor" },
  { email: "partner@ige.test", role: "referral_partner" },
  { email: "media@ige.test", role: "media_partner" },
  { email: "admin@ige.test", role: "abw_admin" },
  { email: "super@ige.test", role: "super_admin" },
];

async function createUser(email, role) {
  const res = await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ email, password: PASSWORD, email_confirm: true, user_metadata: { role } }),
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

async function findUserId(email) {
  const res = await fetch(`${url}/auth/v1/admin/users?per_page=500`, { headers: authHeaders });
  const body = await res.json().catch(() => ({}));
  const users = Array.isArray(body) ? body : body.users ?? [];
  return users.find((u) => u.email === email)?.id ?? null;
}

async function updateUser(id) {
  await fetch(`${url}/auth/v1/admin/users/${id}`, {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({ password: PASSWORD, email_confirm: true }),
  });
}

async function rest(method, path, body, extraHeaders = {}) {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers: { ...restHeaders, Prefer: "resolution=merge-duplicates,return=minimal", ...extraHeaders },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok && res.status !== 404) {
    const t = await res.text().catch(() => "");
    console.error(`  ${method} ${path} -> ${res.status} ${t.slice(0, 160)}`);
  }
}

for (const acc of ACCOUNTS) {
  let id;
  const created = await createUser(acc.email, acc.role);
  if (created.ok) {
    id = created.body.id;
    console.log("+ created:", acc.email);
  } else {
    id = await findUserId(acc.email);
    if (!id) {
      console.error("! could not create or find", acc.email, JSON.stringify(created.body).slice(0, 160));
      continue;
    }
    await updateUser(id);
    console.log("· exists, reset:", acc.email);
  }

  await rest("POST", "profiles?on_conflict=id", { id, email: acc.email, email_domain: "ige.test" });
  await rest("DELETE", `user_roles?user_id=eq.${id}`);
  await rest("POST", "user_roles", { user_id: id, role: acc.role });

  if (acc.role === "organiser")
    await rest("POST", "organiser_profiles?on_conflict=user_id", { user_id: id, org_name: "Demo Organiser Co." });
  else if (acc.role === "sponsor")
    await rest("POST", "sponsor_profiles?on_conflict=user_id", { user_id: id, brand_name: "Demo Brand Ltd." });
  else if (acc.role === "referral_partner")
    await rest("POST", "referral_partner_profiles?on_conflict=user_id", { user_id: id, full_name: "Demo Partner" });
}

console.log("\nDone. Password for all demo accounts: " + PASSWORD);

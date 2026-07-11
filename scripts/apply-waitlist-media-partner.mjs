import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function loadEnvFile() {
  const envPath = join(root, ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    const val = trimmed.slice(eq + 1).replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile();

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dbUrl = process.env.DATABASE_URL;
const migrationPath = join(
  root,
  "supabase/migrations/20260710000000_waitlist_media_partner.sql",
);
const sql = readFileSync(migrationPath, "utf8");

async function mediaPartnerAllowed() {
  if (!url || !key) return false;
  const testEmail = `migration-check-${Date.now()}@ige.test`;
  const res = await fetch(`${url}/rest/v1/waitlist_signups`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      audience: "media_partner",
      full_name: "Migration Check",
      email: testEmail,
      consent_given: true,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    if (body.includes("waitlist_signups_audience_check")) return false;
    throw new Error(`Preflight insert failed (${res.status}): ${body}`);
  }
  const rows = await res.json();
  const id = rows?.[0]?.id;
  if (id) {
    await fetch(`${url}/rest/v1/waitlist_signups?id=eq.${id}`, {
      method: "DELETE",
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
  }
  return true;
}

async function applyViaPg() {
  const { default: pg } = await import("pg");
  const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(sql);
    console.log("✓ waitlist media_partner migration applied via DATABASE_URL");
  } finally {
    await client.end();
  }
}

async function main() {
  if (await mediaPartnerAllowed()) {
    console.log("✓ media_partner audience already allowed on waitlist_signups");
    return;
  }

  if (!dbUrl) {
    const projectRef = process.env.SUPABASE_PROJECT_ID || url?.match(/https:\/\/([^.]+)/)?.[1];
    console.error(`
Cannot apply DDL without a direct Postgres connection.

Your .env has SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (API access), but schema
changes need DATABASE_URL (Postgres URI with the database password).

Quick fix:
  1. Find your database password in the original Supabase project email, or reset it at
     https://supabase.com/dashboard/project/${projectRef}/settings/database
     (use "Forgot password" on supabase.com if you cannot sign in).
  2. In Supabase → Settings → Database → Connection string → URI, copy the string and add to .env:
     DATABASE_URL=postgresql://postgres.[ref]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
  3. Re-run: npm run db:waitlist-media-partner

SQL to apply manually in the SQL editor:
${sql}
`);
    process.exit(1);
  }

  await applyViaPg();

  if (!(await mediaPartnerAllowed())) {
    throw new Error("Migration ran but media_partner inserts still fail — verify SQL output.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

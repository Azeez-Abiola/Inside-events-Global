// Apply every migration added after the CRM / calendar / activations work, in
// order, skipping any already in place. Safe to re-run: each migration is
// written with IF NOT EXISTS / DROP … IF EXISTS.
//
// Run:  npm run db:pending
// Needs SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env, and DATABASE_URL to
// apply automatically. Without DATABASE_URL it prints the files to paste into
// the Supabase SQL editor, in order.
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// [migration, a table or column that proves it ran (table?select=column)]
const MIGRATIONS = [
  ["20261011100000_vendors_payments.sql", "workspace_payments?select=id"],
  ["20261011110000_admin_inbox.sql", "admin_inbox_threads?select=id"],
  ["20261011120000_event_share_links.sql", "event_share_links?select=id"],
  ["20261011130000_budget_tags.sql", "market_budgets?select=sector_tags"],
  ["20261011140000_fundraising_tracker.sql", "event_funding_targets?select=id"],
  ["20261011150000_brand_readiness.sql", "readiness_scores?select=id"],
  ["20261011160000_matchmaking_engine.sql", "match_scores?select=id"],
  ["20261011170000_creative_productions.sql", "productions?select=id"],
  ["20261011180000_public_site.sql", "upcoming_home_events?select=id"],
  ["20261011190000_deliverable_matrix.sql", "deliverable_items?select=id"],
  ["20261011200000_roo_engine.sql", "sector_packs?select=id"],
  ["20261011210000_admin_governance.sql", "dual_control_requests?select=id"],
  ["20261011220000_account_settings.sql", "workspace_payment_details?select=workspace_id"],
  ["20261011230000_prefs_help_lifecycle.sql", "help_feedback?select=id"],
];

function loadEnvFile() {
  const envPath = join(root, ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq);
    const v = t.slice(eq + 1).replace(/^["']|["']$/g, "");
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnvFile();
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dbUrl = process.env.DATABASE_URL;
if (!url || !key) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env (see .env.example).");
  process.exit(1);
}

async function applied(probe) {
  const r = await fetch(`${url}/rest/v1/${probe}&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  return r.ok;
}

const pending = [];
for (const [file, probe] of MIGRATIONS) {
  if (await applied(probe)) console.log(`✓ ${file} already in place`);
  else pending.push(file);
}
if (!pending.length) {
  console.log("\nEverything is applied.");
  process.exit(0);
}

if (dbUrl) {
  const { default: pg } = await import("pg");
  const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    for (const file of pending) {
      await client.query(readFileSync(join(root, "supabase/migrations", file), "utf8"));
      console.log(`✓ ${file} applied`);
    }
    // PostgREST caches the schema; ask it to reload so the app sees new tables.
    await client.query("NOTIFY pgrst, 'reload schema'");
  } finally {
    await client.end();
  }
  console.log("\nDone.");
} else {
  const ref = process.env.SUPABASE_PROJECT_ID || url.match(/https:\/\/([^.]+)/)?.[1];
  console.log(`
${pending.length} migration(s) still to apply. Either add DATABASE_URL to .env and
re-run \`npm run db:pending\`, or open

  https://supabase.com/dashboard/project/${ref}/sql/new

and paste and run each of these, in this order:
${pending.map((f) => `  supabase/migrations/${f}`).join("\n")}

Supabase may warn "creates tables without RLS" on some of them. That is a false
positive — RLS is enabled inside DO blocks the linter cannot read. Choose
"Run without RLS".
`);
  process.exit(1);
}

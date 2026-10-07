// Apply the Event Calendar schema (Version 1.1 Section B).
//   20261007100000_event_calendar.sql
// Run:  npm run db:calendar
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const MIGRATION = "supabase/migrations/20261007100000_event_calendar.sql";

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
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

async function applied() {
  const r = await fetch(`${url}/rest/v1/calendar_entries?select=id&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  return r.ok || r.status === 401 || r.status === 403;
}

if (await applied()) {
  console.log("✓ Event Calendar schema already in place");
} else if (dbUrl) {
  const { default: pg } = await import("pg");
  const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(readFileSync(join(root, MIGRATION), "utf8"));
    console.log(`✓ ${MIGRATION} applied`);
  } finally {
    await client.end();
  }
} else {
  const ref = process.env.SUPABASE_PROJECT_ID || url.match(/https:\/\/([^.]+)/)?.[1];
  console.log(`
Event Calendar schema is NOT set up yet. /dashboard/calendar will error until it is.

  1. Open https://supabase.com/dashboard/project/${ref}/sql/new
  2. Paste and run:
       ${MIGRATION}

Supabase's linter will flag "creates tables without RLS" — that is a false
positive. RLS is enabled inside a DO block via EXECUTE, which the linter
cannot read through. Choose "Run without RLS"; the script enables it itself.
Choosing "Run and enable RLS" may add a permissive catch-all policy that
would let Manager and Viewer seats write data they should only read.

Or add DATABASE_URL to .env and re-run:  npm run db:calendar
`);
  process.exit(1);
}

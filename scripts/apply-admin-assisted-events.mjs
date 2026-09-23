// Apply the admin-assisted event listings migration.
// Adds events.created_by_admin and profiles.invite_sent_at.
// Run:  npm run db:admin-assisted-events
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const MIGRATION = "supabase/migrations/20260918120000_admin_assisted_events.sql";

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

if (!url || !key) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

/** Both columns must exist before the assist flow can read or write them. */
async function columnsExist() {
  const headers = { apikey: key, Authorization: `Bearer ${key}` };
  const [events, profiles] = await Promise.all([
    fetch(`${url}/rest/v1/events?select=created_by_admin&limit=1`, { headers }),
    fetch(`${url}/rest/v1/profiles?select=invite_sent_at&limit=1`, { headers }),
  ]);
  return events.ok && profiles.ok;
}

async function applyViaPg() {
  const { default: pg } = await import("pg");
  const sql = readFileSync(join(root, MIGRATION), "utf8");
  const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(sql);
    console.log("✓ admin-assisted events migration applied via DATABASE_URL");
  } finally {
    await client.end();
  }
}

async function main() {
  if (await columnsExist()) {
    console.log("✓ created_by_admin and invite_sent_at already exist");
    return;
  }

  if (dbUrl) {
    await applyViaPg();
    if (await columnsExist()) return;
  }

  const projectRef = process.env.SUPABASE_PROJECT_ID || url.match(/https:\/\/([^.]+)/)?.[1];
  console.log(`
Admin-assisted event columns are MISSING — creating a listing for an organiser will fail.

Option A — Supabase Dashboard (recommended)
  1. Open https://supabase.com/dashboard/project/${projectRef}/sql/new
  2. Paste the contents of:
     ${MIGRATION}
  3. Click Run

Option B — CLI with database password
  Add DATABASE_URL to .env (Settings → Database → Connection string → URI)
  Then run:  npm run db:admin-assisted-events

After applying, re-run \`supabase gen types\` so the generated types pick up the
new columns and the adb() casts in src/lib/admin-events.functions.ts can go.
`);
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

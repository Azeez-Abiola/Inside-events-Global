// Apply the short-verification-code migration.
//   20261006100000_email_otp_aliases.sql
// Run:  npm run db:short-otp
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const MIGRATION = "supabase/migrations/20261006100000_email_otp_aliases.sql";

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

async function tableExists() {
  const r = await fetch(`${url}/rest/v1/email_otp_aliases?select=id&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  // 401/403 means it exists but is correctly locked away from this key's role.
  return r.ok || r.status === 401 || r.status === 403;
}

async function main() {
  if (await tableExists()) {
    console.log("✓ short verification codes already set up");
    return;
  }

  if (dbUrl) {
    const { default: pg } = await import("pg");
    const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
    await client.connect();
    try {
      await client.query(readFileSync(join(root, MIGRATION), "utf8"));
      console.log(`  ✓ ${MIGRATION}`);
    } finally {
      await client.end();
    }
    if (await tableExists()) return;
  }

  const projectRef = process.env.SUPABASE_PROJECT_ID || url.match(/https:\/\/([^.]+)/)?.[1];
  console.log(`
Short verification codes are NOT set up yet.

Until this migration runs, signup emails still carry Supabase's own 8-digit
code while the screen asks for 4 — so nobody can verify. Apply it before
testing signup.

  1. Open https://supabase.com/dashboard/project/${projectRef}/sql/new
  2. Paste and run:
       ${MIGRATION}

Or add DATABASE_URL to .env and re-run:  npm run db:short-otp
`);
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

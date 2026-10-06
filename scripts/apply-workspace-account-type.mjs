// Make new workspaces honour the account type chosen at signup, and backfill
// the accounts that already said Organisation.
//   20261006120000_workspace_account_type.sql
// Run:  npm run db:workspace-account-type
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const MIGRATION = "supabase/migrations/20261006120000_workspace_account_type.sql";

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

if (dbUrl) {
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
  const projectRef = process.env.SUPABASE_PROJECT_ID || url.match(/https:\/\/([^.]+)/)?.[1];
  console.log(`
This migration replaces a function, so it has no "already applied" check —
running it twice is harmless.

  1. Open https://supabase.com/dashboard/project/${projectRef}/sql/new
  2. Paste and run:
       ${MIGRATION}

Or add DATABASE_URL to .env and re-run:  npm run db:workspace-account-type
`);
}

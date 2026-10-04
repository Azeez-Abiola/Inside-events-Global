// Apply the progressive onboarding migration.
// Adds section_status, verification_status, profiles.onboarding_status and the
// onboarding_section_config table.
// Run:  npm run db:progressive-onboarding
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const MIGRATION = "supabase/migrations/20260930120000_progressive_onboarding.sql";

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

/** Every piece must exist before the wizard can tell compulsory from deferrable. */
async function columnsExist() {
  const headers = { apikey: key, Authorization: `Bearer ${key}` };
  const [apps, profiles, config] = await Promise.all([
    fetch(`${url}/rest/v1/onboarding_applications?select=section_status&limit=1`, { headers }),
    fetch(`${url}/rest/v1/profiles?select=onboarding_status&limit=1`, { headers }),
    fetch(`${url}/rest/v1/onboarding_section_config?select=role&limit=1`, { headers }),
  ]);
  return apps.ok && profiles.ok && config.ok;
}

async function applyViaPg() {
  const { default: pg } = await import("pg");
  const sql = readFileSync(join(root, MIGRATION), "utf8");
  const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(sql);
    console.log("✓ progressive onboarding migration applied via DATABASE_URL");
  } finally {
    await client.end();
  }
}

async function main() {
  if (await columnsExist()) {
    console.log("✓ progressive onboarding schema already in place");
    return;
  }

  if (dbUrl) {
    await applyViaPg();
    if (await columnsExist()) return;
  }

  const projectRef = process.env.SUPABASE_PROJECT_ID || url.match(/https:\/\/([^.]+)/)?.[1];
  console.log(`
Progressive onboarding schema is MISSING — the wizard cannot tell compulsory from deferrable sections.

Option A — Supabase Dashboard (recommended)
  1. Open https://supabase.com/dashboard/project/${projectRef}/sql/new
  2. Paste the contents of:
     ${MIGRATION}
  3. Click Run

Option B — CLI with database password
  Add DATABASE_URL to .env (Settings → Database → Connection string → URI)
  Then run:  npm run db:progressive-onboarding

After applying, re-run \`supabase gen types\` so the generated types pick up the
new columns and the odb() casts in src/lib/onboarding.functions.ts can go.
`);
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

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

if (!url || !key) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

async function tableExists() {
  const res = await fetch(`${url}/rest/v1/media_requests?select=id&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (res.status === 404) return false;
  return res.ok;
}

async function applyViaPg() {
  const { default: pg } = await import("pg");
  const sql = readFileSync(
    join(__dirname, "../supabase/migrations/20260615120000_media_requests.sql"),
    "utf8",
  );
  const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(sql);
    console.log("✓ media_requests migration applied via DATABASE_URL");
  } finally {
    await client.end();
  }
}

async function main() {
  if (await tableExists()) {
    console.log("✓ media_requests table already exists");
    return;
  }

  if (dbUrl) {
    await applyViaPg();
    if (await tableExists()) return;
  }

  const projectRef = process.env.SUPABASE_PROJECT_ID || url.match(/https:\/\/([^.]+)/)?.[1];
  console.log(`
media_requests table is MISSING — coverage requests cannot be saved.

Option A — Supabase Dashboard (recommended)
  1. Open https://supabase.com/dashboard/project/${projectRef}/sql/new
  2. Paste the contents of:
     supabase/migrations/20260615120000_media_requests.sql
  3. Click Run

Option B — CLI with database password
  Add DATABASE_URL to .env (Settings → Database → Connection string → URI)
  Then run:  npm run db:media-requests
`);
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

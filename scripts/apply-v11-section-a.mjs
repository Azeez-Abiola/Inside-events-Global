// Apply the Version 1.1 Section A migrations in order.
//
//   20261004090000_glossary_tips.sql       info-tip glossary (TAB 3 §3.2)
//   20261004091000_event_type_taxonomy.sql legacy event types -> the 37 (Appendix B)
//   20261004092000_event_visibility.sql    private/published + Looking to connect with
//   20261004093000_new_roles.sql           partnerships_pro + creative_hub on app_role
//   20261004100000_workspace_layer.sql     workspaces, seats and the Manager role
//
// Run:  npm run db:v11-section-a
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const MIGRATIONS = [
  "supabase/migrations/20261004090000_glossary_tips.sql",
  "supabase/migrations/20261004091000_event_type_taxonomy.sql",
  "supabase/migrations/20261004092000_event_visibility.sql",
  "supabase/migrations/20261004093000_new_roles.sql",
  "supabase/migrations/20261004100000_workspace_layer.sql",
];

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

async function schemaInPlace() {
  const headers = { apikey: key, Authorization: `Bearer ${key}` };
  const [glossary, visibility, workspaces] = await Promise.all([
    fetch(`${url}/rest/v1/glossary_tips?select=tip_key&limit=1`, { headers }),
    fetch(`${url}/rest/v1/events?select=visibility,looking_to_connect_with&limit=1`, { headers }),
    fetch(`${url}/rest/v1/workspace_members?select=role&limit=1`, { headers }),
  ]);
  return glossary.ok && visibility.ok && workspaces.ok;
}

async function applyViaPg() {
  const { default: pg } = await import("pg");
  const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    for (const migration of MIGRATIONS) {
      // Each migration runs in its own statement batch: ALTER TYPE ADD VALUE
      // must not share a transaction with anything that uses the new value.
      await client.query(readFileSync(join(root, migration), "utf8"));
      console.log(`  ✓ ${migration}`);
    }
    console.log("✓ Version 1.1 Section A migrations applied via DATABASE_URL");
  } finally {
    await client.end();
  }
}

async function main() {
  if (await schemaInPlace()) {
    console.log("✓ Version 1.1 Section A schema already in place");
    return;
  }

  if (dbUrl) {
    await applyViaPg();
    if (await schemaInPlace()) return;
  }

  const projectRef = process.env.SUPABASE_PROJECT_ID || url.match(/https:\/\/([^.]+)/)?.[1];
  console.log(`
Version 1.1 Section A schema is MISSING. Without it: no info tips, no event
visibility, no workspaces or team seats, and the Partnerships Pro / Creative
Hub roles cannot be assigned.

Option A — Supabase Dashboard (recommended)
  Open https://supabase.com/dashboard/project/${projectRef}/sql/new
  Paste and Run each of these, in this order:
${MIGRATIONS.map((m) => `    ${m}`).join("\n")}

Option B — CLI with database password
  Add DATABASE_URL to .env (Settings -> Database -> Connection string -> URI)
  Then run:  npm run db:v11-section-a

The event-type migration prints a NOTICE for any listing whose type has no
honest home in the 37 (the taxonomy has no sports type). Reclassify those in
Admin rather than leaving them to show blank in the editor.

The workspace migration backfills an Individual workspace for every existing
account, so it is safe to re-run but slow in proportion to the user table.

After applying, re-run \`supabase gen types\` so the generated types pick up the
new columns and the odb()/adb()/gdb() casts can go.
`);
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

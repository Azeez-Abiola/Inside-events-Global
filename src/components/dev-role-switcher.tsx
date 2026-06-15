import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  AppRole,
  DEV_AUTH_ENABLED,
  ROLE_LABELS,
  getDevRoles,
  onDevRolesChange,
  setDevRoles,
} from "@/lib/dev-auth";

const ROLE_ORDER: AppRole[] = [
  "organiser",
  "sponsor",
  "referral_partner",
  "media_partner",
  "abw_admin",
  "super_admin",
];

// Where each role naturally lands, so clicking it drops you somewhere useful.
const ROLE_HOME: Record<AppRole, string> = {
  organiser: "/dashboard",
  sponsor: "/dashboard",
  referral_partner: "/dashboard",
  media_partner: "/dashboard",
  abw_admin: "/dashboard",
  super_admin: "/dashboard",
};

/**
 * DEV-ONLY floating panel to impersonate any role without a backend.
 * Renders nothing in production builds.
 */
export function DevRoleSwitcher() {
  if (!DEV_AUTH_ENABLED) return null;
  return <Panel />;
}

function Panel() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<AppRole[] | null>(null);

  useEffect(() => {
    const sync = () => setActive(getDevRoles());
    sync();
    return onDevRolesChange(sync);
  }, []);

  function impersonate(role: AppRole) {
    setDevRoles([role]);
    navigate({ to: ROLE_HOME[role] });
  }

  function exit() {
    setDevRoles(null);
    navigate({ to: "/welcome" });
  }

  const current = active?.[0] ?? null;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{ position: "fixed", right: 16, bottom: 16, zIndex: 9999 }}
        className="rounded-full bg-foreground px-3 py-2 text-xs font-semibold text-background shadow-lg hover:opacity-90"
      >
        {current ? `DEV · ${ROLE_LABELS[current]}` : "DEV · pick role"}
      </button>
    );
  }

  return (
    <div
      style={{ position: "fixed", right: 16, bottom: 16, zIndex: 9999, width: 230 }}
      className="rounded-xl border border-border bg-card p-3 shadow-2xl"
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Dev role switcher
        </span>
        <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
          ✕
        </button>
      </div>

      <div className="grid gap-1.5">
        {ROLE_ORDER.map((role) => {
          const isActive = current === role;
          return (
            <button
              key={role}
              onClick={() => impersonate(role)}
              className={`flex items-center justify-between rounded-md px-2.5 py-1.5 text-left text-sm transition-colors ${
                isActive
                  ? "bg-brand-gradient text-white"
                  : "bg-muted text-foreground hover:bg-muted/70"
              }`}
            >
              {ROLE_LABELS[role]}
              {isActive && <span className="text-[10px] font-bold">ACTIVE</span>}
            </button>
          );
        })}
      </div>

      <button
        onClick={exit}
        className="mt-2.5 w-full rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
      >
        Exit dev mode
      </button>
      <p className="mt-2 text-[10px] leading-snug text-muted-foreground">
        Impersonates roles client-side. Lists that hit the database stay empty until the
        service key is set.
      </p>
    </div>
  );
}

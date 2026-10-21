/**
 * Multi-role accounts: the sidebar control that shows which role's dashboard
 * is open, switches between the account's roles, and adds a new one. Adding
 * a role lands on that role's dashboard, where the setup panel collects its
 * own onboarding sections (Section A pre-filled from the other roles).
 */
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Check, ChevronsUpDown, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import { getDevRoles, setDevRoles } from "@/lib/dev-auth";
import { useActiveRole } from "@/hooks/use-active-role";
import { ensureSignupRole } from "@/lib/signup.functions";
import { getSignupRoleMeta, SIGNUP_ROLES, type SignupRole } from "@/lib/signup-roles";
import { cn } from "@/lib/utils";

export function RoleSwitcher({ rail = false }: { rail?: boolean }) {
  const { refreshRoles, isDevImpersonating } = useAuth();
  const { activeRole, heldRoles, setActiveRole } = useActiveRole();
  const addRole = useServerFn(ensureSignupRole);
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState<SignupRole | null>(null);

  // Staff-only accounts have no user dashboard to switch.
  if (!activeRole) return null;
  const active = getSignupRoleMeta(activeRole);
  const available = SIGNUP_ROLES.filter((r) => !heldRoles.includes(r.key));

  async function switchTo(role: SignupRole) {
    if (role === activeRole) return;
    setBusy(role);
    try {
      await setActiveRole(role);
      navigate({ to: "/dashboard" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not switch dashboard");
    } finally {
      setBusy(null);
    }
  }

  async function add(role: SignupRole) {
    setBusy(role);
    try {
      if (isDevImpersonating) setDevRoles([...(getDevRoles() ?? []), role]);
      else await addRole({ data: { role, makeActive: true } });
      await refreshRoles();
      await setActiveRole(role);
      setAdding(false);
      toast.success(
        `${getSignupRoleMeta(role).title} added. Finish its setup on your dashboard to unlock it.`,
      );
      navigate({ to: "/dashboard" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add that role");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            title={rail ? `Viewing as ${active.title}` : undefined}
            aria-label={`Viewing as ${active.title}. Switch dashboard`}
            className={cn(
              "flex items-center gap-2.5 rounded-xl border border-border/60 bg-card text-left transition-colors hover:bg-muted/60 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.08]",
              rail ? "mx-auto h-11 w-11 justify-center" : "w-full px-3 py-2.5",
            )}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-white/10 dark:text-white">
              <active.icon className="h-4 w-4" />
            </span>
            {!rail && (
              <>
                <span className="min-w-0 flex-1">
                  <span className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Viewing as
                  </span>
                  <span className="block truncate text-[13px] font-semibold text-foreground">
                    {active.title}
                  </span>
                </span>
                <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              </>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side={rail ? "right" : "bottom"} className="w-64">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Your dashboards
          </DropdownMenuLabel>
          {heldRoles.map((key) => {
            const r = getSignupRoleMeta(key);
            return (
              <DropdownMenuItem
                key={key}
                onSelect={() => void switchTo(key)}
                className="flex items-center gap-2.5 py-2"
              >
                <r.icon className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1 text-sm">{r.title}</span>
                {busy === key ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : key === activeRole ? (
                  <Check className="h-4 w-4 text-primary" />
                ) : null}
              </DropdownMenuItem>
            );
          })}
          {available.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => setAdding(true)}
                className="flex items-center gap-2.5 py-2 font-medium text-primary"
              >
                <Plus className="h-4 w-4" /> Add a role
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add a role to your account</DialogTitle>
            <DialogDescription>
              Use one account for everything you do on IGE. Each role gets its own dashboard, and
              you switch between them from the sidebar. The new role has its own short setup; your
              name, email and company carry over.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            {available.map((r) => (
              <button
                key={r.key}
                type="button"
                disabled={busy !== null}
                onClick={() => void add(r.key)}
                className="flex items-start gap-3 rounded-xl border border-border p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/5 disabled:opacity-60"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {busy === r.key ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <r.icon className="h-4 w-4" />
                  )}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-foreground">{r.title}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{r.tagline}</span>
                </span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

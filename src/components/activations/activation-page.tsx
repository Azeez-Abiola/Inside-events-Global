import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { WorkspacePage } from "@/components/dashboards/workspace-page";
import { DashboardPanel } from "@/components/dashboards/dashboard-shell";
import { Button } from "@/components/ui/button";
import { InfoTip } from "@/components/info-tip";
import { ActivationBoard, type ActivationView } from "@/components/activations/activation-board";
import { ActivationDrawer } from "@/components/activations/activation-drawer";
import { getActivations, setActivationStatus, type Activation } from "@/lib/activations.functions";
import { can, type WorkspaceRole } from "@/lib/workspace-permissions";

/**
 * Activation Task Tracker (TAB 4, Module 4A).
 *
 * Available to Brand / Sponsor, Event Organiser, Partnerships Pro and Creative
 * Hub accounts. An activation can be linked to an event or a deal, or stand
 * alone.
 */
export function ActivationPage() {
  const qc = useQueryClient();
  const fetchAll = useServerFn(getActivations);
  const move = useServerFn(setActivationStatus);

  const [view, setView] = useState<ActivationView>("board");
  const [open, setOpen] = useState<Activation | null>(null);
  const [creating, setCreating] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["activations"],
    queryFn: () => fetchAll(),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["activations"] });

  const moveMutation = useMutation({
    mutationFn: (v: { id: string; status: string }) =>
      move({
        data: { id: v.id, status: v.status as "not_started" | "in_progress" | "blocked" | "done" },
      }),
    onSuccess: refresh,
    onError: (e: Error) => toast.error(e.message),
  });

  const myRole = (data?.myRole ?? null) as WorkspaceRole | null;
  const editable = can(myRole, "workspace.edit");
  const activations = data?.activations ?? [];

  if (isLoading) {
    return (
      <WorkspacePage title="Activations">
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </WorkspacePage>
    );
  }

  return (
    <WorkspacePage
      title="Activations"
      subtitle="Project-manage every activation — who owns it, what it costs, and what proof came back."
      action={
        editable ? (
          <Button onClick={() => setCreating(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New activation
          </Button>
        ) : undefined
      }
    >
      {myRole === "manager" && (
        <p className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
          Your seat is Manager — read-only oversight. You can follow every activation here but
          cannot change one.
        </p>
      )}

      <DashboardPanel
        title="Activation tracker"
        description="Board, timeline and table views of the same work."
        action={
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {(["board", "timeline", "table"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                    view === v
                      ? "bg-brand-soft text-primary-deep"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
            <InfoTip tip="activation.tracker" />
          </div>
        }
        bodyClassName="p-0"
      >
        {activations.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-muted-foreground">
            No activations yet. Add one for a sampling run, a booth, a stage moment — anything you
            need to deliver and prove.
          </p>
        ) : (
          <ActivationBoard
            view={view}
            activations={activations}
            milestones={data?.milestones ?? []}
            team={data?.team ?? []}
            editable={editable}
            onMove={(id, status) => moveMutation.mutate({ id, status })}
            onOpen={setOpen}
          />
        )}
      </DashboardPanel>

      {(open || creating) && (
        <ActivationDrawer
          activation={open}
          milestones={(data?.milestones ?? []).filter((m) => m.activation_id === open?.id)}
          team={data?.team ?? []}
          editable={editable}
          onClose={() => {
            setOpen(null);
            setCreating(false);
          }}
          onSaved={() => {
            refresh();
            setOpen(null);
            setCreating(false);
          }}
        />
      )}
    </WorkspacePage>
  );
}

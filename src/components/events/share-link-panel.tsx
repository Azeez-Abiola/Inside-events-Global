import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Copy, Eye, Link2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InfoTip } from "@/components/info-tip";
import { getShareLink, saveShareLink } from "@/lib/share-links.functions";

/**
 * The owner's controls for a private event's view-only link (TAB 4 §4.4.5):
 * create it, switch it off, set an expiry, see how often it was opened.
 */
export function ShareLinkPanel({ eventId }: { eventId: string }) {
  const qc = useQueryClient();
  const fetchLink = useServerFn(getShareLink);
  const save = useServerFn(saveShareLink);
  const key = ["share-link", eventId];

  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: () => fetchLink({ data: { event_id: eventId } }),
  });
  const link = data?.link ?? null;
  const [expiry, setExpiry] = useState<string | null>(null);
  const expiresOn = expiry ?? (link?.expires_at ? link.expires_at.slice(0, 10) : "");

  const mutation = useMutation({
    mutationFn: (v: { enabled: boolean; regenerate?: boolean; expires?: string }) =>
      save({
        data: {
          event_id: eventId,
          enabled: v.enabled,
          regenerate: v.regenerate,
          // End of the chosen day, so "expires on the 30th" includes the 30th.
          expires_at: (v.expires ?? expiresOn) ? `${v.expires ?? expiresOn}T23:59:59Z` : null,
        },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    onError: (e: Error) => toast.error(e.message),
  });

  const url =
    link && typeof window !== "undefined" ? `${window.location.origin}/share/${link.token}` : "";
  const expired = link?.expires_at ? new Date(link.expires_at).getTime() < Date.now() : false;

  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4">
      <h4 className="flex items-center text-sm font-semibold text-foreground">
        <Link2 className="mr-1.5 h-4 w-4 text-muted-foreground" />
        Private share link
        <InfoTip tip="field.private_share_link" />
      </h4>
      <p className="mt-1 text-xs text-muted-foreground">
        A view-only summary you can send to sponsors or partners. Anyone with the link sees the
        summary; to see more or express interest they sign in, and IGE handles it from there.
      </p>

      {isLoading ? null : !link ? (
        <Button
          size="sm"
          variant="outline"
          className="mt-3"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate({ enabled: true })}
        >
          Create a share link
        </Button>
      ) : (
        <div className="mt-3 space-y-3">
          <div className="flex gap-2">
            <input
              readOnly
              value={url}
              aria-label="Share link"
              className={`min-w-0 flex-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs ${link.enabled && !expired ? "" : "text-muted-foreground line-through"}`}
            />
            <Button
              size="sm"
              variant="outline"
              disabled={!link.enabled || expired}
              onClick={() =>
                navigator.clipboard
                  .writeText(url)
                  .then(() => toast.success("Link copied"))
                  .catch(() => toast.error("Could not copy — select the link and copy it."))
              }
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={link.enabled}
                onChange={(e) => mutation.mutate({ enabled: e.target.checked })}
              />
              Link is on
            </label>
            <label className="flex items-center gap-2">
              Expires
              <input
                type="date"
                value={expiresOn}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => {
                  setExpiry(e.target.value);
                  mutation.mutate({ enabled: link.enabled, expires: e.target.value });
                }}
                className="rounded-md border border-border bg-background px-2 py-1"
              />
            </label>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Eye className="h-3.5 w-3.5" />
              Opened {link.view_count} time{link.view_count === 1 ? "" : "s"}
            </span>
          </div>
          {expired && <p className="text-xs text-destructive">This link has expired.</p>}

          <button
            type="button"
            onClick={() => {
              if (confirm("Make a new link? The old one stops working for everyone who has it.")) {
                mutation.mutate({ enabled: true, regenerate: true });
              }
            }}
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="h-3 w-3" />
            Replace with a new link
          </button>
        </div>
      )}
    </div>
  );
}

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { supabase } from "@/integrations/supabase/client";
import { INFO_TIPS } from "@/lib/info-tips";
import { cn } from "@/lib/utils";

/* eslint-disable @typescript-eslint/no-explicit-any --
   `glossary_tips` postdates the last `supabase gen types` run; same cast
   convention as odb()/adb() elsewhere. Drop once types are regenerated. */
const gdb = (): any => supabase as any;
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * The italic "i" information tip (TAB 3 §3.2, v6.3).
 *
 * Hover on desktop, tap on mobile — hence a Popover rather than a Tooltip,
 * which Radix does not open on touch. Copy comes from the shipped glossary in
 * `info-tips.ts`, overridden by anything Admin has edited in `glossary_tips`.
 *
 * Renders nothing when a key has no copy, so adding a tip is a content change
 * rather than a release, and a typo'd key never leaves a dangling icon.
 */

/** One shared fetch for the whole page; tips change rarely. */
function useGlossaryOverrides() {
  const { data } = useQuery({
    queryKey: ["glossary-tips"],
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: false,
    queryFn: async (): Promise<Record<string, string>> => {
      const { data, error } = await gdb().from("glossary_tips").select("tip_key, body");
      // An unreachable or not-yet-migrated table falls back to the defaults
      // rather than stripping every tip off the page.
      if (error || !data) return {};
      return Object.fromEntries(
        (data as { tip_key: string; body: string }[]).map((r) => [r.tip_key, r.body]),
      );
    },
  });
  return data ?? {};
}

export function InfoTip({ tip, className }: { tip: string; className?: string }) {
  const overrides = useGlossaryOverrides();
  const [open, setOpen] = React.useState(false);
  const body = overrides[tip] ?? INFO_TIPS[tip];

  if (!body) return null;

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger
        type="button"
        aria-label="What this means"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className={cn(
          "ml-1 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
          "border border-border/70 bg-muted/40 align-middle font-serif text-[10px] italic leading-none",
          "text-muted-foreground transition-colors hover:border-primary hover:text-primary",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          className,
        )}
      >
        i
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          side="top"
          align="start"
          sideOffset={6}
          collisionPadding={12}
          // Hovering onto the panel itself keeps it open; leaving closes it.
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          // Pointer-down outside already closes it; don't steal focus on open.
          onOpenAutoFocus={(e) => e.preventDefault()}
          className={cn(
            "z-50 max-w-xs rounded-lg border border-border bg-popover px-3 py-2",
            "text-xs font-normal leading-relaxed text-popover-foreground shadow-lg",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          )}
        >
          {body}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

/**
 * A label with its tip attached. Use anywhere a field or section heading needs
 * one, so the icon is always positioned and sized the same way.
 */
export function TipLabel({
  children,
  tip,
  className,
}: {
  children: React.ReactNode;
  tip?: string;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center", className)}>
      {children}
      {tip ? <InfoTip tip={tip} /> : null}
    </span>
  );
}

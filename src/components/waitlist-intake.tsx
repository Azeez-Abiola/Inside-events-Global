import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  AffiliateWaitlistForm,
  BrandWaitlistForm,
  DonePanel,
  MediaWaitlistForm,
  OrganiserWaitlistForm,
} from "@/components/waitlist-forms";
import {
  WAITLIST_AUDIENCES,
  type WaitlistAudience,
  waitlistAudienceLabel,
} from "@/lib/waitlist-audiences";

export type WaitlistProgress = {
  step: number;
  total: number;
  label: string;
};

export function WaitlistProgressBar({ step, total, label }: WaitlistProgress) {
  const pct = total > 0 ? (step / total) * 100 : 0;

  return (
    <div className="sticky top-16 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto max-w-4xl px-6 py-4">
        <div className="mb-2 flex items-center justify-between gap-4 text-xs text-muted-foreground">
          <span className="font-medium">
            Step {step} of {total}
          </span>
          <span className="font-semibold text-foreground">{label}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-brand-gradient transition-all duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

type Props = {
  initialAudience?: WaitlistAudience;
  showRolePicker?: boolean;
  onAudienceChange?: (audience: WaitlistAudience) => void;
  onProgressChange?: (progress: WaitlistProgress) => void;
  className?: string;
  /** Step through role picker and form sections one at a time. */
  progressive?: boolean;
};

function RoleForm({
  audience,
  onDone,
  progressive,
  onSectionProgress,
  onFirstStepBack,
}: {
  audience: WaitlistAudience;
  onDone: () => void;
  progressive?: boolean;
  onSectionProgress?: (info: WaitlistProgress) => void;
  onFirstStepBack?: () => void;
}) {
  const formProps = { onDone, progressive, onSectionProgress, onFirstStepBack };
  switch (audience) {
    case "sponsor":
      return <BrandWaitlistForm {...formProps} />;
    case "organiser":
      return <OrganiserWaitlistForm {...formProps} />;
    case "referral_partner":
      return <AffiliateWaitlistForm {...formProps} />;
    case "media_partner":
      return <MediaWaitlistForm {...formProps} />;
  }
}

export function WaitlistIntake({
  initialAudience = "organiser",
  showRolePicker = true,
  onAudienceChange,
  onProgressChange,
  className,
  progressive = false,
}: Props) {
  const [audience, setAudience] = useState<WaitlistAudience>(initialAudience);
  const [done, setDone] = useState(false);
  const [roleConfirmed, setRoleConfirmed] = useState(!showRolePicker);

  function changeAudience(next: WaitlistAudience) {
    setAudience(next);
    setDone(false);
    setRoleConfirmed(false);
    onAudienceChange?.(next);
  }

  useEffect(() => {
    setAudience(initialAudience);
    if (progressive && showRolePicker) {
      setRoleConfirmed(false);
    }
  }, [initialAudience, progressive, showRolePicker]);

  useEffect(() => {
    if (!progressive || !onProgressChange || done) return;
    if (!roleConfirmed) {
      onProgressChange({ step: 1, total: 2, label: "Your role" });
    }
  }, [progressive, onProgressChange, roleConfirmed, done]);

  if (done) {
    return (
      <DonePanel
        audienceLabel={waitlistAudienceLabel(audience)}
        onAddAnother={() => {
          setDone(false);
          setRoleConfirmed(!showRolePicker);
        }}
      />
    );
  }

  if (progressive && showRolePicker && !roleConfirmed) {
    return (
      <div className={className}>
        <div className="rounded-2xl border border-border/60 bg-card/50 p-5 md:p-6">
          <div className="max-w-xl space-y-2">
            <Label htmlFor="waitlist-role" className="text-sm font-semibold">
              I am joining as a… <span className="text-destructive">*</span>
            </Label>
            <p className="text-sm text-muted-foreground">
              Choose your role — the questions in the next steps are tailored to how you&apos;ll use IGE.
            </p>
            <div className="relative mt-3">
              <select
                id="waitlist-role"
                value={audience}
                onChange={(e) => changeAudience(e.target.value as WaitlistAudience)}
                className="flex h-11 w-full appearance-none rounded-md border border-input bg-background px-3 pr-10 text-sm font-medium shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {WAITLIST_AUDIENCES.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">
              {WAITLIST_AUDIENCES.find((a) => a.id === audience)?.description}
            </p>
          </div>
          <div className="mt-8 flex justify-end border-t border-border pt-6">
            <Button type="button" onClick={() => setRoleConfirmed(true)}>
              Continue
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {!progressive && showRolePicker ? (
        <div className="mb-8 rounded-2xl border border-border/60 bg-card/50 p-5 md:p-6">
          <div className="max-w-xl space-y-2">
            <Label htmlFor="waitlist-role" className="text-sm font-semibold">
              I am joining as a… <span className="text-destructive">*</span>
            </Label>
            <p className="text-sm text-muted-foreground">
              Choose your role — the questions below are tailored to how you&apos;ll use IGE.
            </p>
            <div className="relative mt-3">
              <select
                id="waitlist-role"
                value={audience}
                onChange={(e) => changeAudience(e.target.value as WaitlistAudience)}
                className="flex h-11 w-full appearance-none rounded-md border border-input bg-background px-3 pr-10 text-sm font-medium shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {WAITLIST_AUDIENCES.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">
              {WAITLIST_AUDIENCES.find((a) => a.id === audience)?.description}
            </p>
          </div>
        </div>
      ) : null}

      <RoleForm
        key={audience}
        audience={audience}
        onDone={() => setDone(true)}
        progressive={progressive}
        onSectionProgress={onProgressChange}
        onFirstStepBack={progressive ? () => setRoleConfirmed(false) : undefined}
      />
    </div>
  );
}

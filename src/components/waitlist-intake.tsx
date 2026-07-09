import { useState } from "react";
import { ChevronDown } from "lucide-react";
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

type Props = {
  initialAudience?: WaitlistAudience;
  /** Show a native select for role switching (default true). */
  showRolePicker?: boolean;
  onAudienceChange?: (audience: WaitlistAudience) => void;
  className?: string;
};

function RoleForm({ audience, onDone }: { audience: WaitlistAudience; onDone: () => void }) {
  switch (audience) {
    case "sponsor":
      return <BrandWaitlistForm onDone={onDone} />;
    case "organiser":
      return <OrganiserWaitlistForm onDone={onDone} />;
    case "referral_partner":
      return <AffiliateWaitlistForm onDone={onDone} />;
    case "media_partner":
      return <MediaWaitlistForm onDone={onDone} />;
  }
}

export function WaitlistIntake({
  initialAudience = "organiser",
  showRolePicker = true,
  onAudienceChange,
  className,
}: Props) {
  const [audience, setAudience] = useState<WaitlistAudience>(initialAudience);
  const [done, setDone] = useState(false);

  function changeAudience(next: WaitlistAudience) {
    setAudience(next);
    setDone(false);
    onAudienceChange?.(next);
  }

  return (
    <div className={className}>
      {showRolePicker && !done ? (
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

      {done ? (
        <DonePanel
          audienceLabel={waitlistAudienceLabel(audience)}
          onAddAnother={() => setDone(false)}
        />
      ) : (
        <RoleForm key={audience} audience={audience} onDone={() => setDone(true)} />
      )}
    </div>
  );
}

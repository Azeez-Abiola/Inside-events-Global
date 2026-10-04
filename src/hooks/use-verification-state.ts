import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getOnboardingGateState } from "@/lib/onboarding.functions";

/**
 * Whether the signed-in account has cleared Verification & trust
 * (TAB 3 §3.2A), and where to send them if not.
 *
 * Shares one query key with the profile completion bar, so a dashboard
 * rendering both makes a single round trip.
 */
export function useVerificationState() {
  const fetchState = useServerFn(getOnboardingGateState);
  const { data, isLoading } = useQuery({
    queryKey: ["onboarding-gate-state"],
    queryFn: () => fetchState(),
    staleTime: 60_000,
    retry: false,
  });

  return {
    isLoading,
    // An account with no application — admin, legacy — is never locked out of
    // anything by this mechanism.
    verified: !data?.hasApplication || data.verificationStatus === "verified",
    status: data?.verificationStatus ?? null,
    sectionKey: data?.verificationSectionKey ?? null,
  };
}

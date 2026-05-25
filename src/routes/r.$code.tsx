import { createFileRoute, redirect } from "@tanstack/react-router";
import { trackReferralClick } from "@/lib/referrals.functions";

export const Route = createFileRoute("/r/$code")({
  beforeLoad: async ({ params }) => {
    try {
      const res = await trackReferralClick({ data: { short_code: params.code } });
      if (res.ok && res.slug) {
        throw redirect({ to: "/events/$slug", params: { slug: res.slug }, search: { ref: params.code } });
      }
    } catch (e: any) {
      if (e?.isRedirect) throw e;
    }
    throw redirect({ to: "/marketplace" });
  },
  component: () => null,
});

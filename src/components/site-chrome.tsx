import { ArchBackdrop, PublicNav } from "@/components/landing/public-chrome";
import { SiteFooter } from "@/components/site-footer";

export { SiteFooter };

export const SITE_BRAND_NAME = "Inside Global Events";

/**
 * The public header: the landing page's nav on a short band of its purple
 * arch, so every public page opens the same way. Pages with their own hero
 * use `PageHero` (which includes the nav) instead.
 */
export function SiteHeader(_props: { showAuthLinks?: boolean } = {}) {
  return (
    <div className="relative overflow-hidden bg-[#f7f6fa] pb-4">
      <ArchBackdrop />
      <PublicNav />
    </div>
  );
}

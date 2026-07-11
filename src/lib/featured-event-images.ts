import itsekiriHomecomingPoster from "@/assets/featured-itsekiri.png";

/** Bundled + public paths for welcome-page featured events (Lovable CDN URLs 404 on Vercel). */
export const FEATURED_EVENT_IMAGES = {
  itsekiriHomecoming: itsekiriHomecomingPoster,
  /** Add `public/events/project-x-almost-famous.jpg` when the poster asset is available. */
  projectXAlmostFamous: "/events/project-x-almost-famous.jpg",
} as const;

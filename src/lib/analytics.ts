/**
 * Simple Plausible Analytics event tracker.
 * Falls back to console.log in dev when Plausible is blocked.
 */
export function trackEvent(
  eventName: string,
  props?: Record<string, string | number | boolean>
) {
  if (typeof window === "undefined") return;

  const plausible = (window as any).plausible;
  if (plausible) {
    plausible(eventName, { props });
  } else if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log("[Analytics]", eventName, props ?? "");
  }
}

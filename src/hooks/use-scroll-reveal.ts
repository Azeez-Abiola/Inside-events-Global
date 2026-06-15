import { useEffect, useRef } from "react";

/**
 * Attaches an IntersectionObserver to a container element and adds
 * `data-visible="true"` to every child that has `data-reveal` once it
 * enters the viewport.  The class-based approach keeps animations in CSS
 * so they are as performant as possible.
 *
 * Usage:
 *   const ref = useScrollReveal();
 *   <section ref={ref}>
 *     <div data-reveal>…</div>
 *   </section>
 */
export function useScrollReveal(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const observed = new Set<HTMLElement>();

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).dataset.visible = "true";
            io.unobserve(entry.target);
            observed.delete(entry.target as HTMLElement);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px", ...options },
    );

    const updateObservers = () => {
      const targets = root.querySelectorAll<HTMLElement>("[data-reveal]");
      targets.forEach((el) => {
        if (!observed.has(el) && el.dataset.visible !== "true") {
          observed.add(el);
          io.observe(el);
        }
      });
    };

    updateObservers();

    const observer = new MutationObserver(() => {
      updateObservers();
    });

    observer.observe(root, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      observer.disconnect();
    };
  }, []);

  return ref;
}

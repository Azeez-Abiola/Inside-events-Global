import { useEffect, useRef } from "react";

function isInRevealViewport(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;
  return rect.top < vh * 0.92 && rect.bottom > vh * 0.08;
}

/**
 * Attaches an IntersectionObserver to a container element and adds
 * `data-visible="true"` to every child that has `data-reveal` once it
 * enters the viewport.  The class-based approach keeps animations in CSS
 * so they are as performant as possible.
 *
 * Usage:
 *   const ref = useScrollReveal();
 *   <main ref={ref}>
 *     <div data-reveal>…</div>
 *   </main>
 */
export function useScrollReveal(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root || typeof IntersectionObserver === "undefined") return;

    const observed = new Set<HTMLElement>();

    const reveal = (el: HTMLElement) => {
      el.dataset.visible = "true";
      io.unobserve(el);
      observed.delete(el);
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            reveal(entry.target as HTMLElement);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -8% 0px", ...options },
    );

    const updateObservers = () => {
      const targets = root.querySelectorAll<HTMLElement>("[data-reveal]");
      targets.forEach((el) => {
        if (el.dataset.visible === "true") return;
        if (isInRevealViewport(el)) {
          reveal(el);
          return;
        }
        if (!observed.has(el)) {
          observed.add(el);
          io.observe(el);
        }
      });
    };

    updateObservers();

    const raf = requestAnimationFrame(() => {
      updateObservers();
    });

    const observer = new MutationObserver(() => {
      updateObservers();
    });

    observer.observe(root, { childList: true, subtree: true });

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      observer.disconnect();
    };
  }, []);

  return ref;
}

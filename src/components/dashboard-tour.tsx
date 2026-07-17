import { useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, Sparkles, X } from "lucide-react";
import { useDashboardTour } from "@/lib/dashboard-tour-context";
import { Button } from "@/components/ui/button";

type Rect = { top: number; left: number; width: number; height: number };

function measureTarget(targetId: string): Rect | null {
  const el = document.querySelector(`[data-tour="${targetId}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const pad = 8;
  return {
    top: Math.max(8, r.top - pad),
    left: Math.max(8, r.left - pad),
    width: r.width + pad * 2,
    height: r.height + pad * 2,
  };
}

export function DashboardTourOverlay() {
  const { isActive, stepIndex, steps, nextStep, skipTour } = useDashboardTour();
  const [rect, setRect] = useState<Rect | null>(null);
  const [mounted, setMounted] = useState(false);

  const step = steps[stepIndex];
  const isLast = stepIndex >= steps.length - 1;

  useEffect(() => setMounted(true), []);

  useLayoutEffect(() => {
    if (!isActive || !step) {
      setRect(null);
      return;
    }

    function update() {
      const next = measureTarget(step.target);
      setRect(next);
      if (next) {
        const el = document.querySelector(`[data-tour="${step.target}"]`);
        el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    const id = window.setInterval(update, 300);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      window.clearInterval(id);
    };
  }, [isActive, step]);

  if (!mounted || !isActive || !step) return null;

  const tooltipTop = rect ? Math.min(rect.top + rect.height + 16, window.innerHeight - 220) : 120;
  const tooltipLeft = rect ? Math.min(Math.max(16, rect.left), window.innerWidth - 340) : 16;

  return createPortal(
    <div className="fixed inset-0 z-[200]" role="dialog" aria-modal="true" aria-label="Dashboard tour">
      {/* Blurred backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={skipTour} aria-hidden />

      {/* Spotlight ring */}
      {rect && (
        <div
          className="pointer-events-none absolute rounded-xl border-2 border-primary transition-all duration-300 ease-out"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.62)",
          }}
        />
      )}

      {/* Tooltip card */}
      <div
        className="absolute z-[201] w-[min(320px,calc(100vw-32px))] rounded-2xl border border-border bg-card p-5 shadow-2xl"
        style={{ top: tooltipTop, left: tooltipLeft }}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">
              Step {stepIndex + 1} of {steps.length}
            </span>
          </div>
          <button
            type="button"
            onClick={skipTour}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Skip tour"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <h3 className="font-display text-lg font-bold text-foreground">{step.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={skipTour}>
            Skip tour
          </Button>
          <Button type="button" size="sm" className="bg-brand-gradient text-white" onClick={nextStep}>
            {isLast ? "Finish" : "Next"}
            {!isLast && <ArrowRight className="ml-1.5 h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

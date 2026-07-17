import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocation } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/lib/auth-context";
import {
  getDashboardTourRole,
  resolveTourSteps,
  type DashboardTourRole,
  type DashboardTourStep,
} from "@/lib/dashboard-tours";
import { getDashboardTourStatus, markDashboardTourComplete } from "@/lib/dashboard-tour.functions";

type DashboardTourContextValue = {
  isActive: boolean;
  stepIndex: number;
  steps: DashboardTourStep[];
  tourRole: DashboardTourRole | null;
  startTour: (options?: { force?: boolean }) => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
};

const DashboardTourContext = createContext<DashboardTourContextValue | null>(null);

export function useDashboardTour() {
  const ctx = useContext(DashboardTourContext);
  if (!ctx) throw new Error("useDashboardTour must be used within DashboardTourProvider");
  return ctx;
}

export function DashboardTourProvider({ children }: { children: ReactNode }) {
  const { roles, user } = useAuth();
  const loc = useLocation();
  const qc = useQueryClient();
  const fetchStatus = useServerFn(getDashboardTourStatus);
  const markComplete = useServerFn(markDashboardTourComplete);

  const tourRole = useMemo(() => getDashboardTourRole(roles), [roles]);
  const autoStarted = useRef(false);
  const [isActive, setIsActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [steps, setSteps] = useState<DashboardTourStep[]>([]);

  const { data: tourStatus } = useQuery({
    queryKey: ["dashboard-tour-status", user?.id],
    queryFn: () => fetchStatus(),
    enabled: !!user && !!tourRole,
    staleTime: 30_000,
  });

  const completed = tourStatus?.completed ?? {};

  const finishTour = useCallback(async () => {
    setIsActive(false);
    setStepIndex(0);
    if (!tourRole) return;
    try {
      await markComplete({ data: { tour_role: tourRole } });
      qc.setQueryData(["dashboard-tour-status", user?.id], {
        completed: { ...completed, [tourRole]: true },
      });
    } catch {
      // Non-blocking — tour can still close locally
    }
  }, [tourRole, markComplete, qc, user?.id, completed]);

  const beginTour = useCallback(
    (options?: { force?: boolean }) => {
      if (!tourRole) return;
      if (!options?.force && completed[tourRole]) return;

      window.setTimeout(() => {
        const resolved = resolveTourSteps(tourRole);
        if (!resolved.length) return;
        setSteps(resolved);
        setStepIndex(0);
        setIsActive(true);
      }, 400);
    },
    [tourRole, completed],
  );

  const startTour = useCallback(
    (options?: { force?: boolean }) => {
      autoStarted.current = true;
      beginTour(options);
    },
    [beginTour],
  );

  const nextStep = useCallback(() => {
    if (stepIndex >= steps.length - 1) {
      void finishTour();
      return;
    }
    setStepIndex((i) => i + 1);
  }, [stepIndex, steps.length, finishTour]);

  const prevStep = useCallback(() => {
    setStepIndex((i) => Math.max(0, i - 1));
  }, []);

  const skipTour = useCallback(() => {
    void finishTour();
  }, [finishTour]);

  // Auto-start for new / invited users on first dashboard visit
  useEffect(() => {
    if (!user || !tourRole || autoStarted.current) return;
    if (completed[tourRole]) return;
    const onDashboardHome =
      loc.pathname === "/dashboard" || loc.pathname === "/dashboard/";
    if (!onDashboardHome) return;

    autoStarted.current = true;
    beginTour();
  }, [user, tourRole, completed, loc.pathname, beginTour]);

  const value = useMemo(
    () => ({
      isActive,
      stepIndex,
      steps,
      tourRole,
      startTour,
      nextStep,
      prevStep,
      skipTour,
    }),
    [isActive, stepIndex, steps, tourRole, startTour, nextStep, prevStep, skipTour],
  );

  return <DashboardTourContext.Provider value={value}>{children}</DashboardTourContext.Provider>;
}

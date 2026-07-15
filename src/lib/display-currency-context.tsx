import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCurrentRates } from "@/lib/marketplace.functions";
import {
  DISPLAY_CURRENCIES,
  DISPLAY_CURRENCY_STORAGE_KEY,
  type DisplayCurrency,
  type Rates,
  currencyLabelSuffix,
  fmtUsdAmount,
  fromUsd,
} from "@/lib/currency";

type DisplayCurrencyContextValue = {
  displayCurrency: DisplayCurrency;
  setDisplayCurrency: (c: DisplayCurrency) => void;
  rates: Rates;
  ratesLoading: boolean;
  /** Format a USD-normalised platform amount in the selected currency */
  fmtUsd: (usd: number | null | undefined) => string;
  /** Convert USD-normalised amount to display currency number (for charts) */
  convertUsd: (usd: number) => number;
  /** Append " (NGN)" etc. to labels when not USD */
  labelSuffix: string;
  options: typeof DISPLAY_CURRENCIES;
};

const FALLBACK: DisplayCurrencyContextValue = {
  displayCurrency: "USD",
  setDisplayCurrency: () => {},
  rates: null,
  ratesLoading: false,
  fmtUsd: (usd) => fmtUsdAmount(usd, "USD", null),
  convertUsd: (usd) => usd,
  labelSuffix: "",
  options: DISPLAY_CURRENCIES,
};

const Ctx = createContext<DisplayCurrencyContextValue | null>(null);

function readStoredCurrency(): DisplayCurrency {
  if (typeof window === "undefined") return "USD";
  const stored = localStorage.getItem(DISPLAY_CURRENCY_STORAGE_KEY);
  if (stored === "NGN" || stored === "EUR" || stored === "USD") return stored;
  return "USD";
}

export function DisplayCurrencyProvider({ children }: { children: ReactNode }) {
  // Start with USD on server + first client paint to avoid hydration mismatch,
  // then sync from localStorage after mount.
  const [displayCurrency, setDisplayCurrencyState] = useState<DisplayCurrency>("USD");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setDisplayCurrencyState(readStoredCurrency());
    setHydrated(true);
  }, []);

  const fetchRates = useServerFn(getCurrentRates);
  const { data, isLoading: ratesLoading } = useQuery({
    queryKey: ["exchange-rates"],
    queryFn: () => fetchRates(),
    staleTime: 5 * 60_000,
  });

  const rates = data?.rates ?? null;

  function setDisplayCurrency(c: DisplayCurrency) {
    setDisplayCurrencyState(c);
    try {
      localStorage.setItem(DISPLAY_CURRENCY_STORAGE_KEY, c);
    } catch {
      /* ignore */
    }
  }

  const value = useMemo<DisplayCurrencyContextValue>(
    () => ({
      displayCurrency,
      setDisplayCurrency,
      rates,
      ratesLoading: ratesLoading || !hydrated,
      fmtUsd: (usd) => fmtUsdAmount(usd, displayCurrency, rates),
      convertUsd: (usd) => fromUsd(usd, displayCurrency, rates),
      labelSuffix: currencyLabelSuffix(displayCurrency),
      options: DISPLAY_CURRENCIES,
    }),
    [displayCurrency, rates, ratesLoading, hydrated],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDisplayCurrency() {
  return useContext(Ctx) ?? FALLBACK;
}

/** Safe fallback when provider is optional (e.g. non-dashboard pages) */
export function useDisplayCurrencyOptional() {
  return useContext(Ctx);
}

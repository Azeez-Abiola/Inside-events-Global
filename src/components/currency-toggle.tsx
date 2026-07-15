import { useDisplayCurrency } from "@/lib/display-currency-context";
import { cn } from "@/lib/utils";

export function CurrencyToggle({ className }: { className?: string }) {
  const { displayCurrency, setDisplayCurrency, options } = useDisplayCurrency();

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-border/60 bg-muted/40 p-0.5",
        className,
      )}
      role="group"
      aria-label="Display currency"
    >
      {options.map((opt) => {
        const active = displayCurrency === opt.code;
        return (
          <button
            key={opt.code}
            type="button"
            title={opt.label}
            onClick={() => setDisplayCurrency(opt.code)}
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide transition-colors",
              active
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {opt.short}
          </button>
        );
      })}
    </div>
  );
}

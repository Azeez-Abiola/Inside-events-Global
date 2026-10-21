import type { ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { IGE_LOGO_ALT, IGE_LOGO_SRC } from "@/lib/brand-logo";

const sizeClass = {
  sm: "h-8",
  md: "h-9",
  lg: "h-10",
} as const;

export function BrandLogo({
  className,
  size = "md",
  alt = IGE_LOGO_ALT,
  ...rest
}: {
  className?: string;
  size?: keyof typeof sizeClass;
  alt?: string;
} & Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt" | "className">) {
  return (
    <img
      src={IGE_LOGO_SRC}
      alt={alt}
      className={cn(
        sizeClass[size],
        "w-auto shrink-0 object-contain mix-blend-multiply dark:mix-blend-screen",
        className,
      )}
      loading="eager"
      {...rest}
    />
  );
}

/**
 * The logo with the "Inside Global Events" name in the brand gradient. Use it
 * wherever the name sits beside the logo, so the wordmark reads the same on
 * every page. `onDark` swaps to a lighter gradient that stays legible on dark
 * backgrounds (and in the dashboard's dark mode) and sets the ink logo on a
 * white tile.
 */
export function BrandWordmark({
  size = "sm",
  onDark = false,
  tile = onDark,
  className,
  textClassName,
}: {
  size?: keyof typeof sizeClass;
  onDark?: boolean;
  /** Sets the logo on a white tile, for tinted or layered backgrounds it can't blend into. */
  tile?: boolean;
  className?: string;
  textClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      {tile ? (
        <span className="rounded-lg bg-white p-1 shadow-sm">
          <BrandLogo size={size} />
        </span>
      ) : (
        <BrandLogo size={size} />
      )}
      <span
        className={cn(
          "bg-clip-text text-[15px] font-semibold tracking-tight text-transparent",
          onDark
            ? "bg-[linear-gradient(90deg,#c9a8ff_0%,#62d4b8_55%,#3ddc97_100%)]"
            : "bg-brand-gradient dark:bg-[linear-gradient(90deg,#c9a8ff_0%,#62d4b8_55%,#3ddc97_100%)]",
          textClassName,
        )}
      >
        Inside Global Events
      </span>
    </span>
  );
}

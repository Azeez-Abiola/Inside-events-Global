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

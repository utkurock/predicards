"use client";

import clsx from "clsx";
import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg" | "xl";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

const variantClass: Record<Variant, string> = {
  primary: "btn-lime",
  secondary:
    "bg-bg-card text-text-primary border border-line hover:bg-bg-hover hover:border-line-bright disabled:opacity-40 rounded-xl",
  ghost:
    "text-text-secondary hover:text-text-primary hover:bg-bg-card/60 disabled:opacity-40 rounded-xl",
  danger:
    "bg-live/10 text-live border border-live/30 hover:bg-live/20 hover:border-live/40 disabled:opacity-40 rounded-xl",
  outline:
    "border border-line text-text-primary hover:border-line-bright hover:bg-bg-card disabled:opacity-40 rounded-xl",
};

const sizeClass: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-[14px]",
  xl: "h-14 px-7 text-[15px]",
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "primary", size = "md", className, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      className={clsx(
        "inline-flex items-center justify-center gap-2 font-semibold transition-all disabled:cursor-not-allowed",
        variantClass[variant],
        sizeClass[size],
        className
      )}
      {...rest}
    />
  );
});

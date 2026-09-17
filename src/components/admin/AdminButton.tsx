import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "outline" | "danger";
type Size = "sm" | "md";

const VARIANT_CLASSES: Record<Variant, string> = {
  // Solid fill, but still a defined rectangular border (not a borderless
  // pill) — the site's main brand color doubles as the outline.
  primary:
    "bg-caffeine-dark border border-caffeine-dark text-white hover:bg-caffeine-card disabled:hover:bg-caffeine-dark",
  // Transparent fill, visible border — the default for secondary actions.
  outline:
    "bg-white border border-stone-300 text-stone-700 hover:border-caffeine-dark hover:text-caffeine-dark",
  // Same outline treatment, red-toned for destructive actions.
  danger:
    "bg-white border border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400",
};

const SIZE_CLASSES: Record<Size, string> = {
  md: "px-4 py-2.5 text-sm",
  sm: "px-3 py-1.5 text-xs",
};

export default function AdminButton({
  variant = "outline",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
    >
      {children}
    </button>
  );
}

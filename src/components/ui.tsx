import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * The app's styling primitives.
 *
 * Page code composes these; it does not reinvent them. Every colour and radius
 * here comes from a token in globals.css, so a design change is a token change.
 *
 * This file grows one primitive at a time, when a screen actually needs it.
 * A primitive nothing renders is dead code that still has to be maintained.
 */

type ButtonVariant = "primary" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium " +
  "transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-accent text-accent-ink hover:bg-accent/90",
  ghost: "border border-line text-ink hover:border-line-strong hover:bg-surface-raised",
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`${BUTTON_BASE} ${BUTTON_VARIANTS[variant]} ${className}`.trim()}
    />
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl border border-line bg-surface p-6 ${className}`.trim()}
    >
      {children}
    </div>
  );
}

import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

/**
 * The app's styling primitives.
 *
 * Page code composes these; it does not reinvent them. Every colour and radius
 * here comes from a token in globals.css, so a design change is a token change.
 *
 * This file grows one primitive at a time, when a screen actually needs it.
 * A primitive nothing renders is dead code that still has to be maintained.
 */

type ButtonVariant = "primary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  full?: boolean;
};

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium " +
  "transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-accent text-accent-ink hover:bg-accent/90",
  ghost: "border border-line text-ink hover:border-line-strong hover:bg-surface-raised",
  danger: "border border-danger/40 text-danger hover:bg-danger/10",
};

export function Button({ variant = "primary", full = false, className = "", ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`${BUTTON_BASE} ${BUTTON_VARIANTS[variant]} ${full ? "w-full" : ""} ${className}`.trim()}
    />
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-line bg-surface p-6 ${className}`.trim()}>{children}</div>;
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  hint?: string;
};

/**
 * A labelled input. The label is a real `<label htmlFor>` bound to the input's
 * id — placeholder-as-label loses the name the moment someone starts typing,
 * and screen readers get nothing at all.
 */
export function Field({ label, name, hint, className = "", ...props }: FieldProps) {
  const hintId = hint ? `${name}-hint` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium text-ink">
        {label}
      </label>
      <input
        {...props}
        id={name}
        name={name}
        aria-describedby={hintId}
        className={
          "rounded-lg border border-line bg-surface-raised px-3.5 py-2.5 text-sm text-ink " +
          "placeholder:text-ink-faint focus:border-line-strong " +
          className
        }
      />
      {hint ? (
        <p id={hintId} className="text-xs text-ink-faint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type AlertTone = "error" | "success" | "info";

const ALERT_TONES: Record<AlertTone, string> = {
  error: "border-danger/40 bg-danger/10 text-danger",
  success: "border-accent/40 bg-accent/10 text-accent",
  info: "border-line bg-surface-raised text-ink-muted",
};

/**
 * `role="alert"` on the error tone only: it interrupts a screen reader
 * immediately, which is right for a failure the user must act on and wrong for
 * a confirmation they will reach on their own.
 */
export function Alert({ tone = "error", children }: { tone?: AlertTone; children: ReactNode }) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-lg border px-3.5 py-2.5 text-sm ${ALERT_TONES[tone]}`}
    >
      {children}
    </p>
  );
}

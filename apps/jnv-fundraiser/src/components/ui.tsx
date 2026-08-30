import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Tone = "brand" | "neutral" | "accent" | "danger";

const toneClasses: Record<Tone, string> = {
  brand: "bg-brand-soft text-brand border-brand/30",
  neutral: "bg-surface-2 text-ink-muted border-line",
  accent: "bg-accent-soft text-accent border-accent/30",
  danger: "bg-danger-soft text-danger border-danger/30",
};

export function Pill({ children, tone = "neutral" }: { children: ReactNode; tone?: Tone }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl border border-line bg-surface p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {hint ? <p className="mt-1 text-sm text-ink-muted">{hint}</p> : null}
      </div>
      {action}
    </div>
  );
}

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const buttonTones: Record<Tone, string> = {
  brand: "bg-brand text-brand-ink hover:opacity-90",
  neutral: "border border-line bg-surface text-ink hover:bg-surface-2",
  accent: "bg-accent text-white hover:opacity-90",
  danger: "border border-danger/40 bg-danger-soft text-danger hover:opacity-90",
};

export function Button({
  tone = "brand",
  className = "",
  ...props
}: ComponentProps<"button"> & { tone?: Tone }) {
  return <button className={`${buttonBase} ${buttonTones[tone]} ${className}`} {...props} />;
}

export function LinkButton({
  href,
  tone = "brand",
  className = "",
  children,
}: {
  href: string;
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={`${buttonBase} ${buttonTones[tone]} ${className}`}>
      {children}
    </Link>
  );
}

export function Progress({ value }: { value: number }) {
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-surface-2"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="h-full rounded-full bg-brand" style={{ width: `${value}%` }} />
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight">{value}</div>
      {hint ? <div className="mt-1 text-xs text-ink-muted">{hint}</div> : null}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-ink-muted">{hint}</span> : null}
    </label>
  );
}

export const inputClass =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

export function Notice({
  tone = "neutral",
  title,
  children,
}: {
  tone?: Tone;
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${toneClasses[tone]}`}>
      {title ? <div className="font-semibold">{title}</div> : null}
      <div className={title ? "mt-1" : ""}>{children}</div>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-line px-4 py-10 text-center text-sm text-ink-muted">
      {children}
    </div>
  );
}

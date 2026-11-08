import React from "react";
import { cn } from "@/libs/utils";
import Heading from "@/components/typography/Heading";

export function PageHeader({
  title,
  description,
  eyebrow,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Small label above the title. */
  eyebrow?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-8 pt-4 md:pt-8", className)}>
      {eyebrow && <Eyebrow className="mb-3">{eyebrow}</Eyebrow>}
      <Heading level={1}>{title}</Heading>
      {description && <p className="mt-2 max-w-2xl text-[15px] leading-[160%] text-gray-500">{description}</p>}
    </div>
  );
}

/** Uppercase label with the orange lane dash. */
export function Eyebrow({ children, className, tone = "dark" }: { children: React.ReactNode; className?: string; tone?: "dark" | "light" }) {
  return (
    <p
      className={cn(
        "flex items-center gap-2.5 text-[11px] font-extrabold uppercase tracking-[0.14em]",
        tone === "dark" ? "text-primary" : "text-white/80",
        className,
      )}
    >
      <span aria-hidden className="lane-line w-7" />
      {children}
    </p>
  );
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("rounded-[18px] border border-border-stroke bg-white p-5 shadow-card md:p-6", className)}>{children}</div>;
}

export function SectionTitle({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="font-display text-[16px] font-extrabold tracking-n-2 text-ink">{children}</h2>
      {aside}
    </div>
  );
}

/** Label/value rows used in summaries. */
export function DetailList({ rows, className }: { rows: [React.ReactNode, React.ReactNode][]; className?: string }) {
  return (
    <dl className={cn("divide-y divide-dashed divide-border-stroke text-[13.5px]", className)}>
      {rows.map(([label, value], i) => (
        <div key={i} className="flex items-start justify-between gap-4 py-2.5">
          <dt className="text-gray-500">{label}</dt>
          <dd className="text-right font-bold text-black">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Numbered progress steps for multi-step flows. */
export function Steps({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="mb-8 flex flex-wrap items-center gap-x-2 gap-y-3 text-[13px]">
      {steps.map((s, i) => (
        <li key={s} aria-current={i === current ? "step" : undefined} className="flex items-center gap-2">
          <span
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-extrabold",
              i === current ? "bg-primary text-white ring-4 ring-primary/15" : i < current ? "bg-secondary text-white" : "bg-canvas text-gray-400 ring-1 ring-border-stroke",
            )}
          >
            {i < current ? "✓" : i + 1}
          </span>
          <span className={cn("font-bold", i === current ? "text-ink" : "text-gray-500")}>{s}</span>
          {i < steps.length - 1 && <span aria-hidden className="mx-1 hidden h-px w-8 bg-border-stroke sm:block" />}
        </li>
      ))}
    </ol>
  );
}

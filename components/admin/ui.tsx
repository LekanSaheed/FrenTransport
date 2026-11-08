"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { cn } from "@/libs/utils";
import { Alert, EmptyState, LoadingBlock } from "@/components/ui/feedback";
import type { ApiError } from "@/libs/api";

/* ------------------------------ page chrome ------------------------------ */

export function AdminPage({
  title,
  description,
  actions,
  back,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  back?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-[1200px]">
      {back && (
        <Link href={back.href} className="mb-2 inline-block text-[13px] font-semibold text-primary">
          ← {back.label}
        </Link>
      )}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[26px] font-black tracking-n-2 text-ink">{title}</h1>
          {description && <p className="mt-1 text-[13.5px] text-gray-500">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

/** Loading / error / content switch for a data hook. */
export function DataState({
  loading,
  error,
  hasData,
  children,
}: {
  loading: boolean;
  error: ApiError | null;
  hasData: boolean;
  children: React.ReactNode;
}) {
  if (error && error.status === 403) return <Alert tone="error" title="No access">You don&apos;t have permission to view this.</Alert>;
  if (error && !hasData) return <Alert tone="error" title="Couldn't load this">{error.message}</Alert>;
  if (loading && !hasData) return <LoadingBlock />;
  return <>{children}</>;
}

/* --------------------------------- tabs ---------------------------------- */

export interface TabItem<T extends string> {
  id: T;
  label: string;
  /** Shown as a small badge (e.g. number of rows). */
  count?: number | null;
}

/**
 * Active tab kept in the URL (?tab=…) so a refresh, the back button or a shared
 * link opens the same tab. Reads window.location after mount (no useSearchParams,
 * so pages stay statically renderable).
 */
export function useTabState<T extends string>(ids: readonly T[], fallback: T = ids[0]!) {
  const [tab, setTabState] = useState<T>(fallback);
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("tab") as T | null;
    if (fromUrl && ids.includes(fromUrl)) setTabState(fromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const setTab = (next: T) => {
    setTabState(next);
    const url = new URL(window.location.href);
    if (next === fallback) url.searchParams.delete("tab");
    else url.searchParams.set("tab", next);
    window.history.replaceState(window.history.state, "", url);
  };
  return [tab, setTab] as const;
}

/** Accessible tab list (arrow keys, Home/End). Pair each tab with a <TabPanel>. */
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
  idBase = "tab",
  actions,
}: {
  tabs: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  label: string;
  idBase?: string;
  /** Right-aligned controls for the active tab (e.g. "Add route"). */
  actions?: React.ReactNode;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  function onKeyDown(e: React.KeyboardEvent, i: number) {
    const last = tabs.length - 1;
    const next = e.key === "ArrowRight" ? (i === last ? 0 : i + 1) : e.key === "ArrowLeft" ? (i === 0 ? last : i - 1) : e.key === "Home" ? 0 : e.key === "End" ? last : -1;
    if (next < 0) return;
    e.preventDefault();
    onChange(tabs[next]!.id);
    refs.current[next]?.focus();
  }
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-border-stroke">
      <div role="tablist" aria-label={label} className="-mb-px flex gap-1 overflow-x-auto">
        {tabs.map((t, i) => {
          const active = t.id === value;
          return (
            <button
              key={t.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              id={`${idBase}-${t.id}`}
              role="tab"
              type="button"
              aria-selected={active}
              aria-controls={`${idBase}-${t.id}-panel`}
              tabIndex={active ? 0 : -1}
              onClick={() => onChange(t.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={cn(
                "flex items-center gap-2 border-b-[3px] px-4 pt-2 pb-3 text-[14px] font-bold whitespace-nowrap transition",
                active ? "border-accent text-ink" : "border-transparent text-gray-500 hover:border-border-stroke hover:text-ink",
              )}
            >
              {t.label}
              {t.count != null && (
                <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-extrabold", active ? "bg-primary text-white" : "bg-canvas text-gray-500")}>{t.count}</span>
              )}
            </button>
          );
        })}
      </div>
      {actions && <div className="mb-2.5 flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}

export function TabPanel({ id, idBase = "tab", children }: { id: string; idBase?: string; children: React.ReactNode }) {
  return (
    <div role="tabpanel" id={`${idBase}-${id}-panel`} aria-labelledby={`${idBase}-${id}`} tabIndex={0} className="outline-none">
      {children}
    </div>
  );
}

export function Panel({ title, actions, children, className }: { title?: React.ReactNode; actions?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-[16px] border border-border-stroke bg-white shadow-card", className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border-stroke px-5 py-3.5">
          <h2 className="font-display text-[14.5px] font-extrabold text-ink">{title}</h2>
          {actions}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function StatCard({ label, value, hint, tone }: { label: string; value: React.ReactNode; hint?: React.ReactNode; tone?: "primary" | "warning" | "success" }) {
  return (
    <div className="relative overflow-hidden rounded-[16px] border border-border-stroke bg-white p-5 shadow-card">
      <span aria-hidden className={cn("absolute inset-x-0 top-0 h-1", tone === "warning" ? "bg-accent" : tone === "success" ? "bg-secondary" : tone === "primary" ? "bg-primary" : "bg-border-stroke")} />
      <p className="text-[12px] font-bold text-gray-500">{label}</p>
      <p
        className={cn(
          "font-display mt-1.5 text-[26px] font-black tracking-n-2",
          tone === "primary" ? "text-primary" : tone === "warning" ? "text-orange-600" : tone === "success" ? "text-emerald-700" : "text-ink",
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-0.5 text-[12px] text-gray-500">{hint}</p>}
    </div>
  );
}

/* --------------------------------- tables -------------------------------- */

export interface Column<T> {
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
}

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  href,
  empty = "Nothing to show",
}: {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  href?: (row: T) => string;
  empty?: string;
}) {
  const router = useRouter();
  if (!rows.length) return <EmptyState title={empty} />;

  /** With `href`, the whole row opens the record (the first cell stays a real link for keyboards and new tabs). */
  function openRow(e: React.MouseEvent, url: string) {
    const target = e.target as HTMLElement;
    if (target.closest("a, button, input, select, textarea, label, [role=combobox]")) return;
    if (window.getSelection()?.toString()) return; // selecting text, not navigating
    if (e.metaKey || e.ctrlKey) window.open(url, "_blank", "noopener");
    else router.push(url);
  }

  return (
    <div className="overflow-x-auto rounded-[16px] border border-border-stroke bg-white shadow-card">
      <table className="w-full min-w-[640px] text-left text-[13px] tracking-n-2">
        <thead>
          <tr className="border-b border-border-stroke bg-canvas text-[10.5px] uppercase tracking-[0.08em] text-gray-500">
            {columns.map((c) => (
              <th key={c.header} className={cn("px-4 py-3 font-extrabold", c.className)}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={href ? (e) => openRow(e, href(row)) : undefined}
              className={cn("border-b border-border-stroke last:border-0 hover:bg-tertiary/40", href && "cursor-pointer")}
            >
              {columns.map((c, i) => (
                <td key={c.header} className={cn("px-4 py-3 align-top", c.className)}>
                  {href && i === 0 ? (
                    <Link href={href(row)} className="font-bold text-primary hover:underline">
                      {c.cell(row)}
                    </Link>
                  ) : (
                    c.cell(row)
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Pagination({ page, pageSize, total, onPage }: { page: number; pageSize: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return <p className="mt-3 text-[12px] text-gray-500">{total} result{total === 1 ? "" : "s"}</p>;
  return (
    <div className="mt-3 flex items-center justify-between text-[12px] text-gray-500">
      <span>
        {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
      </span>
      <div className="flex gap-2">
        <SmallButton disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Previous
        </SmallButton>
        <span className="px-1 py-1.5">
          Page {page} of {pages}
        </span>
        <SmallButton disabled={page >= pages} onClick={() => onPage(page + 1)}>
          Next
        </SmallButton>
      </div>
    </div>
  );
}

export function FilterBar({ children }: { children: React.ReactNode }) {
  return <div className="mb-4 grid gap-3 rounded-[16px] border border-border-stroke bg-white p-4 shadow-card sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(150px,1fr))]">{children}</div>;
}

/* -------------------------------- controls ------------------------------- */

export function SmallButton({
  children,
  onClick,
  disabled,
  tone = "default",
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tone?: "default" | "primary" | "danger";
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "h-9 whitespace-nowrap rounded-[10px] border px-3.5 text-[12.5px] font-bold transition disabled:cursor-not-allowed disabled:opacity-50",
        tone === "primary" && "border-primary bg-primary text-white hover:bg-primary-dark",
        tone === "danger" && "border-red-200 bg-white text-red-600 hover:bg-red-50",
        tone === "default" && "border-border-stroke bg-white text-black hover:border-primary",
      )}
    >
      {children}
    </button>
  );
}

/** Open modals, innermost last: Escape and focus belong to the top one. */
const modalStack: symbol[] = [];

/**
 * Dialog rendered in a portal, so it can open from inside another modal (e.g.
 * the image picker inside the vehicle-type form) and still sit on top.
 */
export function Modal({
  open,
  title,
  onClose,
  children,
  wide,
  size,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
  size?: "md" | "lg" | "xl";
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    const id = Symbol("modal");
    modalStack.push(id);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && modalStack[modalStack.length - 1] === id) {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      modalStack.splice(modalStack.indexOf(id), 1);
      if (!modalStack.length) document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);
  if (!open || !mounted) return null;
  const width = size === "xl" ? "max-w-5xl" : size === "lg" || wide ? "max-w-2xl" : "max-w-md";
  return createPortal(
    <div
      className="fixed inset-0 z-[900] flex items-start justify-center overflow-y-auto bg-ink/45 p-4 pt-[6vh] backdrop-blur-[2px]"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div role="dialog" aria-modal aria-label={title} className={cn("w-full rounded-[20px] bg-white shadow-xl", width)}>
        <header className="flex items-center justify-between border-b border-border-stroke px-5 py-3.5">
          <h2 className="font-display text-[15px] font-extrabold text-ink">{title}</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="text-[22px] leading-none text-gray-400 hover:text-black">
            ×
          </button>
        </header>
        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

/* --------------------------------- chart --------------------------------- */

/** Minimal bar chart (inline SVG, no chart library). */
export function BarChart({
  data,
  format = (v) => String(v),
  color = "var(--color-primary)",
  height = 160,
}: {
  data: { label: string; value: number }[];
  format?: (v: number) => string;
  color?: string;
  height?: number;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const w = 100 / data.length;
  return (
    <div>
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }} role="img" aria-label="Bar chart">
        {data.map((d, i) => {
          const h = (d.value / max) * (height - 4);
          return (
            <rect key={d.label} x={i * w + w * 0.15} y={height - h} width={w * 0.7} height={Math.max(h, d.value ? 1 : 0)} rx={0.6} fill={color} opacity={0.85}>
              <title>{`${d.label}: ${format(d.value)}`}</title>
            </rect>
          );
        })}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-gray-400">
        <span>{data[0]?.label}</span>
        <span>{data[Math.floor(data.length / 2)]?.label}</span>
        <span>{data.at(-1)?.label}</span>
      </div>
    </div>
  );
}

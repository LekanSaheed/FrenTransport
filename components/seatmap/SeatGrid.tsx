"use client";
import React from "react";
import { cn } from "@/libs/utils";

/*
 * Draws a vehicle's seat layout: row 0 is the front, each row can hold a
 * different number of seats, and the driver's cell is marked. A column that
 * has no seats in the middle rows is drawn narrower so it reads as an aisle.
 *
 * Purely presentational: callers decide each seat's look (`tone`) and whether
 * it can be clicked. Used by checkout (SeatMap), the admin trip page and the
 * admin layout builder.
 */

export interface GridGeometry {
  rows: number;
  columns: number;
  driver: { row: number; column: number } | null;
}

export type SeatTone = "available" | "selected" | "taken" | "booked" | "held" | "blocked" | "editable" | "empty";

export interface GridSeat {
  key: string;
  label: React.ReactNode;
  row: number;
  column: number;
  tone: SeatTone;
  /** Clickable when set. */
  onClick?: () => void;
  disabled?: boolean;
  pressed?: boolean;
  ariaLabel?: string;
  title?: string;
  /** Adds a highlight ring (e.g. admin multi-select). */
  ring?: boolean;
}

const TONE: Record<SeatTone, string> = {
  available: "border-border-stroke bg-white text-ink hover:-translate-y-0.5 hover:border-primary hover:text-primary",
  selected: "border-accent border-b-[#c9520f] bg-accent text-white",
  taken: "cursor-not-allowed border-gray-200 bg-gray-200 text-gray-400 line-through",
  booked: "border-ink border-b-black bg-ink text-white",
  held: "border-amber-300 bg-amber-100 text-amber-800",
  blocked: "border-gray-300 bg-[repeating-linear-gradient(135deg,#eef0f4_0_6px,#dfe3ea_6px_12px)] text-gray-500",
  editable: "border-primary/30 bg-white text-primary hover:border-primary",
  empty: "border-dashed border-gray-300 bg-transparent text-transparent hover:border-primary/60 hover:bg-primary/5",
};

/**
 * Columns that hold no passenger seat between the front and back rows. The
 * driver's column keeps full width so the driver cell isn't squeezed.
 */
export function aisleColumns(geo: GridGeometry, seats: { row: number; column: number }[]): Set<number> {
  const aisles = new Set<number>();
  if (geo.rows < 3) return aisles;
  for (let c = 0; c < geo.columns; c++) {
    if (geo.driver?.column === c) continue;
    const middle = seats.some((s) => s.column === c && s.row > 0 && s.row < geo.rows - 1);
    if (!middle) aisles.add(c);
  }
  // A grid that is all aisle isn't useful; fall back to equal columns.
  return aisles.size === geo.columns ? new Set() : aisles;
}

export function SteeringWheel({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className}>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="2.2" fill="currentColor" />
      <path d="M3.5 10.5h6.3M14.2 10.5h6.3M12 14.2V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function SeatGrid({
  geometry,
  seats,
  emptyCells,
  size = "md",
  className,
  label = "Seat map",
}: {
  geometry: GridGeometry;
  seats: GridSeat[];
  /** Builder only: clickable placeholders for cells without a seat. */
  emptyCells?: (row: number, column: number) => GridSeat | null;
  size?: "sm" | "md";
  className?: string;
  label?: string;
}) {
  const aisles = aisleColumns(geometry, seats);
  const template = Array.from({ length: geometry.columns }, (_, c) => (aisles.has(c) && !emptyCells ? "var(--aisle)" : "var(--seat)")).join(" ");
  const byCell = new Map(seats.map((s) => [`${s.row}:${s.column}`, s]));
  const isDriver = (r: number, c: number) => geometry.driver?.row === r && geometry.driver?.column === c;

  return (
    <div
      className={cn(
        "relative mx-auto w-fit rounded-t-[44px] rounded-b-[22px] border-2 border-border-stroke bg-canvas px-4 pt-3 pb-4",
        size === "sm" ? "[--aisle:26px] [--seat:34px]" : "[--aisle:30px] [--seat:40px] sm:[--aisle:34px] sm:[--seat:46px]",
        className,
      )}
    >
      {/* Windscreen */}
      <div aria-hidden className="mx-auto mb-3 h-2 w-3/4 rounded-full bg-gradient-to-r from-primary/10 via-primary/25 to-primary/10" />
      <p className="sr-only">Front of the vehicle is at the top.</p>
      <div role="group" aria-label={label} className="grid gap-2" style={{ gridTemplateColumns: template }}>
        {Array.from({ length: geometry.rows }, (_, r) =>
          Array.from({ length: geometry.columns }, (_, c) => {
            const key = `${r}:${c}`;
            if (isDriver(r, c)) {
              return (
                <div
                  key={key}
                  title="Driver"
                  aria-label="Driver"
                  className="flex h-[var(--seat)] items-center justify-center rounded-[10px] bg-ink text-white/80"
                >
                  <SteeringWheel className="h-[55%] w-[55%]" />
                </div>
              );
            }
            const seat = byCell.get(key) ?? emptyCells?.(r, c) ?? null;
            if (!seat) return <div key={key} aria-hidden />;
            const Tag = seat.onClick ? "button" : "div";
            return (
              <Tag
                key={key}
                {...(seat.onClick && { type: "button" as const, onClick: seat.onClick, disabled: seat.disabled, "aria-pressed": seat.pressed })}
                aria-label={seat.ariaLabel}
                title={seat.title}
                className={cn(
                  "flex h-[var(--seat)] items-center justify-center rounded-t-[12px] rounded-b-[6px] border-2 border-b-4 font-extrabold transition",
                  size === "sm" ? "text-[11px]" : "text-[13px]",
                  TONE[seat.tone],
                  seat.ring && "ring-3 ring-accent ring-offset-2 ring-offset-canvas",
                  !seat.onClick && seat.tone === "available" && "hover:translate-y-0 hover:border-border-stroke hover:text-ink",
                )}
              >
                {seat.label}
              </Tag>
            );
          }),
        )}
      </div>
    </div>
  );
}

export function Legend({ items }: { items: { tone: SeatTone; label: string }[] }) {
  return (
    <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[12px] text-gray-500">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5">
          <span className={cn("inline-block h-3.5 w-3.5 rounded-[4px] border-2", TONE[i.tone])} />
          {i.label}
        </span>
      ))}
    </div>
  );
}

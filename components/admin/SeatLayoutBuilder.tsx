"use client";
import React from "react";
import { HiMiniArrowDown, HiMiniArrowUp, HiMiniXMark } from "react-icons/hi2";
import SeatGrid, { type GridSeat } from "@/components/seatmap/SeatGrid";
import { Select } from "@/components/ui/form";
import { cn } from "@/libs/utils";
import type { SeatLayout } from "@/libs/admin";

/*
 * Visual seat-layout editor for vehicle types. The admin picks a grid width,
 * the driver's side and the aisle, then builds rows: the front row holds the
 * driver plus 1 or 2 seats, later rows hold any number of seats. Clicking a
 * cell adds or removes a seat. Seats are numbered front to back, left to
 * right, unless given a custom label.
 */

export interface LayoutDraft {
  columns: number;
  driverSide: "left" | "right";
  /** Column kept free in preset rows (null: no aisle). */
  aisle: number | null;
  /** rows[r][c] is true when there's a passenger seat. Row 0 is the front. */
  rows: boolean[][];
  /** Custom labels keyed by "row:column". */
  labels: Record<string, string>;
}

const key = (r: number, c: number) => `${r}:${c}`;
const driverColumn = (d: Pick<LayoutDraft, "columns" | "driverSide">) => (d.driverSide === "left" ? 0 : d.columns - 1);
const defaultAisle = (columns: number) => (columns === 4 ? 0 : columns >= 5 ? Math.floor(columns / 2) : null);

/** Front row: the driver plus `n` seats on the far side. */
function frontRow(d: Pick<LayoutDraft, "columns" | "driverSide">, n: number): boolean[] {
  const row = Array<boolean>(d.columns).fill(false);
  const dc = driverColumn(d);
  for (let i = 0; i < n; i++) row[dc === 0 ? d.columns - 1 - i : i] = true;
  return row;
}

/** A row of `n` seats that leaves the aisle free when it can. */
function seatRow(d: Pick<LayoutDraft, "columns" | "aisle">, n: number): boolean[] {
  const row = Array<boolean>(d.columns).fill(false);
  if (n >= d.columns) return row.fill(true);
  const cols = Array.from({ length: d.columns }, (_, c) => c).filter((c) => c !== d.aisle);
  const use = n > cols.length ? Array.from({ length: d.columns }, (_, c) => c) : cols;
  use.slice(use.length - n).forEach((c) => (row[c] = true));
  return row;
}

function make(columns: number, driverSide: "left" | "right", aisle: number | null, front: number, rows: number[]): LayoutDraft {
  const base = { columns, driverSide, aisle, labels: {} };
  return { ...base, rows: [frontRow(base, front), ...rows.map((n) => seatRow(base, n))] };
}

export const TEMPLATES: { id: string; label: string; build: () => LayoutDraft }[] = [
  { id: "hiace14", label: "Hiace · 14 seats (driver + 2, rows of 3)", build: () => make(4, "left", 0, 2, [3, 3, 3, 3]) },
  { id: "hiace15", label: "Hiace · 15 seats (rows of 3, back row of 4)", build: () => make(4, "left", 0, 2, [3, 3, 3, 4]) },
  { id: "hiace12", label: "Hiace · 12 seats (driver + 1, rows of 3, back of 2)", build: () => make(4, "left", 0, 1, [3, 3, 3, 2]) },
  {
    id: "sienna6",
    label: "Sienna · 6 seats",
    build: () => ({ columns: 3, driverSide: "left", aisle: 1, labels: {}, rows: [[false, false, true], [true, false, true], [true, true, true]] }),
  },
  { id: "sedan4", label: "Sedan · 4 seats", build: () => make(3, "left", null, 1, [3]) },
  { id: "coaster30", label: "Coaster · 30 seats (2 + aisle + 2)", build: () => make(5, "left", 2, 1, [4, 4, 4, 4, 4, 4, 5]) },
];

export const defaultDraft = () => TEMPLATES[0]!.build();

/** Seats in reading order with their final labels. */
export function draftSeats(d: LayoutDraft) {
  const seats: { label: string; row: number; column: number; auto: string }[] = [];
  let n = 0;
  d.rows.forEach((cells, r) =>
    cells.forEach((isSeat, c) => {
      if (!isSeat || (r === 0 && c === driverColumn(d))) return;
      const auto = String(++n);
      seats.push({ label: d.labels[key(r, c)]?.trim() || auto, row: r, column: c, auto });
    }),
  );
  return seats;
}

export function draftToLayout(d: LayoutDraft): SeatLayout {
  return {
    rows: d.rows.length,
    columns: d.columns,
    driver: { row: 0, column: driverColumn(d) },
    seats: draftSeats(d).map(({ label, row, column }) => ({ label, row, column })),
  };
}

/** Rebuilds an editable draft from a stored layout (for "Duplicate"). */
export function layoutToDraft(l: SeatLayout): LayoutDraft {
  const driver = l.driver ?? { row: 0, column: 0 };
  const rows = Array.from({ length: l.rows }, () => Array<boolean>(l.columns).fill(false));
  for (const s of l.seats) if (rows[s.row]) rows[s.row]![s.column] = true;
  const draft: LayoutDraft = { columns: l.columns, driverSide: driver.column === 0 ? "left" : "right", aisle: defaultAisle(l.columns), rows, labels: {} };
  const autos = new Map(draftSeats(draft).map((s) => [key(s.row, s.column), s.auto]));
  for (const s of l.seats) if (autos.get(key(s.row, s.column)) !== s.label) draft.labels[key(s.row, s.column)] = s.label;
  return draft;
}

/** Problems that would make the backend reject the layout. */
export function draftProblems(d: LayoutDraft): string[] {
  const seats = draftSeats(d);
  const problems: string[] = [];
  if (seats.length === 0) problems.push("Add at least one passenger seat.");
  const seen = new Set<string>();
  for (const s of seats) {
    if (s.label.length > 5) problems.push(`Label "${s.label}" is longer than 5 characters.`);
    if (seen.has(s.label)) problems.push(`Label "${s.label}" is used twice.`);
    seen.add(s.label);
  }
  if (d.rows.length > 20) problems.push("A layout can have at most 20 rows.");
  return [...new Set(problems)];
}

export default function SeatLayoutBuilder({ value, onChange }: { value: LayoutDraft; onChange: (d: LayoutDraft) => void }) {
  const [mode, setMode] = React.useState<"seats" | "labels">("seats");
  const d = value;
  const dc = driverColumn(d);
  const seats = draftSeats(d);
  const problems = draftProblems(d);

  const update = (patch: Partial<LayoutDraft>) => onChange({ ...d, ...patch });

  function setColumns(columns: number) {
    const resize = (row: boolean[]) => Array.from({ length: columns }, (_, c) => row[c] ?? false);
    const next = { ...d, columns, aisle: defaultAisle(columns), labels: {} };
    const rows = d.rows.map(resize);
    rows[0] = frontRow(next, Math.min(seatsInRow(0), columns - 1));
    onChange({ ...next, rows });
  }

  function setDriverSide(side: "left" | "right") {
    if (side === d.driverSide) return;
    // Mirror the whole layout so the cabin keeps its shape.
    onChange({ ...d, driverSide: side, labels: {}, rows: d.rows.map((row) => [...row].reverse()), aisle: d.aisle === null ? null : d.columns - 1 - d.aisle });
  }

  const seatsInRow = (r: number) => (d.rows[r] ?? []).filter((x, c) => x && !(r === 0 && c === dc)).length;

  function toggle(r: number, c: number) {
    const rows = d.rows.map((row) => [...row]);
    rows[r]![c] = !rows[r]![c];
    const labels = { ...d.labels };
    delete labels[key(r, c)];
    update({ rows, labels });
  }

  function moveRow(r: number, by: -1 | 1) {
    const rows = [...d.rows];
    [rows[r], rows[r + by]] = [rows[r + by]!, rows[r]!];
    update({ rows, labels: {} });
  }

  const removeRow = (r: number) => update({ rows: d.rows.filter((_, i) => i !== r), labels: {} });
  const addRow = (n: number) => update({ rows: [...d.rows, seatRow(d, n)] });

  const gridSeats: GridSeat[] = seats.map((s) => ({
    key: key(s.row, s.column),
    row: s.row,
    column: s.column,
    tone: "editable",
    ...(mode === "seats"
      ? { label: s.label, onClick: () => toggle(s.row, s.column), ariaLabel: `Seat ${s.label}: click to remove`, title: "Click to remove this seat" }
      : {
          label: (
            <input
              aria-label={`Label for seat ${s.auto}`}
              value={d.labels[key(s.row, s.column)] ?? s.label}
              maxLength={5}
              onChange={(e) => update({ labels: { ...d.labels, [key(s.row, s.column)]: e.target.value } })}
              className="h-full w-full rounded-[inherit] bg-transparent text-center outline-none focus:bg-tertiary"
            />
          ),
        }),
  }));

  return (
    <div className="rounded-[14px] border border-border-stroke bg-white p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <LabeledControl label="Start from">
          <Select
            aria-label="Start from a template"
            value=""
            placeholder="Choose a template…"
            options={TEMPLATES.map((t) => ({ value: t.id, label: t.label }))}
            onValueChange={(id) => onChange(TEMPLATES.find((t) => t.id === id)!.build())}
          />
        </LabeledControl>
        <LabeledControl label="Grid width">
          <Select
            aria-label="Grid width"
            value={d.columns}
            options={[2, 3, 4, 5, 6].map((n) => ({ value: String(n), label: `${n} columns` }))}
            onValueChange={(v) => setColumns(Number(v))}
          />
        </LabeledControl>
        <LabeledControl label="Driver side">
          <Segmented
            value={d.driverSide}
            options={[
              { value: "left", label: "Left" },
              { value: "right", label: "Right" },
            ]}
            onChange={(v) => setDriverSide(v as "left" | "right")}
          />
        </LabeledControl>
        <LabeledControl label="Aisle (for new rows)">
          <Select
            aria-label="Aisle column"
            value={d.aisle === null ? "none" : String(d.aisle)}
            options={[{ value: "none", label: "No aisle" }, ...Array.from({ length: d.columns }, (_, c) => ({ value: String(c), label: `Column ${c + 1}` }))]}
            onValueChange={(v) => update({ aisle: v === "none" ? null : Number(v) })}
          />
        </LabeledControl>
      </div>

      <div className="mt-5 grid gap-6 md:grid-cols-[auto_1fr] md:items-start">
        <div>
          <div className="mb-3 flex justify-center">
            <Segmented
              value={mode}
              options={[
                { value: "seats", label: "Edit seats" },
                { value: "labels", label: "Edit labels" },
              ]}
              onChange={(v) => setMode(v as "seats" | "labels")}
            />
          </div>
          <SeatGrid
            geometry={{ rows: d.rows.length, columns: d.columns, driver: { row: 0, column: dc } }}
            seats={gridSeats}
            label="Seat layout editor"
            emptyCells={
              mode === "seats"
                ? (r, c) => ({ key: key(r, c), row: r, column: c, label: "+", tone: "empty", onClick: () => toggle(r, c), ariaLabel: `Add a seat in row ${r + 1}, column ${c + 1}`, title: "Click to add a seat" })
                : undefined
            }
          />
          <p className="mt-2 text-center text-[11.5px] text-gray-500">
            {mode === "seats" ? "Click a seat to remove it, or a + to add one." : "Type a label, or clear it to use the number."}
          </p>
        </div>

        <div>
          <p className="font-display text-[15px] font-extrabold text-ink">
            {seats.length} passenger seat{seats.length === 1 ? "" : "s"} · {d.rows.length} row{d.rows.length === 1 ? "" : "s"}
          </p>
          <ol className="mt-3 space-y-1.5">
            {d.rows.map((_, r) => (
              <li key={r} className="flex items-center justify-between gap-2 rounded-[10px] bg-canvas px-3 py-2 text-[13px]">
                <span>
                  <strong>{r === 0 ? "Front" : r === d.rows.length - 1 && r > 1 ? "Back" : `Row ${r + 1}`}</strong>
                  <span className="text-gray-500"> · {r === 0 ? `driver + ${seatsInRow(0)}` : `${seatsInRow(r)} seat${seatsInRow(r) === 1 ? "" : "s"}`}</span>
                </span>
                {r === 0 ? (
                  <span className="flex gap-1">
                    {[1, 2].filter((n) => n < d.columns).map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => update({ rows: [frontRow(d, n), ...d.rows.slice(1)], labels: {} })}
                        className={cn("rounded-full px-2.5 py-1 text-[11.5px] font-bold", seatsInRow(0) === n ? "bg-primary text-white" : "bg-white text-gray-600 hover:text-primary")}
                      >
                        + {n}
                      </button>
                    ))}
                  </span>
                ) : (
                  <span className="flex gap-0.5 text-gray-500">
                    <IconButton label={`Move row ${r + 1} forward`} disabled={r === 1} onClick={() => moveRow(r, -1)} icon={HiMiniArrowUp} />
                    <IconButton label={`Move row ${r + 1} back`} disabled={r === d.rows.length - 1} onClick={() => moveRow(r, 1)} icon={HiMiniArrowDown} />
                    <IconButton label={`Remove row ${r + 1}`} onClick={() => removeRow(r)} icon={HiMiniXMark} danger />
                  </span>
                )}
              </li>
            ))}
          </ol>
          <p className="mt-4 text-[12px] font-bold text-gray-600">Add a row</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {Array.from({ length: d.columns }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                disabled={d.rows.length >= 20}
                onClick={() => addRow(n)}
                className="rounded-[10px] border border-border-stroke bg-white px-3 py-1.5 text-[12.5px] font-bold text-ink hover:border-primary hover:text-primary disabled:opacity-40"
              >
                {n} seat{n === 1 ? "" : "s"}
              </button>
            ))}
          </div>
          {problems.length > 0 && (
            <ul role="alert" className="mt-4 space-y-1 text-[12.5px] font-semibold text-red-600">
              {problems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function LabeledControl({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[12.5px] font-bold text-gray-700">{label}</span>
      {children}
    </div>
  );
}

function Segmented({ value, options, onChange }: { value: string; options: { value: string; label: string }[]; onChange: (v: string) => void }) {
  return (
    <div role="radiogroup" className="flex h-12 rounded-[12px] bg-canvas p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn("flex-1 whitespace-nowrap rounded-[9px] px-3 text-[13px] font-bold transition", value === o.value ? "bg-white text-primary shadow-card" : "text-gray-500 hover:text-ink")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function IconButton({
  label,
  icon: Icon,
  onClick,
  disabled,
  danger,
}: {
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn("rounded-[6px] p-1 transition hover:bg-white disabled:opacity-30", danger ? "hover:text-red-600" : "hover:text-primary")}
    >
      <Icon size={16} />
    </button>
  );
}

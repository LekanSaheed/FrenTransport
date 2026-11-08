"use client";
import React from "react";
import SeatGrid, { Legend, type GridGeometry, type GridSeat } from "@/components/seatmap/SeatGrid";
import type { SeatCell } from "@/libs/types";

interface Props {
  rows: number | null;
  columns: number | null;
  driver?: { row: number; column: number } | null;
  seats: SeatCell[];
  selected: string[];
  max: number;
  onToggle: (label: string) => void;
}

/** Without a stored layout, seats flow into rows of four behind a front-left driver. */
function fallback(seats: SeatCell[]): { geometry: GridGeometry; positions: Map<string, { row: number; column: number }> } {
  const positions = new Map<string, { row: number; column: number }>();
  seats.forEach((s, i) => {
    const slot = i + 1; // slot 0 is the driver
    positions.set(s.label, { row: Math.floor(slot / 4), column: slot % 4 });
  });
  return { geometry: { rows: Math.ceil((seats.length + 1) / 4), columns: 4, driver: { row: 0, column: 0 } }, positions };
}

/**
 * Seat picker. Availability shown here is a hint; the backend re-checks every
 * seat atomically when the booking is created.
 */
export default function SeatMap({ rows, columns, driver, seats, selected, max, onToggle }: Props) {
  const hasLayout = !!rows && !!columns && seats.every((s) => s.row != null && s.column != null);
  const { geometry, positions } = hasLayout
    ? {
        geometry: { rows: rows!, columns: columns!, driver: driver ?? { row: 0, column: 0 } },
        positions: new Map(seats.map((s) => [s.label, { row: s.row!, column: s.column! }])),
      }
    : fallback(seats);

  const cells: GridSeat[] = seats.map((s) => {
    const isSelected = selected.includes(s.label);
    const full = !isSelected && selected.length >= max;
    return {
      key: s.label,
      label: s.label,
      ...positions.get(s.label)!,
      tone: !s.available ? "taken" : isSelected ? "selected" : "available",
      onClick: () => onToggle(s.label),
      disabled: !s.available,
      pressed: isSelected,
      ariaLabel: `Seat ${s.label}${s.available ? "" : ", unavailable"}${full && s.available ? ", deselect a seat first" : ""}`,
    };
  });

  return (
    <div>
      <SeatGrid geometry={geometry} seats={cells} label="Choose your seats" />
      <Legend
        items={[
          { tone: "available", label: "Available" },
          { tone: "selected", label: "Selected" },
          { tone: "taken", label: "Taken" },
        ]}
      />
    </div>
  );
}

import React from "react";
import { cn } from "@/libs/utils";
import type { SelectGroup } from "@/components/ui/form";
import type { TripPhase, VehicleRow } from "@/libs/admin";

const PHASE: Record<TripPhase, { label: string; className: string }> = {
  upcoming: { label: "Upcoming", className: "bg-emerald-50 text-emerald-700" },
  departed: { label: "Departed", className: "bg-primary/10 text-primary" },
  completed: { label: "Completed", className: "bg-gray-100 text-gray-600" },
  cancelled: { label: "Cancelled", className: "bg-red-50 text-red-600" },
};

/** Trip status as admins think of it (an upcoming trip is the only kind you can change). */
export function TripPhaseBadge({ phase }: { phase: TripPhase }) {
  const p = PHASE[phase];
  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap", p.className)}>{p.label}</span>;
}

/**
 * Vehicles that can run a scheduled trip: active, and their type has a seat map
 * (car-hire types without one can't sell seats). Grouped by vehicle type.
 * `keepId` keeps the trip's current vehicle listed even if it no longer qualifies.
 */
export function tripVehicleOptions(vehicles: VehicleRow[], keepId?: string | null): SelectGroup[] {
  const usable = vehicles.filter((v) => v.id === keepId || (v.status === "active" && v.category.hasSeatMap));
  const groups = new Map<string, SelectGroup>();
  for (const v of usable) {
    const key = `${v.category.name} · ${v.category.capacity} seats`;
    const g = groups.get(key) ?? { label: key, options: [] };
    g.options.push({
      value: v.id,
      label: `${v.plateNumber}${v.status !== "active" ? ` (${v.status})` : ""}`,
      selectedLabel: `${v.plateNumber} — ${v.category.name} (${v.category.capacity} seats)`,
      textValue: v.plateNumber,
    });
    groups.set(key, g);
  }
  return [...groups.values()].sort((a, b) => a.label.localeCompare(b.label));
}

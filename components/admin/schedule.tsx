"use client";
import React from "react";
import Link from "next/link";
import { HiMiniArrowLongRight, HiOutlineMapPin, HiOutlineTruck } from "react-icons/hi2";
import { Panel } from "@/components/admin/ui";
import { Alert } from "@/components/ui/feedback";
import { formatDateTime } from "@/libs/format";
import { cn } from "@/libs/utils";
import type { ApiError } from "@/libs/api";
import type { ContinuityProblem, ScheduleIssues, TimetableLeg, VehicleRow } from "@/libs/admin";

/* ------------------------- location conflicts (forms) ------------------------- */

/** The location problems behind a LOCATION_MISMATCH error, or null for other errors. */
export function continuityProblems(err: unknown): ContinuityProblem[] | null {
  const e = err as ApiError;
  if (e?.code !== "LOCATION_MISMATCH") return null;
  return ((e.details as { problems?: ContinuityProblem[] })?.problems ?? []) as ContinuityProblem[];
}

/**
 * Shown when a vehicle won't be where a trip starts (or needs to be next).
 * The admin can accept that it travels there empty, then save again.
 */
export function RepositionPrompt({ problems, accepted, onAccept }: { problems: ContinuityProblem[]; accepted: boolean; onAccept: (v: boolean) => void }) {
  return (
    <Alert tone="warning" title="The vehicle won't be in the right place">
      <ul className="mt-1 list-disc space-y-1 pl-4">
        {problems.map((p) => (
          <li key={p.message}>{p.message}</li>
        ))}
      </ul>
      <label className="mt-3 flex items-start gap-2 font-semibold">
        <input type="checkbox" className="mt-0.5" checked={accepted} onChange={(e) => onAccept(e.target.checked)} />
        It will travel there empty. I&apos;ll arrange the repositioning. Save anyway.
      </label>
    </Alert>
  );
}

/* -------------------------------- vehicle cells -------------------------------- */

/** "In Owerri", "On the road to Lagos (until 16:00)", "Unknown". */
export function VehicleWhere({ v }: { v: Pick<VehicleRow, "location" | "nextTrip" | "mismatch"> }) {
  const l = v.location;
  return (
    <div className="leading-tight">
      {l.status === "en_route" ? (
        <p className="flex items-center gap-1.5 font-bold text-primary">
          <HiOutlineTruck size={15} /> To {l.place?.city ?? "?"}
        </p>
      ) : l.status === "at" ? (
        <p className="flex items-center gap-1.5 font-bold text-ink">
          <HiOutlineMapPin size={15} className="text-accent" /> {l.place?.city ?? "?"}
          {"atHome" in l && l.atHome && <span className="text-[11px] font-semibold text-gray-400">(home)</span>}
        </p>
      ) : (
        <p className="text-gray-400">Unknown</p>
      )}
      <p className="mt-0.5 text-[11.5px] text-gray-500">
        {l.status === "en_route" ? `arrives ${formatDateTime(l.until)}` : l.status === "at" && l.since ? `since ${formatDateTime(l.since)}` : " "}
      </p>
      {v.mismatch && v.nextTrip && (
        <p className="mt-1 text-[11.5px] font-bold text-orange-600">Next trip starts in {v.nextTrip.from?.city}</p>
      )}
    </div>
  );
}

/* ------------------------------- timetable text ------------------------------- */

/** "Day 1 07:00 Lagos → Owerri · Day 2 07:00 Owerri → Lagos". */
export function LegsSummary({ legs, cycleDays, returnsEmpty }: { legs: TimetableLeg[]; cycleDays: number; returnsEmpty?: boolean }) {
  return (
    <ol className="space-y-0.5 text-[12.5px]">
      {legs.map((l, i) => (
        <li key={i} className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="w-[74px] shrink-0 font-semibold text-gray-500">
            {cycleDays > 1 ? `Day ${l.day + 1} ` : ""}
            {l.time}
          </span>
          {l.from} <HiMiniArrowLongRight className="text-gray-400" /> {l.to}
        </li>
      ))}
      {returnsEmpty && <li className="pl-[80px] text-[11.5px] text-gray-400">then returns empty</li>}
    </ol>
  );
}

export function cycleLabel(cycleDays: number) {
  return cycleDays === 1 ? "Every day" : `Every ${cycleDays} days`;
}

/* ------------------------------- issues overview ------------------------------- */

/** Everything in the coming schedule that needs attention. */
export function ScheduleIssuesPanel({ data }: { data: ScheduleIssues }) {
  if (data.total === 0) {
    return (
      <Alert tone="success" title="Schedule looks good">
        Every vehicle&apos;s trips line up, timetables filled every slot, and every active route has departures in the next {data.coverageDays} days.
      </Alert>
    );
  }
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <IssueList
        title="Location conflicts"
        empty="Every vehicle's next trip starts where it will be."
        items={data.conflicts.map((c) => ({
          key: c.tripId,
          href: `/admin/trips/${c.tripId}`,
          main: `${c.vehicle}: ${c.from} → ${c.to}`,
          sub: `${formatDateTime(c.departureAt)} · vehicle will be in ${c.vehicleCity}`,
        }))}
      />
      <IssueList
        title="Timetable gaps"
        empty="Timetables filled every slot."
        items={data.gaps.map((g, i) => ({ key: `${g.timetableId}-${i}`, href: `/admin/timetables?open=${g.timetableId}`, main: `${g.route} · ${formatDateTime(g.departureAt)}`, sub: `${g.timetable}: ${g.message}` }))}
      />
      <IssueList
        title={`No departures in ${data.coverageDays} days`}
        empty="Every active route has upcoming departures."
        items={data.uncoveredRoutes.map((r) => ({ key: r.routeId, main: `${r.from} → ${r.to}`, sub: "Add it to a timetable or schedule trips" }))}
      />
    </div>
  );
}

function IssueList({ title, empty, items }: { title: string; empty: string; items: { key: string; href?: string; main: string; sub: string }[] }) {
  return (
    <Panel
      title={
        <span className="flex items-center gap-2">
          {title}
          <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-extrabold", items.length ? "bg-accent text-white" : "bg-emerald-50 text-emerald-700")}>{items.length}</span>
        </span>
      }
    >
      {items.length === 0 ? (
        <p className="text-[13px] text-gray-500">{empty}</p>
      ) : (
        <ul className="max-h-[260px] space-y-1 overflow-y-auto">
          {items.map((i) => {
            const body = (
              <>
                <p className="text-[13px] font-bold text-ink">{i.main}</p>
                <p className="text-[12px] text-gray-500">{i.sub}</p>
              </>
            );
            return (
              <li key={i.key}>
                {i.href ? (
                  <Link href={i.href} className="block rounded-[10px] px-2 py-1.5 hover:bg-canvas">
                    {body}
                  </Link>
                ) : (
                  <div className="px-2 py-1.5">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

/** One-line summary with a link, for pages that aren't about scheduling. */
export function ScheduleIssuesBanner({ data }: { data: ScheduleIssues | null }) {
  if (!data || data.total === 0) return null;
  const parts = [
    data.conflicts.length && `${data.conflicts.length} location conflict${data.conflicts.length > 1 ? "s" : ""}`,
    data.gaps.length && `${data.gaps.length} timetable gap${data.gaps.length > 1 ? "s" : ""}`,
    data.uncoveredRoutes.length && `${data.uncoveredRoutes.length} route${data.uncoveredRoutes.length > 1 ? "s" : ""} without departures`,
  ].filter(Boolean);
  return (
    <Alert tone="warning" className="mb-4">
      <span className="font-bold">Schedule needs attention:</span> {parts.join(" · ")}.{" "}
      <Link href="/admin/timetables" className="font-bold underline underline-offset-2">
        Review
      </Link>
    </Alert>
  );
}

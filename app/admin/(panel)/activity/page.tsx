"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPage, DataState, DataTable, FilterBar, Pagination } from "@/components/admin/ui";
import { Select } from "@/components/ui/form";
import { useAdminData, type ActivityRow, type Paged } from "@/libs/admin";
import { formatDateTime } from "@/libs/format";

const TARGETS = [
  ["", "Everything"],
  ["booking", "Bookings"],
  ["trip", "Trips"],
  ["route", "Routes"],
  ["vehicle", "Vehicles"],
  ["payment", "Payments"],
  ["user", "Customers"],
  ["settings", "Settings"],
] as const;

function targetLink(a: ActivityRow) {
  if (!a.targetId) return null;
  const href =
    a.targetType === "booking" ? `/admin/bookings/${a.targetId}` : a.targetType === "trip" ? `/admin/trips/${a.targetId}` : a.targetType === "payment" ? `/admin/payments/${a.targetId}` : a.targetType === "user" ? `/admin/customers/${a.targetId}` : null;
  return href ? <Link href={href} className="text-primary">{a.targetType === "booking" || a.targetType === "payment" ? a.targetId : "Open"}</Link> : null;
}

export default function ActivityPage() {
  const [targetType, setTargetType] = useState("");
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [targetType]);
  const { data, error, loading } = useAdminData<Paged<ActivityRow>>("/activity", { targetType: targetType || undefined, page, pageSize: 30 });

  return (
    <AdminPage title="Activity log" description="Append-only record of admin actions and sign-ins: who did what, when and from where.">
      <FilterBar>
        <Select aria-label="Filter by area" value={targetType} onChange={(e) => setTargetType(e.target.value)}>
          {TARGETS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </Select>
      </FilterBar>
      <DataState loading={loading} error={error} hasData={!!data}>
        {data && (
          <>
            <DataTable
              rows={data.items}
              rowKey={(a) => a._id ?? a.id ?? a.createdAt}
              empty="No activity"
              columns={[
                { header: "When", cell: (a) => <span className="whitespace-nowrap">{formatDateTime(a.createdAt)}</span> },
                { header: "What", cell: (a) => <div><p>{a.summary}</p><p className="text-[11px] text-gray-400">{a.action}</p></div> },
                { header: "Who", cell: (a) => (typeof a.actor === "object" && a.actor ? a.actor.fullName : a.actorRole === "system" ? "System" : a.actorRole ?? "—") },
                { header: "Item", cell: (a) => targetLink(a) ?? "—" },
                { header: "IP", cell: (a) => <span className="text-[12px] text-gray-500">{a.ip ?? "—"}</span> },
              ]}
            />
            <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} />
          </>
        )}
      </DataState>
    </AdminPage>
  );
}

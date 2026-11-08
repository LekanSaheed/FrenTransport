"use client";
import Link from "next/link";
import { AdminPage, BarChart, DataState, DataTable, Panel, StatCard } from "@/components/admin/ui";
import { PaymentBadge, StatusBadge } from "@/components/ui/feedback";
import { useAdminData, type Overview } from "@/libs/admin";
import { BOOKING_TYPE_LABEL, formatDateTime, naira } from "@/libs/format";
import type { BookingType } from "@/libs/types";

const shortDate = (iso: string) => new Date(`${iso}T12:00:00+01:00`).toLocaleDateString("en-NG", { day: "numeric", month: "short" });

export default function OverviewPage() {
  const { data, error, loading, reload } = useAdminData<Overview>("/overview");
  const o = data;

  return (
    <AdminPage
      title="Overview"
      description={o ? `Updated ${formatDateTime(o.generatedAt)}` : undefined}
      actions={
        <button onClick={reload} className="h-9 rounded-[8px] border border-border-stroke bg-white px-3 text-[12px] font-semibold hover:border-primary">
          Refresh
        </button>
      }
    >
      <DataState loading={loading} error={error} hasData={!!o}>
        {o && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatCard label="Total bookings" value={o.totals.bookings} hint={`${o.totals.today} today`} />
              <StatCard label="Upcoming (confirmed)" value={o.totals.upcoming} tone="primary" hint={`${o.next24h.trips} departures in 24h`} />
              <StatCard label="Pending" value={o.totals.pending} tone="warning" hint={`${o.totals.awaitingQuote} awaiting a quote`} />
              <StatCard label="Completed" value={o.totals.completed} hint={`${o.totals.cancelled} cancelled · ${o.totals.expired} expired`} />
              <StatCard label="Net revenue" value={naira(o.revenue.netKobo)} tone="success" hint={`${naira(o.revenue.grossKobo)} received · ${naira(o.revenue.refundedKobo)} refunded`} />
              <StatCard label="Pending payments" value={naira(o.pendingPayments.amountKobo)} hint={`${o.pendingPayments.count} booking(s) awaiting payment`} />
              <StatCard label="Next 24 hours" value={`${o.next24h.seatsSold}/${o.next24h.seats}`} hint={`seats sold on ${o.next24h.trips} trip(s)`} />
              <StatCard
                label="By type"
                value={<span className="text-[15px]">{Object.entries(o.byType).map(([k, n]) => `${BOOKING_TYPE_LABEL[k as BookingType] ?? k}: ${n}`).join(" · ") || "—"}</span>}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Panel title="Bookings — last 30 days">
                <BarChart data={o.series.map((d) => ({ label: shortDate(d.date), value: d.bookings }))} format={(v) => `${v} booking(s)`} />
              </Panel>
              <Panel title="Payments received — last 30 days">
                <BarChart data={o.series.map((d) => ({ label: shortDate(d.date), value: d.revenueKobo }))} format={(v) => naira(v)} color="var(--color-primary)" />
              </Panel>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
              <Panel title="Recent bookings" actions={<Link href="/admin/bookings" className="text-[12px] font-semibold text-primary">View all</Link>}>
                <DataTable
                  rows={o.recentBookings}
                  rowKey={(b) => b.reference}
                  href={(b) => `/admin/bookings/${b.reference}`}
                  empty="No bookings yet"
                  columns={[
                    { header: "Reference", cell: (b) => b.reference },
                    { header: "Customer", cell: (b) => b.customerName },
                    { header: "Trip / request", cell: (b) => <span className="text-gray-600">{b.title}</span> },
                    { header: "Status", cell: (b) => <div className="flex flex-col gap-1"><StatusBadge status={b.status} /><PaymentBadge status={b.paymentStatus} /></div> },
                  ]}
                />
              </Panel>
              <Panel title="Recent activity" actions={<Link href="/admin/activity" className="text-[12px] font-semibold text-primary">View all</Link>}>
                {o.recentActivity.length === 0 ? (
                  <p className="text-[13px] text-gray-500">No activity yet.</p>
                ) : (
                  <ol className="space-y-3">
                    {o.recentActivity.map((a, i) => (
                      <li key={a.id ?? i} className="text-[13px]">
                        <p className="text-black">{a.summary}</p>
                        <p className="text-[11px] text-gray-500">{formatDateTime(a.createdAt)}</p>
                      </li>
                    ))}
                  </ol>
                )}
              </Panel>
            </div>
          </div>
        )}
      </DataState>
    </AdminPage>
  );
}

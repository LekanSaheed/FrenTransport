"use client";
import React, { useEffect, useState } from "react";
import { AdminPage, DataState, DataTable, FilterBar, Pagination, StatCard } from "@/components/admin/ui";
import { Input, Select } from "@/components/ui/form";
import { useAdminData, type Paged, type PaymentRow } from "@/libs/admin";
import { formatDateTime, naira } from "@/libs/format";

const STATUS_STYLE: Record<PaymentRow["status"], string> = {
  success: "text-emerald-700",
  failed: "text-red-600",
  pending: "text-primary",
  initialized: "text-gray-500",
};

export default function PaymentsPage() {
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [provider, setProvider] = useState("");
  const [refundStatus, setRefundStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  useEffect(() => {
    const t = setTimeout(() => setSearch(q), 350);
    return () => clearTimeout(t);
  }, [q]);
  useEffect(() => setPage(1), [search, status, provider, refundStatus, from, to]);

  const { data, error, loading } = useAdminData<Paged<PaymentRow> & { totals: Record<string, { count: number; amountKobo: number }> }>("/payments", {
    q: search || undefined,
    status: status || undefined,
    provider: provider || undefined,
    refundStatus: refundStatus || undefined,
    from: from || undefined,
    to: to || undefined,
    page,
    pageSize: 25,
  });

  return (
    <AdminPage title="Payments" description="Every payment attempt. Records are read-only: a payment only succeeds when Paystack confirms it, or an offline payment is recorded with evidence.">
      <FilterBar>
        <Input aria-label="Search payments" placeholder="Payment or booking reference, email" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="success">Successful</option>
          <option value="failed">Failed</option>
          <option value="pending">Pending</option>
        </Select>
        <Select aria-label="Provider" value={provider} onChange={(e) => setProvider(e.target.value)}>
          <option value="">All channels</option>
          <option value="paystack">Paystack</option>
          <option value="offline">Offline</option>
        </Select>
        <Select aria-label="Refunds" value={refundStatus} onChange={(e) => setRefundStatus(e.target.value)}>
          <option value="">Any refund state</option>
          <option value="requested">Refund requested</option>
          <option value="pending">Refund pending</option>
          <option value="processed">Refunded</option>
          <option value="failed">Refund failed</option>
        </Select>
        <Input aria-label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input aria-label="To" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
      </FilterBar>
      <DataState loading={loading} error={error} hasData={!!data}>
        {data && (
          <>
            <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatCard label="Successful" value={naira(data.totals.success?.amountKobo ?? 0)} hint={`${data.totals.success?.count ?? 0} payment(s)`} tone="success" />
              <StatCard label="Failed" value={data.totals.failed?.count ?? 0} hint="attempts" />
              <StatCard label="Pending" value={data.totals.pending?.count ?? 0} hint="checkouts open" />
              <StatCard label="Matching" value={data.total} hint="with these filters" />
            </div>
            <DataTable
              rows={data.items}
              rowKey={(p) => p.reference}
              href={(p) => `/admin/payments/${p.reference}`}
              empty="No payments match"
              columns={[
                { header: "Payment", cell: (p) => p.reference },
                { header: "Booking", cell: (p) => p.bookingReference },
                { header: "Customer", cell: (p) => <span className="text-gray-600">{p.email}</span> },
                { header: "Amount", cell: (p) => <strong>{naira(p.amountKobo)}</strong> },
                { header: "Channel", cell: (p) => <span className="capitalize">{p.provider}{p.channel ? ` · ${p.channel.replace("_", " ")}` : ""}</span> },
                { header: "Date", cell: (p) => formatDateTime(p.paidAt ?? p.createdAt) },
                {
                  header: "Status",
                  cell: (p) => (
                    <div>
                      <span className={`font-semibold capitalize ${STATUS_STYLE[p.status]}`}>{p.status}</span>
                      {p.failureReason && <p className="text-[11px] text-gray-500">{p.failureReason}</p>}
                      {p.refunds.map((r, i) => (
                        <p key={i} className="text-[11px] text-orange-700">
                          Refund {naira(r.amountKobo)} · {r.status}
                        </p>
                      ))}
                    </div>
                  ),
                },
              ]}
            />
            <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} />
          </>
        )}
      </DataState>
    </AdminPage>
  );
}

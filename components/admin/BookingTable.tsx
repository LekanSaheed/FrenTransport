"use client";
import React, { useEffect, useState } from "react";
import { DataState, DataTable, FilterBar, Pagination } from "@/components/admin/ui";
import { Input, Select } from "@/components/ui/form";
import { PaymentBadge, StatusBadge } from "@/components/ui/feedback";
import { useAdminData, type BookingRow, type Paged } from "@/libs/admin";
import { BOOKING_STATUS_LABEL, BOOKING_TYPE_LABEL, formatDateTime, naira, PAYMENT_STATUS_LABEL } from "@/libs/format";

/** Debounces a text value so typing in the search box doesn't fire a request per key. */
function useDebounced<T>(value: T, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/**
 * Searchable, filterable booking list. Used for all bookings and (with
 * `hireOnly`) for hire requests, so both behave identically.
 */
export default function BookingTable({ hireOnly, initialStatus = "" }: { hireOnly?: boolean; initialStatus?: string }) {
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState(initialStatus);
  const [paymentStatus, setPaymentStatus] = useState("");
  const [travelFrom, setTravelFrom] = useState("");
  const [travelTo, setTravelTo] = useState("");
  const [page, setPage] = useState(1);
  const search = useDebounced(q);

  useEffect(() => setPage(1), [search, type, status, paymentStatus, travelFrom, travelTo]);

  const { data, error, loading } = useAdminData<Paged<BookingRow>>(hireOnly ? "/hire-requests" : "/bookings", {
    q: search || undefined,
    type: type || undefined,
    status: status || undefined,
    paymentStatus: paymentStatus || undefined,
    travelFrom: travelFrom || undefined,
    travelTo: travelTo || undefined,
    page,
    pageSize: 20,
  });

  const types = hireOnly ? (["car_hire", "bus_hire"] as const) : (["seat", "car_hire", "bus_hire"] as const);

  return (
    <>
      <FilterBar>
        <Input aria-label="Search" placeholder="Reference, name, email or phone" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select aria-label="Type" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All types</option>
          {types.map((t) => (
            <option key={t} value={t}>
              {BOOKING_TYPE_LABEL[t]}
            </option>
          ))}
        </Select>
        <Select aria-label="Booking status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {Object.entries(BOOKING_STATUS_LABEL).map(([k, l]) => (
            <option key={k} value={k}>
              {l}
            </option>
          ))}
        </Select>
        <Select aria-label="Payment status" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
          <option value="">All payments</option>
          {Object.entries(PAYMENT_STATUS_LABEL).map(([k, l]) => (
            <option key={k} value={k}>
              {l}
            </option>
          ))}
        </Select>
        <Input aria-label="Travel from" type="date" title="Travel from" value={travelFrom} onChange={(e) => setTravelFrom(e.target.value)} />
        <Input aria-label="Travel to" type="date" title="Travel to" value={travelTo} onChange={(e) => setTravelTo(e.target.value)} />
      </FilterBar>

      <DataState loading={loading} error={error} hasData={!!data}>
        {data && (
          <>
            <div className={loading ? "opacity-60 transition" : "transition"}>
              <DataTable
                rows={data.items}
                rowKey={(b) => b.reference}
                href={(b) => `/admin/bookings/${b.reference}`}
                empty={hireOnly ? "No hire requests match" : "No bookings match"}
                columns={[
                  { header: "Reference", cell: (b) => b.reference },
                  {
                    header: "Customer",
                    cell: (b) => (
                      <div>
                        <p className="font-semibold">{b.customer.fullName}</p>
                        <p className="text-[12px] text-gray-500">{b.customer.email}</p>
                      </div>
                    ),
                  },
                  {
                    header: hireOnly ? "Request" : "Trip / request",
                    cell: (b) => (
                      <div>
                        <p>{b.title}</p>
                        <p className="text-[12px] text-gray-500">
                          {BOOKING_TYPE_LABEL[b.type]}
                          {b.seats?.length ? ` · seat ${b.seats.join(", ")}` : ""}
                        </p>
                      </div>
                    ),
                  },
                  { header: "Travel", cell: (b) => formatDateTime(b.travelDate) },
                  {
                    header: hireOnly ? "Quote" : "Amount",
                    cell: (b) =>
                      hireOnly && b.quotation ? (
                        <div>
                          <p className="font-semibold">{naira(b.quotation.amountKobo)}</p>
                          <p className="text-[12px] capitalize text-gray-500">{b.quotation.status}</p>
                        </div>
                      ) : b.amountKobo != null ? (
                        naira(b.amountKobo)
                      ) : (
                        <span className="text-gray-400">Not quoted</span>
                      ),
                  },
                  {
                    header: "Status",
                    cell: (b) => (
                      <div className="flex flex-col items-start gap-1">
                        <StatusBadge status={b.status} />
                        <PaymentBadge status={b.paymentStatus} />
                        {b.cancellationRequested && <span className="text-[11px] font-semibold text-orange-600">Cancellation requested</span>}
                        {b.openModificationRequests > 0 && <span className="text-[11px] font-semibold text-orange-600">{b.openModificationRequests} change request(s)</span>}
                      </div>
                    ),
                  },
                ]}
              />
            </div>
            <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} />
          </>
        )}
      </DataState>
    </>
  );
}

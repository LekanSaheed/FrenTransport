"use client";
import React, { useEffect, useState } from "react";
import { AdminPage, DataState, DataTable, FilterBar, Pagination } from "@/components/admin/ui";
import { Input, Select } from "@/components/ui/form";
import { useAdminData, type CustomerRow, type Paged } from "@/libs/admin";
import { formatDate, naira } from "@/libs/format";

export default function CustomersPage() {
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [verified, setVerified] = useState("");
  const [page, setPage] = useState(1);
  useEffect(() => {
    const t = setTimeout(() => setSearch(q), 350);
    return () => clearTimeout(t);
  }, [q]);
  useEffect(() => setPage(1), [search, status, verified]);

  const { data, error, loading } = useAdminData<Paged<CustomerRow>>("/customers", {
    q: search || undefined,
    status: status || undefined,
    verified: verified || undefined,
    page,
    pageSize: 25,
  });

  return (
    <AdminPage title="Customers" description="Registered customer accounts. Guests who never signed up appear only on their bookings.">
      <FilterBar>
        <Input aria-label="Search customers" placeholder="Name, email or phone" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select aria-label="Account status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All accounts</option>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
        </Select>
        <Select aria-label="Email verification" value={verified} onChange={(e) => setVerified(e.target.value)}>
          <option value="">Verified or not</option>
          <option value="true">Email verified</option>
          <option value="false">Not verified</option>
        </Select>
      </FilterBar>
      <DataState loading={loading} error={error} hasData={!!data}>
        {data && (
          <>
            <DataTable
              rows={data.items}
              rowKey={(c) => c.id}
              href={(c) => `/admin/customers/${c.id}`}
              empty="No customers match"
              columns={[
                { header: "Name", cell: (c) => c.fullName },
                { header: "Email", cell: (c) => <span>{c.email}{c.emailVerified ? "" : <span className="ml-1 text-[11px] text-orange-600">(unverified)</span>}</span> },
                { header: "Phone", cell: (c) => c.phone ?? "—" },
                { header: "Bookings", cell: (c) => c.bookings },
                { header: "Spent", cell: (c) => naira(c.spentKobo) },
                { header: "Joined", cell: (c) => formatDate(c.createdAt) },
                { header: "Status", cell: (c) => (c.status === "active" ? <span className="text-emerald-700">Active</span> : <span className="font-semibold text-red-600">Disabled</span>) },
              ]}
            />
            <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} />
          </>
        )}
      </DataState>
    </AdminPage>
  );
}

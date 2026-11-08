"use client";
import React, { useEffect, useState } from "react";
import { useCan } from "@/components/admin/access";
import Link from "next/link";
import Button from "@/components/Button";
import { AdminPage, DataState, Panel, TabPanel, Tabs, useTabState } from "@/components/admin/ui";
import CitiesManager from "@/components/admin/CitiesManager";
import { Field, Input } from "@/components/ui/form";
import { Alert } from "@/components/ui/feedback";
import { DetailList } from "@/components/ui/layout";
import { adminApi, useAdminData, type SettingsData } from "@/libs/admin";
import { formatDateTime } from "@/libs/format";
import type { ApiError } from "@/libs/api";

type Editable = Pick<SettingsData, "booking" | "cancellation" | "hire" | "contact">;

export default function SettingsPage() {
  const can = useCan();
  const canGeneral = can("settings.manage");
  const canPlaces = can("network.manage");
  // Only owners load (and may change) the general settings.
  const { data, error, loading, setData } = useAdminData<SettingsData>(canGeneral ? "/settings" : null);
  const [form, setForm] = useState<Editable | null>(null);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useTabState(["general", "places"] as const, canGeneral ? "general" : "places");

  useEffect(() => {
    if (data) setForm({ booking: { ...data.booking }, cancellation: { ...data.cancellation }, hire: { ...data.hire }, contact: { ...data.contact } });
  }, [data]);

  const num = <S extends "booking" | "cancellation" | "hire">(section: S, key: keyof Editable[S]) => ({
    type: "number",
    value: String(form?.[section][key] ?? ""),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => f && { ...f, [section]: { ...f[section], [key]: Number(e.target.value) } }),
  });
  const text = (key: keyof Editable["contact"]) => ({
    value: form?.contact[key] ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => f && { ...f, contact: { ...f.contact, [key]: e.target.value } }),
  });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form || !data) return;
    // Only send what changed, so the audit log shows exactly what was edited.
    const patch: Record<string, Record<string, unknown>> = {};
    for (const section of ["booking", "cancellation", "hire", "contact"] as const) {
      for (const [k, v] of Object.entries(form[section])) {
        if ((data[section] as Record<string, unknown>)[k] !== v) (patch[section] ??= {})[k] = v;
      }
    }
    if (!Object.keys(patch).length) return;
    setBusy(true);
    setSaveError(null);
    setSaved(false);
    try {
      const after = await adminApi.patch<Editable>("/settings", patch);
      setData({ ...data, ...after, updatedAt: new Date().toISOString() });
      setSaved(true);
    } catch (err) {
      const e2 = err as ApiError;
      const fields = Object.entries(e2.fieldErrors).map(([k, m]) => `${k}: ${m}`);
      setSaveError(fields.length ? fields.join("; ") : e2.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminPage title="Settings" description={data?.updatedAt ? `Last changed ${formatDateTime(data.updatedAt)}. Every change is recorded in the activity log.` : "Every change is recorded in the activity log."}>
      <Tabs
        label="Settings sections"
        idBase="settings"
        value={tab}
        onChange={setTab}
        tabs={[
          ...(canGeneral ? [{ id: "general" as const, label: "General" }] : []),
          ...(canPlaces ? [{ id: "places" as const, label: "States & cities" }] : []),
        ]}
      />
      {tab === "places" || !canGeneral ? (
        <TabPanel id="places" idBase="settings">
          <CitiesManager />
        </TabPanel>
      ) : (
      <TabPanel id="general" idBase="settings">
      <DataState loading={loading} error={error} hasData={!!data && !!form}>
        {form && data && (
          <form onSubmit={save} className="space-y-4">
            {saved && <Alert tone="success">Settings saved. They apply to new bookings immediately.</Alert>}
            {saveError && <Alert tone="error">{saveError}</Alert>}
            <div className="grid gap-4 lg:grid-cols-2">
              <Panel title="Booking">
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="Seat hold (minutes)" htmlFor="hold" hint="5–60">
                    <Input id="hold" min={5} max={60} {...num("booking", "seatHoldMinutes")} />
                  </Field>
                  <Field label="Online cutoff (minutes)" htmlFor="cutoff" hint="Before departure">
                    <Input id="cutoff" min={0} max={1440} {...num("booking", "bookingCutoffMinutes")} />
                  </Field>
                  <Field label="Quote validity (hours)" htmlFor="qv">
                    <Input id="qv" min={1} max={336} {...num("booking", "quoteValidityHours")} />
                  </Field>
                </div>
              </Panel>
              <Panel title="Cancellation policy">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Refund window (hours before travel)" htmlFor="rw">
                    <Input id="rw" min={0} max={336} {...num("cancellation", "refundWindowHours")} />
                  </Field>
                  <Field label="Refund (%) inside the window" htmlFor="rp" hint="Outside it, no refund">
                    <Input id="rp" min={0} max={100} {...num("cancellation", "refundPercent")} />
                  </Field>
                </div>
              </Panel>
              <Panel title="Private hire">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Car: minimum notice (hours)" htmlFor="cl">
                    <Input id="cl" min={0} max={168} {...num("hire", "carMinLeadHours")} />
                  </Field>
                  <Field label="Bus: minimum notice (hours)" htmlFor="bl">
                    <Input id="bl" min={0} max={336} {...num("hire", "busMinLeadHours")} />
                  </Field>
                </div>
                <p className="mt-2 text-[12px] text-gray-500">
                  Hire prices are set per vehicle type on the <Link href="/admin/vehicles" className="text-primary">Vehicles</Link> page.
                </p>
              </Panel>
              <Panel title="Contact details">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Support email" htmlFor="se" hint="Shown in emails">
                    <Input id="se" type="email" {...text("supportEmail")} />
                  </Field>
                  <Field label="Support phone" htmlFor="sp">
                    <Input id="sp" {...text("supportPhone")} />
                  </Field>
                  <Field label="Staff alert email" htmlFor="ae" hint="New paid bookings, hire requests, cancellation and change requests. Leave empty to turn off." className="sm:col-span-2">
                    <Input id="ae" type="email" {...text("adminNotificationEmail")} />
                  </Field>
                </div>
              </Panel>
            </div>
            <div className="flex justify-end">
              <Button type="submit" label="Save settings" loading={busy} />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Panel title="Payments (read-only)">
                <DetailList
                  rows={[
                    ["Provider", <span key="p" className="capitalize">{data.payments.provider}</span>],
                    [
                      "Mode",
                      data.payments.mode === "live" ? (
                        <span key="m" className="text-emerald-700">Live</span>
                      ) : data.payments.mode === "test" ? (
                        <span key="m" className="text-orange-600">Test</span>
                      ) : (
                        <span key="m" className="text-red-600">Not configured</span>
                      ),
                    ],
                    ["Webhook path", <code key="w" className="text-[12px]">{data.payments.webhookPath}</code>],
                  ]}
                />
                <p className="mt-2 text-[12px] text-gray-500">API keys are set in the server environment and are never shown or editable here.</p>
              </Panel>
              <Panel title="Email (read-only)">
                <DetailList
                  rows={[
                    ["Provider", "Resend"],
                    ["Status", data.email.configured ? <span key="s" className="text-emerald-700">Sending</span> : <span key="s" className="text-orange-600">Not configured (emails are logged only)</span>],
                    ["From", data.email.from],
                  ]}
                />
              </Panel>
            </div>
            <p className="text-[12px] text-gray-500">
              Routes and terminals are managed on <Link href="/admin/routes" className="text-primary">Routes &amp; terminals</Link>.
            </p>
          </form>
        )}
      </DataState>
      </TabPanel>
      )}
    </AdminPage>
  );
}

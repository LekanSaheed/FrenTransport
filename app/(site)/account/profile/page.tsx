"use client";
import React, { useState } from "react";
import Button from "@/components/Button";
import { VerifyEmailBanner } from "@/components/account/AccountWidgets";
import { Field, Input } from "@/components/ui/form";
import { Alert } from "@/components/ui/feedback";
import { Card, DetailList, SectionTitle } from "@/components/ui/layout";
import { customerApi, useCustomer } from "@/libs/customer";
import type { ApiError } from "@/libs/api";

const message = (e: unknown) => {
  const err = e as ApiError;
  const fields = Object.values(err.fieldErrors ?? {});
  return fields.length ? fields.join(" ") : err.message;
};

export default function ProfilePage() {
  const { user } = useCustomer();
  if (!user) return null;
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="lg:col-span-2">
        <VerifyEmailBanner user={user} />
      </div>
      <DetailsForm key={user.id} fullName={user.fullName} phone={user.phone ?? ""} email={user.email} verified={user.emailVerified} />
      <PasswordForm />
    </div>
  );
}

function DetailsForm({ fullName, phone, email, verified }: { fullName: string; phone: string; email: string; verified: boolean }) {
  const [form, setForm] = useState({ fullName, phone });
  const [state, setState] = useState<{ busy: boolean; ok?: string; error?: string }>({ busy: false });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState({ busy: true });
    try {
      await customerApi.updateProfile({ fullName: form.fullName, phone: form.phone || null });
      setState({ busy: false, ok: "Details saved." });
    } catch (err) {
      setState({ busy: false, error: message(err) });
    }
  }

  return (
    <Card>
      <SectionTitle>Your details</SectionTitle>
      <form onSubmit={submit} className="space-y-4">
        {state.ok && <Alert tone="success">{state.ok}</Alert>}
        {state.error && <Alert tone="error">{state.error}</Alert>}
        <DetailList rows={[["Email", `${email}${verified ? " ✓ confirmed" : " (not confirmed)"}`]]} />
        <Field label="Full name" htmlFor="name">
          <Input id="name" autoComplete="name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required minLength={2} />
        </Field>
        <Field label="Phone number" htmlFor="phone" hint="Used to pre-fill your bookings.">
          <Input id="phone" type="tel" autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </Field>
        <Button type="submit" label="Save details" loading={state.busy} />
      </form>
    </Card>
  );
}

function PasswordForm() {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [state, setState] = useState<{ busy: boolean; ok?: string; error?: string }>({ busy: false });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.next !== form.confirm) return setState({ busy: false, error: "The new passwords don't match." });
    setState({ busy: true });
    try {
      const r = await customerApi.changePassword(form.current, form.next);
      setForm({ current: "", next: "", confirm: "" });
      setState({ busy: false, ok: r.message });
    } catch (err) {
      setState({ busy: false, error: message(err) });
    }
  }

  return (
    <Card>
      <SectionTitle>Change password</SectionTitle>
      <form onSubmit={submit} className="space-y-4">
        {state.ok && <Alert tone="success">{state.ok}</Alert>}
        {state.error && <Alert tone="error">{state.error}</Alert>}
        <Field label="Current password" htmlFor="cur">
          <Input id="cur" type="password" autoComplete="current-password" value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} required />
        </Field>
        <Field label="New password" htmlFor="new" hint="At least 8 characters. Other devices will be signed out.">
          <Input id="new" type="password" autoComplete="new-password" value={form.next} onChange={(e) => setForm({ ...form, next: e.target.value })} required minLength={8} />
        </Field>
        <Field label="Confirm new password" htmlFor="conf">
          <Input id="conf" type="password" autoComplete="new-password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} required />
        </Field>
        <Button type="submit" label="Update password" loading={state.busy} />
      </form>
    </Card>
  );
}

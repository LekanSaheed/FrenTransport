"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/Button";
import { Field, Input } from "@/components/ui/form";
import { Alert } from "@/components/ui/feedback";
import { adminApi } from "@/libs/admin";
import type { ApiError } from "@/libs/api";
import AdminAuthFrame from "./AdminAuthFrame";

const MIN = 12;

/** Opened from the invitation email: choose a password, then go straight in. */
export default function AcceptInvite() {
  const router = useRouter();
  const params = useSearchParams();
  // Read the one-time token once, then drop it from the address bar and history.
  const [token] = useState(() => params.get("token") ?? "");
  useEffect(() => {
    if (token) window.history.replaceState(null, "", window.location.pathname);
  }, [token]);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const mismatch = confirm.length > 0 && confirm !== password;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) return setError("The passwords don't match.");
    setBusy(true);
    setError(null);
    try {
      await adminApi.acceptInvite(token, password);
      router.replace("/admin");
    } catch (err) {
      setError((err as ApiError).message);
      setBusy(false);
    }
  }

  return (
    <AdminAuthFrame>
      {!token ? (
        <div className="space-y-3 rounded-[22px] bg-white p-7 shadow-lift">
          <h1 className="font-display text-[22px] font-black text-ink">Invitation link needed</h1>
          <p className="text-[13.5px] text-gray-600">Open the link from your invitation email. If it has expired, ask an owner to resend it.</p>
          <Link href="/admin/login" className="inline-block text-[13px] font-bold text-primary hover:underline">
            Go to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4 rounded-[22px] bg-white p-7 shadow-lift">
          <div>
            <h1 className="font-display text-[22px] font-black text-ink">Join the admin team</h1>
            <p className="text-[13px] text-gray-500">Choose a password for your staff account. You&apos;ll be signed in straight away.</p>
          </div>
          {error && <Alert tone="error">{error}</Alert>}
          <Field label="New password" htmlFor="password" hint={`At least ${MIN} characters. A short sentence works well.`}>
            <Input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={MIN} required autoFocus />
          </Field>
          <Field label="Confirm password" htmlFor="confirm" error={mismatch ? "Doesn't match" : undefined}>
            <Input id="confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} invalid={mismatch} required />
          </Field>
          <Button type="submit" fullWidth label="Set password and sign in" loading={busy} disabled={password.length < MIN || mismatch} />
        </form>
      )}
    </AdminAuthFrame>
  );
}

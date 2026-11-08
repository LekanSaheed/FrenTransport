"use client";
import React, { useState } from "react";
import AdminAuthFrame from "./AdminAuthFrame";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/Button";
import { Field, Input } from "@/components/ui/form";
import { Alert } from "@/components/ui/feedback";
import { adminApi } from "@/libs/admin";
import type { ApiError } from "@/libs/api";

/** Only redirect back inside the admin area (no open redirects). */
function safeNext(next: string | null) {
  return next && next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin";
}

export default function AdminLogin() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await adminApi.login(email, password);
      router.replace(safeNext(params.get("next")));
    } catch (err) {
      setError((err as ApiError).message);
      setLoading(false);
    }
  }

  return (
    <AdminAuthFrame>
        <form onSubmit={submit} className="space-y-4 rounded-[22px] bg-white p-7 shadow-lift">
          <div>
            <h1 className="font-display text-[22px] font-black text-ink">Staff sign in</h1>
            <p className="text-[13px] text-gray-500">For Obere Transport administrators only.</p>
          </div>
          {error && <Alert tone="error">{error}</Alert>}
          <Field label="Email" htmlFor="email">
            <Input id="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </Field>
          <Field label="Password" htmlFor="password">
            <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </Field>
          <Button type="submit" fullWidth label="Sign in" loading={loading} />
          <p className="text-center text-[12px] text-gray-500">No account? Ask an owner to invite you from the Staff page.</p>
        </form>
    </AdminAuthFrame>
  );
}

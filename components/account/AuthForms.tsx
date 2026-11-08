"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/Button";
import { Field, Input } from "@/components/ui/form";
import { Alert, LoadingBlock } from "@/components/ui/feedback";
import { customerApi, safeNext } from "@/libs/customer";
import type { ApiError } from "@/libs/api";

function AuthCard({ title, subtitle, children, footer }: { title: string; subtitle?: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[440px] py-8 md:py-14">
      <div className="relative overflow-hidden rounded-[24px] border border-border-stroke bg-white p-7 shadow-lift md:p-9">
        <span aria-hidden className="lane-line absolute inset-x-0 top-0" />
        <h1 className="font-display text-[26px] font-black tracking-n-2 text-ink">{title}</h1>
        {subtitle && <p className="mt-1.5 text-[14px] leading-[155%] text-gray-500">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
      {footer && <div className="mt-5 text-center text-[14px] text-gray-600">{footer}</div>}
    </div>
  );
}

function errorText(err: unknown) {
  const e = err as ApiError;
  const fields = Object.values(e.fieldErrors ?? {});
  return fields.length ? fields.join(" ") : e.message;
}

/** Reads a one-time token from the URL once, then removes it from the address bar and history. */
function useUrlToken() {
  const params = useSearchParams();
  const [token] = useState(() => params.get("token") ?? "");
  useEffect(() => {
    if (token) window.history.replaceState(null, "", window.location.pathname);
  }, [token]);
  return token;
}

/* -------------------------------- sign in -------------------------------- */

export function LoginForm() {
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
      await customerApi.login(email, password);
      router.replace(safeNext(params.get("next")));
    } catch (err) {
      setError(errorText(err));
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Sign in"
      subtitle="See all your trips in one place, pay, and manage bookings without codes."
      footer={
        <>
          New here?{" "}
          <Link href={`/register${params.get("next") ? `?next=${encodeURIComponent(params.get("next")!)}` : ""}`} className="font-semibold text-primary">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        <Field label="Email address" htmlFor="email">
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        </Field>
        <Field label="Password" htmlFor="password">
          <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </Field>
        <div className="text-right text-[13px]">
          <Link href="/forgot-password" className="font-semibold text-primary">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" fullWidth label="Sign in" loading={loading} />
        <p className="text-center text-[12px] text-gray-500">
          You can still book and{" "}
          <Link href="/booking-status" className="text-primary">
            check a booking
          </Link>{" "}
          without an account.
        </p>
      </form>
    </AuthCard>
  );
}

/* ------------------------------- register -------------------------------- */

export function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "", confirm: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) return setError("The passwords don't match.");
    setLoading(true);
    setError(null);
    try {
      await customerApi.register({ fullName: form.fullName, email: form.email, password: form.password, ...(form.phone && { phone: form.phone }) });
      router.replace(safeNext(params.get("next"), "/account?welcome=1"));
    } catch (err) {
      setError(errorText(err));
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Free and quick. Bookings you've already made with this email appear once you confirm it."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        <Field label="Full name" htmlFor="name">
          <Input id="name" autoComplete="name" value={form.fullName} onChange={set("fullName")} required minLength={2} />
        </Field>
        <Field label="Email address" htmlFor="email">
          <Input id="email" type="email" autoComplete="email" value={form.email} onChange={set("email")} required />
        </Field>
        <Field label="Phone number (optional)" htmlFor="phone">
          <Input id="phone" type="tel" autoComplete="tel" value={form.phone} onChange={set("phone")} />
        </Field>
        <Field label="Password" htmlFor="password" hint="At least 8 characters.">
          <Input id="password" type="password" autoComplete="new-password" value={form.password} onChange={set("password")} required minLength={8} />
        </Field>
        <Field label="Confirm password" htmlFor="confirm">
          <Input id="confirm" type="password" autoComplete="new-password" value={form.confirm} onChange={set("confirm")} required />
        </Field>
        <Button type="submit" fullWidth label="Create account" loading={loading} />
      </form>
    </AuthCard>
  );
}

/* ---------------------------- forgot password ---------------------------- */

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      setSent((await customerApi.forgotPassword(email)).message);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Reset your password"
      subtitle="Enter your account email and we'll send you a link to choose a new password."
      footer={
        <Link href="/login" className="font-semibold text-primary">
          Back to sign in
        </Link>
      }
    >
      {sent ? (
        <Alert tone="success" title="Check your email">
          {sent} The link expires in 30 minutes.
        </Alert>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {error && <Alert tone="error">{error}</Alert>}
          <Field label="Email address" htmlFor="email">
            <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </Field>
          <Button type="submit" fullWidth label="Send reset link" loading={loading} />
        </form>
      )}
    </AuthCard>
  );
}

/* ----------------------------- reset password ----------------------------- */

export function ResetPasswordForm() {
  const token = useUrlToken();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) return setError("The passwords don't match.");
    setLoading(true);
    setError(null);
    try {
      await customerApi.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <AuthCard title="Reset link missing">
        <Alert tone="warning">
          This page needs the link from your email. <Link href="/forgot-password" className="underline">Request a new one</Link>.
        </Alert>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Choose a new password">
      {done ? (
        <div className="space-y-4">
          <Alert tone="success" title="Password updated">
            For your security you&apos;ve been signed out everywhere. Sign in with your new password.
          </Alert>
          <Button href="/login" fullWidth label="Sign in" />
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {error && <Alert tone="error">{error}</Alert>}
          <Field label="New password" htmlFor="password" hint="At least 8 characters.">
            <Input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          </Field>
          <Field label="Confirm new password" htmlFor="confirm">
            <Input id="confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          </Field>
          <Button type="submit" fullWidth label="Update password" loading={loading} />
        </form>
      )}
    </AuthCard>
  );
}

/* ------------------------------ verify email ------------------------------ */

export function VerifyEmail() {
  const token = useUrlToken();
  const [result, setResult] = useState<{ ok: true; linked: number } | { ok: false; message: string } | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true; // the link is single-use: never send it twice (e.g. StrictMode)
    customerApi
      .verifyEmail(token)
      .then((u) => setResult({ ok: true, linked: u.linkedBookings }))
      .catch((err) => setResult({ ok: false, message: errorText(err) }));
  }, [token]);

  if (!token) {
    return (
      <AuthCard title="Confirmation link missing">
        <Alert tone="warning">Open the link from your email, or request a new one from your account page.</Alert>
      </AuthCard>
    );
  }
  if (!result) return <LoadingBlock label="Confirming your email…" />;

  return (
    <AuthCard title={result.ok ? "Email confirmed" : "We couldn't confirm your email"}>
      {result.ok ? (
        <div className="space-y-4">
          <Alert tone="success">
            Thanks — your email is confirmed.
            {result.linked > 0 && ` We've added ${result.linked} earlier booking${result.linked > 1 ? "s" : ""} made with this email to your account.`}
          </Alert>
          <Button href="/account" fullWidth label="Go to my account" />
        </div>
      ) : (
        <div className="space-y-4">
          <Alert tone="error">{result.message}</Alert>
          <Button href="/account/profile" variant="secondary" fullWidth label="Send a new link" />
        </div>
      )}
    </AuthCard>
  );
}

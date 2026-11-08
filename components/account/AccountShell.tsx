"use client";
import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Container from "@/components/layout/Container";
import { LoadingBlock } from "@/components/ui/feedback";
import { cn } from "@/libs/utils";
import { customerApi, useCustomer } from "@/libs/customer";

const TABS = [
  { href: "/account", label: "Overview" },
  { href: "/account/bookings", label: "My bookings" },
  { href: "/account/profile", label: "Profile" },
];

/**
 * Customer area chrome. proxy.ts redirects visitors with no session cookie;
 * this confirms the session with the backend (an expired cookie also lands on
 * sign-in). Data calls are authorised by the backend on every request.
 */
export default function AccountShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useCustomer();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [loading, user, router, pathname]);

  if (loading || !user) return <LoadingBlock label="Loading your account…" />;

  const active = (href: string) => (href === "/account" ? pathname === "/account" : pathname.startsWith(href));

  return (
    <Container className="mb-24">
      <div className="mt-4 mb-6 flex flex-wrap items-center justify-between gap-4 rounded-[24px] bg-primary bg-grid px-6 py-7 text-white md:mt-8 md:px-8">
        <div className="flex items-center gap-4">
          <span className="font-display flex h-14 w-14 items-center justify-center rounded-full bg-accent text-[22px] font-black">
            {user.fullName.trim().charAt(0).toUpperCase()}
          </span>
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-white/60">My account</p>
            <h1 className="font-display text-[26px] font-black tracking-n-2">Hello, {user.fullName.split(" ")[0]}</h1>
          </div>
        </div>
        <button
          onClick={async () => {
            await customerApi.logout();
            router.replace("/");
          }}
          className="h-10 rounded-full bg-white/10 px-4 text-[13px] font-bold text-white ring-1 ring-white/20 ring-inset hover:bg-white/20"
        >
          Sign out
        </button>
      </div>
      <nav className="mb-8 flex w-fit max-w-full gap-1 overflow-x-auto rounded-full bg-canvas p-1" aria-label="Account">
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active(t.href) ? "page" : undefined}
            className={cn(
              "whitespace-nowrap rounded-full px-4 py-2 text-[14px] font-bold transition",
              active(t.href) ? "bg-white text-primary shadow-card" : "text-gray-500 hover:text-ink",
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      {children}
    </Container>
  );
}

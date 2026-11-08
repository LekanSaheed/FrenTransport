"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  Bus,
  Car,
  Calendar,
  Element3,
  Gallery,
  HambergerMenu,
  Location,
  LogoutCurve,
  People,
  Receipt2,
  Routing,
  Setting2,
  ShieldTick,
  Ticket,
} from "iconsax-react";
import { cn } from "@/libs/utils";
import { adminApi, type AdminUser, type Permission } from "@/libs/admin";
import { AdminContext } from "./access";
import { LoadingBlock } from "@/components/ui/feedback";

/** Each page and the permissions that open it (any of them). */
const NAV: { href: string; label: string; icon: typeof Element3; perms: Permission[] }[] = [
  { href: "/admin", label: "Overview", icon: Element3, perms: ["overview.view"] },
  { href: "/admin/bookings", label: "Bookings", icon: Ticket, perms: ["bookings.view"] },
  { href: "/admin/hire-requests", label: "Hire requests", icon: Car, perms: ["bookings.view"] },
  { href: "/admin/trips", label: "Trips", icon: Routing, perms: ["trips.view"] },
  { href: "/admin/timetables", label: "Timetables", icon: Calendar, perms: ["trips.view"] },
  { href: "/admin/vehicles", label: "Vehicles", icon: Bus, perms: ["fleet.view"] },
  { href: "/admin/routes", label: "Routes & terminals", icon: Location, perms: ["network.view"] },
  { href: "/admin/gallery", label: "Gallery", icon: Gallery, perms: ["media.manage"] },
  { href: "/admin/customers", label: "Customers", icon: People, perms: ["customers.view"] },
  { href: "/admin/payments", label: "Payments", icon: Receipt2, perms: ["payments.view"] },
  { href: "/admin/staff", label: "Staff", icon: ShieldTick, perms: ["staff.manage"] },
  { href: "/admin/activity", label: "Activity log", icon: Activity, perms: ["activity.view"] },
  { href: "/admin/settings", label: "Settings", icon: Setting2, perms: ["settings.manage", "network.manage"] },
];

const ROLE_LABEL: Record<AdminUser["staffRole"], string> = { owner: "Owner", operations: "Operations", bookings: "Bookings agent", finance: "Finance", viewer: "Viewer" };

/*
 * iconsax-react sets its default colour via `defaultProps`, which React 19 ignores for
 * function components on client renders — so icons here always pass `color` explicitly.
 */

/**
 * Admin chrome + session check. proxy.ts already redirects visitors without a
 * cookie; this confirms the session with the backend (role included) before
 * showing anything, and the backend re-checks on every API call.
 */
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [checked, setChecked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    adminApi
      .me()
      .then(({ user }) => {
        if (!user) router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
        else setUser(user);
      })
      .catch(() => router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`))
      .finally(() => setChecked(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => setMenuOpen(false), [pathname]);

  async function signOut() {
    await adminApi.logout().catch(() => undefined);
    router.replace("/admin/login");
  }

  if (!checked || !user) return <div className="min-h-screen bg-canvas pt-24"><LoadingBlock label="Checking your session…" /></div>;

  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
  const allowed = (item: (typeof NAV)[number]) => item.perms.some((p) => user.permissions.includes(p));
  const nav = NAV.filter(allowed);
  // The page being viewed: the most specific matching section.
  const section = [...NAV].sort((a, b) => b.href.length - a.href.length).find((n) => isActive(n.href));
  const blocked = section && !allowed(section);

  return (
    <AdminContext.Provider value={user}>
      <div className="min-h-screen bg-canvas lg:flex">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-[248px] -translate-x-full bg-ink text-white transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:overflow-y-auto",
            menuOpen && "translate-x-0 shadow-xl",
          )}
        >
          <div className="flex h-16 items-center gap-2.5 border-b border-white/10 px-5">
            <span className="relative h-9 w-8 rounded-[6px] bg-white p-0.5">
              <Image src="/logo.png" alt="Obere Transport" fill sizes="32px" className="object-contain p-0.5" />
            </span>
            <span className="font-display text-[15px] font-black">OBERE</span>
            <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.08em] text-white">Admin</span>
          </div>
          <nav className="space-y-0.5 p-3" aria-label="Admin">
            {nav.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={cn(
                  "relative flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13.5px] font-bold transition",
                  isActive(href)
                    ? "bg-white/10 text-white before:absolute before:top-2 before:bottom-2 before:-left-3 before:w-1 before:rounded-r-full before:bg-accent"
                    : "text-white/60 hover:bg-white/5 hover:text-white",
                )}
              >
                <Icon size={19} color="currentColor" variant={isActive(href) ? "Bulk" : "Linear"} />
                {label}
              </Link>
            ))}
          </nav>
        </aside>
        {menuOpen && <div className="fixed inset-0 z-30 bg-ink/40 backdrop-blur-sm lg:hidden" onClick={() => setMenuOpen(false)} />}

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-border-stroke bg-white/90 px-4 backdrop-blur md:px-6">
            <button className="rounded-[8px] p-1.5 text-gray-700 lg:hidden" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
              <HambergerMenu size={22} color="currentColor" />
            </button>
            <Link href="/" className="hidden text-[12px] font-semibold text-gray-500 hover:text-primary sm:block">
              View website ↗
            </Link>
            <div className="flex items-center gap-3">
              <div className="text-right leading-tight">
                <p className="text-[13px] font-extrabold">{user.fullName}</p>
                <p className="text-[11px] text-gray-500">
                  <span className="font-bold text-primary">{ROLE_LABEL[user.staffRole]}</span> · {user.email}
                </p>
              </div>
              <button onClick={signOut} className="flex items-center gap-1.5 rounded-[10px] border border-border-stroke px-3 py-2 text-[12px] font-bold text-gray-600 hover:border-primary hover:text-primary">
                <LogoutCurve size={16} color="currentColor" />
                Sign out
              </button>
            </div>
          </header>
          <main className="p-4 md:p-8">{blocked ? <NoAccess label={section.label} home={nav[0]?.href} /> : children}</main>
        </div>
      </div>
    </AdminContext.Provider>
  );
}

/** Shown instead of a page the role can't open (the API would refuse its data anyway). */
function NoAccess({ label, home }: { label: string; home?: string }) {
  return (
    <div className="mx-auto mt-10 max-w-md rounded-[20px] border border-border-stroke bg-white p-8 text-center shadow-card">
      <p className="font-display text-[20px] font-black text-ink">No access to {label}</p>
      <p className="mt-2 text-[14px] leading-[160%] text-gray-500">Your role doesn&apos;t include this page. If you need it, ask an owner to change your role.</p>
      {home && (
        <Link href={home} className="mt-5 inline-block rounded-[12px] bg-primary px-5 py-2.5 text-[14px] font-bold text-white hover:bg-primary-dark">
          Go to {NAV.find((n) => n.href === home)?.label ?? "your pages"}
        </Link>
      )}
    </div>
  );
}

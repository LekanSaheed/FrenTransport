"use client";
import React, { createContext, useContext } from "react";
import type { AdminUser, Permission } from "@/libs/admin";

/*
 * What the signed-in staff member may do, for hiding pages and buttons they
 * can't use. This is convenience only: the API checks every request itself.
 */

export const AdminContext = createContext<AdminUser | null>(null);
export const useAdmin = () => useContext(AdminContext);

/** `can("trips.manage")` → whether the signed-in staff member's role allows it. */
export function useCan() {
  const user = useAdmin();
  return (permission: Permission) => !!user?.permissions.includes(permission);
}

/** Renders children only when the role allows `perm` (any of several). */
export function Can({ perm, children, fallback = null }: { perm: Permission | Permission[]; children: React.ReactNode; fallback?: React.ReactNode }) {
  const can = useCan();
  const perms = Array.isArray(perm) ? perm : [perm];
  return <>{perms.some(can) ? children : fallback}</>;
}

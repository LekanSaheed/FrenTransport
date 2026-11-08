"use client";
import Link from "next/link";
import { cn } from "@/libs/utils";
import { useCustomer } from "@/libs/customer";

/** "Sign in" or "My account" in the site navigation. */
export default function AccountLink({ className, onClick }: { className?: string; onClick?: () => void }) {
  const { user, loading } = useCustomer();
  if (loading) return <span className={cn(className, "invisible")}>Sign in</span>;
  return (
    <Link href={user ? "/account" : "/login"} onClick={onClick} className={className}>
      {user ? "My account" : "Sign in"}
    </Link>
  );
}

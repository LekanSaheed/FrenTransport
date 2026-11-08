import React from "react";
import Image from "next/image";

/** Dark full-page frame with the logo, shared by the admin sign-in and invitation pages. */
export default function AdminAuthFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-grid bg-ink p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2">
          <span className="relative h-12 w-11 rounded-[10px] bg-white">
            <Image src="/logo.png" alt="Obere Transport" fill sizes="44px" className="object-contain p-1" priority />
          </span>
          <span className="rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.08em] text-white">Admin</span>
        </div>
        {children}
      </div>
    </div>
  );
}

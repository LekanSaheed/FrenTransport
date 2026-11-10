import type { Metadata } from "next";
import { Suspense } from "react";
import AcceptInvite from "@/components/admin/AcceptInvite";

export const metadata: Metadata = { title: "Join the admin team", robots: { index: false, follow: false } };

export default function AcceptInvitePage() {
  return (
    <Suspense>
      <AcceptInvite />
    </Suspense>
  );
}

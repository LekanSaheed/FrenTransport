import { Suspense } from "react";
import Container from "@/components/layout/Container";
import { PageHeader } from "@/components/ui/layout";
import { LoadingBlock } from "@/components/ui/feedback";
import ManageBooking from "@/components/booking/ManageBooking";
import { pageMetadata } from "@/libs/seo";

export const metadata = pageMetadata({ title: "Manage your booking", path: "/manage", description: "Change passenger names, seats or your travel date, pay, or cancel your Obere Transport booking online." });

export default function ManagePage() {
  return (
    <Container className="mb-24">
      <PageHeader
        title="Manage booking"
        description="View your booking, pay, request a change or cancel. We'll email you a one-time code to confirm it's you."
      />
      <Suspense fallback={<LoadingBlock />}>
        <ManageBooking />
      </Suspense>
    </Container>
  );
}

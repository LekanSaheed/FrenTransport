import { Suspense } from "react";
import Container from "@/components/layout/Container";
import { PageHeader } from "@/components/ui/layout";
import { LoadingBlock } from "@/components/ui/feedback";
import ManageBooking from "@/components/booking/ManageBooking";

export const metadata = { title: "Manage booking | Obere Transport" };

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

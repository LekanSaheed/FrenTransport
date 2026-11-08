import { Suspense } from "react";
import Container from "@/components/layout/Container";
import { LoadingBlock } from "@/components/ui/feedback";
import PaymentResult from "@/components/booking/PaymentResult";

export const metadata = { title: "Payment | Obere Transport" };

export default function PaymentCallbackPage() {
  return (
    <Container className="mb-24 pt-6">
      <Suspense fallback={<LoadingBlock label="Confirming your payment…" />}>
        <PaymentResult />
      </Suspense>
    </Container>
  );
}

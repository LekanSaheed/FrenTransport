import { Suspense } from "react";
import Link from "next/link";
import Container from "@/components/layout/Container";
import { PageHeader } from "@/components/ui/layout";
import { LoadingBlock } from "@/components/ui/feedback";
import SeatCheckout from "@/components/booking/SeatCheckout";
import { pageMetadata } from "@/libs/seo";

export const metadata = pageMetadata({ title: "Checkout", path: "/book", noindex: true });

export default async function TripCheckoutPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  return (
    <Container className="mb-24">
      <Link href="/book" className="mb-3 inline-block text-[13px] font-semibold text-primary">
        ← Back to search
      </Link>
      <PageHeader title="Complete your booking" />
      <Suspense fallback={<LoadingBlock />}>
        <SeatCheckout tripId={tripId} />
      </Suspense>
    </Container>
  );
}

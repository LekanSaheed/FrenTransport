import { Suspense } from "react";
import Container from "@/components/layout/Container";
import { PageHeader } from "@/components/ui/layout";
import { LoadingBlock } from "@/components/ui/feedback";
import TripSearch from "@/components/booking/TripSearch";
import { pageMetadata } from "@/libs/seo";

export const metadata = pageMetadata({ title: "Book a bus seat", path: "/book", description: "Search intercity bus trips across Nigeria, compare departure times and fares, pick your seat and pay online in minutes." });

export default function BookPage() {
  return (
    <Container className="mb-24">
      <PageHeader title="Book a seat" description="Choose your route and travel date to see available departures and fares." />
      <Suspense fallback={<LoadingBlock />}>
        <TripSearch />
      </Suspense>
    </Container>
  );
}

import Container from "@/components/layout/Container";
import { PageHeader } from "@/components/ui/layout";
import BookingStatusCheck from "@/components/booking/BookingStatusCheck";
import { pageMetadata } from "@/libs/seo";

export const metadata = pageMetadata({ title: "Check your booking status", path: "/booking-status", description: "Check the status of your Obere Transport booking with your booking reference and email address." });

export default function BookingStatusPage() {
  return (
    <Container className="mb-24">
      <PageHeader title="Booking status" description="Check the status of any booking — no account needed." />
      <BookingStatusCheck />
    </Container>
  );
}

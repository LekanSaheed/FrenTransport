import Container from "@/components/layout/Container";
import { PageHeader } from "@/components/ui/layout";
import BookingStatusCheck from "@/components/booking/BookingStatusCheck";

export const metadata = { title: "Booking status | Obere Transport" };

export default function BookingStatusPage() {
  return (
    <Container className="mb-24">
      <PageHeader title="Booking status" description="Check the status of any booking — no account needed." />
      <BookingStatusCheck />
    </Container>
  );
}

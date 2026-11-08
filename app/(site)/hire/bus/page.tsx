import Container from "@/components/layout/Container";
import { PageHeader } from "@/components/ui/layout";
import HireForm from "@/components/booking/HireForm";

export const metadata = { title: "Hire a bus | Obere Transport" };

export default function HireBusPage() {
  return (
    <Container className="mb-24">
      <PageHeader
        title="Hire a bus"
        description="Group transport for events, excursions, church and corporate trips. Tell us about your trip and we'll send a quotation."
      />
      <HireForm kind="bus" />
    </Container>
  );
}

import Container from "@/components/layout/Container";
import { PageHeader } from "@/components/ui/layout";
import HireForm from "@/components/booking/HireForm";
import { pageMetadata } from "@/libs/seo";

export const metadata = pageMetadata({ title: "Hire a bus", path: "/hire/bus", description: "Hire a bus with a professional driver for events, church and school trips, staff transport and group travel across Nigeria. Request a quote online." });

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

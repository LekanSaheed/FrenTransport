import Container from "@/components/layout/Container";
import { PageHeader } from "@/components/ui/layout";
import HireForm from "@/components/booking/HireForm";
import { pageMetadata } from "@/libs/seo";

export const metadata = pageMetadata({ title: "Hire a car", path: "/hire/car", description: "Hire a car with a driver by the day in Nigeria. See the price instantly, book online and pay securely." });

export default function HireCarPage() {
  return (
    <Container className="mb-24">
      <PageHeader
        title="Hire a car"
        description="A private car with a professional driver — for airport runs, business days or intercity trips."
      />
      <HireForm kind="car" />
    </Container>
  );
}

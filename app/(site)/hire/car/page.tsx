import Container from "@/components/layout/Container";
import { PageHeader } from "@/components/ui/layout";
import HireForm from "@/components/booking/HireForm";

export const metadata = { title: "Hire a car | Obere Transport" };

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

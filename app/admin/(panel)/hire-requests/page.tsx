import { AdminPage } from "@/components/admin/ui";
import BookingTable from "@/components/admin/BookingTable";

export default function HireRequestsPage() {
  return (
    <AdminPage title="Hire requests" description="Car and bus hire. New requests wait for a quotation — open one to quote, update or reject it.">
      <BookingTable hireOnly initialStatus="pending_approval" />
    </AdminPage>
  );
}

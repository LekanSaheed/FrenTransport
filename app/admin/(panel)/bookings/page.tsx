import { AdminPage } from "@/components/admin/ui";
import BookingTable from "@/components/admin/BookingTable";

export default function AdminBookingsPage() {
  return (
    <AdminPage title="Bookings" description="Every seat booking and hire request. Open one to manage it.">
      <BookingTable />
    </AdminPage>
  );
}

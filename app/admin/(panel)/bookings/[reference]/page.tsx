"use client";
import { useParams } from "next/navigation";
import AdminBookingDetail from "@/components/admin/AdminBookingDetail";

export default function AdminBookingPage() {
  const { reference } = useParams<{ reference: string }>();
  return <AdminBookingDetail reference={decodeURIComponent(reference)} />;
}
